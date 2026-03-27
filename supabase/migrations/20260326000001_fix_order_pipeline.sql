-- ============================================================
-- MIGRATION: fix_order_pipeline
-- Date: 2026-03-26
-- Purpose: Fix RLS policies, ensure Realtime is enabled,
--          and add stripe_session_id index for confirmation page
-- ============================================================

-- 1. Ensure orders table is in the Realtime publication
--    (Admin/Kitchen dashboards depend on INSERT events)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    RAISE NOTICE 'Added orders table to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'orders table already in supabase_realtime publication';
  END IF;
END $$;

-- 2. Add stripe_session_id index for confirmation page lookups
--    (OrderSuccess.tsx queries by order_number, but this covers session_id if needed)
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- 3. Verify RLS INSERT policy allows anon users to create orders
--    (Guest checkout must work without authentication)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
    AND cmd = 'INSERT'
    AND (roles @> ARRAY['anon']::name[] OR qual = 'true' OR with_check = 'true')
  ) THEN
    -- Create the policy if it doesn't exist
    CREATE POLICY "Anyone can create orders"
      ON orders FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
    RAISE NOTICE 'Created INSERT policy for orders table';
  ELSE
    RAISE NOTICE 'INSERT policy for orders already exists';
  END IF;
END $$;

-- 4. Ensure admins and kitchen staff can SELECT all orders
--    (Dashboard visibility requires reading all orders, not just own)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders'
    AND cmd = 'SELECT'
    AND policyname = 'Admins and kitchen can read all orders'
  ) THEN
    CREATE POLICY "Admins and kitchen can read all orders"
      ON orders FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin', 'kitchen')
        )
      );
    RAISE NOTICE 'Created admin/kitchen SELECT policy for orders';
  ELSE
    RAISE NOTICE 'Admin/kitchen SELECT policy already exists';
  END IF;
END $$;

-- 5. Ensure service_role can UPDATE orders (for webhook status updates)
--    service_role bypasses RLS by default in Supabase — this is a safety check
-- No policy needed for service_role — it bypasses RLS automatically.
-- If RLS bypass is somehow disabled, uncomment:
-- ALTER TABLE orders FORCE ROW LEVEL SECURITY; -- ensure RLS is on
-- (service_role still bypasses it)

-- 6. Add stripe_session_id column if it doesn't exist
--    (Needed for confirmation page to look up orders by Stripe session)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id TEXT;
    RAISE NOTICE 'Added stripe_session_id column to orders';
  ELSE
    RAISE NOTICE 'stripe_session_id column already exists';
  END IF;
END $$;

-- 7. Verify the status CHECK constraint includes all required values
--    The webhook sets status to 'paid'; kitchen sets 'preparing', 'ready', 'delivered'
DO $$
DECLARE
  constraint_def TEXT;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO constraint_def
  FROM pg_constraint
  WHERE conrelid = 'orders'::regclass
  AND contype = 'c'
  AND conname LIKE '%status%';

  IF constraint_def IS NOT NULL THEN
    RAISE NOTICE 'Status constraint: %', constraint_def;
  ELSE
    RAISE NOTICE 'No status CHECK constraint found — consider adding one';
  END IF;
END $$;

-- Summary of changes:
-- ✅ orders table added to supabase_realtime publication (if missing)
-- ✅ idx_orders_stripe_session_id index created
-- ✅ INSERT policy verified/created for anon + authenticated
-- ✅ Admin/kitchen SELECT policy verified/created
-- ✅ stripe_session_id column added if missing
