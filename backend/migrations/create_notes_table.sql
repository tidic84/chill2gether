DROP TABLE IF EXISTS notes;

CREATE TABLE IF NOT EXISTS user_notes (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notes_room_user ON user_notes(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_hashtags ON user_notes USING GIN(hashtags);
