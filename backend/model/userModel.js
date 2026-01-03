const { query } = require('../config/db');
const bcrypt = require('bcrypt');

const checkEmailExists = async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
};

const addUser = async (email, password, username) => {
    const result = await query(
        `INSERT INTO users
         (email, password, username,created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, email, username, created_at`,
        [email, password, username]
    );
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
};

const getUserById = async (id) => {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
};

const updateUserField = async (userId, field, value) => {
    // On sécurise le champ pour éviter l'injection SQL
    const allowedFields = ['email', 'password', "username"];
    if (!allowedFields.includes(field)) {
        throw new Error('Champ non autorisé');
    }

    const result = await query(
        `UPDATE users
         SET ${field} = $1
         WHERE id = $2
         RETURNING id, email`,
        [value, userId]
    );

    return result.rows[0];
};

const deleteUser = async (userId) => {
    const result = await query(
        `DELETE FROM users WHERE id = $1 RETURNING id, email`,
        [userId]
    );
    return result.rows[0]; // renvoie null si pas trouvé
};



module.exports = {
    checkEmailExists,
    addUser,
    getUserByEmail,
    getUserById,
    updateUserField,
    deleteUser
};
