# Admin Profile Remediation Plan
**Date**: November 25, 2025  
**Priority**: CRITICAL  
**Estimated Time**: 2-4 hours implementation + 1-2 hours testing

---

## Overview

This document provides step-by-step instructions to fix the admin profile malfunction and restore proper access control. Follow these steps in order to ensure safe remediation.

**⚠️ WARNING**: These changes affect authentication and authorization. Test thoroughly before deploying to production.

---

## Pre-Remediation Checklist

Before starting, ensure you have:

- [ ] Database backup completed
- [ ] List of legitimate admin user emails
- [ ] Access to Supabase dashboard or database CLI
- [ ] Development environment for testing
- [ ] Ability to revert changes if needed
- [ ] Scheduled maintenance window (if production)

---

## Phase 1: Immediate Security Lockdown

**Goal**: Stop new users from getting automatic admin access

### Step 1.1: Create Emergency Migration

Create file: `supabase/migrations/20251125193000_fix_auto_admin_vulnerability.sql`

```sql
-- CRITICAL FIX: Remove auto-admin assignment from handle_new_user trigger
-- This restores proper security by only creating profiles, not admin roles

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

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Creates user profile on signup. Does NOT assign roles - roles must be granted explicitly by admins.';
```

### Step 1.2: Apply Migration

**Via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Paste the migration content
3. Click "Run"
4. Verify: "Success. No rows returned"

**Via CLI:**
```bash
cd la-taco-atelier
supabase db push
```

**Via direct psql:**
```bash
psql "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
  -f supabase/migrations/20251125193000_fix_auto_admin_vulnerability.sql
```

### Step 1.3: Verify Fix

Test that new users don't get admin:

```sql
-- Check the function definition
SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure);

-- Should NOT contain: INSERT INTO public.user_roles
```

**🎉 Immediate threat neutralized** - New users will no longer get automatic admin access.

---

## Phase 2: Audit Existing Users

**Goal**: Identify legitimate admins vs auto-assigned admins

### Step 2.1: Generate Admin Audit Report

```sql
-- List all current admins with creation dates
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  ur.created_at as role_created,
  CASE 
    WHEN ur.created_at - u.created_at < INTERVAL '5 seconds' 
    THEN '🚨 Auto-assigned'
    ELSE '✅ Manual'
  END as assignment_type
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.created_at;
```

### Step 2.2: Export to Review

Save results to CSV for review:

```sql
\copy (SELECT u.email, u.created_at, ur.created_at, (ur.created_at - u.created_at < INTERVAL '5 seconds') as is_auto_assigned FROM auth.users u JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role = 'admin' ORDER BY u.created_at) TO '/tmp/admin_audit.csv' WITH CSV HEADER;
```

### Step 2.3: Identify Legitimate Admins

Manually review and create a list of legitimate admins:

```plaintext
LEGITIMATE ADMINS (keep these):
- admin@ricostacos.com (owner)
- manager@ricostacos.com (manager)
- kitchen@ricostacos.com (kitchen staff with admin)

AUTO-ASSIGNED ADMINS (revoke these):
- customer1@example.com
- customer2@example.com
- ...
```

---

## Phase 3: Role Cleanup

**Goal**: Remove admin role from non-legitimate users

### Step 3.1: Create Cleanup Migration

Create file: `supabase/migrations/20251125193100_cleanup_auto_assigned_admins.sql`

