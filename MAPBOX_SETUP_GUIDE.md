# Mapbox Integration Setup Guide

## ✅ Good News: Mapbox is Already Integrated!

Mapbox is already integrated into your site. You just need to:
1. Get a Mapbox API token
2. Add it to your environment variables
3. That's it!

---

## Current Mapbox Usage

### 1. **Service Area Map Component** (`src/components/ServiceAreaMap.tsx`)
- Displays interactive map showing your restaurant location
- Shows 15-minute delivery zone (isochrone)
- Used on the Location/Service Area page

### 2. **Delivery Address Validation** (`supabase/functions/validate-delivery-address/index.ts`)
- Uses Mapbox Geocoding API to convert addresses to coordinates
- Uses Mapbox Directions API to calculate driving time
- Validates if addresses are within 15-minute delivery zone

### 3. **Dependencies**
- ✅ `mapbox-gl` package is already installed
- ✅ Mapbox CSS is imported
- ✅ Components are ready to use

---

## Step-by-Step Setup

### Step 1: Get Mapbox API Token

1. **Create Mapbox Account** (if you don't have one)
   - Go to https://account.mapbox.com/
   - Sign up for free account
   - Free tier includes: 50,000 map loads/month, 100,000 geocoding requests/month

2. **Get Your Access Token**
   - After signing in, go to https://account.mapbox.com/access-tokens/
   - You'll see your **Default public token** (starts with `pk.eyJ...`)
   - Copy this token

3. **Token Scopes Needed**
   - ✅ **Public** scope (for frontend maps)
   - ✅ **Geocoding** scope (for address validation)
   - ✅ **Directions** scope (for route calculation)
   - ✅ **Isochrone** scope (for delivery zones)

   **Note:** The default public token usually has all these scopes enabled.

---

### Step 2: Add Token to Environment Variables

#### For Local Development (.env file)

1. Create or edit `.env` file in project root:
```env
VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...
```

2. Replace `pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...` with your actual token

3. Restart your dev server:
```bash
npm run dev
```

#### For Lovable Deployment

1. Go to your Lovable project settings
2. Navigate to **Environment Variables**
3. Add new variable:
   - **Name:** `VITE_MAPBOX_PUBLIC_TOKEN` (or `MAPBOX_PUBLIC_TOKEN` if Lovable doesn't allow `VITE_` prefix)
   - **Value:** Your Mapbox token (starts with `pk.eyJ...`)
4. Save and rebuild

**Note:** If Lovable doesn't accept `VITE_` prefix, the code already supports both:
- `VITE_MAPBOX_PUBLIC_TOKEN` (preferred)
- `MAPBOX_PUBLIC_TOKEN` (fallback)

#### For Supabase Edge Functions

The edge function `validate-delivery-address` also needs the Mapbox token:

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add secret:
   - **Name:** `MAPBOX_PUBLIC_TOKEN`
   - **Value:** Your Mapbox token (same token as above)
4. Save

**Note:** Edge functions use `MAPBOX_PUBLIC_TOKEN` (without `VITE_` prefix)

---

## How Mapbox is Used

### 1. Service Area Map Display

**Component:** `src/components/ServiceAreaMap.tsx`

**What it does:**
- Shows interactive map centered on your restaurant
- Displays restaurant location with marker
- Shows 15-minute delivery zone as shaded area
- Uses Mapbox Isochrone API to calculate service area

**Where it's used:**
- Location/Service Area page
- Shows customers your delivery coverage

**Features:**
- Interactive zoom/pan
- Navigation controls
- Restaurant marker with popup
- Service area visualization

---

### 2. Delivery Address Validation

**Edge Function:** `supabase/functions/validate-delivery-address/index.ts`

**What it does:**
1. **Geocoding:** Converts customer address to coordinates
   - Uses Mapbox Geocoding API
   - Includes proximity bias (prioritizes addresses near restaurant)

2. **Route Calculation:** Calculates driving time
   - Uses Mapbox Directions API with `driving-traffic` profile
   - Includes real-time traffic data
   - Falls back to `driving` profile if traffic data unavailable

3. **Validation:** Checks if within 15-minute zone
   - Compares calculated time to 15-minute threshold
   - Returns validation result with estimated delivery time

**Where it's used:**
- Checkout process (when customer selects delivery)
- Validates delivery address before order placement
- Suggests pickup if outside delivery zone

---

## Mapbox API Usage

### APIs Used:

1. **Mapbox GL JS** (Frontend Maps)
   - Library: `mapbox-gl`
   - Purpose: Display interactive maps
   - Usage: Service area visualization

2. **Geocoding API** (Address → Coordinates)
   - Endpoint: `https://api.mapbox.com/geocoding/v5/mapbox.places/`
   - Purpose: Convert addresses to lat/lng
   - Usage: Delivery address validation

3. **Directions API** (Route Calculation)
   - Endpoint: `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/`
   - Purpose: Calculate driving time with traffic
   - Usage: Delivery zone validation

4. **Isochrone API** (Service Area)
   - Endpoint: `https://api.mapbox.com/isochrone/v1/mapbox/driving/`
   - Purpose: Calculate 15-minute service area polygon
   - Usage: Visual service area display

---

## Testing Mapbox Integration

### Test 1: Service Area Map

1. Navigate to `/location` or wherever `ServiceAreaMap` is used
2. You should see:
   - ✅ Interactive map
   - ✅ Restaurant marker
   - ✅ Shaded delivery zone area
   - ✅ Map controls (zoom, pan)

**If you see "Map loading..." instead:**
- Check that `VITE_MAPBOX_PUBLIC_TOKEN` is set
- Check browser console for errors
- Verify token is valid

---

### Test 2: Delivery Validation

1. Go to checkout
2. Select "Delivery"
3. Enter a delivery address
4. The system should:
   - ✅ Validate the address
   - ✅ Check if within 15-minute zone
   - ✅ Show estimated delivery time (if valid)
   - ✅ Suggest pickup (if outside zone)

**If validation fails:**
- Check Supabase Edge Function logs
- Verify `MAPBOX_PUBLIC_TOKEN` is set in Supabase secrets
- Check browser console for errors

---

## Troubleshooting

### Issue: Map Not Loading

**Symptoms:**
- "Map loading..." message persists
- Blank map area
- Console errors about Mapbox

**Solutions:**
1. Verify `VITE_MAPBOX_PUBLIC_TOKEN` is set in `.env`
2. Check token is valid (starts with `pk.eyJ...`)
3. Verify token has correct scopes
4. Check browser console for specific errors
5. Restart dev server after adding token

---

### Issue: Delivery Validation Not Working

**Symptoms:**
- Address validation always fails
- "Could not validate address" message
- Edge function errors

**Solutions:**
1. Verify `MAPBOX_PUBLIC_TOKEN` is set in Supabase Edge Function secrets
2. Check Supabase Edge Function logs for errors
3. Verify token has Geocoding and Directions scopes
4. Test token directly with Mapbox API

---

### Issue: Token Invalid or Expired

**Symptoms:**
- 401 Unauthorized errors
- "Invalid token" messages
- Maps/APIs not working

**Solutions:**
1. Generate new token in Mapbox dashboard
2. Update token in all locations:
   - `.env` file (for frontend)
   - Supabase Edge Function secrets (for backend)
   - Lovable environment variables (for deployment)
3. Restart services after updating

---

## Mapbox Pricing

### Free Tier (Good for Development)
- **50,000 map loads/month**
- **100,000 geocoding requests/month**
- **100,000 directions requests/month**
- Perfect for small restaurants

### Paid Plans (If You Need More)
- **Pay-as-you-go:** $0.50 per 1,000 additional requests
- **Starter:** $5/month for 200,000 requests
- **Growth:** Custom pricing for high volume

**For a restaurant:**
- Free tier is usually sufficient
- Monitor usage in Mapbox dashboard
- Upgrade if you exceed limits

---

## Security Notes

### ✅ Safe to Expose:
- **Public token** (`pk.eyJ...`) - Can be in frontend code
- This token is designed for client-side use
- Mapbox has URL restrictions you can set

### ❌ Never Expose:
- **Secret token** (`sk.eyJ...`) - Server-side only
- We're not using secret tokens in this project

### Best Practices:
1. Set URL restrictions in Mapbox dashboard
2. Limit token scopes to what's needed
3. Monitor usage for unusual activity
4. Rotate tokens periodically

---

## Quick Reference

### Environment Variables Needed:

**Frontend (`.env` or Lovable):**
```env
VITE_MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...
```

**Backend (Supabase Edge Functions):**
```
MAPBOX_PUBLIC_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNs...
```

### Files Using Mapbox:

1. `src/components/ServiceAreaMap.tsx` - Map display
2. `supabase/functions/validate-delivery-address/index.ts` - Address validation
3. `src/utils/deliveryValidation.ts` - Client-side validation wrapper

### Mapbox Features Used:

- ✅ Interactive maps (Mapbox GL JS)
- ✅ Geocoding (address → coordinates)
- ✅ Directions (route calculation with traffic)
- ✅ Isochrones (service area polygons)

---

## Next Steps

1. **Get Mapbox token** from https://account.mapbox.com/access-tokens/
2. **Add to `.env`** for local development
3. **Add to Lovable** for deployment
4. **Add to Supabase** for edge functions
5. **Test the integration** using the tests above

---

## Support

- **Mapbox Docs:** https://docs.mapbox.com/
- **Mapbox GL JS:** https://docs.mapbox.com/mapbox-gl-js/
- **Geocoding API:** https://docs.mapbox.com/api/search/geocoding/
- **Directions API:** https://docs.mapbox.com/api/navigation/directions/

---

**Status:** ✅ Mapbox is integrated and ready - just add your token!

