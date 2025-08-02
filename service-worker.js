// Complete service-worker.js - Place in root directory

const CACHE_NAME = 'silentstacks-v1.2.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline operation
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/css/style.css',
  '/assets/css/base/reset.css',
  '/assets/css/base/typography.css',
  '/assets/css/base/design-tokens.css',
  '/assets/css/layout/grid.css',
  '/assets/css/layout/navigation.css',
  '/assets/css/layout/responsive.css',
  '/assets/css/components/buttons.css',
  '/assets/css/components/forms.css',
  '/assets/css/components/cards.css',
  '/assets/css/components/progress.css',
  '/assets/css/components/tables.css',
  '/assets/css/themes/light-theme.css',
  '/assets/css/themes/dark-theme.css',
  '/assets/css/themes/high-contrast-theme.css',
  '/assets/css/utilities/accessibility.css',
  '/assets/css/utilities/print.css',
  '/assets/fonts/reddit-sans/reddit-sans.css',
  '/assets/fonts/reddit-sans/RedditSans-Regular.woff2',
  '/assets/fonts/reddit-sans/RedditSans-Medium.woff2',
  '/assets/fonts/reddit-sans/RedditSans-SemiBold.woff2',
  '/assets/fonts/reddit-sans/RedditSans-Bold.woff2',
  '/assets/js/silentstacks.js',
  '/assets/js/enhanced-data-manager.js',
  '/assets/js/offline-manager.js',
  '/assets/js/integrated-documentation.js',
  '/assets/js/fuse.min.js',
  '/assets/js/papaparse.min.js'
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
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_CACHE_URLS.map(url => {
          return new Request(url, { mode: 'no-cors' });
        }));
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
        // Continue anyway - app can still work with partial caching
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
            if (cacheName !== CACHE_NAME) {
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
            version: CACHE_NAME
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
  
  // Skip non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle API requests
  if (isAPIRequest(request.url)) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle static assets and navigation
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
  const requestId = generateRequestId();
  
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
      // Cache successful API responses for offline use
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
      console.log('✅ API response cached:', request.url);
      return networkResponse;
    }
    
    throw new Error(`HTTP ${networkResponse.status}: ${networkResponse.statusText}`);
    
  } catch (error) {
    console.log('🌐 API request failed, checking cache:', request.url, error.message);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving cached API response:', request.url);
      
      // Add cache indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'ServiceWorker-Cache');
      return response;
    }
    
    // Queue the request for retry when online
    await queueFailedRequest(request, requestId);
    
    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request requires an internet connection. It has been queued for retry when you\'re back online.',
        cached: false,
        requestId: requestId,
        url: request.url,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable - Offline',
        headers: {
          'Content-Type': 'application/json',
          'X-Served-From': 'ServiceWorker-Offline',
          'X-Request-ID': requestId
        }
      }
    );
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  const url = new URL(request.url);
  
  try {
    // For HTML documents, try network first to get fresh content
    if (request.destination === 'document' || request.headers.get('Accept')?.includes('text/html')) {
      
      // Try network first with a short timeout for HTML
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for HTML
      
      try {
        const networkResponse = await fetch(request, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (networkResponse.ok) {
          // Cache the fresh HTML
          const cache = await caches.open(CACHE_NAME);
          cache.put(request.clone(), networkResponse.clone());
          return networkResponse;
        }
      } catch (networkError) {
        clearTimeout(timeoutId);
        console.log('📄 Network failed for HTML, trying cache:', request.url);
      }
    }
    
    // Try cache first for assets, or after network failure for HTML
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Try network as fallback for non-HTML or when cache miss
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response for future use
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
      console.log('🌐 Served from network and cached:', request.url);
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (error) {
    console.log('❌ Both network and cache failed for:', request.url, error.message);
    
    // Serve offline page for HTML requests
    if (request.destination === 'document' || request.headers.get('Accept')?.includes('text/html')) {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        console.log('📴 Serving offline page');
        return offlineResponse;
      }
    }
    
    // Return 404 for other failed requests
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: 'The requested resource is not available offline.',
        url: request.url
      }),
      {
        status: 404,
        statusText: 'Not Found - Offline',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync for queued API requests
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'api-retry') {
    event.waitUntil(processQueuedAPIRequests());
  }
});

