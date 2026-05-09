import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/utils/envValidation"; // Validate environment variables on startup
import { initSentry, captureException, captureMessage } from "@/utils/sentry";
// Only load the debug auth helper in development — it exposes session diagnostics
// and attaches window.debugAuth to the global scope.
if (import.meta.env.DEV) {
  import("@/utils/debugAuth");
}

// Initialize Sentry error tracking
initSentry().catch(console.error);

// Add global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  
  // Send to Sentry
  captureException(error, {
    type: 'unhandledRejection',
    reason: event.reason,
  });
  
  // Log to console
  if (import.meta.env.DEV) {
    console.error('Unhandled promise rejection:', event.reason);
  }
  
  // Prevent default browser error handling
  event.preventDefault();
});

// Add global error handler for uncaught errors
window.addEventListener('error', (event) => {
  const error = event.error || new Error(event.message);
  
  // Send to Sentry
  captureException(error, {
    type: 'uncaughtError',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
  
  // Log to console
  if (import.meta.env.DEV) {
    console.error('Uncaught error:', event.error);
  }
});

// ── Service Worker Registration ───────────────────────────────────────────────
// Register the service worker on every app load so push notifications work
// even before staff click "Enable Notifications". The SW handles background
// push events and postMessages the Kitchen page to trigger the audio alarm.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Registration failed (non-critical):', err);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
