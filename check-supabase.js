// Check Supabase Database Status
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database...\n');
  console.log(`📍 Project URL: ${supabaseUrl}\n`);

  try {
    // Check if we can connect
    console.log('1️⃣ Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('❌ Orders table does NOT exist');
      console.log('   → Database appears to be empty or not set up\n');
      return { exists: true, hasData: false, hasTables: false };
    }

    console.log('✅ Connection successful\n');

    // Check tables exist
    console.log('2️⃣ Checking tables...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);
    
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .limit(1);

    console.log(`   Orders table: ${ordersError ? '❌ Missing' : '✅ Exists'}`);
    console.log(`   User_roles table: ${rolesError ? '❌ Missing' : '✅ Exists'}\n`);

    // Check for data
    console.log('3️⃣ Checking for existing data...');
    
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Orders in database: ${orderCount || 0}`);

    // Check for admin user
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');

    console.log(`   Admin users: ${adminRoles ? adminRoles.length : 0}\n`);

    // Check auth (requires service key, so we'll note this)
    console.log('4️⃣ Auth users check:');
    console.log('   ⚠️  Cannot check auth.users with anon key');
    console.log('   → You need to check manually in Supabase Dashboard\n');

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════════');
    
    if (!ordersError && !rolesError) {
      console.log('✅ Database schema exists (tables are set up)');
      console.log(`✅ ${orderCount || 0} orders in database`);
      console.log(`${adminRoles && adminRoles.length > 0 ? '✅' : '⚠️ '} ${adminRoles ? adminRoles.length : 0} admin role(s) assigned`);
      
      if (adminRoles && adminRoles.length === 0) {
        console.log('\n⚠️  WARNING: No admin users found!');
        console.log('   → You need to create an admin user');
      }
      
      console.log('\n📝 Next Steps:');
      console.log('1. Go to: https://supabase.com/dashboard/project/kivdqjyvahabsgqtszie/auth/users');
      console.log('2. Check if admin user exists (janalberti@live.com)');
      console.log('3. If not, create the admin user');
    } else {
      console.log('❌ Database schema is incomplete or missing');
      console.log('\n📝 You need to:');
      console.log('1. Run migrations to set up database schema');
      console.log('2. Or reconnect to Lovable to get fresh database');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.log('\n💡 This could mean:');
    console.log('   - Supabase project doesn\'t exist');
    console.log('   - Invalid credentials');
    console.log('   - Network issue');
  }
}

checkDatabase();
