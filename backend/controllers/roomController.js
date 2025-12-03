const roomModel = require('../model/roomModel');

const createRoom = async (req, res) => {
    try {
        const { creatorId, requiresPassword, password } = req.body;

        if (!creatorId) {
            return res.status(400).json({
                success: false,
                error: "Le creatorId est requis"
            });
        }

        if (requiresPassword && !password) {
            return res.status(400).json({
                success: false,
                error: "Un mot de passe est requis lorsque requiresPassword est true"
            });
        }

        const room = await roomModel.createRoom(
            creatorId,
            requiresPassword || false,
            password || null
        );

        res.status(201).json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Erreur lors de la création de la room:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la création de la room'
        });
    }
};

const getRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Validation
        if (!roomId) {
            return res.status(400).json({
                success: false,
                error: "L'ID de la room est requis"
            });
        }

        // Récupérer la room
        const room = await roomModel.getRoomById(roomId, false);

        if (!room) {
            return res.status(404).json({
                success: false,
                error: "Room non trouvée"
            });
        }

        res.status(200).json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la room:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération de la room'
        });
    }
};

const getAllRooms = async (req, res) => {
    try {
        const rooms = await roomModel.getAllRooms();

        res.status(200).json({
            success: true,
            count: rooms.length,
            rooms
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des rooms:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des rooms'
        });
    }
};

const joinRoom = async (req, res) => {
    try {
        const { roomId, password } = req.body;

        // Validation
        if (!roomId) {
            return res.status(400).json({
                success: false,
                error: "L'ID de la room est requis"
            });
        }

        // Vérifier que la room existe
        const roomExists = await roomModel.roomExists(roomId);
        if (!roomExists) {
            return res.status(404).json({
                success: false,
                error: "Room non trouvée"
            });
        }

        // Valider le mot de passe
        const isValid = await roomModel.validatePassword(roomId, password);

        if (!isValid) {
            return res.status(403).json({
                success: false,
                error: "Mot de passe incorrect"
            });
        }

        // Récupérer les infos de la room
        const room = await roomModel.getRoomById(roomId, false);

        res.status(200).json({
            success: true,
            message: "Accès autorisé",
            room
        });
    } catch (error) {
        console.error('Erreur lors de la validation de la room:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la validation de la room'
        });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Validation
        if (!roomId) {
            return res.status(400).json({
                success: false,
                error: "L'ID de la room est requis"
            });
        }

        // Supprimer la room
        const deleted = await roomModel.deleteRoom(roomId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: "Room non trouvée"
            });
        }

        res.status(200).json({
            success: true,
            message: "Room supprimée avec succès"
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la room:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression de la room'
        });
    }
};

module.exports = {
    createRoom,
    getRoom,
    getAllRooms,
    joinRoom,
    deleteRoom
};