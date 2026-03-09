-- CLEANUP: Remove admin roles from all users except legitimate admins
-- Date: 2025-11-25
-- Legitimate Admins: albertijan, fortosopedro
-- Everyone else: Remove admin role (they can have kitchen role if needed)

-- First, let's see what we're working with (for logging)
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM user_roles WHERE role = 'admin';
  RAISE NOTICE 'Current admin count: %', admin_count;
END $$;

-- Remove admin role from all users EXCEPT albertijan and fortosopedro
-- Note: This handles multiple email formats (e.g., @gmail.com, @ricostacos.com, etc.)
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

-- Log the cleanup
DO $$
DECLARE
  removed_count INTEGER;
  remaining_count INTEGER;
BEGIN
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  SELECT COUNT(*) INTO remaining_count FROM user_roles WHERE role = 'admin';
  
  RAISE NOTICE 'Removed admin role from % users', removed_count;
  RAISE NOTICE 'Remaining admin count: %', remaining_count;
END $$;

-- Verify the correct admins are in place
DO $$
DECLARE
  admin_emails TEXT;
BEGIN
  SELECT string_agg(u.email, ', ') INTO admin_emails
  FROM auth.users u
  JOIN user_roles ur ON u.id = ur.user_id
  WHERE ur.role = 'admin';
  
  RAISE NOTICE 'Current admins: %', COALESCE(admin_emails, 'NONE - CRITICAL ERROR!');
END $$;

-- If albertijan or fortosopedro don't have admin role, add it
-- (In case they were accidentally removed or never had it)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE (u.email ILIKE 'albertijan%' OR u.email ILIKE 'fortosopedro%')
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'admin'
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Final verification
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.email;
