// Check orders table setup to diagnose timeout
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function testOrderCreation() {
  console.log('🔍 Testing order creation...\n');
  
  const testOrder = {
    order_number: `TEST-${Date.now()}`,
    customer_name: 'Test Customer',
    customer_email: 'test@test.com',
    customer_phone: '5551234567',
    order_type: 'pickup',
    items: [],
    subtotal: 10.00,
    tax: 0.89,
    total: 10.89,
    status: 'pending'
  };
  
  console.log('📝 Test order data:', testOrder);
  console.log('\n⏱️ Starting insert...');
  
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();
    
    const elapsed = Date.now() - startTime;
    
    if (error) {
      console.error('\n❌ INSERT FAILED');
      console.error('Error:', error);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      console.error('Hint:', error.hint);
    } else {
      console.log(`\n✅ INSERT SUCCESSFUL (${elapsed}ms)`);
      console.log('Data:', data);
      
      // Clean up test order
      if (data && data[0]) {
        await supabase
          .from('orders')
          .delete()
          .eq('id', data[0].id);
        console.log('🧹 Test order cleaned up');
      }
    }
  } catch (e) {
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ EXCEPTION after ${elapsed}ms:`, e);
  }
}

testOrderCreation();
