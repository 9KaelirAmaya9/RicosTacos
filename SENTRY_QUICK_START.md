# Sentry Quick Start Guide
## 5-Minute Setup for Error Tracking

---

## Step 1: Create Sentry Account (2 minutes)

1. Go to **https://sentry.io/signup/**
2. Sign up with:
   - Email
   - GitHub (recommended)
   - Google
3. Choose **"React"** as your platform
4. Create a new project

---

## Step 2: Get Your DSN (1 minute)

1. After creating the project, Sentry will show you a **DSN** (Data Source Name)
2. It looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
3. **Copy this DSN** - you'll need it in the next step

**Note**: The DSN is safe to expose in client-side code. It's a public key.

---

## Step 3: Add DSN to Environment (1 minute)

### Option A: Local Development

1. Create or edit `.env` file in project root:
```bash
# .env
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

2. Restart your dev server:
```bash
npm run dev
```

### Option B: Production Deployment

Add the environment variable to your hosting platform:

**Vercel**:
- Settings → Environment Variables → Add `VITE_SENTRY_DSN`

**Netlify**:
- Site settings → Environment variables → Add `VITE_SENTRY_DSN`

**Other platforms**: Add `VITE_SENTRY_DSN` to your environment variables

---

## Step 4: Verify It's Working (1 minute)

1. **Trigger a test error**:
   - Go to your app
   - Navigate to a non-existent route (e.g., `/test-error-123`)
   - This will trigger a 404 error

2. **Check Sentry Dashboard**:
   - Go to https://sentry.io
   - Click on your project
   - You should see the error appear within seconds!

---

## ✅ That's It!

Sentry is now tracking:
- ✅ Uncaught errors
- ✅ Unhandled promise rejections
- ✅ React Error Boundary errors
- ✅ 404 errors
- ✅ Performance metrics
- ✅ Session replays

---

## Next Steps

### View Your Errors
- Go to **Issues** tab in Sentry dashboard
- See all errors with stack traces, user context, and more

### Set Up Alerts
1. Go to **Alerts** in Sentry
2. Create alert rules for:
   - New errors
   - High error rates
   - Performance issues

### Configure Release Tracking
Add to your build process:
```bash
# In package.json or CI/CD
VITE_APP_VERSION=$(git rev-parse --short HEAD) npm run build
```

---

## Troubleshooting

### Errors not appearing?
1. Check `VITE_SENTRY_DSN` is set correctly
2. Check browser console for Sentry initialization messages
3. Verify network requests to Sentry (Network tab in DevTools)

### Too many events?
- Adjust sample rates in `src/utils/sentry.ts`
- Filter events in Sentry dashboard

### Need help?
- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/react/
- Support: support@sentry.io

---

## Free Tier Limits

Sentry free tier includes:
- ✅ 5,000 errors/month
- ✅ 10,000 performance units/month
- ✅ 1,000 session replays/month

**This is plenty for most applications!**

---

**Setup Time**: ~5 minutes  
**Ongoing Maintenance**: Minimal  
**Value**: Priceless error visibility 🎯


