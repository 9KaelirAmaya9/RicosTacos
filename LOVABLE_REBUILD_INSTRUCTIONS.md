# Rebuild Instructions for Lovable
## Deploy Security Fixes & Dashboard Updates

---

## ✅ What Needs to Be Rebuilt

1. **Edge Functions** - Security fixes (JWT verification)
2. **Frontend** - Dashboard fixes and ProtectedRoute updates

---

## 🚀 Step-by-Step Instructions

### Step 1: Pull Latest Code from GitHub

1. Go to your Lovable project
2. Look for **"Git"** or **"GitHub"** section in settings
3. Click **"Pull from GitHub"** or **"Sync"**
4. Wait for sync to complete

**OR** if auto-sync is enabled, it should already be synced.

---

### Step 2: Rebuild Edge Functions (CRITICAL for Security)

1. Go to **"Edge Functions"** or **"Functions"** section in Lovable
2. You should see all your functions listed:
   - `create-payment-intent`
   - `create-checkout-session`
   - `create-embedded-checkout`
   - `send-order-notification`
   - `stripe-webhook`
   - `validate-delivery-address`

3. **For each function** (or use "Rebuild All" if available):
   - Click on the function
   - Click **"Deploy"** or **"Rebuild"** button
   - Wait for deployment to complete

**OR** ask Lovable AI:
```
"Rebuild all edge functions with the latest code from GitHub"
```

---

### Step 3: Rebuild Frontend

1. Go to **"Deployments"** or **"Builds"** section
2. Click **"Deploy"** or **"Rebuild"** button
3. Wait for build to complete (2-5 minutes)
4. The build will:
   - Pull latest code from GitHub
   - Install dependencies
   - Build the React app
   - Deploy to production

---

### Step 4: Verify Deployment

After rebuild, test:

1. **Security Fixes:**
   - Try calling payment function without auth → Should get 401
   - Call with valid JWT → Should work

2. **Dashboard Access:**
   - Go to `/admin` → Should load (if logged in with admin role)
   - Go to `/kitchen` → Should load (if logged in with kitchen role)
   - Go to `/admin/orders` → Should load

3. **Payment Flow:**
   - Add items to cart
   - Go to checkout
   - Payment should work (with auth)

---

## 🤖 Quick Way: Ask Lovable AI

In Lovable chat, say:

```
"Rebuild all edge functions and frontend with the latest code from GitHub. The code includes critical security fixes for payment functions and dashboard fixes."
```

Lovable should handle the rebuild automatically.

---

## ⚠️ Important Notes

### Edge Functions Need:
- **JWT verification enabled** (in `config.toml`)
- **Code with auth checks** (already in code)
- **Environment variables** (STRIPE_SECRET_KEY, etc.)

### Frontend Needs:
- **Environment variables** (VITE_SUPABASE_URL, etc.)
- **Latest code** (already on GitHub)

---

## 🔍 How to Check if Rebuild Worked

### Check Edge Functions:
1. Go to Edge Functions section
2. Check deployment status/timestamp
3. Should show recent deployment time

### Check Frontend:
1. Go to Deployments section
2. Check latest build status
3. Should show "Success" and recent timestamp

### Test in Browser:
1. Open your site
2. Press F12 → Console
3. Check for errors
4. Try accessing `/admin` or `/kitchen`

---

## 📝 Summary

**You need to rebuild in Lovable because:**
- Edge functions run on Lovable's infrastructure
- Frontend builds happen in Lovable's build system
- I can only update code, not deploy it

**What I've done:**
- ✅ Fixed all security issues in code
- ✅ Fixed dashboard access issues
- ✅ Pushed everything to GitHub
- ✅ Code is ready to deploy

**What you need to do:**
- 🔄 Rebuild in Lovable (2-5 minutes)
- ✅ Test after rebuild

---

**After rebuilding in Lovable, everything will be secure and working! 🔒✅**

