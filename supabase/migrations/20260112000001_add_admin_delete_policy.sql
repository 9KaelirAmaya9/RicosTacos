-- Add DELETE policy for admin users to reset orders
-- This allows authenticated admin users to delete orders using their session

CREATE POLICY "Admins can delete all orders"
ON public.orders
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);
