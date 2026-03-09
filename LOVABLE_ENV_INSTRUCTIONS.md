# ⚠️ IMPORTANT: Environment Variables Setup

## ✅ What I Did

I've added your Supabase credentials to your **local `.env` file** so you can test locally.

## ❌ What I CANNOT Do

**I cannot add environment variables to Lovable for you** - you must do this manually in the Lovable dashboard because:
- Environment variables are platform-specific settings
- They're stored in Lovable's infrastructure, not in code
- They need to be set through Lovable's UI for security

## 🚀 What You Need to Do in Lovable (2 minutes)

### Step 1: Go to Lovable Project Settings
1. Open your Lovable project: https://lovable.dev/projects/1c5a3260-4d54-412b-b8f8-4af54564df01
2. Click **"Settings"** (gear icon or in the sidebar)
3. Find **"Environment Variables"** or **"Secrets"** section

### Step 2: Add These Two Variables

Click **"Add Variable"** or **"New Secret"** and add:

**Variable 1:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://kivdqjyvahabsgqtszie.supabase.co`

**Variable 2:**
- **Name:** `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdmRxanl2YWhhYnNncXRzemllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjgxNzUsImV4cCI6MjA3NzM0NDE3NX0.lA2GvgQJOad0iORWwOg2if_r7QX0CnkH3S8uzWECKfo`

### Step 3: Save and Rebuild
1. Click **"Save"** or **"Apply"**
2. Click **"Deploy"** or **"Rebuild"** button
3. Wait for build to complete (~2-5 minutes)

### Step 4: Test
- Go to `/admin` - should work! ✅
- Go to `/kitchen` - should work! ✅
- Go to `/admin/orders` - should work! ✅

---

## 📝 Why .env is NOT in GitHub

Your `.env` file is **correctly excluded** from GitHub (it's in `.gitignore`). This is **good security practice** because:
- ✅ Secrets should never be in version control
- ✅ Each environment (local, staging, production) has its own variables
- ✅ Lovable manages production variables separately

---

## 🔄 GitHub → Lovable Workflow

1. **Code changes** → Push to GitHub ✅ (Already done!)
2. **Environment variables** → Set in Lovable UI (You need to do this)
3. **Lovable pulls code** from GitHub automatically (if connected)
4. **Lovable uses its own env vars** (not from GitHub)

---

## ✅ Summary

- ✅ Local `.env` updated - you can test locally with `npm run dev`
- ⚠️ **You must add variables to Lovable manually** (2 minutes)
- ✅ After adding to Lovable and rebuilding, dashboards will work!

---

**Once you add those 2 variables in Lovable and rebuild, everything will work! 🎉**

