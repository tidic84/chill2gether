const { Pool } = require('pg');
require('dotenv').config(); // Charge les variables d'environnement depuis un fichier .env

// Configuration de la connexion PostgreSQL via un pool de connexions
// Les valeurs proviennent des variables d'environnement pour sécuriser les infos sensibles
const pool = new Pool({
    host: process.env.DB_HOST,       // Adresse du serveur PostgreSQL
    port: process.env.DB_PORT,       // Port (par défaut : 5432)
    user: process.env.DB_USER,       // Nom d'utilisateur PostgreSQL
    password: process.env.DB_PASSWORD, // Mot de passe
    database: process.env.DB_NAME    // Nom de la base de données
});

// Test de connexion initiale pour vérifier que la base est bien accessible
pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

// Fonction d'exécution des requêtes SQL réutilisable dans tout le projet
// Usage : await db.query('SELECT * FROM table WHERE id = $1', [id]);
const query = (text, params) => pool.query(text, params);

// Export de la fonction query pour être utilisée dans les modèles
module.exports = { query };
