-- Drop existing INSERT policy for orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create new policy that truly allows anyone to insert orders (including anonymous users)
CREATE POLICY "Allow anonymous order creation"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);