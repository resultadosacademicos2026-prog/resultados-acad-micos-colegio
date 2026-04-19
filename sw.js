// EduMetrics — Service Worker
const CACHE = 'edumetrics-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalación: precargar recursos básicos
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: estrategia network-first con fallback a cache
// Esto asegura que siempre se obtenga la versión más reciente cuando haya conexión,
// pero si no hay internet usa la versión en cache
self.addEventListener('fetch', evt => {
  // Solo manejar peticiones GET del mismo origen
  if(evt.request.method !== 'GET') return;
  const url = new URL(evt.request.url);
  if(url.origin !== location.origin) return;

  evt.respondWith(
    fetch(evt.request)
      .then(response => {
        // Guardar copia en cache
        const copy = response.clone();
        caches.open(CACHE).then(c => c.put(evt.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(evt.request).then(r => r || caches.match('./index.html')))
  );
});
