# Google Maps Integration - Test & Verification Guide

**Date:** November 18, 2025  
**Purpose:** Comprehensive testing and verification of Google Maps address validation integration

---

## 🧪 Pre-Testing Setup

### **1. API Key Configuration**

#### **Step 1.1: Obtain Google Maps API Keys**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the following APIs:
   - **Places API (New)**
   - **Geocoding API**
   - **Distance Matrix API**

#### **Step 1.2: Create API Keys**
1. Go to "APIs & Services" > "Credentials"
2. Create two API keys:
   - **Client-side key** (for frontend)
   - **Server-side key** (for edge functions)

#### **Step 1.3: Configure Restrictions**

**Client-Side Key:**
- Application restrictions: HTTP referrers
- Add: `https://yourdomain.com/*` and `http://localhost:*` (for testing)
- API restrictions: Places API (New) only

**Server-Side Key:**
- Application restrictions: IP addresses (or leave unrestricted for testing)
- API restrictions: Geocoding API, Distance Matrix API, Places API (New)

#### **Step 1.4: Set Environment Variables**

**Frontend (.env or Lovable):**
```
VITE_GOOGLE_MAPS_API_KEY=your_client_side_key_here
```

**Supabase Edge Functions:**
1. Go to Supabase Dashboard > Edge Functions > Settings
2. Add environment variable:
   ```
   GOOGLE_MAPS_SERVER_API_KEY=your_server_side_key_here
   ```

---

## ✅ Test Scenarios

### **Test 1: Google Maps API Loading**

**Objective:** Verify Google Maps API loads correctly

**Steps:**
1. Open browser console (F12)
2. Navigate to checkout page
3. Select "Delivery" tab
4. Check console for: `✅ Google Maps API loaded`

**Expected Results:**
- ✅ No console errors
- ✅ "Google Maps API loaded" message appears
- ✅ Address input field is enabled
- ✅ "Loading address autocomplete..." message disappears

**Failure Indicators:**
- ❌ Console error: "VITE_GOOGLE_MAPS_API_KEY not set"
- ❌ Console error: "Failed to load Google Maps API"
- ❌ Address input remains disabled

---

### **Test 2: Autocomplete Functionality**

**Objective:** Verify address autocomplete suggestions appear

**Steps:**
1. Navigate to checkout page
2. Select "Delivery" tab
3. Click on "Delivery Address" input field
4. Type: "505 51st Street, Brooklyn"
5. Wait for suggestions dropdown

**Expected Results:**
- ✅ Suggestions appear within 500ms
- ✅ Suggestions include "505 51st Street, Brooklyn, NY 11220, USA" or similar
- ✅ Multiple relevant suggestions shown
- ✅ No console errors

**Failure Indicators:**
- ❌ No suggestions appear
- ❌ Console errors about API key
- ❌ Suggestions appear but are incorrect

---

### **Test 3: Address Selection**

**Objective:** Verify place_id and formatted address are captured

**Steps:**
1. Type address in autocomplete field
2. Select an address from dropdown
3. Check browser console

**Expected Results:**
- ✅ Address is filled in automatically
- ✅ Console shows: `📍 Google Place selected:` with place_id
- ✅ Formatted address is displayed correctly
- ✅ Input field shows complete address

**Failure Indicators:**
- ❌ Address not filled in after selection
- ❌ Console shows error
- ❌ place_id is missing or invalid

---

### **Test 4: Address Validation (Within Zone)**

**Objective:** Verify validation works for addresses within delivery zone

**Test Addresses (within 15-minute zone):**
- `505 51st Street, Brooklyn, NY 11220`
- `450 50th Street, Brooklyn, NY 11220`
- `600 52nd Street, Brooklyn, NY 11220`

**Steps:**
1. Select "Delivery" tab
2. Select address from autocomplete
3. Click "Place Order" button
4. Observe validation process

**Expected Results:**
- ✅ Validation completes in < 5 seconds
- ✅ Success toast: "Estimated delivery: X minutes"
- ✅ No timeout errors
- ✅ Checkout proceeds normally
- ✅ Console shows: `✅ Google Maps validation successful`

**Failure Indicators:**
- ❌ Validation timeout (> 5 seconds)
- ❌ Error message instead of success
- ❌ Checkout blocked incorrectly

---

### **Test 5: Address Validation (Outside Zone)**

**Objective:** Verify validation correctly identifies addresses outside zone

