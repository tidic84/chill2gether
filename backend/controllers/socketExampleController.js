/**
 * Exemple de contrôleur montrant comment utiliser Socket.IO
 * dans les routes Express pour émettre des événements en temps réel
 */

/**
 * Exemple : Envoyer une notification à tous les clients connectés
 */
const broadcastNotification = (req, res) => {
    try {
        const io = req.app.get('io');
        const { message, type } = req.body;

        // Émettre à tous les clients connectés
        io.emit('notification', {
            message,
            type: type || 'info',
            timestamp: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Notification envoyée à tous les clients'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi de la notification',
            error: error.message
        });
    }
};

/**
 * Exemple : Envoyer un message à une room spécifique
 */
const sendMessageToRoom = (req, res) => {
    try {
        const io = req.app.get('io');
        const { roomId, message } = req.body;

        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: 'roomId est requis'
            });
        }

        // Émettre uniquement aux clients dans la room spécifiée
        io.to(roomId).emit('room-message', {
            message,
            roomId,
            timestamp: new Date()
        });

        res.status(200).json({
            success: true,
            message: `Message envoyé à la room ${roomId}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message',
            error: error.message
        });
    }
};

/**
 * Exemple : Obtenir les informations sur les connexions actives
 */
const getActiveConnections = async (req, res) => {
    try {
        const io = req.app.get('io');
        
        // Obtenir tous les sockets connectés
        const sockets = await io.fetchSockets();
        
        const connections = sockets.map(socket => ({
            id: socket.id,
            rooms: Array.from(socket.rooms),
            connected: socket.connected
        }));

        res.status(200).json({
            success: true,
            count: connections.length,
            connections
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des connexions',
            error: error.message
        });
    }
};

module.exports = {
    broadcastNotification,
    sendMessageToRoom,
    getActiveConnections
};

