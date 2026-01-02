const { v4: uuidv4 } = require('uuid');
const { debugLog } = require('../utils/utils');

/**
 * Store en mémoire pour gérer les utilisateurs anonymes connectés via Socket.IO
 * Structure: {
 *   userId: {
 *     userId: string,
 *     socketId: string,
 *     connectedAt: Date,
 *     username: string,
 *     lastActivity: Date
 *   }
 * }
 */
class AnonymousUserStore {
    constructor() {
        this.users = new Map();
        this.socketToUser = new Map(); // Mapping inverse: socketId -> userId
    }

    /**
     * Crée un nouvel utilisateur anonyme
     * @param {string} socketId - ID du socket
     * @param {string} username - Nom d'utilisateur (optionnel)
     * @returns {object} Utilisateur créé
     */
    createUser(socketId, username = null) {
        const userId = uuidv4();
        const user = {
            userId,
            socketId,
            username: username || `User${userId.substring(0, 8)}`,
            connectedAt: new Date(),
            lastActivity: new Date(),
            disconnectedAt: null,
            currentRoomId: null,
            permissionsSet: {
                editPermissions: false,
                sendMessages: true,
                deleteMessages: false,
                changeVideo: true,
                interactionVideo: true
            }
        };

        this.users.set(userId, user);
        this.socketToUser.set(socketId, userId);

        debugLog(`Utilisateur anonyme créé: ${userId} (socket: ${socketId})`);
        return user;
    }

    /**
     * Récupère un utilisateur par son userId
     * @param {string} userId - ID de l'utilisateur
     * @returns {object|null} Utilisateur ou null
     */
    getUserById(userId) {
        return this.users.get(userId) || null;
    }

    /**
     * Récupère un utilisateur par son socketId
     * @param {string} socketId - ID du socket
     * @returns {object|null} Utilisateur ou null
     */
    getUserBySocketId(socketId) {
        const userId = this.socketToUser.get(socketId);
        return userId ? this.users.get(userId) : null;
    }

