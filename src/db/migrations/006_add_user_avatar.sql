-- Migration 006: Add avatar support for users
-- - Add avatar_url field to user profile

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_users_avatar_url ON users(avatar_url);
