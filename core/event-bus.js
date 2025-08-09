// core/event-bus.js
// SilentStacks v2.0 — tiny, robust pub/sub with once(), wildcard, and metrics

(() => {
  'use strict';

  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.core = SS.core || {};

  if (SS.core.eventBus) {
    console.log('📡 EventBus already present — skipping redefine');
    return;
  }

  class EventBus {
    constructor() {
      this._listeners = new Map(); // event -> Set<fn>
      this._wildcards = new Set(); // Set<fn(evt, payload)>
      this._counts = new Map();    // event -> emit count
      this.initialized = true;
      this.errors = [];
      this.lastActivity = new Date().toISOString();
    }

    on(event, fn) {
      if (!event || typeof fn !== 'function') return this;
      if (!this._listeners.has(event)) this._listeners.set(event, new Set());
      this._listeners.get(event).add(fn);
      return this;
    }

    off(event, fn) {
      if (!event) return this;
      if (!fn) { this._listeners.delete(event); return this; }
      this._listeners.get(event)?.delete(fn);
      return this;
    }

    once(event, fn) {
      const wrapper = (payload) => { try { fn(payload); } finally { this.off(event, wrapper); } };
      return this.on(event, wrapper);
    }

    onAny(fn) {
      if (typeof fn === 'function') this._wildcards.add(fn);
      return this;
    }

    offAny(fn) {
      this._wildcards.delete(fn);
      return this;
    }

    emit(event, payload) {
      if (!event) return false;
      this.lastActivity = new Date().toISOString();

      // per-event listeners
      const set = this._listeners.get(event);
      if (set) {
        set.forEach(fn => {
          try { fn(payload); }
          catch (e) { this._recordError(`listener failed for "${event}"`, e); }
        });
      }

      // wildcard listeners
      if (this._wildcards.size) {
        this._wildcards.forEach(fn => {
          try { fn(event, payload); }
          catch (e) { this._recordError(`wildcard failed for "${event}"`, e); }
        });
      }

      // metrics
      this._counts.set(event, (this._counts.get(event) || 0) + 1);
      return true;
    }

    count(event) { return this._counts.get(event) || 0; }

    _recordError(message, error) {
      const rec = {
        message,
        error: error?.message || String(error),
        stack: error?.stack || null,
        ts: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error', module: 'EventBus', message, error: rec.error
      });
    }

    getHealthStatus() {
      return {
        name: 'EventBus',
        status: 'healthy',
        initialized: true,
        listeners: Array.from(this._listeners.keys()).length,
        wildcardListeners: this._wildcards.size,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5)
      };
    }
  }

  SS.core.eventBus = new EventBus();
  console.log('📡 EventBus ready');
})();