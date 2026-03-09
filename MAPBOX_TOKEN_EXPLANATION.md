# Mapbox Token Types Explained

## Quick Answer: You Only Need ONE Token

**For this project, you only need the PUBLIC token** (starts with `pk.eyJ...`). There is no separate "secret key" needed.

---

## Mapbox Token Types

### 1. **Public Token** (`pk.eyJ...`) ✅ **THIS IS WHAT YOU NEED**

**What it is:**
- Public access token
- Safe to use in client-side code
- Safe to use in server-side code (edge functions)
- Can be exposed in frontend

**What it's used for:**
- ✅ Displaying maps (Mapbox GL JS)
- ✅ Geocoding API calls
- ✅ Directions API calls
- ✅ Isochrone API calls
- ✅ All API operations in this project

**Where to find it:**
1. Go to https://account.mapbox.com/access-tokens/
2. You'll see "Default public token" or "Public token"
3. Copy the token (starts with `pk.eyJ...`)

**Security:**
- Can be restricted by URL in Mapbox dashboard
- Can be restricted by scope (what APIs it can access)
- Safe to use in both frontend and backend

---

### 2. **Secret Token** (`sk.eyJ...`) ❌ **NOT NEEDED FOR THIS PROJECT**

**What it is:**
- Secret access token
- **MUST NOT** be exposed in client-side code
- Server-side only
- Has full account access

**What it's used for:**
- Account management operations
- Creating/deleting tokens
- Billing operations
- Administrative tasks
- **NOT used for regular API calls**

**When you'd need it:**
- Building a token management system
- Creating tokens programmatically
- Account administration
- **NOT needed for displaying maps or API calls**

**Where to find it:**
1. Go to https://account.mapbox.com/access-tokens/
2. Scroll down to "Secret tokens" section
3. Click "Create a token" → Select "Secret token"
4. **Warning:** Only use this for server-side operations

**Security:**
- ⚠️ **NEVER expose in frontend code**
- ⚠️ **NEVER commit to git**
- ⚠️ **Full account access** - keep it secret!

---

## For This Project: Public Token Only

### Why We Only Use Public Token:

1. **Frontend Maps** (`ServiceAreaMap.tsx`)
   - Uses Mapbox GL JS library
   - Requires public token
   - Safe to expose in browser

2. **Edge Functions** (`validate-delivery-address`)
   - Makes API calls to Mapbox
   - Public token works perfectly
   - No need for secret token

3. **All API Operations**
   - Geocoding: Public token ✅
   - Directions: Public token ✅
   - Isochrones: Public token ✅

**Conclusion:** Public token is sufficient for all operations in this project.

---

## Token Configuration in This Project

### Frontend (Lovable Environment Variables):
```env
VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...
```

### Backend (Supabase Edge Functions):
```
MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...
```

**Note:** Both use the SAME public token. The different variable names are just for clarity (frontend vs backend), but it's the same token value.

---

## Why You Might Be Confused

### Other Services Have Separate Keys:

**Stripe:**
- `pk_test_...` (Publishable Key) - Frontend
- `sk_test_...` (Secret Key) - Backend

**Supabase:**
- `anon` key - Frontend
- `service_role` key - Backend

**Mapbox is Different:**
- `pk.eyJ...` (Public Token) - Works for BOTH frontend AND backend
- `sk.eyJ...` (Secret Token) - Only for account management, NOT needed for API calls

---

## How to Get Your Public Token

### Step 1: Go to Mapbox Dashboard
https://account.mapbox.com/access-tokens/

### Step 2: Find Your Token
You'll see:
- **Default public token** (or just "Public token")
- Token starts with `pk.eyJ...`
- This is what you need!

### Step 3: Copy It
Click the copy icon or manually copy the token

### Step 4: Use It
- Add to Lovable: `VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ...`
- Add to Supabase: `MAPBOX_PUBLIC_TOKEN=pk.eyJ...` (same token!)

---

## Token Scopes (What Your Token Can Do)

When you view your token in Mapbox dashboard, you'll see scopes like:

- ✅ **Public** - For displaying maps
- ✅ **Geocoding** - For address → coordinates
- ✅ **Directions** - For route calculation
- ✅ **Isochrones** - For service area polygons

**Default public token** usually has all these scopes enabled.

---

## Security Best Practices

### For Public Token (`pk.eyJ...`):

✅ **Safe to:**
- Use in frontend code
- Use in edge functions
- Expose in environment variables
- Commit to git (if you want, though .env is better)

✅ **Recommended:**
- Set URL restrictions in Mapbox dashboard
- Limit scopes to what you need
- Monitor usage for unusual activity

### For Secret Token (`sk.eyJ...`):

❌ **NEVER:**
- Expose in frontend code
- Commit to git
- Share publicly
- Use for regular API calls

✅ **ONLY use for:**
- Server-side account management
- Token creation/deletion
- Administrative operations

---

## Summary

**Question:** "Where can I find the secret key for Mapbox apart from the token?"

**Answer:** 
- You **don't need** a secret key for this project
- You only need the **public token** (`pk.eyJ...`)
- The same public token works for both frontend and backend
- Secret tokens are only for account management (not needed here)

**What to do:**
1. Get your public token from https://account.mapbox.com/access-tokens/
2. Use the same token in both Lovable and Supabase
3. That's it! No secret key needed.

---

## Still Confused?

If you're seeing references to "MAPBOX_PUBLIC_TOKEN" in the edge function and wondering if there's a different token:

**No, it's the same token!** The variable name is just different for clarity:
- Frontend uses: `VITE_MAPBOX_PUBLIC_TOKEN`
- Backend uses: `MAPBOX_PUBLIC_TOKEN`
- **But the VALUE is the same** - your public token (`pk.eyJ...`)

---

**Bottom Line:** One token (`pk.eyJ...`) for everything. No secret key needed! ✅

