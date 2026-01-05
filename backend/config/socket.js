const { Server } = require("socket.io");
const anonymousUserStore = require("../services/anonymousUserStore");
const roomModel = require("../model/roomModel");
const { debugLog } = require("../utils/utils");
const { initializeChatHandlers } = require("../services/chatService");
const { initializePlaylistHandlers } = require("./handlers/playlistHandlers");
const playlistService = require("../services/playlistService");
const { initializePermissionsHandlers } = require('./handlers/permissionsHandlers');
const userPermissionsStore = require('../services/userPermissionsStore');



/**
 * Initialise et configure Socket.IO avec le serveur HTTP
 * @param {object} server - Instance du serveur HTTP
 * @param {array} allowedOrigins - Liste des origines autorisées pour CORS
 * @returns {object} Instance de Socket.IO configurée
 */
function initializeSocket(server, allowedOrigins) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 5000,
    pingInterval: 10000,
  });

  const updateUsersThrottleMap = new Map();

  const sendThrottledUpdateUsers = (roomId) => {
    if (updateUsersThrottleMap.has(roomId)) {
      return;
    }
    updateUsersThrottleMap.set(roomId, true);
    const usersInRoom = anonymousUserStore.getUsersInRoom(roomId);
    io.to(roomId).emit("update-users", usersInRoom);
    setTimeout(() => {
      updateUsersThrottleMap.delete(roomId);
    }, 100);
  };

  setInterval(() => {
    anonymousUserStore.cleanupDisconnectedUsers(3600);
  }, 10000);

  io.on("connection", (socket) => {
    debugLog(`Nouveau client connecté: ${socket.id}`);

    const existingUserId = socket.handshake.auth.userId;
    const username = socket.handshake.auth.username || null;
    let user;

    if (existingUserId && anonymousUserStore.userExists(existingUserId)) {
      // L'utilisateur existe déjà dans le store (reconnexion rapide)
      anonymousUserStore.updateSocketId(existingUserId, socket.id);
      user = anonymousUserStore.getUserById(existingUserId);
      debugLog(`Utilisateur existant reconnecté: ${user.username}`);
    } else if (existingUserId) {
      // L'userId existe en localStorage mais pas dans le store (après redémarrage serveur)
      // On restaure l'utilisateur avec son ancien userId pour préserver son statut d'admin
      user = anonymousUserStore.restoreOrCreateUser(socket.id, existingUserId, username);
      debugLog(`Utilisateur restauré après redémarrage: ${user.username} (${existingUserId})`);
    } else {
      // Nouvel utilisateur sans userId existant
      user = anonymousUserStore.createUser(socket.id, username);
      debugLog(`Nouvel utilisateur créé: ${user.username}`);
    }

    socket.emit("user-registered", {
      userId: user.userId,
      username: user.username,
      connectedAt: user.connectedAt,
    });

    io.emit("users-count", {
      count: anonymousUserStore.getUserCount(),
    });

    // ✅ Initialiser les handlers UNE SEULE FOIS
    initializeChatHandlers(io, socket);
    initializePlaylistHandlers(io, socket);
    initializePermissionsHandlers(io, socket);

    socket.on("change-username", (newUsername, roomId) => {
      const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
      if (currentUser) {
        const oldUsername = currentUser.username;
        anonymousUserStore.updateUsername(currentUser.userId, newUsername);
        socket.emit("username-updated", { username: newUsername });
        if (socket.currentRoomId) {
          sendThrottledUpdateUsers(socket.currentRoomId);
        }
      }
    });

    socket.on("get-users", async (roomId) => {
      sendThrottledUpdateUsers(roomId);
    });

    socket.on("disconnect", async (reason) => {
      debugLog(`Client déconnecté: ${socket.id} - Raison: ${reason}`);
      const currentUser = anonymousUserStore.getUserBySocketId(socket.id);

      if (socket.currentRoomId) {
        await roomModel.decrementUserCount(socket.currentRoomId);
        debugLog(`Compteur décrémenté pour la room ${socket.currentRoomId}`);

        if (currentUser) {
          anonymousUserStore.setUserRoom(currentUser.userId, null);
        }
        anonymousUserStore.removeUserBySocketId(socket.id);
        sendThrottledUpdateUsers(socket.currentRoomId);

        const usersInRoom = anonymousUserStore.getUsersInRoom(socket.currentRoomId);
        if (usersInRoom.length === 0) {
          playlistService.deletePlaylist(socket.currentRoomId);
        }
      } else {
        anonymousUserStore.removeUserBySocketId(socket.id);
      }
    });

    // ✅ UN SEUL join-room
    socket.on("join-room", async (data) => {
      const roomId = typeof data === "string" ? data : data.roomId;
      const username = typeof data === "object" && data.username ? data.username : null;

      anonymousUserStore.updateActivity(socket.id);
      const currentUser = anonymousUserStore.getUserBySocketId(socket.id);

      if (username && currentUser) {
        anonymousUserStore.updateUsername(currentUser.userId, username);
        currentUser.username = username;
      }

      socket.join(roomId);
      socket.currentRoomId = roomId;
      anonymousUserStore.setUserRoom(currentUser.userId, roomId);

      let room;
      try {
        room = await roomModel.getRoomById(roomId, false);

        if (room) {
          console.log('Room trouvée, permissions par défaut:', room.defaultPermissions);

          if (room.creatorId === currentUser.userId) {
            const adminPermissions = {
              editPermissions: true,
              sendMessages: true,
              deleteMessages: true,
              changeVideo: true,
              interactionVideo: true
            };
            anonymousUserStore.updateUserPermissions(currentUser.userId, adminPermissions);
            debugLog(`✅ Admin ${currentUser.username} avec tous les droits`);
          } else {
            const savedPermissions = userPermissionsStore.getUserPermissions(roomId, currentUser.userId);

            if (savedPermissions) {
              anonymousUserStore.updateUserPermissions(currentUser.userId, savedPermissions);
              debugLog(`Permissions restaurées pour ${currentUser.username}`);
            } else {
              let defaultPerms = room.defaultPermissions;
              if (typeof defaultPerms === 'string') {
                defaultPerms = JSON.parse(defaultPerms);
              }
              anonymousUserStore.updateUserPermissions(currentUser.userId, defaultPerms);
              debugLog(`Permissions par défaut appliquées pour ${currentUser.username}`);
            }
          }
        }
      } catch (error) {
        debugLog(`Erreur lors de la récupération des permissions: ${error}`);
        const defaultPermissions = {
          editPermissions: false,
          sendMessages: true,
          deleteMessages: false,
          changeVideo: true,
          interactionVideo: true
        };
        anonymousUserStore.updateUserPermissions(currentUser.userId, defaultPermissions);
      }

      await roomModel.updateRoomActivity(roomId);
      await roomModel.incrementUserCount(roomId);

      debugLog(`${currentUser?.username || 'Client'} a rejoint la room ${roomId}`);

      // ✅ Envoyer avec isAdmin et permissionsSet
      socket.emit('room-joined', {
        roomId: roomId,
        timestamp: new Date(),
        user: {
          userId: currentUser?.userId,
          username: currentUser?.username,
          permissionsSet: currentUser?.permissionsSet,
          isAdmin: room?.creatorId === currentUser?.userId
        }
      });

      socket.to(roomId).emit('user-joined', {
        userId: currentUser?.userId,
        username: currentUser?.username,
        socketId: socket.id,
        timestamp: new Date()
      });

      const usersInRoom = anonymousUserStore.getUsersInRoom(roomId);
      socket.emit('update-users', usersInRoom);
    });

    // ✅ UN SEUL leave-room
    socket.on('leave-room', async (roomId) => {
      anonymousUserStore.updateActivity(socket.id);
      const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
      if (currentUser && roomId) {
        userPermissionsStore.removeUserPermissions(roomId, currentUser.userId);
      }
      socket.leave(roomId);
      await roomModel.decrementUserCount(roomId);

      if (socket.currentRoomId === roomId) {
        socket.currentRoomId = null;
      }

      debugLog(`${currentUser?.username || 'Client'} a quitté la room ${roomId}`);

      socket.emit('room-left', {
        roomId: roomId,
        timestamp: new Date()
      });

      socket.to(roomId).emit('user-left', {
        userId: currentUser?.userId,
        username: currentUser?.username,
        socketId: socket.id,
        timestamp: new Date()
      });

      sendThrottledUpdateUsers(roomId);
    });

    socket.on('error', (error) => {
      debugLog('Erreur Socket.IO:', error);
    });
  });

  return io;
}

module.exports = initializeSocket;
