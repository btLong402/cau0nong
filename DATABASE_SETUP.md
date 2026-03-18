# Database Setup Guide

## Overview

This guide walks you through setting up the CLB Cầu Lông database in Supabase.

## Prerequisites

- Supabase Account (free tier is sufficient)
- `.env.local` file with Supabase credentials
- Access to Supabase Dashboard

## Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select existing project
3. Go to **Settings** → **API**
4. Copy the following:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon (public)` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role (secret)` → `SUPABASE_SERVICE_ROLE_KEY`

5. Create/update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Step 2: Apply Database Schema

### Option A: Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content of: `src/db/migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click **Run** (or press `Ctrl+Enter`)
7. Wait for completion (should see ✓ icons for each statement)

**Expected Output:**
- 8 tables created (users, months, sessions, session_attendance, shuttlecock_details, monthly_settlements, vietqr_payments, events)
- 11 indexes created
- Row Level Security (RLS) policies applied
- 4 triggers created

### Option B: Command Line (Advanced)

```bash
# 1. Install Supabase CLI
curl -fsSL https://get.supabase.io | bash

# 2. Login to Supabase
supabase login

# 3. Link your project
supabase link --project-ref your-project-id

# 4. Push migrations
supabase push
```

## Step 3: Verify Schema Creation

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - ✓ users
   - ✓ months
   - ✓ sessions
   - ✓ session_attendance
   - ✓ shuttlecock_details
   - ✓ monthly_settlements
   - ✓ vietqr_payments
   - ✓ events

3. Click on **Auth** in left sidebar → **Users**
4. You should see no users yet (we'll seed data next)

## Step 4: Seed Test Data

### Prerequisites

```bash
npm install ts-node
```

### Run Seeder

```bash
npm run db:seed
```

**What it creates:**
- 6 test users (1 admin + 5 members)
- 3 months (Jan, Feb, Mar 2025)
- 4 badminton sessions in January
- 2 shuttlecock purchases
- Attendance records for all sessions

### Test Credentials

After seeding, use these to login:

| Email | Password | Role |
| --- | --- | --- |
| admin@caulongclb.local | Admin@123456 | Admin |
| long@caulongclb.local | Long@123456 | Member |
| hung@caulongclb.local | Hung@123456 | Member |
| duc@caulongclb.local | Duc@123456 | Member |
| minh@caulongclb.local | Minh@123456 | Member |
| tuan@caulongclb.local | Tuan@123456 | Member |

## Step 5: Verify Data

1. In Supabase Dashboard → **Table Editor**
2. Click **users** table → Should see 6 rows
3. Click **months** table → Should see 3 rows
4. Click **sessions** table → Should see 4 rows
5. Click **session_attendance** table → Should see 18-20 rows

## Step 6: Test API Endpoints

Start development server:
```bash
npm run dev
```

Test auth endpoint:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "timestamp": "2025-01-15T10:30:45.123Z",
    "environment": "development"
  },
  "traceId": "trace-123..."
}
```

## Troubleshooting

### Issue: "Permission denied" on RLS policies

**Solution:** Make sure you're logged in with Supabase as authenticated user.

```bash
# Test with auth token
curl -H "Authorization: Bearer <JWT_TOKEN>" \
  http://localhost:3000/api/me
```

### Issue: "Seeder fails with auth error"

**Solution:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`:

```bash
# Check if env exists
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

### Issue: "Foreign key constraint violation"

**Solution:** Tables may have been created with different order. Delete all tables and re-run migration:

1. Go to **SQL Editor**
2. Run this cleanup script:
```sql
-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS vietqr_payments CASCADE;
DROP TABLE IF EXISTS monthly_settlements CASCADE;
DROP TABLE IF EXISTS shuttlecock_details CASCADE;
DROP TABLE IF EXISTS session_attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS months CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_total_shuttlecock_expense CASCADE;
DROP FUNCTION IF EXISTS update_user_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_month_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_session_updated_at CASCADE;
```

3. Re-run the initial schema migration

### Issue: "User creation fails with 'Email already exists'"

**Solution:** Users might already be seeded. Delete existing auth users:

1. Go to **Auth** → **Users** in Supabase Dashboard
2. Select each test user and click **Delete user**
3. Run `npm run db:seed` again

## Schema Overview

```
users ←─┐
  │     │
  ├─────┴──→ months
  │         ├────→ sessions
  │         │      └────→ session_attendance
  │         │
  │         ├────→ shuttlecock_details
  │         │
  │         └────→ monthly_settlements ←────→ vietqr_payments
  │
  └────────→ events
```

## File Structure

```
src/db/
├── schema.md                    # This documentation
├── migrations/
│   └── 001_initial_schema.sql   # Database DDL
├── seed.ts                      # Test data generator
└── apply-migrations.sh          # Helper script
```

## Next Steps

1. ✅ Database schema created
2. ✅ RLS policies configured
3. ✅ Test data seeded
4. → Create API routes (Phase 1e)
5. → Build dashboard UI (Phase 1f)
6. → Add client hooks (Phase 1g)

## References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Schema Design](./schema.md)
