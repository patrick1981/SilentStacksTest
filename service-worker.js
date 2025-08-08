// service-worker.js — SilentStacks v2.0 (offline-first, runtime caching, background sync)

const VERSION = '2.1.0';
const APP_CACHE = `ss-app-${VERSION}`;
const PAGE_CACHE = `ss-pages-${VERSION}`;
const JS_CACHE = `ss-js-${VERSION}`;
const CSS_CACHE = `ss-css-${VERSION}`;
const IMG_CACHE = `ss-img-${VERSION}`;
const API_CACHE = `ss-api-${VERSION}`;
const RUNTIME_CACHES = [APP_CACHE, PAGE_CACHE, JS_CACHE, CSS_CACHE, IMG_CACHE, API_CACHE];

// ---- App Shell to Precache (keep small; runtime caching will grab the rest) ----
const PRECACHE_URLS = [
  '/', '/index.html',
  '/assets/css/style.css',

  // Core + utils + config
  '/core/bootstrap.js',
  '/utils/dom-utils.js',
  '/utils/validators.js',
  '/utils/formatters.js',
  '/utils/debug-utils.js',
  '/config/app-config.js',
  '/config/api-endpoints.js',
  '/config/feature-flags.js',

  // Data modules
  '/modules/data/request-manager.js',
  '/modules/data/api-client.js',
  '/modules/data/storage-adapter.js',

  // UI modules
  '/modules/ui/ui-controller.js',
  '/modules/ui/forms.js',
  '/modules/ui/search-filter.js',
  '/modules/ui/notifications.js',

  // Workflow modules
  '/modules/workflows/ill-workflow.js',
  '/modules/workflows/bulk-upload.js',
  '/modules/workflows/export-manager.js',

  // Integrations
  '/modules/integrations/pubmed-integration.js',
  '/modules/integrations/clinical-trials.js',
  '/modules/integrations/mesh-integration.js',

  // Icons
  '/icon-192.png',
  '/icon-512.png'
];

// External API host allowlist (must match CSP/connect-src)
const API_HOSTS = new Set([
  'eutils.ncbi.nlm.nih.gov',
  'api.crossref.org',
  'clinicaltrials.gov'
]);

// ---- Install ----
self.addEventListener('install', (event) => {
  // Precache app shell
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.error('[SW] Precache failed:', err))
  );
  self.skipWaiting();
});

// ---- Activate ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !RUNTIME_CACHES.includes(k))
          .map((k) => caches.delete(k))
      );

      // Claim clients so the new SW controls pages immediately
      await self.clients.claim();

      // Notify pages we’re active
      const allClients = await self.clients.matchAll({ includeUncontrolled: true });
      allClients.forEach(c => c.postMessage({ type: 'SW_READY', version: VERSION }));
    })()
  );
});

// ---- Fetch Strategy Router ----
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don’t touch chrome-extension or non-HTTP(S)
  if (!/^https?:/.test(url.protocol)) return;

  // POST/PUT/DELETE → try network; on failure, queue for background sync
  if (request.method !== 'GET') {
    event.respondWith(networkOrQueue(request));
    return;
  }

  // HTML navigations → network-first (fresh app shell), fallback to cache
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  // External API GETs → network-first with short-lived cache fallback
  if (API_HOSTS.has(url.host)) {
    event.respondWith(apiNetworkFirst(request));
    return;
  }

  // JS/CSS → stale-while-revalidate (fast offline boot + background refresh)
  if (url.pathname.endsWith('.js')) {
    event.respondWith(staleWhileRevalidate(request, JS_CACHE, 300));
    return;
  }
  if (url.pathname.endsWith('.css')) {
    event.respondWith(staleWhileRevalidate(request, CSS_CACHE, 150));
    return;
  }

  // Images & icons → cache-first with gentle revalidation
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMG_CACHE, 200));
    return;
  }

  // Fallback for all other GETs → try cache, then network, then cache
  event.respondWith(staleWhileRevalidate(request, APP_CACHE, 200));
});

// ---- Strategies ----

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
      notifyUpdated(request.url);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // as a last resort, try app cache
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function apiNetworkFirst(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const res = await fetch(request);
    // cache only 200 OK and CORS/opaque acceptable
    if (res && (res.status === 200 || res.type === 'opaqueredirect' || res.type === 'opaque')) {
      cache.put(request, res.clone());
      trimCache(API_CACHE, 300);
    }
    return res;
  } catch {
    // Network failed → fallback to cache (best-effort)
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    });
  }
}

async function staleWhileRevalidate(request, cacheName, maxEntries = 500) {
  const cache = await caches.open(cacheName);
  const cachedPromise = cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
        trimCache(cacheName, maxEntries);
        notifyUpdated(request.url);
      }
      return response;
    })
    .catch(() => null);

  const cached = await cachedPromise;
  if (cached) return cached;

  const fresh = await fetchPromise;
  if (fresh) return fresh;

  // Nothing → generic offline response
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}

async function cacheFirst(request, cacheName, maxEntries = 500) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Revalidate in background
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
        trimCache(cacheName, maxEntries);
        notifyUpdated(request.url);
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res && res.status === 200) {
      cache.put(request, res.clone());
      trimCache(cacheName, maxEntries);
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// ---- Background Sync queue for non-GET requests ----

const QUEUE_DB = 'ss-sync-db';
const QUEUE_STORE = 'requests';

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(replayQueue());
  }
});

async function networkOrQueue(request) {
  try {
    // Try network first
    return await fetch(request);
  } catch (err) {
    // If offline/failed, queue and ack
    await queueRequest(request);
    try { await self.registration.sync.register('sync-requests'); } catch {}
    return new Response(
      JSON.stringify({ queued: true, message: 'Request stored and will be synced when online.' }),
      { headers: { 'Content-Type': 'application/json' }, status: 202 }
    );
  }
}

async function queueRequest(request) {
  const body = request.clone().arrayBuffer ? await request.clone().arrayBuffer() : null;
  const entry = {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: body ? Array.from(new Uint8Array(body)) : null,
    time: Date.now()
  };
  const db = await openQueueDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  await tx.objectStore(QUEUE_STORE).add(entry);
  await tx.done;
}

async function replayQueue() {
  const db = await openQueueDB();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);
  const all = await store.getAll();
  for (const item of all) {
    try {
      const resp = await fetch(item.url, {
        method: item.method,
        headers: new Headers(item.headers),
        body: item.body ? new Uint8Array(item.body) : undefined
      });
      if (resp && resp.ok) {
        await store.delete(item.time);
      }
    } catch {
      // keep in queue
    }
  }
  await tx.done;
}

// Minimal IndexedDB helpers (tiny, no external deps)
async function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'time' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---- Cache maintenance & client notifications ----

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

function notifyUpdated(url) {
  self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
    clients.forEach((c) => c.postMessage({ type: 'ASSET_UPDATED', url }));
  });
}

// ---- Messages from clients ----
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach(c => c.postMessage({ type: 'CACHE_CLEARED' }));
      })()
    );
  } else if (data.type === 'GET_VERSION') {
    event.source?.postMessage?.({ type: 'SW_VERSION', version: VERSION });
  }
});

console.log(`[ServiceWorker] SilentStacks ${VERSION} ready`);
