const { debugLog } = require("../utils/utils");
const { v4: uuidv4 } = require('uuid');

/**
 * Service de gestion des playlists en mémoire (une playlist par room)
 * 
 * Structure d'une playlist :
 * {
 *   videos: [
 *     { id, url, title, thumbnail, addedBy: { userId, username }, addedAt }
 *   ],
 *   currentIndex: 0,
 *   isPlaying: false,
 *   currentVideoStartTime: null,
 *   isLooping: false
 * }
 */
class PlaylistService {

    constructor() {
        // Map<roomId, playlist>
        this.playlists = new Map();
    }

    /**
     * Récupère la playlist d'une room
     * @returns {object|null} Playlist ou null si inexistante
     */
    getPlaylistByRoomId(roomId) {
        if (this.playlists.has(roomId)) {
            return this.playlists.get(roomId);
        }
        return null;
    }

    /**
     * Crée une playlist vide si elle n'existe pas
     * @returns {object} Playlist (nouvelle ou existante)
     */
    createPlaylistIfNotExists(roomId) {
        if (!this.playlists.has(roomId)) {
            const newPlaylist = {
                videos: [],
                currentIndex: 0,
                isPlaying: false,
                currentVideoStartTime: null,
                isLooping: false
            }
            this.playlists.set(roomId, newPlaylist);
            debugLog(`Playlist créée pour la room ${roomId}`);
        }
        return this.playlists.get(roomId);
    }

    /**
     * Génère un ID unique pour une vidéo
     */
    generateVideoId() {
        return uuidv4();
    }

    /**
     * Valide les données d'une vidéo (url et title obligatoires, format YouTube)
     * @returns {boolean}
     */
    validateVideoData(video) {
        if (!video) return false;

        if (!video.url || !video.title) return false;

        if (typeof video.url !== 'string' || video.url.trim() === '') return false;
        if (typeof video.title !== 'string' || video.title.trim() === '') return false;

        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!youtubeRegex.test(video.url)) return false;

