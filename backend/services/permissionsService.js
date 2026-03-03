const roomModel = require('../model/roomModel');
const anonymousUserStore = require('./anonymousUserStore');
const { debugLog } = require('../utils/utils');

/**
 * Service de gestion des permissions
 */
class PermissionsService {
    /**
     * Met à jour les permissions par défaut d'une room
     * Seul l'admin peut faire cela
     * @param {string} roomId - ID de la room
     * @param {string} userId - ID de l'utilisateur qui fait la demande
     * @param {object} newPermissions - Nouvelles permissions
     * @returns {object} Permissions mises à jour
     * @throws {Error} Si l'utilisateur n'est pas admin
     */
    async updateRoomPermissions(roomId, userId, newPermissions) {
        const room = await roomModel.getRoomById(roomId);

        if (!room) {
            throw new Error('Room not found');
        }

        // Vérifier que l'utilisateur est le créateur (admin)
        if (room.creatorId !== userId) {
            throw new Error('Only room admin can modify permissions');
        }

        // Valider et merger avec les permissions existantes
        const validatedPermissions = {
            editPermissions: typeof newPermissions.editPermissions === 'boolean' ? newPermissions.editPermissions : room.defaultPermissions.editPermissions,
            sendMessages: typeof newPermissions.sendMessages === 'boolean' ? newPermissions.sendMessages : room.defaultPermissions.sendMessages,
            deleteMessages: typeof newPermissions.deleteMessages === 'boolean' ? newPermissions.deleteMessages : room.defaultPermissions.deleteMessages,
            changeVideo: typeof newPermissions.changeVideo === 'boolean' ? newPermissions.changeVideo : room.defaultPermissions.changeVideo,
            interactionVideo: typeof newPermissions.interactionVideo === 'boolean' ? newPermissions.interactionVideo : room.defaultPermissions.interactionVideo
        };

        // Mettre à jour en base de données
        const updatedPermissions = await roomModel.updateDefaultPermissions(roomId, validatedPermissions);

        debugLog(`Permissions de la room ${roomId} mises à jour par ${userId}`);

        return updatedPermissions;
    }

    /**
     * Vérifie si un utilisateur a une permission spécifique
     * @param {string} userId - ID de l'utilisateur
     * @param {string} permission - Nom de la permission
     * @returns {boolean}
     */
    hasPermission(userId, permission) {
        const user = anonymousUserStore.getUserById(userId);
        if (!user) return false;
        return user.permissionsSet[permission] === true;
    }

    /**
     * Obtient les permissions d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {object|null}
     */
    getUserPermissions(userId) {
        const user = anonymousUserStore.getUserById(userId);
        return user ? user.permissionsSet : null;
    }
}

module.exports = new PermissionsService();