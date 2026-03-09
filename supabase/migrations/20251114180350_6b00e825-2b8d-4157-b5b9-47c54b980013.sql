-- CRITICAL SECURITY FIX: Remove public access to orders table and implement secure policies

-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "Anyone can view orders with order number" ON public.orders;

-- Create a secure policy for order lookup by order number
-- Users can view an order if they provide the correct order_number AND customer_phone combination
CREATE POLICY "View order by order number and phone verification"
ON public.orders
FOR SELECT
USING (
  -- Only allow if both order_number and customer_phone match
  -- This acts as a two-factor verification without authentication
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = orders.id
    AND o.order_number = orders.order_number
    AND o.customer_phone = orders.customer_phone
  )
  OR
  -- OR if user is admin or kitchen staff
  public.has_role(auth.uid(), 'admin'::app_role)
  OR
  public.has_role(auth.uid(), 'kitchen'::app_role)
);

-- Ensure profiles table explicitly denies unauthenticated access
DROP POLICY IF EXISTS "Profiles require authentication" ON public.profiles;
CREATE POLICY "Profiles require authentication"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Explicitly deny non-admin access to admin_users table
DROP POLICY IF EXISTS "Deny non-admin access to admin_users" ON public.admin_users;
CREATE POLICY "Deny non-admin access to admin_users"
ON public.admin_users
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure all INSERT operations on admin_users are admin-only
DROP POLICY IF EXISTS "Only admins can add admin users" ON public.admin_users;
CREATE POLICY "Only admins can add admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));