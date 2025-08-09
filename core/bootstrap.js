// core/bootstrap.js — SilentStacks v2 FINAL (auto-register + config-only tolerant)
(() => {
  'use strict';

  // ===== Namespace shim (NEVER overwrite) =====
  const W = window;
  const SS = (W.SilentStacks = W.SilentStacks || {});
  SS.modules = SS.modules || {};
  SS.core = SS.core || {};
  if (typeof SS.registerModule !== 'function') {
    SS.registerModule = function (name, api) { SS.modules[name] = api; };
  }

  // ===== Minimal console diagnostics =====
  const log = (...a) => console.log('[SS]', ...a);
  const warn = (...a) => console.warn('[SS]', ...a);
  const err = (...a) => console.error('[SS]', ...a);

  // ===== Export name hints (for auto-registration) =====
  const EXPORT_HINTS = {
    // Config
    AppConfig:        ['AppConfig', 'appConfig', ['config','AppConfig']], // nested hints supported
    FeatureFlags:     ['FeatureFlags', 'featureFlags', ['config','featureFlags']],
    ApiEndpoints:     ['ApiEndpoints', 'APIEndpoints', 'API_ENDPOINTS', 'apiEndpoints', ['config','api']],

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

  // Modules that are "config-only" (don’t export a runtime API)
  const CONFIG_ONLY = new Set(['AppConfig', 'FeatureFlags', 'ApiEndpoints']);

  // ===== Module definitions (your posted order) =====
  const MODULES = SS.moduleDefinitions || {
    AppConfig:        { path: 'modules/config/app-config.js',        dependencies: [] },
    FeatureFlags:     { path: 'modules/config/feature-flags.js',     dependencies: [] },
    ApiEndpoints:     { path: 'modules/config/api-endpoints.js',     dependencies: [] },

    StorageAdapter:   { path: 'modules/data/storage-adapter.js',     dependencies: [] },
    DataManager:      { path: 'modules/data/data-manager.js',        dependencies: ['StorageAdapter'] },
    RequestManager:   { path: 'modules/data/request-manager.js',     dependencies: ['DataManager'] },
    APIClient:        { path: 'modules/data/api-client.js',          dependencies: ['RequestManager','ApiEndpoints'] },

    OfflineManager:   { path: 'modules/offline/offline-manager.js',  dependencies: [] },

    PubMedIntegration:{ path: 'modules/integrations/pubmed-integration.js', dependencies: ['APIClient'] },
    ClinicalTrials:   { path: 'modules/integrations/clinical-trials.js',    dependencies: ['APIClient'] },
    MeshIntegration:  { path: 'modules/integrations/mesh-integration.js',   dependencies: ['APIClient'] },

    UIController:     { path: 'modules/ui/ui-controller.js',         dependencies: ['RequestManager'] },
    Forms:            { path: 'modules/ui/forms.js',                 dependencies: ['UIController'] },
    Notifications:    { path: 'modules/ui/notifications.js',         dependencies: ['UIController'] },
    SearchFilter:     { path: 'modules/ui/search-filter.js',         dependencies: ['RequestManager'] },
    IntegratedHelp:   { path: 'modules/ui/integrated-help.js',       dependencies: ['UIController'] },

    ILLWorkflow:      { path: 'modules/workflows/ill-workflow.js',   dependencies: ['RequestManager','UIController'] },
    BulkUpload:       { path: 'modules/workflows/bulk-upload.js',    dependencies: ['RequestManager'] },
    ExportManager:    { path: 'modules/workflows/export-manager.js', dependencies: ['RequestManager'] },
  };

  // ===== Utilities =====
  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src; el.async = true;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(el);
    });
  }

  // get nested path like ['config','api'] -> SS.config.api
  function getFromPath(root, pathArr) {
    try {
      return pathArr.reduce((o, k) => (o && o[k] != null ? o[k] : undefined), root);
    } catch { return undefined; }
  }

  // Try to auto-register using hints
  function tryAutoRegister(name) {
    if (SS.modules[name]) return true;
    const hints = EXPORT_HINTS[name] || [name];

    for (const h of hints) {
      let cand;
      if (Array.isArray(h)) {
        cand = getFromPath(SS, h) ?? getFromPath(W, ['SilentStacks', ...h]);
      } else {
        cand = SS[h] ?? W[h] ?? (W.SilentStacks && W.SilentStacks[h]);
      }
      if (cand) {
        SS.registerModule(name, cand);
        log(`📦 Auto-registered ${name} via hint:`, h);
        return true;
      }
    }
    return false;
  }

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

      // Dependencies
      for (const dep of def.dependencies) {
        if (!this.loaded.has(dep)) {
          throw new Error(`Dependency ${dep} not loaded for module ${name}`);
        }
      }

      // Already registered?
      if (SS.modules[name]) { this.loaded.add(name); log(`✅ ${name}: pre-registered`); return; }

      // Load script
      await injectScript(def.path);

      // Immediate attempts
      if (SS.modules[name] || tryAutoRegister(name)) {
        this.loaded.add(name);
        log(`✅ ${name}: loaded`);
        return;
      }

      // Config-only fallback (treat as loaded if no explicit API)
      if (CONFIG_ONLY.has(name)) {
        log(`ℹ️ ${name} is config-only; marking as loaded`);
        this.loaded.add(name);
        return;
      }

      // Give it a short window to self-register async
      const deadline = performance.now() + 1500;
      while (performance.now() < deadline) {
        if (SS.modules[name] || tryAutoRegister(name)) {
          this.loaded.add(name);
          log(`✅ ${name}: registered late`);
          return;
        }
        await new Promise(r => setTimeout(r, 50));
      }

      // Fail (but continue list)
      this.failed.add(name);
      warn(`❌ ${name}: did not register`);
    }

    async loadAll() {
      const order = topoOrder(this.defs);
      log('📋 Load order:', order.join(' → '));

      for (const n of order) {
        try { await this.loadOne(n); }
        catch (e) { this.failed.add(n); err(`❌ ${n}:`, e.message); }
      }

      const ms = Math.round(performance.now() - this.t0);
      log(`📊 Modules: ${this.loaded.size}/${order.length} loaded in ${ms}ms; failed: ${[...this.failed].join(', ') || 'none'}`);

      // Kick UI if present
      try { SS.modules.UIController?.initialize?.(); }
      catch (e) { err('UI initialize failed:', e.message); }
    }
  }

  // ===== Start (Firefox-safe) =====
  const start = () => new Loader(MODULES).loadAll();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    'requestIdleCallback' in W ? W.requestIdleCallback(start, { timeout: 1 }) : setTimeout(start, 0);
  }
})();
