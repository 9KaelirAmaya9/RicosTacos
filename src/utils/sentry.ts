/**
 * Sentry Error Tracking Integration
 * 
 * To enable Sentry:
 * 1. Get your DSN from https://sentry.io
 * 2. Add VITE_SENTRY_DSN to your .env file
 * 3. Sentry will automatically initialize
 * 
 * If VITE_SENTRY_DSN is not set, Sentry will be disabled (no-op)
 */

let sentryInitialized = false;

export const initSentry = async () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.log('Sentry disabled: VITE_SENTRY_DSN not set');
    }
    return;
  }

  try {
    const Sentry = await import('@sentry/react');
    
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
      // Session Replay
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0, // Always capture replays on errors
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
    });

    sentryInitialized = true;
    
    if (import.meta.env.DEV) {
      console.log('Sentry initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (!sentryInitialized) return;
  
  import('@sentry/react').then((Sentry) => {
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
    });
  }).catch(() => {
    // Silently fail if Sentry not available
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (!sentryInitialized) return;
  
  import('@sentry/react').then((Sentry) => {
    Sentry.captureMessage(message, { level });
  }).catch(() => {
    // Silently fail if Sentry not available
  });
};

export const setUser = (user: { id: string; email?: string; name?: string }) => {
  if (!sentryInitialized) return;
  
  import('@sentry/react').then((Sentry) => {
    Sentry.setUser(user);
  }).catch(() => {
    // Silently fail if Sentry not available
  });
};

export const clearUser = () => {
  if (!sentryInitialized) return;
  
  import('@sentry/react').then((Sentry) => {
    Sentry.setUser(null);
  }).catch(() => {
    // Silently fail if Sentry not available
  });
};


