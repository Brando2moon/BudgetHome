const CACHE_NAME = 'camilles-finance-v7';
const ASSETS = [
  './',
  './index.html',
  './refresh.html',
  './styles.css',
  './reference-theme.css',
  './paycheck-4k-theme.css',
  './app.js',
  './app-source-1.txt',
  './app-source-2.txt',
  './app-source-3.txt',
  './src/budgetEngine.js',
  './manifest.webmanifest',
  ...Array.from({ length: 35 }, (_, index) => `./assets/approved-bank-reference-4k-${String(index + 1).padStart(2, '0')}.txt`),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    })),
  );
});
