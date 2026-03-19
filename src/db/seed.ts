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
async function createAuthUser(email: string, password: string, role: string = 'member') {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
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
  username: string,
  name: string,
  phone: string,
  email: string,
  role: 'admin' | 'member' = 'member',
) {
  const { error } = await supabase
    .from('users')
    .insert({
      id,
      username,
      name,
      phone,
      email,
      role,
      balance: 0,
      is_active: true,
      approval_status: 'approved',
    });

  if (error) {
    console.error(`Failed to create user profile for ${email}:`, error.message);
    return false;
  }

  return true;
}

// Unused helper functions removed for simplicity.

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  // ============================================================================
  // Create Admin User
  // ============================================================================

  console.log('👥 Creating admin user...');

  const testUsers = [
    {
      username: 'admin',
      email: 'admin@caulongclb.local',
      password: 'Admin@123456',
      name: 'Quản trị viên',
      phone: '0901000001',
      role: 'admin' as const,
    },
  ];

  const userMap: Record<string, string> = {};

  for (const user of testUsers) {
    const userId = await createAuthUser(user.email, user.password, user.role);
    if (userId) {
      const created = await createUserProfile(
        userId,
        user.username,
        user.name,
        user.phone,
        user.email,
        user.role,
      );
      if (created) {
        userMap[user.email] = userId;
        console.log(`  ✓ ${user.name} (${user.email}) [${user.role}]`);
      }
    }
  }

  console.log();

  // ============================================================================
  // Seed Summary
  // ============================================================================

  console.log('✅ Seeding Complete!\n');
  console.log('📊 Summary:');
  console.log(`  • Users created: ${Object.keys(userMap).length}`);
  console.log();
  console.log('🔑 Test Credentials:');
  console.log('  Admin:  admin@caulongclb.local / Admin@123456');
  console.log();
  console.log('🚀 Next Steps:');
  console.log('  1. Start dev server: npm run dev');
  console.log('  2. Login at: http://localhost:3000/login');
  console.log('  3. Check dashboard: http://localhost:3000/dashboard');
}

// Main execution - only if run directly
if (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Database seeding finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
