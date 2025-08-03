// Complete offline-manager.js - Offline Detection and Queue Management

(() => {
  'use strict';

  // Offline Management Configuration
  const OFFLINE_CONFIG = {
    PING_INTERVAL: 30000,
    RETRY_DELAY: 5000,
    MAX_RETRIES: 3,
    QUEUE_STORAGE_KEY: 'silentstacks_offline_queue',
    PLACEHOLDER_DATA_KEY: 'silentstacks_placeholder_data'
  };

  // State Management
  let isOnline = navigator.onLine;
  let connectionCheckInterval = null;
  let apiQueue = [];
  let retryAttempts = new Map();

  // Placeholder data for offline mode
  const PLACEHOLDER_DATA = {
    pubmed: {
      sample_articles: [
        {
          pmid: "00000001",
          title: "Sample PubMed Article - Offline Mode",
          authors: "Sample Author; Another Author",
          journal: "Journal of Offline Research",
          year: "2024",
          abstract: "This is placeholder data displayed when offline. Real data will be fetched when connection returns."
        }
      ]
    },
    crossref: {
      sample_dois: [
        {
          doi: "10.1000/sample",
          title: "Sample CrossRef Article - Offline Mode", 
          authors: "Sample Researcher",
          journal: "Offline Studies Quarterly",
          year: "2024"
        }
      ]
    }
  };

  // Initialize Offline Manager
  function initializeOfflineManager() {
    console.log('🌐 Initializing Offline Manager...');
    
    setupConnectionMonitoring();
    loadQueuedRequests();
    registerServiceWorker();
    updateConnectionStatus();
    
    console.log('✅ Offline Manager initialized');
  }

  // Connection Monitoring
  function setupConnectionMonitoring() {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    startConnectionChecking();
    
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !isOnline) {
        checkConnection();
      }
    });
  }

  function startConnectionChecking() {
    if (connectionCheckInterval) return;
    
    connectionCheckInterval = setInterval(() => {
      if (!isOnline) {
        checkConnection();
      }
    }, OFFLINE_CONFIG.PING_INTERVAL);
  }

  function stopConnectionChecking() {
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
      connectionCheckInterval = null;
    }
  }

  // Connection Status Handlers
  function handleOnline() {
    console.log('🌐 Connection restored');
    isOnline = true;
    updateConnectionStatus();
    processQueuedRequests();
  }

  function handleOffline() {
    console.log('📴 Connection lost');
    isOnline = false;
    updateConnectionStatus();
  }

  // Active Connection Testing
  async function checkConnection() {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!isOnline) {
        handleOnline();
      }
      
      return true;
    } catch (error) {
      if (isOnline) {
        handleOffline();
      }
      return false;
    }
  }

  // Connection Status UI Updates
  function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;

    if (isOnline) {
      statusElement.textContent = 'Online';
      statusElement.className = 'connection-indicator online connection-clean';
      statusElement.title = 'Connected to internet';
    } else {
      statusElement.textContent = 'Offline';
      statusElement.className = 'connection-indicator offline';
      statusElement.title = 'No internet connection - some features limited';
    }

    document.documentElement.setAttribute('data-connection', isOnline ? 'online' : 'offline');
  }

  // API Request Queue Management
  function queueAPIRequest(url, options = {}) {
    const queueItem = {
      id: generateRequestId(),
      url,
      options,
      timestamp: Date.now(),
      retries: 0
    };
    
    apiQueue.push(queueItem);
    saveQueuedRequests();
    
    console.log('📋 API request queued:', url);
    
    showOfflineNotification(
      `Request queued for when connection returns: ${getAPIDescription(url)}`,
      'info',
      5000
    );
    
    return queueItem.id;
  }

  function processQueuedRequests() {
    if (apiQueue.length === 0) return;
    
    console.log('🔄 Processing', apiQueue.length, 'queued requests...');
    
    showOfflineNotification(
      `Processing ${apiQueue.length} queued requests...`,
      'info',
      3000
    );
    
    const processPromises = apiQueue.map(processQueuedRequest);
    
    Promise.allSettled(processPromises).then(results => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (successful > 0) {
        showOfflineNotification(
          `✅ ${successful} requests processed successfully`,
          'success',
          5000
        );
      }
      
      if (failed > 0) {
        console.warn(`⚠️ ${failed} requests failed to process`);
      }
      
      apiQueue = apiQueue.filter(item => retryAttempts.get(item.id) < OFFLINE_CONFIG.MAX_RETRIES);
      saveQueuedRequests();
    });
  }

  async function processQueuedRequest(queueItem) {
    try {
      console.log('📤 Processing queued request:', queueItem.url);
      
      const response = await fetch(queueItem.url, queueItem.options);
      
      if (response.ok) {
        notifyApp('QUEUED_REQUEST_SUCCESS', {
          id: queueItem.id,
          url: queueItem.url,
          response: await response.clone().json()
        });
        
        retryAttempts.delete(queueItem.id);
        return response;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.error('Failed to process queued request:', queueItem.url, error);
      
      const attempts = (retryAttempts.get(queueItem.id) || 0) + 1;
      retryAttempts.set(queueItem.id, attempts);
      
      if (attempts >= OFFLINE_CONFIG.MAX_RETRIES) {
        console.warn('Max retries reached for request:', queueItem.url);
        notifyApp('QUEUED_REQUEST_FAILED', {
          id: queueItem.id,
          url: queueItem.url,
          error: error.message
        });
      }
      
      throw error;
    }
  }

  // Placeholder Data Management
  function getPlaceholderData(apiType, query) {
    const placeholders = PLACEHOLDER_DATA[apiType];
    if (!placeholders) return null;
    
    const sampleData = placeholders[Object.keys(placeholders)[0]];
    return {
      ...sampleData[0],
      _isPlaceholder: true,
      _originalQuery: query,
      _message: "This is placeholder data. Real results will load when connection returns."
    };
  }

  // Enhanced API Wrapper with Offline Support
  async function enhancedFetch(url, options = {}) {
    if (!isOnline) {
      const queueId = queueAPIRequest(url, options);
      
      const apiType = detectAPIType(url);
      const placeholder = getPlaceholderData(apiType, url);
      
      if (placeholder) {
        return {
          ok: true,
          json: () => Promise.resolve(placeholder),
          _isOffline: true,
          _queueId: queueId
        };
      }
      
      throw new Error('OFFLINE_MODE');
    }
    
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
        handleOffline();
        
        const queueId = queueAPIRequest(url, options);
        
        const apiType = detectAPIType(url);
        const placeholder = getPlaceholderData(apiType, url);
        
        if (placeholder) {
          return {
            ok: true,
            json: () => Promise.resolve(placeholder),
            _isOffline: true,
            _queueId: queueId
          };
        }
      }
      
      throw error;
    }
  }

  // Storage Management
  function saveQueuedRequests() {
    try {
      localStorage.setItem(OFFLINE_CONFIG.QUEUE_STORAGE_KEY, JSON.stringify(apiQueue));
    } catch (error) {
      console.error('Failed to save queued requests:', error);
    }
  }

  function loadQueuedRequests() {
    try {
      const saved = localStorage.getItem(OFFLINE_CONFIG.QUEUE_STORAGE_KEY);
      if (saved) {
        apiQueue = JSON.parse(saved);
        console.log('📋 Loaded', apiQueue.length, 'queued requests');
      }
    } catch (error) {
      console.error('Failed to load queued requests:', error);
      apiQueue = [];
    }
  }

  function clearQueuedRequests() {
    apiQueue = [];
    retryAttempts.clear();
    saveQueuedRequests();
    localStorage.removeItem(OFFLINE_CONFIG.QUEUE_STORAGE_KEY);
    console.log('🗑️ Cleared all queued requests');
  }

  // Service Worker Registration
  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js');
        console.log('✅ Service Worker registered:', registration.scope);
        
        navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showOfflineNotification(
                'App update available. Refresh to apply.',
                'info',
                10000
              );
            }
          });
        });
        
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
         console.log(e instanceof TypeError); // true
  console.log(error.message); // "null has no properties"
  console.log(error.name); // "TypeError"
  console.log(error.stack); // Stack of the error
      }
    }
  }

  function handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SYNC_SUCCESS':
        console.log('🔄 Background sync successful:', data.request);
        notifyApp('BACKGROUND_SYNC_SUCCESS', data);
        break;
        
      case 'CACHE_UPDATED':
        console.log('📦 Cache updated');
        break;
        
      case 'SW_ACTIVATED':
        console.log('🚀 Service Worker activated:', data.version);
        break;
        
      case 'SYNC_COMPLETED':
        console.log('✅ Background sync completed:', data);
        if (data.successCount > 0) {
          showOfflineNotification(
            `Background sync completed: ${data.successCount} requests processed`,
            'success',
            5000
          );
        }
        break;
    }
  }

  // App Communication
  function notifyApp(type, data) {
    const event = new CustomEvent('offlineManager', {
      detail: { type, data }
    });
    document.dispatchEvent(event);
  }

  // User Notifications
  function showOfflineNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `offline-notification offline-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      z-index: 10001;
      padding: 12px 16px;
      background: ${getNotificationColor(type)};
      color: white;
      border-radius: 6px;
      font-size: 0.85rem;
      max-width: 320px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      border-left: 4px solid rgba(255,255,255,0.3);
    `;
    
    const icon = getNotificationIcon(type);
    notification.innerHTML = `<span style="margin-right: 8px;">${icon}</span>${message}`;
    
    document.body.appendChild(notification);

    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  function getNotificationColor(type) {
    const colors = {
      success: '#28a745',
      error: '#dc3545', 
      warning: '#ffc107',
      info: '#17a2b8'
    };
    return colors[type] || colors.info;
  }

  function getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  // Utility Functions
  function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function detectAPIType(url) {
    if (url.includes('eutils.ncbi.nlm.nih.gov')) return 'pubmed';
    if (url.includes('api.crossref.org')) return 'crossref';
    return 'unknown';
  }

  function getAPIDescription(url) {
    const type = detectAPIType(url);
    switch (type) {
      case 'pubmed': return 'PubMed lookup';
      case 'crossref': return 'CrossRef lookup';
      default: return 'API request';
    }
  }

  // Enhanced API Methods for App Integration
  const OfflineManager = {
    // Initialization
    initialize: initializeOfflineManager,
    
    // Connection Status
    isOnline: () => isOnline,
    checkConnection,
    
    // Enhanced Fetch with Offline Support
    fetch: enhancedFetch,
    
    // Queue Management
    queueRequest: queueAPIRequest,
    processQueue: processQueuedRequests,
    clearQueue: clearQueuedRequests,
    getQueueSize: () => apiQueue.length,
    getQueuedRequests: () => [...apiQueue],
    
    // Placeholder Data
    getPlaceholderData,
    
    // Utility
    showNotification: showOfflineNotification,
    
    // Configuration
    config: OFFLINE_CONFIG,
    
    // Advanced Methods
    forceSync: () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'FORCE_SYNC' });
      }
      processQueuedRequests();
    },
    
    getCacheStatus: () => {
      return new Promise((resolve) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_CACHE_STATUS' },
            [channel.port2]
          );
        } else {
          resolve({
            error: 'Service Worker not available',
            cacheVersion: 'unknown',
            cachedFiles: 0,
            queuedRequests: apiQueue.length
          });
        }
      });
    },
    
    updateCache: (urls) => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_UPDATE',
          data: { urls }
        });
      }
    },
    
    clearCache: () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOfflineManager);
  } else {
    initializeOfflineManager();
  }

  // Export for global access
  window.OfflineManager = OfflineManager;

})();