```sql
-- Cleanup auto-assigned admin roles
-- IMPORTANT: Customize this with your legitimate admin emails!

-- Create a temporary table with legitimate admins
CREATE TEMP TABLE legitimate_admins (email TEXT);

-- INSERT YOUR LEGITIMATE ADMIN EMAILS HERE
INSERT INTO legitimate_admins (email) VALUES
  ('admin@ricostacos.com'),
  ('manager@ricostacos.com'),
  ('kitchen@ricostacos.com');
  -- Add more as needed

-- Remove admin role from users NOT in the legitimate list
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id NOT IN (
    SELECT u.id 
    FROM auth.users u
    JOIN legitimate_admins la ON u.email = la.email
  );

-- Log the cleanup
DO $$
DECLARE
  removed_count INTEGER;
BEGIN
  GET DIAGNOSTICS removed_count = ROW_COUNT;
  RAISE NOTICE 'Removed admin role from % users', removed_count;
END $$;

-- Verify legitimate admins still have access
SELECT u.email, ur.role
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

### Step 3.2: Review Before Applying

**⚠️ CRITICAL**: Review the legitimate_admins list carefully!

```sql
-- DRY RUN: See what would be removed (don't delete yet)
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
  AND u.id NOT IN (
    SELECT u2.id 
    FROM auth.users u2
    WHERE u2.email IN (
      'admin@ricostacos.com',
      'manager@ricostacos.com',
      'kitchen@ricostacos.com'
    )
  );
```

### Step 3.3: Apply Cleanup

Once verified, run the cleanup migration:

```bash
psql "your-connection-string" \
  -f supabase/migrations/20251125193100_cleanup_auto_assigned_admins.sql
```

### Step 3.4: Verify Cleanup

```sql
-- Count remaining admins (should match your legitimate list)
SELECT COUNT(*) FROM user_roles WHERE role = 'admin';

-- List remaining admins
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

---

## Phase 4: Implement Proper Admin Management

**Goal**: Create secure workflow for assigning admin roles

### Step 4.1: Create Admin Assignment Function

Create file: `supabase/migrations/20251125193200_admin_assignment_workflow.sql`

```sql
-- Secure function to assign admin role
-- Only existing admins can grant admin to others

CREATE OR REPLACE FUNCTION public.grant_admin_role(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can grant admin role';
  END IF;
  
  -- Grant admin role to target user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  RAISE NOTICE 'Admin role granted to user % by %', target_user_id, auth.uid();
  
  RETURN TRUE;
END;
$$;

-- Similar function to revoke admin
CREATE OR REPLACE FUNCTION public.revoke_admin_role(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can revoke admin role';
  END IF;
  
  -- Prevent revoking the last admin
  IF (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'Cannot revoke the last admin';
  END IF;
  
  -- Revoke admin role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'admin';
  
  -- Log the action
  RAISE NOTICE 'Admin role revoked from user % by %', target_user_id, auth.uid();
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.grant_admin_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_role TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.grant_admin_role IS 
  'Allows admins to grant admin role to other users. Includes authorization check.';
COMMENT ON FUNCTION public.revoke_admin_role IS 
  'Allows admins to revoke admin role. Prevents removing the last admin.';
```

### Step 4.2: Create User Role Assignment

Create file: `supabase/migrations/20251125193300_default_user_role.sql`

```sql
-- Assign 'user' role to users who don't have any role
-- This ensures everyone has at least basic user role

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Log how many users got the default role
DO $$
DECLARE
  assigned_count INTEGER;
BEGIN
  GET DIAGNOSTICS assigned_count = ROW_COUNT;
  RAISE NOTICE 'Assigned default user role to % users', assigned_count;
END $$;
```

---

## Phase 5: Update Frontend Code

**Goal**: Remove unnecessary fallbacks now that database is secure

### Step 5.1: Simplify ProtectedRoute.tsx

Update `src/components/ProtectedRoute.tsx`:

```typescript
// Remove bootstrap_admin fallback since it's no longer needed
// Remove complex fallback chains - trust the database now

// BEFORE: Multiple fallbacks
// AFTER: Simple, direct role check

useEffect(() => {
  const checkAuthAndRole = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setIsAuthenticated(false);
      return;
    }
    
    setIsAuthenticated(true);
    
    if (!requiredRole) {
      setHasRole(true);
      return;
    }
    
    // Use RPC function for role check (bypasses RLS)
    const { data: userHasRole } = await supabase.rpc('has_role', {
      _user_id: session.user.id,
      _role: requiredRole
    });
    
    // Admins can access kitchen
    if (!userHasRole && requiredRole === 'kitchen') {
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });
      setHasRole(isAdmin || false);
    } else {
      setHasRole(userHasRole || false);
    }
  };
  
  checkAuthAndRole();
}, [requiredRole]);
```

### Step 5.2: Update Role Management UI

Ensure `src/components/admin/RoleManagement.tsx` uses the new functions:

```typescript
// Use RPC functions for role management
const handleAddRole = async (userId: string, role: string) => {
  if (role === 'admin') {
    const { error } = await supabase.rpc('grant_admin_role', {
      target_user_id: userId
    });
    if (error) throw error;
  } else {
    // Direct insert for non-admin roles
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: role as AppRole });
    if (error) throw error;
  }
};
```

---

## Phase 6: Testing

**Goal**: Verify all fixes work correctly

### Test 6.1: New User Signup

```bash
# Test creating a new user doesn't give admin
# 1. Create new test account
# 2. Check roles:

SELECT u.email, ur.role 
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'newtest@example.com';

# Expected: Should show 'user' role or NULL, NOT 'admin'
```

### Test 6.2: Admin Access Control

```bash
# Test admin can access admin pages
# 1. Login as legitimate admin
# 2. Navigate to /admin
# Expected: ✅ Access granted

# 3. Login as regular user
# 4. Try to navigate to /admin
# Expected: ❌ Access denied
```

### Test 6.3: Role Assignment

```sql
-- Test granting admin role
SELECT public.grant_admin_role('user-uuid-here');

-- Verify role was granted
SELECT * FROM user_roles WHERE user_id = 'user-uuid-here';

-- Test revoking admin role
SELECT public.revoke_admin_role('user-uuid-here');

-- Verify role was revoked
SELECT * FROM user_roles WHERE user_id = 'user-uuid-here';
```

### Test 6.4: Last Admin Protection

```sql
-- Try to revoke the last admin (should fail)
SELECT public.revoke_admin_role('last-admin-uuid');

-- Expected: ERROR: Cannot revoke the last admin
```

---

## Phase 7: Documentation & Monitoring

**Goal**: Prevent future issues

### Step 7.1: Document New Workflow

Create `ADMIN_ROLE_MANAGEMENT.md`:

```markdown
# Admin Role Management

## Creating Admin Users

1. User creates account normally
2. Existing admin logs into `/admin/roles`
3. Admin selects user and assigns 'admin' role
4. New admin can now access admin features

## Assigning Roles via SQL

Only use this for initial setup or emergencies:

```sql
-- Grant admin role
SELECT public.grant_admin_role('user-uuid');

-- Grant kitchen role
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid', 'kitchen');
```

## Security Notes

- Never auto-assign admin role
- Always maintain at least one admin
- Audit admin list monthly
- Remove admin from departed staff
```

### Step 7.2: Add Monitoring

Create alerts for unusual admin activity:

```sql
-- Create audit log table (optional)
CREATE TABLE IF NOT EXISTS admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify grant/revoke functions to log actions
-- (Add INSERT INTO admin_action_log inside the functions)
```

### Step 7.3: Set Up Alerts

Configure monitoring for:
- Admin count exceeds expected number
- Multiple admin role grants in short time
- Admin role granted to just-created user
- Last admin role revocation attempt

---

## Rollback Plan

If something goes wrong:

### Rollback Step 1: Restore handle_new_user

```sql
-- Temporarily restore auto-admin (development only!)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (new.id, COALESCE(...));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'admin');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Rollback Step 2: Restore Admin Roles

```sql
-- If cleanup removed wrong users, restore from backup
-- Assuming you have a backup table:
INSERT INTO user_roles (user_id, role)
SELECT user_id, role FROM user_roles_backup
WHERE role = 'admin'
ON CONFLICT DO NOTHING;
```

---

## Post-Remediation Checklist

After completing all steps:

- [ ] New user signup doesn't grant admin
- [ ] Legitimate admins can still access admin pages
- [ ] Regular users cannot access admin pages
- [ ] Role management UI works correctly
- [ ] Frontend code simplified (fallbacks removed)
- [ ] Admin assignment functions work
- [ ] Last admin protection works
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Team notified of changes
- [ ] Backup of working state created

---

## Timeline

**Recommended Schedule:**

- **Hour 0-1**: Phase 1 (Emergency fix) + Phase 2 (Audit)
- **Hour 1-2**: Phase 3 (Cleanup) + Phase 4 (New functions)
- **Hour 2-3**: Phase 5 (Frontend updates) + Phase 6 (Testing)
- **Hour 3-4**: Phase 7 (Documentation) + Final verification

**Total**: ~4 hours

---

## Support & Questions

If you encounter issues during remediation:

1. Check error messages carefully
2. Verify you're connected to the correct database
3. Ensure you have admin privileges on the database
4. Review the diagnostic report for context
5. Test changes on development environment first

---

## Success Criteria

Remediation is complete when:

✅ No new users receive automatic admin role  
✅ Only legitimate admins have admin access  
✅ Role management works through proper workflow  
✅ Frontend doesn't rely on workarounds  
✅ Security audit passes  
✅ Documentation is updated  
✅ Team is trained on new workflow  

---

**Document Version**: 1.0  
**Last Updated**: November 25, 2025  
**Status**: Ready for Implementation
