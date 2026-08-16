// SportSphere Service Worker - PWA Offline Support
const CACHE_NAME = 'sportsphere-v1';
const STATIC_ASSETS = [
  '/sportsphere',
  '/sportsphere/manifest.json',
  '/sportsphere/icons/icon-192x192.svg',
  '/sportsphere/icons/icon-512x512.svg',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls and external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Never cache Next.js dev/prod chunks or API routes — these must
  // always be served fresh to avoid stale module errors.
  const url = new URL(event.request.url);
  const bp = self.location.pathname.replace(/\/sw\.js$/, '');
  if (url.pathname.startsWith(`${bp}/api/`)) return;
  if (url.pathname.startsWith(`${bp}/_next/`)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // For navigation requests, return cached /sportsphere
          if (event.request.mode === 'navigate') {
            return caches.match('/sportsphere');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync for offline posts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncOfflinePosts());
  }
});

async function syncOfflinePosts() {
  // Will be implemented with IndexedDB for offline post queue
  console.log('Syncing offline posts...');
}
