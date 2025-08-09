// modules/offline/offline-manager.js
(() => {
  'use strict';
  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.modules = SS.modules || {};

  // ---- config
  const STORE_KEY = 'ss_offline_queue_v1';
  const MAX_QUEUE = 500;
  const SYNC_TAG = 'ss-flush-queue';
  const BC_NAME = 'ss-offline'; // BroadcastChannel name

  // ---- state
  let flushing = false;
  let backoffMs = 0;
  const listeners = new Set();
  const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel(BC_NAME) : null;

  // ---- persistence
  function loadQueue() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveQueue(q) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(q)); } catch {}
  }
  function getQueue() { return loadQueue(); }

  // ---- helpers
  function normalize(reqLike) {
    if (!reqLike) return null;
    if (typeof reqLike === 'string') {
      return { method: 'GET', url: reqLike, headers: {}, body: null };
    }
    if (reqLike.url) {
      return {
        method: (reqLike.method || 'GET').toUpperCase(),
        url: reqLike.url,
        headers: reqLike.headers || {},
        body: reqLike.body ?? null,
      };
    }
    // fetch(Request, opts)
    if (reqLike instanceof Request) {
      return {
        method: (reqLike.method || 'GET').toUpperCase(),
        url: reqLike.url,
        headers: Object.fromEntries(reqLike.headers.entries()),
        body: reqLike.body || null,
      };
    }
    return null;
  }

  function emit(status) {
    for (const fn of listeners) { try { fn(status); } catch {} }
    try { SS.core?.events?.emit?.('offline:status', status); } catch {}
    // Broadcast to SW/other tabs
    try { bc?.postMessage({ type: 'status', status }); } catch {}
  }

  async function registerBackgroundSync() {
    try {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.ready;
      if (!('sync' in reg)) return false;
      await reg.sync.register(SYNC_TAG);
      return true;
    } catch { return false; }
  }

  async function sendOne(item) {
    // Preferred: APIClient implementation (if present)
    const fn = SS.modules.APIClient?.sendQueuedRequest;
    if (typeof fn === 'function') return fn(item);

    // Fallback: plain fetch
    const init = {
      method: item.method,
      headers: item.headers || {},
      body: item.body ?? null
    };
    const res = await fetch(item.url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  }

  async function flushInternal(customSender) {
    if (flushing) return false;
    flushing = true;

    try {
      if (!navigator.onLine) return false;

      let q = getQueue();
      if (!q.length) return true;

      const sender = typeof customSender === 'function' ? customSender : sendOne;

      // simple backoff guard
      if (backoffMs > 0) {
        await new Promise(r => setTimeout(r, backoffMs));
      }

      const next = q.slice(0);
      q = []; // optimistic: clear, re-add failures
      saveQueue(q);

      for (const item of next) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await sender(item);
        } catch (e) {
          // requeue on network-ish failures
          q.push(item);
        }
      }

      saveQueue(q);
      // adjust backoff
      if (q.length) {
        backoffMs = Math.min((backoffMs || 500) * 2, 60_000);
        return false;
      } else {
        backoffMs = 0;
        return true;
      }
    } finally {
      flushing = false;
    }
  }

  const OfflineManager = {
    initialize() {
      addEventListener('online',  () => { emit('online');  this.flush(); });
      addEventListener('offline', () => { emit('offline'); });

      // Listen for SW/background sync prompts
      try {
        bc?.addEventListener('message', (ev) => {
          const msg = ev?.data;
          if (!msg) return;
          if (msg.type === 'flush' || msg.type === 'sync') {
            this.flush();
          }
        });
      } catch {}

      // best-effort background sync registration
      registerBackgroundSync();

      // initial status
      emit(navigator.onLine ? 'online' : 'offline');
    },

    isOnline() { return navigator.onLine; },

    onStatus(fn) { if (typeof fn === 'function') listeners.add(fn); return () => listeners.delete(fn); },

    enqueue(reqLike) {
      const item = normalize(reqLike);
      if (!item || !item.url) return false;

      const q = getQueue();
      if (q.length >= MAX_QUEUE) q.shift(); // drop oldest
      q.push(item);
      saveQueue(q);

      // Inform SW/other tabs of queue growth (optional)
      try { bc?.postMessage({ type: 'queued', size: q.length }); } catch {}

      return true;
    },

    getQueue() { return getQueue(); },

    async flush(withFn) {
      const ok = await flushInternal(withFn);
      if (ok) try { bc?.postMessage({ type: 'flushed' }); } catch {}
      return ok;
    },

    // Helper: run a producer; if offline/fails, auto-queue request spec
    async runOrQueue(buildRequest) {
      // buildRequest may support { dryRun: true } to return the request spec
      try {
        if (navigator.onLine) return await buildRequest();
      } catch {
        // fallthrough to queue
      }
      const spec = await buildRequest({ dryRun: true });
      this.enqueue(spec);
      return { queued: true };
    }
  };

  // Safe registration
  if (typeof SS.registerModule === 'function') {
    SS.registerModule('OfflineManager', OfflineManager);
  } else {
    SS.modules.OfflineManager = OfflineManager;
  }
})();
