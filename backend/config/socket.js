const { Server } = require("socket.io");
const anonymousUserStore = require("../services/anonymousUserStore");
const roomModel = require("../model/roomModel");
const { debugLog } = require("../utils/utils");
const { initializeChatHandlers } = require("../services/chatService");
const { initializePlaylistHandlers } = require('./handlers/playlistHandlers');
const playlistService = require("../services/playlistService");

/**
 * Initialise et configure Socket.IO avec le serveur HTTP
 * @param {object} server - Instance du serveur HTTP
 * @param {array} allowedOrigins - Liste des origines autorisées pour CORS
 * @returns {object} Instance de Socket.IO configurée
 */
function initializeSocket(server, allowedOrigins) {
    const io = new Server(server, {
        cors: {
            origin: "*", // Permet toutes les origines, incluant file://
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Map pour stocker les timers de throttling par room
    const updateUsersThrottleMap = new Map();

    // Fonction pour envoyer les updates throttlés (max 1 par seconde par room)
    const sendThrottledUpdateUsers = (roomId) => {
        if (updateUsersThrottleMap.has(roomId)) {
            // Un update est déjà prévu, ne rien faire
            return;
        }

        // Marquer qu'un update est en cours
        updateUsersThrottleMap.set(roomId, true);

        // Envoyer l'update immédiatement
        const usersInRoom = anonymousUserStore.getUsersInRoom(roomId);
        io.to(roomId).emit('update-users', usersInRoom);

        // Empêcher les nouveaux updates pendant 1 seconde
        setTimeout(() => {
            updateUsersThrottleMap.delete(roomId);
        }, 100);
    };

    // Nettoyage périodique des utilisateurs déconnectés (toutes les 10 secondes)
    setInterval(() => {
        anonymousUserStore.cleanupDisconnectedUsers(3600); // Supprime après 1 heure de déconnexion
    }, 10000);

    // Gestion des connexions
    io.on('connection', (socket) => {
        debugLog(`Nouveau client connecté: ${socket.id}`);

        // ### Partie Vérifier si l'utilisateur a déjà un userId (reconnexion)
        const existingUserId = socket.handshake.auth.userId;
        debugLog("existingUserId", existingUserId);
        let user;
        if (existingUserId && anonymousUserStore.userExists(existingUserId)) {
            // Utilisateur existant qui se reconnecte (même après une actualisation de page)
            anonymousUserStore.updateSocketId(existingUserId, socket.id);
            user = anonymousUserStore.getUserById(existingUserId);
            debugLog(`Utilisateur existant reconnecté: ${user.username} (${existingUserId})`);
        } else {
            // Nouvel utilisateur
            const username = socket.handshake.auth.username || null;
            user = anonymousUserStore.createUser(socket.id, username);
            debugLog(`Nouvel utilisateur créé: ${user.username} (${user.userId})`);
        }

        // Envoyer l'userId au client pour qu'il le stocke
        socket.emit('user-registered', {
            userId: user.userId,
            username: user.username,
            connectedAt: user.connectedAt
        });

        // Envoyer le nombre d'utilisateurs connectés
        io.emit('users-count', {
            count: anonymousUserStore.getUserCount()
        });

        // Initialiser les gestionnaires de chat pour ce socket
        initializeChatHandlers(io, socket);

        // Initialiser les gestionnaires de playlist pour ce socket
        initializePlaylistHandlers(io, socket);

        // Événement pour changer de nom d'utilisateur
        socket.on('change-username', (newUsername, roomId) => {
            const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
            if (currentUser) {
                anonymousUserStore.updateUsername(currentUser.userId, newUsername);
                socket.emit('username-updated', { username: newUsername });
                console.log(`Utilisateur ${currentUser.userId} a changé de nom: ${newUsername}`);
            }
        });

        socket.on('get-users', async (roomId) => {
            sendThrottledUpdateUsers(roomId);
        });

        // Événement de déconnexion
        socket.on('disconnect', async (reason) => {
            debugLog(`Client déconnecté: ${socket.id} - Raison: ${reason}`);

            // Si l'utilisateur était dans une room, décrémenter le compteur
            if (socket.currentRoomId) {
                await roomModel.decrementUserCount(socket.currentRoomId);
                debugLog(`Compteur décrémenté pour la room ${socket.currentRoomId}`);

                // Supprimer l'utilisateur du store avant d'envoyer la mise à jour
                anonymousUserStore.removeUserBySocketId(socket.id);

                // Envoyer la liste mise à jour des utilisateurs à tous les clients de la room
                sendThrottledUpdateUsers(socket.currentRoomId);
            } else {
                // Supprimer l'utilisateur du store
                anonymousUserStore.removeUserBySocketId(socket.id);
            }

            // Si dernier utilisateur de la room, supprimer la playlist
            if (socket.currentRoomId) {
                const usersInRoom = anonymousUserStore.getUsersInRoom(socket.currentRoomId);
                if (usersInRoom.length === 0) {
                    playlistService.deletePlaylist(socket.currentRoomId);
                }
            }
        });

        // Rejoindre une room spécifique
        socket.on('join-room', async (roomId) => {
            anonymousUserStore.updateActivity(socket.id);
            const currentUser = anonymousUserStore.getUserBySocketId(socket.id);

            socket.join(roomId);

            // Stocker la room actuelle dans le socket pour la gérer lors de la déconnexion
            socket.currentRoomId = roomId;

            anonymousUserStore.setUserRoom(currentUser.userId, roomId);

            // Mettre à jour l'activité et le compteur d'utilisateurs de la room
            await roomModel.incrementUserCount(roomId);
            await roomModel.updateRoomActivity(roomId);

            debugLog(`${currentUser?.username || 'Client'} a rejoint la room ${roomId}`);

            // Confirmer la jointure au client avec les infos utilisateur
            socket.emit('room-joined', {
                roomId: roomId,
                timestamp: new Date(),
                user: {
                    userId: currentUser?.userId,
                    username: currentUser?.username
                }
            });

            // Notifier les autres membres de la room
            socket.to(roomId).emit('user-joined', {
                userId: currentUser?.userId,
                username: currentUser?.username,
                socketId: socket.id,
                timestamp: new Date()
            });

            // Envoyer la liste mise à jour des utilisateurs à tous les clients de la room
            sendThrottledUpdateUsers(roomId);
        });

        // Quitter une room
        socket.on('leave-room', async (roomId) => {
            anonymousUserStore.updateActivity(socket.id);
            const currentUser = anonymousUserStore.getUserBySocketId(socket.id);

            socket.leave(roomId);

            // Décrémenter le compteur d'utilisateurs de la room
            await roomModel.decrementUserCount(roomId);

            // Retirer la room du socket
            if (socket.currentRoomId === roomId) {
                socket.currentRoomId = null;
            }

            debugLog(`${currentUser?.username || 'Client'} a quitté la room ${roomId}`);

            // Confirmer la sortie au client
            socket.emit('room-left', {
                roomId: roomId,
                timestamp: new Date()
            });

            // Notifier les autres membres de la room
            socket.to(roomId).emit('user-left', {
                userId: currentUser?.userId,
                username: currentUser?.username,
                socketId: socket.id,
                timestamp: new Date()
            });

            // Envoyer la liste mise à jour des utilisateurs à tous les clients de la room
            sendThrottledUpdateUsers(roomId);
        });

        // Gestion des erreurs
        socket.on('error', (error) => {
            debugLog('Erreur Socket.IO:', error);
        });
    });

    return io;
}

module.exports = initializeSocket;

