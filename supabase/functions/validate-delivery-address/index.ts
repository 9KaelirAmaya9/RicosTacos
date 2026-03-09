import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryValidationRequest {
  address: string;
}

// Restaurant location: 505 51st Street, Brooklyn, NY 11220
// Verified coordinates: 40.6501° N, 74.0060° W (longitude is negative for Western hemisphere)
const RESTAURANT_COORDINATES = {
  longitude: -74.0060,
  latitude: 40.6501,
  address: '505 51st Street, Brooklyn, NY 11220'
};

// Maximum delivery time in minutes
const MAX_DELIVERY_TIME_MINUTES = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 validate-delivery-address: Request received');

  try {
    const { address }: DeliveryValidationRequest = await req.json();
    console.log('📍 validate-delivery-address: Validating address:', address);
    
    if (!address || address.trim().length === 0) {
      console.log('❌ validate-delivery-address: Empty address provided');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Please provide a delivery address.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    if (!MAPBOX_TOKEN) {
      console.error('❌ validate-delivery-address: MAPBOX_PUBLIC_TOKEN not configured');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Service temporarily unavailable. Please try pickup instead.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('🗺️  validate-delivery-address: Starting geocoding...');

    // Step 1: Geocode the address to get precise coordinates and ZIP code
    // Using proximity bias to improve accuracy for NYC addresses
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=US&proximity=${RESTAURANT_COORDINATES.longitude},${RESTAURANT_COORDINATES.latitude}&types=address&limit=1`;
    
    console.log('🔍 validate-delivery-address: Calling Mapbox geocoding API...');
    const geocodeResponse = await fetch(geocodeUrl);
    
    if (!geocodeResponse.ok) {
      console.error('❌ validate-delivery-address: Mapbox geocoding error:', geocodeResponse.statusText);
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t verify your address. Pickup is always available!',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geocodeData = await geocodeResponse.json();
    console.log('✅ validate-delivery-address: Geocoding successful, features:', geocodeData.features?.length || 0);

    if (!geocodeData.features || geocodeData.features.length === 0) {
      console.log('❌ validate-delivery-address: No features found for address');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t find that address. Please check and try again, or choose pickup instead.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const feature = geocodeData.features[0];
    const zipCode = feature.context?.find((c: any) => c.id?.startsWith('postcode'))?.text;
    const coordinates = feature.center; // [longitude, latitude]
    const [deliveryLongitude, deliveryLatitude] = coordinates;

    console.log('📍 validate-delivery-address: Extracted coordinates:', { deliveryLongitude, deliveryLatitude, zipCode });

    // Validate coordinates are valid numbers
    if (!deliveryLongitude || !deliveryLatitude || 
        isNaN(deliveryLongitude) || isNaN(deliveryLatitude) ||
        Math.abs(deliveryLongitude) > 180 || Math.abs(deliveryLatitude) > 90) {
      console.error('❌ validate-delivery-address: Invalid coordinates');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t verify the coordinates for that address. Pickup is always available!',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!zipCode) {
      console.log('❌ validate-delivery-address: No ZIP code found');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Please include a valid ZIP code in your delivery address, or choose pickup instead.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Check if ZIP code is in pre-approved delivery zones
    console.log('🗄️  validate-delivery-address: Checking delivery zones DB...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: zone, error: zoneError } = await supabase
      .from('delivery_zones')
      .select('estimated_minutes, is_active')
      .eq('zip_code', zipCode)
      .eq('is_active', true)
      .single();

    // Step 3: If not in database, calculate real-time driving time with traffic
    if (zoneError || !zone) {
      // Use Mapbox Directions API with traffic-aware routing
      // The 'driving-traffic' profile uses real-time traffic data
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${RESTAURANT_COORDINATES.longitude},${RESTAURANT_COORDINATES.latitude};${deliveryLongitude},${deliveryLatitude}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=false&alternatives=false`;
      
      let directionsData: any = null;
      let drivingTimeMinutes: number | null = null;
      let distanceMiles: number | null = null;
      
      // Try traffic-aware routing first
      try {
        const directionsResponse = await fetch(directionsUrl);
        
        if (directionsResponse.ok) {
          directionsData = await directionsResponse.json();
          console.log('✅ Traffic-aware routing successful');
        } else {
          console.warn('⚠️ Traffic API failed, trying fallback:', directionsResponse.statusText);
        }
      } catch (trafficError) {
        console.warn('⚠️ Traffic API error, trying fallback:', trafficError);
      }
      
      // Fallback to regular driving (without traffic) if traffic API fails
      if (!directionsData || !directionsData.routes || directionsData.routes.length === 0) {
        try {
          const fallbackUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${RESTAURANT_COORDINATES.longitude},${RESTAURANT_COORDINATES.latitude};${deliveryLongitude},${deliveryLatitude}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=false`;
          const fallbackResponse = await fetch(fallbackUrl);
          
          if (fallbackResponse.ok) {
            directionsData = await fallbackResponse.json();
            console.log('✅ Fallback routing successful');
          } else {
            console.error('❌ Fallback routing also failed:', fallbackResponse.statusText);
            const errorData = await fallbackResponse.json().catch(() => ({}));
            console.error('Error details:', errorData);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback routing error:', fallbackError);
        }
      }
      
      // Process route data if available
      if (directionsData && directionsData.routes && directionsData.routes.length > 0) {
        const route = directionsData.routes[0];
        drivingTimeMinutes = Math.ceil(route.duration / 60); // Duration in seconds, convert to minutes
        distanceMiles = parseFloat((route.distance / 1609.34).toFixed(1)); // Distance in meters, convert to miles
        
        console.log(`📍 Calculated delivery time: ${drivingTimeMinutes} minutes, distance: ${distanceMiles} miles`);
        
        // Validate the route is reasonable (not too far)
        if (drivingTimeMinutes > MAX_DELIVERY_TIME_MINUTES) {
          return new Response(
            JSON.stringify({ 
              isValid: false, 
              message: `We apologize, but your location is outside our 20-minute delivery zone (estimated ${drivingTimeMinutes} minutes away). Pickup is always available and ready in 20-30 minutes!`,
              suggestPickup: true,
              estimatedMinutes: drivingTimeMinutes,
              distanceMiles: distanceMiles
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // If within range but not in DB, add it for future reference
        try {
          await supabase
            .from('delivery_zones')
            .upsert({ 
              zip_code: zipCode, 
              estimated_minutes: drivingTimeMinutes, 
              is_active: true 
            }, {
              onConflict: 'zip_code'
            });
          console.log('✅ Delivery zone saved to database');
        } catch (dbError) {
          console.error('⚠️ Error saving delivery zone (non-critical):', dbError);
          // Don't fail validation if DB insert fails
        }

        return new Response(
          JSON.stringify({ 
            isValid: true, 
            estimatedMinutes: drivingTimeMinutes,
            message: `Estimated delivery time: ${drivingTimeMinutes} minutes`,
            distanceMiles: distanceMiles
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If we can't calculate route, be conservative and suggest pickup
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t calculate the delivery time to your location. Pickup is always available and ready in 20-30 minutes!',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Return validated zone data
    return new Response(
      JSON.stringify({ 
        isValid: true, 
        estimatedMinutes: zone.estimated_minutes,
        message: `Estimated delivery time: ${zone.estimated_minutes} minutes`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Delivery validation error:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Provide more specific error message
    let errorMessage = 'We apologize, but we couldn\'t validate your address. Pickup is always available!';
    
    if (error instanceof Error) {
      if (error.message.includes('MAPBOX') || error.message.includes('token')) {
        errorMessage = 'Service temporarily unavailable. Please try pickup instead.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error during validation. Please try again or choose pickup.';
      } else {
        errorMessage = error.message || errorMessage;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        isValid: false, 
        message: errorMessage,
        suggestPickup: true,
        error: error instanceof Error ? error.message : String(error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
