# Delivery Validation Troubleshooting Guide

**Date:** November 18, 2025  
**Status:** 🔧 **TROUBLESHOOTING IN PROGRESS**

---

## 🔍 Problem

Delivery verification is not working in:
1. **Location page** (`/location`) - `DeliveryAddressValidator` component
2. **Checkout flow** (`/cart`) - Delivery address validation during checkout

---

## ✅ Fixes Applied

### 1. **Enhanced Error Handling**
- Added comprehensive response parsing
- Better handling of different Supabase response formats
- Improved error message extraction

### 2. **Improved Debugging**
- Added detailed console logging throughout the validation flow
- Logs include:
  - Raw result from edge function
  - Result type and keys
  - Parsed data and error objects
  - Validation result details

### 3. **Timeout Adjustments**
- Utility function: 20 seconds
- Cart checkout: 25 seconds
- Edge function API calls: 10 seconds each

### 4. **Error Detection**
- Better detection of timeout scenarios
- Handles validation results in error fields
- Improved error message display

---

## 🔧 Troubleshooting Steps

### Step 1: Check Browser Console

Open browser DevTools (F12) and check the Console tab when testing validation:

**Expected Logs:**
```
🔍 DeliveryAddressValidator: Starting validation for place_id: [place_id]
🚀 Starting Google Maps delivery validation for place_id: [place_id]
📦 Google Maps validation raw result: [result]
📦 Result type: object
📦 Result keys: [keys]
✅ Google Maps validation successful: [result]
✅ DeliveryAddressValidator: Validation result: [result]
```

**If you see errors, note:**
- Error message
- Error type
- Error stack trace
- Network tab status

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "validate-delivery-google"
3. Click on the request
4. Check:
   - **Status Code:** Should be 200
   - **Request Payload:** Should include `place_id` and `formatted_address`
   - **Response:** Should contain validation result

**Common Issues:**
- **404:** Edge function not deployed
- **500:** Edge function error (check edge function logs)
- **CORS Error:** CORS headers not configured
- **Timeout:** Request taking too long

### Step 3: Verify Edge Function Configuration

**Check in Supabase Dashboard:**
1. Go to Edge Functions
2. Find `validate-delivery-google`
3. Check environment variables:
   - `GOOGLE_MAPS_SERVER_API_KEY` - **REQUIRED**
   - `SUPABASE_URL` - Should be auto-configured
   - `SUPABASE_SERVICE_ROLE_KEY` - Should be auto-configured

**Verify Edge Function is Deployed:**
```bash
# In Supabase CLI
supabase functions list
supabase functions logs validate-delivery-google
```

### Step 4: Test Edge Function Directly

**Using Supabase Dashboard:**
1. Go to Edge Functions → `validate-delivery-google`
2. Click "Invoke"
3. Use this test payload:
```json
{
  "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "formatted_address": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA"
}
```

**Expected Response:**
```json
{
  "isValid": true,
  "estimatedMinutes": 15,
  "message": "Estimated delivery time: 15 minutes",
  "distanceMiles": 2.5,
  "formattedAddress": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA"
}
```

### Step 5: Check Google Maps API Key

**Verify API Key is Valid:**
1. Check `GOOGLE_MAPS_SERVER_API_KEY` in Supabase Edge Function secrets
2. Verify the key has these APIs enabled:
   - Places API (Place Details)
   - Distance Matrix API
3. Check API key restrictions (if any)
4. Verify billing is enabled (if required)

**Test API Key:**
```bash
curl "https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4&fields=geometry,formatted_address,address_components&key=YOUR_API_KEY"
```

### Step 6: Check Edge Function Logs

**In Supabase Dashboard:**
1. Go to Edge Functions → `validate-delivery-google`
2. Click "Logs"
3. Look for:
   - Error messages
   - API call failures
   - Timeout errors
   - Missing environment variables

**Common Log Messages:**
- `❌ validate-delivery-google: GOOGLE_MAPS_SERVER_API_KEY not configured`
- `❌ validate-delivery-google: Google Places API error: [error]`
- `❌ validate-delivery-google: Distance Matrix API error: [error]`
- `⏱️ Places API call took [time]ms`
- `⏱️ Database query took [time]ms`
- `⏱️ Distance Matrix API call took [time]ms`

---

## 🐛 Common Issues & Solutions

### Issue 1: "Service temporarily unavailable"

**Cause:** `GOOGLE_MAPS_SERVER_API_KEY` not set in edge function

**Solution:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Add `GOOGLE_MAPS_SERVER_API_KEY` with your Google Maps API key
3. Redeploy the edge function

### Issue 2: "Validation timeout"

**Cause:** Edge function taking too long (>20 seconds)

**Possible Reasons:**
- Slow Google Maps API responses
- Network latency
- Database query timeout
- Cold start (first invocation)

**Solution:**
- Check edge function logs for slow API calls
- Verify Google Maps API is responding quickly
- Check database performance
- Consider increasing timeout (not recommended)

### Issue 3: "Invalid validation response"

**Cause:** Edge function returning unexpected format

**Solution:**
- Check edge function logs
- Verify edge function is returning proper JSON
- Check response structure matches expected format

### Issue 4: CORS Errors

**Cause:** CORS headers not configured in edge function

**Solution:**
- Verify `corsHeaders` are included in edge function response
- Check edge function code includes CORS headers

### Issue 5: Edge Function Not Found (404)

**Cause:** Edge function not deployed

**Solution:**
```bash
# Deploy edge function
supabase functions deploy validate-delivery-google
```

---

## 📊 Debugging Checklist

- [ ] Browser console shows validation attempt
- [ ] Network tab shows request to `validate-delivery-google`
- [ ] Request status is 200 (not 404, 500, etc.)
- [ ] Edge function is deployed in Supabase
- [ ] `GOOGLE_MAPS_SERVER_API_KEY` is set in edge function secrets
- [ ] Google Maps API key is valid and has required APIs enabled
- [ ] Edge function logs show no errors
- [ ] Response format matches expected structure
- [ ] Timeout values are appropriate (20s utility, 25s Cart)

---

## 🔍 What to Check Next

1. **Check Browser Console:**
   - Look for error messages
   - Check validation result logs
   - Note any timeout messages

2. **Check Network Tab:**
   - Verify request is being made
   - Check response status
   - Review response payload

3. **Check Supabase Dashboard:**
   - Verify edge function is deployed
   - Check environment variables
   - Review edge function logs

4. **Test Edge Function Directly:**
   - Use Supabase Dashboard to invoke function
   - Test with a known valid place_id
   - Verify response format

---

## 📝 Next Steps

1. **Gather Information:**
   - Browser console errors
   - Network tab request/response
   - Edge function logs
   - Edge function environment variables status

2. **Test Edge Function:**
   - Invoke directly from Supabase Dashboard
   - Verify API key is working
   - Check response format

3. **Verify Configuration:**
   - Google Maps API key is set
   - Required APIs are enabled
   - Billing is enabled (if required)

---

**Status:** Ready for debugging with enhanced logging and error handling.
