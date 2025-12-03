-- Migration: Ajout du tracking d'activité pour les rooms
-- Date: 2025-12-03
-- Description: Ajoute les colonnes nécessaires pour tracker l'activité des rooms
--              et permettre la suppression automatique des rooms inactives

-- Ajouter la colonne last_activity (dernière activité)
ALTER TABLE room ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP NOT NULL DEFAULT NOW();

-- Ajouter la colonne user_count (nombre d'utilisateurs actuellement dans la room)
ALTER TABLE room ADD COLUMN IF NOT EXISTS user_count INTEGER NOT NULL DEFAULT 0;

-- Créer un index sur last_activity pour optimiser les requêtes de nettoyage
CREATE INDEX IF NOT EXISTS idx_room_last_activity ON room(last_activity);

-- Créer un index sur user_count pour optimiser les requêtes de nettoyage
CREATE INDEX IF NOT EXISTS idx_room_user_count ON room(user_count);

-- Mettre à jour les rooms existantes pour initialiser last_activity à created_at
UPDATE room SET last_activity = created_at WHERE last_activity IS NULL;

COMMENT ON COLUMN room.last_activity IS 'Timestamp de la dernière activité dans la room (join, message, etc.)';
COMMENT ON COLUMN room.user_count IS 'Nombre d''utilisateurs actuellement connectés dans la room';
