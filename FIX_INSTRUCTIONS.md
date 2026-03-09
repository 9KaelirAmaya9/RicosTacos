# 🚨 URGENT: Admin Role Fix Instructions

**Date**: November 25, 2025  
**Time Estimate**: 5-10 minutes  
**Critical**: Apply immediately to fix security vulnerability

---

## Problem Summary

The database is automatically assigning admin role to ALL new users. We need to:
1. Stop the auto-assignment
2. Remove admin from everyone except **albertijan** and **fortosopedro**
3. Verify the fix worked

---

## 📋 Quick Fix Steps

### Option 1: Using Supabase Dashboard (RECOMMENDED - Easiest)

1. **Go to Supabase Dashboard**
   - Open https://app.supabase.com
   - Select your project (Ricos Tacos)
   - Click **SQL Editor** in the left sidebar

2. **Run the Fix Script**
   - Click **New Query**
   - Copy ALL contents from `APPLY_ADMIN_FIX.sql` (in this directory)
   - Paste into the SQL editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

3. **Review the Output**
   - You should see:
     - "BEFORE CLEANUP" showing how many admins existed
     - "AFTER CLEANUP" showing only 2 admins
     - Final verification showing only albertijan and fortosopedro

4. **Confirm Success**
   - Admin count should be exactly **2**
   - Only **albertijan** and **fortosopedro** should appear

### Option 2: Using Local Supabase CLI

```bash
cd la-taco-atelier

# Link to your project (if not already linked)
npx supabase link --project-ref kivdqjyvahabsgqtszie

# Apply the migrations
npx supabase db push

# Or run the SQL file directly
npx supabase db execute -f APPLY_ADMIN_FIX.sql
```

---

## ✅ Verification Steps

After running the fix, verify everything is correct:

### 1. Check Admin Count

Run this in SQL Editor:

```sql
SELECT COUNT(*) as admin_count 
FROM user_roles 
WHERE role = 'admin';
```

**Expected Result**: `admin_count = 2`

### 2. List Current Admins

```sql
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.email;
```

**Expected Result**: Only these two emails:
- albertijan (or albertijan@...)
- fortosopedro (or fortosopedro@...)

### 3. Test New User Signup

Create a test account:
- Go to your app
- Sign up with a new test email (e.g., test@example.com)
- Then run this query:

```sql
SELECT u.email, ur.role
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'test@example.com';
```

**Expected Result**: The test user should have NO role or 'user' role, NOT 'admin'

### 4. Test Admin Access

**Test as albertijan or fortosopedro:**
- Login to your app
- Navigate to `/admin`
- Should have full access ✅

**Test as regular user:**
- Login with test account
- Try to navigate to `/admin`
- Should be denied access ❌

---

## 🔍 Troubleshooting

### Issue: "No admins found after cleanup"

If somehow both albertijan and fortosopedro were removed, manually add them back:

```sql
-- Replace 'user-id-here' with actual user ID
INSERT INTO user_roles (user_id, role)
VALUES 
  ('albertijan-user-id', 'admin'),
  ('fortosopedro-user-id', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

To find user IDs:
```sql
SELECT id, email FROM auth.users 
WHERE email ILIKE 'albertijan%' OR email ILIKE 'fortosopedro%';
```

### Issue: "New users still getting admin"

Re-run Step 1 of the fix script to update the `handle_new_user()` function.

### Issue: "Can't access SQL Editor"

Make sure you're logged in as the project owner on Supabase dashboard.

---

## 📊 What the Fix Does

### Part 1: Fix the Trigger Function
```sql
-- BEFORE (VULNERABLE):
CREATE FUNCTION handle_new_user() ...
  INSERT INTO profiles ...
  INSERT INTO user_roles (user_id, role) VALUES (new.id, 'admin'); -- BAD!

-- AFTER (SECURE):
CREATE FUNCTION handle_new_user() ...
  INSERT INTO profiles ...
  -- No automatic role assignment!
```

### Part 2: Clean Up Roles
- Removes admin from all users
- Keeps only albertijan and fortosopedro as admins
- Others can be assigned 'kitchen' or 'user' roles as needed

---

## 🎯 Success Criteria

After applying the fix, you should confirm:

- ✅ **Exactly 2 admins**: albertijan and fortosopedro
- ✅ **New users don't get admin**: Test by creating new account
- ✅ **Admin dashboard works**: albertijan and fortosopedro can access /admin
- ✅ **Regular users blocked**: Test users cannot access /admin
- ✅ **Function is fixed**: handle_new_user() doesn't assign admin

---

## 📞 Support

If you encounter any issues:

1. Check the output from the SQL script
2. Run verification queries above
3. Review error messages carefully
4. Take note of any user emails that should be admins

---

## ⏭️ Next Steps After Fix

1. **Assign Kitchen Roles** (if needed):
   ```sql
   -- For kitchen staff members
   INSERT INTO user_roles (user_id, role)
   VALUES ('kitchen-staff-user-id', 'kitchen')
   ON CONFLICT DO NOTHING;
   ```

2. **Monitor Admin List**: Check monthly that only authorized users have admin
   ```sql
   -- Add this to your monitoring
   SELECT COUNT(*) FROM user_roles WHERE role = 'admin';
   -- Should always be 2 (unless you explicitly add more)
   ```

3. **Update Documentation**: Note in your docs that:
   - New users don't get any role by default
   - Admins must manually assign roles
   - Only albertijan and fortosopedro are permanent admins

---

## 🔒 Security Notes

- **Never auto-assign admin role** in production
- **Regularly audit admin list** (monthly recommended)
- **Document who has admin access** and why
- **Remove admin from departed team members** immediately
- **Use 'kitchen' role** for staff who only need kitchen access

---

**Priority**: CRITICAL - Apply Immediately  
**Time**: 5-10 minutes  
**Risk**: Low (script includes verification and rollback is possible)  

**Ready?** Go to Supabase Dashboard → SQL Editor → Run APPLY_ADMIN_FIX.sql
