# Lovable Environment Variables Setup
## Quick Fix for Dashboard Access

---

## ✅ Your Supabase Credentials

```
VITE_SUPABASE_URL=https://kivdqjyvahabsgqtszie.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdmRxanl2YWhhYnNncXRzemllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjgxNzUsImV4cCI6MjA3NzM0NDE3NX0.lA2GvgQJOad0iORWwOg2if_r7QX0CnkH3S8uzWECKfo
```

---

## 🚀 Step 1: Add to Lovable (CRITICAL)

1. **Go to your Lovable project**
2. **Click "Settings"** (or gear icon)
3. **Go to "Environment Variables"** or **"Secrets"**
4. **Add these two variables:**

   | Variable Name | Value |
   |--------------|-------|
   | `VITE_SUPABASE_URL` | `https://kivdqjyvahabsgqtszie.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdmRxanl2YWhhYnNncXRzemllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjgxNzUsImV4cCI6MjA3NzM0NDE3NX0.lA2GvgQJOad0iORWwOg2if_r7QX0CnkH3S8uzWECKfo` |

5. **Save** and **Rebuild/Redeploy**

---

## 💻 Step 2: Add to Local .env (For Local Testing)

If you want to test locally, create/update `.env` file:

```bash
# In your project root
nano .env
```

Add:
```env
VITE_SUPABASE_URL=https://kivdqjyvahabsgqtszie.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdmRxanl2YWhhYnNncXRzemllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjgxNzUsImV4cCI6MjA3NzM0NDE3NX0.lA2GvgQJOad0iORWwOg2if_r7QX0CnkH3S8uzWECKfo
```

Then restart dev server:
```bash
npm run dev
```

---

## ✅ After Adding Variables

1. **Redeploy in Lovable** (click "Deploy" or "Rebuild")
2. **Wait for build to complete**
3. **Test the dashboards:**
   - Go to `/admin` - should work now!
   - Go to `/kitchen` - should work now!
   - Go to `/admin/orders` - should work now!

---

## 🐛 If Still Not Working

1. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check browser console** for errors
3. **Verify variables are saved** in Lovable settings
4. **Make sure you're logged in** with an admin/kitchen account

---

## 📝 Additional Variables (Optional)

You may also need these for full functionality:

```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_MAPBOX_PUBLIC_TOKEN=your_mapbox_token
VITE_SENTRY_DSN=your_sentry_dsn (optional)
```

But the two Supabase variables above are **CRITICAL** for dashboards to work!

---

**Once you add these to Lovable and redeploy, your dashboards will work! 🎉**

