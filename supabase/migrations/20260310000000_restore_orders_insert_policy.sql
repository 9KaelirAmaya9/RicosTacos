-- Restore the INSERT policy for orders that was dropped by 20260309000000_fix_anonymous_rls_policy.sql
-- That migration dropped "Anyone can create orders" without creating a replacement,
-- leaving no INSERT policy on the orders table, which blocks all order creation.

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
