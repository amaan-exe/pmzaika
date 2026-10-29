// PM Zaika – Service worker for kitchen Web Push alerts.
//
// Configured with high-urgency, persistent vibration and interaction locks
// so kitchen staff never miss a high-priority incoming order.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// --- PUSH RECEIVER ---------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {
    title: '🚨 LOUD ALERT: New Order – PM Zaika',
    body: 'A new order is waiting in the kitchen queue. Tap to accept.',
    tag: 'pm-zaika-order',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  // Loud, urgent vibration sequence:
  // 600ms buzz, 150ms pause, 600ms buzz, 150ms pause, 900ms buzz, 200ms pause, 1200ms alarm burst
  const loudVibration = [600, 150, 600, 150, 900, 200, 1200];

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/assets/images/pm_zaika_circular_logo.png',
      badge: '/assets/images/pm_zaika_circular_logo.png',
      tag: payload.tag || 'pm-zaika-order',
      renotify: true,
      requireInteraction: true, // Keep notification visible on screen until staff acts
      silent: false,
      timestamp: Date.now(),
      vibrate: loudVibration,
      data: payload.data || { url: '/admin/orders' },
      actions: [
        { action: 'view_order', title: '📦 View Order Now' },
        { action: 'acknowledge', title: '🔕 Acknowledge' },
      ],
    })
  );
});

// --- CLICK HANDLER ---------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const orderId = event.notification.data?.orderId;
  const targetUrl = event.notification.data?.url || '/admin/orders';

  // Broadcast to open admin tabs to silence audio and highlight order
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({
          type: 'ORDER_ALERT_ACKNOWLEDGED',
          action: event.action,
          orderId,
        });
      }

      if (event.action === 'acknowledge') {
        return;
      }

      // If user clicked notification body or 'view_order', focus or open window
      for (const client of clients) {
        if (client.url && client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client && targetUrl) client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});