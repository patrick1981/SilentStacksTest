// config/feature-flags.js
(() => {
  'use strict';

  /**
   * FeatureFlags
   * Simple runtime flags with A/B support (user bucketing) and event emission.
   */
  class FeatureFlags {
    static dependencies = ['AppConfig'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;

      this.flags = {
        // examples
        enableAdvancedSearch: true,
        enableExportHistory: true,
        enableMeshSuggestions: true
      };

      this.bucketKey = 'ss2:ab:bucket';
      this.bucket = null; // 0..99
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;

        await this.setupModule();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized FeatureFlags');
        return { status: 'success', module: 'FeatureFlags' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    async setupModule() {
      // Sticky user bucket (for A/B rollouts)
      this.bucket = Number(localStorage.getItem(this.bucketKey));
      if (!Number.isInteger(this.bucket)) {
        this.bucket = Math.floor(Math.random() * 100);
        localStorage.setItem(this.bucketKey, String(this.bucket));
      }

      // Example gradual rollout: enable X only for bucket < 50
      if (this.bucket >= 50) {
        this.flags.enableMeshSuggestions = false;
      }

      // Merge into global config.flags
      const patch = { flags: { ...this.flags, bucket: this.bucket } };
      this.eventBus?.emit?.('config:update', patch);
    }

    enable(flagName) {
      this.flags[flagName] = true;
      this.eventBus?.emit?.('config:update', { flags: { [flagName]: true } });
    }

    disable(flagName) {
      this.flags[flagName] = false;
      this.eventBus?.emit?.('config:update', { flags: { [flagName]: false } });
    }

    getHealthStatus() {
      return {
        name: 'FeatureFlags',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: { bucket: this.bucket }
      };
    }

    recordError(message, error) {
      const rec = {
        message,
        error: error?.message || String(error),
        stack: (window.SilentStacks?.config?.debug ? error?.stack : undefined),
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'FeatureFlags',
        message,
        error: rec.error
      });
    }

    log(msg) {
      if (window.SilentStacks?.config?.debug) console.log(`[FeatureFlags] ${msg}`);
    }
  }

  const moduleInstance = new FeatureFlags();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('FeatureFlags', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.FeatureFlags = moduleInstance;
  }

  console.log('📦 Feature Flags loaded');
})();