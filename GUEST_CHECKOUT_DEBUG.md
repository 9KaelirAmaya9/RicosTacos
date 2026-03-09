# Guest Checkout Debugging Guide

## What I Added

### 1. **Comprehensive Error Logging** ✅
- Logs at every step of the checkout process
- Shows whether user is authenticated or guest
- Logs order creation attempt and result
- Logs payment intent creation attempt and result
- Full error details in console

### 2. **Better Error Messages** ✅
- Shows actual error message from server
- References browser console for details
- Longer toast duration (8 seconds) for errors

### 3. **Fixed Push Notification** ✅
- Only sends notification for authenticated users
- Skips notification for guest orders (function requires auth)
- Won't block checkout if notification fails

---

## How to Debug Guest Checkout

### Step 1: Open Browser Console
1. Go to your site
2. Press **F12** (or right-click → Inspect)
3. Click **Console** tab
4. Clear console (trash icon)

### Step 2: Try Guest Checkout
1. Add items to cart
2. Fill in customer info:
   - Name (min 2 chars)
   - Phone (min 10 digits)
   - Email (valid format)
   - Address (if delivery)
3. Click "Proceed to Checkout"
4. Click "Guest" tab
5. Click "Continue as Guest"

### Step 3: Check Console Logs

You should see logs like:
```
Creating order as: guest
Order data: { order_number: "...", user_id: null, ... }
Order created successfully: ORD-...
Creating payment intent for order: ORD-...
Payment intent response: { hasClientSecret: true, ... }
Opening payment modal for order: ORD-...
```

### Step 4: If Error Occurs

Look for:
- **"=== CHECKOUT ERROR ==="** - Full error details
- **"Order creation error:"** - Database/RLS issue
- **"Payment intent error details:"** - Payment function issue

---

## Common Issues & Fixes

### Issue: "Failed to create order: ..."
**Possible causes:**
- RLS policy blocking anonymous inserts
- Missing required fields
- Database connection issue

**Fix:**
- Check Supabase dashboard → Database → Policies
- Verify "Allow order creation" policy exists for `anon` role
- Check console for specific error message

### Issue: "Payment error: ..."
**Possible causes:**
- Stripe keys missing/incorrect
- Payment function not deployed
- Validation error in payment function

**Fix:**
- Check environment variables (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY)
- Verify `create-payment-intent` function is deployed
- Check function logs in Supabase dashboard

### Issue: No error, but nothing happens
**Possible causes:**
- Payment modal not opening
- State not updating
- Silent error

**Fix:**
- Check console for any warnings
- Look for "Opening payment modal" log
- Check if `showCheckout` state is being set

---

## What to Check

1. **Browser Console** - Full error details
2. **Network Tab** - Check API calls:
   - POST to `/rest/v1/orders` (order creation)
   - POST to `/functions/v1/create-payment-intent` (payment)
3. **Supabase Dashboard**:
   - Database → Policies → orders table
   - Edge Functions → Logs
4. **Environment Variables**:
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY

---

## Next Steps

1. **Try guest checkout again**
2. **Open browser console (F12)**
3. **Copy all console logs**
4. **Share the error message you see**

The detailed logging will show exactly where it's failing! 🔍

