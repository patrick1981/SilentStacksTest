// SilentStacks Service Worker v1.2.5
// Complete and operational with proper error handling

const CACHE_NAME = 'silentstacks-v1.2.5';
const OFFLINE_URL = '/SilentStacksTest/offline.html';

// Files to cache for offline operation
const STATIC_CACHE_URLS = [
  '/SilentStacksTest/',
  '/SilentStacksTest/index.html',
  '/SilentStacksTest/offline.html',
  
  // Main CSS
  '/SilentStacksTest/assets/css/style.css',
  
  // Base CSS
  '/SilentStacksTest/assets/css/base/reset.css',
  '/SilentStacksTest/assets/css/base/typography.css',
  '/SilentStacksTest/assets/css/base/design-tokens.css',
  
  // Layout CSS
  '/SilentStacksTest/assets/css/layout/grid.css',
  '/SilentStacksTest/assets/css/layout/navigation.css',
  '/SilentStacksTest/assets/css/layout/responsive.css',
  
  // Component CSS
  '/SilentStacksTest/assets/css/components/buttons.css',
  '/SilentStacksTest/assets/css/components/forms.css',
  '/SilentStacksTest/assets/css/components/cards.css',
  '/SilentStacksTest/assets/css/components/progress.css',
  '/SilentStacksTest/assets/css/components/tables.css',
  '/SilentStacksTest/assets/css/components/enhanced-components.css',
  
  // Theme CSS
  '/SilentStacksTest/assets/css/themes/light-theme.css',
  '/SilentStacksTest/assets/css/themes/dark-theme.css',
  '/SilentStacksTest/assets/css/themes/high-contrast-theme.css',
  
  // Utility CSS
  '/SilentStacksTest/assets/css/utilities/accessibility.css',
  '/SilentStacksTest/assets/css/utilities/print.css',
  
  // Core JavaScript
  '/SilentStacksTest/assets/js/app.js',
  '/SilentStacksTest/assets/js/enhanced-data-manager.js',
  '/SilentStacksTest/assets/js/offline-manager.js',
  '/SilentStacksTest/assets/js/integrated-documentation.js',
  '/SilentStacksTest/assets/js/fuse.min.js',
  '/SilentStacksTest/assets/js/papaparse.min.js',
  
  // Module JavaScript
  '/SilentStacksTest/assets/js/modules/api-integration.js',
  '/SilentStacksTest/assets/js/modules/bulk-operations.js',
  '/SilentStacksTest/assets/js/modules/medical-features.js',
  '/SilentStacksTest/assets/js/modules/request-manager.js',
  '/SilentStacksTest/assets/js/modules/search-filter.js',
  '/SilentStacksTest/assets/js/modules/theme-manager.js',
  '/SilentStacksTest/assets/js/modules/ui-controller.js'
];

// API endpoints to handle offline
const API_CACHE_PATTERNS = [
  /eutils\.ncbi\.nlm\.nih\.gov/,
  /api\.crossref\.org/,
  /pubmed\.ncbi\.nlm\.nih\.gov/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('📦 Caching static assets...');
        
        // Cache files individually and only cache successful responses
        const cachePromises = STATIC_CACHE_URLS.map(async (url) => {
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
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache installation error:', error);
        return self.skipWaiting();
      })
  );
});

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
    
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
      console.log('✅ API response cached');
      return networkResponse;
    }
    
    throw new Error(`HTTP ${networkResponse.status}`);
    
  } catch (error) {
    console.log('📴 API request failed, checking cache');
    
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
    // Check cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving from cache:', request.url);
      
      // Update cache in background for non-navigation requests
      if (request.mode !== 'navigate') {
        event.waitUntil(
          fetch(request)
            .then(response => {
              if (response.ok) {
                return caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {})
        );
      }
      
      return cachedResponse;
    }
    
    // Try network
    console.log('🌐 Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
      return networkResponse;
    }
    
    // Don't cache error responses
    console.warn(`❌ Not caching error response (${networkResponse.status}) for:`, request.url);
    return networkResponse;
    
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
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

// Update cache with new URLs
async function updateCache(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(
      urls.map(async url => {
        const response = await fetch(url);
        if (response.ok) {
          return cache.put(url, response);
        }
        throw new Error(`Failed to fetch ${url}`);
      })
    );
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`✅ Cache update: ${succeeded} succeeded, ${failed} failed`);
  } catch (error) {
    console.error('❌ Failed to update cache:', error);
  }
}

console.log('🎯 Service Worker loaded successfully - SilentStacks v1.2.5');
