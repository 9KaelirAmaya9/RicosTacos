const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://psbbrezasrwjjqppgtok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmJyZXphc3J3ampxcHBndG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDc1NTUsImV4cCI6MjA4MzgyMzU1NX0.1nOFLMDzFYI2tgxfNTCPalnFVIDI2hNauY7ZIgKrpGA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseAuth() {
  console.log('🔍 Diagnosing Supabase Auth Configuration...\n');
  
  // Test 1: Check if we can connect to Supabase
  console.log('Test 1: Connection Test');
  try {
    const { data, error } = await supabase.from('user_roles').select('count').limit(1);
    if (error) {
      console.log('❌ Connection issue:', error.message);
    } else {
      console.log('✅ Connected to Supabase successfully');
    }
  } catch (e) {
    console.log('❌ Connection failed:', e.message);
  }
  
  // Test 2: Try to get current session
  console.log('\nTest 2: Session Check');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Session error:', error.message);
    } else if (session) {
      console.log('✅ Active session found for:', session.user.email);
    } else {
      console.log('ℹ️  No active session (not logged in)');
    }
  } catch (e) {
    console.log('❌ Session check failed:', e.message);
  }
  
  // Test 3: Try to sign in with test credentials
  console.log('\nTest 3: Sign In Test');
  console.log('Attempting to sign in with test@example.com...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('❌ Sign in failed:', error.message);
      console.log('   Error code:', error.status);
      console.log('   Full error:', JSON.stringify(error, null, 2));
      
      if (error.status === 500) {
        console.log('\n⚠️  500 ERROR DETECTED - This is a Supabase server issue');
        console.log('   Possible causes:');
        console.log('   1. Email confirmation is required but not configured');
        console.log('   2. Auth schema not properly initialized');
        console.log('   3. Email provider not configured');
        console.log('   4. User doesn\'t exist in the database');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log('   User:', data.user.email);
    }
  } catch (e) {
    console.log('❌ Sign in test failed:', e.message);
  }
  
  // Test 4: Try to sign up a new user
  console.log('\nTest 4: Sign Up Test');
  const testEmail = `test-${Date.now()}@example.com`;
  console.log(`Attempting to create new user: ${testEmail}...`);
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: {
          name: 'Test User'
        }
      }
    });
    
    if (error) {
      console.log('❌ Sign up failed:', error.message);
      console.log('   Error code:', error.status);
    } else if (data.user) {
      console.log('✅ Sign up successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No (needs confirmation)');
      
      if (!data.user.email_confirmed_at && data.user.confirmation_sent_at) {
        console.log('   ⚠️  Confirmation email was sent - check your Supabase email settings');
      }
    }
  } catch (e) {
    console.log('❌ Sign up test failed:', e.message);
  }
}

diagnoseAuth().catch(console.error);
