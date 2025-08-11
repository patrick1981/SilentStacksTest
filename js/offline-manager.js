// Offline Manager for SilentStacks
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.apiQueue = JSON.parse(localStorage.getItem('silentstacks_api_queue') || '[]');
    this.connectionIndicator = this.createConnectionIndicator();
    
    this.bindEvents();
    this.updateConnectionStatus();
    this.processQueue();
  }

  createConnectionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connection-status';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(indicator);
    return indicator;
  }

  bindEvents() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateConnectionStatus();
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateConnectionStatus();
    });
  }

  updateConnectionStatus() {
    const themes = document.documentElement.getAttribute('data-theme');
    
    if (this.isOnline) {
      this.connectionIndicator.textContent = '🌐 Online';
this.connectionIndicator.style.background = 'transparent';
this.connectionIndicator.style.color = '#666666';
this.connectionIndicator.style.fontWeight = '400';
this.connectionIndicator.style.fontSize = '0.7rem';
this.connectionIndicator.style.opacity = '0.7';
this.connectionIndicator.style.boxShadow = 'none';
this.connectionIndicator.style.border = 'none';
this.connectionIndicator.style.padding = '4px 8px';

    } else {
      this.connectionIndicator.textContent = '📴 Offline';
this.connectionIndicator.style.background = '#ff4444';
this.connectionIndicator.style.color = 'white';
this.connectionIndicator.style.opacity = '1';
this.connectionIndicator.style.fontWeight = '600';

    }

    // Queue indicator
    if (this.apiQueue.length > 0) {
      this.connectionIndicator.textContent += ` (${this.apiQueue.length} queued)`;
    }
  }

  queueApiCall(type, identifier, callback) {
    if (this.isOnline) {
      // If online, execute immediately
      this.executeApiCall(type, identifier, callback);
      return;
    }

    // If offline, queue for later
    const queueItem = {
      id: Date.now(),
      type: type, // 'pmid' or 'doi'
      identifier: identifier,
      timestamp: new Date().toISOString(),
      callback: callback.toString() // Store function as string
    };

    this.apiQueue.push(queueItem);
    localStorage.setItem('silentstacks_api_queue', JSON.stringify(this.apiQueue));
    this.updateConnectionStatus();

    // Show offline placeholder data
    this.showOfflinePlaceholder(type, identifier);
  }

  async executeApiCall(type, identifier, callback) {
    try {
      let result;
      if (type === 'pmid') {
        result = await window.fetchPubMed(identifier);
      } else if (type === 'doi') {
        result = await window.fetchCrossRef(identifier);
      }
      
      if (typeof callback === 'function') {
        callback(null, result);
      }
    } catch (error) {
      if (typeof callback === 'function') {
        callback(error, null);
      }
    }
  }

  async processQueue() {
    if (!this.isOnline || this.apiQueue.length === 0) return;

    const processedIds = [];
    
    for (const item of this.apiQueue) {
      try {
        await this.executeApiCall(item.type, item.identifier, null);
        processedIds.push(item.id);
        
        // Show success notification
        this.showNotification(`✅ Processed queued ${item.type.toUpperCase()}: ${item.identifier}`);
        
        // Small delay between requests to be polite
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`Failed to process queued ${item.type}:`, error);
      }
    }

    // Remove processed items
    this.apiQueue = this.apiQueue.filter(item => !processedIds.includes(item.id));
    localStorage.setItem('silentstacks_api_queue', JSON.stringify(this.apiQueue));
    this.updateConnectionStatus();
  }

  showOfflinePlaceholder(type, identifier) {
    const placeholderData = {
      pmid: {
        pmid: identifier,
        title: `[QUEUED] Article ${identifier} - Will lookup when online`,
        authors: 'Authors will be retrieved when online',
        journal: 'Journal information pending',
        year: 'Year pending',
        doi: 'DOI pending'
      },
      doi: {
        doi: identifier,
        title: `[QUEUED] Article with DOI ${identifier} - Will lookup when online`,
        authors: 'Authors will be retrieved when online',
        journal: 'Journal information pending',
        year: 'Year pending',
        pmid: 'PMID pending'
      }
    };

    if (window.populateForm && placeholderData[type]) {
      window.populateForm(placeholderData[type]);
    }

    this.showNotification(`📴 Offline: ${type.toUpperCase()} lookup queued for when connection returns`);
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      z-index: 10001;
      padding: 12px 16px;
      background: ${type === 'error' ? '#dc3545' : '#17a2b8'};
      color: white;
      border-radius: 8px;
      font-size: 0.9rem;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // API for disabling online features would reduce functionality
  // Better to queue and show offline status
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      queuedRequests: this.apiQueue.length,
      lastOnline: this.isOnline ? new Date() : localStorage.getItem('silentstacks_last_online')
    };
  }
}

// Initialize offline manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.offlineManager = new OfflineManager();
  });
} else {
  window.offlineManager = new OfflineManager();
}
