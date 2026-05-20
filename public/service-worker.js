// Ricos Tacos — Service Worker
// v2 — offline asset caching + stale-while-revalidate for pages + push notifications

const KITCHEN_URL = '/kitchen';
const CACHE_NAME = 'ricos-tacos-v2';

// Static shell: cache these on install so the app loads instantly offline
const PRECACHE_URLS = [
  '/',
  '/menu',
  '/location',
  '/catering',
  '/manifest.json',
  '/logo.png',
  '/RicosTacos.png',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating — pruning old caches');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GETs — let Supabase/Stripe/Maps pass through
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Hashed assets (/assets/…) — cache-first, they never change
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetchAndCache(request))
    );
    return;
  }

  // Images/fonts in /public — cache-first
  if (/\.(png|jpe?g|webp|svg|gif|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetchAndCache(request))
    );
    return;
  }

  // HTML navigation requests — stale-while-revalidate so pages load instantly
  // from cache while the network updates in the background
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

function fetchAndCache(request) {
  return fetch(request).then((response) => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  });
}

function staleWhileRevalidate(request) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }).catch(() => caches.match('/'));
      return cached || networkFetch;
    })
  );
}

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
    Promise.all([
      // 1. Show the OS notification
      self.registration.showNotification(data.title, options),

      // 2. postMessage all open Kitchen/Admin tabs so the audio alarm fires
      //    immediately — even if the tab is in the background.
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes('/kitchen') || client.url.includes('/admin')) {
            client.postMessage({ type: 'NEW_ORDER_PUSH', payload: data });
          }
        }
      }),
    ])
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
      // If kitchen tab is already open, focus it and tell it to start the alarm
      for (const client of windowClients) {
        if (client.url.includes('/kitchen') && 'focus' in client) {
          client.postMessage({ type: 'NEW_ORDER_PUSH', payload: {} });
          return client.focus();
        }
      }
      // Otherwise open a new tab — Kitchen page will detect pending orders on load
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
