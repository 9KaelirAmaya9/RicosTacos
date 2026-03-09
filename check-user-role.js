// Check if user has admin role
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkUserRole() {
  const email = 'albertijan@gmail.com';
  
  console.log('🔍 Checking roles for:', email);
  console.log('');
  
  // Check user_roles table
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .limit(100);
  
  if (error) {
    console.error('❌ Error fetching roles:', error.message);
    return;
  }
  
  console.log('📊 All roles in database:');
  console.table(roles);
  
  console.log('\n💡 To assign admin role, run this SQL in Supabase Dashboard:');
  console.log('─'.repeat(60));
  console.log(`INSERT INTO public.user_roles (user_id, role)`);
  console.log(`SELECT id, 'admin' FROM auth.users WHERE email = '${email}'`);
  console.log(`ON CONFLICT DO NOTHING;`);
  console.log('─'.repeat(60));
}

checkUserRole();
