const roomModel = require("../model/roomModel");

/**
 * Service de résolution des rôles admin/student
 * Basé sur la colonne owner_id existante en BDD
 */
class RoleService {
    /**
     * Détermine le rôle d'un utilisateur dans une room
     * @param {string} roomId
     * @param {string} userId - userId anonyme du store
     * @returns {Promise<'admin'|'student'>}
     */
    async getUserRole(roomId, userId) {
        try {
            const room = await roomModel.getRoomById(roomId);
            if (!room) return 'student';
            return room.creatorId === userId ? 'admin' : 'student';
        } catch (error) {
            console.error(`Erreur résolution rôle: ${error}`);
            return 'student';
        }
    }

    /**
     * Vérifie si un utilisateur est admin d'une room
     * @returns {Promise<boolean>}
     */
    async isAdmin(roomId, userId) {
        const role = await this.getUserRole(roomId, userId);
        return role === 'admin';
    }
}

module.exports = new RoleService();
