// Ricos Tacos — Service Worker for Web Push Notifications
// Handles background push events even when the browser tab is closed.

const KITCHEN_URL = '/kitchen';

self.addEventListener('install', () => {
  console.log('[SW] Installing — skip waiting');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating — claiming clients');
  event.waitUntil(self.clients.claim());
});

// ── Push event ────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: '🌮 New Order — Ricos Tacos',
    body: 'A new order has been placed.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: { url: KITCHEN_URL },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        title: parsed.title || data.title,
        body: parsed.body || data.body,
        icon: parsed.icon || data.icon,
        badge: parsed.badge || data.badge,
        data: { url: (parsed.data && parsed.data.url) || KITCHEN_URL },
      };
    } catch (e) {
      console.warn('[SW] Could not parse push data as JSON, using text');
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [300, 100, 300, 100, 300], // three pulses — hard to miss
    tag: 'new-order', // replaces previous notification instead of stacking
    renotify: true,   // re-vibrate/sound even if same tag
    requireInteraction: true, // stays on screen until staff taps it
    data: data.data,
    actions: [
      { action: 'open', title: '👀 View Order' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked, action:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Open or focus the kitchen dashboard
  const targetUrl = (event.notification.data && event.notification.data.url) || KITCHEN_URL;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If kitchen tab is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes('/kitchen') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
