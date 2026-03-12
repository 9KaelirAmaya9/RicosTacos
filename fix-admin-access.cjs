const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zburfinoxmfasqvxtnln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmJyZXphc3J3ampxcHBndG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc1NTUsImV4cCI6MjA4MzgyMzU1NX0.1nOFLMDzFYI2tgxfNTCPalnFVIDI2hNauY7ZIgKrpGA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAILS = [
  'janalberti@live.com',
  'albertijan@gmail.com',
  'admin@ricostacosatelier.com'
];

async function fixAdminAccess() {
  console.log('🔧 Fixing Admin Access for Multiple Users\n');
  
  // Step 1: Sign in as one of the admin users to get auth token
  console.log('Step 1: Checking user accounts...\n');
  
  for (const email of ADMIN_EMAILS) {
    console.log(`\n📧 Processing: ${email}`);
    console.log('─'.repeat(60));
    
    // Try to sign in with a common password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: 'Ricostacos25'
    });
    
    if (signInError) {
      console.log(`❌ Cannot sign in as ${email}: ${signInError.message}`);
      console.log(`   Please ensure this user exists and password is correct`);
      continue;
    }
    
    const userId = signInData.user.id;
    console.log(`✅ Signed in successfully`);
    console.log(`   User ID: ${userId}`);
    
    // Check current roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (rolesError) {
      console.log(`⚠️  Could not check roles: ${rolesError.message}`);
    } else {
      const currentRoles = roles.map(r => r.role);
      console.log(`   Current roles: ${currentRoles.length > 0 ? currentRoles.join(', ') : 'None'}`);
      
      if (currentRoles.includes('admin')) {
        console.log(`   ✅ Already has admin role`);
        continue;
      }
    }
    
    // Grant admin role
    console.log(`   Granting admin role...`);
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });
    
    if (insertError) {
      if (insertError.code === '23505') { // Duplicate key
        console.log(`   ✅ Admin role already exists`);
      } else {
        console.log(`   ❌ Failed to grant admin: ${insertError.message}`);
        console.log(`\n   📋 Run this SQL manually:`);
        console.log(`   INSERT INTO user_roles (user_id, role)`);
        console.log(`   VALUES ('${userId}', 'admin')`);
        console.log(`   ON CONFLICT (user_id, role) DO NOTHING;`);
      }
    } else {
      console.log(`   ✅ Admin role granted successfully!`);
    }
    
    // Verify
    const { data: verifyRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (verifyRoles) {
      console.log(`   Final roles: ${verifyRoles.map(r => r.role).join(', ')}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Process Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Each admin should sign in with their email and password');
  console.log('2. They will be redirected to /dashboard');
  console.log('3. Dashboard will show "Admin Panel" card');
  console.log('4. Click "Admin Panel" to access admin features');
  console.log('\n🔐 Default Password: Ricostacos25');
  console.log('   (Users can change this in their profile)');
}

fixAdminAccess().catch(console.error);
