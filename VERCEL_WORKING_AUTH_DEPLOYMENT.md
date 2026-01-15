# Deploy Working Auth Branch to Vercel - Step by Step

## Step 1: Go to Vercel
1. Open browser: https://vercel.com/new
2. Sign in with GitHub if not already signed in

---22:01:29.113 
22:01:29.402 
vite v5.4.21 building for production...
22:01:29.464 
transforming...
22:01:29.729 
Browserslist: browsers data (caniuse-lite) is 7 months old. Please run:
22:01:29.729 
  npx update-browserslist-db@latest
22:01:29.729 
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
22:01:30.788 
✓ 10 modules transformed.
22:01:30.791 
x Build failed in 1.36s
22:01:30.792 
error during build:
22:01:30.792 
Could not resolve "./pages/AdminMenu" from "src/App.tsx"
22:01:30.792 
file: /vercel/path0/src/App.tsx
22:01:30.792 
    at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
22:01:30.793 
    at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
22:01:30.793 
    at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21576:24)
22:01:30.793 
    at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21536:26
22:01:30.821 
Error: Command "npm run build" exited with 1


## Step 2: Import Repository
1. You'll see "Import Git Repository" section
2. Find `la-taco-atelier` in the list
3. Click **"Import"** button next to it
4. Wait for configuration page to load

---

## Step 3: Change Branch to working-auth (CRITICAL!)

You'll see a configuration screen with several settings:

### Look for this section:
```
Root Directory
./ (default)

Production Branch
main ← YOU NEED TO CHANGE THIS!
```

### How to change it:
1. **Find** the section labeled **"Production Branch"** or **"Git Branch"**
2. You'll see a dropdown or text field that says **"main"**
3. **Click** on it
4. **Type or select:** `working-auth`
5. The field should now show: `working-auth`

**Visual location:**
- Usually in the "Build and Output Settings" section
- OR right below "Root Directory"
- OR in "Git" section

### Alternative if you can't find it:
- Look for **"Branch"** dropdown
- Look for **"Configure Project"** → **"Branch"**
- Look for **"Git"** → **"Production Branch"**

---

## Step 4: Configure Build Settings

These should auto-fill, but verify:
- **Framework Preset:** Vite ✓
- **Build Command:** `npm run build` ✓
- **Output Directory:** `dist` ✓
- **Install Command:** `npm install` ✓

---

## Step 5: Add Environment Variables

**Scroll down** to find "Environment Variables" section

### Click "Add" or expand the section

**Add Variable 1:**
1. Click "+ Add" or "Add Environment Variable"
2. **Key (Name):** `VITE_SUPABASE_URL`
3. **Value:** [Paste your Supabase Project URL]
   - Get from: https://supabase.com/dashboard → Your Project → Settings → API → Project URL
4. Click "Add" or press Enter

**Add Variable 2:**
1. Click "+ Add" again
2. **Key (Name):** `VITE_SUPABASE_ANON_KEY`
3. **Value:** [Paste your Supabase anon public key]
   - Get from: https://supabase.com/dashboard → Your Project → Settings → API → anon public key
4. Click "Add" or press Enter

**Double-check:**
- ✅ Two variables added
- ✅ Names are EXACTLY `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Values are pasted correctly (no extra spaces)

---

## Step 6: Deploy!

1. **Scroll to bottom**
2. Click the big **"Deploy"** button
3. **Wait 2-3 minutes** while:
   - Installing dependencies...
   - Building...
   - Deploying...

**Watch the logs** - you'll see real-time progress

---

## Step 7: Success!

Once complete:
1. You'll see "Congratulations!" or success message
2. Click **"Visit"** to see your live site
3. Your URL will be something like: `la-taco-atelier-xxx.vercel.app`

---

## Troubleshooting

### "I can't find the Branch option"

**Option A:** Import without changing branch first
1. Complete import with default settings
2. After deployment, go to Project Settings
3. Click **"Git"** tab
4. Change **"Production Branch"** to `working-auth`
5. Redeploy

**Option B:** Use Vercel CLI
```bash
# If you have Vercel CLI installed
vercel --prod --branch working-auth
```

**Option C:** Manual override during import
- Look for "Override" or "Advanced" options
- Find branch selector there

### "Build fails"

Check build logs for errors. Most common:
- Environment variables not set
- Wrong branch selected (should be `working-auth`, not `main`)

### "Auth doesn't work after deploy"

1. Go to your deployed site
2. Open browser console (F12)
3. Check for errors
4. Verify: Project Settings → Environment Variables
5. Make sure both Supabase vars are set
6. Redeploy if you added/fixed variables

---

## Quick Summary

**What you're doing:**
1. Import `la-taco-atelier` repo
2. **Change branch from `main` to `working-auth`** ← THE KEY STEP
3. Add Supabase environment variables
4. Deploy
5. Done!

**The working-auth branch has all your auth fixes that work locally!**

---

## After Deployment

### To make updates:
```bash
# Make changes locally
git add .
git commit -m "Your changes"

# Push to working-auth branch
git push origin working-auth

# Vercel auto-deploys in 2-3 minutes!
```

### To change branches later:
1. Vercel Dashboard → Your Project
2. Settings → Git
3. Change "Production Branch" to desired branch
4. Click "Save"
5. Redeploy

---

**Ready? Start at Step 1!**
