/**
 * Database Seeder - Generates test data for development
 * Usage: npm run db:seed
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to create Supabase Auth user
async function createAuthUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      created_via_seed: true,
    },
  });

  if (error) {
    console.error(`Failed to create auth user ${email}:`, error.message);
    return null;
  }

  return data.user?.id;
}

// Helper to insert user profile
async function createUserProfile(
  id: string,
  name: string,
  phone: string,
  email: string,
  role: 'admin' | 'member' = 'member',
) {
  const { error } = await supabase
    .from('users')
    .insert({
      id,
      name,
      phone,
      email,
      role,
      balance: 0,
      is_active: true,
    });

  if (error) {
    console.error(`Failed to create user profile for ${email}:`, error.message);
    return false;
  }

  return true;
}

// Helper to create a month
async function createMonth(monthYear: string) {
  const { data, error } = await supabase
    .from('months')
    .insert({
      month_year: monthYear,
      status: 'open',
      total_shuttlecock_expense: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Failed to create month ${monthYear}:`, error.message);
    return null;
  }

  return data?.id;
}

// Helper to create a session
async function createSession(
  monthId: number,
  date: string,
  courtExpense: number,
  payerUserId: string,
  notes?: string,
) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      month_id: monthId,
      session_date: date,
      court_expense_amount: courtExpense,
      payer_user_id: payerUserId,
      notes,
    })
    .select('id')
    .single();

  if (error) {
    console.error(`Failed to create session:`, error.message);
    return null;
  }

  return data?.id;
}

// Helper to record attendance
async function recordAttendance(sessionId: number, userId: string, isAttended: boolean) {
  const { error } = await supabase
    .from('session_attendance')
    .upsert({
      session_id: sessionId,
      user_id: userId,
      is_attended: isAttended,
    });

  if (error) {
    console.error(`Failed to record attendance:`, error.message);
    return false;
  }

  return true;
}

// Helper to add shuttlecock purchase
async function addShuttlecockPurchase(
  monthId: number,
  date: string,
  quantity: number,
  unitPrice: number,
  buyerUserId: string,
  notes?: string,
) {
  const { error } = await supabase
    .from('shuttlecock_details')
    .insert({
      month_id: monthId,
      purchase_date: date,
      quantity,
      unit_price: unitPrice,
      buyer_user_id: buyerUserId,
      notes,
    });

  if (error) {
    console.error(`Failed to add shuttlecock purchase:`, error.message);
    return false;
  }

  return true;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  // ============================================================================
  // Create Test Users
  // ============================================================================

  console.log('👥 Creating test users...');

  const testUsers = [
    { email: 'admin@caulongclb.local', password: 'Admin@123456', name: 'Quản trị viên', phone: '0901000001', role: 'admin' as const },
    { email: 'long@caulongclb.local', password: 'Long@123456', name: 'Bùi Long', phone: '0901000002', role: 'member' as const },
    { email: 'hung@caulongclb.local', password: 'Hung@123456', name: 'Hoa Kỳ Hùng', phone: '0901000003', role: 'member' as const },
    { email: 'duc@caulongclb.local', password: 'Duc@123456', name: 'Trần Mạnh Đức', phone: '0901000004', role: 'member' as const },
    { email: 'minh@caulongclb.local', password: 'Minh@123456', name: 'Nguyễn Minh', phone: '0901000005', role: 'member' as const },
    { email: 'tuan@caulongclb.local', password: 'Tuan@123456', name: 'Đỗ Thanh Tuấn', phone: '0901000006', role: 'member' as const },
  ];

  const userMap: Record<string, string> = {};

  for (const user of testUsers) {
    const userId = await createAuthUser(user.email, user.password);
    if (userId) {
      const created = await createUserProfile(userId, user.name, user.phone, user.email, user.role);
      if (created) {
        userMap[user.email] = userId;
        console.log(`  ✓ ${user.name} (${user.email}) [${user.role}]`);
      }
    }
  }

  console.log();

  // ============================================================================
  // Create Months
  // ============================================================================

  console.log('📅 Creating billing cycles...');

  const monthMap: Record<string, number> = {};

  const months = ['2025-01-01', '2025-02-01', '2025-03-01'];

  for (const monthYear of months) {
    const monthId = await createMonth(monthYear);
    if (monthId) {
      monthMap[monthYear] = monthId;
      console.log(`  ✓ ${monthYear}`);
    }
  }

  console.log();

  // ============================================================================
  // Create Sessions for January 2025
  // ============================================================================

  console.log('🎾 Creating sessions for January 2025...');

  const januaryMonthId = monthMap['2025-01-01'];
  const adminUserId = userMap['admin@caulongclb.local'];
  const longUserId = userMap['long@caulongclb.local'];
  const hungUserId = userMap['hung@caulongclb.local'];
  const ducUserId = userMap['duc@caulongclb.local'];
  const minhUserId = userMap['minh@caulongclb.local'];
  const tuanUserId = userMap['tuan@caulongclb.local'];

  if (januaryMonthId) {
    // Session 1: Jan 4, 2025
    const session1 = await createSession(januaryMonthId, '2025-01-04', 200000, adminUserId, 'Buổi sân 1');

    if (session1) {
      console.log('  ✓ Session 1 (Jan 4) - Court: 200,000 VND');
      // Record attendance
      for (const userId of [adminUserId, longUserId, hungUserId, ducUserId]) {
        await recordAttendance(session1, userId, true);
      }
      await recordAttendance(session1, minhUserId, false);
      await recordAttendance(session1, tuanUserId, false);
    }

    // Session 2: Jan 11, 2025
    const session2 = await createSession(januaryMonthId, '2025-01-11', 220000, longUserId, 'Buổi sân 2');

    if (session2) {
      console.log('  ✓ Session 2 (Jan 11) - Court: 220,000 VND');
      for (const userId of [longUserId, hungUserId, ducUserId, minhUserId]) {
        await recordAttendance(session2, userId, true);
      }
      await recordAttendance(session2, adminUserId, true);
      await recordAttendance(session2, tuanUserId, false);
    }

    // Session 3: Jan 18, 2025
    const session3 = await createSession(januaryMonthId, '2025-01-18', 200000, hungUserId, 'Buổi sân 3');

    if (session3) {
      console.log('  ✓ Session 3 (Jan 18) - Court: 200,000 VND');
      for (const userId of [hungUserId, ducUserId, minhUserId, tuanUserId]) {
        await recordAttendance(session3, userId, true);
      }
      await recordAttendance(session3, adminUserId, true);
      await recordAttendance(session3, longUserId, false);
    }

    // Session 4: Jan 25, 2025
    const session4 = await createSession(januaryMonthId, '2025-01-25', 210000, ducUserId, 'Buổi sân 4');

    if (session4) {
      console.log('  ✓ Session 4 (Jan 25) - Court: 210,000 VND');
      for (const userId of [adminUserId, longUserId, hungUserId, ducUserId, minhUserId]) {
        await recordAttendance(session4, userId, true);
      }
      await recordAttendance(session4, tuanUserId, false);
    }
  }

  console.log();

  // ============================================================================
  // Add Shuttlecock Purchases
  // ============================================================================

  console.log('🏸 Adding shuttlecock purchases...');

  if (januaryMonthId && adminUserId) {
    await addShuttlecockPurchase(
      januaryMonthId,
      '2025-01-01',
      5,
      150000,
      adminUserId,
      'Victor Badminton 2000W - 5 cái',
    );
    console.log('  ✓ Purchase 1: 5 shuttles × 150,000 VND');

    await addShuttlecockPurchase(
      januaryMonthId,
      '2025-01-15',
      3,
      140000,
      longUserId,
      'Yonex Mavis 350 - 3 cái',
    );
    console.log('  ✓ Purchase 2: 3 shuttles × 140,000 VND');
  }

  console.log();

  // ============================================================================
  // Seed Summary
  // ============================================================================

  console.log('✅ Seeding Complete!\n');
  console.log('📊 Summary:');
  console.log(`  • Users created: ${Object.keys(userMap).length}`);
  console.log(`  • Months created: ${Object.keys(monthMap).length}`);
  console.log(`  • Sessions created: 4`);
  console.log(`  • Shuttlecock purchases: 2`);
  console.log();
  console.log('🔑 Test Credentials:');
  console.log('  Admin:  admin@caulongclb.local / Admin@123456');
  console.log('  Member: long@caulongclb.local / Long@123456');
  console.log();
  console.log('🚀 Next Steps:');
  console.log('  1. Start dev server: npm run dev');
  console.log('  2. Login at: http://localhost:3000/login');
  console.log('  3. Check dashboard: http://localhost:3000/dashboard');
}

// Main execution
seedDatabase()
  .then(() => {
    console.log('🎉 Database seeding finished successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
