const CACHE_NAME = 'stock-pos-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through: solo para cumplir requisito de PWA
  event.respondWith(fetch(event.request));
});
