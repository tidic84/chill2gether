const roomModel = require('../../model/roomModel');
const anonymousUserStore = require('../../services/anonymousUserStore');
const permissionsService = require('../../services/permissionsService');
const { debugLog } = require('../../utils/utils');
const userPermissionsStore = require('../../services/userPermissionsStore');

/**
 * Initialise les handlers WebSocket pour la gestion des permissions
 * @param {object} io - Instance Socket.IO
 * @param {object} socket - Socket individuel du client
 */
function initializePermissionsHandlers(io, socket) {
    /**
     * UPDATE-ROOM-PERMISSIONS
     * Met à jour les permissions par défaut d'une room (admin uniquement)
     * ⚠️ N'affecte QUE les nouveaux utilisateurs, pas ceux déjà connectés
     */
    socket.on('update-room-permissions', async (data) => {
        try {
            const { roomId, permissions } = data;
            const user = anonymousUserStore.getUserBySocketId(socket.id);

            if (!roomId || !permissions) {
                socket.emit('permissions-error', { error: 'Room ID and permissions are required' });
                return;
            }

            // ✅ Vérifier que l'utilisateur est admin de la room
            const room = await roomModel.getRoomById(roomId);
            if (!room || room.creatorId !== user?.userId) {
                socket.emit('permissions-error', { error: 'Only room admin can update default permissions' });
                return;
            }

            // ✅ Mettre à jour UNIQUEMENT les permissions par défaut de la room en base de données
            const updatedRoom = await roomModel.updateDefaultPermissions(roomId, permissions);

            debugLog(`Permissions par défaut de la room ${roomId} mises à jour par ${user?.username}`);

            // Broadcast les permissions mises à jour à tous les utilisateurs de la room
            io.to(roomId).emit('room-default-permissions-updated', {
                roomId,
                defaultPermissions: updatedRoom.defaultPermissions,
                updatedBy: user.username
            });

            socket.emit('update-room-permissions-success', {
                message: 'Room permissions updated successfully'
            });
        } catch (error) {
            debugLog(`Erreur lors de la mise à jour des permissions de room: ${error}`);
            socket.emit('permissions-error', { error: error.message });
        }
    });

    /**
     * UPDATE-USER-PERMISSIONS
     * Met à jour les permissions d'un utilisateur spécifique
     * Sauvegarde en mémoire ET applique immédiatement
     */
    socket.on('update-user-permissions', async (data) => {
        try {
            const { roomId, targetUserId, permissions } = data;
            const modifierUser = anonymousUserStore.getUserBySocketId(socket.id);
            const targetUser = anonymousUserStore.getUserById(targetUserId);

            if (!roomId || !targetUserId || !permissions) {
                socket.emit('permissions-error', { error: 'Room ID, target user ID and permissions are required' });
                return;
            }

            if (!targetUser) {
                socket.emit('permissions-error', { error: 'Target user not found' });
                return;
            }

            // Vérifier que le modifieur a la permission editPermissions
            if (!modifierUser?.permissionsSet?.editPermissions) {
                socket.emit('permissions-error', { error: 'Permission denied: you do not have editPermissions' });
                return;
            }

            // Vérifier que le modifieur ne peut modifier que les permissions qu'il possède
            const validatedPermissions = {};
            for (const [key, value] of Object.entries(permissions)) {
                if (modifierUser.permissionsSet[key] === true) {
                    validatedPermissions[key] = value;
                } else {
                    // Garder la permission actuelle si le modifieur ne la possède pas
                    validatedPermissions[key] = targetUser.permissionsSet[key];
                }
            }

            // ✅ Mettre à jour les permissions de l'utilisateur
            anonymousUserStore.updateUserPermissions(targetUserId, validatedPermissions);

            // ✅ Sauvegarder les permissions personnalisées
            userPermissionsStore.setUserPermissions(roomId, targetUserId, validatedPermissions);

            debugLog(`Permissions de ${targetUser.username} mises à jour par ${modifierUser.username}`);

            // ✅ Envoyer IMMÉDIATEMENT au client concerné ses nouvelles permissions
            io.to(roomId).emit('user-permissions-updated', {
                userId: targetUserId,
                username: targetUser.username,
                permissions: validatedPermissions,
                updatedBy: modifierUser.username
            });

            socket.emit('update-user-permissions-success', {
                message: 'User permissions updated successfully'
            });
        } catch (error) {
            debugLog(`Erreur lors de la mise à jour des permissions utilisateur: ${error}`);
            socket.emit('permissions-error', { error: error.message });
        }
    });

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

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            socket.emit('room-permissions', {
                roomId,
                defaultPermissions: room.defaultPermissions,
                isAdmin: room.creatorId === user?.userId
            });
        } catch (error) {
            debugLog(`Erreur lors de la récupération des permissions: ${error}`);
            socket.emit('permissions-error', { error: 'Error fetching permissions' });
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