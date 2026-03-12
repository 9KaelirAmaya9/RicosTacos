-- Fix user_roles RLS so authenticated users can read their own roles.
-- The previous migration (20251125000001_fix_recursion.sql) replaced the
-- "Users can view their own roles" policy with an admin-only policy, which
-- means non-admin users (and the auth check itself) can never read their own
-- roles — causing the Dashboard/ProtectedRoute to always see an empty roles
-- array and redirect back to /signin.
--
-- Root cause: The final state of user_roles policies only allows admins to
-- SELECT. A user who just signed in is authenticated but the RLS check calls
-- has_role() which queries user_roles — but the user can't read user_roles
-- because they're not yet confirmed as admin. Classic chicken-and-egg.
--
-- Fix: Restore the "Users can view their own roles" policy so every
-- authenticated user can always read their own row(s).

-- Drop the admin-only SELECT policy added by fix_recursion migration
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Users can always read their own roles (needed for auth checks)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read ALL roles (for admin dashboard)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Admins can manage (insert/update/delete) all roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);
