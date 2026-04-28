const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function resetNotesTable() {
    try {
        console.log('🗑️  Suppression de la table user_notes...');
        await pool.query('DROP TABLE IF EXISTS user_notes;');
        console.log('✅ Table supprimée');

        console.log('🔧 Création de la nouvelle table...');
        await pool.query(`
            CREATE TABLE user_notes (
              id SERIAL PRIMARY KEY,
              user_id VARCHAR(255) NOT NULL,
              hashtag VARCHAR(255) NOT NULL,
              username VARCHAR(255),
              content JSONB NOT NULL DEFAULT '[]'::jsonb,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW(),
              UNIQUE(user_id, hashtag)
            );

            CREATE INDEX idx_user_notes_user ON user_notes(user_id);
            CREATE INDEX idx_user_notes_hashtag ON user_notes(hashtag);
        `);
        console.log('✅ Nouvelle table créée avec succès');

        // Vérifier la structure
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'user_notes'
            ORDER BY ordinal_position;
        `);
        console.log('\n📋 Structure de la table:');
        console.table(result.rows);

        await pool.end();
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        process.exit(1);
    }
}

resetNotesTable();
