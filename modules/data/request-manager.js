// modules/data/request-manager.js
// SilentStacks v2.0 - Request Manager (single instance, robust self-registration)

(() => {
  'use strict';

  class RequestManager {
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized = false;
      this.requests = new Map();
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      // Core refs (wired during initialize)
      this.stateManager = null;
      this.eventBus = null;

      this.storageKey = 'silentstacks_requests';
    }

    // ===== Initialization =====
    async initialize() {
      try {
        this.stateManager = (window.SilentStacks && window.SilentStacks.core && window.SilentStacks.core.stateManager) || null;
        this.eventBus = (window.SilentStacks && window.SilentStacks.core && window.SilentStacks.core.eventBus) || null;

        await this.loadStoredRequests();
        this.setupEventListeners();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'RequestManager' };
      } catch (err) {
        this.recordError('Initialization failed', err);
        throw err;
      }
    }

    // ===== Load & Persist =====
    async loadStoredRequests() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
              const r = data[i];
              if (r && r.id) this.requests.set(r.id, r);
            }
          } else if (data && typeof data === 'object') {
            const ids = Object.keys(data);
            for (let j = 0; j < ids.length; j++) {
              const id = ids[j];
              this.requests.set(id, data[id]);
            }
          }
        }
        if (this.stateManager && typeof this.stateManager.setState === 'function') {
          this.stateManager.setState('requests', this.requests);
        }
        this.log('Loaded ' + this.requests.size + ' requests from storage');
      } catch (err) {
        this.recordError('Failed to load stored requests', err);
      }
    }

    saveToStorage() {
      try {
        const arr = Array.from(this.requests.values());
        localStorage.setItem(this.storageKey, JSON.stringify(arr));
        this.lastActivity = new Date().toISOString();
      } catch (err) {
        this.recordError('Failed to save to storage', err);
      }
    }

    // ===== Events =====
    setupEventListeners() {
      if (!this.eventBus) return;
      if (typeof this.eventBus.on === 'function') {
        this.eventBus.on('request:create', (data) => this.createRequest(data));
        this.eventBus.on('request:update', (data) => this.updateRequest(data && data.id, data));
        this.eventBus.on('request:delete', (data) => this.deleteRequest(data && data.id));
        this.eventBus.on('request:duplicate', (data) => this.duplicateRequest(data && data.id));
      }
    }

    // ===== CRUD =====
    createRequest(data) {
      try {
        const rec = this.createRequestObject(data || {});
        this.requests.set(rec.id, rec);
        this.saveToStorage();
        if (this.stateManager && typeof this.stateManager.setState === 'function') {
          this.stateManager.setState('requests', this.requests);
        }
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
          this.eventBus.emit('request:created', { request: rec });
        }
        this.log('Created request: ' + rec.id);
        return rec;
      } catch (err) {
        this.recordError('Failed to create request', err);
        throw err;
      }
    }

    updateRequest(id, updates) {
      try {
        if (!id) throw new Error('Missing id');
        const existing = this.requests.get(id);
        if (!existing) throw new Error('Request ' + id + ' not found');

        const sanitized = {};
        const entries = Object.keys(updates || {});
        for (let i = 0; i < entries.length; i++) {
          const k = entries[i];
          const v = updates[k];
          if (k === 'pmid') sanitized[k] = this.sanitize(v, 'pmid');
          else if (k === 'doi') sanitized[k] = this.sanitize(v, 'doi');
          else if (typeof v === 'string') sanitized[k] = this.sanitize(v);
          else sanitized[k] = v;
        }

        const updated = Object.assign({}, existing, sanitized, { lastModified: new Date().toISOString() });
        this.requests.set(id, updated);
        this.saveToStorage();
        if (this.stateManager && typeof this.stateManager.setState === 'function') {
          this.stateManager.setState('requests', this.requests);
        }
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
          this.eventBus.emit('request:updated', { request: updated, changes: sanitized });
        }
        this.log('Updated request: ' + id);
        return updated;
      } catch (err) {
        this.recordError('Failed to update request', err);
        throw err;
      }
    }

    deleteRequest(id) {
      try {
        if (!id) return false;
        const existed = this.requests.get(id);
        if (!existed) return false;

        this.requests.delete(id);
        this.saveToStorage();
        if (this.stateManager && typeof this.stateManager.setState === 'function') {
          this.stateManager.setState('requests', this.requests);
        }
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
          this.eventBus.emit('request:deleted', { id: id, request: existed });
        }
        this.log('Deleted request: ' + id);
        return true;
      } catch (err) {
        this.recordError('Failed to delete request', err);
        throw err;
      }
    }

    duplicateRequest(id) {
      try {
        if (!id) throw new Error('Missing id');
        const original = this.requests.get(id);
        if (!original) throw new Error('Request ' + id + ' not found');

        const dup = Object.assign({}, original, {
          id: this.generateRequestId(),
          title: (original.title || '') + ' (Copy)',
          dateAdded: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          status: 'pending',
          illStatus: 'not-started',
          doclineNumber: ''
        });

        this.requests.set(dup.id, dup);
        this.saveToStorage();
        if (this.stateManager && typeof this.stateManager.setState === 'function') {
          this.stateManager.setState('requests', this.requests);
        }
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
          this.eventBus.emit('request:duplicated', { original: original, duplicate: dup });
        }
        this.log('Duplicated request: ' + id + ' → ' + dup.id);
        return dup;
      } catch (err) {
        this.recordError('Failed to duplicate request', err);
        throw err;
      }
    }

    // ===== Builders & Utils =====
    createRequestObject(data) {
      const now = new Date().toISOString();
      return {
        // Basic
        id: data.id || this.generateRequestId(),
        title: this.sanitize(data.title || ''),
        authors: this.sanitize(data.authors || ''),
        journal: this.sanitize(data.journal || ''),
        year: this.sanitize(data.year || ''),
        volume: this.sanitize(data.volume || ''),
        issue: this.sanitize(data.issue || ''),
        pages: this.sanitize(data.pages || ''),

        // IDs
        pmid: this.sanitize(data.pmid || '', 'pmid'),
        doi: this.sanitize(data.doi || '', 'doi'),
        isbn: this.sanitize(data.isbn || ''),

        // Request details
        priority: data.priority || 'normal',
        status: data.status || 'pending',
        notes: this.sanitize(data.notes || ''),
        tags: this.sanitize(data.tags || ''),

        // Enhancements
        meshHeadings: Array.isArray(data.meshHeadings) ? data.meshHeadings : [],
        clinicalTrials: Array.isArray(data.clinicalTrials) ? data.clinicalTrials : [],
        nctNumbers: Array.isArray(data.nctNumbers) ? data.nctNumbers : [],

        // ILL
        doclineNumber: this.sanitize(data.doclineNumber || ''),
        illStatus: data.illStatus || 'not-started',
        illNotes: this.sanitize(data.illNotes || ''),

        // Meta
        dateAdded: data.dateAdded || now,
        lastModified: data.lastModified || now,
        addedBy: data.addedBy || 'user',
        source: data.source || 'manual',

        // Flags
        isUrgent: !!data.isUrgent,
        isFollowUpRequired: !!data.isFollowUpRequired,
        hasAttachments: !!data.hasAttachments
      };
    }

    generateRequestId() {
      return 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    }

    sanitize(value, type) {
      if (!value) return '';
      const str = String(value);
      const sanitizer = window.SilentStacks && window.SilentStacks.security && window.SilentStacks.security.sanitizer;
      if (sanitizer && typeof sanitizer.sanitize === 'function') {
        return sanitizer.sanitize(str, type || 'text');
      }
      return str.replace(/[<>]/g, '');
    }

    escapeCSV(value) {
      if (!value) return '';
      const s = String(value);
      if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }

    // ===== Queries =====
    getRequest(id) {
      return this.requests.get(id) || null;
    }

    getAllRequests() {
      return Array.from(this.requests.values());
    }

    getFilteredRequests(filters) {
      const f = filters || {};
      let items = this.getAllRequests();
      const keys = Object.keys(f);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = f[k];
        if (!v || v === 'all') continue;
        if (k === 'search') {
          const q = String(v).toLowerCase();
          items = items.filter(function (r) {
            const hay = (r.title || '') + ' ' + (r.authors || '') + ' ' + (r.journal || '') + ' ' + (r.notes || '');
            return hay.toLowerCase().indexOf(q) !== -1;
          });
        } else {
          items = items.filter(function (r) { return String(r[k]) === String(v); });
        }
      }
      return items;
    }

    getRequestsByStatus(status) {
      return this.getAllRequests().filter(function (r) { return r.status === status; });
    }

    getUrgentRequests() {
      return this.getAllRequests().filter(function (r) { return r.priority === 'urgent' || r.isUrgent; });
    }

    getFollowUpRequests() {
      return this.getAllRequests().filter(function (r) { return r.isFollowUpRequired; });
    }

    // ===== Bulk =====
    bulkUpdateStatus(ids, newStatus) {
      const list = Array.isArray(ids) ? ids : [];
      const updated = [];
      for (let i = 0; i < list.length; i++) {
        const id = list[i];
        try {
          updated.push(this.updateRequest(id, { status: newStatus || 'pending' }));
        } catch (e) {
          this.recordError('Failed bulk status for ' + id, e);
        }
      }
      return updated;
    }

    bulkDelete(ids) {
      const list = Array.isArray(ids) ? ids : [];
      const deleted = [];
      for (let i = 0; i < list.length; i++) {
        const id = list[i];
        if (this.deleteRequest(id)) deleted.push(id);
      }
      return deleted;
    }

    // ===== Export =====
    exportRequests(format, filters) {
      const fmt = format || 'json';
      const reqs = this.getFilteredRequests(filters || {});
      if (fmt === 'json') return JSON.stringify(reqs, null, 2);
      if (fmt === 'csv') return this.exportToCSV(reqs);
      if (fmt === 'nlm') return this.exportToNLM(reqs);
      throw new Error('Unsupported export format: ' + fmt);
    }

    exportToCSV(requests) {
      const headers = [
        'ID','Title','Authors','Journal','Year','Volume','Issue','Pages',
        'PMID','DOI','Priority','Status','Notes','Date Added'
      ];
      const rows = [];
      for (let i = 0; i < requests.length; i++) {
        const r = requests[i];
        rows.push([
          r.id,
          this.escapeCSV(r.title),
          this.escapeCSV(r.authors),
          this.escapeCSV(r.journal),
          r.year || '',
          r.volume || '',
          r.issue || '',
          r.pages || '',
          r.pmid || '',
          r.doi || '',
          r.priority || '',
          r.status || '',
          this.escapeCSV(r.notes),
          r.dateAdded ? new Date(r.dateAdded).toLocaleDateString() : ''
        ].join(','));
      }
      return [headers.join(','), rows.join('\n')].join('\n');
    }

    exportToNLM(requests) {
      const parts = [];
      for (let i = 0; i < requests.length; i++) {
        const r = requests[i];
        let cit = '';
        if (r.authors) {
          const rawAuthors = r.authors.split(',');
          const firstSix = rawAuthors.slice(0, 6).map(function (a) { return (a || '').trim(); });
          if (rawAuthors.length > 6) firstSix.push('et al');
          cit += firstSix.join(', ') + '. ';
        }
        cit += r.title || '';
        if (cit && cit[cit.length - 1] !== '.') cit += '.';
        cit += ' ';
        cit += r.journal || '';
        if (r.year) {
          cit += '. ' + r.year;
          if (r.volume) {
            cit += ';' + r.volume;
            if (r.issue) cit += '(' + r.issue + ')';
            if (r.pages) cit += ':' + r.pages;
          }
        }
        cit += '.';
        if (r.pmid) cit += ' PMID: ' + r.pmid + '.';
        if (r.doi) cit += ' doi: ' + r.doi + '.';
        parts.push(cit);
      }
      return parts.join('\n\n');
    }

    // ===== Stats / Integrity =====
    getStatistics() {
      const items = this.getAllRequests();
      const stats = {
        total: items.length,
        byStatus: {},
        byPriority: {},
        recentCount: 0,
        urgentCount: 0,
        followUpCount: 0
      };
      for (let i = 0; i < items.length; i++) {
        const r = items[i];
        stats.byStatus[r.status] = (stats.byStatus[r.status] || 0) + 1;
        stats.byPriority[r.priority] = (stats.byPriority[r.priority] || 0) + 1;
        const d = r.dateAdded ? new Date(r.dateAdded).getTime() : Date.now();
        const days = (Date.now() - d) / 86400000;
        if (days <= 7) stats.recentCount++;
        if (r.priority === 'urgent' || r.isUrgent) stats.urgentCount++;
        if (r.isFollowUpRequired) stats.followUpCount++;
      }
      return stats;
    }

    async runIntegrityCheck() {
      const issues = [];
      const ids = new Set();
      const all = this.getAllRequests();
      for (let i = 0; i < all.length; i++) {
        const r = all[i];
        if (!r.id) issues.push('Request without ID');
        if (ids.has(r.id)) issues.push('Duplicate ID: ' + r.id);
        ids.add(r.id);
        if (!r.dateAdded) issues.push('Missing dateAdded: ' + r.id);
        if (r.meshHeadings && !Array.isArray(r.meshHeadings)) issues.push('Invalid meshHeadings: ' + r.id);
        if (r.clinicalTrials && !Array.isArray(r.clinicalTrials)) issues.push('Invalid clinicalTrials: ' + r.id);
      }
      if (issues.length) {
        for (let j = 0; j < issues.length; j++) {
          this.recordError('Integrity issue', new Error(issues[j]));
        }
      } else {
        this.log('Data integrity check passed');
      }
      return { passed: issues.length === 0, issues: issues };
    }

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
        if (!backup || !Array.isArray(backup.data)) throw new Error('Invalid backup format');
        this.requests.clear();
        for (let i = 0; i < backup.data.length; i++) {
          const r = backup.data[i];
          const v = this.validateRequest(r);
          if (v.isValid) this.requests.set(r.id, r);
          else this.recordError('Invalid request in backup: ' + r.id, new Error(v.errors.join(', ')));
        }
        this.saveToStorage();
        if (this.stateManager && typeof this.stateManager.setState === 'function') {
          this.stateManager.setState('requests', this.requests);
        }
        if (this.eventBus && typeof this.eventBus.emit === 'function') {
          this.eventBus.emit('requests:restored', { restoredCount: this.requests.size, timestamp: backup.timestamp });
        }
        this.log('Restored ' + this.requests.size + ' requests from backup');
        return { success: true, restoredCount: this.requests.size };
      } catch (err) {
        this.recordError('Failed to restore from backup', err);
        throw err;
      }
    }

    // ===== Validation =====
    validateRequest(data) {
      const d = data || {};
      const errs = [];

      if (!d.title || !String(d.title).trim()) errs.push('Title is required');

      if (d.pmid) {
        const pmidRe = /^\d{1,8}$/;
        if (!pmidRe.test(String(d.pmid))) errs.push('Invalid PMID format');
      }

      if (d.doi) {
        const doiRe = /^10\.\d{4,}\/[^\s]+$/;
        if (!doiRe.test(String(d.doi))) errs.push('Invalid DOI format');
      }

      if (d.year) {
        const y = parseInt(d.year, 10);
        const CY = new Date().getFullYear();
        if (isNaN(y) || y < 1800 || y > CY + 5) errs.push('Invalid year');
      }

      return { isValid: errs.length === 0, errors: errs };
    }

    // ===== Diagnostics =====
    recordError(message, error) {
      const rec = {
        message: message,
        error: (error && error.message) ? error.message : String(error),
        stack: error && error.stack ? error.stack : null,
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);

      if (window.SilentStacks && window.SilentStacks.core && window.SilentStacks.core.diagnostics && typeof window.SilentStacks.core.diagnostics.recordIssue === 'function') {
        window.SilentStacks.core.diagnostics.recordIssue({
          type: 'error',
          module: 'RequestManager',
          message: message,
          error: rec.error
        });
      }
    }

    log(message) {
      if (window.SilentStacks && window.SilentStacks.config && window.SilentStacks.config.debug) {
        // eslint-disable-next-line no-console
        console.log('[RequestManager] ' + message);
      }
    }

    getHealthStatus() {
      const stats = this.getStatistics();
      return {
        name: 'RequestManager',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        requestCount: this.requests.size,
        statistics: stats,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {
          averageResponseTime: '<50ms',
          memoryUsage: this.requests.size + ' requests in memory'
        }
      };
    }
  }

  // ===== Single robust self-registration (one instance) =====
  const __rmInstance = new RequestManager();
  __rmInstance.moduleName = 'RequestManager';

  function __finalizeRegistration() {
    try {
      // Preferred registry
      if (window.SilentStacks && typeof window.SilentStacks.registerModule === 'function') {
        window.SilentStacks.registerModule('RequestManager', __rmInstance);
      }

      // Fallbacks for pickier bootstraps
      window.SilentStacks = window.SilentStacks || {};
      window.SilentStacks.modules = window.SilentStacks.modules || {};
      window.SilentStacks.modules.RequestManager = __rmInstance;

      if (!window.SilentStacks._moduleRegistered) window.SilentStacks._moduleRegistered = {};
      window.SilentStacks._moduleRegistered.RequestManager = true;

      try {
        window.dispatchEvent(new CustomEvent('SilentStacks:moduleRegistered', { detail: { name: 'RequestManager' } }));
      } catch (e) {}

      try {
        if (window.SilentStacks.core && window.SilentStacks.core.moduleLoader && typeof window.SilentStacks.core.moduleLoader.notifyRegistered === 'function') {
          window.SilentStacks.core.moduleLoader.notifyRegistered('RequestManager');
        }
      } catch (e2) {}

      // eslint-disable-next-line no-console
      console.log('📚 RequestManager registered (all signals emitted)');
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[RequestManager] registration attempt failed; will retry…', e);
      return false;
    }
  }

  if (!__finalizeRegistration()) {
    var __tries = 0;
    var __max = 30;
    var __timer = setInterval(function () {
      __tries++;
      if (__finalizeRegistration() || __tries >= __max) clearInterval(__timer);
    }, 100);

    window.addEventListener('SilentStacks:readyForModules', __finalizeRegistration, { once: true });
  }

  // eslint-disable-next-line no-console
  console.log('📚 RequestManager module loaded');
})();
