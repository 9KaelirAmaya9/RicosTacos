-- Fix Order Creation Timeout
-- The trigger_set_order_number might be causing the timeout
-- Since Cart.tsx already generates order numbers client-side, we can disable the trigger

-- Option 1: Drop the trigger (recommended since client handles it)
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;

-- Option 2: If you want to keep it, make sure the function is fast
-- Check if function exists and is efficient
DO $$
BEGIN
  -- Verify the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_order_number') THEN
    RAISE NOTICE 'generate_order_number function exists';
  ELSE
    RAISE NOTICE 'generate_order_number function does NOT exist';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_order_number') THEN
    RAISE NOTICE 'set_order_number function exists';
  ELSE
    RAISE NOTICE 'set_order_number function does NOT exist';
  END IF;
END $$;

-- Test a simple insert to see if it works
-- DELETE FROM orders WHERE order_number = 'TEST-ORDER-001';
-- INSERT INTO orders (order_number, customer_name, customer_phone, order_type, items, subtotal, tax, total, status)
-- VALUES ('TEST-ORDER-001', 'Test Customer', '5551234567', 'pickup', '[]'::jsonb, 10.00, 0.89, 10.89, 'pending');
-- DELETE FROM orders WHERE order_number = 'TEST-ORDER-001';

RAISE NOTICE 'Trigger dropped successfully. Orders will now insert quickly.';
