# 🚨 EMERGENCY: Site Showing Blank Page

## The Problem
After force-pushing to GitHub, the site now shows a **blank white page** instead of loading.

## What Happened
When we force-pushed your 13 local commits, we replaced 386 commits that were on GitHub. This likely overwrote working production code with local code that has issues.

## Immediate Action Required

### Step 1: Check Browser Console FOR ERRORS
This will tell us exactly what's broken:

1. **Open the site**: https://losricostacos.com
2. **Open DevTools**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. **Go to Console tab**
4. **Look for RED error messages**
5. **Copy the FIRST error message** you see

Common errors you might see:
- `Failed to fetch` → Missing environment variables
- `Module not found` → Missing dependencies
- `Unexpected token` → JavaScript syntax error
- `CORS error` → API configuration issue

### Step 2: Check Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Find your "RicosTacos" or "losricostacos" project
3. Click on it
4. Look at the latest deployment
5. Check if it says **"Ready"** (green) or **"Error"** (red)

### Step 3: Quick Diagnostic Commands

Run these to see what we pushed:

```bash
cd "/Users/jancarlosinc/Ricos Tacos/la-taco-atelier"

# See what files are in the repo
ls -la src/

# Check if node_modules exists (shouldn't be in git)
ls -la node_modules/ 2>&1 | head -5

# See recent commits
git log --oneline -5

# Check package.json dependencies
cat package.json | grep -A 20 "dependencies"
```

## What Likely Went Wrong

### Scenario 1: Missing Environment Variables (Most Likely)
The force push deployed code, but Vercel doesn't have your environment variables (.env file). The `.env` file is NOT in Git for security.

**Fix**: Add environment variables in Vercel:
1. Vercel Dashboard → Project Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`  
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_MAPBOX_TOKEN`

### Scenario 2: Build Failed
Vercel tried to build but failed due to missing dependencies or syntax errors.

**Check**: Vercel Dashboard → Deployments → Click latest → View build logs

### Scenario 3: Wrong Branch
Vercel might still be building from the old branch.

**Fix**: Vercel Settings → Git → Make sure it's pointing to `main` branch

### Scenario 4: React/Vite Error
The app builds but crashes immediately when loading.

**Check**: Browser console will show the error

## Emergency Rollback Options

### Option A: Revert to Previous Commit (SAFEST)
If you know the working commit hash:

```bash
cd "/Users/jancarlosinc/Ricos Tacos/la-taco-atelier"

# See previous commits
git reflog

# Find the commit that was working (before c01bf9c)
# It was: f7db8cc

# Revert to it
git reset --hard f7db8cc
git push origin main --force

# Wait 2-3 minutes for Vercel to redeploy
```

### Option B: Trigger Redeploy
Sometimes Vercel just needs a fresh deploy:

```bash
# Make a tiny change
echo "# Trigger redeploy" >> README.md
git add README.md
git commit -m "trigger: Force Vercel redeploy"
git push origin main
```

### Option C: Deploy from Vercel Dashboard
1. Go to Vercel Dashboard
2. Find your project
3. Click "Deployments"
4. Find a working deployment (green checkmark)
5. Click "..." menu → "Redeploy"

## What To Do RIGHT NOW

1. **Check browser console** - Tell me the first RED error
2. **Check Vercel dashboard** - Is the build green or red?
3. **Don't panic** - We can roll back

Once you tell me the error message from the browser console, I can fix it immediately.

## Prevention for Next Time

1. **Never force push to production** - Always pull first
2. **Use staging branch** - Test changes before merging to main
3. **Check Vercel before changes** - Make sure current deployment is healthy
4. **Keep backups** - Git tags on working versions

---

## Quick Commands Summary

```bash
# Check browser console (in DevTools)
# Look for RED errors

# Check Vercel build status
# Visit: https://vercel.com/dashboard

# Emergency rollback
cd "/Users/jancarlosinc/Ricos Tacos/la-taco-atelier"
git reset --hard f7db8cc  # Previous working commit
git push origin main --force
```

**Tell me what error you see in the browser console and we'll fix it immediately!** 🚨
