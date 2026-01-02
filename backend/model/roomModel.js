const { query } = require('../config/db');

async function generateRoomId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId;

    // Générer un ID jusqu'à ce qu'il soit unique
    do {
        roomId = '';
        for (let i = 0; i < 5; i++) {
            roomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        const result = await query('SELECT id FROM room WHERE id = $1', [roomId]);
        if (result.rows.length === 0) {
            break;
        }
    } while (true);

    return roomId;
}

async function createRoom(creatorId, requiresPassword = false, password = null) {
    const roomId = await generateRoomId();
    const defaultPermissions = {
        editPermissions: false,
        sendMessages: true,
        deleteMessages: false,
        changeVideo: true,
        interactionVideo: true
    };

    const result = await query(
        `INSERT INTO room (id, owner_id, requires_password, password, default_permissions, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, owner_id, requires_password, default_permissions, created_at`,
        [roomId, creatorId, requiresPassword, password, JSON.stringify(defaultPermissions)]
    );

    const room = result.rows[0];

    return {
        id: room.id,
        creatorId: room.owner_id,
        requiresPassword: room.requires_password,
        defaultPermissions: room.default_permissions,
        createdAt: room.created_at
    };
}

async function getRoomById(roomId, includePassword = false) {
    const fields = includePassword
        ? 'id, owner_id, requires_password, password, default_permissions, created_at'
        : 'id, owner_id, requires_password, default_permissions, created_at';

    const result = await query(
        `SELECT ${fields} FROM room WHERE id = $1`,
        [roomId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const room = result.rows[0];

    return {
        id: room.id,
        creatorId: room.owner_id,
        requiresPassword: room.requires_password,
        defaultPermissions: room.default_permissions,
        ...(includePassword && { password: room.password }),
        createdAt: room.created_at
    };
}

async function updateDefaultPermissions(roomId, permissions) {
    const result = await query(
        'UPDATE room SET default_permissions = $2 WHERE id = $1 RETURNING default_permissions',
        [roomId, JSON.stringify(permissions)]
    );

    if (result.rows.length === 0) {
        throw new Error('Room not found');
    }

    return result.rows[0].default_permissions;
}

async function roomExists(roomId) {
    const result = await query(
        'SELECT id FROM room WHERE id = $1',
        [roomId]
    );

    return result.rows.length > 0;
}

async function validatePassword(roomId, password) {
    const result = await query(
        'SELECT requires_password, password FROM room WHERE id = $1',
        [roomId]
    );

    if (result.rows.length === 0) {
        return false;
    }

    const room = result.rows[0];

    // Si la room ne nécessite pas de mot de passe
    if (!room.requires_password) {
        return true;
    }

    // Vérifier le mot de passe
    return room.password === password;
}

async function deleteRoom(roomId) {
    const result = await query(
        'DELETE FROM room WHERE id = $1',
        [roomId]
    );

    return result.rowCount > 0;
}

async function getAllRooms() {
    const result = await query(
        'SELECT id, owner_id, requires_password, created_at FROM room ORDER BY created_at DESC'
    );

    return result.rows.map(room => ({
        id: room.id,
        creatorId: room.owner_id,
        requiresPassword: room.requires_password,
        createdAt: room.created_at
    }));
}

async function getRoomCount() {
    const result = await query('SELECT COUNT(*) FROM room');
    return parseInt(result.rows[0].count);
}

async function updateRoomActivity(roomId) {
    const result = await query(
        'UPDATE room SET last_activity = NOW() WHERE id = $1',
        [roomId]
    );
    return result.rowCount > 0;
}

async function incrementUserCount(roomId) {
    const result = await query(
        'UPDATE room SET user_count = user_count + 1 WHERE id = $1',
        [roomId]
    );
    return result.rowCount > 0;
}

async function decrementUserCount(roomId) {
    const result = await query(
        'UPDATE room SET user_count = GREATEST(user_count - 1, 0) WHERE id = $1',
        [roomId]
    );
    return result.rowCount > 0;
}

async function deleteInactiveRooms() {
    const result = await query(
        `DELETE FROM room
         WHERE user_count = 0
         AND last_activity < NOW() - INTERVAL '1 hour'
         RETURNING id`
    );

    return {
        deleted: result.rowCount,
        roomIds: result.rows.map(row => row.id)
    };
}

module.exports = {
    createRoom,
    getRoomById,
    roomExists,
    validatePassword,
    deleteRoom,
    getAllRooms,
    getRoomCount,
    updateRoomActivity,
    incrementUserCount,
    decrementUserCount,
    deleteInactiveRooms,
    updateDefaultPermissions
};