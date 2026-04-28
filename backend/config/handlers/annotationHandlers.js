const annotationService = require('../../services/annotationService');
const roleService = require('../../services/roleService');
const anonymousUserStore = require('../../services/anonymousUserStore');
const { debugLog } = require('../../utils/utils');

/**
 * Initialise les handlers WebSocket pour les annotations vidéo
 */
function initializeAnnotationHandlers(io, socket) {

    /**
     * ANNOTATION:JOIN
     * Rejoindre la session d'annotation et recevoir l'état courant
     */
    socket.on('annotation:join', (roomId) => {
        try {
            if (!roomId) return;
            const state = annotationService.getState(roomId);
            socket.emit('annotation:state', state);
            debugLog(`Client ${socket.id} a rejoint les annotations de la room ${roomId}`);
        } catch (error) {
            debugLog(`Erreur annotation:join: ${error}`);
        }
    });

    /**
     * ANNOTATION:STROKE
     * Réception d'un nouveau trait — vérifie les permissions
     */
    socket.on('annotation:stroke', async (data) => {
        try {
            const { roomId, stroke } = data;
            if (!roomId || !stroke) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            const hasPerm = annotationService.hasDrawPermission(roomId, user.userId);

            if (!isAdmin && !hasPerm) {
                debugLog(`annotation:stroke refusé pour ${user.userId} dans ${roomId}`);
                return;
            }

            stroke.userId = user.userId;
            stroke.timestamp = Date.now();
            annotationService.addStroke(roomId, stroke);

            // Broadcast à tous SAUF l'émetteur
            socket.to(roomId).emit('annotation:stroke', { stroke });
        } catch (error) {
            debugLog(`Erreur annotation:stroke: ${error}`);
        }
    });

    /**
     * ANNOTATION:DRAWING
     * Diffusion en temps réel des points pendant le dessin (pas stocké)
     */
    socket.on('annotation:drawing', async (data) => {
        try {
            const { roomId, points, color, width, tool } = data;
            if (!roomId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            socket.to(roomId).emit('annotation:drawing', {
                userId: user.userId,
                points,
                color,
                width,
                tool,
            });
        } catch (error) {
            debugLog(`Erreur annotation:drawing: ${error}`);
        }
    });

    /**
     * ANNOTATION:CLEAR
     * Effacer toutes les annotations (admin uniquement)
     */
    socket.on('annotation:clear', async (roomId) => {
        try {
            if (!roomId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            annotationService.clearStrokes(roomId);
            io.to(roomId).emit('annotation:clear');
            debugLog(`Annotations cleared par admin dans ${roomId}`);
        } catch (error) {
            debugLog(`Erreur annotation:clear: ${error}`);
        }
    });

    /**
     * ANNOTATION:UNDO
     * Annuler le dernier trait de l'utilisateur
     */
    socket.on('annotation:undo', async (data) => {
        try {
            const { roomId } = data;
            if (!roomId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            const hasPerm = annotationService.hasDrawPermission(roomId, user.userId);
            if (!isAdmin && !hasPerm) return;

            const strokes = annotationService.undoLastStroke(roomId, user.userId);
            io.to(roomId).emit('annotation:state', {
                strokes,
                active: annotationService.isActive(roomId),
                drawPermissions: [],
            });
        } catch (error) {
            debugLog(`Erreur annotation:undo: ${error}`);
        }
    });

    /**
     * ANNOTATION:TOGGLE
     * Activer/désactiver le mode annotation (admin uniquement)
     */
    socket.on('annotation:toggle', async (data) => {
        try {
            const { roomId, active } = data;
            if (!roomId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            annotationService.setActive(roomId, active);
            io.to(roomId).emit('annotation:toggled', { active });
            debugLog(`Annotations ${active ? 'activées' : 'désactivées'} dans ${roomId}`);
        } catch (error) {
            debugLog(`Erreur annotation:toggle: ${error}`);
        }
    });

    /**
     * ANNOTATION:GRANT-DRAW
     */
    socket.on('annotation:grant-draw', async (data) => {
        try {
            const { roomId, targetUserId } = data;
            if (!roomId || !targetUserId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            annotationService.grantDraw(roomId, targetUserId);
            io.to(roomId).emit('annotation:permissions-changed', {
                drawPermissions: Array.from(annotationService.createIfNotExists(roomId).drawPermissions),
            });
        } catch (error) {
            debugLog(`Erreur annotation:grant-draw: ${error}`);
        }
    });

    /**
     * ANNOTATION:REVOKE-DRAW
     */
    socket.on('annotation:revoke-draw', async (data) => {
        try {
            const { roomId, targetUserId } = data;
            if (!roomId || !targetUserId) return;

            const user = anonymousUserStore.getUserBySocketId(socket.id);
            if (!user) return;

            const isAdmin = await roleService.isAdmin(roomId, user.userId);
            if (!isAdmin) return;

            annotationService.revokeDraw(roomId, targetUserId);
            io.to(roomId).emit('annotation:permissions-changed', {
                drawPermissions: Array.from(annotationService.createIfNotExists(roomId).drawPermissions),
            });
        } catch (error) {
            debugLog(`Erreur annotation:revoke-draw: ${error}`);
        }
    });
}

module.exports = { initializeAnnotationHandlers };
