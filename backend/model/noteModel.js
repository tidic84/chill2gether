const { query } = require('../config/db');

async function getNote(roomId, userId) {
    const result = await query(
        `SELECT * FROM user_notes WHERE room_id = $1 AND user_id = $2`,
        [roomId, userId]
    );
    return result.rows[0] || null;
}

async function saveNote(roomId, userId, username, content, hashtags) {
    const result = await query(
        `INSERT INTO user_notes (room_id, user_id, username, content, hashtags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (room_id, user_id)
         DO UPDATE SET content = $4, hashtags = $5, username = $3, updated_at = NOW()
         RETURNING *`,
        [roomId, userId, username, JSON.stringify(content), hashtags]
    );
    return result.rows[0];
}

module.exports = {
    getNote,
    saveNote
};
