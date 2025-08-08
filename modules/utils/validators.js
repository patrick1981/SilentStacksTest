// utils/validators.js
(() => {
  'use strict';

  /**
   * Validators
   * Synchronous + async-capable validation helpers.
   * Exposed at window.SilentStacks.utils.validators
   */
  class Validators {
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.eventBus = null;

      this._re = {
        pmid: /^[1-9]\d*$/,
        doi: /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        url: /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i
      };
    }

    async initialize() {
      try {
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.initialized = true;
        this.lastActivity = new Date().toISOString();

        // Export into utils bag
        window.SilentStacks = window.SilentStacks || {};
        window.SilentStacks.utils = window.SilentStacks.utils || {};
        window.SilentStacks.utils.validators = {
          validatePMID: (v) => this.validatePMID(v),
          validateDOI: (v) => this.validateDOI(v),
          validateEmail: (v) => this.validateEmail(v),
          validateURL: (v) => this.validateURL(v),
          asyncValidate: (fn) => this.asyncValidate(fn)
        };

        return { status: 'success', module: 'Validators' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    validatePMID(v) { return this._re.pmid.test(String(v || '')); }
    validateDOI(v) { return this._re.doi.test(String(v || '')); }
    validateEmail(v) { return this._re.email.test(String(v || '')); }
    validateURL(v) { return this._re.url.test(String(v || '')); }

    async asyncValidate(fn) {
      try {
        const res = await Promise.resolve(typeof fn === 'function' ? fn() : false);
        return !!res;
      } catch {
        return false;
      }
    }

    getHealthStatus() {
      return {
        name: 'Validators',
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
        stack: (window.SilentStacks?.config?.debug ? error?.stack : undefined),
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'Validators',
        message,
        error: rec.error
      });
    }
  }

  const moduleInstance = new Validators();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('Validators', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.Validators = moduleInstance;
  }

  console.log('🧰 Validators loaded');
})();
