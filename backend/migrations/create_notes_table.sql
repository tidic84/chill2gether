DROP TABLE IF EXISTS notes;

CREATE TABLE IF NOT EXISTS user_notes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  hashtag VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, hashtag)
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_hashtag ON user_notes(hashtag);
