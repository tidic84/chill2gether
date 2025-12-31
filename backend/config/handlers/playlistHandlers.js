const playlistService = require('../services/playlistService');
const anonymousUserStore = require('../services/anonymousUserStore');
const roomModel = require('../model/roomModel');
const { debugLog } = require('../utils/utils');

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
     * ADD-TO-PLAYLIST
     * Ajoute une vidéo à la playlist et broadcast à tous les utilisateurs de la room
     */
    socket.on('add-to-playlist', (data) => {
        try {
            const { roomId, video } = data;

            if (!roomId || !video) {
                socket.emit('playlist-error', { error: 'Room ID and video data are required to add a video.' });
                return;
            }

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) {
                socket.emit('playlist-error', { error: 'Utilisateur non trouvé' });
                return;
            }

            playlistService.addVideo(roomId, video, user.userId, user.username);

            playlistService.broadcastPlaylistUpdate(io, roomId);
        } catch (error) {
            debugLog(`Erreur lors de l'ajout de la vidéo à la playlist pour la room ${roomId}: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while adding the video to the playlist.' });
        }
    });

    /**
     * REMOVE-FROM-PLAYLIST
     * Supprime une vidéo de la playlist (permissions à implémenter)
     */
    socket.on('remove-from-playlist', (data) => {
        try {
            const { roomId, videoId } = data;

            if (roomId === undefined || videoId === undefined) {
                socket.emit('playlist-error', { error: 'Room ID and video ID are required to remove a video.' });
                return;
            }

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) {
                socket.emit('playlist-error', { error: 'Utilisateur non trouvé' });
                return;
            }

            // TODO: Implémenter les permissions (owner de la room ou créateur de la vidéo)
            //const room = await roomModel.getRoomById(roomId);
            //const isRoomOwner = room && room.creatorId === user.userId;

            playlistService.removeVideo(roomId, videoId, user.userId);

            playlistService.broadcastPlaylistUpdate(io, roomId);
        } catch (error) {
            debugLog(`Erreur lors de la suppression de la vidéo de la playlist pour la room ${roomId}: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while removing the video from the playlist.' });
        }
    })

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
    })

    /**
     * PLAY-VIDEO
     * Change manuellement la vidéo en cours de lecture
     * Émet 'video-changed' (pas 'playlist-updated')
     */
    socket.on('play-video', (data) => {
        try {
            const roomId = data.roomId;
            const videoIndex = data.videoIndex;

            if (roomId === undefined || videoIndex === undefined) {
                socket.emit('playlist-error', { error: 'roomId et videoIndex requis' });
                return;
            }

            if (typeof videoIndex !== 'number') {
                socket.emit('playlist-error', { error: 'videoIndex doit être un nombre' });
                return;
            }

            const videoData = playlistService.playVideo(roomId, videoIndex);

            io.to(roomId).emit('video-changed', videoData);
        } catch (error) {
            debugLog(`Erreur lors de la lecture de la vidéo dans la playlist pour la room ${roomId}: ${error}`);
            socket.emit('playlist-error', { error: 'An error occurred while playing the video from the playlist.' });
        }
    })

    /**
     * VIDEO-ENDED
     * Gère la fin d'une vidéo et passe automatiquement à la suivante
     * Émet 'video-changed' si vidéo suivante, 'playlist-updated' si fin de playlist
     */
    socket.on('video-ended', (data) => {
        try {
            const roomId = data.roomId;

            if (roomId === undefined) {
                socket.emit('playlist-error', { error: 'Room ID is required when a video ends.' });
                return;
            }

            const result = playlistService.playNextVideo(roomId);

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
    })

}

module.exports = { initializePlaylistHandlers };