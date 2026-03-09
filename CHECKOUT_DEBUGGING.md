# Checkout Debugging Guide

## What I Fixed

### 1. **Better Error Messages** ✅
- Before: Generic "Failed to process payment. Please try again."
- After: Shows the actual error message from the payment function
- This will help identify the exact problem

### 2. **Cart Item Format** ✅
- Maps cart items to the exact format expected by payment function
- Ensures `name`, `price`, `quantity` are properly formatted

### 3. **Detailed Validation** ✅
- Payment function now shows specific validation errors
- Example: "Invalid item price for Taco: undefined. Price must be between 0 and 1000."
- This makes it clear what's wrong

---

## How to Debug Checkout Issues

### Step 1: Check Browser Console
1. Open your site
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to checkout
5. Look for error messages

### Step 2: Common Errors & Fixes

#### Error: "Invalid item price for [item]: undefined"
**Problem:** Cart item missing price
**Fix:** Check that menu items have prices set in database

#### Error: "Invalid item quantity for [item]: undefined"
**Problem:** Cart item missing quantity
**Fix:** This shouldn't happen, but check cart context

#### Error: "Customer information is required (name, phone, email)"
**Problem:** Missing customer info
**Fix:** Make sure all required fields are filled

#### Error: "No items in order"
**Problem:** Cart is empty
**Fix:** Add items to cart before checkout

#### Error: "Failed to create payment intent"
**Problem:** Stripe API issue or missing keys
**Fix:** Check Stripe keys in environment variables

---

## Testing Checklist

1. **Add items to cart** ✅
2. **Fill in customer info:**
   - Name ✅
   - Phone ✅
   - Email ✅
   - Address (if delivery) ✅
3. **Click "Proceed to Checkout"**
4. **Check console for errors**
5. **If error appears, read the message - it will tell you what's wrong**

---

## What to Check in Lovable

1. **Environment Variables:**
   - `STRIPE_SECRET_KEY` - Must be set
   - `STRIPE_PUBLISHABLE_KEY` - Must be set
   - `SUPABASE_URL` - Must be set
   - `SUPABASE_ANON_KEY` - Must be set

2. **Edge Functions:**
   - `create-payment-intent` must be deployed
   - Check function logs for errors

3. **Database:**
   - Menu items must have `price` field
   - Orders table must exist

---

## Next Steps

1. **Rebuild edge functions in Lovable**
2. **Test checkout again**
3. **Check browser console for specific error**
4. **Share the exact error message if it still fails**

The error messages will now tell you exactly what's wrong! 🔍

