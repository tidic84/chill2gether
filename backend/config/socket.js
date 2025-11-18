const { Server } = require("socket.io");
const anonymousUserStore = require("../services/anonymousUserStore");
const { debugLog } = require("../utils/utils");

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

        // Événement pour changer de nom d'utilisateur
        socket.on('change-username', (newUsername) => {
            const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
            if (currentUser) {
                anonymousUserStore.updateUsername(currentUser.userId, newUsername);
                socket.emit('username-updated', { username: newUsername });
                console.log(`Utilisateur ${currentUser.userId} a changé de nom: ${newUsername}`);
            }
        });

        // Événement de déconnexion
        socket.on('disconnect', (reason) => {
            debugLog(`Client déconnecté: ${socket.id} - Raison: ${reason}`);
            
            // Supprimer l'utilisateur du store
            anonymousUserStore.removeUserBySocketId(socket.id);
        });

        // Rejoindre une room spécifique
        socket.on('join-room', (roomId) => {
            anonymousUserStore.updateActivity(socket.id);
            const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
            
            socket.join(roomId);
            debugLog(`${currentUser?.username || 'Client'} a rejoint la room ${roomId}`);
            
            // Confirmer la jointure au client
            socket.emit('room-joined', {
                roomId: roomId,
                timestamp: new Date()
            });
            
            // Notifier les autres membres de la room
            socket.to(roomId).emit('user-joined', {
                userId: currentUser?.userId,
                username: currentUser?.username,
                socketId: socket.id,
                timestamp: new Date()
            });
        });

        // Quitter une room
        socket.on('leave-room', (roomId) => {
            anonymousUserStore.updateActivity(socket.id);
            const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
            
            socket.leave(roomId);
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
        });

        // Gestion des erreurs
        socket.on('error', (error) => {
            debugLog('Erreur Socket.IO:', error);
        });
    });

    return io;
}

module.exports = initializeSocket;