        return true;
    }

    /**
     * Broadcast la playlist mise à jour à tous les utilisateurs de la room
     * Émet l'événement 'playlist-updated'
     */
    broadcastPlaylistUpdate(io, roomId) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) return;

        const data = {
            videos: playlist.videos,
            currentIndex: playlist.currentIndex,
            isPlaying: playlist.isPlaying
        };
        io.to(roomId).emit('playlist-updated', data);
        debugLog(`Mise à jour de la playlist diffusée à la room ${roomId}`);
    }

    /**
     * Calcule l'index de la vidéo suivante
     * @returns {number} Index suivant, 0 si loop activé, -1 si fin de playlist
     */
    getNextVideoIndex(roomId) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) return null;

        const currentIndex = playlist.currentIndex;
        const videosLength = playlist.videos.length;

        if (currentIndex + 1 < videosLength) {
            return currentIndex + 1;
        }

        if (playlist.isLooping) {
            return 0;
        }

        return -1;
    }

    /**
     * Supprime une playlist de la mémoire (appelé quand la room est vide)
     */
    deletePlaylist(roomId) {
        if (this.playlists.has(roomId)) {
            this.playlists.delete(roomId);
            debugLog(`Playlist de la room ${roomId} supprimée`);
            return true;
        }
        return false;
    }

    /**
     * Retourne l'état complet de la playlist (format propre pour le client)
     * Crée la playlist si elle n'existe pas
     */
    getPlaylistState(roomId) {
        const playlist = this.createPlaylistIfNotExists(roomId);
        return {
            videos: playlist.videos,
            currentIndex: playlist.currentIndex,
            isPlaying: playlist.isPlaying,
            currentVideoStartTime: playlist.currentVideoStartTime,
            isLooping: playlist.isLooping
        };
    }

    /**
     * Ajoute une vidéo à la playlist
     * Si c'est la première vidéo, démarre automatiquement la lecture
     * @throws {Error} Si données invalides ou playlist pleine (max 50)
     */
    addVideo(roomId, video, userId, username) {
        if (!this.validateVideoData(video)) {
            throw new Error('Données vidéo invalides');
        }

        const playlist = this.createPlaylistIfNotExists(roomId);

        if (playlist.videos.length >= 50) {
            throw new Error('Playlist pleine (maximum 50 vidéos)');
        }

        const newVideo = {
            id: this.generateVideoId(),
            url: video.url,
            title: video.title,
            thumbnail: video.thumbnail || null,
            addedBy: { userId, username },
            addedAt: new Date().toISOString()
        };

        playlist.videos.push(newVideo);

        // Si première vidéo, démarrer la lecture
        if (playlist.videos.length === 1) {
            playlist.currentIndex = 0;
            playlist.isPlaying = true;
            playlist.currentVideoStartTime = new Date().toISOString();
        }

        debugLog(`Vidéo ajoutée à la playlist de la room ${roomId} par l'utilisateur ${userId}`);
        return this.getPlaylistState(roomId);
    }

    /**
     * Supprime une vidéo de la playlist
     * Ajuste automatiquement le currentIndex selon la position
     * @param {boolean} isRoomOwner - Pour vérification des permissions (TODO)
     * @throws {Error} Si vidéo non trouvée ou permissions insuffisantes
     */
    removeVideo(roomId, videoId, userId) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) {
            throw new Error('Playlist non trouvée');
        }

        const videoIndex = playlist.videos.findIndex(v => v.id === videoId);
        if (videoIndex === -1) {
            throw new Error('Vidéo non trouvée dans la playlist');
        }

        const video = playlist.videos[videoIndex];
        // TODO: Implémenter vérification des permissions
        // if (video.addedBy.userId !== userId && !isRoomOwner) {
        //     throw new Error('Permission refusée');
        // }

        // Ajuster currentIndex selon la position de la vidéo supprimée
        if (videoIndex < playlist.currentIndex) {
            playlist.currentIndex -= 1;
        } else if (videoIndex === playlist.currentIndex) {
            if (playlist.currentIndex >= playlist.videos.length - 1) {
                playlist.currentIndex = 0;
                playlist.isPlaying = false;
            }
        }
        
        playlist.videos.splice(videoIndex, 1);

        // Réinitialiser si playlist vide
        if (playlist.videos.length === 0) {
            playlist.currentIndex = 0;
            playlist.isPlaying = false;
            playlist.currentVideoStartTime = null;
        }

        debugLog(`Vidéo supprimée de la playlist de la room ${roomId} par l'utilisateur ${userId}`);
        return this.getPlaylistState(roomId);
    }

    /**
     * Réorganise la playlist (drag & drop)
     * Ajuste automatiquement le currentIndex pour garder la bonne vidéo en cours
     * @throws {Error} Si index invalides
     */
    reorderPlaylist(roomId, fromIndex, toIndex) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) {
            throw new Error('Playlist non trouvée');
        }

        if (fromIndex < 0 || fromIndex >= playlist.videos.length ||
            toIndex < 0 || toIndex >= playlist.videos.length) {
            throw new Error('Indices de réorganisation invalides');
        }

        // Déplacer la vidéo
        const [movedVideo] = playlist.videos.splice(fromIndex, 1);
        playlist.videos.splice(toIndex, 0, movedVideo);

        // Ajuster currentIndex selon le déplacement
        const oldCurrentIndex = playlist.currentIndex;
        if (fromIndex === oldCurrentIndex) {
            playlist.currentIndex = toIndex;
        } else if (fromIndex < oldCurrentIndex && toIndex >= oldCurrentIndex) {
            playlist.currentIndex--;
        } else if (fromIndex > oldCurrentIndex && toIndex <= oldCurrentIndex) {
            playlist.currentIndex++;
        }

        debugLog(`Playlist de la room ${roomId} réorganisée: ${fromIndex} -> ${toIndex}`);
        return this.getPlaylistState(roomId);
    }

    /**
     * Change manuellement la vidéo en cours
     * @returns {object} Données de la vidéo pour l'événement 'video-changed'
     * @throws {Error} Si index invalide
     */
    playVideo(roomId, videoIndex) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) {
            throw new Error('Playlist non trouvée');
        }

        if (videoIndex < 0 || videoIndex >= playlist.videos.length) {
            throw new Error('Index de vidéo invalide');
        }

        playlist.currentIndex = videoIndex;
        playlist.isPlaying = true;
        playlist.currentVideoStartTime = new Date().toISOString();

        debugLog(`Lecture de la vidéo index ${videoIndex} dans la room ${roomId}`);

        return {
            videoIndex: playlist.currentIndex,
            video: playlist.videos[playlist.currentIndex],
            isPlaying: true,
            startTime: playlist.currentVideoStartTime
        };
    }

    /**
     * Passe automatiquement à la vidéo suivante (autoplay)
     * @returns {object} 
     *   - Si fin de playlist : { endOfPlaylist: true, playlist }
     *   - Si vidéo suivante : { endOfPlaylist: false, videoIndex, video, isPlaying, startTime }
     */
    playNextVideo(roomId) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) {
            throw new Error('Playlist non trouvée');
        }

        const nextIndex = this.getNextVideoIndex(roomId);
        
        // Fin de playlist
        if (nextIndex === -1 || nextIndex === null) {
            playlist.isPlaying = false;
            playlist.currentIndex = 0;
            debugLog(`Fin de la playlist dans la room ${roomId}`);
            return {
                endOfPlaylist: true,
                playlist: this.getPlaylistState(roomId)
            };
        }

        // Vidéo suivante
        playlist.currentIndex = nextIndex;
        playlist.isPlaying = true;
        playlist.currentVideoStartTime = new Date().toISOString();

        debugLog(`Lecture de la vidéo index ${nextIndex} dans la room ${roomId}`);

        return {
            endOfPlaylist: false,
            videoIndex: playlist.currentIndex,
            video: playlist.videos[playlist.currentIndex],
            isPlaying: true,
            startTime: playlist.currentVideoStartTime
        };
    }

}

// Export singleton
module.exports = new PlaylistService();

