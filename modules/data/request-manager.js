// modules/data/request-manager.js
// SilentStacks v2.0 - Request Manager (Simple, Error-Free)

(() => {
  'use strict';

  class RequestManager {
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized = false;
      this.requests = new Map();
      this.errors = [];
      this.storageKey = 'silentstacks_requests';
    }

    async initialize() {
      try {
        this.loadFromStorage();
        this.initialized = true;
        console.log('[RequestManager] Initialized with', this.requests.size, 'requests');
        return { status: 'success', module: 'RequestManager' };
      } catch (error) {
        console.error('[RequestManager] Initialize failed:', error);
        this.errors.push({ message: 'Initialize failed', error: error.message, time: Date.now() });
        throw error;
      }
    }

    // === Storage ===
    loadFromStorage() {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            parsed.forEach(req => {
              if (req && req.id) {
                this.requests.set(req.id, req);
              }
            });
          }
        }
      } catch (error) {
        console.warn('[RequestManager] Storage load failed:', error);
      }
    }

    saveToStorage() {
      try {
        const data = Array.from(this.requests.values());
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn('[RequestManager] Storage save failed:', error);
      }
    }

    // === CRUD ===
    createRequest(data) {
      try {
        const request = {
          id: data.id || this.generateId(),
          title: String(data.title || '').trim(),
          authors: String(data.authors || '').trim(),
          journal: String(data.journal || '').trim(),
          year: String(data.year || '').trim(),
          pmid: String(data.pmid || '').trim(),
          doi: String(data.doi || '').trim(),
          priority: data.priority || 'normal',
          status: data.status || 'pending',
          notes: String(data.notes || '').trim(),
          dateAdded: data.dateAdded || new Date().toISOString(),
          lastModified: new Date().toISOString()
        };

        this.requests.set(request.id, request);
        this.saveToStorage();
        
        console.log('[RequestManager] Created request:', request.id);
        return request;
      } catch (error) {
        console.error('[RequestManager] Create failed:', error);
        this.errors.push({ message: 'Create failed', error: error.message, time: Date.now() });
        throw error;
      }
    }

    updateRequest(id, updates) {
      try {
        const existing = this.requests.get(id);
        if (!existing) {
          throw new Error('Request not found: ' + id);
        }

        const updated = {
          ...existing,
          ...updates,
          lastModified: new Date().toISOString()
        };

        this.requests.set(id, updated);
        this.saveToStorage();
        
        console.log('[RequestManager] Updated request:', id);
        return updated;
      } catch (error) {
        console.error('[RequestManager] Update failed:', error);
        this.errors.push({ message: 'Update failed', error: error.message, time: Date.now() });
        throw error;
      }
    }

    deleteRequest(id) {
      try {
        const deleted = this.requests.delete(id);
        if (deleted) {
          this.saveToStorage();
          console.log('[RequestManager] Deleted request:', id);
        }
        return deleted;
      } catch (error) {
        console.error('[RequestManager] Delete failed:', error);
        this.errors.push({ message: 'Delete failed', error: error.message, time: Date.now() });
        return false;
      }
    }

    // === Queries ===
    getRequest(id) {
      return this.requests.get(id) || null;
    }

    getAllRequests() {
      return Array.from(this.requests.values());
    }

    getFilteredRequests(filters = {}) {
      let results = this.getAllRequests();

      if (filters.search) {
        const query = filters.search.toLowerCase();
        results = results.filter(req => {
          const text = `${req.title} ${req.authors} ${req.journal} ${req.notes}`.toLowerCase();
          return text.includes(query);
        });
      }

      if (filters.status && filters.status !== 'all') {
        results = results.filter(req => req.status === filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        results = results.filter(req => req.priority === filters.priority);
      }

      return results;
    }

    // === Export ===
    exportToJSON() {
      return JSON.stringify(this.getAllRequests(), null, 2);
    }

    exportToCSV() {
      const requests = this.getAllRequests();
      const headers = ['ID', 'Title', 'Authors', 'Journal', 'Year', 'PMID', 'Status'];
      
      const csvRows = [
        headers.join(','),
        ...requests.map(req => [
          req.id,
          `"${req.title.replace(/"/g, '""')}"`,
          `"${req.authors.replace(/"/g, '""')}"`,
          `"${req.journal.replace(/"/g, '""')}"`,
          req.year,
          req.pmid,
          req.status
        ].join(','))
      ];

      return csvRows.join('\n');
    }

    // === Bulk Operations ===
    bulkDelete(ids) {
      const deleted = [];
      ids.forEach(id => {
        if (this.deleteRequest(id)) {
          deleted.push(id);
        }
      });
      return deleted;
    }

    bulkUpdateStatus(ids, status) {
      const updated = [];
      ids.forEach(id => {
        try {
          const result = this.updateRequest(id, { status });
          updated.push(result);
        } catch (error) {
          console.warn('[RequestManager] Bulk update failed for:', id);
        }
      });
      return updated;
    }

    // === Statistics ===
    getStats() {
      const requests = this.getAllRequests();
      const stats = {
        total: requests.length,
        pending: 0,
        completed: 0,
        urgent: 0
      };

      requests.forEach(req => {
        if (req.status === 'pending') stats.pending++;
        if (req.status === 'completed') stats.completed++;
        if (req.priority === 'urgent') stats.urgent++;
      });

      return stats;
    }

    // === Utilities ===
    generateId() {
      return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    // === Health Check ===
    getHealthStatus() {
      return {
        name: 'RequestManager',
        status: this.initialized ? 'healthy' : 'not-initialized',
        requestCount: this.requests.size,
        errors: this.errors.slice(-5),
        lastCheck: new Date().toISOString()
      };
    }
  }

  // === Registration ===
  const requestManager = new RequestManager();

  // Simple registration
  if (typeof window !== 'undefined') {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules = window.SilentStacks.modules || {};
    window.SilentStacks.modules.RequestManager = requestManager;

    // Try bootstrap registration if available
    if (window.SilentStacks.registerModule) {
      try {
        window.SilentStacks.registerModule('RequestManager', requestManager);
      } catch (error) {
        console.warn('[RequestManager] Bootstrap registration failed:', error);
      }
    }

    console.log('[RequestManager] Module loaded and registered');
  }

})();
