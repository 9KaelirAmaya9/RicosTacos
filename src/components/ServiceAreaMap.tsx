import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface ValidatedAddress {
  address: string;
  coordinates?: [number, number];
  isValid: boolean;
  estimatedMinutes?: number;
}

interface ServiceAreaMapProps {
  validatedAddress?: ValidatedAddress | null;
}

const ServiceAreaMap = ({ validatedAddress }: ServiceAreaMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isLoadingZone, setIsLoadingZone] = useState(true);
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const validatedMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const serviceAreaSourceRef = useRef<string | null>(null);
  const loadServiceAreaCalledRef = useRef<boolean>(false);

  useEffect(() => {
    // Get Mapbox token from environment
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (token) {
      setMapboxToken(token);
      mapboxgl.accessToken = token;
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    const restaurantCoords: [number, number] = [-74.0060, 40.6501]; // 505 51st Street, Brooklyn
    loadServiceAreaCalledRef.current = false;
    setMapError(null);

    // Initialize map with optimal settings to show restaurant and surrounding area
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Detailed street map showing neighborhoods
        center: restaurantCoords,
        zoom: 12, // Initial zoom - will be adjusted when zone loads
        pitch: 0, // Flat view for better area visibility
        bearing: 0, // North-up orientation
      });

      // Handle map errors
      map.current.on('error', (e: any) => {
        console.error('Mapbox map error:', e);
        setMapError(e.error?.message || 'Failed to load map. Please check your Mapbox token.');
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError(error instanceof Error ? error.message : 'Failed to initialize map');
      return;
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add restaurant marker
    const el = document.createElement('div');
    el.className = 'restaurant-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMTBjMCA2LTggMTItOCAxMnMtOC02LTgtMTJhOCA4IDAgMCAxIDE2IDB6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg==)';
    el.style.backgroundSize = 'cover';
    el.style.cursor = 'pointer';

    // Create popup content safely (avoid XSS by using textContent)
    const popupContent = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = 'Ricos Tacos';
    title.style.margin = '0';
    title.style.fontWeight = 'bold';
    const address = document.createElement('p');
    address.textContent = '505 51st Street, Brooklyn, NY 11220';
    address.style.margin = '0';
    popupContent.appendChild(title);
    popupContent.appendChild(address);

    new mapboxgl.Marker(el)
      .setLngLat(restaurantCoords)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setDOMContent(popupContent)
      )
      .addTo(map.current);

    // Fetch and display 20-minute isochrone (service area)
    const loadServiceArea = async () => {
      // Prevent double execution
      if (loadServiceAreaCalledRef.current || !map.current || !mapboxToken) {
        return;
      }
      loadServiceAreaCalledRef.current = true;
      
      setIsLoadingZone(true);
      setZoneError(null);
      
      try {
        // Use driving profile with traffic for accurate 20-minute zone
        const isochroneUrl = `https://api.mapbox.com/isochrone/v1/mapbox/driving-traffic/${restaurantCoords[0]},${restaurantCoords[1]}?contours_minutes=20&polygons=true&access_token=${mapboxToken}`;
        
        console.log('Fetching 20-minute delivery zone from Mapbox Isochrone API...');
        const response = await fetch(isochroneUrl);
        
        if (!response.ok) {
          throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Isochrone API response:', data);

        if (!map.current) return; // Map was unmounted

        // Validate response structure
        if (!data || !data.features || data.features.length === 0) {
          throw new Error('No features returned from isochrone API');
        }

        // Remove existing source and layers if they exist
        if (serviceAreaSourceRef.current) {
          try {
            if (map.current.getLayer('service-area-outline')) {
              map.current.removeLayer('service-area-outline');
            }
            if (map.current.getLayer('service-area-fill')) {
              map.current.removeLayer('service-area-fill');
            }
            if (map.current.getSource('service-area')) {
              map.current.removeSource('service-area');
            }
          } catch (e) {
            // Ignore errors if layers don't exist
            console.log('Cleaning up existing layers:', e);
          }
        }

        // Add the service area polygon source
        map.current.addSource('service-area', {
          type: 'geojson',
          data: data,
        });
        serviceAreaSourceRef.current = 'service-area';

        // Add fill layer (shaded area)
        map.current.addLayer({
          id: 'service-area-fill',
          type: 'fill',
          source: 'service-area',
          paint: {
            'fill-color': '#ef4444', // Red color matching brand
            'fill-opacity': 0.25, // Increased opacity for better visibility
          },
        });

        // Add outline layer (border)
        map.current.addLayer({
          id: 'service-area-outline',
          type: 'line',
          source: 'service-area',
          paint: {
            'line-color': '#ef4444',
            'line-width': 3, // Increased width for better visibility
            'line-opacity': 0.8,
            'line-dasharray': [2, 2], // Dashed line pattern
          },
        });

        // Fit map to show the entire delivery zone plus surrounding area
        // Use a function that handles both idle and already-idle cases
        const fitMapToBounds = () => {
          try {
            const bounds = new mapboxgl.LngLatBounds();
            
            // Add all coordinates from the isochrone polygon to bounds
            // Isochrone returns GeoJSON: coordinates = [[[lng, lat], [lng, lat], ...]]
            data.features.forEach((feature: any) => {
              if (feature.geometry && feature.geometry.coordinates) {
                feature.geometry.coordinates.forEach((ring: any) => {
                  if (Array.isArray(ring)) {
                    ring.forEach((coord: any) => {
                      // Validate coordinate format: [lng, lat]
                      if (Array.isArray(coord) && coord.length >= 2) {
                        const [lng, lat] = coord;
                        // Validate coordinate ranges
                        if (typeof lng === 'number' && typeof lat === 'number' &&
                            lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                          bounds.extend([lng, lat]);
                        }
                      }
                    });
                  }
                });
              }
            });
            
            // Ensure restaurant is in bounds
            bounds.extend(restaurantCoords);
            
            // Check if bounds is valid before fitting
            if (!bounds.isEmpty()) {
              // Fit map to bounds with padding to show surrounding area
              map.current.fitBounds(bounds, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                maxZoom: 14, // Don't zoom in too close - keep context
                duration: 1000, // Smooth animation
              });
              
              console.log('✅ Map fitted to show delivery zone and surrounding area');
            } else {
              console.warn('Bounds is empty, using default view');
              map.current.setCenter(restaurantCoords);
              map.current.setZoom(12);
            }
          } catch (boundsError) {
            console.warn('Could not fit bounds, using default view:', boundsError);
            // Fallback: ensure restaurant is visible
            if (map.current) {
              map.current.setCenter(restaurantCoords);
              map.current.setZoom(12);
            }
          }
        };

        // Wait for map to be fully ready before fitting bounds
        // Handle both cases: map already idle or will become idle
        if (map.current.loaded() && map.current.isStyleLoaded()) {
          // Map is already ready, fit bounds immediately
          fitMapToBounds();
        } else {
          // Wait for map to be ready
          map.current.once('idle', fitMapToBounds);
        }

        console.log('✅ 20-minute delivery zone successfully displayed on map');
        setIsLoadingZone(false);
      } catch (error) {
        console.error('❌ Error loading service area:', error);
        setZoneError(error instanceof Error ? error.message : 'Failed to load delivery zone');
        setIsLoadingZone(false);
        
        // Try fallback to non-traffic isochrone
        try {
          console.log('Attempting fallback to non-traffic isochrone...');
          const fallbackUrl = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${restaurantCoords[0]},${restaurantCoords[1]}?contours_minutes=15&polygons=true&access_token=${mapboxToken}`;
          const fallbackResponse = await fetch(fallbackUrl);
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (map.current && fallbackData.features && fallbackData.features.length > 0) {
              map.current.addSource('service-area', {
                type: 'geojson',
                data: fallbackData,
              });
              serviceAreaSourceRef.current = 'service-area';

              map.current.addLayer({
                id: 'service-area-fill',
                type: 'fill',
                source: 'service-area',
                paint: {
                  'fill-color': '#ef4444',
                  'fill-opacity': 0.25,
                },
              });

              map.current.addLayer({
                id: 'service-area-outline',
                type: 'line',
                source: 'service-area',
                paint: {
                  'line-color': '#ef4444',
                  'line-width': 3,
                  'line-opacity': 0.8,
                  'line-dasharray': [2, 2],
                },
              });
              
              // Fit map to show the entire delivery zone plus surrounding area
              const fitFallbackBounds = () => {
                try {
                  const bounds = new mapboxgl.LngLatBounds();
                  
                  fallbackData.features.forEach((feature: any) => {
                    if (feature.geometry && feature.geometry.coordinates) {
                      feature.geometry.coordinates.forEach((ring: any) => {
                        if (Array.isArray(ring)) {
                          ring.forEach((coord: any) => {
                            if (Array.isArray(coord) && coord.length >= 2) {
                              const [lng, lat] = coord;
                              if (typeof lng === 'number' && typeof lat === 'number' &&
                                  lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                                bounds.extend([lng, lat]);
                              }
                            }
                          });
                        }
                      });
                    }
                  });
                  
                  bounds.extend(restaurantCoords);
                  
                  if (!bounds.isEmpty() && map.current) {
                    map.current.fitBounds(bounds, {
                      padding: { top: 50, bottom: 50, left: 50, right: 50 },
                      maxZoom: 14,
                      duration: 1000,
                    });
                  } else if (map.current) {
                    map.current.setCenter(restaurantCoords);
                    map.current.setZoom(12);
                  }
                } catch (boundsError) {
                  console.warn('Could not fit bounds for fallback:', boundsError);
                  if (map.current) {
                    map.current.setCenter(restaurantCoords);
                    map.current.setZoom(12);
                  }
                }
              };

              if (map.current.loaded() && map.current.isStyleLoaded()) {
                fitFallbackBounds();
              } else {
                map.current.once('idle', fitFallbackBounds);
              }
              
              console.log('✅ Fallback isochrone loaded successfully');
              setIsLoadingZone(false);
              setZoneError(null);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    };

    // Wait for map to load before fetching isochrone
    // Use 'load' event which fires when style is loaded
    const handleMapLoad = () => {
      if (!loadServiceAreaCalledRef.current) {
        loadServiceArea();
      }
    };

    map.current.on('load', handleMapLoad);
    
    // If map is already loaded (shouldn't happen, but handle edge case)
    if (map.current.loaded() && map.current.isStyleLoaded()) {
      handleMapLoad();
    }

    return () => {
      if (map.current) {
        // Clean up layers and source
        try {
          if (map.current.getLayer('service-area-outline')) {
            map.current.removeLayer('service-area-outline');
          }
          if (map.current.getLayer('service-area-fill')) {
            map.current.removeLayer('service-area-fill');
          }
          if (map.current.getSource('service-area')) {
            map.current.removeSource('service-area');
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Add validated address marker
  useEffect(() => {
    if (!map.current || !validatedAddress || !validatedAddress.coordinates) return;

    // Remove previous validated marker
    if (validatedMarkerRef.current) {
      validatedMarkerRef.current.remove();
    }

    // Create marker with color based on validity
    const color = validatedAddress.isValid ? '#22c55e' : '#f59e0b'; // green for valid, amber for invalid
    
    // Create popup content
    const popupContent = document.createElement('div');
    const statusText = document.createElement('p');
    statusText.textContent = validatedAddress.isValid 
      ? `✓ Delivery Available (${validatedAddress.estimatedMinutes} min)`
      : '✗ Outside Delivery Zone';
    statusText.style.margin = '0';
    statusText.style.fontWeight = 'bold';
    statusText.style.color = validatedAddress.isValid ? '#22c55e' : '#f59e0b';
    
    const addressText = document.createElement('p');
    addressText.textContent = validatedAddress.address;
    addressText.style.margin = '4px 0 0 0';
    addressText.style.fontSize = '0.875rem';
    
    popupContent.appendChild(statusText);
    popupContent.appendChild(addressText);

    // Add new marker
    validatedMarkerRef.current = new mapboxgl.Marker({ color })
      .setLngLat(validatedAddress.coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setDOMContent(popupContent)
      )
      .addTo(map.current);

    // Fly to validated address
    map.current.flyTo({
      center: validatedAddress.coordinates,
      zoom: 13,
      duration: 1500,
    });

    return () => {
      if (validatedMarkerRef.current) {
        validatedMarkerRef.current.remove();
      }
    };
  }, [validatedAddress]);

  if (!mapboxToken) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-5 w-5" />
          <p>Map loading...</p>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Waiting for Mapbox token...
        </p>
      </Card>
    );
  }

  if (mapError) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <MapPin className="h-5 w-5" />
          <p className="font-semibold">Map Error</p>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{mapError}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Please check your Mapbox token configuration.
        </p>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Loading indicator for delivery zone */}
      {isLoadingZone && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-md z-10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading delivery zone...</p>
          </div>
        </div>
      )}
      
      {/* Error message if zone fails to load */}
      {zoneError && !isLoadingZone && (
        <div className="absolute top-4 right-4 bg-destructive/90 text-destructive-foreground rounded-lg p-3 shadow-md max-w-xs z-10">
          <p className="text-xs font-medium mb-1">Zone loading failed</p>
          <p className="text-xs opacity-90">{zoneError}</p>
        </div>
      )}
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-md max-w-xs z-10">
        <div className="flex items-start gap-2">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">20-Minute Delivery Zone</h4>
            <p className="text-xs text-muted-foreground">
              {isLoadingZone 
                ? 'Calculating delivery coverage...' 
                : zoneError 
                  ? 'Zone unavailable - delivery still available within 20 minutes'
                  : 'The shaded red area shows our delivery coverage from Ricos Tacos'}
            </p>
            {!isLoadingZone && !zoneError && (
              <div className="mt-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary/25 border-2 border-primary"></div>
                <span className="text-xs text-muted-foreground">Delivery Zone</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAreaMap;
