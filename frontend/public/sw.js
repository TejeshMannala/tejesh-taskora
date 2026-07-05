// Bump CACHE_NAME when deploying to force re-caching stale assets.
const CACHE_NAME = 'taskora-alarm-cache-v4';

const SHELL_CACHE = 'taskora-shell-v1';

// Only cache static assets (JS, CSS, images, fonts), NEVER API responses.
// BUG FIX: Previously the SW cached ALL requests including API calls.
// When /api/v1/alarms/active returned 401, that 401 response was cached.
// On the next request, the SW returned the cached 401 without making a
// network call — so even after the user re-logged in, the alarm endpoint
// kept returning 401 forever. This is the "infinite 401" bug.
const API_PATTERN = /^\/api\//;
const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/;
const DEV_PATTERN = /^https?:\/\/localhost(:\d+)?\//;

self.addEventListener('install', (event) => {
  // Pre-cache index.html so SPA fallback can serve it for navigation requests
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.add('/index.html'))
  );
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

  // BUG FIX: Never intercept Vite dev-server requests on localhost.
  if (DEV_PATTERN.test(url.href)) {
    return;
  }

  // BUG FIX: Skip caching for all API requests — never cache 401/500 responses.
  if (API_PATTERN.test(url.pathname)) {
    return;
  }

  // SPA fallback — handle navigation requests (page refresh, direct URL open).
  // Network-first: try the real server. If it returns 404 or the server is
  // unreachable (common on Render free tier while sleeping), serve the cached
  // index.html so React Router can handle the route client-side.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.open(SHELL_CACHE).then((cache) => cache.match('/index.html'))
      )
    );
    return;
  }

  // Only cache static assets (network-first, fallback to cache for offline).
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      }).catch(() => caches.match(event.request))
    );
  }
});
