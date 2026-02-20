/**
 * Service Worker - Enterprise-Grade Performance & Freshness Strategy
 * Version: ipmc-kart-v6.0-ENTERPRISE - Auto-Update Edition
 * 
 * CORE STRATEGY:
 * - HTML: Network-First with Short Timeout (1.5s). 
 *   (Tries to get fresh content. If slow, falls back to cache instantly. Updates cache in background.)
 * - Assets (CSS/JS): Stale-While-Revalidate.
 *   (Loads instantly from cache, updates in background for next visit.)
 * - Images: Cache-First.
 *   (Max speed, low bandwidth.)
 * - JSON/Data: Network-First.
 *   (Ensures prices/stock are accurate.)
 */

// ==============================
// 1. CONFIGURATION
// ==============================
const SW_VERSION = 'ipmc-kart-v6.0-' + new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '');
const CACHE_PREFIX = 'ipmc-kart';
const TIMEOUT_MS = 1500; // 1.5s timeout for HTML freshness

const CACHES = {
  CRITICAL: `${CACHE_PREFIX}-critical-v6`,
  STATIC: `${CACHE_PREFIX}-static-v6`,
  IMAGES: `${CACHE_PREFIX}-images-v6`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-v6`,
  API: `${CACHE_PREFIX}-api-v6`
};

const LIMITS = {
  STATIC: 200,
  IMAGES: 300,
  DYNAMIC: 150,
  API: 100
};

// Network-only paths (NEVER cache)
const NETWORK_ONLY_PATHS = [
  '/api/admin/',
  '/api/cart/',
  '/api/checkout/',
  '/api/orders',
  '/api/auth/',
  '/admin.html',
  '/dashboard.html',
  '/checkout.html',
  '/cart.html',
  '/login.html',
  '/register.html',
  '/order-complete.html',
  '/track-order.html'
];

const PRECACHE_ASSETS = [
  '/offline.html',
  '/assets/css/performance.c706b3e6.css',
  '/assets/vendor/fontawesome-free/css/all.min.css',
  '/assets/js/common.bundle.min.fc8e2cc1.js'
];

// ==============================
// 2. LIFECYCLE EVENTS
// ==============================

self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  self.skipWaiting(); // Force activation

  event.waitUntil(
    caches.open(CACHES.CRITICAL).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[SW] Precache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`);
  
  event.waitUntil(
    Promise.all([
      // Claim clients immediately
      self.clients.claim(),
      // Clean old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key.startsWith(CACHE_PREFIX) && !Object.values(CACHES).includes(key)) {
              console.log(`[SW] Deleting old cache: ${key}`);
              return caches.delete(key);
            }
          })
        );
      }),
      // Notify clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
        });
      })
    ])
  );
});

// ==============================
// 3. FETCH STRATEGIES
// ==============================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignore non-GET
  if (request.method !== 'GET') return;

  // 2. Ignore cross-origin (except specific CDNs)
  if (url.origin !== self.location.origin && !isCacheableCDN(url)) {
    return;
  }

  const pathname = url.pathname;

  // 3. Network Only Paths
  if (NETWORK_ONLY_PATHS.some(path => pathname.startsWith(path))) {
    event.respondWith(fetch(request));
    return;
  }

  // 4. STRATEGY: API / JSON -> Network First (Freshness is key)
  if (pathname.startsWith('/api/') || pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request, CACHES.API));
    return;
  }

  // 5. STRATEGY: HTML -> Network First with Timeout (Speed + Freshness)
  if (request.destination === 'document' || pathname.endsWith('.html') || pathname === '/') {
    event.respondWith(networkFirstWithTimeout(request, CACHES.DYNAMIC, TIMEOUT_MS));
    return;
  }

  // 6. STRATEGY: Images -> Cache First (Performance)
  if (request.destination === 'image' || isImage(pathname)) {
    event.respondWith(cacheFirst(request, CACHES.IMAGES));
    return;
  }

  // 7. STRATEGY: Static Assets (CSS/JS) -> Stale-While-Revalidate (Instant Load + Background Update)
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(staleWhileRevalidate(request, CACHES.STATIC));
    return;
  }

  // Default -> Network First
  event.respondWith(networkFirst(request, CACHES.DYNAMIC));
});

// ==============================
// 4. STRATEGY IMPLEMENTATIONS
// ==============================

/**
 * Network First with Timeout
 * Tries network for X ms. If slow, serves cache.
 * ALWAYS updates cache in background if network eventually returns.
 */
async function networkFirstWithTimeout(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  
  // Create a timeout promise
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve('TIMEOUT'), timeoutMs);
  });

  // Create network promise
  const networkPromise = fetch(request).then(async (response) => {
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  }).catch(() => null);

  try {
    // Race network vs timeout
    const raceResult = await Promise.race([networkPromise, timeoutPromise]);

    if (raceResult === 'TIMEOUT' || !raceResult) {
      // Network timed out or failed -> Try Cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log(`[SW] Serving cached HTML (Network timed out): ${request.url}`);
        return cachedResponse;
      }
      // No cache? Wait for network regardless of timeout
      return await networkPromise || Response.error();
    }

    // Network won and succeeded
    console.log(`[SW] Served fresh HTML: ${request.url}`);
    return raceResult;
  } catch (error) {
    // Fallback
    const cached = await cache.match(request);
    if (cached) return cached;
    
    // Offline page
    if (request.destination === 'document') {
      const offlineCache = await caches.open(CACHES.CRITICAL);
      return await offlineCache.match('/offline.html') || new Response('Offline');
    }
    return Response.error();
  }
}

/**
 * Stale While Revalidate
 * Serve cache immediately, update from network in background.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request).then(async (response) => {
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cachedResponse || networkPromise;
}

/**
 * Cache First
 * Serve from cache. If missing, fetch from network and cache.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return new Response('Asset unavailable', { status: 404 });
  }
}

/**
 * Network First (Standard)
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
      return response;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), { 
      status: 503, 
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ==============================
// 5. UTILS
// ==============================

function isCacheableCDN(url) {
  const whitelist = [
    'cdnjs.cloudflare.com',
    'unpkg.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  return whitelist.some(domain => url.hostname.includes(domain));
}

function isImage(pathname) {
  return /\.(png|jpe?g|gif|webp|svg|ico|avif)$/i.test(pathname);
}
