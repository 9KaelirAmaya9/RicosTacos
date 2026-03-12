const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zburfinoxmfasqvxtnln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmJyZXphc3J3ampxcHBndG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc1NTUsImV4cCI6MjA4MzgyMzU1NX0.1nOFLMDzFYI2tgxfNTCPalnFVIDI2hNauY7ZIgKrpGA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createAdminUser() {
  console.log('🔧 Creating Admin User...\n');
  
  const email = 'admin@ricostacosatelier.com';
  const password = 'Ricostacos25';
  
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}\n`);
  
  // Try to sign up
  console.log('Step 1: Creating user account...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        name: 'Admin User'
      },
      emailRedirectTo: undefined
    }
  });
  
  if (signUpError) {
    console.log('❌ Sign up error:', signUpError.message);
    
    // Try to sign in instead - user might already exist
    console.log('\nStep 2: User might exist, trying to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (signInError) {
      console.log('❌ Sign in also failed:', signInError.message);
      console.log('\n⚠️  Please create the user manually in Supabase dashboard:');
      console.log(`   1. Go to: https://supabase.com/dashboard/project/zburfinoxmfasqvxtnln/auth/users`);
      console.log(`   2. Click "Add user" -> "Create new user"`);
      console.log(`   3. Email: ${email}`);
      console.log(`   4. Password: ${password}`);
      console.log(`   5. Auto-confirm user: YES`);
      return;
    }
    
    console.log('✅ Sign in successful!');
    const userId = signInData.user.id;
    console.log(`   User ID: ${userId}\n`);
    
    // Grant admin role
    console.log('Step 3: Granting admin role...');
    const { error: roleError } = await supabase.rpc('bootstrap_admin');
    
    if (roleError) {
      console.log('⚠️  Bootstrap admin failed:', roleError.message);
      console.log('   Trying direct insert...');
      
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      
      if (insertError) {
        console.log('❌ Could not assign admin role:', insertError.message);
        console.log('\n⚠️  Please assign admin role manually in Supabase:');
        console.log(`   Run this SQL in Supabase SQL Editor:`);
        console.log(`   INSERT INTO user_roles (user_id, role) VALUES ('${userId}', 'admin') ON CONFLICT DO NOTHING;`);
      } else {
        console.log('✅ Admin role assigned successfully!');
      }
    } else {
      console.log('✅ Admin role assigned via bootstrap!');
    }
    
  } else {
    console.log('✅ User created successfully!');
    const userId = signUpData.user.id;
    console.log(`   User ID: ${userId}`);
    console.log(`   Confirmed: ${signUpData.user.email_confirmed_at ? 'Yes' : 'No'}\n`);
    
    if (!signUpData.user.email_confirmed_at) {
      console.log('⚠️  Email confirmation required. Please:');
      console.log(`   1. Go to Supabase dashboard`);
      console.log(`   2. Authentication -> Users`);
      console.log(`   3. Find user: ${email}`);
      console.log(`   4. Click "..." menu -> Confirm email`);
    }
  }
  
  console.log('\n✅ Setup Complete!');
  console.log('\n📝 Login Credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

createAdminUser().catch(console.error);
