# Environment Variables Setup Guide

This guide helps you set up all required environment variables for the La Taco Atelier application.

## Quick Start

1. Copy the example file:
```bash
cp .env.example .env
```

2. Fill in your actual values (see sections below)

3. Restart your dev server:
```bash
npm run dev
```

---

## Required Variables

### Supabase (Required)

Get these from your Supabase project dashboard: https://app.supabase.com

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key
```

**Where to find:**
- Go to Project Settings → API
- Copy "Project URL" → `VITE_lSUPABASE_URL`
- Copy "anon public" key → `VITE_SUPABASE_PUBLISHABLE_KEY`

---

### Stripe (Required for Payments)

Get this from your Stripe dashboard: https://dashboard.stripe.com

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Where to find:**
- Go to Developers → API keys
- Copy "Publishable key" (test or live)
- Use `pk_test_...` for development
- Use `pk_live_...` for production

---

### Mapbox (Required for Delivery Validation)

Get this from your Mapbox account: https://account.mapbox.com

```env
VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ1...
```

**Where to find:**
- Go to Account → Access tokens
- Copy your default public token
- Or create a new token with "Public" scope

---

## Optional Variables

### Resend (Recommended for Order Receipts)

Get this from Resend after creating an account: https://resend.com

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Setup:**
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Go to API Keys section
3. Create new API key
4. Copy the key (starts with `re_...`)
5. Add to environment variables

**For Supabase Edge Functions:**
- Go to Supabase Dashboard → Edge Functions → Secrets
- Add `RESEND_API_KEY` with your key
- This enables order confirmation emails

**Note:** 
- Orders work without this, but customers won't receive email receipts
- Sign-in emails work automatically via Supabase (no Resend needed)
- See [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md) for details

---

### Sentry (Recommended for Error Tracking)

Get this from Sentry after creating a project: https://sentry.io

```env
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Setup:**
1. Sign up at https://sentry.io/signup/
2. Create a React project
3. Copy the DSN shown
4. See [SENTRY_QUICK_START.md](./SENTRY_QUICK_START.md) for detailed instructions

**Note:** The app will work without this, but error tracking will be disabled.

---

### App Version (Optional)

For release tracking in Sentry:

```env
VITE_APP_VERSION=1.0.0
```

Or use git commit hash:
```bash
VITE_APP_VERSION=$(git rev-parse --short HEAD)
```

---

## Production Deployment

### Vercel
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environment (Production, Preview, Development)
4. Redeploy

### Netlify
1. Go to Site Settings → Environment Variables
2. Add each variable
3. Set scope (All scopes, Production, Deploy previews, Branch deploys)
4. Redeploy

### Other Platforms
Add environment variables in your platform's settings, then rebuild/redeploy.

---

## Validation

The app validates required variables on startup. If missing:
- **Development**: Console warnings
- **Production**: App will fail to start (prevents broken deployments)

---

## Security Notes

✅ **Safe to expose in client-side code:**
- `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key)
- `VITE_STRIPE_PUBLISHABLE_KEY` (public key)
- `VITE_MAPBOX_PUBLIC_TOKEN` (public token)
- `VITE_SENTRY_DSN` (public DSN)

❌ **Never expose:**
- Supabase service role key
- Stripe secret key
- Mapbox secret token
- Any server-side secrets

---

## Troubleshooting

### "Missing required environment variables"
- Check `.env` file exists in project root
- Verify variable names start with `VITE_`
- Restart dev server after changes
- Check for typos in variable names

### Variables not loading
- Ensure `.env` is in project root (not in `src/`)
- Restart dev server
- Clear browser cache
- Check `.env` file syntax (no quotes needed for values)

### Production build issues
- Ensure all required variables are set in hosting platform
- Rebuild after adding variables
- Check build logs for errors

---

## Example `.env` File

```env
# Supabase
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz...

# Mapbox
VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...

# Sentry (Optional)
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/123456

# App Version (Optional)
VITE_APP_VERSION=1.0.0
```

---

**Need help?** Check the main [README.md](./README.md) or open an issue.

