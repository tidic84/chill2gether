const { query } = require('../config/db');

/**
 * Script pour réinitialiser les compteurs d'utilisateurs
 * À exécuter si vous suspectez des incohérences dans les compteurs
 */
async function resetUserCounts() {
    console.log('=== Réinitialisation des compteurs utilisateurs ===\n');

    try {
        // 1. Vérifier l'état actuel
        const beforeResult = await query(
            `SELECT COUNT(*) as total_rooms,
                    SUM(user_count) as total_users,
                    COUNT(*) FILTER (WHERE user_count > 0) as rooms_with_users
             FROM room`
        );

        const before = beforeResult.rows[0];
        console.log('État AVANT réinitialisation:');
        console.log(`  - Total salles: ${before.total_rooms}`);
        console.log(`  - Total utilisateurs (DB): ${before.total_users || 0}`);
        console.log(`  - Salles avec utilisateurs: ${before.rooms_with_users}\n`);

        // 2. Afficher les salles qui vont être affectées
        const affectedRooms = await query(
            `SELECT id, user_count,
                    EXTRACT(EPOCH FROM (NOW() - last_activity)) / 3600 as hours_inactive
             FROM room
             WHERE user_count > 0
             ORDER BY user_count DESC`
        );

        if (affectedRooms.rows.length > 0) {
            console.log('Salles affectées (user_count sera mis à 0):');
            for (const room of affectedRooms.rows) {
                console.log(`  - ${room.id}: ${room.user_count} utilisateurs, inactive depuis ${Math.round(room.hours_inactive * 10) / 10}h`);
            }
            console.log('');
        }

        // 3. Demander confirmation (dans un contexte automatisé, on peut skip)
        console.log('⚠️  Cette opération va mettre user_count = 0 pour toutes les salles.');
        console.log('⚠️  Assurez-vous que le serveur est arrêté ou qu\'aucun utilisateur n\'est réellement connecté.\n');

        // 4. Réinitialiser tous les compteurs
        console.log('Réinitialisation en cours...');
        const resetResult = await query(
            'UPDATE room SET user_count = 0 WHERE user_count > 0 RETURNING id'
        );

        console.log(`✓ ${resetResult.rowCount} salle(s) mise(s) à jour\n`);

        // 5. Vérifier l'état après
        const afterResult = await query(
            `SELECT COUNT(*) as total_rooms,
                    SUM(user_count) as total_users,
                    COUNT(*) FILTER (WHERE user_count > 0) as rooms_with_users
             FROM room`
        );

        const after = afterResult.rows[0];
        console.log('État APRÈS réinitialisation:');
        console.log(`  - Total salles: ${after.total_rooms}`);
        console.log(`  - Total utilisateurs (DB): ${after.total_users || 0}`);
        console.log(`  - Salles avec utilisateurs: ${after.rooms_with_users}\n`);

        console.log('=== Réinitialisation terminée ===');
        console.log('Le nettoyage automatique pourra maintenant supprimer les salles inactives.');

    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
    } finally {
        process.exit(0);
    }
}

resetUserCounts();
