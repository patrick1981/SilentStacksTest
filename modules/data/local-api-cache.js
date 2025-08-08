// modules/data/local-api-cache.js
(() => {
  'use strict';

  /**
   * LocalAPICache
   * - Simple TTL’d cache per namespace: pubmed / crossref / ctgov
   * - Lives in StorageAdapter for persistence
   */
  class LocalAPICache {
    static dependencies = ['StorageAdapter'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;
      this.storage = null;

      this.indexKey = 'apiCache:index';
      this.index = { pubmed: {}, crossref: {}, ctgov: {} }; // key -> { ts, ttl }
      this.defaults = { ttlMs: 1000 * 60 * 60 * 24 * 7 }; // 7d
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.storage = window.SilentStacks?.modules?.StorageAdapter ?? null;

        const saved = await this.storage.retrieve(this.indexKey);
        if (saved) this.index = saved;

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized LocalAPICache');
        return { status: 'success', module: 'LocalAPICache' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    // Public API
    async get(ns, key) {
      const meta = this.index?.[ns]?.[key];
      if (!meta) return null;
      if (Date.now() > meta.ts + (meta.ttl ?? this.defaults.ttlMs)) {
        // expired
        await this._del(ns, key);
        return null;
      }
      return await this.storage.retrieve(this._k(ns, key));
    }

    async set(ns, key, value, ttlMs = this.defaults.ttlMs) {
      await this.storage.store(this._k(ns, key), value);
      this.index[ns] = this.index[ns] || {};
      this.index[ns][key] = { ts: Date.now(), ttl: ttlMs };
      await this.storage.store(this.indexKey, this.index);
      this.lastActivity = new Date().toISOString();
    }

    async has(ns, key) {
      const meta = this.index?.[ns]?.[key];
      if (!meta) return false;
      return Date.now() <= meta.ts + (meta.ttl ?? this.defaults.ttlMs);
    }

    async clearNamespace(ns) {
      const m = this.index?.[ns] || {};
      for (const k of Object.keys(m)) await this._del(ns, k);
      this.index[ns] = {};
      await this.storage.store(this.indexKey, this.index);
    }

    // Internals
    _k(ns, key) { return `apicache:${ns}:${key}`; }

    async _del(ns, key) {
      await this.storage.remove(this._k(ns, key));
      delete this.index?.[ns]?.[key];
      await this.storage.store(this.indexKey, this.index);
    }

    // Boilerplate
    getHealthStatus() {
      return {
        name: 'LocalAPICache',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {}
      };
    }
    recordError(message, error) {
      const rec = { message, error: error?.message || String(error), stack: window.SilentStacks?.config?.debug ? error?.stack : undefined, timestamp: new Date().toISOString() };
      this.errors.push(rec); if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'LocalAPICache', message, error: rec.error });
    }
    log(msg) { if (window.SilentStacks?.config?.debug) console.log(`[LocalAPICache] ${msg}`); }
  }

  const moduleInstance = new LocalAPICache();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('LocalAPICache', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.LocalAPICache = moduleInstance; }
  console.log('📦 LocalAPICache loaded');
})();
