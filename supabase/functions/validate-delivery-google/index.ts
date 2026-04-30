import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeliveryValidationRequest {
  place_id: string;
  formatted_address?: string;
}

// Restaurant location: 505 51st Street, Brooklyn, NY 11220
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

  console.log('🔄 validate-delivery-google: Request received');
  const requestStartTime = Date.now();

  try {
    const { place_id, formatted_address }: DeliveryValidationRequest = await req.json();
    console.log('📍 validate-delivery-google: Validating place_id:', place_id);
    
    if (!place_id || place_id.trim().length === 0) {
      console.log('❌ validate-delivery-google: Empty place_id provided');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Please provide a valid address.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_SERVER_API_KEY');
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ validate-delivery-google: GOOGLE_MAPS_SERVER_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'Service temporarily unavailable. Please try pickup instead.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('🗺️  validate-delivery-google: Starting Google Places API validation...');

    // Step 1: Get place details using place_id
    const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=geometry,formatted_address,address_components&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('🔍 validate-delivery-google: Calling Google Places API...');
    const placeDetailsStartTime = Date.now();
    
    // Add timeout to Places API call (10 seconds)
    const placesApiTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Places API timeout')), 10000);
    });
    
    const placeDetailsResponse = await Promise.race([
      fetch(placeDetailsUrl),
      placesApiTimeout
    ]) as Response;
    
    const placesApiTime = Date.now() - placeDetailsStartTime;
    console.log(`⏱️  Places API call took ${placesApiTime}ms`);
    
    if (!placeDetailsResponse.ok) {
      console.error('❌ validate-delivery-google: Google Places API error:', placeDetailsResponse.statusText);
      const errorData = await placeDetailsResponse.json().catch(() => ({}));
      console.error('Error details:', errorData);
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t verify your address. Pickup is always available!',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const placeDetailsData = await placeDetailsResponse.json();
    console.log('✅ validate-delivery-google: Place details retrieved');

    if (placeDetailsData.status !== 'OK' || !placeDetailsData.result) {
      console.log('❌ validate-delivery-google: Invalid place_id or place not found');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t find that address. Please check and try again, or choose pickup instead.',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const place = placeDetailsData.result;
    const deliveryLatitude = place.geometry.location.lat;
    const deliveryLongitude = place.geometry.location.lng;
    const verifiedFormattedAddress = place.formatted_address || formatted_address || '';

    console.log('📍 validate-delivery-google: Extracted coordinates:', { deliveryLongitude, deliveryLatitude });

    // Validate coordinates are valid numbers
    if (!deliveryLongitude || !deliveryLatitude || 
        isNaN(deliveryLongitude) || isNaN(deliveryLatitude) ||
        Math.abs(deliveryLongitude) > 180 || Math.abs(deliveryLatitude) > 90) {
      console.error('❌ validate-delivery-google: Invalid coordinates');
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: 'We apologize, but we couldn\'t verify the coordinates for that address. Pickup is always available!',
          suggestPickup: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract ZIP code from address components
    const zipCodeComponent = place.address_components?.find(
      (component: any) => component.types.includes('postal_code')
    );
    const zipCode = zipCodeComponent?.long_name;

    if (!zipCode) {
      console.log('❌ validate-delivery-google: No ZIP code found');
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
    console.log('🗄️  validate-delivery-google: Checking delivery zones DB...');
    const dbStartTime = Date.now();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Add timeout to database query (3 seconds - DB should be fast)
    const dbTimeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 3000);
    });

    const dbQuery = supabase
      .from('delivery_zones')
      .select('estimated_minutes, is_active')
      .eq('zip_code', zipCode)
      .eq('is_active', true)
      .single();

    let zone: any = null;
    let zoneError: any = null;
    
    try {
      const result = await Promise.race([
        dbQuery.then((r: any) => ({ type: 'success', ...r })),
        dbTimeout.then(() => ({ type: 'timeout' }))
      ]);
      
      if (result.type === 'timeout') {
        console.error('⏱️  Database query timed out after 3 seconds');
        zoneError = { message: 'Database query timeout' };
      } else {
        zone = result.data;
        zoneError = result.error;
      }
    } catch (dbError: any) {
      console.error('❌ validate-delivery-google: Database query error:', dbError);
      zoneError = dbError;
    }
    
    const dbTime = Date.now() - dbStartTime;
    console.log(`⏱️  Database query took ${dbTime}ms`);

    // Step 3: If not in database, calculate real-time travel time using Google Distance Matrix API
    if (zoneError || !zone) {
      console.log('📍 validate-delivery-google: ZIP not in DB, calculating travel time...');
      
      // Use Google Distance Matrix API with traffic-aware routing
      const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${RESTAURANT_COORDINATES.latitude},${RESTAURANT_COORDINATES.longitude}&destinations=${deliveryLatitude},${deliveryLongitude}&mode=driving&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;
      
      let distanceMatrixData: any = null;
      let drivingTimeMinutes: number | null = null;
      let distanceMiles: number | null = null;
      
      try {
        const distanceMatrixStartTime = Date.now();
        
        // Add timeout to Distance Matrix API call (10 seconds)
        const distanceMatrixTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Distance Matrix API timeout')), 10000);
        });
        
        const distanceMatrixResponse = await Promise.race([
          fetch(distanceMatrixUrl),
          distanceMatrixTimeout
        ]) as Response;
        
        const distanceMatrixTime = Date.now() - distanceMatrixStartTime;
        console.log(`⏱️  Distance Matrix API call took ${distanceMatrixTime}ms`);
        
        if (distanceMatrixResponse.ok) {
          distanceMatrixData = await distanceMatrixResponse.json();
          console.log('✅ validate-delivery-google: Distance Matrix API successful');
          
          if (distanceMatrixData.status === 'OK' && 
              distanceMatrixData.rows && 
              distanceMatrixData.rows.length > 0 &&
              distanceMatrixData.rows[0].elements &&
              distanceMatrixData.rows[0].elements.length > 0) {
            
            const element = distanceMatrixData.rows[0].elements[0];
            
            if (element.status === 'OK') {
              // Duration in traffic (if available) or regular duration
              const duration = element.duration_in_traffic?.value || element.duration?.value || 0;
              const distance = element.distance?.value || 0; // Distance in meters
              
              drivingTimeMinutes = Math.ceil(duration / 60); // Convert seconds to minutes
              distanceMiles = parseFloat((distance / 1609.34).toFixed(1)); // Convert meters to miles
              
              console.log(`📍 validate-delivery-google: Calculated delivery time: ${drivingTimeMinutes} minutes, distance: ${distanceMiles} miles`);
            } else {
              console.error('❌ validate-delivery-google: Distance Matrix element status:', element.status);
            }
          }
        } else {
          console.error('❌ validate-delivery-google: Distance Matrix API error:', distanceMatrixResponse.statusText);
        }
      } catch (distanceError: any) {
        console.error('❌ validate-delivery-google: Distance Matrix API exception:', distanceError);
        if (distanceError?.message === 'Distance Matrix API timeout') {
          console.error('⏱️  Distance Matrix API timed out after 10 seconds');
        }
      }
      
      // Validate the route is reasonable (not too far)
      const SOFT_LIMIT_MINUTES = MAX_DELIVERY_TIME_MINUTES + 5; // small grace window for real-world traffic
      if (drivingTimeMinutes && drivingTimeMinutes > SOFT_LIMIT_MINUTES) {
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
      
      // If we can't calculate route, be conservative and suggest pickup
      if (!drivingTimeMinutes) {
        return new Response(
          JSON.stringify({ 
            isValid: false, 
            message: 'We apologize, but we couldn\'t calculate the delivery time to your location. Pickup is always available and ready in 20-30 minutes!',
            suggestPickup: true
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
        console.log('✅ validate-delivery-google: Delivery zone saved to database');
      } catch (dbError) {
        console.error('⚠️ validate-delivery-google: Error saving delivery zone (non-critical):', dbError);
        // Don't fail validation if DB insert fails
      }

      const totalTime = Date.now() - requestStartTime;
      console.log(`✅ validate-delivery-google: Validation successful (calculated) in ${totalTime}ms`);
      
      return new Response(
        JSON.stringify({ 
          isValid: true, 
          estimatedMinutes: drivingTimeMinutes,
          message: `Estimated delivery time: ${drivingTimeMinutes} minutes`,
          distanceMiles: distanceMiles,
          formattedAddress: verifiedFormattedAddress
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Return validated zone data — re-check time limit even for cached entries
    const totalTime = Date.now() - requestStartTime;

    if (zone.estimated_minutes > MAX_DELIVERY_TIME_MINUTES) {
      console.log(`❌ validate-delivery-google: Cached zone ${zipCode} exceeds limit (${zone.estimated_minutes} min)`);
      // Mark the cached entry as inactive so it doesn't re-trigger this path
      supabase.from('delivery_zones').update({ is_active: false }).eq('zip_code', zipCode).then(() => {});
      return new Response(
        JSON.stringify({
          isValid: false,
          message: `We apologize, but your location is outside our 20-minute delivery zone (estimated ${zone.estimated_minutes} minutes away). Pickup is always available and ready in 20-30 minutes!`,
          suggestPickup: true,
          estimatedMinutes: zone.estimated_minutes,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ validate-delivery-google: Validation successful (from DB) in ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        isValid: true,
        estimatedMinutes: zone.estimated_minutes,
        message: `Estimated delivery time: ${zone.estimated_minutes} minutes`,
        formattedAddress: verifiedFormattedAddress
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const totalTime = Date.now() - requestStartTime;
    console.error('❌ validate-delivery-google: Error after', totalTime, 'ms');
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Provide more specific error message
    let errorMessage = 'We apologize, but we couldn\'t validate your address. Pickup is always available!';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Validation is taking longer than expected. Please try again or choose pickup instead.';
        console.error('⏱️  Request timed out after', totalTime, 'ms');
      } else if (error.message.includes('GOOGLE') || error.message.includes('API_KEY')) {
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

