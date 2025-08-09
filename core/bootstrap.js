// core/bootstrap.js
// SilentStacks v2.0 – Bootstrap & Dynamic Module Loader (FULL FILE)
// - Loads module definitions
// - Resolves dependencies and dynamically injects scripts
// - Renders diagnostics UI with step status
// - Exposes core on window.SilentStacks.core

(() => {
  'use strict';

  // Ensure global namespace
  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.modules = SS.modules || {};
  SS.core = SS.core || {};

  // ===== Utilities =====
  const now = () => performance.now();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ===== Diagnostics UI =====
  function ensureDiagnosticsPane() {
    let pane = document.getElementById('ss-diagnostics');
    if (pane) return pane;

    pane = document.createElement('section');
    pane.id = 'ss-diagnostics';
    pane.setAttribute('aria-live', 'polite');
    pane.style.cssText =
      'font-family:system-ui,Arial,sans-serif;max-width:920px;margin:1rem auto;padding:1rem;border:1px solid #ddd;border-radius:12px;background:var(--card, #fff);';
    pane.innerHTML = `
      <h2 style="margin:0 0 .5rem;font-size:1.125rem;">🔧 SilentStacks v2.0 Diagnostics</h2>
      <div id="ss-status" style="margin:.5rem 0 1rem;"></div>
      <div id="ss-steps" style="margin:.5rem 0 1rem;"></div>
      <div id="ss-order" style="margin:.5rem 0 1rem;"></div>
      <div id="ss-actions" style="display:flex;gap:.5rem;flex-wrap:wrap;"></div>
    `;
    // Try to drop it near top, but never crash if missing
    const target =
      document.getElementById('main') ||
      document.querySelector('main') ||
      document.body;
    target.insertBefore(pane, target.firstChild);
    return pane;
  }

  function renderStatus({ status, modulesLoaded, totalModules, initTimeMs }) {
    const el = document.getElementById('ss-status') || ensureDiagnosticsPane();
    const node = document.getElementById('ss-status') || el.querySelector('#ss-status');
    if (!node) return;

    node.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,auto);gap:1rem;align-items:center;">
        <div><strong>System Status</strong><div>${status}</div></div>
        <div><strong>Modules</strong><div>${modulesLoaded}/${totalModules} loaded</div></div>
        <div><strong>Init Time</strong><div>${Math.round(initTimeMs)}ms</div></div>
        <div><strong>Loading integrations…</strong><div>📚</div></div>
      </div>
    `;
  }

  function renderSteps(steps) {
    const pane = ensureDiagnosticsPane();
    const el = pane.querySelector('#ss-steps');
    if (!el) return;

    const rows = steps
      .map(
        (s) =>
          `<tr>
            <td style="padding:.25rem .5rem;">${s.ok ? '✅' : s.done ? '❌' : '⏳'}</td>
            <td style="padding:.25rem .5rem;">${s.label}</td>
            <td style="padding:.25rem .5rem;text-align:right;white-space:nowrap;">${s.timeMs ?? 0}ms</td>
          </tr>`
      )
      .join('');

    el.innerHTML = `
      <details open>
        <summary style="font-weight:600">Initialization Steps</summary>
        <table style="width:100%;border-collapse:collapse;margin-top:.25rem;">
          <thead>
            <tr>
              <th style="text-align:left;padding:.25rem .5rem;">Status</th>
              <th style="text-align:left;padding:.25rem .5rem;">Step</th>
              <th style="text-align:right;padding:.25rem .5rem;">Time</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </details>
    `;
  }

  function renderOrder(order, failures = new Set()) {
    const pane = ensureDiagnosticsPane();
    const el = pane.querySelector('#ss-order');
    if (!el) return;

    const items = order
      .map((m) => {
        const failed = failures.has(m);
        return `<li style="margin:.125rem 0;">${failed ? '❌' : '⏳'} ${m}</li>`;
      })
      .join('');

    el.innerHTML = `
      <details open>
        <summary style="font-weight:600">Module Load Order</summary>
        <ul style="margin:.25rem 0 0 .75rem;list-style:none;padding:0;">${items}</ul>
      </details>
    `;
  }

  function renderActions({ onRetry }) {
    const pane = ensureDiagnosticsPane();
    const el = pane.querySelector('#ss-actions');
    if (!el) return;

    el.innerHTML = '';
    const btn = document.createElement('button');
    btn.textContent = 'Retry Load';
    btn.type = 'button';
    btn.style.cssText =
      'padding:.5rem .75rem;border:1px solid #ccc;border-radius:8px;background:#f9f9f9;cursor:pointer;';
    btn.addEventListener('click', () => onRetry?.());
    el.appendChild(btn);
  }

  // ===== Module Loader =====
  class ModuleLoader {
    constructor() {
      // Accept externally provided definitions or use defaults
      this.moduleDefinitions =
        SS.moduleDefinitions ||
        {
          RequestManager: {
            path: 'modules/data/request-manager.js',
            dependencies: [],
          },
          APIClient: {
            path: 'modules/net/api-client.js',
            dependencies: ['RequestManager'],
          },
          StorageAdapter: {
            path: 'modules/storage/storage-adapter.js',
            dependencies: [],
          },
          UIController: {
            path: 'modules/ui/ui-controller.js',
            dependencies: ['RequestManager', 'StorageAdapter'],
          },
          Forms: {
            path: 'modules/ui/forms.js',
            dependencies: ['UIController'],
          },
          SearchFilter: {
            path: 'modules/search/search-filter.js',
            dependencies: ['RequestManager'],
          },
          Notifications: {
            path: 'modules/ui/notifications.js',
            dependencies: ['UIController'],
          },
          ILLWorkflow: {
            path: 'modules/workflows/ill-workflow.js',
            dependencies: ['RequestManager', 'UIController'],
          },
          BulkUpload: {
            path: 'modules/bulk/bulk-upload.js',
            dependencies: ['RequestManager'],
          },
          ExportManager: {
            path: 'modules/export/export-manager.js',
            dependencies: ['RequestManager'],
          },
          PubMedIntegration: {
            path: 'modules/integrations/pubmed.js',
            dependencies: ['APIClient'],
          },
          ClinicalTrials: {
            path: 'modules/integrations/clinicaltrials.js',
            dependencies: ['APIClient'],
          },
          MeshIntegration: {
            path: 'modules/integrations/mesh.js',
            dependencies: ['APIClient'],
          },
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

      this._t0 = now();
      this.status = 'initializing';
      renderActions({ onRetry: () => this.initialize(true) });
    }

    _markStep(key, ok, tStart) {
      const step = this.steps.find((s) => s.key === key);
      if (!step) return;
      step.done = true;
      step.ok = !!ok;
      step.timeMs = Math.max(0, Math.round(now() - tStart));
      renderSteps(this.steps);
      renderStatus({
        status: this.status,
        modulesLoaded: this.loadedModules.size,
        totalModules: Object.keys(this.moduleDefinitions).length,
        initTimeMs: now() - this._t0,
      });
    }

    getOrder() {
      return Object.keys(this.moduleDefinitions);
    }

    async injectScript(src) {
      await new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.async = true;
        el.onload = resolve;
        el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(el);
      });
    }

    async waitFor(condFn, timeout = 2000, errMsg = 'Timed out') {
      const start = now();
      while (now() - start < timeout) {
        if (condFn()) return;
        await sleep(50);
      }
      throw new Error(errMsg);
    }

    // ===== PATCHED dynamic single-module loader =====
    async loadSingleModule(name) {
      const definition = this.moduleDefinitions[name];
      if (!definition) throw new Error(`Module definition not found: ${name}`);

      // Ensure dependencies first
      for (const dep of definition.dependencies) {
        if (!this.loadedModules.has(dep)) {
          throw new Error(`Dependency ${dep} not loaded for module ${name}`);
        }
      }

      // Already registered
      if (SS.modules[name]) {
        this.loadedModules.add(name);
        return { status: 'loaded' };
      }

      // Dynamically fetch the module by its declared path
      await this.injectScript(definition.path);

      // Wait up to 2s for it to self-register
      await this.waitFor(
        () => !!SS.modules[name],
        2000,
        `Module ${name} did not register itself`
      );

      this.loadedModules.add(name);
      return { status: 'loaded' };
    }

    async loadAllModules() {
      const order = this.getOrder();
      renderOrder(order, this.failures);

      for (const name of order) {
        try {
          await this.loadSingleModule(name);
        } catch (err) {
          console.error(`❌ Module ${name} failed:`, err);
          this.failures.add(name);
          renderOrder(order, this.failures);
          // Continue loading the rest to show as many failures as possible
        }
      }
    }

    async initialize(isRetry = false) {
      try {
        this.status = 'initializing';
        renderStatus({
          status: this.status,
          modulesLoaded: this.loadedModules.size,
          totalModules: Object.keys(this.moduleDefinitions).length,
          initTimeMs: now() - this._t0,
        });
        renderSteps(this.steps);
        renderOrder(this.getOrder(), this.failures);
        ensureDiagnosticsPane();

        // Step: config
        let t = now();
        // (Place any config discovery here)
        this._markStep('config', true, t);

        // Step: core
        t = now();
        // (Any core setup beyond this file)
        this._markStep('core', true, t);

        // Step: defs
        t = now();
        // Allow external replacement of definitions via window.SilentStacks.moduleDefinitions
        this.moduleDefinitions = SS.moduleDefinitions || this.moduleDefinitions;
        this._markStep('defs', true, t);

        // Step: deps (basic cycle check)
        t = now();
        const hasCycle = this._detectSimpleCycle();
        this._markStep('deps', !hasCycle, t);
        if (hasCycle) throw new Error('Dependency cycle detected');

        // Step: mods
        t = now();
        await this.loadAllModules();
        const ok = this.failures.size === 0;
        this._markStep('mods', ok, t);

        this.status = ok ? 'ready' : 'degraded';
        renderStatus({
          status: this.status,
          modulesLoaded: this.loadedModules.size,
          totalModules: Object.keys(this.moduleDefinitions).length,
          initTimeMs: now() - this._t0,
        });
      } catch (err) {
        console.error('🚨 Bootstrap initialization failed:', err);
        this.status = 'error';
        renderStatus({
          status: 'error',
          modulesLoaded: this.loadedModules.size,
          totalModules: Object.keys(this.moduleDefinitions).length,
          initTimeMs: now() - this._t0,
        });
      }
    }

    _detectSimpleCycle() {
      // Very light cycle detection to catch obvious mistakes
      const defs = this.moduleDefinitions;
      const visiting = new Set();
      const visited = new Set();

      const dfs = (node) => {
        if (visiting.has(node)) return true; // cycle
        if (visited.has(node)) return false;
        visiting.add(node);
        const deps = defs[node]?.dependencies || [];
        for (const d of deps) {
          if (dfs(d)) return true;
        }
        visiting.delete(node);
        visited.add(node);
        return false;
      };

      return Object.keys(defs).some((k) => dfs(k));
    }
  }

  // Expose a simple registration shim for modules:
  //   window.SilentStacks.registerModule('Name', apiObject)
  SS.registerModule = function registerModule(name, api) {
    SS.modules[name] = api;
  };

  // Expose loader
  const loader = new ModuleLoader();
  SS.core.moduleLoader = loader;

  // Provide a minimal placeholder for missing a11y utils if the tag exists but file is absent
  // (Safe no-op; remove if you add a real file)
  SS.a11y = SS.a11y || {};
  if (!SS.a11y.ready) {
    SS.a11y.ready = true;
  }

  // Kick off after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loader.initialize(false), { once: true });
  } else {
    loader.initialize(false);
  }
})();
