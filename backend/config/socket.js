const { Server } = require("socket.io");
const anonymousUserStore = require("../services/anonymousUserStore");
const roomModel = require("../model/roomModel");
//const { initializeChatHandlers } = require("../services/chatService");
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
    const existingUserId = socket.handshake.auth.userId;
    const username = socket.handshake.auth.username || null;
    let user;

    if (existingUserId && anonymousUserStore.userExists(existingUserId)) {
      anonymousUserStore.updateSocketId(existingUserId, socket.id);
      user = anonymousUserStore.getUserById(existingUserId);
    } else if (existingUserId) {
      user = anonymousUserStore.restoreOrCreateUser(socket.id, existingUserId, username);
    } else {
      user = anonymousUserStore.createUser(socket.id, username);
    }

    socket.emit("user-registered", {
      userId: user.userId,
      username: user.username,
      connectedAt: user.connectedAt,
    });

    io.emit("users-count", {
      count: anonymousUserStore.getUserCount(),
    });

    //initializeChatHandlers(io, socket);
    initializePlaylistHandlers(io, socket);
    initializePermissionsHandlers(io, socket);

    socket.on("change-username", (newUsername, roomId) => {
      const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
      if (currentUser) {
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
      const currentUser = anonymousUserStore.getUserBySocketId(socket.id);

      if (socket.currentRoomId) {
        await roomModel.decrementUserCount(socket.currentRoomId);

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
          if (room.creatorId === currentUser.userId) {
            const adminPermissions = {
              editPermissions: true,
              sendMessages: true,
              deleteMessages: true,
              changeVideo: true,
              interactionVideo: true
            };
            anonymousUserStore.updateUserPermissions(currentUser.userId, adminPermissions);
          } else {
            const savedPermissions = userPermissionsStore.getUserPermissions(roomId, currentUser.userId);

            if (savedPermissions) {
              anonymousUserStore.updateUserPermissions(currentUser.userId, savedPermissions);
            } else {
              let defaultPerms = room.defaultPermissions;
              if (typeof defaultPerms === 'string') {
                defaultPerms = JSON.parse(defaultPerms);
              }
              anonymousUserStore.updateUserPermissions(currentUser.userId, defaultPerms);
            }
          }
        }
      } catch (error) {
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

      sendThrottledUpdateUsers(roomId);
    });

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
      console.error('Erreur Socket.IO:', error);
    });
  });

  return io;
}

module.exports = initializeSocket;
