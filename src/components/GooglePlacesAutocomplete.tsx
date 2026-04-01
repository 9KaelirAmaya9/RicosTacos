import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface GooglePlace {
  place_id: string;
  formatted_address: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (address: string, place?: GooglePlace) => void;
  onPlaceSelect?: (place: GooglePlace) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Start typing your address...",
  id = "address",
  required = false,
  disabled = false,
  className = "",
  label
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  // Track whether a place has been selected from the dropdown (vs. free-typed)
  const [placeSelected, setPlaceSelected] = useState(false);

  // Initialize autocomplete when Google Maps is loaded
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;
    if (autocompleteRef.current) return; // already initialized

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['place_id', 'formatted_address', 'geometry', 'address_components']
    });

    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (place.place_id && place.formatted_address) {
        setIsLoading(true);

        const googlePlace: GooglePlace = {
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          geometry: place.geometry ? {
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
          } : undefined
        };

        // Autopopulate the input with the full formatted address
        if (inputRef.current) {
          inputRef.current.value = place.formatted_address;
        }

        setPlaceSelected(true);
        onChange(place.formatted_address, googlePlace);
        if (onPlaceSelect) onPlaceSelect(googlePlace);

        setIsLoading(false);
      }
    });
  }, [onChange, onPlaceSelect]);

  // Load Google Maps API dynamically
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ VITE_GOOGLE_MAPS_API_KEY not set — Google Maps autocomplete disabled');
      return;
    }

    // Already loaded
    if (window.google?.maps?.places) {
      setIsGoogleMapsLoaded(true);
      initializeAutocomplete();
      return;
    }

    // Script already injected — wait for it
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const poll = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(poll);
          setIsGoogleMapsLoaded(true);
          initializeAutocomplete();
        }
      }, 100);
      return () => clearInterval(poll);
    }

    // Inject script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsGoogleMapsLoaded(true);
      initializeAutocomplete();
    };
    script.onerror = () => console.error('❌ Failed to load Google Maps API');
    document.head.appendChild(script);
  }, [initializeAutocomplete]);

  // Sync controlled value → DOM input (only when not focused, to avoid fighting the user)
  useEffect(() => {
    if (
      inputRef.current &&
      inputRef.current.value !== value &&
      document.activeElement !== inputRef.current
    ) {
      inputRef.current.value = value;
      // If value was cleared externally, reset placeSelected flag
      if (!value) setPlaceSelected(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // User is typing manually — clear the selected place
    setPlaceSelected(false);
    onChange(e.target.value, undefined);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={isGoogleMapsLoaded ? placeholder : "Loading address search..."}
          required={required}
          disabled={disabled}
          className={`pr-10 ${className}`}
          defaultValue={value}
          autoComplete="off"
          onChange={handleInputChange}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : placeSelected ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : !isGoogleMapsLoaded ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Status hint */}
      {isGoogleMapsLoaded && !placeSelected && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          Type your address and <strong>select it from the dropdown</strong> for accurate delivery validation.
        </p>
      )}
      {placeSelected && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          Address selected — delivery availability will be checked at checkout.
        </p>
      )}

      <style>{`
        .pac-container {
          z-index: 99999 !important;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          margin-top: 0.25rem;
          font-family: inherit;
          background: hsl(var(--background)) !important;
        }
        .pac-item {
          padding: 0.75rem 1rem;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          color: hsl(var(--foreground)) !important;
          background: hsl(var(--background)) !important;
        }
        .pac-item:hover,
        .pac-item-selected {
          background-color: hsl(var(--accent)) !important;
        }
        .pac-icon { margin-right: 0.5rem; }
        .pac-item-query { font-weight: 500; color: hsl(var(--foreground)); }
        .pac-matched { font-weight: 600; }
      `}</style>
    </div>
  );
};
