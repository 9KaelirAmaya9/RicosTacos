const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zburfinoxmfasqvxtnln.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYmJyZXphc3J3ampxcHBndG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI0NzU1NSwiZXhwIjoyMDgzODIzNTU1fQ.QWAlv8GhzYouJWpN3rdZOrECw9prOjak3nxcpuMTVrs';

// Admin client with service role
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupAdmins() {
  console.log('🚀 PRODUCTION ADMIN SETUP\n');
  
  const admins = [
    { email: 'janalberti@live.com', password: 'Ricostacos25' },
    { email: 'albertijan@gmail.com', password: 'Ricostacos25' }
  ];

  for (const user of admins) {
    console.log(`\n📧 ${user.email}`);
    console.log('─'.repeat(60));
    
    try {
      // Create or update user with email confirmed
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.email.split('@')[0] }
      });

      let userId;
      
      if (authError?.message?.includes('already')) {
        console.log('   ℹ️  User exists, fetching ID...');
        const { data: { users } } = await admin.auth.admin.listUsers();
        const existing = users.find(u => u.email === user.email);
        
        if (!existing) {
          console.log('   ❌ Could not find user');
          continue;
        }
        
        userId = existing.id;
        console.log(`   ✅ User ID: ${userId}`);
        
        // Update password to ensure it's correct
        await admin.auth.admin.updateUserById(userId, { password: user.password });
        console.log('   ✅ Password updated');
        
      } else if (authError) {
        console.log(`   ❌ Error: ${authError.message}`);
        continue;
      } else {
        userId = authData.user.id;
        console.log(`   ✅ Created - ID: ${userId}`);
      }

      // Grant admin role (upsert to avoid conflicts)
      const { error: roleError } = await admin
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.log(`   ❌ Role error: ${roleError.message}`);
      } else {
        console.log('   ✅ Admin role granted');
      }

      // Verify
      const { data: roles } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      console.log(`   📋 Roles: ${roles?.map(r => r.role).join(', ') || 'none'}`);

    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ SETUP COMPLETE\n');
  console.log('Both admins can now login at /signin with password: Ricostacos25');
  console.log('Dashboard will show Admin Panel for both users');
}

setupAdmins();
