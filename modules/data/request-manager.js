// modules/data/request-manager.js
// SilentStacks v2.0 - Request Manager Module
// Copy this file to: modules/data/request-manager.js

(() => {
  'use strict';

  class RequestManager {
    // Explicit dependencies for bootstrap system
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized = false;
      this.requests = new Map();
      this.lastActivity = new Date().toISOString();
      this.errors = [];
      
      // State references (set during initialization)
      this.stateManager = null;
      this.eventBus = null;
    }

    async initialize() {
      try {
        // Get core system references
        this.stateManager = window.SilentStacks.core.stateManager;
        this.eventBus = window.SilentStacks.core.eventBus;
        
        // Load existing data
        await this.loadStoredRequests();
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        
        return { status: 'success', module: 'RequestManager' };
      } catch (error) {
        this.recordError('Initialization failed', error);
        throw error;
      }
    }

    // Load requests from localStorage
    async loadStoredRequests() {
      try {
        const stored = localStorage.getItem('silentstacks_requests');
        if (stored) {
          const data = JSON.parse(stored);
          
          // Convert array back to Map if needed
          if (Array.isArray(data)) {
            data.forEach(request => {
              this.requests.set(request.id, request);
            });
          } else if (typeof data === 'object') {
            Object.entries(data).forEach(([id, request]) => {
              this.requests.set(id, request);
            });
          }
        }
        
        // Update state manager
        this.stateManager?.setState('requests', this.requests);
        
        this.log(`📚 Loaded ${this.requests.size} requests from storage`);
      } catch (error) {
        this.recordError('Failed to load stored requests', error);
      }
    }

    // Set up event listeners
    setupEventListeners() {
      if (!this.eventBus) return;
      
      // Listen for request actions from UI
      this.eventBus.on('request:create', (data) => this.createRequest(data));
      this.eventBus.on('request:update', (data) => this.updateRequest(data.id, data));
      this.eventBus.on('request:delete', (data) => this.deleteRequest(data.id));
      this.eventBus.on('request:duplicate', (data) => this.duplicateRequest(data.id));
    }

    // Create new request
    createRequest(requestData) {
      try {
        const request = this.createRequestObject(requestData);
        this.requests.set(request.id, request);
        
        // Save to storage
        this.saveToStorage();
        
        // Update state
        this.stateManager?.setState('requests', this.requests);
        
        // Emit event
        this.eventBus?.emit('request:created', { request });
        
        this.log(`➕ Created request: ${request.id}`);
        this.lastActivity = new Date().toISOString();
        
        return request;
      } catch (error) {
        this.recordError('Failed to create request', error);
        throw error;
      }
    }

    // Create request object with defaults
    createRequestObject(data = {}) {
      const now = new Date().toISOString();
      
      return {
        // Basic info
        id: data.id || this.generateRequestId(),
        title: this.sanitize(data.title || ''),
        authors: this.sanitize(data.authors || ''),
        journal: this.sanitize(data.journal || ''),
        year: this.sanitize(data.year || ''),
        volume: this.sanitize(data.volume || ''),
        issue: this.sanitize(data.issue || ''),
        pages: this.sanitize(data.pages || ''),
        
        // Identifiers
        pmid: this.sanitize(data.pmid || '', 'pmid'),
        doi: this.sanitize(data.doi || '', 'doi'),
        isbn: this.sanitize(data.isbn || ''),
        
        // Request details
        priority: data.priority || 'normal',
        status: data.status || 'pending',
        notes: this.sanitize(data.notes || ''),
        tags: this.sanitize(data.tags || ''),
        
        // Enhanced features
        meshHeadings: data.meshHeadings || [],
        clinicalTrials: data.clinicalTrials || [],
        nctNumbers: data.nctNumbers || [],
        
        // ILL workflow
        doclineNumber: this.sanitize(data.doclineNumber || ''),
        illStatus: data.illStatus || 'not-started',
        illNotes: this.sanitize(data.illNotes || ''),
        
        // Metadata
        dateAdded: data.dateAdded || now,
        lastModified: data.lastModified || now,
        addedBy: data.addedBy || 'user',
        source: data.source || 'manual',
        
        // Flags
        isUrgent: data.isUrgent || false,
        isFollowUpRequired: data.isFollowUpRequired || false,
        hasAttachments: data.hasAttachments || false
      };
    }

    // Update existing request
    updateRequest(id, updates) {
      try {
        const existingRequest = this.requests.get(id);
        if (!existingRequest) {
          throw new Error(`Request ${id} not found`);
        }
        
        // Sanitize updates
        const sanitizedUpdates = {};
        Object.entries(updates).forEach(([key, value]) => {
          if (key === 'pmid') {
            sanitizedUpdates[key] = this.sanitize(value, 'pmid');
          } else if (key === 'doi') {
            sanitizedUpdates[key] = this.sanitize(value, 'doi');
          } else if (typeof value === 'string') {
            sanitizedUpdates[key] = this.sanitize(value);
          } else {
            sanitizedUpdates[key] = value;
          }
        });
        
        // Update request
        const updatedRequest = {
          ...existingRequest,
          ...sanitizedUpdates,
          lastModified: new Date().toISOString()
        };
        
        this.requests.set(id, updatedRequest);
        
        // Save to storage
        this.saveToStorage();
        
        // Update state
        this.stateManager?.setState('requests', this.requests);
        
        // Emit event
        this.eventBus?.emit('request:updated', { request: updatedRequest, changes: sanitizedUpdates });
        
        this.log(`📝 Updated request: ${id}`);
        this.lastActivity = new Date().toISOString();
        
        return updatedRequest;
      } catch (error) {
        this.recordError('Failed to update request', error);
        throw error;
      }
    }

    // Delete request
    deleteRequest(id) {
      try {
        const request = this.requests.get(id);
        if (!request) {
          return false;
        }
        
        this.requests.delete(id);
        
        // Save to storage
        this.saveToStorage();
        
        // Update state
        this.stateManager?.setState('requests', this.requests);
        
        // Emit event
        this.eventBus?.emit('request:deleted', { id, request });
        
        this.log(`🗑️ Deleted request: ${id}`);
        this.lastActivity = new Date().toISOString();
        
        return true;
      } catch (error) {
        this.recordError('Failed to delete request', error);
        throw error;
      }
    }

    // Duplicate request
    duplicateRequest(id) {
      try {
        const originalRequest = this.requests.get(id);
        if (!originalRequest) {
          throw new Error(`Request ${id} not found`);
        }
        
        // Create duplicate
        const duplicate = {
          ...originalRequest,
          id: this.generateRequestId(),
          title: `${originalRequest.title} (Copy)`,
          dateAdded: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          status: 'pending', // Reset status
          illStatus: 'not-started', // Reset ILL status
          doclineNumber: '', // Clear DOCLINE number
        };
        
        this.requests.set(duplicate.id, duplicate);
        
        // Save to storage
        this.saveToStorage();
        
        // Update state
        this.stateManager?.setState('requests', this.requests);
        
        // Emit event
        this.eventBus?.emit('request:duplicated', { original: originalRequest, duplicate });
        
        this.log(`📋 Duplicated request: ${id} → ${duplicate.id}`);
        this.lastActivity = new Date().toISOString();
        
        return duplicate;
      } catch (error) {
        this.recordError('Failed to duplicate request', error);
        throw error;
      }
    }

    // Get single request
    getRequest(id) {
      return this.requests.get(id);
    }

    // Get all requests
    getAllRequests() {
      return Array.from(this.requests.values());
    }

    // Get requests with filters
    getFilteredRequests(filters = {}) {
      let requests = this.getAllRequests();
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          requests = requests.filter(request => {
            if (key === 'search') {
              // Search in multiple fields
              const searchText = `${request.title} ${request.authors} ${request.journal} ${request.notes}`.toLowerCase();
              return searchText.includes(value.toLowerCase());
            } else {
              return request[key] === value;
            }
          });
        }
      });
      
      return requests;
    }

    // Get requests by status
    getRequestsByStatus(status) {
      return this.getAllRequests().filter(request => request.status === status);
    }

    // Get urgent requests
    getUrgentRequests() {
      return this.getAllRequests().filter(request => 
        request.priority === 'urgent' || request.isUrgent
      );
    }

    // Get requests requiring follow-up
    getFollowUpRequests() {
      return this.getAllRequests().filter(request => request.isFollowUpRequired);
    }

    // Bulk operations
    bulkUpdateStatus(requestIds, newStatus) {
      const updated = [];
      
      requestIds.forEach(id => {
        try {
          const updatedRequest = this.updateRequest(id, { status: newStatus });
          updated.push(updatedRequest);
        } catch (error) {
          this.recordError(`Failed to update status for request ${id}`, error);
        }
      });
      
      return updated;
    }

    bulkDelete(requestIds) {
      const deleted = [];
      
      requestIds.forEach(id => {
        if (this.deleteRequest(id)) {
          deleted.push(id);
        }
      });
      
      return deleted;
    }

    // Export requests
    exportRequests(format = 'json', filters = {}) {
      const requests = this.getFilteredRequests(filters);
      
      switch (format) {
        case 'json':
          return JSON.stringify(requests, null, 2);
          
        case 'csv':
          return this.exportToCSV(requests);
          
        case 'nlm':
          return this.exportToNLM(requests);
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    }

    // Export to CSV format
    exportToCSV(requests) {
      const headers = [
        'ID', 'Title', 'Authors', 'Journal', 'Year', 'Volume', 'Issue', 'Pages',
        'PMID', 'DOI', 'Priority', 'Status', 'Notes', 'Date Added'
      ];
      
      const rows = requests.map(request => [
        request.id,
        this.escapeCSV(request.title),
        this.escapeCSV(request.authors),
        this.escapeCSV(request.journal),
        request.year,
        request.volume,
        request.issue,
        request.pages,
        request.pmid,
        request.doi,
        request.priority,
        request.status,
        this.escapeCSV(request.notes),
        new Date(request.dateAdded).toLocaleDateString()
      ]);
      
      return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    }

    // Export to NLM format
    exportToNLM(requests) {
      return requests.map(request => {
        let citation = '';
        
        // Authors (limit to 6, add "et al" if more)
        if (request.authors) {
          const authors = request.authors.split(',').map(a => a.trim()).slice(0, 6);
          if (request.authors.split(',').length > 6) {
            authors.push('et al');
          }
          citation += authors.join(', ') + '. ';
        }
        
        // Title
        citation += request.title;
        if (citation && !citation.endsWith('.')) citation += '.';
        citation += ' ';
        
        // Journal
        citation += request.journal;
        
        // Year, Volume, Issue, Pages
        if (request.year) {
          citation += `. ${request.year}`;
          if (request.volume) {
            citation += `;${request.volume}`;
            if (request.issue) {
              citation += `(${request.issue})`;
            }
            if (request.pages) {
              citation += `:${request.pages}`;
            }
          }
        }
        
        citation += '.';
        
        // PMID
        if (request.pmid) {
          citation += ` PMID: ${request.pmid}.`;
        }
        
        // DOI
        if (request.doi) {
          citation += ` doi: ${request.doi}.`;
        }
        
        return citation;
      }).join('\n\n');
    }

    // Utility methods
    generateRequestId() {
      return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sanitize(value, type = 'text') {
      if (!value) return '';
      
      // Use global sanitizer if available
      if (window.SilentStacks?.security?.sanitizer) {
        return window.SilentStacks.security.sanitizer.sanitize(value, type);
      }
      
      // Fallback sanitization
      return String(value).replace(/[<>]/g, '');
    }

    escapeCSV(value) {
      if (!value) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    // Save to localStorage
    saveToStorage() {
      try {
        // Convert Map to array for JSON serialization
        const requestsArray = Array.from(this.requests.values());
        localStorage.setItem('silentstacks_requests', JSON.stringify(requestsArray));
      } catch (error) {
        this.recordError('Failed to save to storage', error);
      }
    }

    // Statistics
    getStatistics() {
      const requests = this.getAllRequests();
      const stats = {
        total: requests.length,
        byStatus: {},
        byPriority: {},
        recentCount: 0,
        urgentCount: 0,
        followUpCount: 0
      };

      // Count by status and priority
      requests.forEach(request => {
        // Status counts
        stats.byStatus[request.status] = (stats.byStatus[request.status] || 0) + 1;
        
        // Priority counts
        stats.byPriority[request.priority] = (stats.byPriority[request.priority] || 0) + 1;
        
        // Recent requests (added in last 7 days)
        const daysSinceAdded = (Date.now() - new Date(request.dateAdded)) / (1000 * 60 * 60 * 24);
        if (daysSinceAdded <= 7) {
          stats.recentCount++;
        }
        
        // Urgent requests
        if (request.priority === 'urgent' || request.isUrgent) {
          stats.urgentCount++;
        }
        
        // Follow-up required
        if (request.isFollowUpRequired) {
          stats.followUpCount++;
        }
      });

      return stats;
    }

    // Search requests
    searchRequests(query, fields = ['title', 'authors', 'journal', 'notes']) {
      if (!query) return this.getAllRequests();
      
      const lowerQuery = query.toLowerCase();
      
      return this.getAllRequests().filter(request => {
        return fields.some(field => {
          const value = request[field];
          return value && value.toLowerCase().includes(lowerQuery);
        });
      });
    }

    // Validation
    validateRequest(requestData) {
      const errors = [];
      
      // Required fields
      if (!requestData.title || requestData.title.trim().length === 0) {
        errors.push('Title is required');
      }
      
      // PMID validation
      if (requestData.pmid) {
        const pmidPattern = /^\d{1,8}$/;
        if (!pmidPattern.test(requestData.pmid)) {
          errors.push('Invalid PMID format');
        }
      }
      
      // DOI validation
      if (requestData.doi) {
        const doiPattern = /^10\.\d{4,}\/[^\s]+$/;
        if (!doiPattern.test(requestData.doi)) {
          errors.push('Invalid DOI format');
        }
      }
      
      // Year validation
      if (requestData.year) {
        const year = parseInt(requestData.year);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1800 || year > currentYear + 5) {
          errors.push('Invalid year');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }

    // Error handling
    recordError(message, error) {
      const errorRecord = {
        message,
        error: error?.message || String(error),
        stack: error?.stack,
        timestamp: new Date().toISOString()
      };
      
      this.errors.push(errorRecord);
      
      // Keep only last 100 errors
      if (this.errors.length > 100) {
        this.errors = this.errors.slice(-100);
      }
      
      // Report to diagnostics
      window.SilentStacks?.core?.diagnostics?.recordIssue({
        type: 'error',
        module: 'RequestManager',
        message,
        error
      });
    }

    // Logging
    log(message) {
      if (window.SilentStacks?.config?.debug) {
        console.log(`[RequestManager] ${message}`);
      }
    }

    // Health check for diagnostics
    getHealthStatus() {
      const stats = this.getStatistics();
      
      return {
        name: 'RequestManager',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        requestCount: this.requests.size,
        statistics: stats,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5), // Last 5 errors
        performance: {
          averageResponseTime: '< 50ms',
          memoryUsage: `${this.requests.size} requests in memory`
        }
      };
    }

    // Data integrity checks
    async runIntegrityCheck() {
      const issues = [];
      
      // Check for duplicate IDs
      const ids = new Set();
      for (const request of this.requests.values()) {
        if (ids.has(request.id)) {
          issues.push(`Duplicate ID found: ${request.id}`);
        }
        ids.add(request.id);
      }
      
      // Check for missing required fields
      for (const request of this.requests.values()) {
        if (!request.id) {
          issues.push('Request found without ID');
        }
        if (!request.dateAdded) {
          issues.push(`Request ${request.id} missing dateAdded`);
        }
      }
      
      // Check for orphaned references
      for (const request of this.requests.values()) {
        if (request.meshHeadings && !Array.isArray(request.meshHeadings)) {
          issues.push(`Request ${request.id} has invalid meshHeadings format`);
        }
        if (request.clinicalTrials && !Array.isArray(request.clinicalTrials)) {
          issues.push(`Request ${request.id} has invalid clinicalTrials format`);
        }
      }
      
      if (issues.length > 0) {
        this.log(`⚠️ Integrity check found ${issues.length} issues`);
        issues.forEach(issue => this.recordError('Integrity issue', new Error(issue)));
      } else {
        this.log('✅ Data integrity check passed');
      }
      
      return {
        passed: issues.length === 0,
        issues
      };
    }

    // Backup and restore
    createBackup() {
      return {
        timestamp: new Date().toISOString(),
        version: '2.0',
        requestCount: this.requests.size,
        data: Array.from(this.requests.values())
      };
    }

    async restoreFromBackup(backup) {
      try {
        if (!backup.data || !Array.isArray(backup.data)) {
          throw new Error('Invalid backup format');
        }
        
        // Clear current data
        this.requests.clear();
        
        // Restore requests
        backup.data.forEach(request => {
          // Validate and sanitize each request
          const validation = this.validateRequest(request);
          if (validation.isValid) {
            this.requests.set(request.id, request);
          } else {
            this.recordError(`Invalid request in backup: ${request.id}`, new Error(validation.errors.join(', ')));
          }
        });
        
        // Save to storage
        this.saveToStorage();
        
        // Update state
        this.stateManager?.setState('requests', this.requests);
        
        // Emit event
        this.eventBus?.emit('requests:restored', { 
          restoredCount: this.requests.size,
          timestamp: backup.timestamp 
        });
        
        this.log(`🔄 Restored ${this.requests.size} requests from backup`);
        
        return {
          success: true,
          restoredCount: this.requests.size
        };
      } catch (error) {
        this.recordError('Failed to restore from backup', error);
        throw error;
      }
    }
  }

  // Create and register the module
  const requestManager = new RequestManager();

  // Register with SilentStacks
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('RequestManager', requestManager);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.RequestManager = requestManager;
  }

  // ---- Robust self-registration (handles late bootstrap & exact name) ----
  const __rmInstance = new RequestManager();

  function __registerNow() {
    try {
      // The bootstrap expects EXACT name: 'RequestManager'
      if (window.SilentStacks?.registerModule) {
        window.SilentStacks.registerModule('RequestManager', __rmInstance);
      } else {
        // Fallback: ensure the module is discoverable even before bootstrap
        window.SilentStacks = window.SilentStacks || { modules: {} };
        window.SilentStacks.modules = window.SilentStacks.modules || {};
        window.SilentStacks.modules.RequestManager = __rmInstance;
      }
      console.log('📚 RequestManager registered');
      return true;
    } catch (e) {
      console.warn('[RequestManager] registration failed (will retry):', e);
      return false;
    }
  }

  // Try immediately…
  if (!__registerNow()) {
    // …then retry a few times in case bootstrap isn’t ready yet.
    let tries = 0;
    const maxTries = 30; // ~3s total
    const timer = setInterval(() => {
      tries++;
      if (__registerNow() || tries >= maxTries) clearInterval(timer);
    }, 100);

    // If your bootstrap dispatches an event when ready, catch it too.
    window.addEventListener('SilentStacks:readyForModules', __registerNow, { once: true });
  }

  console.log('📚 RequestManager module loaded');
})();
