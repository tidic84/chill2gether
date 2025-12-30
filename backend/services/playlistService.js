const { debugLog } = require("../utils/utils");
const { v4: uuidv4 } = require('uuid');

/**
 * Architecture stockage  des playlists en memoire
 *   'ROOM123': {
 *         videos: [
 *               { id: 'uuid1', url: '...', title: '...', thumbnail: '...'},
 *               { id: 'uuid2', url: '...', title: '...', thumbnail: '...'}
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
        this.playliss = new Map();
    }

    getPlaylistByRoomId(roomId) {
        if (this.playlists.has(roomId)) {
            return this.playlists.get(roomId);
        }
        return null;
    }

    createPlaylistIfNotExists(roomId) {
        if (!this.playlists.has(roomId)) {
            const newPlaylist  = {
                videos: [],
                currentIndex: 0,
                isPlaying: false,
                currentVideoStartTime: null
            }
            this.playlists.set(roomId, newPlaylist);
            debugLog(`Playlist créée pour la room ${roomId}`);
            return newPlaylist;
        }
    }

    generateVideoId() {
        return uuidv4();
    }

    validateVideoData(videoData) {
        if (!videoData['id'] && !videoData['url'] && !videoData['title'] && !videoData['thumbnail']) return false ;
        return true;
    }

    broadcastPlaylistUpdate(io, roomId) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) return;

        io.to(roomId).emit('playlistUpdate', playlist);
        debugLog(`Mise à jour de la playlist diffusée à la room ${roomId}`);
    }

    getNextVideoIndex(roomId) {
        const playlist = this.getPlaylistByRoomId(roomId);
        if (!playlist) return null;
        if (playlist.currentIndex + 1 < playlist.videos.length) {
            return playlist.currentIndex + 1;
        }
        if (playlist.isLooping) return 0;
        return -1;
    }

    flushPlaylist(roomId) {
        const playlist = this.getPlaylistByRoomId(roomId);

        if  (!playlist==null)  {
            this.playlists.delete(roomId);
            debugLog(`Playlist de la room ${roomId} supprimée`);
        }
        return;
    }
}

module.exports = new PlaylistService();

