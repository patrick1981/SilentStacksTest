// service-worker.js - Place in root directory

const CACHE_NAME = 'silentstacks-v1.2.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline operation
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/fonts/reddit-sans/reddit-sans.css',
  '/assets/fonts/reddit-sans/RedditSans-Regular.woff2',
  '/assets/fonts/reddit-sans/RedditSans-Medium.woff2',
  '/assets/fonts/reddit-sans/RedditSans-SemiBold.woff2',
  '/assets/fonts/reddit-sans/RedditSans-Bold.woff2',
  '/assets/js/silentstacks.js',
  '/assets/js/enhanced-data-manager.js',
  '/assets/js/fuse.min.js',
  '/assets/js/papaparse.min.js',
  '/offline.html'
];

// API endpoints to handle offline
const API_CACHE_URLS = [
  'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
  'https://api.crossref.org/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Handle API requests
  if (isAPIRequest(request.url)) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Handle static assets
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
  }
});

// Check if request is to an API endpoint
function isAPIRequest(url) {
  return API_CACHE_URLS.some(apiUrl => url.includes(apiUrl));
}

// Handle API requests with offline fallback
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    console.log('🌐 API request failed, checking cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Serving cached API response');
      return cachedResponse;
    }
    
    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request requires an internet connection',
        cached: false
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static file requests
async function handleStaticRequest(request) {
  try {
    // Try network first for HTML documents
    if (request.destination === 'document') {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        return networkResponse;
      }
    }
    
    // For other assets, try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network as fallback
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response for future use
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // Serve offline page for HTML requests
    if (request.destination === 'document') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Return 404 for other failed requests
    return new Response('Not found', { status: 404 });
  }
}

// Background sync for queued API requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-api') {
    console.log('🔄 Background sync triggered for API requests');
    event.waitUntil(processQueuedAPIRequests());
  }
});

// Process queued requests when back online
async function processQueuedAPIRequests() {
  try {
    // Get queued requests from IndexedDB or localStorage
    const queuedRequests = await getQueuedRequests();
    
    for (const request of queuedRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          // Notify the main app about successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                data: { request: request.url, response: response }
              });
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync request:', request.url, error);
      }
    }
    
    // Clear processed requests
    await clearQueuedRequests();
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for queue management
async function getQueuedRequests() {
  // Implement with IndexedDB or return from main app
  return [];
}

async function clearQueuedRequests() {
  // Implement queue clearing logic
}

// Message handling from main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'QUEUE_API_REQUEST':
      // Queue failed API request for later retry
      console.log('📋 Queueing API request for retry:', data.url);
      break;
      
    case 'CACHE_UPDATE':
      // Force cache update
      updateCache(data.urls);
      break;
      
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Force cache update
async function updateCache(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    console.log('✅ Cache updated with new URLs');
  } catch (error) {
    console.error('❌ Failed to update cache:', error);
  }
}
