const { query } = require('../config/db');

async function getNoteByHashtag(userId, hashtag) {
    const result = await query(
        `SELECT * FROM user_notes WHERE user_id = $1 AND hashtag = $2`,
        [userId, hashtag]
    );
    return result.rows[0] || null;
}

async function saveNote(userId, username, hashtag, content) {
    const result = await query(
        `INSERT INTO user_notes (user_id, username, hashtag, content, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (user_id, hashtag)
         DO UPDATE SET content = $4, username = $2, updated_at = NOW()
         RETURNING *`,
        [userId, username, hashtag, JSON.stringify(content)]
    );
    return result.rows[0];
}

async function getAllHashtags(userId) {
    const result = await query(
        `SELECT hashtag, updated_at FROM user_notes WHERE user_id = $1 ORDER BY updated_at DESC`,
        [userId]
    );
    return result.rows;
}

async function deleteNote(userId, hashtag) {
    const result = await query(
        `DELETE FROM user_notes WHERE user_id = $1 AND hashtag = $2 RETURNING *`,
        [userId, hashtag]
    );
    return result.rows[0] || null;
}

module.exports = {
    getNoteByHashtag,
    saveNote,
    getAllHashtags,
    deleteNote
};
