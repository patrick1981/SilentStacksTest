// core/diagnostics.js
// SilentStacks v2.0 — diagnostics + error capture + simple UI helper

(() => {
  'use strict';

  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.core = SS.core || {};

  if (SS.core.diagnostics) {
    console.log('🩺 Diagnostics already present — skipping redefine');
    return;
  }

  class Diagnostics {
    constructor() {
      this.issues = [];
      this.initialized = true;
      this.lastActivity = new Date().toISOString();

      // Global error taps
      window.addEventListener('error', (e) => {
        this.recordIssue({
          type: 'window-error',
          module: 'global',
          message: e.message || 'Uncaught error',
          error: (e.error && e.error.message) || e.message
        });
      });

      window.addEventListener('unhandledrejection', (e) => {
        this.recordIssue({
          type: 'unhandled-rejection',
          module: 'global',
          message: 'Unhandled Promise rejection',
          error: (e.reason && e.reason.message) || String(e.reason)
        });
      });
    }

    recordIssue(issue) {
      const entry = {
        ts: new Date().toISOString(),
        type: issue?.type || 'info',
        module: issue?.module || 'unknown',
        message: issue?.message || '',
        error: issue?.error || null,
        meta: issue?.meta || null
      };
      this.issues.push(entry);
      if (this.issues.length > 500) this.issues = this.issues.slice(-500);
      this.lastActivity = entry.ts;
      if (SS.config?.debug) console.warn('[Diagnostics]', entry.type, entry.module, entry.message, entry.error || '');
      SS.core.eventBus?.emit('diagnostics:issue', entry);
      return entry;
    }

    getRecent(limit = 50) {
      return this.issues.slice(-limit);
    }

    getHealth() {
      return {
        startedAt: performance.timing?.navigationStart || null,
        issues: this.getRecent(20)
      };
    }

    getHealthStatus() {
      return {
        name: 'Diagnostics',
        status: 'healthy',
        initialized: true,
        issueCount: this.issues.length,
        lastActivity: this.lastActivity,
        recent: this.getRecent(10)
      };
    }

    // Very small UI helper used by “Show Diagnostics” button
    showDiagnostics() {
      const recent = this.getRecent(20)
        .map(i => `${i.ts} — [${i.type}] ${i.module}: ${i.message}${i.error ? `\n  ↳ ${i.error}` : ''}`)
        .join('\n\n');
      alert(recent || 'No recent diagnostics entries.');
    }
  }

  SS.core.diagnostics = new Diagnostics();
  // Small ergonomic alias used in some UI code
  SS.debug = SS.debug || {};
  SS.debug.showDiagnostics = SS.debug.showDiagnostics || (() => SS.core.diagnostics.showDiagnostics());

  console.log('🩺 Diagnostics ready');
})();
