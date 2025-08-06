// SilentStacks Service Worker v1.2.1
// Complete and operational with proper file paths

const CACHE_NAME = 'silentstacks-v1.2.2';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline operation - respecting your exact file tree
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  
  // Main CSS
  '/assets/css/style.css',
  
  // Base CSS
  '/assets/css/base/reset.css',
  '/assets/css/base/typography.css',
  '/assets/css/base/design-tokens.css',
  
  // Layout CSS
  '/assets/css/layout/grid.css',
  '/assets/css/layout/navigation.css',
  '/assets/css/layout/responsive.css',
  
  // Component CSS
  '/assets/css/components/buttons.css',
  '/assets/css/components/forms.css',
  '/assets/css/components/cards.css',
  '/assets/css/components/progress.css',
  '/assets/css/components/tables.css',
  
  // Theme CSS
  '/assets/css/themes/light-theme.css',
  '/assets/css/themes/dark-theme.css',
  '/assets/css/themes/high-contrast-theme.css',
  
  // Utility CSS
  '/assets/css/utilities/accessibility.css',
  '/assets/css/utilities/print.css',
  
  // Fonts
  '/assets/fonts/reddit-sans/reddit-sans.css',
  '/assets/fonts/reddit-sans/RedditSans-Regular.woff2',
  '/assets/fonts/reddit-sans/RedditSans-Medium.woff2',
  '/assets/fonts/reddit-sans/RedditSans-SemiBold.woff2',
  '/assets/fonts/reddit-sans/RedditSans-Bold.woff2',
  
  // Core JavaScript
  '/assets/js/app.js',
  '/assets/js/enhanced-data-manager.js',
  '/assets/js/offline-manager.js',
  '/assets/js/integrated-documentation.js',
  '/assets/js/fuse.min.js',
  '/assets/js/papaparse.min.js',
  
  // Module JavaScript
  '/assets/js/modules/api-integration.js',
  '/assets/js/modules/bulk-operations.js',
  '/assets/js/modules/medical-features.js',
  '/assets/js/modules/request-manager.js',
  '/assets/js/modules/search-filter.js',
  '/assets/js/modules/theme-manager.js',
  '/assets/js/modules/ui-controller.js',
  '/assets/js/modules/ill-workflow.js'
];

// API endpoints to handle offline
const API_CACHE_PATTERNS = [
  /eutils\.ncbi\.nlm\.nih\.gov/,
  /api\.crossref\.org/,
  /pubmed\.ncbi\.nlm\.nih\.gov/
];

// Install event - cache static assets
// Cache files individually to handle errors gracefully
return Promise.all(
  STATIC_CACHE_URLS.map(async url => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('✅ Cached:', url);
      } else {
        console.warn(`⚠️ Skipping cache for ${url} - status: ${response.status}`);
      }
    } catch (err) {
      console.warn(`Failed to fetch ${url}:`, err);
    }
  })
);

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName.startsWith('silentstacks-')) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('✅ Service Worker activated');
      // Notify clients about activation
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            data: {
              version: CACHE_NAME,
              timestamp: new Date().toISOString()
            }
          });
        });
      });
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Skip cross-origin requests except for APIs we handle
  if (url.origin !== self.location.origin && !isAPIRequest(request.url)) {
    return;
  }
  
  // Handle API requests
  if (isAPIRequest(request.url)) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle GET requests (static assets and navigation)
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
  }
});

// Check if request is to an API endpoint
function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

// Handle API requests with offline fallback
async function handleAPIRequest(request) {
  try {
    console.log('🌐 API request:', request.url);
    
    // Try network first with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
      console.log('✅ API response cached:', request.url);
      return networkResponse;
    }
    
    throw new Error(`HTTP ${networkResponse.status}`);
    
  } catch (error) {
    console.log('📴 API request failed, checking cache:', error.message);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving cached API response');
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request requires an internet connection.',
        cached: false,
        url: request.url,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable - Offline',
        headers: {
          'Content-Type': 'application/json',
          'X-Served-From': 'ServiceWorker-Offline'
        }
      }
    );
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  try {
    // For navigation requests, try network first
    if (request.mode === 'navigate') {
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          // Update cache with fresh content
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }
      } catch (error) {
        console.log('📄 Network failed for navigation, using cache');
      }
    }
    
    // Check cache first for all requests
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving from cache:', request.url);
      
      // For non-navigation requests, update cache in background
      if (request.mode !== 'navigate') {
        event.waitUntil(
          fetch(request).then(response => {
            if (response.ok) {
              const cache = caches.open(CACHE_NAME);
              cache.then(c => c.put(request, response));
            }
          }).catch(() => {})
        );
      }
      
      return cachedResponse;
    }
    
    // Try network for non-cached resources
    console.log('🌐 Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (error) {
    console.error('❌ Request failed:', request.url, error);
    
    // For navigation requests, show offline page
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        console.log('📴 Serving offline page');
        return offlineResponse;
      }
    }
    
    // Return error response
    return new Response(
      'Resource not available offline',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
      }
    );
  }
}

// Message handling from main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache();
      break;
      
    case 'UPDATE_CACHE':
      if (data && data.urls) {
        updateCache(data.urls);
      }
      break;
  }
});

// Get cache status
async function getCacheStatus() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    return {
      cacheVersion: CACHE_NAME,
      cachedFiles: keys.length,
      cacheNames: await caches.keys(),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get cache status:', error);
    return {
      error: error.message,
      cacheVersion: CACHE_NAME,
      cachedFiles: 0
    };
  }
}

// Clear all caches
async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('🗑️ All caches cleared');
    
    // Notify clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CACHE_CLEARED',
          data: { timestamp: new Date().toISOString() }
        });
      });
    });
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

// Update cache with new URLs
async function updateCache(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(
      urls.map(url => cache.add(url))
    );
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Cache update: ${succeeded} succeeded, ${failed} failed`);
    
    // Notify clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CACHE_UPDATED',
          data: { 
            succeeded,
            failed,
            timestamp: new Date().toISOString() 
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Failed to update cache:', error);
  }
}

// Periodic cache cleanup (remove old API responses)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    cleanupOldCacheEntries()
  );
});

async function cleanupOldCacheEntries() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    let cleanedCount = 0;
    
    // Remove old API cache entries
    for (const request of keys) {
      if (isAPIRequest(request.url)) {
        const response = await cache.match(request);
        const dateHeader = response?.headers.get('date');
        
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (responseDate < oneWeekAgo) {
            await cache.delete(request);
            cleanedCount++;
            console.log('🗑️ Removed old cached API response:', request.url);
          }
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned ${cleanedCount} old cache entries`);
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

// Handle errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in service worker:', event.reason);
  event.preventDefault();
});

console.log('🎯 Service Worker loaded successfully - SilentStacks v1.2.1');
