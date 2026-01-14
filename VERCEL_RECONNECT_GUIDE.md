# How to Reconnect Vercel to RicosTacos Repository

## Current Situation:
- ❌ Vercel is connected to: **base2** repository
- ✅ You want Vercel connected to: **RicosTacos** repository
- ✅ All your improvements ARE in RicosTacos/working-auth branch

## Step-by-Step Fix:

### Step 1: Disconnect from base2

1. Go to https://vercel.com/dashboard
2. Find your Ricos Tacos project (it might be called "base2" or similar)
3. Click on the project
4. Go to **Settings** (top navigation)
5. Scroll down in left sidebar to **Git**
6. Click **Disconnect** next to the base2 repository
7. Confirm the disconnection

### Step 2: Connect to RicosTacos

1. Still in **Settings** → **Git**
2. Click **Connect Git Repository**
3. Choose **GitHub**
4. Find and select: **9KaelirAmaya9/RicosTacos**
5. Click **Connect**

### Step 3: Configure Deployment Branch

1. Go to **Settings** → **Git** (should already be there)
2. Under **Production Branch**, set it to: **working-auth**
   - OR set to **main** and merge working-auth to main first
3. Click **Save**

### Step 4: Trigger Deployment

**Option A: Deploy from Vercel**
1. Go to **Deployments** tab
2. Click **...** (three dots) on top right
3. Click **Redeploy**
4. Select **Use existing Build Cache** (optional)
5. Click **Redeploy**

**Option B: Push Empty Commit (from terminal)**
```bash
cd /Users/jancarlosinc/Downloads/la-taco-atelier-c275201e-main\ 7
git commit --allow-empty -m "Trigger Vercel deployment from RicosTacos"
git push fresh working-auth
```

### Step 5: Verify Deployment

1. Wait 1-2 minutes for deployment to complete
2. Check your live site URL
3. Should now show Ricos Tacos content with all improvements

## Alternative: Import New Project

If disconnecting doesn't work, create a fresh Vercel project:

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select **9KaelirAmaya9/RicosTacos**
4. Click **Import**
5. Configure:
   - **Project Name:** ricos-tacos (or your choice)
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
6. Add Environment Variables (IMPORTANT):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - (See VERCEL_STRIPE_SETUP.md for Stripe keys)
7. Click **Deploy**
8. Update your domain to point to this new deployment

## Summary:

- Your code is safe in **RicosTacos/working-auth** ✅
- Vercel was connected to base2 (that's why you saw base2 content)
- Follow steps above to reconnect to RicosTacos
- Your site will return to normal with all improvements

---

**Need Help?**
- Vercel Documentation: https://vercel.com/docs/git
- Can also delete the base2 project entirely if not needed
