# Debug Environment Variables

## Console Test

In browser console, run these commands:

```javascript
// Check if variables are loaded
console.log("SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL)
console.log("SUPABASE_KEY:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

// Check all env vars
console.log("All env vars:", import.meta.env)
```

---

## Expected Results

### ✅ If Working:
```
SUPABASE_URL: "https://kivdqjyvahabsgqtszie.supabase.co"
SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### ❌ If Not Working:
```
SUPABASE_URL: undefined
SUPABASE_KEY: undefined
```

---

## Solutions Based on Results

### If `undefined`:
1. **Rebuild in Lovable** (most important!)
2. Clear browser cache
3. Check variable names are exact in Lovable

### If values show but dashboards still don't work:
1. **Check authentication** - are you logged in?
2. **Check user roles** - do you have admin/kitchen role?
3. **Check browser console** for other errors
4. **Check network tab** for failed API calls

---

## Quick Auth Check

In console, also check:
```javascript
// Check if Supabase client is initialized
import { supabase } from '@/integrations/supabase/client'
supabase.auth.getSession().then(({data}) => {
  console.log("Current session:", data.session)
  console.log("User ID:", data.session?.user?.id)
})
```

---

**What do you see when you run these commands? Share the results!**

