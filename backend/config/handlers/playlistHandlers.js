const playlistService = require('../../services/playlistService');
const anonymousUserStore = require('../../services/anonymousUserStore');
const roomModel = require('../../model/roomModel');
const { debugLog } = require('../../utils/utils');

/**
 * Initialise tous les handlers WebSocket pour la gestion des playlists
 * @param {object} io - Instance Socket.IO pour les broadcasts
 * @param {object} socket - Socket individuel du client
 */
function initializePlaylistHandlers(io, socket) {

    /**
     * GET-PLAYLIST
     * Envoie l'état complet de la playlist à un client (requête individuelle)
     */
    socket.on('get-playlist', (roomId) => {
        try {
            if (!roomId) {
                socket.emit('playlist-error', { error: 'Room ID is required to get playlist.' });
                return;
            }

            let playlist = playlistService.getPlaylistState(roomId);
            socket.emit('playlist-state', playlist);
        } catch (error) {
            debugLog(`Erreur lors de la récupération de la playlist pour la room ${roomId}: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while retrieving the playlist.' });
        }
    });

    /**
     * GET-HISTORY
     * Envoie l'historique des vidéos jouées dans une room
     * L'historique contient toutes les vidéos qui ont été lues, avec leur timestamp de lecture
     */
    socket.on('get-history', (roomId) => {
        try {
            if (!roomId) {
                socket.emit('playlist-error', { error: 'Room ID is required to get history.' });
                return;
            }

            const history = playlistService.getHistory(roomId);
            socket.emit('history-state', { history });
        } catch (error) {
            debugLog(`Erreur lors de la récupération de l'historique pour la room ${roomId}: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while retrieving the history.' });
        }
    });

    /**
 * REQUEST-SYNC
 * Demande le temps actuel de lecture de la vidéo en cours
 * Utilisé quand un utilisateur rejoint la room pour se synchroniser en temps réel
 * Émet 'sync-response' avec le temps de lecture actuel
 */
    socket.on('request-sync', (roomId) => {
        try {
            if (!roomId) {
                socket.emit('playlist-error', { error: 'Room ID is required to request sync.' });
                return;
            }

            const syncData = playlistService.getCurrentPlaybackTime(roomId);
            socket.emit('sync-response', syncData);

            debugLog(`Sync demandé pour la room ${roomId}: ${syncData.currentTime}s (playing: ${syncData.isPlaying})`);
        } catch (error) {
            debugLog(`Erreur lors de la demande de sync pour la room ${roomId}: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while requesting sync.' });
        }
    });

    /**
     * ADD-TO-PLAYLIST
     * Vérifier la permission changeVideo
     */
    socket.on('add-to-playlist', (data) => {
        try {
            const { roomId, video } = data;
            const user = anonymousUserStore.getUserBySocketId(socket.id);

            if (!roomId || !video) {
                socket.emit('playlist-error', { error: 'Room ID and video data are required to add a video.' });
                return;
            }

            // Vérifier la permission changeVideo
            if (!user.permissionsSet.changeVideo) {
                socket.emit('playlist-error', { error: 'Permission refusée: vous n\'avez pas le droit de changer la vidéo' });
                return;
            }

            playlistService.addVideo(roomId, video, user.userId, user.username);
            playlistService.broadcastPlaylistUpdate(io, roomId);
            playlistService.broadcastHistoryUpdate(io, roomId);
        } catch (error) {
            debugLog(`Erreur lors de l'ajout de la vidéo: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while adding the video to the playlist.' });
        }
    });

    /**
     * REMOVE-FROM-PLAYLIST
     * Vérifier la permission changeVideo
     */
    socket.on('remove-from-playlist', (data) => {
        try {
            const { roomId, videoId } = data;
            const user = anonymousUserStore.getUserBySocketId(socket.id);

            if (roomId === undefined || videoId === undefined) {
                socket.emit('playlist-error', { error: 'Room ID and video ID are required to remove a video.' });
                return;
            }

            // Vérifier la permission changeVideo
            if (!user.permissionsSet.changeVideo) {
                socket.emit('playlist-error', { error: 'Permission refusée: vous n\'avez pas le droit de changer la vidéo' });
                return;
            }

            playlistService.removeVideo(roomId, videoId, user.userId);
            playlistService.broadcastPlaylistUpdate(io, roomId);
        } catch (error) {
            debugLog(`Erreur lors de la suppression: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while removing the video from the playlist.' });
        }
    });

    /**
     * REORDER-PLAYLIST
     * Réorganise l'ordre des vidéos (drag & drop)
     */
    socket.on('reorder-playlist', (data) => {
        try {
            const { roomId, fromIndex, toIndex } = data;

            if (roomId === undefined || fromIndex === undefined || toIndex === undefined) {
                socket.emit('playlist-error', { error: 'roomId, fromIndex et toIndex requis' });
                return;
            }

            if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
                socket.emit('playlist-error', { error: 'fromIndex et toIndex doivent être des nombres' });
                return;
            }

            playlistService.reorderPlaylist(roomId, fromIndex, toIndex);

            playlistService.broadcastPlaylistUpdate(io, roomId);
        } catch (error) {
            debugLog(`Erreur lors du réordonnancement de la playlist pour la room ${roomId}: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while reordering the playlist.' });
        }
    });

    /**
     * PLAY-VIDEO
     * Vérifier la permission changeVideo
     */
    socket.on('play-video', (data) => {
        try {
            const roomId = data.roomId;
            const videoIndex = data.videoIndex;
            const user = anonymousUserStore.getUserBySocketId(socket.id);

            if (roomId === undefined || videoIndex === undefined) {
                socket.emit('playlist-error', { error: 'roomId et videoIndex requis' });
                return;
            }

            // Vérifier la permission changeVideo
            if (!user.permissionsSet.changeVideo) {
                socket.emit('playlist-error', { error: 'Permission refusée: vous n\'avez pas le droit de changer la vidéo' });
                return;
            }

            if (typeof videoIndex !== 'number') {
                socket.emit('playlist-error', { error: 'videoIndex doit être un nombre' });
                return;
            }

            const videoData = playlistService.playVideo(roomId, videoIndex, io);
            io.to(roomId).emit('video-changed', videoData);
            playlistService.broadcastHistoryUpdate(io, roomId);
        } catch (error) {
            debugLog(`Erreur lors de la lecture: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while playing the video from the playlist.' });
        }
    });

    /**
     * VIDEO-ENDED
     * Gère la fin d'une vidéo et passe automatiquement à la suivante
     * Ajoute automatiquement la vidéo suivante à l'historique
     * Émet 'video-changed' et 'history-updated' si vidéo suivante, 'playlist-updated' si fin de playlist
     */
    socket.on('video-ended', (data) => {
        try {
            const roomId = data.roomId;

            if (roomId === undefined) {
                socket.emit('playlist-error', { error: 'Room ID is required when a video ends.' });
                return;
            }

            // playNextVideo ajoute automatiquement à l'historique et broadcast
            const result = playlistService.playNextVideo(roomId, io);

            if (result.endOfPlaylist) {
                // Fin de playlist : arrêt de la lecture
                io.to(roomId).emit('playlist-updated', result.playlist);
                debugLog(`Fin de playlist pour la room ${roomId}`);
            } else {
                // Autoplay : passage à la vidéo suivante
                io.to(roomId).emit('video-changed', {
                    videoIndex: result.videoIndex,
                    video: result.video,
                    isPlaying: result.isPlaying,
                    startTime: result.startTime
                });
                debugLog(`Autoplay vidéo ${result.videoIndex} dans ${roomId}`);
            }

        } catch (error) {
            debugLog(`Erreur lors du traitement de la fin de la vidéo dans la playlist pour la room ${roomId}: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while handling the end of the video.' });
        }
    });

    /**
     * VIDEO-PLAY
     * Vérifier la permission interactionVideo
     */
    socket.on('video-play', (data) => {
        try {
            const { roomId, time } = data;
            const user = anonymousUserStore.getUserBySocketId(socket.id);

            if (!roomId) {
                socket.emit('playlist-error', { error: 'Room ID requis' });
                return;
            }

            // Vérifier la permission interactionVideo
            if (!user?.permissionsSet?.interactionVideo) {
                socket.emit('permissions-error', {
                    error: 'Permission refusée: vous n\'avez pas le droit d\'interagir avec la vidéo'
                });
                debugLog(`${user?.username} a tenté de play sans permission`);
                return;
            }

            socket.to(roomId).emit('video-play-sync', {
                time: time || 0,
                username: user?.username
            });

            debugLog(`Play synchronisé dans ${roomId} à ${time}s par ${user?.username}`);
        } catch (error) {
            debugLog(`Erreur lors de la synchronisation play: ${error}`);
        }
    });

    /**
     * VIDEO-PAUSE
     * Vérifier la permission interactionVideo
     */
    socket.on('video-pause', (data) => {
        try {
            const { roomId, time } = data;
            const user = anonymousUserStore.getUserBySocketId(socket.id);

            if (!roomId) {
                socket.emit('playlist-error', { error: 'Room ID requis' });
                return;
            }

            // Vérifier la permission interactionVideo
            if (!user?.permissionsSet?.interactionVideo) {
                socket.emit('permissions-error', {
                    error: 'Permission refusée: vous n\'avez pas le droit d\'interagir avec la vidéo'
                });
                debugLog(`${user?.username} a tenté de pause sans permission`);
                return;
            }

            socket.to(roomId).emit('video-pause-sync', {
                time: time || 0,
                username: user?.username
            });

            debugLog(`Pause synchronisé dans ${roomId} à ${time}s par ${user?.username}`);
        } catch (error) {
            debugLog(`Erreur lors de la synchronisation pause: ${error}`);
        }
    });

    /**
     * VIDEO-SEEK
     * Vérifier la permission interactionVideo
     */
    socket.on('video-seek', (data) => {
        try {
            const { roomId, time } = data;
            const user = anonymousUserStore.getUserBySocketId(socket.id);

            if (!roomId || time === undefined) {
                socket.emit('playlist-error', { error: 'Room ID et time requis' });
                return;
            }

            // Vérifier la permission interactionVideo
            if (!user?.permissionsSet?.interactionVideo) {
                socket.emit('permissions-error', {
                    error: 'Permission refusée: vous n\'avez pas le droit d\'interagir avec la vidéo'
                });
                debugLog(`${user?.username} a tenté de seek sans permission`);
                return;
            }

            socket.to(roomId).emit('video-seek-sync', {
                time,
                username: user?.username
            });

            debugLog(`Seek synchronisé dans ${roomId} à ${time}s par ${user?.username}`);
        } catch (error) {
            debugLog(`Erreur lors de la synchronisation seek: ${error}`);
        }
    });

    /**
     * CHAT-MESSAGE
     * Vérifier la permission sendMessages
     */
    socket.on('chat-message', ({ roomId, message }) => {
        const currentUser = anonymousUserStore.getUserBySocketId(socket.id);

        if (!currentUser) {
            debugLog(`Utilisateur non trouvé pour le socket ${socket.id}`);
            return;
        }

        // Vérifier la permission sendMessages
        if (!currentUser.permissionsSet.sendMessages) {
            socket.emit('playlist-error', { error: 'Permission refusée: vous n\'avez pas le droit d\'envoyer des messages' });
            return;
        }

        if (!roomId || !message || !message.trim()) {
            debugLog(`Message invalide reçu de ${currentUser.username}`);
            return;
        }

        const chatMessage = {
            userId: currentUser.userId,
            username: currentUser.username,
            message: message.trim(),
            timestamp: new Date().toISOString(),
            roomId: roomId
        };

        debugLog(`Message reçu de ${currentUser.username} dans la room ${roomId}: ${message}`);
        io.to(roomId).emit("chat-message", chatMessage);
    });
}

module.exports = { initializePlaylistHandlers };