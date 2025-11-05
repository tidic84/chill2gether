const { Server } = require("socket.io");
const anonymousUserStore = require("../services/anonymousUserStore");

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

    // Gestion des connexions
    io.on('connection', (socket) => {
        console.log(`🔌 Nouveau client connecté: ${socket.id}`);
        
        // Vérifier si l'utilisateur a déjà un userId (reconnexion)
        const existingUserId = socket.handshake.auth.userId;
        console.log("existingUserId", existingUserId);
        let user;

        if (existingUserId && anonymousUserStore.userExists(existingUserId)) {
            // Utilisateur existant qui se reconnecte
            anonymousUserStore.updateSocketId(existingUserId, socket.id);
            user = anonymousUserStore.getUserById(existingUserId);
            console.log(`🔄 Utilisateur existant reconnecté: ${user.username}`);
        } else {
            // Nouvel utilisateur
            const username = socket.handshake.auth.username || null;
            user = anonymousUserStore.createUser(socket.id, username);
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
                console.log(`✏️  Utilisateur ${currentUser.userId} a changé de nom: ${newUsername}`);
            }
        });

        // Événement de déconnexion
        socket.on('disconnect', (reason) => {
            console.log(`🔌 Client déconnecté: ${socket.id} - Raison: ${reason}`);
            
            // Supprimer l'utilisateur du store
            anonymousUserStore.removeUserBySocketId(socket.id);
            
            // Notifier les autres du nouveau nombre d'utilisateurs
            io.emit('users-count', {
                count: anonymousUserStore.getUserCount()
            });
        });

        // Exemple d'événement personnalisé
        socket.on('message', (data) => {
            anonymousUserStore.updateActivity(socket.id);
            
            const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
            console.log(`💬 Message reçu de ${currentUser?.username || 'inconnu'}:`, data);
            
            // Répondre au client
            socket.emit('message', { 
                text: 'Message reçu par le serveur',
                timestamp: new Date()
            });
            
            // Ou diffuser à tous les clients avec le nom de l'utilisateur
            // io.emit('message', {
            //     ...data,
            //     username: currentUser?.username,
            //     userId: currentUser?.userId,
            //     timestamp: new Date()
            // });
            
            // Ou diffuser à tous sauf l'émetteur
            // socket.broadcast.emit('message', data);
        });

        // Rejoindre une room spécifique
        socket.on('join-room', (roomId) => {
            anonymousUserStore.updateActivity(socket.id);
            const currentUser = anonymousUserStore.getUserBySocketId(socket.id);
            
            socket.join(roomId);
            console.log(`${currentUser?.username || 'Client'} a rejoint la room ${roomId}`);
            
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
            console.log(`${currentUser?.username || 'Client'} a quitté la room ${roomId}`);
            
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
            console.error('Erreur Socket.IO:', error);
        });
    });

    return io;
}

module.exports = initializeSocket;

