-- Drop the existing policy that may be too restrictive
DROP POLICY IF EXISTS "Allow order creation" ON public.orders;

-- Create a new policy that explicitly allows both authenticated and anonymous users to insert orders
CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT
WITH CHECK (true);

-- Ensure the policy for viewing orders also works for both authenticated and guest users
-- Guest users should be able to view their orders (though they won't have a user_id)
DROP POLICY IF EXISTS "Anonymous can view orders" ON public.orders;

CREATE POLICY "Anyone can view orders" ON public.orders
FOR SELECT
USING (true);