**Test Addresses (outside 15-minute zone):**
- `Times Square, New York, NY 10036`
- `Central Park, New York, NY 10024`
- `Manhattan, NY` (general area)

**Steps:**
1. Select "Delivery" tab
2. Select address from autocomplete
3. Click "Place Order" button
4. Observe validation result

**Expected Results:**
- ✅ Validation completes in < 5 seconds
- ✅ Error toast: "We apologize, but your location is outside our 15-minute delivery zone..."
- ✅ "Switch to Pickup" action button appears
- ✅ Checkout is blocked (user must switch to pickup)
- ✅ Console shows validation result with `isValid: false`

**Failure Indicators:**
- ❌ Validation allows outside-zone addresses
- ❌ No error message shown
- ❌ Checkout proceeds incorrectly

---

### **Test 6: Timeout Handling**

**Objective:** Verify timeout protection works correctly

**Steps:**
1. Open browser DevTools > Network tab
2. Set throttling to "Slow 3G"
3. Select "Delivery" tab
4. Select address from autocomplete
5. Click "Place Order" button
6. Observe behavior

**Expected Results:**
- ✅ Validation attempts for up to 5 seconds
- ✅ If timeout occurs, warning toast appears
- ✅ Checkout proceeds with warning (non-blocking)
- ✅ Console shows timeout message
- ✅ No infinite loading

**Failure Indicators:**
- ❌ Validation hangs indefinitely
- ❌ No timeout protection
- ❌ Checkout blocked forever

---

### **Test 7: Fallback to Text Validation**

**Objective:** Verify fallback works when place_id is not available

