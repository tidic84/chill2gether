/**
 * Store en mémoire pour persister les permissions personnalisées des utilisateurs par room
 * Structure: roomId -> userId -> permissions
 */
class UserPermissionsStore {
    constructor() {
        this.roomPermissions = new Map(); // roomId -> Map(userId -> permissions)
    }

    /**
     * Sauvegarde les permissions personnalisées d'un utilisateur dans une room
     */
    setUserPermissions(roomId, userId, permissions) {
        if (!this.roomPermissions.has(roomId)) {
            this.roomPermissions.set(roomId, new Map());
        }
        this.roomPermissions.get(roomId).set(userId, { ...permissions });
    }

    /**
     * Récupère les permissions personnalisées d'un utilisateur dans une room
     */
    getUserPermissions(roomId, userId) {
        if (!this.roomPermissions.has(roomId)) {
            return null;
        }
        return this.roomPermissions.get(roomId).get(userId) || null;
    }

    /**
     * Supprime les permissions personnalisées d'un utilisateur dans une room
     */
    removeUserPermissions(roomId, userId) {
        if (this.roomPermissions.has(roomId)) {
            this.roomPermissions.get(roomId).delete(userId);
        }
    }

    /**
     * Supprime toutes les permissions d'une room (quand elle est supprimée)
     */
    clearRoomPermissions(roomId) {
        this.roomPermissions.delete(roomId);
    }
}

module.exports = new UserPermissionsStore();