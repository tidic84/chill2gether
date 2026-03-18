const { debugLog } = require("../utils/utils");

/**
 * Service de gestion des tableaux blancs en mémoire (un whiteboard par room)
 *
 * Structure d'un whiteboard :
 * {
 *   elements: [],           // ExcalidrawElement[]
 *   appState: {},           // État partiel d'Excalidraw (viewBackgroundColor, etc.)
 *   drawPermissions: Set(), // Set<userId> - utilisateurs autorisés à dessiner
 *   mode: 'video',          // 'video' | 'course'
 *   screenSharing: false,   // admin partage son écran
 *   screenSharingUserId: null
 * }
 */
class WhiteboardService {
    constructor() {
        // Map<roomId, whiteboardState>
        this.whiteboards = new Map();
    }

    getWhiteboard(roomId) {
        return this.whiteboards.get(roomId) || null;
    }

    createIfNotExists(roomId) {
        if (!this.whiteboards.has(roomId)) {
            this.whiteboards.set(roomId, {
                elements: [],
                appState: {},
                drawPermissions: new Set(),
                mode: 'video',
                screenSharing: false,
                screenSharingUserId: null,
            });
            debugLog(`Whiteboard créé pour la room ${roomId}`);
        }
        return this.whiteboards.get(roomId);
    }

    getState(roomId) {
        const wb = this.createIfNotExists(roomId);
        return {
            elements: wb.elements,
            appState: wb.appState,
            mode: wb.mode,
            screenSharing: wb.screenSharing,
            screenSharingUserId: wb.screenSharingUserId,
            drawPermissions: Array.from(wb.drawPermissions),
        };
    }

    updateElements(roomId, elements) {
        const wb = this.createIfNotExists(roomId);
        // Last-writer-wins merge by element version
        const elementMap = new Map();
        for (const el of wb.elements) {
            elementMap.set(el.id, el);
        }
        for (const el of elements) {
            const existing = elementMap.get(el.id);
            if (!existing || (el.version && el.version >= (existing.version || 0))) {
                elementMap.set(el.id, el);
            }
        }
        wb.elements = Array.from(elementMap.values());
        return wb.elements;
    }

    clearElements(roomId) {
        const wb = this.getWhiteboard(roomId);
        if (wb) {
            wb.elements = [];
            debugLog(`Whiteboard cleared pour la room ${roomId}`);
        }
    }

    hasDrawPermission(roomId, userId) {
        const wb = this.getWhiteboard(roomId);
        if (!wb) return false;
        return wb.drawPermissions.has(userId);
    }

    grantDraw(roomId, userId) {
        const wb = this.createIfNotExists(roomId);
        wb.drawPermissions.add(userId);
        debugLog(`Draw permission granted to ${userId} in room ${roomId}`);
    }

    revokeDraw(roomId, userId) {
        const wb = this.getWhiteboard(roomId);
        if (wb) {
            wb.drawPermissions.delete(userId);
            debugLog(`Draw permission revoked from ${userId} in room ${roomId}`);
        }
    }

    setMode(roomId, mode) {
        const wb = this.createIfNotExists(roomId);
        wb.mode = mode;
        debugLog(`Mode changé en '${mode}' pour la room ${roomId}`);
    }

    getMode(roomId) {
        const wb = this.getWhiteboard(roomId);
        return wb ? wb.mode : 'video';
    }

    setScreenSharing(roomId, sharing, userId = null) {
        const wb = this.createIfNotExists(roomId);
        wb.screenSharing = sharing;
        wb.screenSharingUserId = sharing ? userId : null;
    }

    deleteWhiteboard(roomId) {
        if (this.whiteboards.has(roomId)) {
            this.whiteboards.delete(roomId);
            debugLog(`Whiteboard de la room ${roomId} supprimé`);
            return true;
        }
        return false;
    }
}

module.exports = new WhiteboardService();
