const CACHE_NAME = 'pdf-pwa-v1';
const ASSETS = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  } else {
    // For external PDF files: try cache first, then network and cache response
    e.respondWith(caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(e.request);
      if (cached) return cached;
      const resp = await fetch(e.request);
      cache.put(e.request, resp.clone());
      return resp;
    }));
  }
});

