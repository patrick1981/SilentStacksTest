// modules/integrations/mesh-integration.js
(() => {
  'use strict';

  /**
   * MeSHIntegration
   * - Validates MeSH terms (heuristic/local)
   * - Hierarchy navigation (stub with client-side cache)
   * - Suggestions (prefix search against in-memory list)
   * - Major topic identification
   * - Custom term addition
   * - Tree browsing (mocked unless a dataset is provided)
   *
   * NOTE: This module is designed to plug into a future MeSH dataset loader.
   * If you provide `window.SilentStacks.meshData = { terms: [...], tree: {...} }`,
   * it will use that; otherwise it falls back to minimal heuristics.
   */
  class MeSHIntegration {
    static dependencies = ['APIClient']; // kept to allow future remote fetches
    static required = false;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      // Core
      this.stateManager = null;
      this.eventBus = null;
      this.api = null;

      // Data caches
      this.terms = [];      // [{ term, ui, treeNumber, major=false }]
      this.treeIndex = {};  // treeNumber -> children[]

      // Sanitizer
      const sanitizer = window.SilentStacks?.security?.sanitizer;
      this.sanitize = (v) => (sanitizer?.sanitize ? sanitizer.sanitize(String(v ?? '')) : String(v ?? ''));

      // Heuristic validators
      this._re = {
        term: /^[A-Za-z0-9 ,\-–—'()/.:]+$/ // relaxed; actual MeSH is richer
      };
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.api = window.SilentStacks?.modules?.APIClient ?? null;

        await this.setupModule();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized MeSHIntegration');
        return { status: 'success', module: 'MeSHIntegration' };
      } catch (error) {
        this.recordError('Initialization failed', error);
        throw error;
      }
    }

    async setupModule() {
      // Load any provided MeSH dataset
      const data = window.SilentStacks?.meshData;
      if (data?.terms && Array.isArray(data.terms)) this.terms = data.terms;
      if (data?.tree) this.treeIndex = data.tree;
    }

    // ===== Required API =====

    validateMeshTerm(term) {
      const t = this.sanitize(String(term || '').trim());
      if (!t) return false;
      if (!this._re.term.test(t)) return false;
      // If we have a dataset, check existence
      if (this.terms.length) {
        const found = this.terms.find(x => (x.term || '').toLowerCase() === t.toLowerCase());
        return !!found;
      }
      // Heuristic ok
      return true;
    }

    getMeshHierarchy(term) {
      const t = this.sanitize(String(term || '').trim());
      if (!t) return { parents: [], children: [] };

      // With dataset: derive from tree numbers
      if (this.terms.length) {
        const item = this.terms.find(x => (x.term || '').toLowerCase() === t.toLowerCase());
        if (!item || !item.treeNumber) return { parents: [], children: [] };

        const tn = item.treeNumber;
        const parents = this._parentsFor(tn).map(num => this._byTree(num)?.term).filter(Boolean);
        const children = (this.treeIndex[tn] || []).map(num => this._byTree(num)?.term).filter(Boolean);
        return { parents, children };
      }

      // Fallback: none
      return { parents: [], children: [] };
    }

    suggestMeshTerms(query) {
      const q = this.sanitize(String(query || '').trim().toLowerCase());
      if (!q) return [];
      if (!this.terms.length) {
        // Minimal fallback suggestions
        const base = ['Humans', 'Animals', 'Clinical Trials as Topic', 'Drug Therapy', 'Epidemiology'];
        return base.filter(t => t.toLowerCase().startsWith(q)).slice(0, 10);
      }
      const out = [];
      for (const x of this.terms) {
        const term = (x.term || '').toLowerCase();
        if (term.startsWith(q)) out.push(x.term);
        if (out.length >= 20) break;
      }
      return out;
    }

    identifyMajorTopics(meshList) {
      try {
        // Accepts list of { descriptor, qualifier?, major? }
        if (!Array.isArray(meshList)) return [];
        return meshList.filter(m => !!m.major).map(m => m.descriptor).filter(Boolean);
      } catch {
        return [];
      }
    }

    addCustomMeshTerm(term) {
      const t = this.sanitize(String(term || '').trim());
      if (!t) throw this._publicError('Empty term');
      // Insert if not exists
      if (!this.terms.find(x => (x.term || '').toLowerCase() === t.toLowerCase())) {
        const ui = `CUST${Date.now()}`;
        this.terms.push({ term: t, ui, treeNumber: null, major: false });
      }
      return true;
    }

    browseMeshTree() {
      // Returns a simple snapshot usable by a UI tree viewer
      if (!Object.keys(this.treeIndex).length) return {};
      return this.treeIndex;
    }

    // ===== Internals =====

    _parentsFor(treeNumber) {
      // Given "A01.111.222", parents are ["A01", "A01.111"]
      const parts = treeNumber.split('.');
      const parents = [];
      for (let i = 1; i < parts.length; i++) {
        parents.push(parts.slice(0, i).join('.'));
      }
      return parents;
    }

    _byTree(treeNumber) {
      // O(n) unless a reverse map is provided; acceptable for small in-memory sets
      return this.terms.find(x => x.treeNumber === treeNumber) || null;
    }

    // ===== Boilerplate =====

    recordError(message, error) {
      const errorRecord = {
        message,
        error: error?.message || String(error),
        stack: (window.SilentStacks?.config?.debug ? error?.stack : undefined),
        timestamp: new Date().toISOString()
      };
      this.errors.push(errorRecord);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);

      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'MeSHIntegration',
        message,
        error: errorRecord.error
      });
    }

    log(message) {
      if (window.SilentStacks?.config?.debug) console.log(`[MeSHIntegration] ${message}`);
    }

    getHealthStatus() {
      return {
        name: 'MeSHIntegration',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {
          termsLoaded: this.terms.length,
          hasTree: Object.keys(this.treeIndex).length > 0
        }
      };
    }

    _publicError(message) {
      const err = new Error(String(message || 'Unexpected error'));
      err.public = true;
      return err;
    }
  }

  const moduleInstance = new MeSHIntegration();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('MeSHIntegration', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.MeSHIntegration = moduleInstance;
  }

  console.log('📦 MeSHIntegration loaded');
})();
