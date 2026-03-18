/**
 * Database Reset Script
 * Clears all data (including Auth users) and re-seeds the database.
 * Usage: npm run db:reset
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { seedDatabase } from './seed';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function performReset() {
  console.log('🚀 Starting Full Database Reset...\n');

  try {
    console.log('🗑️ Step 1: Clearing public tables data...');
    
    // Ordered to respect foreign keys (child first, then parent)
    const tables = [
      'vietqr_payments',
      'monthly_settlements',
      'shuttlecock_details',
      'session_attendance',
      'sessions',
      'event_participants',
      'events',
      'videos',
      'months',
      'users'
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('created_at', '1970-01-01');
      
      if (error) {
        console.warn(`   ⚠️ Warning clearing ${table}: ${error.message}`);
      } else {
        console.log(`   ✓ Cleared data from ${table}`);
      }
    }

    // 2. Delete all Auth Users
    console.log('\n👥 Step 2: Deleting all Auth users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    if (users.length > 0) {
      console.log(`   Found ${users.length} users. Deleting...`);
      for (const user of users) {
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
        if (delError) {
          console.error(`   ⚠️ Failed to delete user ${user.email}: ${delError.message}`);
        } else {
          console.log(`   ✓ Deleted auth user: ${user.email}`);
        }
      }
      console.log('   ✓ Cleanup of auth users finished.');
    } else {
      console.log('   No users found to delete.');
    }

    console.log('\n🌱 Step 3: Running seeder...');
    await seedDatabase();

    console.log('\n✨ Database fully reset and seeded!');
  } catch (error) {
    console.error('\n❌ Reset failed:', error);
    process.exit(1);
  }
}

performReset();
