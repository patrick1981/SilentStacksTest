// core/bootstrap.js
// SilentStacks v2.0 – Bootstrap with WSOD-proof crash overlay + dynamic module loader
(() => {
  'use strict';

  // ===== Crash Overlay (shows any runtime error on screen) =====
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
        const btn = el.querySelector('#ss-crash-retry');
        btn?.addEventListener('click', () => location.reload());
      } catch (_) { /* never throw from overlay */ }
    };

    window.addEventListener('error', (e) => {
      show('Window Error', String(e.message || e.error || 'Unknown error'), e.error?.stack || '');
    });
    window.addEventListener('unhandledrejection', (e) => {
      const reason = e.reason instanceof Error ? e.reason : new Error(String(e.reason));
      show('Unhandled Promise Rejection', String(reason.message || reason), reason.stack || '');
    });
  })();

  // ===== Safe DOM utils (never throw) =====
  function safe(fn) { try { return fn(); } catch { /* no-op */ } }
  function ensureDiagnosticsPane() {
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
        <div id="ss-actions" style="display:flex;gap:.5rem;flex-wrap:wrap;"></div>
      `;
      const target = document.querySelector('main, #main, body') || document.body || document.documentElement;
      target.insertBefore(pane, target.firstChild);
      return pane;
    });
  }
  function setStatus(status, modulesLoaded, totalModules, initTimeMs) {
    safe(() => {
      const pane = ensureDiagnosticsPane();
      const el = pane?.querySelector('#ss-status');
      if (!el) return;
      el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(4,auto);gap:1rem;align-items:center;">
          <div><strong>System Status</strong><div>${status}</div></div>
          <div><strong>Modules</strong><div>${modulesLoaded}/${totalModules} loaded</div></div>
          <div><strong>Init Time</strong><div>${Math.round(initTimeMs)}ms</div></div>
          <div><strong>Loading integrations…</strong><div>📚</div></div>
        </div>`;
    });
  }
  function setSteps(steps) {
    safe(() => {
      const pane = ensureDiagnosticsPane();
      const el = pane?.querySelector('#ss-steps');
      if (!el) return;
      const rows = steps.map(s => `
        <tr>
          <td style="padding:.25rem .5rem;">${s.ok ? '✅' : s.done ? '❌' : '⏳'}</td>
          <td style="padding:.25rem .5rem;">${s.label}</td>
          <td style="padding:.25rem .5rem;text-align:right;white-space:nowrap;">${s.timeMs ?? 0}ms</td>
        </tr>`).join('');
      el.innerHTML = `
        <details open>
          <summary style="font-weight:600">Initialization Steps</summary>
          <table style="width:100%;border-collapse:collapse;margin-top:.25rem;">
            <thead><tr><th style="text-align:left;padding:.25rem .5rem;">Status</th><th style="text-align:left;padding:.25rem .5rem;">Step</th><th style="text-align:right;padding:.25rem .5rem;">Time</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </details>`;
    });
  }
  function setOrder(order, failures = new Set()) {
    safe(() => {
      const pane = ensureDiagnosticsPane();
      const el = pane?.querySelector('#ss-order');
      if (!el) return;
      const items = order.map(m => `<li style="margin:.125rem 0;">${failures.has(m) ? '❌' : '⏳'} ${m}</li>`).join('');
      el.innerHTML = `
        <details open>
          <summary style="font-weight:600">Module Load Order</summary>
          <ul style="margin:.25rem 0 0 .75rem;list-style:none;padding:0;">${items}</ul>
        </details>`;
    });
  }
  function setActions(onRetry) {
    safe(() => {
      const pane = ensureDiagnosticsPane();
      const el = pane?.querySelector('#ss-actions');
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

  // ===== Global namespace =====
  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.modules = SS.modules || {};
  SS.core = SS.core || {};

  // Registration shim
  SS.registerModule = function registerModule(name, api) {
    SS.modules[name] = api;
  };

  // ===== Module Loader =====
  class ModuleLoader {
    constructor() {
      this.moduleDefinitions = SS.moduleDefinitions || {
        RequestManager: { path: 'modules/data/request-manager.js', dependencies: [] },
        APIClient: { path: 'modules/net/api-client.js', dependencies: ['RequestManager'] },
        StorageAdapter: { path: 'modules/storage/storage-adapter.js', dependencies: [] },
        UIController: { path: 'modules/ui/ui-controller.js', dependencies: ['RequestManager', 'StorageAdapter'] },
        Forms: { path: 'modules/ui/forms.js', dependencies: ['UIController'] },
        SearchFilter: { path: 'modules/search/search-filter.js', dependencies: ['RequestManager'] },
        Notifications: { path: 'modules/ui/notifications.js', dependencies: ['UIController'] },
        ILLWorkflow: { path: 'modules/workflows/ill-workflow.js', dependencies: ['RequestManager', 'UIController'] },
        BulkUpload: { path: 'modules/bulk/bulk-upload.js', dependencies: ['RequestManager'] },
        ExportManager: { path: 'modules/export/export-manager.js', dependencies: ['RequestManager'] },
        PubMedIntegration: { path: 'modules/integrations/pubmed.js', dependencies: ['APIClient'] },
        ClinicalTrials: { path: 'modules/integrations/clinicaltrials.js', dependencies: ['APIClient'] },
        MeshIntegration: { path: 'modules/integrations/mesh.js', dependencies: ['APIClient'] },
      };

      this.loadedModules = new Set();
      this.failures = new Set();
      this.steps = [
        { key: 'config', label: 'Loading Configuration', done: false, ok: false, timeMs: 0 },
        { key: 'core', label: 'Initializing Core Systems', done: false, ok: false, timeMs: 0 },
        { key: 'defs', label: 'Loading Module Definitions', done: false, ok: false, timeMs: 0 },
        { key: 'deps', label: 'Resolving Dependencies', done: false, ok: false, timeMs: 0 },
        { key: 'mods', label: 'Loading Modules', done: false, ok: false, timeMs: 0 },
      ];
      this._t0 = performance.now();
      this.status = 'initializing';
      setActions(() => this.initialize(true));
    }

    _markStep(key, ok, t0) {
      const step = this.steps.find(s => s.key === key);
      if (step) { step.done = true; step.ok = !!ok; step.timeMs = Math.max(0, Math.round(performance.now() - t0)); }
      setSteps(this.steps);
      setStatus(this.status, this.loadedModules.size, Object.keys(this.moduleDefinitions).length, performance.now() - this._t0);
    }

    getOrder() { return Object.keys(this.moduleDefinitions); }

    async injectScript(src) {
      return new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.async = true;
        el.onload = () => resolve();
        el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(el);
      });
    }

    async waitFor(condFn, timeout = 2500, errMsg = 'Timed out') {
      const start = performance.now();
      while (performance.now() - start < timeout) {
        try { if (condFn()) return; } catch { /* ignore */ }
        await new Promise(r => setTimeout(r, 50));
      }
      throw new Error(errMsg);
    }

    async loadSingleModule(name) {
      const def = this.moduleDefinitions[name];
      if (!def) throw new Error(`Module definition not found: ${name}`);

      // deps first
      for (const dep of def.dependencies) {
        if (!this.loadedModules.has(dep)) {
          throw new Error(`Dependency ${dep} not loaded for module ${name}`);
        }
      }

      if (SS.modules[name]) { this.loadedModules.add(name); return { status: 'loaded' }; }

      await this.injectScript(def.path);
      await this.waitFor(() => !!SS.modules[name], 2500, `Module ${name} did not register itself`);
      this.loadedModules.add(name);
      return { status: 'loaded' };
    }

    async loadAllModules() {
      const order = this.getOrder();
      setOrder(order, this.failures);
      for (const name of order) {
        try {
          await this.loadSingleModule(name);
        } catch (err) {
          console.error(`❌ Module ${name} failed:`, err);
          this.failures.add(name);
          setOrder(order, this.failures);
          // continue to surface all failures
        }
      }
    }

    _detectSimpleCycle() {
      const defs = this.moduleDefinitions;
      const visiting = new Set(), visited = new Set();
      const dfs = (n) => {
        if (visiting.has(n)) return true;
        if (visited.has(n)) return false;
        visiting.add(n);
        for (const d of (defs[n]?.dependencies || [])) if (dfs(d)) return true;
        visiting.delete(n); visited.add(n); return false;
      };
      return Object.keys(defs).some(dfs);
    }

    async initialize(isRetry = false) {
      try {
        this.status = 'initializing';
        setStatus(this.status, this.loadedModules.size, Object.keys(this.moduleDefinitions).length, performance.now() - this._t0);
        setSteps(this.steps);
        setOrder(this.getOrder(), this.failures);
        ensureDiagnosticsPane();

        // config
        let t = performance.now();
        // (config hooks here)
        this._markStep('config', true, t);

        // core
        t = performance.now();
        // (core setup here)
        this._markStep('core', true, t);

        // defs
        t = performance.now();
        this.moduleDefinitions = SS.moduleDefinitions || this.moduleDefinitions;
        this._markStep('defs', true, t);

        // deps
        t = performance.now();
        const cyc = this._detectSimpleCycle();
        this._markStep('deps', !cyc, t);
        if (cyc) throw new Error('Dependency cycle detected');

        // mods
        t = performance.now();
        await this.loadAllModules();
        const ok = this.failures.size === 0;
        this._markStep('mods', ok, t);

        this.status = ok ? 'ready' : 'degraded';
        setStatus(this.status, this.loadedModules.size, Object.keys(this.moduleDefinitions).length, performance.now() - this._t0);
      } catch (err) {
        console.error('🚨 Bootstrap initialization failed:', err);
        this.status = 'error';
        setStatus('error', this.loadedModules.size, Object.keys(this.moduleDefinitions).length, performance.now() - this._t0);
        // NOTE: crash overlay will already show the error
      }
    }
  }

  // Expose loader
  const loader = new ModuleLoader();
  SS.core.moduleLoader = loader;

  // Minimal no-op for missing a11y helper (avoid 404 side-effects)
  SS.a11y = SS.a11y || { ready: true };

  // Start safely after DOM is ready
  const start = () => loader.initialize(false);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    // Give the DOM a tick to paint in case heavy scripts are queued
    (window.requestIdleCallback || setTimeout)(start, 0);
  }
})();
