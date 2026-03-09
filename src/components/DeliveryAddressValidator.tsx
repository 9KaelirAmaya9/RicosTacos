import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  validateDeliveryAddressGoogle,
  type GoogleMapsValidationResult,
} from "@/utils/googleMapsValidation";
import { GooglePlacesAutocomplete } from "@/components/GooglePlacesAutocomplete";

interface ValidatedAddress {
  address: string;
  isValid: boolean;
  estimatedMinutes?: number;
}

interface DeliveryAddressValidatorProps {
  onValidationComplete?: (result: ValidatedAddress) => void;
  debounceDelay?: number; // kept for backwards compatibility, not used
}

const DeliveryAddressValidator = ({
  onValidationComplete,
}: DeliveryAddressValidatorProps) => {
  const { t } = useLanguage();
  const [address, setAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{
    place_id: string;
    formatted_address: string;
  } | null>(null);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<GoogleMapsValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!selectedPlace?.place_id) {
      setError("Please select an address from the suggestions before validating.");
      return;
    }

    setValidating(true);
    setResult(null);
    setError(null);

    try {
      console.log("🔍 DeliveryAddressValidator: Starting validation for place_id:", selectedPlace.place_id);
      const validation = await validateDeliveryAddressGoogle(
        selectedPlace.place_id,
        selectedPlace.formatted_address,
      );

      console.log("✅ DeliveryAddressValidator: Validation result:", validation);
      setResult(validation);

      if (onValidationComplete) {
        onValidationComplete({
          address: validation.formattedAddress || selectedPlace.formatted_address,
          isValid: validation.isValid,
          estimatedMinutes: validation.estimatedMinutes,
        });
      }
      
      // If validation failed, set error message
      if (!validation.isValid) {
        setError(validation.message || "We couldn't validate this address. Please try again or call to confirm.");
      }
    } catch (e: any) {
      console.error("❌ Google Maps validation error on Location page:", e);
      console.error("❌ Error details:", {
        message: e?.message,
        stack: e?.stack,
        name: e?.name
      });
      setError(
        e?.message ||
          "We couldn't validate this address right now. Please try again or call to confirm.",
      );
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card className="p-6 space-y-4 border-primary/20 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-2xl font-semibold text-foreground">
              {t("location.checkDelivery") || "Check Delivery Eligibility"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("location.checkDeliverySubtext") ||
                "We deliver within a 20-minute drive from our restaurant. Enter your address below to verify if delivery is available to your location."}
            </p>
          </div>
        </div>
        <div className="pl-14 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Select an address from the autocomplete suggestions</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Receive instant delivery time estimates</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span>Pickup available if outside delivery zone</span>
          </div>
        </div>
      </div>

      <GooglePlacesAutocomplete
        id="location-delivery-address"
        label={t("location.deliveryAddressLabel") || "Delivery Address"}
        value={address}
        onChange={(value, place) => {
          setAddress(value);
          if (place) {
            setSelectedPlace({
              place_id: place.place_id,
              formatted_address: place.formatted_address,
            });
          } else if (value !== address) {
            // Clear selected place when user starts typing a new address
            setSelectedPlace(null);
            setError(null);
            setResult(null);
          }
        }}
        onPlaceSelect={(place) => {
          setSelectedPlace({
            place_id: place.place_id,
            formatted_address: place.formatted_address,
          });
          setAddress(place.formatted_address);
        }}
        placeholder="Start typing your address..."
        required
      />

      <Button
        onClick={handleValidate}
        disabled={validating || !selectedPlace}
        className="w-full bg-primary hover:bg-primary/90 text-base py-6"
      >
        {validating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {t("validating") || "Verifying Delivery Area..."}
          </>
        ) : (
          <>
            <MapPin className="h-5 w-5 mr-2" />
            {t("location.verifyDeliveryArea") || "Verify Delivery Area"}
          </>
        )}
      </Button>
      
      {!selectedPlace && address.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Please select an address from the suggestions to verify delivery availability
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
          <XCircle className="h-4 w-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div
          className={`rounded-lg border-2 p-4 ${
            result.isValid
              ? "bg-emerald-500/5 border-emerald-500/30"
              : "bg-destructive/5 border-destructive/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${
              result.isValid ? "bg-emerald-500/10" : "bg-destructive/10"
            }`}>
              {result.isValid ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className={`font-semibold ${
                  result.isValid ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
                }`}>
                  {result.isValid ? "✓ Delivery Available" : "Delivery Not Available"}
                </p>
                <p className="text-sm text-foreground mt-1">
                  {result.message ||
                    (result.isValid
                      ? "Great news! Your location is within our delivery zone."
                      : "This address is outside our 20-minute delivery zone.")}
                </p>
              </div>
              {result.estimatedMinutes && result.isValid && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-primary">~{result.estimatedMinutes} min delivery</span>
                  </div>
                </div>
              )}
              {result.distanceMiles && (
                <p className="text-xs text-muted-foreground">
                  Distance: {result.distanceMiles} miles from restaurant
                </p>
              )}
              {!result.isValid && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Pickup is available!</strong> Your order will be ready in 20-30 minutes.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    📍 505 51st Street, Brooklyn, NY 11220 • ☎️ (718) 633-4816
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DeliveryAddressValidator;
