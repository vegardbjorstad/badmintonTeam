// public/sw-push.js
// Custom service worker — håndterer både caching og push-varsler

import { precacheAndRoute } from 'workbox-precaching';

// Precache alle assets (injiseres automatisk av vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST);

// ── Push-handler ──────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon  || '/pwa-192.png',
      badge: data.badge || '/pwa-192.png',
      data:  { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  );
});

// ── Klikk på varsel ───────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});
