const playlistService = require('../services/playlistService');
const anonymousUserStore = require('../services/anonymousUserStore');
const roomModel = require('../model/roomModel');
const { debugLog } = require('../utils/utils');

function initializePlaylistHandlers(io, socket) {

    socket.on('getPlaylist', (roomId) => {
        if (!roomId) {
            socket.emit('error', { message: 'Room ID is required to get playlist.' });
            return;
        }

        let playlist = playlistService.getPlaylistByRoomId(roomId);
        if (!playlist) {
            playlist = playlistService.createPlaylistIfNotExists(roomId);
        }
        socket.emit('playlist', playlist);
    });

    socket.on('addVideo', (roomId , video) => {

}

module.exports = { initializePlaylistHandlers };