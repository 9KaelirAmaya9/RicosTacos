-- Add policy to admin_users to prevent direct client queries
-- Only admins can view the admin_users table (for legacy compatibility)
CREATE POLICY "Only admins can view admin_users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));