// IndexedDB queue management
function openQueueDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SilentStacksQueue', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('apiQueue')) {
        const store = db.createObjectStore('apiQueue', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }
    };
  });
}

async function queueFailedRequest(request, requestId) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(['apiQueue'], 'readwrite');
    const store = transaction.objectStore('apiQueue');
    
    const queueItem = {
      id: requestId,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.clone().text() : null,
      timestamp: Date.now(),
      retries: 0
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => {
        console.log('📋 Request queued for retry:', queueItem.url);
        
        // Register for background sync
        self.registration.sync.register('api-retry').catch(err => {
          console.warn('Background sync registration failed:', err);
        });
        
        resolve(requestId);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to queue request:', error);
    return null;
  }
}

async function getQueuedRequests() {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(['apiQueue'], 'readonly');
    const store = transaction.objectStore('apiQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get queued requests:', error);
    return [];
  }
}

async function removeQueuedRequest(id) {
  try {
    const db = await openQueueDB();
    const transaction = db.transaction(['apiQueue'], 'readwrite');
    const store = transaction.objectStore('apiQueue');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to remove queued request:', error);
  }
}

async function processQueuedAPIRequests() {
  try {
    const queuedRequests = await getQueuedRequests();
    console.log(`🔄 Processing ${queuedRequests.length} queued requests`);
    
    if (queuedRequests.length === 0) {
      return;
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const queueItem of queuedRequests) {
      try {
        // Reconstruct the request
        const requestInit = {
          method: queueItem.method,
          headers: queueItem.headers
        };
        
        if (queueItem.body) {
          requestInit.body = queueItem.body;
        }
        
        const response = await fetch(queueItem.url, requestInit);
        
        if (response.ok) {
          // Success - notify clients and remove from queue
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                data: {
                  requestId: queueItem.id,
                  url: queueItem.url,
                  timestamp: new Date().toISOString()
                }
              });
            });
          });
          
          await removeQueuedRequest(queueItem.id);
          successCount++;
          console.log('✅ Successfully synced:', queueItem.url);
          
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
        
      } catch (error) {
        console.error('Failed to sync request:', queueItem.url, error);
        failureCount++;
        
        // Update retry count
        queueItem.retries = (queueItem.retries || 0) + 1;
        
        // Remove after max retries
        if (queueItem.retries >= 3) {
          await removeQueuedRequest(queueItem.id);
          
          // Notify client of permanent failure
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_FAILED',
                data: {
                  requestId: queueItem.id,
                  url: queueItem.url,
                  error: error.message,
                  maxRetriesReached: true
                }
              });
            });
          });
        }
      }
    }
    
    console.log(`🔄 Sync completed: ${successCount} successful, ${failureCount} failed`);
    
    // Notify clients about sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETED',
          data: {
            successCount,
            failureCount,
            timestamp: new Date().toISOString()
          }
        });
      });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Message handling from main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_UPDATE':
      updateCache(data.urls || []);
      break;
      
    case 'CLEAR_CACHE':
      clearCache();
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    case 'FORCE_SYNC':
      processQueuedAPIRequests();
      break;
  }
});

// Force cache update
async function updateCache(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    console.log('✅ Cache updated with new URLs:', urls.length);
    
    // Notify clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CACHE_UPDATED',
          data: { urls, timestamp: new Date().toISOString() }
        });
      });
    });
  } catch (error) {
    console.error('❌ Failed to update cache:', error);
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

// Get cache status
async function getCacheStatus() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const queuedRequests = await getQueuedRequests();
    
    return {
      cacheVersion: CACHE_NAME,
      cachedFiles: keys.length,
      queuedRequests: queuedRequests.length,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get cache status:', error);
    return {
      error: error.message,
      cacheVersion: CACHE_NAME,
      cachedFiles: 0,
      queuedRequests: 0
    };
  }
}

// Utility functions
function generateRequestId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection in service worker:', event.reason);
  event.preventDefault();
});

// Periodic cleanup of old cache entries
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
    
    // Remove old API cache entries
    for (const request of keys) {
      if (isAPIRequest(request.url)) {
        const response = await cache.match(request);
        const dateHeader = response?.headers.get('date');
        
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (responseDate < oneWeekAgo) {
            await cache.delete(request);
            console.log('🗑️ Removed old cached API response:', request.url);
          }
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

console.log('🎯 Service Worker loaded successfully - SilentStacks v1.2.0');
