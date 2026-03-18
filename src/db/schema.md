# Database Schema for CLB Cầu Lông Management

## Overview

This document describes the database schema for the CLB Cầu Lông (Badminton Club) management system. The schema is designed to track members, billing cycles, sessions, attendance, and settlements.

## Table: users

Stores member profiles and information. This mirrors Supabase Auth users for easier querying.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  balance NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

**Fields:**
- `id` - UUID from Supabase Auth
- `name` - Member's full name
- `phone` - Phone number (unique, used for WhatsApp/SMS communication)
- `email` - Email address (unique, linked to Supabase Auth)
- `role` - Admin or member (determines permissions)
- `balance` - Current balance after settlements
- `is_active` - Soft delete flag (false = deactivated)
- `created_at` - Account creation timestamp
- `updated_at` - Last profile update timestamp

**RLS Policies:**
- Users can view their own profile
- Admins can view all profiles
- Users can update their own profile (not role/balance)
- Admins can update any profile

---

## Table: months

Represents billing cycles (one per month). Status transitions: open → closed.

```sql
CREATE TABLE months (
  id SERIAL PRIMARY KEY,
  month_year DATE NOT NULL UNIQUE,
  status ENUM('open', 'closed') DEFAULT 'open',
  total_shuttlecock_expense NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_months_month_year ON months(month_year);
CREATE INDEX idx_months_status ON months(status);
```

**Fields:**
- `id` - Auto-increment primary key
- `month_year` - Date (always 1st of month, e.g., 2025-03-01)
- `status` - 'open' (accepting sessions) or 'closed' (settlement calculated)
- `total_shuttlecock_expense` - Sum of shuttlecock costs for this month
- `created_at` - When cycle opened
- `updated_at` - Last update timestamp

**RLS Policies:**
- All authenticated users can read months
- Only admins can create/close months

---

## Table: sessions

Records badminton sessions (日時ごとの試合予定). Each session tracks court cost and who paid.

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  court_expense_amount NUMERIC(10,2) NOT NULL CHECK (court_expense_amount > 0),
  payer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_month_id ON sessions(month_id);
CREATE INDEX idx_sessions_session_date ON sessions(session_date);
```

**Fields:**
- `id` - Auto-increment primary key
- `month_id` - FK to months (cascade delete)
- `session_date` - Date of session (YYYY-MM-DD)
- `court_expense_amount` - Total court rental cost (must be > 0)
- `payer_user_id` - User who paid for court (tracked for reimbursement)
- `notes` - Optional notes about session
- `created_at` - When session was created
- `updated_at` - Last modification time

**RLS Policies:**
- All authenticated users can read sessions
- Only admins can create/update/delete sessions

---

## Table: session_attendance

Tracks which members attended which sessions. Used for calculating per-person court costs.

```sql
CREATE TABLE session_attendance (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_attended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

CREATE INDEX idx_attendance_session_id ON session_attendance(session_id);
CREATE INDEX idx_attendance_user_id ON session_attendance(user_id);
```

**Fields:**
- `id` - Auto-increment primary key
- `session_id` - FK to sessions (cascade delete)
- `user_id` - FK to users (cascade delete)
- `is_attended` - true/false flag
- `created_at` - When record was created
- `UNIQUE(session_id, user_id)` - One record per user per session

**RLS Policies:**
- Users can view attendance for sessions they participated in
- Admins can view/modify all attendance records

---

## Table: shuttlecock_details

Details of shuttlecock purchases for the month. Used to track equipment costs.

```sql
CREATE TABLE shuttlecock_details (
  id SERIAL PRIMARY KEY,
  month_id INTEGER NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  buyer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shuttlecock_details_month_id ON shuttlecock_details(month_id);
CREATE INDEX idx_shuttlecock_details_purchase_date ON shuttlecock_details(purchase_date);
```

**Fields:**
- `id` - Auto-increment primary key
- `month_id` - FK to months
- `purchase_date` - When shuttlecocks were purchased
- `quantity` - Number of shuttlecocks bought
- `unit_price` - Price per shuttlecock
- `buyer_user_id` - User who made the purchase
- `notes` - Optional notes
- `created_at` - Timestamp

**Note:** Sum of (quantity × unit_price) for a month = total_shuttlecock_expense in months table

**RLS Policies:**
- Users can read shuttlecock expenses for their month
- Admins can create/manage shuttlecock details

---

## Table: monthly_settlements

Pre-calculated settlement results (Phase 2). Denormalized for performance during Phase 2-3.

```sql
CREATE TABLE monthly_settlements (
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

CREATE INDEX idx_settlements_month_id ON monthly_settlements(month_id);
CREATE INDEX idx_settlements_user_id ON monthly_settlements(user_id);
CREATE INDEX idx_settlements_is_paid ON monthly_settlements(is_paid);
```

**Fields:**
- `id` - Auto-increment primary key
- `month_id` - FK to months
- `user_id` - FK to users
- `court_fee` - User's share of court costs (sum of per-session amounts)
- `shuttlecock_fee` - User's share of shuttlecock costs
- `past_debt` - Unpaid balance from previous months
- `balance_carried` - Overpayment from previous month to subtract
- `total_due` - court_fee + shuttlecock_fee + past_debt - balance_carried
- `is_paid` - Whether payment has been confirmed
- `paid_amount` - Amount actually paid
- `paid_at` - When payment was confirmed
- `created_at` - When settlement was calculated
- `updated_at` - Last update timestamp

**Status:** Not used in Phase 1 (created for Phase 2)

---

## Table: vietqr_payments

Tracks VietQR payment links and confirmations (Phase 3).

```sql
CREATE TABLE vietqr_payments (
  id SERIAL PRIMARY KEY,
  settlement_id INTEGER NOT NULL REFERENCES monthly_settlements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_content TEXT NOT NULL,
  qr_image_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vietqr_payments_settlement_id ON vietqr_payments(settlement_id);
CREATE INDEX idx_vietqr_payments_user_id ON vietqr_payments(user_id);
```

**Status:** Not used in Phase 1 (created for Phase 3)

---

## Table: events

Special events outside regular sessions (Phase 4).

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  total_support NUMERIC(10,2) DEFAULT 0,
  total_expense NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_event_date ON events(event_date);
```

**Status:** Not used in Phase 1 (created for Phase 4)

---

## Row-Level Security (RLS) Strategy

### Public Tables (readable by all authenticated users):
- `months` - Members can view billing cycles
- `sessions` - Members can view session schedules
- `events` - Members can view events

### User-scoped Tables:
- `session_attendance` - Users see only their attendance
- `shuttlecock_details` - Users see only their purchases (or admins see all)

### Admin-only Tables:
- `monthly_settlements` - Only admins create/update
- `vietqr_payments` - Only admins manage

---

## Trigger & Cascade Behaviors

### Cascading Deletes:
- Delete `months` → cascades to `sessions`
- Delete `sessions` → cascades to `session_attendance`
- Delete `users` → restricted (prevent orphaning)

### Summary Updates:
- When `shuttlecock_details` changes → recalculate `months.total_shuttlecock_expense`
- When `session_attendance` changes → recalculate monthly participation counts

---

## Indexes

All indexes are created for:
- Foreign key relationships (month_id, user_id, etc.)
- Frequent filter columns (status, is_active, is_paid, role)
- Date columns (for sorting/filtering by date)

---

## Future Enhancements

- **Audit table**: Track changes to critical records (who changed what, when)
- **Notifications table**: Store sent notifications
- **Balances denormalization**: Pre-calculate balances in users table for faster queries
- **Historical snapshots**: Store monthly snapshots for year-end reporting
