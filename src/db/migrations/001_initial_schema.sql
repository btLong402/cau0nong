-- ============================================================================
-- FULL DATABASE SCHEMA — CLB Cầu Lông Management System
-- Chạy toàn bộ script này trong Supabase SQL Editor
-- https://supabase.com/dashboard/project/[project-id]/sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE month_status AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- FUNCTIONS (Security Definer to avoid RLS Recursion)
-- ============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get current user's balance
CREATE OR REPLACE FUNCTION public.get_my_balance()
RETURNS NUMERIC AS $$
BEGIN
  RETURN (SELECT balance FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TABLE: users
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'member',
  balance NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- RLS for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile (except role/balance)" ON users;
CREATE POLICY "Users can update their own profile (except role/balance)"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = public.get_my_role() AND 
    balance = public.get_my_balance()
  );

DROP POLICY IF EXISTS "Admins can update any user" ON users;
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- TABLE: months
-- ============================================================================

CREATE TABLE IF NOT EXISTS months (
  id SERIAL PRIMARY KEY,
  month_year DATE NOT NULL UNIQUE,
  status month_status NOT NULL DEFAULT 'open',
  total_shuttlecock_expense NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_months_month_year ON months(month_year);
CREATE INDEX IF NOT EXISTS idx_months_status ON months(status);

ALTER TABLE months ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can read months" ON months;
CREATE POLICY "All authenticated users can read months"
  ON months FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can create months" ON months;
CREATE POLICY "Only admins can create months"
  ON months FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update months" ON months;
CREATE POLICY "Only admins can update months"
  ON months FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- TABLE: sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  court_expense_amount NUMERIC(10,2) NOT NULL CHECK (court_expense_amount > 0),
  payer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_month_id ON sessions(month_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_sessions_payer_user_id ON sessions(payer_user_id);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can read sessions" ON sessions;
CREATE POLICY "All authenticated users can read sessions"
  ON sessions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can create sessions" ON sessions;
CREATE POLICY "Only admins can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update sessions" ON sessions;
CREATE POLICY "Only admins can update sessions"
  ON sessions FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete sessions" ON sessions;
CREATE POLICY "Only admins can delete sessions"
  ON sessions FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- TABLE: session_attendance
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_attendance (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_attended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON session_attendance(user_id);

ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own attendance" ON session_attendance;
CREATE POLICY "Users can read their own attendance"
  ON session_attendance FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all attendance" ON session_attendance;
CREATE POLICY "Admins can read all attendance"
  ON session_attendance FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can write attendance" ON session_attendance;
CREATE POLICY "Only admins can write attendance"
  ON session_attendance FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update attendance" ON session_attendance;
CREATE POLICY "Only admins can update attendance"
  ON session_attendance FOR UPDATE
  USING (public.is_admin());

-- ============================================================================
-- TABLE: shuttlecock_details
-- ============================================================================

CREATE TABLE IF NOT EXISTS shuttlecock_details (
  id SERIAL PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shuttlecock_details_month_id ON shuttlecock_details(month_id);
CREATE INDEX IF NOT EXISTS idx_shuttlecock_details_purchase_date ON shuttlecock_details(purchase_date);
CREATE INDEX IF NOT EXISTS idx_shuttlecock_details_buyer_user_id ON shuttlecock_details(buyer_user_id);

ALTER TABLE shuttlecock_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can read shuttlecock details" ON shuttlecock_details;
CREATE POLICY "All authenticated users can read shuttlecock details"
  ON shuttlecock_details FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can create shuttlecock details" ON shuttlecock_details;
CREATE POLICY "Only admins can create shuttlecock details"
  ON shuttlecock_details FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update shuttlecock details" ON shuttlecock_details;
CREATE POLICY "Only admins can update shuttlecock details"
  ON shuttlecock_details FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete shuttlecock details" ON shuttlecock_details;
CREATE POLICY "Only admins can delete shuttlecock details"
  ON shuttlecock_details FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- TABLE: monthly_settlements
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_settlements (
  id SERIAL PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  court_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  shuttlecock_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  past_debt NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_carried NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_amount NUMERIC(10,2),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_settlements_month_id ON monthly_settlements(month_id);
CREATE INDEX IF NOT EXISTS idx_settlements_user_id ON monthly_settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_is_paid ON monthly_settlements(is_paid);

ALTER TABLE monthly_settlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only for settlements" ON monthly_settlements;
CREATE POLICY "Admins only for settlements"
  ON monthly_settlements FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can read their own settlements" ON monthly_settlements;
CREATE POLICY "Users can read their own settlements"
  ON monthly_settlements FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: vietqr_payments
-- ============================================================================

CREATE TABLE IF NOT EXISTS vietqr_payments (
  id SERIAL PRIMARY KEY,
  settlement_id INTEGER NOT NULL REFERENCES monthly_settlements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_content TEXT NOT NULL,
  qr_image_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vietqr_payments_settlement_id ON vietqr_payments(settlement_id);
CREATE INDEX IF NOT EXISTS idx_vietqr_payments_user_id ON vietqr_payments(user_id);

ALTER TABLE vietqr_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only for VietQR payments" ON vietqr_payments;
CREATE POLICY "Admins only for VietQR payments"
  ON vietqr_payments FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can read their own VietQR payments" ON vietqr_payments;
CREATE POLICY "Users can read their own VietQR payments"
  ON vietqr_payments FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: events
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  total_support NUMERIC(10,2) DEFAULT 0,
  total_expense NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can read events" ON events;
CREATE POLICY "All authenticated users can read events"
  ON events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage events" ON events;
CREATE POLICY "Only admins can manage events"
  ON events FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- TABLE: event_participants
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_participants (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contribution_per_person NUMERIC(10,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users can read event participants" ON event_participants;
CREATE POLICY "All authenticated users can read event participants"
  ON event_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage event participants" ON event_participants;
CREATE POLICY "Only admins can manage event participants"
  ON event_participants FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- TABLE: videos
-- ============================================================================

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  youtube_url VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read videos" ON videos;
CREATE POLICY "Anyone can read videos"
  ON videos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage videos" ON videos;
CREATE POLICY "Admins can manage videos"
  ON videos FOR ALL
  USING (public.is_admin());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: update shuttlecock expense sum when details change
CREATE OR REPLACE FUNCTION update_total_shuttlecock_expense()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE months
  SET total_shuttlecock_expense = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM shuttlecock_details
    WHERE month_id = CASE
      WHEN TG_OP = 'DELETE' THEN OLD.month_id
      ELSE NEW.month_id
    END
  )
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.month_id
    ELSE NEW.month_id
  END;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_total_shuttlecock_expense ON shuttlecock_details;
CREATE TRIGGER trigger_update_total_shuttlecock_expense
  AFTER INSERT OR UPDATE OR DELETE ON shuttlecock_details
  FOR EACH ROW
  EXECUTE FUNCTION update_total_shuttlecock_expense();

-- Trigger: update user updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_updated_at ON users;
CREATE TRIGGER trigger_update_user_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_updated_at();

-- Trigger: update month updated_at timestamp
CREATE OR REPLACE FUNCTION update_month_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_month_updated_at ON months;
CREATE TRIGGER trigger_update_month_updated_at
  BEFORE UPDATE ON months
  FOR EACH ROW
  EXECUTE FUNCTION update_month_updated_at();

-- Trigger: update session updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_updated_at ON sessions;
CREATE TRIGGER trigger_update_session_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_updated_at();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, UPDATE ON TABLE users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE months TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE session_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE shuttlecock_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE monthly_settlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE vietqr_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE event_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE videos TO authenticated;

-- Grant sequence permissions (needed for INSERT with serial columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- DONE! All 10 tables created:
-- users, months, sessions, session_attendance, shuttlecock_details,
-- monthly_settlements, vietqr_payments, events, event_participants, videos
-- ============================================================================
