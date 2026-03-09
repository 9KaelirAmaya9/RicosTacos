-- ═══════════════════════════════════════════════════════════════════
-- FINAL PRODUCTION SETUP - Run this in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/psbbrezasrwjjqppgtok/sql/new
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Grant admin role to albertijan@gmail.com
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'albertijan@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Create janalberti@live.com if doesn't exist (manual step required)
-- You need to create this user in Supabase Dashboard > Authentication > Users
-- Email: janalberti@live.com
-- Password: Ricostacos25
-- Auto Confirm: YES

-- Step 3: After creating janalberti@live.com, grant admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'janalberti@live.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Verify both admins have roles
SELECT 
  u.email,
  u.id as user_id,
  u.email_confirmed_at,
  COALESCE(ARRAY_AGG(ur.role), ARRAY[]::text[]) as roles
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('albertijan@gmail.com', 'janalberti@live.com')
GROUP BY u.id, u.email, u.email_confirmed_at;

-- Expected Result:
-- albertijan@gmail.com should show role: {admin}
-- janalberti@live.com should show role: {admin} (after user creation)
