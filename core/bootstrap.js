// core/bootstrap.js
// SilentStacks v2.0 - System Bootstrap
// Copy this file to: core/bootstrap.js

(() => {
  'use strict';

  class SilentStacksBootstrap {
    constructor() {
      this.startTime = performance.now();
      this.initializationSteps = [];
      this.moduleDefinitions = {};
      this.loadedModules = new Set();
      this.failedModules = new Set();
      this.moduleLoadOrder = [];
      
      // Configuration
      this.config = {
        debug: new URLSearchParams(window.location.search).has('debug'),
        timeout: 30000,
        retryAttempts: 3,
        moduleLoadDelay: 50
      };

      this.initializeGlobalNamespace();
    }

    initializeGlobalNamespace() {
      window.SilentStacks = {
        version: '2.0.0',
        initialized: false,
        modules: {},
        core: {
          bootstrap: this,
          stateManager: null,
          eventBus: null,
          diagnostics: null
        },
        config: this.config,
        
        // Public API
        registerModule: (name, module) => this.registerModule(name, module),
        getModule: (name) => this.modules[name],
        getHealthStatus: () => this.getSystemHealth(),
        restart: () => this.restart(),
        
        // Development helpers
        debug: {
          showDiagnostics: () => this.showDiagnosticsPanel(),
          getLoadOrder: () => this.getModuleLoadOrder(),
          getState: () => this.core.stateManager?.getState(),
          exportDiagnostics: () => this.exportDiagnostics()
        }
      };

      this.log('🚀 SilentStacks v2.0 global namespace initialized');
    }

    async initialize() {
      try {
        this.log('🔄 Starting SilentStacks v2.0 initialization...');
        
        await this.step('Loading Configuration', () => this.loadConfiguration());
        await this.step('Initializing Core Systems', () => this.initializeCore());
        await this.step('Loading Module Definitions', () => this.loadModuleDefinitions());
        await this.step('Resolving Dependencies', () => this.resolveDependencies());
        await this.step('Loading Modules', () => this.loadAllModules());
        await this.step('Initializing Modules', () => this.initializeAllModules());
        await this.step('Running Health Checks', () => this.runHealthChecks());
        await this.step('Mounting UI', () => this.mountUserInterface());

        window.SilentStacks.initialized = true;
        
        const totalTime = Math.round(performance.now() - this.startTime);
        this.log(`✅ SilentStacks v2.0 initialization complete in ${totalTime}ms`);
        
        if (this.config.debug) {
          setTimeout(() => this.showDiagnosticsPanel(), 1000);
        }

        return { success: true, time: totalTime };
        
      } catch (error) {
        this.error('❌ SilentStacks initialization failed:', error);
        await this.handleInitializationFailure(error);
        return { success: false, error: error.message };
      }
    }

    async step(name, fn) {
      const start = performance.now();
      this.log(`⏳ ${name}...`);
      
      try {
        const result = await fn();
        const time = Math.round(performance.now() - start);
        this.log(`✅ ${name} completed in ${time}ms`);
        
        this.initializationSteps.push({
          name, status: 'success', time,
          timestamp: new Date().toISOString(), result
        });
        
        return result;
      } catch (error) {
        const time = Math.round(performance.now() - start);
        this.error(`❌ ${name} failed in ${time}ms:`, error);
        
        this.initializationSteps.push({
          name, status: 'error', time,
          timestamp: new Date().toISOString(),
          error: error.message
        });
        
        throw error;
      }
    }

    async loadConfiguration() {
      // Default configuration
      const defaultConfig = {
        apiRateLimit: 2, // requests per second
        searchDebounce: 300, // milliseconds
        theme: 'light',
        performanceMode: false,
        enableDiagnostics: true,
        logLevel: this.config.debug ? 'debug' : 'info'
      };

      // Load from localStorage
      try {
        const stored = localStorage.getItem('silentstacks_config');
        if (stored) {
          Object.assign(defaultConfig, JSON.parse(stored));
        }
      } catch (error) {
        this.warn('Failed to load stored configuration:', error);
      }

      // Load from URL parameters
      const params = new URLSearchParams(window.location.search);
      if (params.has('theme')) defaultConfig.theme = params.get('theme');
      if (params.has('performance')) defaultConfig.performanceMode = params.get('performance') === 'true';

      Object.assign(this.config, defaultConfig);
      this.log('📋 Configuration loaded:', this.config);
      return this.config;
    }

    async initializeCore() {
      // Initialize State Manager
      window.SilentStacks.core.stateManager = {
        state: {
          requests: new Map(),
          selectedRequests: new Set(),
          activeTab: 'dashboard',
          searchQuery: '',
          filters: {},
          moduleStatus: new Map(),
          ui: {
            theme: this.config.theme,
            performanceMode: this.config.performanceMode
          }
        },
        
        setState(path, value) {
          this.setNested(this.state, path, value);
          window.SilentStacks.core.eventBus?.emit('state:changed', { path, value });
        },
        
        getState(path) {
          return path ? this.getNested(this.state, path) : this.state;
        },
        
        setNested(obj, path, value) {
          const keys = path.split('.');
          let current = obj;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
        },
        
        getNested(obj, path) {
          return path.split('.').reduce((current, key) => current?.[key], obj);
        }
      };

      // Initialize Event Bus
      window.SilentStacks.core.eventBus = {
        listeners: new Map(),
        
        on(event, callback) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
          }
          this.listeners.get(event).add(callback);
        },
        
        off(event, callback) {
          this.listeners.get(event)?.delete(callback);
        },
        
        emit(event, data) {
          this.listeners.get(event)?.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error(`Error in event handler for ${event}:`, error);
            }
          });
        }
      };

      // Initialize Diagnostics
      window.SilentStacks.core.diagnostics = {
        issues: [],
        metrics: new Map(),
        
        recordIssue(issue) {
          this.issues.push({
            ...issue,
            timestamp: new Date().toISOString()
          });
        },
        
        recordMetric(name, value) {
          this.metrics.set(name, {
            value,
            timestamp: new Date().toISOString()
          });
        },
        
        getReport() {
          return {
            issues: this.issues,
            metrics: Object.fromEntries(this.metrics),
            timestamp: new Date().toISOString()
          };
        }
      };

      this.log('🔧 Core systems initialized');
    }

    async loadModuleDefinitions() {
      this.moduleDefinitions = {
        // Data Layer
        'RequestManager': {
          path: 'modules/data/request-manager.js',
          dependencies: [],
          required: true
        },
        'APIClient': {
          path: 'modules/data/api-client.js',
          dependencies: [],
          required: true
        },
        'StorageAdapter': {
          path: 'modules/data/storage-adapter.js',
          dependencies: [],
          required: true
        },
        
        // UI Layer
        'UIController': {
          path: 'modules/ui/ui-controller.js',
          dependencies: ['RequestManager'],
          required: true
        },
        'Forms': {
          path: 'modules/ui/forms.js',
          dependencies: ['UIController', 'RequestManager'],
          required: true
        },
        'SearchFilter': {
          path: 'modules/ui/search-filter.js',
          dependencies: ['RequestManager'],
          required: true
        },
        'Notifications': {
          path: 'modules/ui/notifications.js',
          dependencies: ['UIController'],
          required: false
        },
        
        // Workflow Layer
        'ILLWorkflow': {
          path: 'modules/workflows/ill-workflow.js',
          dependencies: ['RequestManager', 'UIController'],
          required: false
        },
        'BulkUpload': {
          path: 'modules/workflows/bulk-upload.js',
          dependencies: ['RequestManager', 'APIClient'],
          required: true
        },
        'ExportManager': {
          path: 'modules/workflows/export-manager.js',
          dependencies: ['RequestManager'],
          required: false
        },
        
        // Integration Layer
        'PubMedIntegration': {
          path: 'modules/integrations/pubmed-integration.js',
          dependencies: ['APIClient'],
          required: true
        },
        'ClinicalTrials': {
          path: 'modules/integrations/clinical-trials.js',
          dependencies: ['APIClient'],
          required: false
        },
        'MeshIntegration': {
          path: 'modules/integrations/mesh-integration.js',
          dependencies: ['APIClient'],
          required: false
        }
      };

      this.log(`📦 Loaded ${Object.keys(this.moduleDefinitions).length} module definitions`);
      return this.moduleDefinitions;
    }

    async resolveDependencies() {
      const resolved = [];
      const visiting = new Set();
      const visited = new Set();

      const visit = (name) => {
        if (visited.has(name)) return;
        if (visiting.has(name)) {
          throw new Error(`Circular dependency detected involving ${name}`);
        }

        visiting.add(name);
        
        const definition = this.moduleDefinitions[name];
        if (!definition) {
          if (this.isRequiredModule(name)) {
            throw new Error(`Required module ${name} not found`);
          }
          return;
        }

        definition.dependencies.forEach(dep => visit(dep));
        
        visiting.delete(name);
        visited.add(name);
        resolved.push(name);
      };

      Object.keys(this.moduleDefinitions).forEach(name => visit(name));
      
      this.moduleLoadOrder = resolved;
      this.log(`🔗 Dependency resolution complete:`, resolved);
      
      return resolved;
    }

    isRequiredModule(name) {
      return this.moduleDefinitions[name]?.required || false;
    }

    async loadAllModules() {
      const results = [];
      
      for (const moduleName of this.moduleLoadOrder) {
        try {
          await this.loadSingleModule(moduleName);
          results.push({ name: moduleName, status: 'loaded' });
        } catch (error) {
          this.error(`Failed to load module ${moduleName}:`, error);
          results.push({ name: moduleName, status: 'failed', error: error.message });
          
          if (this.isRequiredModule(moduleName)) {
            throw new Error(`Required module ${moduleName} failed to load: ${error.message}`);
          }
        }
        
        await this.delay(this.config.moduleLoadDelay);
      }
      
      this.log(`📦 Module loading complete. Loaded: ${results.filter(r => r.status === 'loaded').length}`);
      return results;
    }

    async loadSingleModule(name) {
      const definition = this.moduleDefinitions[name];
      if (!definition) {
        throw new Error(`Module definition not found: ${name}`);
      }

      for (const dep of definition.dependencies) {
        if (!this.loadedModules.has(dep)) {
          throw new Error(`Dependency ${dep} not loaded for module ${name}`);
        }
      }

      await this.delay(50);
      
      if (!window.SilentStacks.modules[name]) {
        const variations = [name, name.toLowerCase(), name.charAt(0).toLowerCase() + name.slice(1)];
        let found = false;
        
        for (const variation of variations) {
          if (window.SilentStacks.modules[variation]) {
            window.SilentStacks.modules[name] = window.SilentStacks.modules[variation];
            found = true;
            break;
          }
        }
        
        if (!found) {
          throw new Error(`Module ${name} did not register itself`);
        }
      }
      
      this.loadedModules.add(name);
      this.log(`✅ Loaded module: ${name}`);
    }

    async initializeAllModules() {
      const results = [];
      
      for (const moduleName of this.moduleLoadOrder) {
        if (!this.loadedModules.has(moduleName)) continue;
        
        try {
          const result = await this.initializeSingleModule(moduleName);
          results.push({ name: moduleName, status: 'initialized', result });
        } catch (error) {
          this.error(`Failed to initialize module ${moduleName}:`, error);
          results.push({ name: moduleName, status: 'failed', error: error.message });
          
          if (this.isRequiredModule(moduleName)) {
            throw new Error(`Required module ${moduleName} failed to initialize: ${error.message}`);
          }
        }
      }
      
      this.log(`🔧 Module initialization complete`);
      return results;
    }

    async initializeSingleModule(name) {
      const module = window.SilentStacks.modules[name];
      if (!module) {
        throw new Error(`Module ${name} not found`);
      }

      if (typeof module.initialize === 'function') {
        const result = await module.initialize();
        this.log(`🔧 Initialized module: ${name}`);
        return result;
      } else {
        this.log(`ℹ️ Module ${name} has no initialize method`);
        return { status: 'no-init-method' };
      }
    }

    async runHealthChecks() {
      const healthReport = {};
      
      for (const moduleName of this.loadedModules) {
        const module = window.SilentStacks.modules[moduleName];
        if (module && typeof module.getHealthStatus === 'function') {
          try {
            healthReport[moduleName] = await module.getHealthStatus();
          } catch (error) {
            healthReport[moduleName] = {
              name: moduleName,
              status: 'health-check-failed',
              error: error.message
            };
          }
        } else {
          healthReport[moduleName] = {
            name: moduleName,
            status: 'no-health-check',
            loaded: true,
            initialized: true
          };
        }
      }
      
      this.healthReport = healthReport;
      this.log(`🏥 Health checks complete`);
      return healthReport;
    }

    async mountUserInterface() {
      // Initialize theme
      const theme = this.config.theme || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      
      if (this.config.performanceMode) {
        document.body.classList.add('performance-mode');
      }

      // Setup global error handling
      window.addEventListener('error', (event) => {
        this.recordError('Global Error', event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.recordError('Unhandled Promise Rejection', event.reason);
      });

      // Trigger UI mount event
      window.SilentStacks.core.eventBus?.emit('ui:mount', {
        timestamp: new Date().toISOString()
      });
      
      this.log('🎨 User interface mounted');
    }

    async handleInitializationFailure(error) {
      this.createFailsafeUI(error);
      this.recordError('Initialization Failure', error);
    }

    createFailsafeUI(error) {
      const failsafeHTML = `
        <div style="position: fixed; top: 20px; left: 20px; right: 20px; background: #ff4444; color: white; padding: 20px; border-radius: 8px; z-index: 10001;">
          <h3>⚠️ SilentStacks v2.0 Initialization Failed</h3>
          <p>Error: ${error.message}</p>
          <button onclick="window.SilentStacks.debug.showDiagnostics()">Show Diagnostics</button>
          <button onclick="window.SilentStacks.restart()">Restart</button>
        </div>
      `;
      
      document.body.insertAdjacentHTML('afterbegin', failsafeHTML);
    }

    registerModule(name, module) {
      if (window.SilentStacks.modules[name]) {
        this.warn(`Module ${name} is already registered, replacing...`);
      }
      
      window.SilentStacks.modules[name] = module;
      this.log(`📦 Registered module: ${name}`);
      
      window.SilentStacks.core.eventBus?.emit('module:registered', {
        name, timestamp: new Date().toISOString()
      });
    }

    getSystemHealth() {
      const totalModules = Object.keys(this.moduleDefinitions || {}).length;
      const loadedCount = this.loadedModules.size;
      const failedCount = this.failedModules.size;
      
      return {
        status: window.SilentStacks.initialized ? 'running' : 'initializing',
        modules: {
          total: totalModules,
          loaded: loadedCount,
          failed: failedCount,
          loadedModules: Array.from(this.loadedModules),
          failedModules: Array.from(this.failedModules)
        },
        initialization: {
          steps: this.initializationSteps,
          duration: this.initializationSteps.reduce((sum, step) => sum + step.time, 0)
        },
        health: this.healthReport || {},
        errors: this.errors || [],
        timestamp: new Date().toISOString()
      };
    }

    showDiagnosticsPanel() {
      if (this.diagnosticsPanel) {
        this.diagnosticsPanel.style.display = 'block';
        return;
      }

      this.diagnosticsPanel = document.createElement('div');
      this.diagnosticsPanel.innerHTML = this.generateDiagnosticsHTML();
      this.diagnosticsPanel.style.cssText = `
        position: fixed; top: 20px; right: 20px; width: 400px; max-height: 80vh;
        background: white; border: 2px solid #333; border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); z-index: 10002;
        font-family: monospace; font-size: 12px; overflow-y: auto;
      `;

      document.body.appendChild(this.diagnosticsPanel);
      this.attachDiagnosticsHandlers();
    }

    generateDiagnosticsHTML() {
      const health = this.getSystemHealth();
      
      return `
        <div style="padding: 16px; border-bottom: 1px solid #eee; background: #f5f5f5; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0;">🔧 SilentStacks v2.0 Diagnostics</h3>
          <button id="close-diagnostics" style="border: none; background: #ff4444; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">&times;</button>
        </div>
        
        <div style="padding: 16px;">
          <div style="margin-bottom: 16px;">
            <h4>System Status</h4>
            <p>Status: <span style="color: ${health.status === 'running' ? 'green' : 'orange'};">${health.status}</span></p>
            <p>Modules: ${health.modules.loaded}/${health.modules.total} loaded</p>
            <p>Init Time: ${health.initialization.duration}ms</p>
          </div>

          <div style="margin-bottom: 16px;">
            <h4>Module Load Order</h4>
            <div style="max-height: 150px; overflow-y: auto; border: 1px solid #eee; padding: 8px;">
              ${this.moduleLoadOrder ? this.moduleLoadOrder.map(name => 
                `<div style="color: ${this.loadedModules.has(name) ? 'green' : 'red'};">
                  ${this.loadedModules.has(name) ? '✅' : '❌'} ${name}
                </div>`
              ).join('') : 'Not resolved yet'}
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <h4>Initialization Steps</h4>
            <div style="max-height: 150px; overflow-y: auto; border: 1px solid #eee; padding: 8px;">
              ${this.initializationSteps.map(step => 
                `<div style="color: ${step.status === 'success' ? 'green' : 'red'};">
                  ${step.status === 'success' ? '✅' : '❌'} ${step.name} (${step.time}ms)
                </div>`
              ).join('')}
            </div>
          </div>

          <div>
            <h4>Actions</h4>
            <button id="refresh-diagnostics" style="margin: 4px; padding: 8px;">Refresh</button>
            <button id="restart-system" style="margin: 4px; padding: 8px;">Restart</button>
            <button id="export-diagnostics" style="margin: 4px; padding: 8px;">Export</button>
          </div>
        </div>
      `;
    }

    attachDiagnosticsHandlers() {
      const panel = this.diagnosticsPanel;
      
      panel.querySelector('#close-diagnostics').onclick = () => {
        panel.style.display = 'none';
      };
      
      panel.querySelector('#refresh-diagnostics').onclick = () => {
        panel.innerHTML = this.generateDiagnosticsHTML();
        this.attachDiagnosticsHandlers();
      };
      
      panel.querySelector('#restart-system').onclick = () => {
        this.restart();
      };
      
      panel.querySelector('#export-diagnostics').onclick = () => {
        this.exportDiagnostics();
      };
    }

    exportDiagnostics() {
      const data = {
        timestamp: new Date().toISOString(),
        health: this.getSystemHealth(),
        config: this.config,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `silentstacks-v2-diagnostics-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    }

    async restart() {
      this.log('🔄 Restarting SilentStacks v2.0...');
      
      this.loadedModules.clear();
      this.failedModules.clear();
      this.initializationSteps = [];
      window.SilentStacks.initialized = false;
      
      if (this.diagnosticsPanel) {
        this.diagnosticsPanel.style.display = 'none';
      }
      
      this.startTime = performance.now();
      await this.initialize();
    }

    // Utility methods
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    log(message, ...args) {
      if (this.config.debug || this.config.logLevel === 'debug') {
        console.log(`[SilentStacks v2.0] ${message}`, ...args);
      }
    }

    warn(message, ...args) {
      console.warn(`[SilentStacks v2.0] ${message}`, ...args);
    }

    error(message, ...args) {
      console.error(`[SilentStacks v2.0] ${message}`, ...args);
      this.recordError(message, args[0]);
    }

    recordError(message, error) {
      if (!this.errors) this.errors = [];
      this.errors.push({
        message,
        error: error?.message || error,
        stack: error?.stack,
        timestamp: new Date().toISOString()
      });
      
      window.SilentStacks.core.diagnostics?.recordIssue({
        type: 'error',
        message,
        error
      });
    }

    getModuleLoadOrder() {
      return {
        resolved: this.moduleLoadOrder || [],
        loaded: Array.from(this.loadedModules),
        failed: Array.from(this.failedModules),
        definitions: this.moduleDefinitions
      };
    }
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSilentStacks);
  } else {
    initializeSilentStacks();
  }

  async function initializeSilentStacks() {
    if (window.SilentStacks?.initialized || window.SilentStacks?.initializing) {
      return;
    }

    window.SilentStacks = window.SilentStacks || {};
    window.SilentStacks.initializing = true;

    try {
      const bootstrap = new SilentStacksBootstrap();
      const result = await bootstrap.initialize();
      
      if (result.success) {
        console.log('🎉 SilentStacks v2.0 ready!');
      } else {
        console.error('❌ SilentStacks v2.0 initialization failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Fatal SilentStacks v2.0 error:', error);
    } finally {
      delete window.SilentStacks.initializing;
    }
  }

})();