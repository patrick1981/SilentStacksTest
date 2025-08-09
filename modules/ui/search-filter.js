// modules/ui/search-filter.js
(() => {
  'use strict';

  class SearchFilter {
    static dependencies = ['RequestManager'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;
      this.rm = null;

      this.debounceMs = 300;
      this.query = '';
      this.filters = { status: 'all', priority: 'all', tags: [] };
      this.sort = { field: 'updatedAt', dir: 'desc' };
      this.page = 1; this.pageSize = 20;
      this.history = [];

      this._timer = null;
      this._fuse = null;
      this._fuseIndexFor = 0;
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.rm = window.SilentStacks?.modules?.RequestManager ?? null;

        await this.setupModule();
        this.initialized = true; this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'SearchFilter' };
      } catch (e) { this.recordError('Initialization failed', e); throw e; }
    }

    async setupModule() {
      this._buildFuseIndex();
      this.eventBus?.on?.('request:changed', () => this._maybeReindex());
      this.eventBus?.on?.('request:created', () => this._maybeReindex());
      this.eventBus?.on?.('request:deleted', () => this._maybeReindex());

      document.getElementById('search-input')?.addEventListener('input', (e) => {
        this.performSearch((e.target.value || '').trim(), true);
      });
      document.getElementById('clear-search')?.addEventListener('click', () => {
        this.clearSearch(); this.performSearch('', true);
      });
      document.getElementById('filter-status')?.addEventListener('change', (e) => {
        this.applyFilters({ status: e.target.value }); this.performSearch(this.query, true);
      });
      document.getElementById('filter-priority')?.addEventListener('change', (e) => {
        this.applyFilters({ priority: e.target.value }); this.performSearch(this.query, true);
      });

      const savedSort = this.stateManager?.getState?.('search:sort');
      if (savedSort?.field) this.sort = savedSort;

      this.performSearch('', true);
    }

    // ===== Public API =====
    performSearch(query, shouldRender = true) {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this._doSearch(query, shouldRender), this.debounceMs);
    }
    applyFilters(filters) { this.filters = { ...this.filters, ...(filters || {}) }; }
    setSortField(field, direction) {
      this.sort = { field, dir: direction === 'asc' ? 'asc' : 'desc' };
      this.stateManager?.setState?.('search:sort', this.sort);
      this.performSearch(this.query, true);
    }
    paginate(page, pageSize) {
      this.page = Math.max(1, page || 1);
      this.pageSize = Math.max(5, pageSize || this.pageSize);
      this.performSearch(this.query, true);
    }
    getSearchHistory() { return this.history.slice(-20); }
    clearSearch() { this.query = ''; const el = document.getElementById('search-input'); if (el) el.value = ''; }

    // Exposed helper for other modules
    getFilteredRequests() {
      const all = this.rm.getAllRequests?.() || [];
      return this._filterAndSort(all);
    }

    // ===== Internals =====
    _doSearch(query, shouldRender) {
      this.query = (query || '').trim();
      const all = this.rm.getAllRequests?.() || [];
      let results = this._filterAndSort(all);

      if (this.query) {
        this._buildFuseIndex();
        results = this._fuse.search(this.query).map(r => r.item);
        results = this._filterAndSort(results, false);
        this.history.push(this.query);
      }

      const total = results.length;
      const start = (this.page - 1) * this.pageSize;
      const pageItems = results.slice(start, start + this.pageSize);

      this.eventBus?.emit?.('search:results', { items: pageItems, total, page: this.page, pageSize: this.pageSize });
      const countEl = document.getElementById('results-count'); if (countEl) countEl.textContent = `${total} requests`;

      this.lastActivity = new Date().toISOString();
      if (shouldRender) this.eventBus?.emit?.('ui:render:requests', { items: pageItems, total });
    }

    _filterAndSort(items, applyFilters = true) {
      let results = items;
      if (applyFilters) {
        if (this.filters.status !== 'all') results = results.filter(r => (r.status || 'pending') === this.filters.status);
        if (this.filters.priority !== 'all') results = results.filter(r => (r.priority || 'normal') === this.filters.priority);
        if (Array.isArray(this.filters.tags) && this.filters.tags.length) {
          const set = new Set(this.filters.tags.map(t => String(t).toLowerCase()));
          results = results.filter(r => String(r.tags || '').toLowerCase().split(',').map(s => s.trim()).some(t => set.has(t)));
        }
      }
      const { field, dir } = this.sort;
      const cmp = (a, b) => {
        const av = (a?.[field] ?? '').toString().toLowerCase();
        const bv = (b?.[field] ?? '').toString().toLowerCase();
        if (av < bv) return dir === 'asc' ? -1 : 1;
        if (av > bv) return dir === 'asc' ? 1 : -1;
        return 0;
      };
      results.sort(cmp);
      return results;
    }

    _buildFuseIndex() {
      const data = this.rm.getAllRequests?.() || [];
      this._fuse = new Fuse(data, {
        includeScore: false,
        threshold: 0.33,
        keys: [
          { name: 'title', weight: 0.5 },
          { name: 'authors', weight: 0.3 },
          { name: 'journal', weight: 0.2 },
          'pmid', 'doi', 'tags', 'notes'
        ]
      });
      this._fuseIndexFor = Date.now();
    }

    _maybeReindex() {
      if (Date.now() - this._fuseIndexFor > 1000) this._buildFuseIndex();
    }

    // Boilerplate
    getHealthStatus() {
      return { name: 'SearchFilter', status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized, lastActivity: this.lastActivity, errors: this.errors.slice(-5), performance: {} };
    }
    recordError(message, error) {
      const rec = { message, error: error?.message || String(error), timestamp: new Date().toISOString() };
      this.errors.push(rec); if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'SearchFilter', message, error: rec.error });
    }
    log(m){ if (window.SilentStacks?.config?.debug) console.log(`[SearchFilter] ${m}`); }
  }

  const moduleInstance = new SearchFilter();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('SearchFilter', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.SearchFilter = moduleInstance; }
  console.log('📦 SearchFilter loaded');
})();