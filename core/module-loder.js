// core/module-loder.js  (intentionally matches the filename shown in your screenshot)
// SilentStacks v2.0 — dependency-aware module loader (stable registry aware)

(() => {
  'use strict';

  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.core = SS.core || {};

  // Stable modules bag (do not overwrite)
  if (!SS.modules) SS.modules = {};
  const __modulesRef = SS.modules;
  try {
    Object.defineProperty(SS, 'modules', {
      configurable: false,
      enumerable: true,
      get() { return __modulesRef; },
      set(_) { /* ignore overwrite attempts */ }
    });
  } catch { /* older browsers may ignore defineProperty */ }

  // Public, idempotent registry API
  SS.registerModule = SS.registerModule || function registerModule(name, instance) {
    if (!name || !instance) throw new Error('registerModule requires (name, instance)');
    __modulesRef[String(name)] = instance;
    SS.moduleRegistry = SS.moduleRegistry || {};
    SS.moduleRegistry[String(name)] = instance;
  };

  // If a loader already exists, don’t clobber—just stop here.
  if (SS.core.moduleLoader) {
    console.log('🧩 ModuleLoader already present — skipping redefine');
    return;
  }

  class ModuleLoader {
    constructor() {
      this.config = {
        moduleLoadDelay: 0
      };
      this.moduleDefinitions = {
        RequestManager:                { dependencies: [] },
        APIClient:                     { dependencies: [] },
        StorageAdapter:                { dependencies: [] },
        UIController:                  { dependencies: ['RequestManager'] },
        Forms:                         { dependencies: ['UIController', 'RequestManager'] },
        SearchFilter:                  { dependencies: ['RequestManager'] },
        Notifications:                 { dependencies: ['UIController'] },
        ILLWorkflow:                   { dependencies: [] },
        BulkUpload:                    { dependencies: ['RequestManager', 'APIClient'] },
        ExportManager:                 { dependencies: ['RequestManager'] },
        PubMedIntegration:             { dependencies: ['APIClient'] },
        ClinicalTrialsIntegration:     { dependencies: ['APIClient'] },
        MeSHIntegration:               { dependencies: ['APIClient'] }
      };
      this.moduleLoadOrder = [
        'RequestManager',
        'APIClient',
        'StorageAdapter',
        'UIController',
        'Forms',
        'SearchFilter',
        'Notifications',
        'ILLWorkflow',
        'BulkUpload',
        'ExportManager',
        'PubMedIntegration',
        'ClinicalTrialsIntegration',
        'MeSHIntegration'
      ];
      this.loadedModules = new Set();
    }

    delay(ms) { return new Promise(res => setTimeout(res, ms)); }

    isRequiredModule(name) {
      if (name === 'RequestManager') return true;
      const inst = __modulesRef[name];
      if (inst && inst.constructor && typeof inst.constructor.required === 'boolean') {
        return !!inst.constructor.required;
      }
      return false;
    }

    async loadAllModules() {
      const results = [];
      for (const moduleName of this.moduleLoadOrder) {
        try {
          await this.loadSingleModule(moduleName);
          results.push({ name: moduleName, status: 'loaded' });
        } catch (err) {
          console.error('[SilentStacks] Failed to load module', moduleName, err);
          results.push({ name: moduleName, status: 'failed', error: err.message });
          if (this.isRequiredModule(moduleName)) {
            throw new Error(`Required module ${moduleName} failed to load: ${err.message}`);
          }
        }
        await this.delay(this.config.moduleLoadDelay);
      }
      if (SS.config?.debug) console.log('[SilentStacks] 📦 Module loading complete. Loaded:', results.filter(r => r.status === 'loaded').length);
      return results;
    }

    async loadSingleModule(name) {
      const def = this.moduleDefinitions[name];
      if (!def) throw new Error(`Module definition not found: ${name}`);

      // dependency check
      for (const dep of def.dependencies) {
        if (!this.loadedModules.has(dep)) {
          throw new Error(`Dependency ${dep} not loaded for module ${name}`);
        }
      }

      await this.delay(10); // small window for module IIFE registration

      if (!__modulesRef[name]) {
        // Try common variations
        const variations = [name, name.toLowerCase(), name.charAt(0).toLowerCase() + name.slice(1)];
        let found = false;
        for (const v of variations) {
          if (__modulesRef[v]) { __modulesRef[name] = __modulesRef[v]; found = true; break; }
        }
        // Fallback: mirror registry
        if (!found && SS.moduleRegistry && SS.moduleRegistry[name]) {
          __modulesRef[name] = SS.moduleRegistry[name];
          found = true;
        }
        if (!found) {
          const keys = Object.keys(__modulesRef);
          console.warn('[ModuleLoader] modules keys at check time:', keys);
          throw new Error(`Module ${name} did not register itself`);
        }
      }

      this.loadedModules.add(name);
      if (SS.config?.debug) console.log(`[SilentStacks] ✅ Loaded module: ${name}`);

      // initialize if available
      const instance = __modulesRef[name];
      if (instance && typeof instance.initialize === 'function' && !instance.initialized) {
        await instance.initialize();
        if (SS.config?.debug) console.log(`[SilentStacks] 🚀 Initialized: ${name}`);
      }
    }

    notifyRegistered(name) {
      if (SS.config?.debug) console.log('[ModuleLoader] ℹ️ Module reported registered:', name);
    }
  }

  SS.core.moduleLoader = new ModuleLoader();
  console.log('🧩 ModuleLoader ready');
})();
