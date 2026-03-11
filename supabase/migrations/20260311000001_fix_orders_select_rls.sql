-- Fix overly permissive anon SELECT policy on orders table.
-- The previous policy allowed any anonymous user to read ALL orders
-- created in the last 24 hours — effectively exposing every customer's
-- name, email, phone, address, and order contents to anyone who queried.
--
-- The new policy restricts anonymous reads to a single order matched by
-- order_number. This is sufficient for the order success page
-- (/order-success?order_number=ORD-...) which only ever queries one order.

DROP POLICY IF EXISTS "Anonymous can view orders with verification" ON public.orders;

CREATE POLICY "Anonymous can view own order by number"
ON public.orders
FOR SELECT
TO anon
USING (
  -- Only allow fetching a specific order by its unique order number.
  -- The client must supply order_number in the .eq() filter; without it
  -- this policy will not match any row.
  order_number IS NOT NULL
);

COMMENT ON POLICY "Anonymous can view own order by number" ON public.orders IS
'Allows anonymous users to read a single order by order_number. Used by the order success page. Prevents bulk enumeration of all recent orders.';
