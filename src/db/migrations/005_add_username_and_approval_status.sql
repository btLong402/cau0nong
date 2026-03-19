-- ============================================================================
-- Migration 005: Add username and approval workflow for user accounts
-- - Allow login by username/password
-- - New self-registered users must be approved by admin before access
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(50),
  ADD COLUMN IF NOT EXISTS approval_status user_approval_status NOT NULL DEFAULT 'approved';

-- Backfill username from email local-part for existing rows that do not have it.
UPDATE users
SET username = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'))
WHERE username IS NULL;

-- Resolve any duplicate username after backfill by appending user ID suffix.
WITH duplicates AS (
  SELECT username
  FROM users
  GROUP BY username
  HAVING COUNT(*) > 1
), ranked AS (
  SELECT
    u.id,
    u.username,
    ROW_NUMBER() OVER (PARTITION BY u.username ORDER BY u.created_at, u.id) AS rn
  FROM users u
  INNER JOIN duplicates d ON d.username = u.username
)
UPDATE users u
SET username = CONCAT(r.username, '_', LEFT(REPLACE(u.id::text, '-', ''), 6))
FROM ranked r
WHERE u.id = r.id
  AND r.rn > 1;

-- Ensure usernames are present and unique.
ALTER TABLE users
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);

COMMENT ON COLUMN users.username IS 'Unique username used for username/password login';
COMMENT ON COLUMN users.approval_status IS 'Account approval workflow status controlled by admin';