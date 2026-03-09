const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kivdqjyvahabsgqtszie.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('Error: VITE_SUPABASE_PUBLISHABLE_KEY not set');
  console.log('Please set your Supabase key:');
  console.log('export VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFix() {
  console.log('🔧 Applying admin role fix...\n');
  
  // Read the SQL file
  const fs = require('fs');
  const sql = fs.readFileSync('./APPLY_ADMIN_FIX.sql', 'utf8');
  
  // Execute via RPC or direct query
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error:', error);
    console.log('\n⚠️  Please run this SQL manually in Supabase Dashboard');
  } else {
    console.log('✅ Fix applied successfully!');
    console.log('Data:', data);
  }
  
  // Verify admins
  console.log('\n📊 Verifying admin roles...');
  const { data: admins, error: adminError } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .eq('role', 'admin');
    
  if (adminError) {
    console.error('Error checking admins:', adminError);
  } else {
    console.log(`\nAdmin count: ${admins.length}`);
    console.log('Admins:', admins);
  }
}

runFix().catch(console.error);
