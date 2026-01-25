# Complete Setup Guide - Fix Supabase Auth

## Issue Identified

Supabase is rejecting email signups programmatically. This is a **Supabase project configuration** issue that requires manual intervention through the dashboard.

## Step-by-Step Fix

### Step 1: Create Admin User in Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/psbbrezasrwjjqppgtok/auth/users

2. **Click "Add user" button** (top right)

3. **Select "Create new user"**

4. **Fill in the form:**
   - **Email:** `admin@ricostacosatelier.com`
   - **Password:** `Ricostacos25`
   - **Auto Confirm User:** ✅ **YES** (important!)
   - **User Metadata:** Leave empty or add `{"name": "Admin User"}`

5. **Click "Create user"**

6. **Copy the User ID** (you'll need it for the next step)
   - It looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

### Step 2: Disable Email Confirmation (Optional but Recommended for Development)

1. **Go to Authentication Settings:**
   - URL: https://supabase.com/dashboard/project/psbbrezasrwjjqppgtok/auth/settings

2. **Scroll to "Email"**

3. **Turn OFF "Enable email confirmations"**
   - This allows users to sign in immediately without email verification

4. **Click "Save"**

---

### Step 3: Grant Admin Role

**Option A: Using Supabase SQL Editor (Recommended)**

1. **Go to SQL Editor:**
   - URL: https://supabase.com/dashboard/project/psbbrezasrwjjqppgtok/sql/new

2. **Run this query** (replace `YOUR_USER_ID` with the ID from Step 1):

```sql
-- Insert admin role for the user
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify it was added
SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';
```

**Option B: Using the bootstrap function**

If the bootstrap_admin function exists, you can try signing in first, then it will automatically grant admin role to the first user.

---

### Step 4: Verify Email Validation Settings

1. **Go to Authentication Settings:**
   - URL: https://supabase.com/dashboard/project/psbbrezasrwjjqppgtok/auth/settings

2. **Check "Email Auth Provider":**
   - Ensure it's **ENABLED**
   - Check if there's an **email allowlist** - if so, add your domains

3. **Check "Email validation":**
   - Some projects have strict email validation
   - You may need to adjust regex patterns if configured

---

### Step 5: Test Sign In

1. **Go to your app:** http://localhost:8080/signin

2. **Sign in with:**
   - Email: `admin@ricostacosatelier.com`
   - Password: `Ricostacos25`

3. **Should redirect to:** `/dashboard`

4. **You should see:** Admin Panel card available

---

## Alternative: Use Your Own Email

If Supabase continues to reject emails, use your personal email:

1. Create user with **your Gmail/real email**
2. Use password: `Ricostacos25` (or your own)
3. Auto-confirm the user
4. Grant admin role using SQL from Step 3

---

## Troubleshooting

### If you still get 500 errors:

1. **Check Supabase project status:**
   - Go to https://supabase.com/dashboard/project/psbbrezasrwjjqppgtok
   - Look for any warnings or paused services

2. **Check Database:**
   - Ensure `user_roles` table exists
   - Run: `SELECT * FROM user_roles;`

3. **Check Auth Hooks:**
   - Go to Database -> Triggers
   - Check if there are any auth triggers that might be failing

### If signin works but dashboard shows "No admin access":

1. **Verify role was added:**
```sql
SELECT * FROM user_roles WHERE role = 'admin';
```

2. **Try calling bootstrap manually** (while signed in):
   - Open browser console on /dashboard
   - Run: 
   ```javascript
   const { data, error } = await supabase.rpc('bootstrap_admin');
   console.log({ data, error });
   ```

---

## Expected Result

✅ User can sign in with admin@ricostacosatelier.com / Ricostacos25
✅ Dashboard shows "Admin Panel" card
✅ Clicking Admin Panel loads /admin page
✅ Full site functionality restored

---

## Quick Command Reference

After creating the user manually, you can verify with:

```bash
# From your project directory
node create-admin-user.cjs
```

This will attempt to sign in and grant admin role if needed.
