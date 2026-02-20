// Update server.js and sw.js for hashed assets and long-term caching

const fs = require('fs');

function patchServer(){
  const file = 'server.js';
  if (!fs.existsSync(file)) return;
  let s = fs.readFileSync(file, 'utf8');

  // Add static cache-control for hashed assets
  if (!/app\.use\(express\.static\(/.test(s)) return;

  if (!/function setLongCacheHeaders/.test(s)){
    s = s.replace(
      /app\.use\(express\.static\([^\)]*\)\);/,
      `
// Add long-term caching for hashed assets
function setLongCacheHeaders(res, path) {
  if (/\.[a-f0-9]{8}\.(?:js|css|png|jpg|jpeg|webp|svg)$/.test(path)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (/\.(?:js|css|png|jpg|jpeg|webp|svg)$/.test(path)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
}
app.use(express.static(__dirname, { setHeaders: setLongCacheHeaders }));
      `
    );
    fs.writeFileSync(file, s, 'utf8');
  }
}

function patchSW(){
  const file = 'sw.js';
  if (!fs.existsSync(file)) return;
  let s = fs.readFileSync(file, 'utf8');

  // Add cache-first for JSON with background refresh
  if (!/async function cacheFirstJson/.test(s)){
    s = s.replace(
      /self\.addEventListener\('fetch', \(event\) => \{[\s\S]*?\}\);\n\n\/\/ Optional: allow immediate activation on message[\s\S]*/,
      `
// Fetch: route by resource type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  const dest = request.destination;
  const pathname = url.pathname;

  const isImage = dest === 'image' || /\\.(?:png|jpe?g|gif|webp|svg|ico)$/i.test(pathname);
  if (isImage) { event.respondWith(staleWhileRevalidate(request)); return; }

  const isAsset = dest === 'style' || dest === 'script' || /\\.(?:css|js)$/i.test(pathname);
  if (isAsset) { event.respondWith(cacheFirst(request)); return; }

  const isJson = dest === 'document' ? false : /\\.json$/i.test(pathname);
  if (isJson) { event.respondWith(cacheFirstJson(request)); return; }

  if (dest === 'document' || request.mode === 'navigate') { event.respondWith(networkFirst(request)); return; }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

async function cacheFirstJson(request){
  const cache = await caches.open(ASSETS_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then(async res => { if (res && res.status === 200){ try { await cache.put(request, res.clone()); } catch(e){} } return res; }).catch(()=>undefined);
  return cached || network || new Response('', { status: 504 });
}

// Optional: allow immediate activation on message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
      `
    );
    fs.writeFileSync(file, s, 'utf8');
  }
}

patchServer();
patchSW();
console.log('Patched server.js and sw.js for hashed assets and JSON caching.');
