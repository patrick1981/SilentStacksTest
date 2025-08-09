// modules/config/app-config.js - FIXED
(() => {
  'use strict';

  /**
   * AppConfig - Central configuration management
   * Provides environment-aware configuration with safe defaults
   */
  class AppConfig {
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];
      
      // Default configuration
      this.config = {
        app: {
          name: 'SilentStacks',
          version: '2.0.0',
          environment: this._detectEnvironment(),
          debug: this._shouldEnableDebug()
        },
        api: {
          pubmed: {
            baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
            rateLimit: 3, // requests per second
            timeout: 10000
          },
          crossref: {
            baseUrl: 'https://api.crossref.org',
            rateLimit: 50, // requests per second
            timeout: 8000
          },
          clinicalTrials: {
            baseUrl: 'https://clinicaltrials.gov/api',
            rateLimit: 10, // requests per second
            timeout: 12000
          }
        },
        storage: {
          namespace: 'ss2',
          maxBackupEntries: 10,
          encryptionEnabled: true,
          quotaWarningMB: 100
        },
        ui: {
          theme: 'auto', // auto, light, dark
          animations: true,
          compactMode: false,
          autoSave: true,
          autoSaveInterval: 30000 // 30 seconds
        },
        performance: {
          moduleLoadDelay: 0,
          batchSize: 25,
          requestTimeout: 30000,
          retryAttempts: 3,
          retryDelay: 1000
        },
        features: {
          offlineMode: true,
          bulkOperations: true,
          exportFeatures: true,
          advancedSearch: true,
          diagnostics: true
        }
      };
    }

    async initialize() {
      try {
        // Load any stored configuration overrides
        await this._loadStoredConfig();
        
        // Apply environment-specific settings
        this._applyEnvironmentConfig();
        
        // Expose configuration globally
        window.SilentStacks = window.SilentStacks || {};
        window.SilentStacks.config = this.config;
        
        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized AppConfig');
        
        return { status: 'success', module: 'AppConfig' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    async setupModule() {}

    // ===== Public API =====
    get(path) {
      return this._getNestedValue(this.config, path);
    }

    set(path, value) {
      this._setNestedValue(this.config, path, value);
      this._saveConfig();
      this.lastActivity = new Date().toISOString();
    }

    getAll() {
      return JSON.parse(JSON.stringify(this.config));
    }

    reset() {
      // Reset to defaults
      this.constructor();
      this._saveConfig();
    }

    // ===== Environment Detection =====
    _detectEnvironment() {
      if (typeof window === 'undefined') return 'node';
      
      const hostname = window.location?.hostname || '';
      
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('local')) {
        return 'development';
      }
      
      if (hostname.includes('github.io') || hostname.includes('netlify') || hostname.includes('vercel')) {
        return 'production';
      }
      
      if (hostname.includes('staging') || hostname.includes('test')) {
        return 'staging';
      }
      
      return 'production';
    }

    _shouldEnableDebug() {
      const env = this._detectEnvironment();
      
      // Enable debug in development
      if (env === 'development') return true;
      
      // Check for debug query parameter
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location?.search || '');
        if (urlParams.has('debug')) return true;
      }
      
      // Check localStorage override
      try {
        return localStorage.getItem('ss-debug') === 'true';
      } catch {
        return false;
      }
    }

    _applyEnvironmentConfig() {
      const env = this.config.app.environment;
      
      if (env === 'development') {
        this.config.api.pubmed.rateLimit = 1; // Slower in dev
        this.config.performance.moduleLoadDelay = 10;
      } else if (env === 'production') {
        this.config.app.debug = false; // Force off in production unless explicitly enabled
        this.config.features.diagnostics = false;
      }
    }

    // ===== Configuration Persistence =====
    async _loadStoredConfig() {
      try {
        const stored = localStorage.getItem('ss-config');
        if (stored) {
          const parsedConfig = JSON.parse(stored);
          this.config = this._mergeDeep(this.config, parsedConfig);
        }
      } catch (e) {
        this.recordError('Failed to load stored config', e);
      }
    }

    _saveConfig() {
      try {
        localStorage.setItem('ss-config', JSON.stringify(this.config));
      } catch (e) {
        this.recordError('Failed to save config', e);
      }
    }

    // ===== Utilities =====
    _getNestedValue(obj, path) {
      return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    _setNestedValue(obj, path, value) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((current, key) => {
        current[key] = current[key] || {};
        return current[key];
      }, obj);
      target[lastKey] = value;
    }

    _mergeDeep(target, source) {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this._mergeDeep(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    }

    // ===== Health and diagnostics =====
    getHealthStatus() {
      return {
        name: 'AppConfig',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        environment: this.config.app.environment,
        debug: this.config.app.debug
      };
    }

    recordError(message, error) {
      const rec = {
        message,
        error: error?.message || String(error),
        stack: this.config?.app?.debug ? error?.stack : undefined,
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) {
        this.errors = this.errors.slice(-100);
      }
      
      const SS = window.SilentStacks || {};
      SS.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'AppConfig',
        message,
        error: rec.error
      });
    }

    log(msg) {
      if (this.config?.app?.debug) {
        console.log(`[AppConfig] ${msg}`);
      }
    }
  }

  // ===== Safe module registration =====
  const moduleInstance = new AppConfig();
  
  window.SilentStacks = window.SilentStacks || { modules: {} };
  
  if (window.SilentStacks.registerModule) {
    window.SilentStacks.registerModule('AppConfig', moduleInstance);
  } else {
    window.SilentStacks.modules = window.SilentStacks.modules || {};
    window.SilentStacks.modules.AppConfig = moduleInstance;
  }
  
  console.log('📦 AppConfig loaded');
})();
