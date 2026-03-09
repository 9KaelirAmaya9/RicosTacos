-- Drop all existing RLS policies on orders table to start fresh
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anonymous order creation" ON public.orders;
DROP POLICY IF EXISTS "Allow order viewing with verification" ON public.orders;
DROP POLICY IF EXISTS "Kitchen staff can update orders" ON public.orders;
DROP POLICY IF EXISTS "Kitchen staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create secure RLS policies for orders table
-- Allow users to view their own orders (authenticated users)
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Allow admin users to view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow kitchen staff to view pending/preparing orders
CREATE POLICY "Kitchen can view active orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'kitchen') AND status IN ('pending', 'preparing', 'ready')
);

-- Allow anonymous users to view orders (for order tracking)
CREATE POLICY "Anonymous can view orders"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Allow admin users to update all orders
CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow kitchen staff to update order status
CREATE POLICY "Kitchen can update order status"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'kitchen')
)
WITH CHECK (
  public.has_role(auth.uid(), 'kitchen')
);

-- Allow authenticated users to update their own orders
CREATE POLICY "Users can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
);

-- Allow order insertion for both authenticated and anonymous users
CREATE POLICY "Allow order creation"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);