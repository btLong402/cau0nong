-- Add status column to sessions table
-- Defaults to 'open'
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'status') THEN
        ALTER TABLE sessions ADD COLUMN status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed'));
    END IF;
END $$;
