const CACHE_NAME = 'taskora-alarm-cache-v2';

// Only cache static assets (JS, CSS, images, fonts), NEVER API responses.
// BUG FIX: Previously the SW cached ALL requests including API calls.
// When /api/v1/alarms/active returned 401, that 401 response was cached.
// On the next request, the SW returned the cached 401 without making a
// network call — so even after the user re-logged in, the alarm endpoint
// kept returning 401 forever. This is the "infinite 401" bug.
const API_PATTERN = /^\/api\//;
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ALARM_TRIGGERED') {
    const { title, taskId } = event.data;

    self.registration.showNotification('⚠️ TASK NOT COMPLETED', {
      body: `"${title}" is overdue! Complete immediately.`,
      icon: '/favicon.svg',
      tag: `alarm-${taskId}`,
      requireInteraction: true,
      vibrate: [1000, 500, 1000, 500, 1000, 500, 1000],
      data: { taskId, url: '/tasks' },
    });

    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'ALARM_PERSISTENT', taskId, title });
      });
    });
  }

  if (event.data && event.data.type === 'ALARM_STOPPED') {
    const { taskId } = event.data;
    self.registration.getNotifications({ tag: `alarm-${taskId}` }).then((notifications) => {
      notifications.forEach((n) => n.close());
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/tasks';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // BUG FIX: Skip caching for all API requests — never cache 401/500 responses.
  if (API_PATTERN.test(url.pathname)) {
    return;
  }

  // Only cache static assets
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
          return response;
        });
      })
    );
  }
});
