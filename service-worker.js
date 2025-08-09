// service-worker.js — SilentStacks v2.0.4 (FINAL)
const SW_VERSION = '2.0.4';
const CACHE_APP = `silentstacks-app-${SW_VERSION}`;
const CACHE_RUNTIME = `silentstacks-runtime-${SW_VERSION}`;

// Derive base path from registration scope (handles GitHub Pages subpath like /SilentStacksTest)
const BASE = (() => {
  try {
    const p = new URL(self.registration.scope).pathname.replace(/\/$/, '');
    return p || '';
  } catch { return ''; }
})();
const path = (p) => `${BASE}${p.startsWith('/') ? p : `/${p}`}`;

// Keep shell minimal & guaranteed to exist. We add safely (skip 404s).
const APP_SHELL = [
  path('/'),
  path('/index.html'),
  path('/offline.html'),
  path('/core/bootstrap.js'),
  path('/assets/css/style.css'),
  path('/modules/offline/offline-manager.js'),
  path('/modules/data/api-client.js'),
  path('/modules/data/request-manager.js'),
  path('/modules/data/storage-adapter.js'),
  path('/modules/data/data-manager.js'),
  path('/modules/ui/ui-controller.js'),
];

// Must match OfflineManager
const SYNC_TAG = 'ss-flush-queue';
const BC_NAME  = 'ss-offline';

function bcSend(msg) {
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage(msg);
    bc.close?.();
  } catch {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_APP);
    await Promise.allSettled(
      APP_SHELL.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.ok) await cache.put(url, res.clone());
          else console.warn('[SW] Skip precache:', url, res.status);
        } catch (e) {
          console.warn('[SW] Skip precache:', url, e?.message);
        }
      })
    );
    await self.skipWaiting();
    console.log('[SW] Installed', SW_VERSION, 'BASE:', BASE);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      if (k !== CACHE_APP && k !== CACHE_RUNTIME) return caches.delete(k);
    }));
    await self.clients.claim();
    console.log('[SW] Activated', SW_VERSION);
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isHTML =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first for navigations with offline fallback
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE_RUNTIME);
        cache.put(req, res.clone());
        return res;
      } catch {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        const offline = await caches.match(path('/offline.html'), { ignoreSearch: true });
        return offline || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(staleWhileRevalidate(req));
  }
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    const cache = await caches.open(CACHE_RUNTIME);
    cache.put(request, res.clone());
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw new Error('Network error and no cache');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || network;
}

// Background Sync → tell pages/tabs to flush offline queues
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil((async () => {
      bcSend({ type: 'sync' }); // OfflineManager listens and calls flush()
      console.log('[SW] Background sync triggered flush');
    })());
  }
});

// Optional messages from pages
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      event.source?.postMessage?.({ type: 'CACHE_CLEARED' });
    })());
  }
  if (data.type === 'FLUSH') bcSend({ type: 'flush' });
});

console.log(`[SW] Ready ${SW_VERSION}`);