**Steps:**
1. Select "Delivery" tab
2. Manually type address (don't select from autocomplete)
3. Click "Place Order" button
4. Observe validation

**Expected Results:**
- ✅ Warning: "Please select an address from the autocomplete suggestions..."
- ✅ OR fallback to text-based validation (Mapbox)
- ✅ Checkout can still proceed
- ✅ Console shows fallback validation

**Failure Indicators:**
- ❌ Checkout completely blocked
- ❌ No fallback mechanism
- ❌ Error without explanation

---

### **Test 8: Order Creation with Google Maps Address**

**Objective:** Verify formatted address is stored correctly in orders

**Steps:**
1. Complete full checkout with Google Maps address
2. Complete payment
3. Check order in database or admin panel

**Expected Results:**
- ✅ Order created successfully
- ✅ `delivery_address` field contains formatted address from Google Maps
- ✅ Address is properly formatted (e.g., "505 51st Street, Brooklyn, NY 11220, USA")
- ✅ Order appears in admin/kitchen dashboards

**Failure Indicators:**
- ❌ Order creation fails
- ❌ Address field is empty or incorrect
- ❌ Address format is inconsistent

---

### **Test 9: Error Handling**

**Objective:** Verify graceful error handling

**Test Scenarios:**
1. **Invalid API Key:**
   - Set incorrect API key
   - Verify error message appears
   - Verify fallback behavior

2. **Network Failure:**
   - Disable network in DevTools
   - Attempt validation
   - Verify error handling

3. **API Quota Exceeded:**
   - Simulate quota exceeded (if possible)
   - Verify error message
   - Verify fallback

**Expected Results:**
- ✅ User-friendly error messages
- ✅ No technical details exposed
- ✅ Fallback mechanisms work
- ✅ Checkout can still proceed (with warning)

---

### **Test 10: Performance Verification**

**Objective:** Verify performance improvements

**Metrics to Measure:**
- Autocomplete response time
- Validation completion time
- Total checkout time

**Steps:**
1. Open browser DevTools > Network tab
2. Select "Delivery" tab
3. Type address and select from autocomplete
4. Click "Place Order"
5. Measure times in console

**Expected Results:**
- ✅ Autocomplete: < 500ms
- ✅ Validation: < 3 seconds (typically 1-2 seconds)
- ✅ Total checkout: < 6 seconds
- ✅ Zero timeout errors

**Before vs After:**
- **Before:** 8+ seconds, frequent timeouts
- **After:** < 3 seconds, no timeouts

---

## 📊 Verification Checklist

### **Functionality Verification**
- [ ] Google Maps API loads correctly
- [ ] Autocomplete suggestions appear
- [ ] Address selection works
- [ ] place_id is captured correctly
- [ ] Validation works for in-zone addresses
- [ ] Validation works for out-of-zone addresses
- [ ] Timeout protection works
- [ ] Fallback to text validation works
- [ ] Formatted address stored in orders
- [ ] Error handling is graceful

### **Performance Verification**
- [ ] Autocomplete: < 500ms
- [ ] Validation: < 3 seconds
- [ ] No timeout errors
- [ ] Faster than previous implementation

### **User Experience Verification**
- [ ] Intuitive autocomplete interface
- [ ] Clear validation feedback
- [ ] Helpful error messages
- [ ] Smooth checkout flow

---

## 🔍 Debugging Guide

### **Common Issues & Solutions**

#### **Issue 1: Autocomplete Not Appearing**
**Symptoms:**
- No suggestions when typing
- Console shows API key error

**Solutions:**
1. Verify `VITE_GOOGLE_MAPS_API_KEY` is set
2. Check API key restrictions (HTTP referrers)
3. Verify Places API (New) is enabled
4. Check browser console for specific errors

#### **Issue 2: Validation Timeout**
**Symptoms:**
- Validation takes > 5 seconds
- Timeout error appears

**Solutions:**
1. Check network connection
2. Verify `GOOGLE_MAPS_SERVER_API_KEY` is set in Supabase
3. Check Supabase Edge Function logs
4. Verify all required APIs are enabled
5. Check API quotas haven't been exceeded

#### **Issue 3: Invalid place_id**
**Symptoms:**
- Validation fails with "Invalid place_id" error

**Solutions:**
1. Verify user selected address from autocomplete
2. Check that place_id is being passed correctly
3. Verify Google Places API is enabled
4. Check edge function logs for details

#### **Issue 4: API Key Errors**
**Symptoms:**
- Console shows API key errors
- "Service temporarily unavailable" messages

**Solutions:**
1. Verify API keys are correct
2. Check API key restrictions
3. Verify required APIs are enabled
4. Check billing is enabled in Google Cloud
5. Verify API quotas

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Environment: [ ] Local [ ] Staging [ ] Production

Test 1: API Loading
- Status: [ ] Pass [ ] Fail
- Notes: ___________

Test 2: Autocomplete
- Status: [ ] Pass [ ] Fail
- Response Time: _____ms
- Notes: ___________

Test 3: Address Selection
- Status: [ ] Pass [ ] Fail
- place_id Captured: [ ] Yes [ ] No
- Notes: ___________

Test 4: Validation (In Zone)
- Status: [ ] Pass [ ] Fail
- Validation Time: _____seconds
- Notes: ___________

Test 5: Validation (Out Zone)
- Status: [ ] Pass [ ] Fail
- Error Message: [ ] Correct [ ] Incorrect
- Notes: ___________

Test 6: Timeout Handling
- Status: [ ] Pass [ ] Fail
- Notes: ___________

Test 7: Fallback
- Status: [ ] Pass [ ] Fail
- Notes: ___________

Test 8: Order Creation
- Status: [ ] Pass [ ] Fail
- Address Stored: [ ] Yes [ ] No
- Notes: ___________

Test 9: Error Handling
- Status: [ ] Pass [ ] Fail
- Notes: ___________

Test 10: Performance
- Autocomplete: _____ms
- Validation: _____seconds
- Total: _____seconds
- Notes: ___________

Overall Status: [ ] Ready for Production [ ] Needs Fixes
Issues Found: ___________
```

---

## ✅ Success Criteria

### **Must Have (Required)**
- ✅ Autocomplete suggestions appear
- ✅ Address selection works
- ✅ Validation completes in < 5 seconds
- ✅ No timeout errors under normal conditions
- ✅ In-zone addresses validate correctly
- ✅ Out-of-zone addresses are rejected
- ✅ Formatted addresses stored in orders
- ✅ Error handling is graceful

### **Should Have (Recommended)**
- ✅ Validation completes in < 3 seconds
- ✅ Autocomplete appears in < 500ms
- ✅ Zero timeout errors
- ✅ 99%+ validation accuracy
- ✅ Smooth user experience

---

## 🚀 Production Readiness

**Status:** ⏳ **PENDING API KEY CONFIGURATION**

**Before Production:**
1. ⏳ Configure API keys (client and server)
2. ⏳ Test all scenarios above
3. ⏳ Verify performance metrics
4. ⏳ Set up API quotas and alerts
5. ⏳ Monitor costs
6. ⏳ Load test with multiple users

---

**Test Guide Version:** 1.0  
**Created:** November 18, 2025  
**Status:** Ready for Testing

