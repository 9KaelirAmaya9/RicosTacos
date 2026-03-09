/**
 * Validates required environment variables at application startup
 * Throws errors if critical variables are missing
 */

const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
} as const;

const optionalEnvVars = {
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  VITE_MAPBOX_PUBLIC_TOKEN: import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN,
} as const;

export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required variables
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Warn about optional but recommended variables
  if (import.meta.env.DEV) {
    Object.entries(optionalEnvVars).forEach(([key, value]) => {
      if (!value || value.trim() === '') {
        console.warn(`Optional environment variable not set: ${key}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Validate on module load
const validation = validateEnvironment();
if (!validation.valid) {
  console.error('Environment validation failed:', validation.errors);
  if (import.meta.env.PROD) {
    // In production, throw error to prevent app from running with invalid config
    throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
  }
}


