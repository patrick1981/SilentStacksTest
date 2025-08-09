// core/bootstrap.js — SilentStacks v2.0 (stable, WSOD-safe, dynamic loader)
(() => {
  'use strict';

  // ===== Crash Overlay =====
  (function attachCrashOverlay() {
    const show = (title, message, stack) => {
      try {
        let el = document.getElementById('ss-crash');
        if (!el) {
          el = document.createElement('div');
          el.id = 'ss-crash';
          el.style.cssText = `
            position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.85);
            color:#fff;font:14px/1.45 system-ui,Segoe UI,Arial,sans-serif;padding:24px;overflow:auto;
          `;
          document.documentElement.appendChild(el);
        }
        el.innerHTML = `
          <div style="max-width:960px;margin:0 auto;">
            <h2 style="margin:0 0 .5rem;font-size:18px">🚨 SilentStacks crashed</h2>
            <pre style="white-space:pre-wrap;background:#111;padding:12px;border-radius:8px">${title}\n${message || ''}</pre>
            ${stack ? `<details open style="margin-top:.75rem"><summary>Stack</summary><pre style="white-space:pre-wrap;background:#111;padding:12px;border-radius:8px">${stack}</pre></details>` : ''}
            <button id="ss-crash-retry" style="margin-top:12px;padding:8px 12px;border:1px solid #666;border-radius:8px;background:#222;color:#fff;cursor:pointer">Retry</button>
          </div>
        `;
        el.querySelector('#ss-crash-retry')?.addEventListener('click', () => location.reload());
      } catch {}
    };
    window.addEventListener('error', (e) => {
      show('Window Error', String(e.message || e.error || 'Unknown error'), e.error?.stack || '');
    });
    window.addEventListener('unhandledrejection', (e) => {
      const reason = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
      show('Unhandled Promise Rejection', String(reason.message || reason), reason.stack || '');
    });
  })();

  // ===== Safe Diagnostics UI =====
  function safe(fn){try{return fn()}catch{}}
  function ensureDiagnosticsPane(){
    return safe(() => {
      let pane = document.getElementById('ss-diagnostics');
      if (pane) return pane;
      pane = document.createElement('section');
      pane.id = 'ss-diagnostics';
      pane.setAttribute('aria-live', 'polite');
      pane.style.cssText = 'font-family:system-ui,Arial,sans-serif;max-width:920px;margin:1rem auto;padding:1rem;border:1px solid #ddd;border-radius:12px;background:#fff;color:#111';
      pane.innerHTML = `
        <h2 style="margin:0 0 .5rem;font-size:1.125rem;">🔧 SilentStacks v2.0 Diagnostics</h2>
        <div id="ss-status" style="margin:.5rem 0 1rem;"></div>
        <div id="ss-steps" style="margin:.5rem 0 1rem;"></div>
        <div id="ss-order" style="margin:.5rem 0 1rem;"></div>
        <div id="ss-actions" style="display:flex;gap:.5rem;flex-wrap:wrap;"></div>`;
      (document.querySelector('main,#main,body') || document.body || document.documentElement)
        .insertBefore(pane, document.body.firstChild);
      return pane;
    });
  }
  function setStatus(status, modulesLoaded, totalModules, initTimeMs){
    safe(() => {
      const el = ensureDiagnosticsPane()?.querySelector('#ss-status');
      if (!el) return;
      el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(4,auto);gap:1rem;align-items:center;">
          <div><strong>System Status</strong><div>${status}</div></div>
          <div><strong>Modules</strong><div>${modulesLoaded}/${totalModules} loaded</div></div>
          <div><strong>Init Time</strong><div>${Math.round(initTimeMs)}ms</div></div>
          <div><strong>Diag</strong><div>active</div></div>
        </div>`;
    });
  }
  function setSteps(steps){
    safe(() => {
      const el = ensureDiagnosticsPane()?.querySelector('#ss-steps');
      if (!el) return;
      const rows = steps.map(s => `
        <tr><td style="padding:.25rem .5rem;">${s.ok ? '✅' : s.done ? '❌' : '⏳'}</td>
            <td style="padding:.25rem .5rem;">${s.label}</td>
            <td style="padding:.25rem .5rem;text-align:right">${s.timeMs ?? 0}ms</td></tr>`).join('');
      el.innerHTML = `
        <details open><summary style="font-weight:600">Initialization Steps</summary>
          <table style="width:100%;border-collapse:collapse;margin-top:.25rem;">
            <thead><tr><th>Status</th><th>Step</th><th style="text-align:right">Time</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </details>`;
    });
  }
  function setOrder(order, failures=new Set()){
    safe(() => {
      const el = ensureDiagnosticsPane()?.querySelector('#ss-order');
      if (!el) return;
      const items = order.map(m => `<li style="margin:.125rem 0;">${failures.has(m)?'❌':'⏳'} ${m}</li>`).join('');
      el.innerHTML = `
        <details open><summary style="font-weight:600">Module Load Order</summary>
          <ul style="margin:.25rem 0 0 .75rem;list-style:none;padding:0;">${items}</ul>
        </details>`;
    });
  }
  function setActions(onRetry){
    safe(() => {
      const el = ensureDiagnosticsPane()?.querySelector('#ss-actions');
      if (!el) return;
      el.innerHTML = '';
      const btn = document.createElement('button');
      btn.textContent = 'Retry Load';
      btn.type = 'button';
      btn.style.cssText = 'padding:.5rem .75rem;border:1px solid #ccc;border-radius:8px;background:#f9f9f9;cursor:pointer';
      btn.addEventListener('click', () => onRetry?.());
      el.appendChild(btn);
    });
  }

  // ===== Namespace & register shim =====
  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.modules = SS.modules || {};
  SS.core = SS.core || {};
  SS.registerModule = function(name, api){ SS.modules[name] = api; };

  // ===== Module Loader =====
  class ModuleLoader {
    constructor(){
      this.moduleDefinitions = SS.moduleDefinitions || {
        // Config
        AppConfig:        { path: 'modules/config/app-config.js',        dependencies: [] },
        FeatureFlags:     { path: 'modules/config/feature-flags.js',     dependencies: [] },
        ApiEndpoints:     { path: 'modules/config/api-endpoints.js',     dependencies: [] },

        // Data
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

      this.loadedModules = new Set();
      this.failures = new Set();
      this.steps = [
        { key: 'config', label: 'Loading Configuration', done:false, ok:false, timeMs:0 },
        { key: 'core',   label: 'Initializing Core Systems', done:false, ok:false, timeMs:0 },
        { key: 'defs',   label: 'Loading Module Definitions', done:false, ok:false, timeMs:0 },
        { key: 'deps',   label: 'Resolving Dependencies', done:false, ok:false, timeMs:0 },
        { key: 'mods',   label: 'Loading Modules', done:false, ok:false, timeMs:0 },
      ];
      this._t0 = performance.now();
      this.status = 'initializing';
      setActions(() => this.initialize(true));
    }

    _markStep(key, ok, t0){
      const s = this.steps.find(x=>x.key===key);
      if (s){ s.done = true; s.ok = !!ok; s.timeMs = Math.max(0, Math.round(performance.now() - t0)); }
      setSteps(this.steps);
      setStatus(this.status, this.loadedModules.size, Object.keys(this.moduleDefinitions).length, performance.now() - this._t0);
    }

    getOrder(){
      const defs = this.moduleDefinitions, visited = new Set(), result = [];
      const visit = (name) => {
        if (visited.has(name)) return;
        visited.add(name);
        const def = defs[name];
        if (def) (def.dependencies || []).forEach(d => defs[d] && visit(d));
        result.push(name);
      };
      Object.keys(defs).forEach(visit);
      return result;
    }

    async injectScript(src){
      return new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src; el.async = true;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(el);
      });
    }

    async waitFor(condFn, timeout=3000, errMsg='Timed out'){
      const start = performance.now();
      while (performance.now() - start < timeout) {
        try { if (condFn()) return; } catch {}
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error(errMsg);
    }

    async loadSingleModule(name){
      const def = this.moduleDefinitions[name];
      if (!def) throw new Error(`Module definition not found: ${name}`);

      // deps
      for (const dep of def.dependencies) {
        if (!this.loadedModules.has(dep)) {
          throw new Error(`Dependency ${dep} not loaded for module ${name}`);
        }
      }

      // already registered?
      if (SS.modules[name]) { this.loadedModules.add(name); return { status:'pre-registered' }; }

      await this.injectScript(def.path);
      await this.waitFor(() => !!SS.modules[name], 3000, `Module ${name} did not register itself`);
      this.loadedModules.add(name);
      return { status:'loaded' };
    }

    async loadAllModules(){
      const order = this.getOrder();
      setOrder(order, this.failures);
      for (const name of order) {
        try {
          const res = await this.loadSingleModule(name);
          console.log(`✅ ${name}: ${res.status}`);
          setOrder(order, this.failures);
        } catch (err) {
          console.error(`❌ Module ${name} failed:`, err.message);
          this.failures.add(name);
          setOrder(order, this.failures);
        }
      }
      return { total: order.length, ok: this.failures.size === 0 };
    }

    _detectSimpleCycle(){
      const defs = this.moduleDefinitions, visiting = new Set(), visited = new Set();
      const dfs = (n) => {
        if (visiting.has(n)) return true;
        if (visited.has(n)) return false;
        visiting.add(n);
        for (const d of (defs[n]?.dependencies || [])) if (dfs(d)) return true;
        visiting.delete(n); visited.add(n); return false;
      };
      return Object.keys(defs).some(dfs);
    }

    async initialize(){
      try {
        this.status = 'initializing';
        setStatus(this.status, this.loadedModules.size, Object.keys(this.moduleDefinitions).length, performance.now() - this._t0);
        setSteps(this.steps); setOrder(this.getOrder(), this.failures); ensureDiagnosticsPane();

        let t = performance.now();
        this._markStep('config', true, t);

        t = performance.now();
        this._markStep('core', true, t);

        t = performance.now();
        this.moduleDefinitions = SS.moduleDefinitions || this.moduleDefinitions;
        this._markStep('defs', true, t);

        t = performance.now();
        const cyc = this._detectSimpleCycle();
        this._markStep('deps', !cyc, t);
        if (cyc) throw new Error('Dependency cycle detected');

        t = performance.now();
        const res = await this.loadAllModules();
        this._markStep('mods', res.ok, t);

        this.status = res.ok ? 'ready' : 'degraded';
        setStatus(this.status, this.loadedModules.size, Object.keys(this.moduleDefinitions).length, performance.now() - this._t0);

        if (SS.modules.UIController?.initialize) {
          // kick UI if available
          setTimeout(() => SS.modules.UIController.initialize(), 100);
        }
      } catch (err) {
        console.error('🚨 Bootstrap initialization failed:', err);
        this.status = 'error';
        setStatus('error', this.loadedModules.size, Object.keys(this.moduleDefinitions).length, performance.now() - this._t0);
      }
    }
  }

  // Expose loader
  const loader = new ModuleLoader();
  SS.core.moduleLoader = loader;

  // ===== Start safely after DOM is ready (Firefox-safe) =====
  const start = () => loader.initialize();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    // Firefox: requestIdleCallback second arg must be an object; fallback to setTimeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: 1 });
    } else {
      setTimeout(start, 0);
    }
  }
})();
