const { query } = require('../config/db');
const bcrypt = require('bcrypt');

const checkEmailExists = async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
};

const addUser = async (email, password_hash, nom = null) => {
    const result = await query(
        `INSERT INTO users 
         (email, password_hash, nom, abonnement, stripeCustomerId, stripeSubscriptionId, stripe_price_id, subscription_status, subscription_current_period_end, trial_end, created_at) 
         VALUES ($1, $2, $3, false, NULL, NULL, NULL, NULL, NULL, NULL, NOW()) 
         RETURNING id, email, nom, abonnement, stripeCustomerId, stripeSubscriptionId, stripe_price_id, subscription_status, subscription_current_period_end, trial_end, created_at`,
        [email, password_hash, nom]
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

const getUserBySubscriptionId = async (subscriptionId) => {
    const result = await query('SELECT * FROM users WHERE stripeSubscriptionId = $1', [subscriptionId]);
    return result.rows[0] || null;
};

const updateSubscription = async (userId, abonnement, subscriptionId, priceId, status, periodEnd) => {
    const result = await query(
        `UPDATE users 
         SET abonnement = $2, 
             stripeSubscriptionId = $3,
             stripe_price_id = $4,
             subscription_status = $5,
             subscription_current_period_end = to_timestamp($6)
         WHERE id = $1
         RETURNING *`,
        [userId, abonnement, subscriptionId, priceId, status, periodEnd]
    );
    return result.rows[0];
};

const updateStripeCustomerId = async (userId, customerId) => {
    const result = await query(
        `UPDATE users SET stripeCustomerId = $1 WHERE id = $2 RETURNING *`,
        [customerId, userId]
    );
    return result.rows[0];
};

const updateUserField = async (userId, field, value) => {
    // On sécurise le champ pour éviter l'injection SQL
    const allowedFields = ['nom', 'email', 'password_hash'];
    if (!allowedFields.includes(field)) {
        throw new Error('Champ non autorisé');
    }

    const result = await query(
        `UPDATE users 
         SET ${field} = $1
         WHERE id = $2
         RETURNING id, email, nom`,
        [value, userId]
    );

    return result.rows[0];
};

const deleteUser = async (userId) => {
    const result = await query(
        `DELETE FROM users WHERE id = $1 RETURNING id, email, nom`,
        [userId]
    );
    return result.rows[0]; // renvoie null si pas trouvé
};



module.exports = {
    checkEmailExists,
    addUser,
    getUserByEmail,
    getUserById,
    getUserBySubscriptionId,
    updateSubscription,
    updateStripeCustomerId,
    updateUserField,
    deleteUser
};
