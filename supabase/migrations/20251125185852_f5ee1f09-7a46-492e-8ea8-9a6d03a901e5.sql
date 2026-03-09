-- Fix ProtectedRoute hanging issue by optimizing RLS policies and indexes

-- 1. Add index for faster role lookups (critical for performance)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- 2. Drop existing restrictive policies that might cause hangs
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- 3. Create optimized RLS policies
-- Allow users to view their own roles (simpler, faster policy)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to view all roles (non-recursive using security definer function)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Ensure bootstrap_admin function is accessible to all authenticated users
GRANT EXECUTE ON FUNCTION public.bootstrap_admin TO authenticated;

-- 5. Add explicit permissions on user_roles table for authenticated users
GRANT SELECT ON public.user_roles TO authenticated;