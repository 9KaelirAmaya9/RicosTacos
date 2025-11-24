import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin } from 'lucide-react';

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

  // Initialize autocomplete when Google Maps is loaded
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    // Don't reinitialize if already initialized
    if (autocompleteRef.current) {
      return;
    }

    // Create autocomplete instance
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['place_id', 'formatted_address', 'geometry', 'address_components']
    });

    autocompleteRef.current = autocomplete;

    // Listen for place selection
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

        console.log('📍 Google Place selected:', googlePlace);
        
        // Update the input value
        if (inputRef.current) {
          inputRef.current.value = place.formatted_address;
        }
        
        // Call callbacks
        onChange(place.formatted_address, googlePlace);
        if (onPlaceSelect) {
          onPlaceSelect(googlePlace);
        }
        
        setIsLoading(false);
      }
    });

    // Handle input changes (manual typing) - clear place when typing
    if (inputRef.current) {
      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        // Call onChange with undefined place to clear selection when typing
        if (target.value !== value) {
          onChange(target.value, undefined);
        }
      };
      
      inputRef.current.addEventListener('input', handleInput);
    }
  }, [onChange, onPlaceSelect, value]);

  // Load Google Maps API dynamically
  useEffect(() => {
    // Suppress Google Maps internal debug messages
    const originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
      // Filter out Google Maps internal messages
      const message = args[0];
      if (typeof message === 'string' && (
        message.includes('bind_telephone_numbers') ||
        message.includes('telephone_number_')
      )) {
        return; // Suppress this message
      }
      originalConsoleLog.apply(console, args);
    };

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ VITE_GOOGLE_MAPS_API_KEY not set - Google Maps autocomplete will not work');
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleMapsLoaded(true);
      initializeAutocomplete();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
      // Script is loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          setIsGoogleMapsLoaded(true);
          initializeAutocomplete();
        }
      }, 100);
      
      return () => clearInterval(checkInterval);
    }

    // Load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps API loaded');
      setIsGoogleMapsLoaded(true);
      initializeAutocomplete();
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps API');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
    };
  }, [initializeAutocomplete]);

  // Update input value when prop changes (but not when user is typing)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value && document.activeElement !== inputRef.current) {
      inputRef.current.value = value;
    }
  }, [value]);

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
          placeholder={placeholder}
          required={required}
          disabled={disabled || !isGoogleMapsLoaded}
          className={`pr-10 ${className}`}
          defaultValue={value}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {!isGoogleMapsLoaded && (
        <p className="text-xs text-muted-foreground">
          Loading address autocomplete...
        </p>
      )}
      {isGoogleMapsLoaded && (
        <p className="text-xs text-muted-foreground">
          💡 <strong>Important:</strong> Type your address and select it from the dropdown suggestions that appear.
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
        .pac-item:hover {
          background-color: hsl(var(--accent)) !important;
        }
        .pac-item-selected {
          background-color: hsl(var(--accent)) !important;
        }
        .pac-icon {
          margin-right: 0.5rem;
        }
        .pac-item-query {
          font-weight: 500;
          color: hsl(var(--foreground));
        }
        .pac-matched {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
