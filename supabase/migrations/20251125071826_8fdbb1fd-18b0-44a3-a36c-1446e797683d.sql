-- Fix Kitchen RLS policy to include 'paid' status orders
-- This allows kitchen staff to see orders that have been paid but not yet marked ready

DROP POLICY IF EXISTS "Kitchen can view active orders" ON orders;

CREATE POLICY "Kitchen can view active orders" 
ON orders 
FOR SELECT 
USING (
  has_role(auth.uid(), 'kitchen'::app_role) 
  AND status IN ('pending', 'preparing', 'ready', 'paid')
);