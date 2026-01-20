-- ============================================================================
-- ADMIN ROLE FIX - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- Date: 2025-11-25
-- Purpose: Fix auto-admin vulnerability and ensure only albertijan and 
--          fortosopedro have admin role
-- ============================================================================

-- STEP 1: Fix the handle_new_user function (stop auto-admin assignment)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile only (NO automatic role assignment)
  INSERT INTO public.profiles (user_id, name)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  );
  
  -- New users start with NO roles by default
  -- Roles must be explicitly granted by existing admins
  
  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Creates user profile on signup. Does NOT assign roles - roles must be granted explicitly by admins.';

-- ============================================================================
-- STEP 2: Check current state BEFORE cleanup
-- ============================================================================

SELECT 'BEFORE CLEANUP - Total admins:' as status, COUNT(*) as count
FROM user_roles WHERE role = 'admin';

SELECT 'BEFORE CLEANUP - Current admin list:' as status, u.email
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.email;

-- ============================================================================
-- STEP 3: Remove admin from everyone except albertijan and fortosopedro
-- ============================================================================

DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id NOT IN (
    SELECT u.id 
    FROM auth.users u
    WHERE u.email ILIKE 'albertijan%'
       OR u.email ILIKE 'fortosopedro%'
       OR u.email = 'albertijan'
       OR u.email = 'fortosopedro'
  );

-- ============================================================================
-- STEP 4: Ensure albertijan and fortosopedro HAVE admin role
-- ============================================================================

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE (u.email ILIKE 'albertijan%' OR u.email ILIKE 'fortosopedro%')
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'admin'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================================
-- STEP 5: Verify the results
-- ============================================================================

SELECT 'AFTER CLEANUP - Total admins:' as status, COUNT(*) as count
FROM user_roles WHERE role = 'admin';

SELECT 'AFTER CLEANUP - Admin list (SHOULD ONLY BE 2):' as status, 
       u.email, 
       ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.email;

-- ============================================================================
-- VERIFICATION QUERIES - Run these to confirm
-- ============================================================================

-- Should return exactly 2
SELECT COUNT(*) as admin_count FROM user_roles WHERE role = 'admin';

-- Should list only albertijan and fortosopedro
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.email;

-- Check for any users without roles (they should get 'user' or 'kitchen' role)
SELECT u.email, COUNT(ur.id) as role_count
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.email
HAVING COUNT(ur.id) = 0;

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================
-- ✅ admin_count should be exactly 2
-- ✅ Only albertijan and fortosopedro should appear in admin list
-- ✅ handle_new_user function no longer assigns admin role
-- ============================================================================
