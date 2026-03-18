const { debugLog } = require('../../utils/utils');

/**
 * Store en mémoire : Map<roomId, socketId>
 * Enregistre quel socket partage actuellement son écran dans chaque room.
 * Une seule personne peut partager par room.
 */
const screenShareStore = new Map();

/**
 * Initialise les handlers Socket.IO pour le partage d'écran (signaling WebRTC).
 * Le serveur joue uniquement le rôle de relais de signaling — il ne traite pas les streams.
 *
 * @param {object} io - Instance Socket.IO pour les broadcasts
 * @param {object} socket - Socket individuel du client
 */
function initializeScreenShareHandlers(io, socket) {

    /**
     * SCREENSHARE:START
     * Enregistre l'émetteur comme partageant son écran et notifie la room.
     */
    socket.on('screenshare:start', ({ roomId } = {}) => {
        try {
            if (!roomId) {
                socket.emit('screenshare:error', { error: 'roomId requis' });
                return;
            }

            screenShareStore.set(roomId, socket.id);

            socket.to(roomId).emit('screenshare:started', { streamerId: socket.id });

            debugLog(`screenshare:start dans room ${roomId} par socket ${socket.id}`);
        } catch (error) {
            debugLog(`Erreur screenshare:start: ${error}`);
            socket.emit('screenshare:error', { error: 'Erreur lors du démarrage du partage d\'écran.' });
        }
    });

    /**
     * SCREENSHARE:STOP
     * Supprime le partage d'écran et notifie la room.
     */
    socket.on('screenshare:stop', ({ roomId } = {}) => {
        try {
            if (!roomId) {
                socket.emit('screenshare:error', { error: 'roomId requis' });
                return;
            }

            screenShareStore.delete(roomId);

            socket.to(roomId).emit('screenshare:stopped');

            debugLog(`screenshare:stop dans room ${roomId} par socket ${socket.id}`);
        } catch (error) {
            debugLog(`Erreur screenshare:stop: ${error}`);
            socket.emit('screenshare:error', { error: 'Erreur lors de l\'arrêt du partage d\'écran.' });
        }
    });

    /**
     * SCREENSHARE:OFFER
     * Relaye une offre SDP WebRTC d'un client vers un destinataire ciblé.
     */
    socket.on('screenshare:offer', ({ roomId, targetSocketId, offer } = {}) => {
        try {
            if (!targetSocketId || !offer) {
                socket.emit('screenshare:error', { error: 'targetSocketId et offer requis' });
                return;
            }

            io.to(targetSocketId).emit('screenshare:offer', {
                fromSocketId: socket.id,
                offer
            });

            debugLog(`screenshare:offer relayé de ${socket.id} vers ${targetSocketId}`);
        } catch (error) {
            debugLog(`Erreur screenshare:offer: ${error}`);
            socket.emit('screenshare:error', { error: 'Erreur lors du relais de l\'offre WebRTC.' });
        }
    });

    /**
     * SCREENSHARE:ANSWER
     * Relaye une réponse SDP WebRTC vers l'émetteur de l'offre.
     */
    socket.on('screenshare:answer', ({ roomId, targetSocketId, answer } = {}) => {
        try {
            if (!targetSocketId || !answer) {
                socket.emit('screenshare:error', { error: 'targetSocketId et answer requis' });
                return;
            }

            io.to(targetSocketId).emit('screenshare:answer', {
                fromSocketId: socket.id,
                answer
            });

            debugLog(`screenshare:answer relayé de ${socket.id} vers ${targetSocketId}`);
        } catch (error) {
            debugLog(`Erreur screenshare:answer: ${error}`);
            socket.emit('screenshare:error', { error: 'Erreur lors du relais de la réponse WebRTC.' });
        }
    });

    /**
     * SCREENSHARE:ICE-CANDIDATE
     * Relaye un candidat ICE WebRTC vers le destinataire ciblé.
     */
    socket.on('screenshare:ice-candidate', ({ roomId, targetSocketId, candidate } = {}) => {
        try {
            if (!targetSocketId || candidate === undefined) {
                socket.emit('screenshare:error', { error: 'targetSocketId et candidate requis' });
                return;
            }

            io.to(targetSocketId).emit('screenshare:ice-candidate', {
                fromSocketId: socket.id,
                candidate
            });

            debugLog(`screenshare:ice-candidate relayé de ${socket.id} vers ${targetSocketId}`);
        } catch (error) {
            debugLog(`Erreur screenshare:ice-candidate: ${error}`);
            socket.emit('screenshare:error', { error: 'Erreur lors du relais du candidat ICE.' });
        }
    });

    /**
     * Nettoyage à la déconnexion :
     * Si ce socket partageait son écran dans une room, notifier la room.
     */
    socket.on('disconnect', () => {
        for (const [roomId, streamerId] of screenShareStore.entries()) {
            if (streamerId === socket.id) {
                screenShareStore.delete(roomId);
                socket.to(roomId).emit('screenshare:stopped');
                debugLog(`screenshare stoppé automatiquement à la déconnexion de ${socket.id} (room ${roomId})`);
                break;
            }
        }
    });
}

module.exports = { initializeScreenShareHandlers, screenShareStore };
