// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/logo.png',
    data: {}
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      console.error('Error parsing notification data:', e);
    }
  }

  const isNewOrder = notificationData.data?.type === 'new_order';

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/logo.png',
    badge: '/logo.png',
    // Aggressive vibration pattern for new orders (long pulses)
    vibrate: isNewOrder
      ? [500, 200, 500, 200, 500, 200, 500, 200, 500]
      : [200, 100, 200],
    data: notificationData.data,
    // Keep notification visible until user interacts with it
    requireInteraction: isNewOrder,
    // Allow multiple notifications for different orders
    tag: isNewOrder ? `order-${notificationData.data?.orderNumber || Date.now()}` : 'general',
    renotify: true,
    actions: [
      {
        action: 'open',
        title: 'View Order'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  // Post message to all open clients to play alarm sound
  const notifyClients = self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'NEW_ORDER_ALARM',
        data: notificationData.data
      });
    });
  });

  event.waitUntil(
    Promise.all([
      notifyClients,
      self.registration.showNotification(notificationData.title, options)
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // For order notifications, open the kitchen page
  const isNewOrder = event.notification.data?.type === 'new_order';
  const url = isNewOrder ? '/kitchen' : (event.notification.data?.url || '/');

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // If kitchen page is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/kitchen') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});
