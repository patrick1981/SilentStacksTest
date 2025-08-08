// utils/debug-utils.js
(() => {
  'use strict';

  /**
   * DebugUtils
   * Performance profiling, memory usage hints, network monitor hooks.
   * Exposed at window.SilentStacks.utils.debug
   */
  class DebugUtils {
    static dependencies = [];
    static required = false;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.marks = new Map(); // label -> time
      this.networkEvents = [];
    }

    async initialize() {
      try {
        window.SilentStacks = window.SilentStacks || {};
        window.SilentStacks.utils = window.SilentStacks.utils || {};
        window.SilentStacks.utils.debug = {
          mark: (label) => this.mark(label),
          measure: (label) => this.measure(label),
          memorySnapshot: () => this.memorySnapshot(),
          getNetworkEvents: () => [...this.networkEvents],
          attachNetworkListeners: () => this.attachNetworkListeners(),
          detachNetworkListeners: () => this.detachNetworkListeners()
        };

        // Attach listeners if debug on
        if (window.SilentStacks?.config?.debug) this.attachNetworkListeners();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'DebugUtils' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    mark(label) {
      this.marks.set(label, performance.now());
    }

    measure(label) {
      const start = this.marks.get(label);
      if (start == null) return null;
      const ms = performance.now() - start;
      this.marks.delete(label);
      return ms;
    }

    memorySnapshot() {
      const nav = performance?.memory;
      if (!nav) return { supported: false };
      return {
        supported: true,
        jsHeapSizeLimit: nav.jsHeapSizeLimit,
        totalJSHeapSize: nav.totalJSHeapSize,
        usedJSHeapSize: nav.usedJSHeapSize
      };
    }

    attachNetworkListeners() {
      if (this._attached) return;
      const bus = window.SilentStacks?.core?.eventBus;
      if (!bus?.on) return;

      this._onQueued = (e) => this._pushNet('queued', e);
      this._onStarted = (e) => this._pushNet('started', e);
      this._onCompleted = (e) => this._pushNet('completed', e);
      this._onFailed = (e) => this._pushNet('failed', e);
      this._onRetry = (e) => this._pushNet('retry', e);

      bus.on('net:queued', this._onQueued);
      bus.on('net:started', this._onStarted);
      bus.on('net:completed', this._onCompleted);
      bus.on('net:failed', this._onFailed);
      bus.on('net:retry', this._onRetry);

      this._attached = true;
    }

    detachNetworkListeners() {
      if (!this._attached) return;
      const bus = window.SilentStacks?.core?.eventBus;
      if (!bus?.off) return;

      bus.off('net:queued', this._onQueued);
      bus.off('net:started', this._onStarted);
      bus.off('net:completed', this._onCompleted);
      bus.off('net:failed', this._onFailed);
      bus.off('net:retry', this._onRetry);

      this._attached = false;
    }

    _pushNet(type, payload) {
      this.networkEvents.push({
        type,
        at: new Date().toISOString(),
        payload
      });
      if (this.networkEvents.length > 5000) {
        this.networkEvents = this.networkEvents.slice(-2500);
      }
    }

    getHealthStatus() {
      return {
        name: 'DebugUtils',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: { eventsTracked: this.networkEvents.length }
      };
    }

    recordError(message, error) {
      const rec = {
        message,
        error: error?.message || String(error),
        stack: (window.SilentStacks?.config?.debug ? error?.stack : undefined),
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'DebugUtils',
        message,
        error: rec.error
      });
    }
  }

  const moduleInstance = new DebugUtils();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('DebugUtils', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.DebugUtils = moduleInstance;
  }

  console.log('🧰 DebugUtils loaded');
})();
