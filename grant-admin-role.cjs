const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://psbbrezasrwjjqppgtok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmJyZXphc3J3ampxcHBndG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc1NTUsImV4cCI6MjA4MzgyMzU1NX0.1nOFLMDzFYI2tgxfNTCPalnFVIDI2hNauY7ZIgKrpGA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function grantAdminRole() {
  console.log('🔧 Granting Admin Role...\n');
  
  const email = 'admin@ricostacosatelier.com';
  const password = 'Ricostacos25';
  const userId = 'b17d386f-029f-4d5f-97e5-ef8c129aa873';
  
  // Sign in first to get a valid session
  console.log('Step 1: Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (signInError) {
    console.log('❌ Sign in failed:', signInError.message);
    return;
  }
  
  console.log('✅ Signed in successfully\n');
  
  // Try to use bootstrap_admin function
  console.log('Step 2: Calling bootstrap_admin...');
  const { data: bootstrapData, error: bootstrapError } = await supabase.rpc('bootstrap_admin');
  
  if (bootstrapError) {
    console.log('⚠️  Bootstrap failed:', bootstrapError.message);
    console.log('   Trying direct insert...\n');
    
    // Try direct insert
    console.log('Step 3: Direct insert into user_roles...');
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('\n⚠️  Please run this SQL in Supabase SQL Editor:');
      console.log(`   INSERT INTO user_roles (user_id, role) VALUES ('${userId}', 'admin') ON CONFLICT (user_id, role) DO NOTHING;`);
    } else {
      console.log('✅ Admin role granted successfully!\n');
    }
  } else {
    console.log('✅ Admin role granted via bootstrap!');
    console.log('   Result:', bootstrapData);
  }
  
  // Verify the role was added
  console.log('\nStep 4: Verifying role...');
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);
  
  if (roleError) {
    console.log('❌ Could not verify role:', roleError.message);
  } else if (roles && roles.length > 0) {
    console.log('✅ Roles found:', roles.map(r => r.role).join(', '));
  } else {
    console.log('⚠️  No roles found - manual intervention required');
  }
  
  console.log('\n✅ Process Complete!');
  console.log('   Please refresh the dashboard to see admin access');
}

grantAdminRole().catch(console.error);
