
/*! SilentStacks service-worker.js - v2.2.0
 *  - Bypass external APIs (CT.gov, NCBI) to avoid cache/fallback errors
 *  - Cache app shell (same-origin static assets) with network-first update
 *  - Friendly 503 JSON fallback for API network failures
 */
const CACHE_NAME = 'silentstacks-v2.2.0';
const APP_SHELL = [
  '/',                 // adjust to your served root
  '/index.html',       // adjust if different
  '/app.min.js',       // ensure this path matches your deployment
  '/styles.css'        // optional
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isExternalApi =
    url.hostname.endsWith('ncbi.nlm.nih.gov');

  // Always bypass cache for external APIs; let page handle failures
  if (isExternalApi) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'network_unavailable_api' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Same-origin: try cache, then network; update cache on success
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(resp => {
          try {
            if (resp && resp.ok && event.request.method === 'GET') {
              const respClone = resp.clone();
              caches.open(CACHE_NAME).then(c => c.put(event.request, respClone));
            }
          } catch(e) {}
          return resp;
        }).catch(() => cached || Response.error());
        return cached || networkFetch;
      })
    );
    return;
  }

  // Default: pass-through
  event.respondWith(fetch(event.request));
});
