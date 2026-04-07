const { debugLog } = require("../utils/utils");

/**
 * Service de gestion des annotations vidéo en mémoire (une session par room)
 *
 * Structure d'une session d'annotation :
 * {
 *   strokes: [],              // { id, points, color, width, tool, userId, timestamp }
 *   drawPermissions: Set(),   // Set<userId> - utilisateurs autorisés à annoter
 *   active: false,            // mode annotation activé
 * }
 */
class AnnotationService {
    constructor() {
        this.annotations = new Map();
    }

    createIfNotExists(roomId) {
        if (!this.annotations.has(roomId)) {
            this.annotations.set(roomId, {
                strokes: [],
                drawPermissions: new Set(),
                active: false,
            });
            debugLog(`Annotation session créée pour la room ${roomId}`);
        }
        return this.annotations.get(roomId);
    }

    getState(roomId) {
        const ann = this.createIfNotExists(roomId);
        return {
            strokes: ann.strokes,
            active: ann.active,
            drawPermissions: Array.from(ann.drawPermissions),
        };
    }

    addStroke(roomId, stroke) {
        const ann = this.createIfNotExists(roomId);
        ann.strokes.push(stroke);
        return ann.strokes;
    }

    clearStrokes(roomId) {
        const ann = this.annotations.get(roomId);
        if (ann) {
            ann.strokes = [];
            debugLog(`Annotations cleared pour la room ${roomId}`);
        }
    }

    undoLastStroke(roomId, userId) {
        const ann = this.annotations.get(roomId);
        if (!ann) return [];
        // Supprimer le dernier stroke de cet utilisateur
        for (let i = ann.strokes.length - 1; i >= 0; i--) {
            if (ann.strokes[i].userId === userId) {
                ann.strokes.splice(i, 1);
                break;
            }
        }
        return ann.strokes;
    }

    setActive(roomId, active) {
        const ann = this.createIfNotExists(roomId);
        ann.active = active;
    }

    isActive(roomId) {
        const ann = this.annotations.get(roomId);
        return ann ? ann.active : false;
    }

    hasDrawPermission(roomId, userId) {
        const ann = this.annotations.get(roomId);
        if (!ann) return false;
        return ann.drawPermissions.has(userId);
    }

    grantDraw(roomId, userId) {
        const ann = this.createIfNotExists(roomId);
        ann.drawPermissions.add(userId);
        debugLog(`Annotation draw permission granted to ${userId} in room ${roomId}`);
    }

    revokeDraw(roomId, userId) {
        const ann = this.annotations.get(roomId);
        if (ann) {
            ann.drawPermissions.delete(userId);
            debugLog(`Annotation draw permission revoked from ${userId} in room ${roomId}`);
        }
    }

    deleteAnnotation(roomId) {
        if (this.annotations.has(roomId)) {
            this.annotations.delete(roomId);
            debugLog(`Annotation session de la room ${roomId} supprimée`);
            return true;
        }
        return false;
    }
}

module.exports = new AnnotationService();
