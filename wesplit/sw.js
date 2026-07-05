/* ============================================================
   WeSplit – Service Worker (Offline Cache)
   ============================================================ */
const CACHE_NAME = 'wesplit-v1';
const ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/app.css',
  './css/responsive.css',
  './js/config.js',
  './js/storage.js',
  './js/auth.js',
  './js/expenses.js',
  './js/settlements.js',
  './js/sheets.js',
  './js/notifications.js',
  './js/pages.js',
  './js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Cache-first for local assets, network-first for external
  if (e.request.url.includes('fonts.googleapis') || e.request.url.includes('cdnjs')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return resp;
      }))
    );
    return;
  }

  if (e.request.method === 'GET' && ASSETS.some(a => e.request.url.endsWith(a.replace('./', '')))) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
