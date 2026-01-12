# Vercel Stripe Environment Variables Setup

## What You Need

For Stripe to work in production, you need two keys:

1. **Publishable Key** (starts with `pk_live_`)
   - ✅ Already added to local `.env`: `pk_live_51SPqUL3Q0T98iZCTM2UXTTAQXJGBLbNAUNwWbxl7xlhMJtz7mII0E6fsiK45LbgG0wnBPR4vHZZYbP5CD53FqNFo00uIFNorvD`
   - Safe to expose in browser/frontend
   
2. **Secret Key** (starts with `sk_live_`)
   - ⚠️ **NEVER commit to git or .env**
   - Must be stored ONLY in Vercel environment variables
   - Found in Stripe Dashboard → Developers → API Keys → Secret Key

## Step-by-Step: Add Stripe Keys to Vercel

### Step 1: Get Your Stripe Secret Key

1. Go to https://dashboard.stripe.com
2. Make sure you're in **LIVE mode** (toggle in top right)
3. Navigate to: **Developers** → **API keys**
4. Find **Secret key** (starts with `sk_live_`)
5. Click **Reveal test key** or copy it
6. **Keep this tab open** - you'll need this key in a moment

### Step 2: Access Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your **Ricos Tacos** project
3. Click **Settings** tab
4. Click **Environment Variables** in left sidebar

### Step 3: Add Stripe Publishable Key

1. In the "Key" field, enter: `VITE_STRIPE_PUBLISHABLE_KEY`
2. In the "Value" field, paste: 
   ```
   pk_live_51SPqUL3Q0T98iZCTM2UXTTAQXJGBLbNAUNwWbxl7xlhMJtz7mII0E6fsiK45LbgG0wnBPR4vHZZYbP5CD53FqNFo00uIFNorvD
   ```
3. Select environments: ✅ **Production**, ✅ **Preview**, ✅ **Development**
4. Click **Save**

### Step 4: Add Stripe Secret Key

1. Click **Add Another** (or **Add Variable**)
2. In the "Key" field, enter: `STRIPE_SECRET_KEY`
3. In the "Value" field, paste your secret key from Step 1 (starts with `sk_live_`)
4. Select environments: ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Click **Save**

### Step 5: Redeploy Your Application

After adding environment variables, you need to redeploy:

**Option A: Trigger Redeploy in Vercel**
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots (•••) on the right
4. Select **Redeploy**
5. Check ✅ **Use existing Build Cache**
6. Click **Redeploy**

**Option B: Push a Small Change to GitHub**
```bash
# Make a trivial change and push
git commit --allow-empty -m "Trigger redeploy with Stripe keys"
git push origin working-auth
```

## Verification

After redeployment, verify Stripe is working:

1. Visit your live site
2. Add items to cart
3. Proceed to checkout
4. Test with Stripe test card: `4242 4242 4242 4242`
5. Any future expiry date, any CVC
6. Should process successfully

## Your Environment Variables Should Look Like:

```
Key                              Value                     Environments
-------------------------------- ------------------------- ---------------------
VITE_STRIPE_PUBLISHABLE_KEY      pk_live_51SPq...         Production, Preview, Dev
STRIPE_SECRET_KEY                sk_live_xxxxx...         Production, Preview, Dev
VITE_SUPABASE_URL                https://kivdq...         Production, Preview, Dev
VITE_SUPABASE_ANON_KEY           eyJhbGciOiJI...         Production, Preview, Dev
```

## Important Notes

### ⚠️ Security Best Practices

1. **NEVER** commit `STRIPE_SECRET_KEY` to git
2. **NEVER** add `sk_live_` keys to .env file
3. **ALWAYS** use environment variables in Vercel/production
4. The `.env` file should **only** contain public/publishable keys

### 🔄 When to Update

Update these keys when:
- You regenerate keys in Stripe dashboard
- You switch from test to live mode
- You suspect a key has been compromised

### 🧪 Test Mode vs Live Mode

**Test Mode Keys:**
- Publishable: `pk_test_...`
- Secret: `sk_test_...`
- Use for development/testing

**Live Mode Keys:**
- Publishable: `pk_live_...` ✅ (what you're using)
- Secret: `sk_live_...` ⚠️ (need to add to Vercel)
- Use for production

## Troubleshooting

### Error: "No API key provided"
- Check environment variable name is exactly `VITE_STRIPE_PUBLISHABLE_KEY`
- Redeploy after adding variables

### Error: "Invalid API Key"
- Verify you copied the complete key (no spaces/line breaks)
- Make sure you're using **live** keys, not test keys
- Check key hasn't been deleted in Stripe dashboard

### Payments Not Processing
- Verify `STRIPE_SECRET_KEY` is added to Vercel
- Check Stripe Dashboard → Developers → Webhooks are configured
- Review Stripe logs for error details

## Need Help?

- Stripe Documentation: https://stripe.com/docs/keys
- Vercel Env Vars: https://vercel.com/docs/projects/environment-variables
- Check Stripe Dashboard logs for detailed error messages

---

**Status:** Ready to configure
**Last Updated:** January 12, 2026
