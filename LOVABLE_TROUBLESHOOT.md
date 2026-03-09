# Troubleshooting: Lovable Environment Variables

## If Variables Are Already Set

If Lovable says the keys are already there, let's verify they're correct:

---

## ✅ Step 1: Verify Variable Names

Check that the variables are named **exactly**:
- `SUPABASE_URL` (or `VITE_SUPABASE_URL`)
- `SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`)

**Not:**
- `SUPABASE_URL_KEY` ❌
- `SUPABASE_ANON_KEY` ❌
- `SUPABASE_PUBLIC_KEY` ❌

---

## ✅ Step 2: Verify Variable Values

Make sure the values are **exactly**:

**SUPABASE_URL:**
```
https://kivdqjyvahabsgqtszie.supabase.co
```
(No trailing slash, no quotes)

**SUPABASE_PUBLISHABLE_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdmRxanl2YWhhYnNncXRzemllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjgxNzUsImV4cCI6MjA3NzM0NDE3NX0.lA2GvgQJOad0iORWwOg2if_r7QX0CnkH3S8uzWECKfo
```
(Full key, no quotes, no spaces)

---

## ✅ Step 3: Force Rebuild

Even if variables are set, you need to **rebuild**:

1. Go to **Deployments** or **Builds** tab
2. Click **"Rebuild"** or **"Redeploy"**
3. Wait for build to complete
4. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

---

## ✅ Step 4: Check Browser Console

1. Open your site in browser
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Look for errors like:
   - "Missing required Supabase environment variables"
   - "Failed to initialize Supabase"
   - Any red error messages

---

## ✅ Step 5: Test in Browser

Open browser console and type:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.SUPABASE_URL)
```

If both are `undefined`, the variables aren't being passed to the frontend.

---

## 🔧 Quick Fix: Update Variable Names

If variables exist but with wrong names:

1. **Delete** the old variables
2. **Add new ones** with exact names:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
3. **Rebuild**

---

## 💡 Ask Lovable AI

In Lovable chat, ask:
```
"Show me all my environment variables. Are SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY set correctly?"
```

Or:
```
"Help me debug why my React app can't access SUPABASE_URL environment variable"
```

---

## 🎯 Most Likely Issues

1. **Variables set but not rebuilt** → Force rebuild
2. **Wrong variable names** → Check exact names
3. **Variables in wrong scope** → Make sure they're for "Production" or "All"
4. **Cached build** → Clear cache and rebuild

---

**Try rebuilding first - that's usually the issue! 🔄**

