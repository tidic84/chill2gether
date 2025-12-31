const { debugLog } = require("../utils/utils");
const { v4: uuidv4 } = require('uuid');

/**
 * Architecture stockage  des playlists en memoire
 *   'ROOM123': {
 *         videos: [
 *               { id: 'uuid1', url: '...', title: '...', thumbnail: '...', 
 *                 addedBy: { userId: '...', username: '...'}, addedAt: Date },
 *               { id: 'uuid2', url: '...', title: '...', thumbnail: '...', 
 *                 addedBy: { userId: '...', username: '...'}, addedAt: Date },
 *        ],
 *         currentIndex: 0,  
 *         isPlaying: false,
 *         currentVideoStartTime: Date,
 *         isLooping: false
 *     }
 * }
*/

class PlaylistService {

    constructor() {
        this.playlists = new Map();
    }

    getPlaylistByRoomId(roomId) {
        if (this.playlists.has(roomId)) {
            return this.playlists.get(roomId);
        }
        return null;
    }

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

    generateVideoId() {
        return uuidv4();
    }

    validateVideoData(video) {

        if (!video) return false;

        if (!video.url || !video.title) return false;

        if (typeof video.url !== 'string' || video.url.trim() === '') return false;
        if (typeof video.title !== 'string' || video.title.trim() === '') return false;

        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        if (!youtubeRegex.test(video.url)) return false;

        return true;
    }

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

    getNextVideoIndex(roomId) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) return null;

        const currentIndex = playlist.currentIndex;
        const videosLength = playlist.videos.length;

        if (currentIndex + 1 < videosLength) {
            return currentIndex + 1;
        }

        if (playlist.isLooping) {
            return 0;  // recommencer au début
        }

        return -1;  // pas de vidéo suivante
    }

    deletePlaylist(roomId) {
        if (this.playlists.has(roomId)) {

            this.playlists.delete(roomId);
            debugLog(`Playlist de la room ${roomId} supprimée`);
            return true;
        }
        return false;
    }

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

        if (playlist.videos.length === 1) {
            playlist.currentIndex = 0;
            playlist.isPlaying = true;
            playlist.currentVideoStartTime = new Date().toISOString();
        }

        debugLog(`Vidéo ajoutée à la playlist de la room ${roomId} par l'utilisateur ${userId}`);
        return this.getPlaylistState(roomId);
    }

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
        // if (video.addedBy.userId !== userId) {
        //     throw new Error('Permission refusée pour supprimer cette vidéo');
        // }

        if (videoIndex < playlist.currentIndex) {
            playlist.currentIndex -= 1;
        } else if (videoIndex === playlist.currentIndex) {
            if (playlist.currentIndex >= playlist.videos.length - 1) {
                playlist.currentIndex = 0;
                playlist.isPlaying = false;
            }
        }
        playlist.videos.splice(videoIndex, 1);

        if (playlist.videos.length === 0) {
            playlist.currentIndex = 0;
            playlist.isPlaying = false;
            playlist.currentVideoStartTime = null;
        }

        debugLog(`Vidéo supprimée de la playlist de la room ${roomId} par l'utilisateur ${userId}`);
        return this.getPlaylistState(roomId);
    }

    reorderPlaylist(roomId, fromIndex, toIndex) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) {
            throw new Error('Playlist non trouvée');
        }

        if (fromIndex < 0 || fromIndex >= playlist.videos.length ||
            toIndex < 0 || toIndex >= playlist.videos.length) {
            throw new Error('Indices de réorganisation invalides');
        }

        const [movedVideo] = playlist.videos.splice(fromIndex, 1);
        playlist.videos.splice(toIndex, 0, movedVideo);

        //currentIndex modification
        const oldCurrentIndex = playlist.currentIndex;
        if (fromIndex === oldCurrentIndex) {
            // La vidéo en cours est déplacée
            playlist.currentIndex = toIndex;
        } else if (fromIndex < oldCurrentIndex && toIndex >= oldCurrentIndex) {
            // Vidéo déplacée de avant vers après → décaler
            playlist.currentIndex--;
        } else if (fromIndex > oldCurrentIndex && toIndex <= oldCurrentIndex) {
            // Vidéo déplacée de après vers avant → décaler
            playlist.currentIndex++;
        }

        debugLog(`Playlist de la room ${roomId} réorganisée: ${fromIndex} -> ${toIndex}`);
        return this.getPlaylistState(roomId);
    }

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

    playNextVideo(roomId) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) {
            throw new Error('Playlist non trouvée');
        }

        const nextIndex = this.getNextVideoIndex(roomId);
        if (nextIndex === -1 || nextIndex === null) {
            playlist.isPlaying = false;
            playlist.currentIndex = 0;
            debugLog(`Fin de la playlist dans la room ${roomId}`);
            return {
                endOfPlaylist: true,
                playlist: this.getPlaylistState(roomId)
            };
        }

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

module.exports = new PlaylistService();

