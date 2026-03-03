const { debugLog } = require("../utils/utils");
const anonymousUserStore = require("./anonymousUserStore");

/**
 * Initialise le système de chat avec Socket.IO
 * @param {object} io - Instance de Socket.IO
 * @param {object} socket - Socket individuel d'un client
 */
// function initializeChatHandlers(io, socket) {  // deplacer dans playlisthandler

//     // Réception d'un message de chat
//     socket.on('chat-message', ({ roomId, message }) => {
//         const currentUser = anonymousUserStore.getUserBySocketId(socket.id);

//         if (!currentUser) {
//             debugLog(`Utilisateur non trouvé pour le socket ${socket.id}`);
//             return;
//         }

//         if (!roomId || !message || !message.trim()) {
//             debugLog(`Message invalide reçu de ${currentUser.username}`);
//             return;
//         }

//         // Créer l'objet message avec toutes les informations
//         const chatMessage = {
//             userId: currentUser.userId,
//             username: currentUser.username,
//             message: message.trim(),
//             timestamp: new Date().toISOString(),
//             roomId: roomId
//         };

//         debugLog(`Message reçu de ${currentUser.username} dans la room ${roomId}: ${message}`);

//         // Envoyer le message à tous les utilisateurs de la room (y compris l'émetteur)
//         io.to(roomId).emit('chat-message', chatMessage);
//     });

//     debugLog(`Gestionnaire de chat initialisé pour le socket ${socket.id}`);
// }

module.exports = { initializeChatHandlers };
