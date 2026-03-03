const whiteboardService = require('../../services/whiteboardService');
const roleService = require('../../services/roleService');
const anonymousUserStore = require('../../services/anonymousUserStore');
const { debugLog } = require('../../utils/utils');

/**
 * Initialise tous les handlers WebSocket pour le tableau blanc
 * @param {object} io - Instance Socket.IO pour les broadcasts
 * @param {object} socket - Socket individuel du client
 */
function initializeWhiteboardHandlers(io, socket) {

    /**
     * WB:JOIN
     * Rejoindre le whiteboard et recevoir l'état courant (snapshot)
     */
    socket.on('wb:join', (roomId) => {
        try {
            if (!roomId) return;
            const state = whiteboardService.getState(roomId);
            socket.emit('wb:state', state);
            debugLog(`Client ${socket.id} a rejoint le whiteboard de la room ${roomId}`);
        } catch (error) {
            debugLog(`Erreur wb:join: ${error}`);
        }
    });

    /**
     * WB:UPDATE
     * Réception d'éléments modifiés (delta) — vérifie les permissions
     */
    socket.on('wb:update', async (data) => {
        try {
            const { roomId, elements } = data;
            if (!roomId || !elements) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            // Vérifier permissions : admin OU draw permission
            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            const hasPerm = whiteboardService.hasDrawPermission(roomId, user.userId);

            if (!isAdmin && !hasPerm) {
                debugLog(`wb:update refusé pour ${user.userId} dans ${roomId}`);
                return;
            }

            // Merge les éléments
            const merged = whiteboardService.updateElements(roomId, elements);

            // Broadcast à tous SAUF l'émetteur
            socket.to(roomId).emit('wb:update', { elements: merged });
        } catch (error) {
            debugLog(`Erreur wb:update: ${error}`);
        }
    });

    /**
     * WB:CLEAR
     * Effacer le tableau (admin uniquement)
     */
    socket.on('wb:clear', async (roomId) => {
        try {
            if (!roomId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            whiteboardService.clearElements(roomId);
            io.to(roomId).emit('wb:clear');
            debugLog(`Whiteboard cleared par admin dans ${roomId}`);
        } catch (error) {
            debugLog(`Erreur wb:clear: ${error}`);
        }
    });

    /**
     * WB:GRANT-DRAW
     * Accorder le droit de dessin à un utilisateur (admin uniquement)
     */
    socket.on('wb:grant-draw', async (data) => {
        try {
            const { roomId, targetUserId } = data;
            if (!roomId || !targetUserId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            whiteboardService.grantDraw(roomId, targetUserId);

            io.to(roomId).emit('wb:role-changed', {
                userId: targetUserId,
                canDraw: true,
                drawPermissions: Array.from(whiteboardService.getWhiteboard(roomId).drawPermissions),
            });
        } catch (error) {
            debugLog(`Erreur wb:grant-draw: ${error}`);
        }
    });

    /**
     * WB:REVOKE-DRAW
     * Révoquer le droit de dessin d'un utilisateur (admin uniquement)
     */
    socket.on('wb:revoke-draw', async (data) => {
        try {
            const { roomId, targetUserId } = data;
            if (!roomId || !targetUserId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            whiteboardService.revokeDraw(roomId, targetUserId);

            io.to(roomId).emit('wb:role-changed', {
                userId: targetUserId,
                canDraw: false,
                drawPermissions: Array.from(whiteboardService.getWhiteboard(roomId).drawPermissions),
            });
        } catch (error) {
            debugLog(`Erreur wb:revoke-draw: ${error}`);
        }
    });

    /**
     * WB:MODE-SWITCH
     * Basculer entre mode vidéo et cours (admin uniquement)
     */
    socket.on('wb:mode-switch', async (data) => {
        try {
            const { roomId, mode } = data;
            if (!roomId || !['video', 'course'].includes(mode)) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            whiteboardService.setMode(roomId, mode);

            io.to(roomId).emit('wb:mode-changed', { mode });
            debugLog(`Mode changé en '${mode}' dans ${roomId}`);
        } catch (error) {
            debugLog(`Erreur wb:mode-switch: ${error}`);
        }
    });

    /**
     * WB:SCREEN-SHARE-START
     * L'admin signale qu'il partage son écran
     */
    socket.on('wb:screen-share-start', async (roomId) => {
        try {
            if (!roomId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            whiteboardService.setScreenSharing(roomId, true, user.userId);
            io.to(roomId).emit('wb:screen-share-start', { userId: user.userId });
        } catch (error) {
            debugLog(`Erreur wb:screen-share-start: ${error}`);
        }
    });

    /**
     * WB:SCREEN-SHARE-STOP
     * L'admin arrête le partage d'écran
     */
    socket.on('wb:screen-share-stop', async (roomId) => {
        try {
            if (!roomId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            whiteboardService.setScreenSharing(roomId, false);
            io.to(roomId).emit('wb:screen-share-stop');
        } catch (error) {
            debugLog(`Erreur wb:screen-share-stop: ${error}`);
        }
    });
}

module.exports = { initializeWhiteboardHandlers };
