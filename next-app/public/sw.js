// PM Zaika – service worker for kitchen Web Push alerts.
//
// Registered only on the admin desk; the customer-facing site never loads it.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// --- PUSH RECEIVER ---------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔔 New Order – PM Zaika',
    body: 'A new order is waiting in the kitchen queue.',
    tag: 'pm-zaika-order',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/assets/images/pm_zaika_circular_logo.png',
      badge: '/assets/images/pm_zaika_circular_logo.png',
      tag: payload.tag,
      renotify: payload.renotify !== undefined ? payload.renotify : true,
      requireInteraction:
        payload.requireInteraction !== undefined ? payload.requireInteraction : true,
      vibrate: [300, 100, 300, 100, 400],
      data: payload.data || { url: '/admin/orders' },
      actions: [
        { action: 'view_order', title: '📦 View Order' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// --- CLICK HANDLER ---------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/admin/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url && client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client) client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});