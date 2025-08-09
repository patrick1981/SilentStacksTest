// core/state-manager.js
// SilentStacks v2.0 — centralized, evented state with snapshot + persistence hooks

(() => {
  'use strict';

  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.core = SS.core || {};

  if (SS.core.stateManager) {
    console.log('🧠 StateManager already present — skipping redefine');
    return;
  }

  class StateManager {
    constructor() {
      this._state = new Map();
      this._namespaces = new Set();
      this.initialized = true;
      this.errors = [];
      this.lastActivity = new Date().toISOString();

      // Optional persistence config (off by default)
      this.persistence = {
        enabled: false,
        storageKey: 'silentstacks_state',
        namespaces: [] // if empty, persists everything
      };
    }

    // --- basic API ---
    setState(key, value) {
      const oldValue = this._state.get(key);
      this._state.set(key, value);
      this.lastActivity = new Date().toISOString();

      // Track namespaces ("ns:key")
      const ns = String(key).includes(':') ? String(key).split(':')[0] : null;
      if (ns) this._namespaces.add(ns);

      // Emit event
      SS.core.eventBus?.emit('state:changed', { key, oldValue, value });

      // Persist (optional)
      if (this.persistence.enabled) this._persist();
      return value;
    }

    getState(key, fallback = undefined) {
      return this._state.has(key) ? this._state.get(key) : fallback;
    }

    has(key) {
      return this._state.has(key);
    }

    delete(key) {
      const existed = this._state.delete(key);
      if (existed) {
        this.lastActivity = new Date().toISOString();
        SS.core.eventBus?.emit('state:deleted', { key });
        if (this.persistence.enabled) this._persist();
      }
      return existed;
    }

    clear(namespace = null) {
      if (!namespace) {
        this._state.clear();
        this._namespaces.clear();
      } else {
        const toDelete = [];
        this._state.forEach((_, k) => {
          if (String(k).startsWith(namespace + ':')) toDelete.push(k);
        });
        toDelete.forEach(k => this._state.delete(k));
        this._namespaces.delete(namespace);
      }
      this.lastActivity = new Date().toISOString();
      SS.core.eventBus?.emit('state:cleared', { namespace });
      if (this.persistence.enabled) this._persist();
    }

    // --- snapshots ---
    snapshot(namespace = null) {
      const obj = {};
      this._state.forEach((v, k) => {
        if (!namespace || String(k).startsWith(namespace + ':')) obj[k] = v;
      });
      return obj;
    }

    replace(snapshotObj = {}, namespace = null) {
      if (!snapshotObj || typeof snapshotObj !== 'object') return;
      if (!namespace) {
        this._state = new Map(Object.entries(snapshotObj));
      } else {
        // wipe namespace first
        this.clear(namespace);
        Object.entries(snapshotObj).forEach(([k, v]) => {
          if (String(k).startsWith(namespace + ':')) this._state.set(k, v);
        });
      }
      this.lastActivity = new Date().toISOString();
      SS.core.eventBus?.emit('state:replaced', { namespace });
      if (this.persistence.enabled) this._persist();
    }

    // --- persistence (opt-in) ---
    enablePersistence({ storageKey, namespaces } = {}) {
      if (storageKey) this.persistence.storageKey = storageKey;
      if (Array.isArray(namespaces)) this.persistence.namespaces = namespaces;
      this.persistence.enabled = true;
      this._persist(); // write current state
    }

    disablePersistence() {
      this.persistence.enabled = false;
    }

    restore() {
      try {
        const raw = localStorage.getItem(this.persistence.storageKey);
        if (!raw) return false;
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== 'object') return false;

        // Only restore selected namespaces (if configured)
        if (this.persistence.namespaces.length) {
          for (const [k, v] of Object.entries(obj)) {
            const ns = String(k).split(':')[0];
            if (this.persistence.namespaces.includes(ns)) this._state.set(k, v);
          }
        } else {
          this._state = new Map(Object.entries(obj));
        }

        this.lastActivity = new Date().toISOString();
        SS.core.eventBus?.emit('state:restored', { keys: this._state.size });
        return true;
      } catch (err) {
        this._recordError('State restore failed', err);
        return false;
      }
    }

    _persist() {
      try {
        const obj = {};
        if (this.persistence.namespaces.length) {
          this._state.forEach((v, k) => {
            const ns = String(k).split(':')[0];
            if (this.persistence.namespaces.includes(ns)) obj[k] = v;
          });
        } else {
          this._state.forEach((v, k) => { obj[k] = v; });
        }
        localStorage.setItem(this.persistence.storageKey, JSON.stringify(obj));
      } catch (err) {
        this._recordError('State persist failed', err);
      }
    }

    // --- diagnostics ---
    _recordError(message, error) {
      const rec = {
        message,
        error: error?.message || String(error),
        stack: error?.stack || null,
        ts: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      SS.core.diagnostics?.recordIssue?.({ type: 'error', module: 'StateManager', message, error: rec.error });
    }

    getHealthStatus() {
      return {
        name: 'StateManager',
        status: 'healthy',
        initialized: true,
        keys: this._state.size,
        namespaces: Array.from(this._namespaces),
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5)
      };
    }
  }

  SS.core.stateManager = new StateManager();
  console.log('🧠 StateManager ready');
})();
