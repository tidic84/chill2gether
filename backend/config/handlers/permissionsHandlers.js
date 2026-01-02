const roomModel = require('../../model/roomModel');
const anonymousUserStore = require('../../services/anonymousUserStore');
const permissionsService = require('../../services/permissionsService');
const { debugLog } = require('../../utils/utils');

/**
 * Initialise les handlers WebSocket pour la gestion des permissions
 * @param {object} io - Instance Socket.IO
 * @param {object} socket - Socket individuel du client
 */
function initializePermissionsHandlers(io, socket) {
    /**
     * GET-ROOM-PERMISSIONS
     * Récupère les permissions par défaut d'une room
     */
    socket.on('get-room-permissions', async (roomId) => {
        try {
            if (!roomId) {
                socket.emit('permissions-error', { error: 'Room ID is required' });
                return;
            }

            const room = await roomModel.getRoomById(roomId);
            if (!room) {
                socket.emit('permissions-error', { error: 'Room not found' });
                return;
            }

            socket.emit('room-permissions', {
                roomId,
                defaultPermissions: room.defaultPermissions,
                isAdmin: room.creatorId === anonymousUserStore.getUserBySocketId(socket.id)?.userId
            });
        } catch (error) {
            debugLog(`Erreur lors de la récupération des permissions: ${error}`);
            socket.emit('permissions-error', { error: 'Error fetching permissions' });
        }
    });

    /**
     * UPDATE-ROOM-PERMISSIONS
     * Met à jour les permissions par défaut d'une room (admin uniquement)
     */
    socket.on('update-room-permissions', async (data) => {
        try {
            const { roomId, permissions } = data;
            const user = anonymousUserStore.getUserBySocketId(socket.id);

            if (!roomId || !permissions) {
                socket.emit('permissions-error', { error: 'Room ID and permissions are required' });
                return;
            }

            const updatedPermissions = await permissionsService.updateRoomPermissions(roomId, user.userId, permissions);

            // Broadcast les permissions mises à jour à tous les utilisateurs de la room
            io.to(roomId).emit('room-permissions-updated', {
                roomId,
                defaultPermissions: updatedPermissions,
                updatedBy: user.username
            });

            socket.emit('update-permissions-success', {
                message: 'Permissions updated successfully'
            });
        } catch (error) {
            debugLog(`Erreur lors de la mise à jour des permissions: ${error}`);
            socket.emit('permissions-error', { error: error.message });
        }
    });

    /**
     * GET-USER-PERMISSIONS
     * Récupère les permissions d'un utilisateur dans la room actuelle
     */
    socket.on('get-user-permissions', async (roomId) => {
        try {
            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) {
                socket.emit('permissions-error', { error: 'User not found' });
                return;
            }

            socket.emit('user-permissions', {
                roomId,
                permissions: user.permissionsSet
            });
        } catch (error) {
            debugLog(`Erreur lors de la récupération des permissions utilisateur: ${error}`);
            socket.emit('permissions-error', { error: 'Error fetching user permissions' });
        }
    });
}

module.exports = { initializePermissionsHandlers };