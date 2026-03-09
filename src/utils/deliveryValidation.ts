import { supabase } from "@/integrations/supabase/client";

export interface DeliveryValidationResult {
  isValid: boolean;
  estimatedMinutes?: number;
  message?: string;
  suggestPickup?: boolean;
  distanceMiles?: number;
}

export const validateDeliveryAddress = async (address: string): Promise<DeliveryValidationResult> => {
  try {
    if (!address || address.trim().length === 0) {
      return {
        isValid: false,
        message: "Please provide a delivery address.",
        suggestPickup: true
      };
    }
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Validation timeout')), 30000);
    });

    // Race between the actual call and the timeout
    const validationPromise = supabase.functions.invoke('validate-delivery-address', {
      body: { address: address.trim() }
    });

    const result = await Promise.race([validationPromise, timeoutPromise]) as any;

    // Handle different response formats
    let data: any = null;
    let error: any = null;

    if (result && typeof result === 'object') {
      // Check if it's a Supabase function response
      if ('data' in result && 'error' in result) {
        data = result.data;
        error = result.error;
      } else if ('isValid' in result) {
        // Direct response from edge function
        data = result;
      } else {
        // Try to parse as error
        error = result;
      }
    } else {
      error = result;
    }

    if (error) {
      // Try to extract error message from error object
      let errorMessage = "We apologize, but we couldn't validate your address. Pickup is always available!";
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      return {
        isValid: false,
        message: errorMessage,
        suggestPickup: true
      };
    }

    // Validate response structure
    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        message: "We apologize, but we received an invalid response. Pickup is always available!",
        suggestPickup: true
      };
    }

    // Ensure response has required fields
    const validationResult: DeliveryValidationResult = {
      isValid: data.isValid === true,
      message: data.message || (data.isValid ? "Address validated successfully" : "Address validation failed"),
      suggestPickup: data.suggestPickup === true,
      estimatedMinutes: data.estimatedMinutes,
      distanceMiles: data.distanceMiles
    };

    return validationResult;
  } catch (error: any) {
    
    // Handle timeout specifically
    if (error?.message === 'Validation timeout') {
      return {
        isValid: false,
        message: "Validation is taking longer than expected. Please try again or choose pickup instead.",
        suggestPickup: true
      };
    }
    
    return {
      isValid: false,
      message: error?.message || "We apologize, but we couldn't validate your address. Pickup is always available!",
      suggestPickup: true
    };
  }
};
