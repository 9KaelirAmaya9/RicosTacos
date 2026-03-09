// Exactly mimic what the browser does
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function mimicBrowserInsert() {
  console.log('🔍 Mimicking exact browser insert...\n');
  
  // Exact same data structure as Cart.tsx
  const cart = [
    {
      id: "1",
      name: "Test Taco",
      price: 3.50,
      quantity: 2,
      category: "tacos"
    }
  ];
  
  const orderNumber = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const orderDataToInsert = {
    order_number: orderNumber,
    user_id: null,  // Guest checkout
    customer_name: "Test Customer",
    customer_email: "test@test.com",
    customer_phone: "5551234567",
    order_type: "pickup",
    delivery_address: null,
    items: cart,  // Array of items
    subtotal: 7.00,
    tax: 0.62,
    total: 7.62,
    notes: null,
    status: "pending",
  };
  
  console.log('📝 Order data to insert:', {
    order_number: orderDataToInsert.order_number,
    items_count: cart.length,
    has_user_id: !!orderDataToInsert.user_id
  });
  
  console.log('\n⏱️ Starting insert (same as browser)...\n');
  
  const startTime = Date.now();
  let intervalId;
  
  try {
    // Add heartbeat like browser does
    intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      console.log(`⏳ ${elapsed}ms elapsed...`);
      
      if (elapsed > 5000) {
        console.log('⚠️ Taking longer than 5 seconds - something is wrong!');
      }
    }, 1000);
    
    // Exact same call as browser
    const result = await supabase
      .from("orders")
      .insert([orderDataToInsert]);
    
    clearInterval(intervalId);
    const elapsed = Date.now() - startTime;
    
    if (result.error) {
      console.error(`\n❌ INSERT FAILED after ${elapsed}ms`);
      console.error('Error:', result.error);
      console.error('Code:', result.error.code);
      console.error('Message:', result.error.message);
      console.error('Details:', result.error.details);
      console.error('Hint:', result.error.hint);
    } else {
      console.log(`\n✅ INSERT SUCCESSFUL (${elapsed}ms)`);
      console.log('This means the issue is browser-specific or network-related');
      
      // Clean up
      await supabase
        .from('orders')
        .delete()
        .eq('order_number', orderNumber);
      console.log('🧹 Test order cleaned up');
    }
  } catch (e) {
    clearInterval(intervalId);
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ EXCEPTION after ${elapsed}ms:`, e);
  }
}

mimicBrowserInsert();
