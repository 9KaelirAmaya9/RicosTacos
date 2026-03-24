-- Fix orders.status CHECK constraint to include 'paid' status.
--
-- Root cause: The original table definition only allowed:
--   ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')
-- The stripe-webhook sets status = 'paid' after payment confirmation, but
-- the DB CHECK constraint rejects it — causing orders to stay stuck at 'pending'.
--
-- This migration drops the old constraint and adds 'paid' to the allowed values.

ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'paid'));

-- Also update the Kitchen RLS policy to include 'confirmed' status
-- (belt+suspenders alongside the frontend fix already deployed)
DROP POLICY IF EXISTS "Kitchen can view active orders" ON public.orders;

CREATE POLICY "Kitchen can view active orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'kitchen')
  AND status IN ('pending', 'preparing', 'ready', 'paid', 'confirmed')
);

-- Also ensure admins can view ALL orders regardless of status
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);
