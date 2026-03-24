const SW_VERSION = 'ipmc-kart-v10.0-' + new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '');
const CACHE_PREFIX = 'ipmc-kart';
const TIMEOUT_MS = 1000;

const CACHES = {
  PRECACHE: `${CACHE_PREFIX}-precache-v10`,
  STATIC: `${CACHE_PREFIX}-static-v10`,
  IMAGES: `${CACHE_PREFIX}-images-v10`,
  API: `${CACHE_PREFIX}-api-v10`
};

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/css/performance.c706b3e6.css',
  '/assets/vendor/fontawesome-free/css/all.min.css',
  '/assets/js/common.bundle.min.fc8e2cc1.js',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHES.PRECACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key.startsWith(CACHE_PREFIX) && !Object.values(CACHES).includes(key)) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !isCacheableCDN(url)) return;

  const pathname = url.pathname;

  if (request.destination === 'document' || pathname.endsWith('.html') || pathname === '/') {
    event.respondWith(networkFirstWithTimeout(request, CACHES.PRECACHE, TIMEOUT_MS));
    return;
  }

  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(staleWhileRevalidate(request, CACHES.STATIC));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHES.IMAGES));
    return;
  }

  if (pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHES.API));
    return;
  }
});

async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), timeoutMs));
  const networkPromise = fetch(request).then(async (response) => {
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  const raceResult = await Promise.race([networkPromise, timeoutPromise]);
  if (raceResult === 'TIMEOUT' || !raceResult) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    return await networkPromise || caches.match('/offline.html');
  }
  return raceResult;
}

async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  const networkPromise = fetch(request).then(async (response) => {
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      return response;
    }
    return response;
  }).catch(() => null);
  return cachedResponse || networkPromise;
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response(null, { status: 404 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      return response;
    }
    throw new Error('Network error');
  } catch (err) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), { status: 503 });
  }
}

function isCacheableCDN(url) {
  const whitelist = ['cdnjs.cloudflare.com', 'unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
  return whitelist.some(domain => url.hostname.includes(domain));
}
