// config/app-config.js
(() => {
  'use strict';

  /**
   * AppConfig
   * Centralized application configuration with env overrides and runtime updates.
   * Exposes a plain object to window.SilentStacks.config for easy access.
   */
  class AppConfig {
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;

      // Default config (can be overridden by querystring, state, or api-endpoints module)
      this.config = {
        version: '2.0',
        debug: /[?&]debug=1|true/.test(location.search),
        storage: {
          namespace: 'ss2',
          version: 1,
          // Provide a stable secret via deployment if desired; otherwise StorageAdapter will generate one.
          secret: undefined,
          autoBackupIntervalMs: 24 * 60 * 60 * 1000,
          maxBackupEntries: 10
        },
        api: {
          timeoutMs: 30000,
          maxRetries: 3,
          jitterMs: 150,
          endpoints: {
            pubmed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
            crossref: 'https://api.crossref.org/works',
            clinicaltrials: 'https://clinicaltrials.gov/api/v2/studies'
          }
        },
        limits: {
          externalRPS: 2 // global outgoing rate limit
        },
        ui: {
          theme: 'light'
        },
        integrations: {
          pubmed: { enableRelated: true }
        },
        flags: {} // feature-flags module will merge into here
      };
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;

        await this.setupModule();

        // Export config to global
        window.SilentStacks = window.SilentStacks || {};
        window.SilentStacks.config = Object.freeze(this.config);

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized AppConfig');
        return { status: 'success', module: 'AppConfig' };
      } catch (error) {
        this.recordError('Initialization failed', error);
        throw error;
      }
    }

    async setupModule() {
      // Merge state overrides if present
      const saved = this.stateManager?.getState('app:config');
      if (saved && typeof saved === 'object') {
        this._deepMerge(this.config, saved);
      }

      // Querystring overrides, e.g. ?debug=true&theme=dark
      const qs = new URLSearchParams(location.search);
      if (qs.has('debug')) this.config.debug = /1|true/.test(qs.get('debug') || '');
      if (qs.has('theme')) this.config.ui.theme = String(qs.get('theme') || 'light');

      // Listen for runtime updates
      this.eventBus?.on?.('config:update', (patch) => {
        if (!patch || typeof patch !== 'object') return;
        this._deepMerge(this.config, patch);
        // Refresh global reference
        window.SilentStacks.config = Object.freeze({ ...this.config });
        this.lastActivity = new Date().toISOString();
      });
    }

    getHealthStatus() {
      return {
        name: 'AppConfig',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {}
      };
    }

    recordError(message, error) {
      const rec = {
        message,
        error: error?.message || String(error),
        stack: (this.config?.debug ? error?.stack : undefined),
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'AppConfig',
        message,
        error: rec.error
      });
    }

    log(msg) {
      if (this.config?.debug) console.log(`[AppConfig] ${msg}`);
    }

    _deepMerge(target, patch) {
      for (const [k, v] of Object.entries(patch)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          target[k] = target[k] && typeof target[k] === 'object' ? target[k] : {};
          this._deepMerge(target[k], v);
        } else {
          target[k] = v;
        }
      }
    }
  }

  const moduleInstance = new AppConfig();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('AppConfig', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.AppConfig = moduleInstance;
  }

  console.log('📦 App Config loaded');
})();