    /**
     * Met à jour le socketId d'un utilisateur (utile en cas de reconnexion)
     * @param {string} userId - ID de l'utilisateur
     * @param {string} newSocketId - Nouveau ID du socket
     * @returns {boolean} Succès de l'opération
     */
    updateSocketId(userId, newSocketId) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }

        // Supprimer l'ancien mapping
        this.socketToUser.delete(user.socketId);

        // Mettre à jour
        user.socketId = newSocketId;
        user.lastActivity = new Date();
        user.disconnectedAt = null; // Réinitialiser le statut de déconnexion
        this.socketToUser.set(newSocketId, userId);

        debugLog(`Socket mis à jour pour l'utilisateur ${userId}: ${newSocketId}`);
        return true;
    }

    /**
     * Met à jour le nom d'utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} username - Nouveau nom
     * @returns {boolean} Succès de l'opération
     */
    updateUsername(userId, username) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }

        user.username = username;
        user.lastActivity = new Date();
        return true;
    }

    /**
     * Marque un utilisateur comme déconnecté (au lieu de le supprimer immédiatement)
     * @param {string} socketId - ID du socket
     * @returns {boolean} Succès de l'opération
     */
    removeUserBySocketId(socketId) {
        const userId = this.socketToUser.get(socketId);
        if (!userId) {
            return false;
        }

        const user = this.users.get(userId);
        if (user) {
            user.disconnectedAt = new Date();
            this.socketToUser.delete(socketId);
            debugLog(`Utilisateur marqué comme déconnecté: ${userId} (socket: ${socketId})`);
        }

        return true;
    }

    /**
     * Supprime définitivement un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {boolean} Succès de l'opération
     */
    permanentlyRemoveUser(userId) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }

        this.socketToUser.delete(user.socketId);
        this.users.delete(userId);

        debugLog(`Utilisateur définitivement supprimé: ${userId}`);
        return true;
    }

    /**
     * Met à jour l'activité d'un utilisateur
     * @param {string} socketId - ID du socket
     */
    updateActivity(socketId) {
        const userId = this.socketToUser.get(socketId);
        if (userId) {
            const user = this.users.get(userId);
            if (user) {
                user.lastActivity = new Date();
            }
        }
    }

    /**
     * Récupère tous les utilisateurs connectés
     * @returns {Array} Liste des utilisateurs
     */
    getAllUsers() {
        return Array.from(this.users.values());
    }

    /**
     * Récupère le nombre d'utilisateurs connectés (non déconnectés)
     * @returns {number} Nombre d'utilisateurs
     */
    getUserCount() {
        let count = 0;
        for (const user of this.users.values()) {
            if (!user.disconnectedAt) {
                count++;
            }
        }
        return count;
    }

    /**
     * Vérifie si un userId existe
     * @param {string} userId - ID de l'utilisateur
     * @returns {boolean}
     */
    userExists(userId) {
        return this.users.has(userId);
    }

    /**
     * Nettoie les utilisateurs déconnectés depuis un certain temps
     * @param {number} disconnectedSeconds - Nombre de secondes après déconnexion avant suppression définitive
     * @returns {number} Nombre d'utilisateurs supprimés
     */
    cleanupDisconnectedUsers(disconnectedSeconds = 30) {
        const now = new Date();
        const threshold = disconnectedSeconds * 1000;
        let cleanedCount = 0;

        for (const [userId, user] of this.users.entries()) {
            if (user.disconnectedAt && (now - user.disconnectedAt > threshold)) {
                this.socketToUser.delete(user.socketId);
                this.users.delete(userId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            debugLog(`Nettoyage: ${cleanedCount} utilisateur(s) déconnecté(s) supprimé(s)`);
        }

        return cleanedCount;
    }

    /**
     * Nettoie les utilisateurs inactifs (optionnel, pour éviter les fuites mémoire)
     * @param {number} inactiveMinutes - Nombre de minutes d'inactivité avant suppression
     */
    cleanupInactiveUsers(inactiveMinutes = 60) {
        const now = new Date();
        const threshold = inactiveMinutes * 60 * 1000;
        let cleanedCount = 0;

        for (const [userId, user] of this.users.entries()) {
            if (now - user.lastActivity > threshold) {
                this.socketToUser.delete(user.socketId);
                this.users.delete(userId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            debugLog(`Nettoyage: ${cleanedCount} utilisateur(s) inactif(s) supprimé(s)`);
        }

        return cleanedCount;
    }

    getUsersInRoom(roomId) {
        const usersInRoom = [];
        for (const user of this.users.values()) {
            // Exclure les utilisateurs déconnectés
            if (user.currentRoomId === roomId && !user.disconnectedAt) {
                usersInRoom.push({
                    userId: user.userId,
                    username: user.username,
                    connectedAt: user.connectedAt
                });
            }
        }
        return usersInRoom;
    }

    setUserRoom(userId, roomId) {
        const user = this.users.get(userId);
        if (user) {
            user.currentRoomId = roomId;
        }
    }

    /**
     * Met à jour les permissions d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {object} permissions - Objet permissions
     * @returns {boolean} Succès de l'opération
     */
    updateUserPermissions(userId, permissions) {
        const user = this.users.get(userId);
        if (user) {
            user.permissionsSet = { ...user.permissionsSet, ...permissions };
            return true;
        }
        return false;
    }

    /**
     * Définit les permissions par défaut d'une room pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {object} defaultPermissions - Permissions par défaut de la room
     */
    setUserDefaultPermissions(userId, defaultPermissions) {
        const user = this.users.get(userId);
        if (user) {
            user.permissionsSet = { ...defaultPermissions };
            debugLog(`Permissions définies pour l'utilisateur ${userId}: ${JSON.stringify(defaultPermissions)}`);
        }
    }

    /**
     * Définit les permissions d'admin pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     */
    setUserAsAdmin(userId) {
        const user = this.users.get(userId);
        if (user) {
            user.permissionsSet = {
                editPermissions: true,
                sendMessages: true,
                deleteMessages: true,
                changeVideo: true,
                interactionVideo: true
            };
            debugLog(`L'utilisateur ${userId} est maintenant admin`);
        }
    }

}


// Export une instance unique (singleton)
module.exports = new AnonymousUserStore();