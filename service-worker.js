// service-worker.js - Fixed version with Network-First for JS files
const CACHE_NAME = 'silentstacks-v2.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/create-request.html',
    '/assets/css/style.css',
    '/assets/js/app.js',
    '/assets/js/enhanced-apis.js',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[ServiceWorker] Failed to cache:', error);
            })
    );
    // Force the new service worker to activate immediately
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event with smart strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip external requests
    if (!url.origin.includes(location.origin)) {
        return;
    }
    
    // Determine strategy based on file type
    if (url.pathname.includes('.js') || url.pathname.includes('.css')) {
        // NETWORK FIRST for JS/CSS files (get updates immediately)
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Got fresh version from network
                    if (response && response.status === 200) {
                        // Clone and update cache in background
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseToCache);
                            console.log('[ServiceWorker] Updated cache:', request.url);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed (offline) - fallback to cache
                    console.log('[ServiceWorker] Offline, using cache:', request.url);
                    return caches.match(request);
                })
        );
    } else if (url.pathname.includes('/api/')) {
        // NETWORK ONLY for API calls
        event.respondWith(fetch(request));
    } else {
        // CACHE FIRST for other assets (HTML, images) for speed
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        // Found in cache, but still fetch in background to update
                        fetch(request).then(fetchResponse => {
                            if (fetchResponse && fetchResponse.status === 200) {
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(request, fetchResponse);
                                });
                            }
                        }).catch(() => {
                            // Silent fail for background update
                        });
                        return response;
                    }
                    // Not in cache, fetch from network
                    return fetch(request).then(fetchResponse => {
                        if (fetchResponse && fetchResponse.status === 200) {
                            const responseToCache = fetchResponse.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(request, responseToCache);
                            });
                        }
                        return fetchResponse;
                    });
                })
        );
    }
});

// Background sync for queued requests (if you're using it)
self.addEventListener('sync', event => {
    console.log('[ServiceWorker] Background sync:', event.tag);
    if (event.tag === 'sync-requests') {
        event.waitUntil(syncRequests());
    }
});

// Function to sync offline requests
async function syncRequests() {
    try {
        // Your sync logic here
        console.log('[ServiceWorker] Syncing offline requests...');
    } catch (error) {
        console.error('[ServiceWorker] Sync failed:', error);
    }
}

// Listen for messages from the app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        console.log('[ServiceWorker] Clearing cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                // Notify the client that cache is cleared
                event.source.postMessage({ type: 'CACHE_CLEARED' });
            })
        );
    }
});

// Optional: Add version check
const VERSION = '2.0.0';
console.log(`[ServiceWorker] Version ${VERSION} loaded`);
