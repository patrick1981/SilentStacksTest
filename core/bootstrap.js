// core/bootstrap.js — SilentStacks v2 loader with AUTO-REGISTRATION
(() => {
  'use strict';

  // ===== Namespace shim =====
  const W = window;
  const SS = (W.SilentStacks = W.SilentStacks || {});
  SS.modules = SS.modules || {};
  SS.core = SS.core || {};
  if (typeof SS.registerModule !== 'function') {
    SS.registerModule = function (name, api) { SS.modules[name] = api; };
  }

  // ===== Tiny diagnostics in console only (no UI noise) =====
  const log = (...a) => console.log('[SS]', ...a);
  const warn = (...a) => console.warn('[SS]', ...a);
  const err = (...a) => console.error('[SS]', ...a);

  // ===== Known export name hints per module (so we can auto-register) =====
  const EXPORT_HINTS = {
    // Config
    AppConfig:        ['AppConfig', 'appConfig'],
    FeatureFlags:     ['FeatureFlags', 'featureFlags'],
    ApiEndpoints:     ['ApiEndpoints', 'APIEndpoints', 'API_ENDPOINTS', 'apiEndpoints'],

    // Data
    StorageAdapter:   ['StorageAdapter'],
    DataManager:      ['DataManager'],
    RequestManager:   ['RequestManager'],
    APIClient:        ['APIClient', 'ApiClient'],

    // Offline
    OfflineManager:   ['OfflineManager'],

    // Integrations
    PubMedIntegration:['PubMedIntegration'],
    ClinicalTrials:   ['ClinicalTrials'],
    MeshIntegration:  ['MeshIntegration'],

    // UI
    UIController:     ['UIController'],
    Forms:            ['Forms'],
    Notifications:    ['Notifications'],
    SearchFilter:     ['SearchFilter'],
    IntegratedHelp:   ['IntegratedHelp'],

    // Workflows
    ILLWorkflow:      ['ILLWorkflow'],
    BulkUpload:       ['BulkUpload'],
    ExportManager:    ['ExportManager'],
  };

  // ===== Module definitions (order only; the files may define globals) =====
  const MODULES = SS.moduleDefinitions || {
    // Config
    AppConfig:        { path: 'modules/config/app-config.js',        dependencies: [] },
    FeatureFlags:     { path: 'modules/config/feature-flags.js',     dependencies: [] },
    ApiEndpoints:     { path: 'modules/config/api-endpoints.js',     dependencies: [] },

    // Data chain
    StorageAdapter:   { path: 'modules/data/storage-adapter.js',     dependencies: [] },
    DataManager:      { path: 'modules/data/data-manager.js',        dependencies: ['StorageAdapter'] },
    RequestManager:   { path: 'modules/data/request-manager.js',     dependencies: ['DataManager'] },
    APIClient:        { path: 'modules/data/api-client.js',          dependencies: ['RequestManager','ApiEndpoints'] },

    // Offline
    OfflineManager:   { path: 'modules/offline/offline-manager.js',  dependencies: [] },

    // Integrations
    PubMedIntegration:{ path: 'modules/integrations/pubmed-integration.js', dependencies: ['APIClient'] },
    ClinicalTrials:   { path: 'modules/integrations/clinical-trials.js',    dependencies: ['APIClient'] },
    MeshIntegration:  { path: 'modules/integrations/mesh-integration.js',   dependencies: ['APIClient'] },

    // UI
    UIController:     { path: 'modules/ui/ui-controller.js',         dependencies: ['RequestManager'] },
    Forms:            { path: 'modules/ui/forms.js',                 dependencies: ['UIController'] },
    Notifications:    { path: 'modules/ui/notifications.js',         dependencies: ['UIController'] },
    SearchFilter:     { path: 'modules/ui/search-filter.js',         dependencies: ['RequestManager'] },
    IntegratedHelp:   { path: 'modules/ui/integrated-help.js',       dependencies: ['UIController'] },

    // Workflows
    ILLWorkflow:      { path: 'modules/workflows/ill-workflow.js',   dependencies: ['RequestManager','UIController'] },
    BulkUpload:       { path: 'modules/workflows/bulk-upload.js',    dependencies: ['RequestManager'] },
    ExportManager:    { path: 'modules/workflows/export-manager.js', dependencies: ['RequestManager'] },
  };

  // ===== Helper: load <script> and await onload/error =====
  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src; el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(el);
    });
  }

  // ===== Helper: try to auto-register a module by scanning globals =====
  function tryAutoRegister(name) {
    if (SS.modules[name]) return true; // already registered
    const hints = EXPORT_HINTS[name] || [name];

    for (const h of hints) {
      const cand =
        SS[h] ??
        W[h] ??
        (W.SilentStacks && W.SilentStacks[h]) ??
        undefined;

      if (cand) {
        SS.registerModule(name, cand);
        log(`📦 Auto-registered ${name} via global "${h}"`);
        return true;
      }
    }

    // Some modules only log “loaded” but don’t export. If the file ran,
    // at least mark as “seen” so dependents can continue. We won’t
    // add an API object, but we won’t block the graph either.
    return false;
  }

  // ===== Topological order =====
  function topoOrder(defs) {
    const visited = new Set(), out = [];
    const visit = (n) => {
      if (visited.has(n)) return;
      visited.add(n);
      for (const d of (defs[n]?.dependencies || [])) if (defs[d]) visit(d);
      out.push(n);
    };
    Object.keys(defs).forEach(visit);
    return out;
  }

  // ===== Loader =====
  class Loader {
    constructor(defs) {
      this.defs = defs;
      this.loaded = new Set();
      this.failed = new Set();
      this.t0 = performance.now();
    }

    async loadOne(name) {
      const def = this.defs[name];
      if (!def) throw new Error(`Unknown module: ${name}`);

      // Ensure dependencies have been marked loaded
      for (const dep of def.dependencies) {
        if (!this.loaded.has(dep)) {
          throw new Error(`Dependency ${dep} not loaded for module ${name}`);
        }
      }

      if (SS.modules[name]) { this.loaded.add(name); log(`✅ ${name}: pre-registered`); return; }

      // Load the script
      await injectScript(def.path);

      // First attempt: auto-register immediately
      if (tryAutoRegister(name)) { this.loaded.add(name); log(`✅ ${name}: loaded`); return; }

      // Second attempt: poll briefly in case the script registers asynchronously
      const deadline = performance.now() + 1500;
      while (performance.now() < deadline) {
        if (SS.modules[name]) { this.loaded.add(name); log(`✅ ${name}: registered late`); return; }
        if (tryAutoRegister(name)) { this.loaded.add(name); log(`✅ ${name}: auto-registered late`); return; }
        await new Promise(r => setTimeout(r, 50));
      }

      // Give up but don’t block the rest—record failure and continue
      this.failed.add(name);
      warn(`❌ ${name}: did not register (continuing)`);
    }

    async loadAll() {
      const order = topoOrder(this.defs);
      log('📋 Load order:', order.join(' → '));
      for (const n of order) {
        try {
          await this.loadOne(n);
        } catch (e) {
          this.failed.add(n);
          err(`❌ ${n}:`, e.message);
        }
      }
      const ms = Math.round(performance.now() - this.t0);
      log(`📊 Modules: ${this.loaded.size}/${order.length} loaded in ${ms}ms; failed: ${[...this.failed].join(', ') || 'none'}`);

      // Kick UI if present
      try {
        SS.modules.UIController?.initialize?.();
      } catch (e) {
        err('UI initialize failed:', e.message);
      }
    }
  }

  // ===== Start after DOM is ready (Firefox-safe) =====
  const start = () => new Loader(MODULES).loadAll();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    if ('requestIdleCallback' in W) W.requestIdleCallback(start, { timeout: 1 });
    else setTimeout(start, 0);
  }
})();
