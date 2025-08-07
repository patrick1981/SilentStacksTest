// assets/js/data-manager.js
// SilentStacks Enhanced Data Manager v1.5 - COMPLETE FIXED VERSION
// All console errors resolved, proper methods, complete functionality

(() => {
  'use strict';

  // Prevent multiple loading
  if (window.SilentStacks?.modules?.EnhancedDataManager?.initialized) {
    console.log('📊 Enhanced Data Manager already loaded, skipping...');
    return;
  }

  let cleanupInterval;

  const EnhancedDataManager = {
    initialized: false,
    requests: new Map(),
    settings: new Map(),
    globalTags: new Set(),
    eventListeners: new Map(),

    // Initialize data manager
    initialize() {
      if (this.initialized) return;
      
      console.log('🔧 Initializing Enhanced Manager...');
      
      try {
        this.loadSettings();
        this.loadRequests();
        this.loadGlobalTags();
        this.setupEventListeners();
        this.startAutoCleanup();
        this.initialized = true;
        
        console.log('✅ Enhanced Manager initialized successfully');
        
      } catch (error) {
        console.error('❌ Enhanced Manager initialization failed:', error);
      }
    },

    // Load settings from localStorage
    loadSettings() {
      console.log('🔧 Loading settings...');
      
      try {
        const saved = localStorage.getItem('silentstacks_settings');
        if (saved) {
          const settings = JSON.parse(saved);
          Object.entries(settings).forEach(([key, value]) => {
            this.settings.set(key, value);
          });
        }
        
        console.log(`✅ Settings loaded: ${this.settings.size} keys`);
      } catch (error) {
        console.warn('⚠️ Failed to load settings:', error);
      }
    },

    // Load requests from localStorage
    loadRequests() {
      console.log('🔧 Loading requests...');
      
      try {
        const saved = localStorage.getItem('silentstacks_requests');
        if (saved) {
          const requests = JSON.parse(saved);
          requests.forEach(request => {
            this.requests.set(request.id, request);
          });
        }
        
        console.log(`✅ Requests loaded: ${this.requests.size} items`);
      } catch (error) {
        console.warn('⚠️ Failed to load requests:', error);
      }
    },

    // Load global tags
    loadGlobalTags() {
      console.log('🔧 Loading global tags...');
      
      try {
        const saved = localStorage.getItem('silentstacks_global_tags');
        if (saved) {
          const tags = JSON.parse(saved);
          this.globalTags = new Set(tags);
        }
        
        console.log(`✅ Global tags loaded: ${this.globalTags.size} tags`);
      } catch (error) {
        console.warn('⚠️ Failed to load global tags:', error);
      }
    },

    // CRITICAL FIX: Add missing getAllRequests method
    getAllRequests() {
      return Array.from(this.requests.values());
    },

    // CRITICAL FIX: Add missing getFilteredRequests method
    getFilteredRequests(searchTerm = '', filters = {}) {
      const allRequests = this.getAllRequests();
      
      if (!searchTerm && Object.keys(filters).length === 0) {
        return allRequests;
      }
      
      return allRequests.filter(request => {
        // Apply search term filter
        if (searchTerm) {
          const searchText = (
            request.title + ' ' + 
            request.authors + ' ' + 
            request.journal + ' ' + 
            request.pmid + ' ' + 
            (request.notes || '')
          ).toLowerCase();
          
          if (!searchText.includes(searchTerm.toLowerCase())) {
            return false;
          }
        }
        
        // Apply other filters
        for (const [key, value] of Object.entries(filters)) {
          if (value && request[key] !== value) {
            return false;
          }
        }
        
        return true;
      });
    },

    // Get single request
    getRequest(id) {
      return this.requests.get(id);
    },

    // Add new request
    addRequest(requestData) {
      const id = requestData.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      const request = {
        id,
        pmid: requestData.pmid || '',
        docline: requestData.docline || '',
        title: requestData.title || '',
        authors: requestData.authors || '',
        journal: requestData.journal || '',
        year: requestData.year || '',
        volume: requestData.volume || '',
        issue: requestData.issue || '',
        pages: requestData.pages || '',
        doi: requestData.doi || '',
        patronEmail: requestData.patronEmail || '',
        priority: requestData.priority || 'normal',
        status: requestData.status || 'pending',
        tags: requestData.tags || [],
        notes: requestData.notes || '',
        createdAt: requestData.createdAt || timestamp,
        updatedAt: timestamp,
        source: requestData.source || 'manual',
        // Enhanced metadata
        meshHeadings: requestData.meshHeadings || [],
        publicationTypes: requestData.publicationTypes || [],
        abstract: requestData.abstract || '',
        citation: requestData.citation || '',
        clinicalTrials: requestData.clinicalTrials || [],
        nctNumbers: requestData.nctNumbers || [],
        isRandomizedControlledTrial: requestData.isRandomizedControlledTrial || false,
        isClinicalTrial: requestData.isClinicalTrial || false
      };
      
      this.requests.set(id, request);
      this.saveRequests();
      this.updateGlobalTags(request.tags);
      this.triggerEvent('requestAdded', { id, request });
      
      return id;
    },

    // Update existing request
    updateRequest(id, updates) {
      const request = this.requests.get(id);
      if (!request) {
        console.warn(`Request ${id} not found for update`);
        return false;
      }
      
      // Apply updates
      Object.assign(request, updates);
      request.updatedAt = new Date().toISOString();
      
      this.requests.set(id, request);
      this.saveRequests();
      this.updateGlobalTags(request.tags);
      this.triggerEvent('requestUpdated', { id, request, updates });
      
      return true;
    },

    // Delete request
    deleteRequest(id) {
      const request = this.requests.get(id);
      if (!request) {
        return false;
      }
      
      this.requests.delete(id);
      this.saveRequests();
      this.triggerEvent('requestDeleted', { id, request });
      
      return true;
    },

    // Delete multiple requests
    deleteRequests(ids) {
      const deleted = [];
      
      ids.forEach(id => {
        const request = this.requests.get(id);
        if (request) {
          this.requests.delete(id);
          deleted.push({ id, request });
        }
      });
      
      if (deleted.length > 0) {
        this.saveRequests();
        this.triggerEvent('requestsDeleted', { deleted });
      }
      
      return deleted.length;
    },

    // Get selected requests for bulk operations
    getSelectedRequests(selectedIds) {
      if (!selectedIds || selectedIds.length === 0) {
        return [];
      }
      
      return selectedIds.map(id => this.getRequest(id)).filter(Boolean);
    },
    // CRITICAL FIX: Add missing getSettings method
getSettings(key) {
    if (key) {
        return this.settings.get(key);
    }
    return Object.fromEntries(this.settings);
},

// CRITICAL FIX: Add missing setSetting method  
setSetting(key, value) {
    this.settings.set(key, value);
    this.saveSettings();
    this.triggerEvent('settingChanged', { key, value });
},
    

    // Save requests to localStorage
    saveRequests() {
      try {
        const requestsArray = Array.from(this.requests.values());
        localStorage.setItem('silentstacks_requests', JSON.stringify(requestsArray));
      } catch (error) {
        console.error('Failed to save requests:', error);
      }
    },

    // Save settings to localStorage
    saveSettings() {
      try {
        const settingsObj = Object.fromEntries(this.settings);
        localStorage.setItem('silentstacks_settings', JSON.stringify(settingsObj));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    },

    // Update global tags
    updateGlobalTags(tags) {
      if (Array.isArray(tags)) {
        tags.forEach(tag => this.globalTags.add(tag));
        this.saveGlobalTags();
      }
    },

    // Save global tags
    saveGlobalTags() {
      try {
        const tagsArray = Array.from(this.globalTags);
        localStorage.setItem('silentstacks_global_tags', JSON.stringify(tagsArray));
      } catch (error) {
        console.error('Failed to save global tags:', error);
      }
    },

    // Get statistics
    getStats() {
      const requests = this.getAllRequests();
      const statusCounts = {};
      const priorityCounts = {};
      
      requests.forEach(request => {
        statusCounts[request.status] = (statusCounts[request.status] || 0) + 1;
        priorityCounts[request.priority] = (priorityCounts[request.priority] || 0) + 1;
      });
      
      return {
        total: requests.length,
        statusCounts,
        priorityCounts,
        recentCount: requests.filter(r => {
          const created = new Date(r.createdAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return created > weekAgo;
        }).length
      };
    },

    // Setup event listeners
    setupEventListeners() {
      // This can be extended for custom event handling
    },

    // Event system
    addEventListener(event, callback) {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(callback);
    },

    removeEventListener(event, callback) {
      if (this.eventListeners.has(event)) {
        const listeners = this.eventListeners.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    },

    triggerEvent(event, data) {
      if (this.eventListeners.has(event)) {
        this.eventListeners.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Event listener error for ${event}:`, error);
          }
        });
      }
    },

    // Auto cleanup
    startAutoCleanup() {
      cleanupInterval = setInterval(() => {
        this.performMemoryCleanup();
      }, 60000); // Every 60 seconds
      
      console.log('🔄 Auto-cleanup started (every 60 seconds)');
    },

    performMemoryCleanup() {
      console.log('🧹 Starting memory cleanup...');
      
      try {
        // Clear any temporary data
        // Trigger garbage collection hints
        if (window.gc) {
          window.gc();
        }
        
        // Re-initialize search if needed
        if (window.SilentStacks?.modules?.SearchFilter) {
          const searchFilter = window.SilentStacks.modules.SearchFilter;
          if (searchFilter.initFuse && typeof searchFilter.initFuse === 'function') {
            try {
              searchFilter.initFuse();
            } catch (fuseError) {
              console.warn('Search filter cleanup warning:', fuseError);
            }
          }
        }
        
      } catch (error) {
        console.warn('Memory cleanup warning:', error);
      }
    },

    // Export data
    exportData(format = 'json') {
      const data = {
        requests: this.getAllRequests(),
        settings: Object.fromEntries(this.settings),
        globalTags: Array.from(this.globalTags),
        exported: new Date().toISOString()
      };
      
      if (format === 'csv') {
        return this.exportToCSV(data.requests);
      }
      
      return data;
    },

    // Export to CSV
    exportToCSV(requests) {
      const headers = ['ID', 'PMID', 'DOCLINE', 'Title', 'Authors', 'Journal', 'Year', 'Status', 'Priority', 'Created', 'Notes'];
      const rows = [headers.join(',')];
      
      requests.forEach(request => {
        const row = [
          request.id,
          request.pmid,
          request.docline,
          `"${(request.title || '').replace(/"/g, '""')}"`,
          `"${(request.authors || '').replace(/"/g, '""')}"`,
          `"${(request.journal || '').replace(/"/g, '""')}"`,
          request.year,
          request.status,
          request.priority,
          request.createdAt,
          `"${(request.notes || '').replace(/"/g, '""')}"`
        ];
        rows.push(row.join(','));
      });
      
      return rows.join('\n');
    },

    // Import data
    importData(data) {
      try {
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        
        if (data.requests && Array.isArray(data.requests)) {
          data.requests.forEach(request => {
            this.addRequest(request);
          });
        }
        
        if (data.settings) {
          Object.entries(data.settings).forEach(([key, value]) => {
            this.settings.set(key, value);
          });
          this.saveSettings();
        }
        
        if (data.globalTags) {
          data.globalTags.forEach(tag => this.globalTags.add(tag));
          this.saveGlobalTags();
        }
        
        return true;
      } catch (error) {
        console.error('Import failed:', error);
        return false;
      }
    }
  };

  // Register with SilentStacks
  window.SilentStacks = window.SilentStacks || { modules: {}, state: {} };
  window.SilentStacks.modules.EnhancedDataManager = EnhancedDataManager;
  window.SilentStacks.modules.DataManager = EnhancedDataManager; // Compatibility alias

  console.log('✅ DataManager registered with SilentStacks modules');

})();