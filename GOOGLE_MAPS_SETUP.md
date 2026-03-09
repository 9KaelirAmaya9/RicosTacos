# Google Maps API Setup Guide

## Environment Variables Required

### Client-Side (Frontend)
Add to your `.env` file or Lovable environment variables:
```
VITE_GOOGLE_MAPS_API_KEY=your_client_side_api_key_here
```

### Server-Side (Supabase Edge Functions)
Add to Supabase Edge Functions environment variables:
```
GOOGLE_MAPS_SERVER_API_KEY=your_server_side_api_key_here
```

## Steps to Obtain API Keys

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Go to "APIs & Services" > "Library"
   - Enable the following APIs:
     - Places API (New)
     - Geocoding API
     - Distance Matrix API

3. **Create API Keys**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Create two separate keys:
     - **Client-side key:** For frontend (Places Autocomplete)
     - **Server-side key:** For edge functions (Geocoding, Distance Matrix)

4. **Configure API Key Restrictions**

   **Client-Side Key:**
   - Application restrictions: HTTP referrers
   - Add your domain: `https://yourdomain.com/*`
   - API restrictions: Places API (New) only

   **Server-Side Key:**
   - Application restrictions: IP addresses
   - Add Supabase Edge Function IP ranges (or leave unrestricted for testing)
   - API restrictions: Geocoding API, Distance Matrix API, Places API (New)

5. **Update index.html**
   - Replace `YOUR_API_KEY` in `index.html` with your client-side API key
   - Or use environment variable: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`

6. **Add to Supabase**
   - Go to Supabase Dashboard > Edge Functions > Settings
   - Add `GOOGLE_MAPS_SERVER_API_KEY` environment variable

## Testing

After setup, test the integration:
1. Go to checkout page
2. Select "Delivery"
3. Start typing an address
4. Verify autocomplete suggestions appear
5. Select an address
6. Verify validation completes successfully

## Troubleshooting

### Autocomplete not working
- Check browser console for API key errors
- Verify API key is correctly set in `index.html`
- Verify Places API is enabled
- Check API key restrictions

### Validation timeout
- Verify `GOOGLE_MAPS_SERVER_API_KEY` is set in Supabase
- Check edge function logs for errors
- Verify all required APIs are enabled
- Check API quotas haven't been exceeded

## Cost Considerations

- **Places Autocomplete:** $2.83 per 1,000 requests
- **Place Details:** $17 per 1,000 requests  
- **Distance Matrix:** $5 per 1,000 requests

Estimated monthly cost for 1,000 orders: ~$25

