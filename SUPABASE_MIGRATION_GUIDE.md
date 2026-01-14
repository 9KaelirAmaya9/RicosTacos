# Complete Supabase Migration Guide

## Step 1: Create New Supabase Project

1. **Go to:** https://supabase.io
2. **Sign in** (or create account)
3. **Create new project:**
   - Name: `ricos-tacos-dev` (or any name)
   - Region: Choose closest to you
   - Password: Create a strong password
   - Pricing: Free tier is fine

4. **Wait 2-3 minutes** for project to initialize

## Step 2: Get Your New Credentials

From your new Supabase project dashboard:

1. **Go to:** Settings → API
2. **Copy these:**
   - **Project URL** - copy exactly
   - **anon public key** - labeled as "anon"
   - **Service Role Key** - labeled as "service_role"

Example:
```
VITE_SUPABASE_URL = https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Update Local .env File

Replace your current `.env` with new credentials:

```env
# Old Lovable credentials → DELETE
VITE_SUPABASE_URL=https://kivdqjyvahabsgqtszie.supabase.co
VITE_SUPABASE_ANON_KEY=...old...
VITE_SUPABASE_PUBLISHABLE_KEY=...old...

# New Supabase credentials → ADD
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_new_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_new_anon_key_here
```

## Step 4: Apply Migrations to New Supabase

### Option A: Using Supabase CLI (Recommended)

```bash
cd /Users/jancarlosinc/Downloads/la-taco-atelier-c275201e-main\ 7

# Link to your new Supabase project
supabase link --project-ref YOUR_NEW_PROJECT_ID

# When prompted, enter your database password from Step 1

# Push all migrations
supabase db push

# Verify migrations applied
supabase db remote list-migrations
```

### Option B: Manual SQL Import

If CLI doesn't work:

1. **Go to:** Supabase dashboard → SQL Editor
2. **Copy all migration files from:** `/supabase/migrations/`
3. **Paste content into SQL Editor**
4. **Run each one in order**

Files to run (in order):
```
20251029232720_40de5a3a-9378-4adb-9012-c6a61bedb402.sql
20251107004848_79b35043-ca5f-43e6-8847-0c3702598bb1.sql
20251107214526_5881693f-792a-4c18-b1b6-d1fbb2ee17d2.sql
...all files in migrations folder...
20260112000000_temp_reset_orders.sql
20260112000001_add_admin_delete_policy.sql
```

## Step 5: Verify Connection Locally

Stop current server and restart:

```bash
# Kill current dev server (Ctrl+C in terminal)

# Restart with new credentials
npm run dev

# Check console for: "VITE v5.4.21 ready"
```

Visit: http://localhost:8080/

If everything works → fresh database is ready!

## Step 6: Create Test Admin User

In new Supabase:

1. **Go to:** Authentication → Users
2. **Create new user:**
   - Email: `admin@ricos-tacos.local`
   - Password: `AdminPassword123!`

3. **Then add admin role** in SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@ricos-tacos.local';
```

## Step 7: Delete Orders Using AdminReset Page

1. **Go to:** http://localhost:8080/signin
2. **Login with:**
   - Email: `admin@ricos-tacos.local`
   - Password: `AdminPassword123!`
3. **Navigate to:** http://localhost:8080/admin/reset
4. **Click:** "Delete All Orders"
5. **Confirm deletion**

## Step 8: Verify Success

After deletion:

- Go to: http://localhost:8080/admin
- Check: "Total Orders" should show **0**
- Check: "Today's Orders" should show **0**
- Check: "Recent Orders" list should be empty

## Done! 🎉

Your new Supabase instance is ready with:
- ✅ All tables and schemas
- ✅ All RLS policies (including new DELETE)
- ✅ Admin user account
- ✅ Empty orders list
- ✅ Ready for development/testing

## Optional: Update GitHub/Production

When ready to deploy to production:

```bash
git add .
git commit -m "Switch to new Supabase account"
git push

# Then update Lovable/Vercel environment variables with new credentials
```
