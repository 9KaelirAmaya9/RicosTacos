-- CRITICAL: The previous anon SELECT policy used USING (order_number IS NOT NULL)
-- which evaluates to TRUE for every row in the table (order_number is NOT NULL in schema).
-- Any anonymous caller querying orders without an .eq() filter received all customer PII:
-- names, emails, phone numbers, delivery addresses, and order contents.
--
-- Fix: drop the broken policy and replace with a SECURITY DEFINER RPC function
-- that accepts an order_number parameter and returns only the matching row.
-- The orders table no longer has any anon SELECT policy — all anonymous reads
-- go through the RPC function which enforces the order_number filter server-side.

DROP POLICY IF EXISTS "Anonymous can view own order by number" ON public.orders;

-- RPC: returns a single order matched by order_number, accessible to anon callers.
-- SECURITY DEFINER bypasses RLS so the function itself can query the table,
-- but the function body enforces the filter — callers cannot broaden it.
CREATE OR REPLACE FUNCTION public.get_order_by_number(p_order_number TEXT)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE order_number = p_order_number
  LIMIT 1;
$$;

-- Revoke default PUBLIC execute, then grant only to the roles that need it
REVOKE ALL ON FUNCTION public.get_order_by_number(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_number(TEXT) TO anon, authenticated;
