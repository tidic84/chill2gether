-- Migration: Correction de last_activity pour les anciennes salles
-- Date: 2026-01-02
-- Description: Met à jour last_activity des anciennes salles pour utiliser created_at
--              au lieu de NOW(), permettant au nettoyage automatique de fonctionner

-- Pour les salles créées il y a plus de 1 jour et dont last_activity est très récent
-- (probablement mis à NOW() lors de la migration précédente),
-- on remet last_activity = created_at
UPDATE room
SET last_activity = created_at::timestamp
WHERE created_at < CURRENT_DATE - INTERVAL '1 day'
  AND last_activity > CURRENT_TIMESTAMP - INTERVAL '1 day';

-- Afficher un résumé
DO $$
DECLARE
    affected_count INTEGER;
    empty_inactive_count INTEGER;
    old_inactive_count INTEGER;
BEGIN
    -- Compter les salles affectées
    SELECT COUNT(*) INTO affected_count
    FROM room
    WHERE created_at < CURRENT_DATE - INTERVAL '1 day'
      AND last_activity = created_at::timestamp;

    -- Compter les salles qui seront nettoyées par règle 1
    SELECT COUNT(*) INTO empty_inactive_count
    FROM room
    WHERE user_count = 0
      AND last_activity < NOW() - INTERVAL '1 hour';

    -- Compter les salles qui seront nettoyées par règle 2
    SELECT COUNT(*) INTO old_inactive_count
    FROM room
    WHERE last_activity < NOW() - INTERVAL '1 day';

    RAISE NOTICE '=== Résumé de la migration ===';
    RAISE NOTICE 'Salles dont last_activity a été corrigé: %', affected_count;
    RAISE NOTICE 'Salles vides + >1h inactif (règle 1): %', empty_inactive_count;
    RAISE NOTICE 'Salles >1 jour inactif (règle 2): %', old_inactive_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Ces salles seront supprimées lors du prochain nettoyage automatique (toutes les heures).';
END $$;
