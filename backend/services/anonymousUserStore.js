const { v4: uuidv4 } = require('uuid');

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
            lastActivity: new Date()
        };

        this.users.set(userId, user);
        this.socketToUser.set(socketId, userId);

        console.log(`Utilisateur anonyme créé: ${userId} (socket: ${socketId})`);
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
        this.socketToUser.set(newSocketId, userId);

        console.log(`🔄 Socket mis à jour pour l'utilisateur ${userId}: ${newSocketId}`);
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
     * Supprime un utilisateur (à la déconnexion)
     * @param {string} socketId - ID du socket
     * @returns {boolean} Succès de l'opération
     */
    removeUserBySocketId(socketId) {
        const userId = this.socketToUser.get(socketId);
        if (!userId) {
            return false;
        }

        this.users.delete(userId);
        this.socketToUser.delete(socketId);

        console.log(`🗑️  Utilisateur anonyme supprimé: ${userId} (socket: ${socketId})`);
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
     * Récupère le nombre d'utilisateurs connectés
     * @returns {number} Nombre d'utilisateurs
     */
    getUserCount() {
        return this.users.size;
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
            console.log(`🧹 Nettoyage: ${cleanedCount} utilisateur(s) inactif(s) supprimé(s)`);
        }

        return cleanedCount;
    }
}

// Export une instance unique (singleton)
module.exports = new AnonymousUserStore();

