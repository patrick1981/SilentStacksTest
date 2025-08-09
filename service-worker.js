// service-worker.js — SilentStacks v2.0 offline-first
const SW_VERSION = '2.0.3';
const CACHE_APP = `silentstacks-app-${SW_VERSION}`;
const CACHE_RUNTIME = `silentstacks-runtime-${SW_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',

  // Core
  '/core/bootstrap.js',
  '/core/state-manager.js',
  '/core/event-bus.js',
  '/core/diagnostics.js',
  '/core/module-loder.js',

  // CSS (include what exists in your repo)
  '/assets/css/style.css',
  '/assets/css/enhanced-styles.css',
  '/assets/css/base/design-tokens.css',
  '/assets/css/base/reset.css',
  '/assets/css/base/typography.css',
  '/assets/css/components/buttons.css',
  '/assets/css/components/cards.css',
  '/assets/css/components/enhanced-components.css',
  '/assets/css/components/forms.css',
  '/assets/css/components/progress.css',
  '/assets/css/components/tables.css',
  '/assets/css/layout/grid.css',
  '/assets/css/layout/navigation.css',
  '/assets/css/layout/responsive.css',
  '/assets/css/themes/light-theme.css',
  '/assets/css/themes/dark-theme.css',
  '/assets/css/themes/high-contrast-theme.css',
  '/assets/css/utilities/accessibility.css',
  '/assets/css/utilities/print.css',

  // Fonts
  '/assets/fonts/reddit-sans/reddit-sans.css',
  '/assets/fonts/reddit-sans/RedditSans-Regular.woff2',
  '/assets/fonts/reddit-sans/RedditSans-Medium.woff2',
  '/assets/fonts/reddit-sans/RedditSans-SemiBold.woff2',
  '/assets/fonts/reddit-sans/RedditSans-Bold.woff2',

  // Vendor libs (local)
  '/assets/js/fuse.min.js',
  '/assets/js/papaparse.min.js',

  // Utils & Config (under modules/)
  '/modules/utils/dom-utils.js',
  '/modules/utils/validators.js',
  '/modules/utils/formatters.js',
  '/modules/utils/debug-utils.js',
  '/modules/config/app-config.js',
  '/modules/config/api-endpoints.js',
  '/modules/config/feature-flags.js',

  // Security & Offline helpers
  '/modules/security/input-sanitizer.js',
  '/modules/security/security-patches.js',
  '/modules/offline/offline-manager.js',

  // Data
  '/modules/data/request-manager.js',
  '/modules/data/api-client.js',
  '/modules/data/storage-adapter.js',
  '/modules/data/local-api-cache.js',
  '/modules/data/data-manager.js',

  // UI
  '/modules/ui/ui-controller.js',
  '/modules/ui/forms.js',
  '/modules/ui/search-filter.js',
  '/modules/ui/notifications.js',
  '/modules/ui/integrated-help.js',

  // Workflows
  '/modules/workflows/ill-workflow.js',
  '/modules/workflows/bulk-upload.js',
  '/modules/workflows/export-manager.js',

  // Integrations
  '/modules/integrations/pubmed-integration.js',
  '/modules/integrations/clinical-trials.js',
  '/modules/integrations/mesh-integration.js',

  // Icons (if present)
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_APP);
    try {
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
      console.log('[SW] App shell cached', SW_VERSION);
    } catch (e) {
      console.warn('[SW] Install failed:', e);
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if (k !== CACHE_APP && k !== CACHE_RUNTIME) return caches.delete(k);
    }));
    await self.clients.claim();
    console.log('[SW] Activated', SW_VERSION);
  })());
});

// Fetch strategy:
// - JS/CSS: Network-first (so updates land quickly), fallback to cache
// - HTML/Images/Fonts: Cache-first (fast), background update
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') return;
  if (url.origin !== location.origin) return; // same-origin only

  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirst(req));
  } else if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.woff2')) {
    event.respondWith(cacheFirst(req));
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
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // try to update in background
    fetch(request).then(async (res) => {
      if (res && res.ok) {
        const cache = await caches.open(CACHE_RUNTIME);
        cache.put(request, res.clone());
      }
    }).catch(()=>{});
    return cached;
  }
  const res = await fetch(request);
  if (res && res.ok) {
    const cache = await caches.open(CACHE_RUNTIME);
    cache.put(request, res.clone());
  }
  return res;
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

// Background sync stub: ping clients to flush API queues
self.addEventListener('sync', (event) => {
  if (event.tag === 'silentstacks-sync') {
    event.waitUntil(notifyClientsToFlush());
  }
});
async function notifyClientsToFlush() {
  const all = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  all.forEach(c => c.postMessage({ type: 'SS_SYNC_REQUESTS' }));
  console.log('[SW] Notified clients to flush offline API queue');
}

// Manual messages (skip waiting / clear caches)
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      event.source?.postMessage?.({ type: 'CACHE_CLEARED' });
    })());
  }
});

console.log(`[SW] Ready ${SW_VERSION}`);
