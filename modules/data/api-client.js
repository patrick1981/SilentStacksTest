// modules/data/api-client.js
// SilentStacks v2.0 — Centralized API client with 2 rps throttle, retries,
// signing, sanitization, and offline queue support.

(() => {
  'use strict';

  class APIClient {
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      // Core refs
      this.stateManager = null;
      this.eventBus = null;

      // Config
      const cfg = (window.SilentStacks && window.SilentStacks.config) || {};
      const api = (window.SilentStacks && window.SilentStacks.api) || {};

      this.config = {
        timeoutMs: 30000,
        maxRetries: 3,
        backoffBaseMs: 500, // exponential backoff base
        rateLimitRPS: (cfg.rateLimit && cfg.rateLimit.externalRPS) || 2, // default 2 rps
        politeEmail: (cfg.crossrefEmail || cfg.contactEmail || ''), // used for CrossRef polite pool if provided
        tool: 'SilentStacks',
        ...cfg.apiClient
      };

      // Endpoints (from config/api-endpoints.js)
      this.endpoints = {
        pubmed: api.pubmed || {
          base: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
          esummary: '/esummary.fcgi',
          efetch: '/efetch.fcgi'
        },
        crossref: api.crossref || {
          base: 'https://api.crossref.org',
          works: '/works'
        },
        clinicalTrials: api.clinicalTrials || {
          base: 'https://clinicaltrials.gov/api/query',
          fullStudies: '/full_studies'
        }
      };

      // Rate limiting — token bucket
      this._tokens = this.config.rateLimitRPS;
      this._lastRefill = Date.now();
      this._queue = []; // pending requests
      this._active = 0;

      // Persisted offline queue (requests to try later)
      this._offlineKey = 'silentstacks_api_queue';
      this._offlineQueue = this._loadOfflineQueue();

      // Request signing (session-scoped key)
      this._signingKey = this._initSigningKey();

      // Metrics
      this.metrics = {
        sent: 0,
        retried: 0,
        failed: 0,
        queued: this._offlineQueue.length,
        avgLatencyMs: 0
      };
    }

    // ---------- Initialization ----------
    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager || null;
        this.eventBus = window.SilentStacks?.core?.eventBus || null;

        // Refill tokens once per 1000ms tick
        setInterval(() => this._refillTokens(), 1000);

        // On regain online, try to flush offline queue
        window.addEventListener('online', () => this.flushOfflineQueue());
        // Listen for SW sync pings
        navigator.serviceWorker?.addEventListener?.('message', (evt) => {
          if (evt?.data?.type === 'SS_SYNC_REQUESTS') this.flushOfflineQueue();
        });

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('APIClient initialized');
        return { status: 'success', module: 'APIClient' };
      } catch (err) {
        this.recordError('Initialization failed', err);
        throw err;
      }
    }

    // ---------- Public API ----------
    async fetchPubMedData(pmid) {
      if (!/^\d{1,8}$/.test(String(pmid))) {
        throw new Error('Invalid PMID');
      }

      // Strategy: ESummary JSON (fast metadata)
      const params = {
        db: 'pubmed',
        id: String(pmid),
        retmode: 'json',
        tool: this.config.tool,
        email: this.config.politeEmail || undefined
      };

      const url = this.buildSecureURL(this.endpoints.pubmed.base, this.endpoints.pubmed.esummary, params);
      const res = await this._makeRequest({ url, method: 'GET' });

      // Sanitize & return result subtree
      const data = (res && res.result) ? res.result : res;
      return this.sanitizeAPIResponse(data);
    }

    async fetchCrossRefData(doi) {
      if (!/^10\.\d{4,}\/[^\s]+$/.test(String(doi))) {
        throw new Error('Invalid DOI');
      }
      const path = `${this.endpoints.crossref.works}/${encodeURIComponent(doi)}`;
      const url = this.buildSecureURL(this.endpoints.crossref.base, path, this.config.politeEmail ? { mailto: this.config.politeEmail } : undefined);
      const res = await this._makeRequest({ url, method: 'GET' });
      return this.sanitizeAPIResponse(res && res.message ? res.message : res);
    }

    async fetchClinicalTrialsData(nctId) {
      // Accept "NCT01234567" or bare digits (we'll normalize)
      const id = String(nctId).toUpperCase().startsWith('NCT') ? String(nctId).toUpperCase() : ('NCT' + String(nctId));
      if (!/^NCT\d{8}$/.test(id)) throw new Error('Invalid NCT Id');

      // Use v2 full studies (v1 also acceptable; keeping generic)
      const params = {
        expr: id,
        fmt: 'json'
      };
      const url = this.buildSecureURL(this.endpoints.clinicalTrials.base, `${this.endpoints.clinicalTrials.fullStudies}`, params);
      const res = await this._makeRequest({ url, method: 'GET' });
      return this.sanitizeAPIResponse(res);
    }

    buildSecureURL(baseURL, endpoint, params = {}) {
      // Basic sanitize
      const b = String(baseURL || '').replace(/[\s"'<>]/g, '');
      const e = String(endpoint || '').replace(/[\s"'<>]/g, '');

      const usp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        usp.set(k, String(v));
      });

      // NCBI friendly headers as query when present
      if (!usp.has('tool'))  usp.set('tool', this.config.tool);
      if (this.config.politeEmail && !usp.has('email')) usp.set('email', this.config.politeEmail);

      const url = `${b}${e}${usp.toString() ? `?${usp.toString()}` : ''}`;
      return url;
    }

    sanitizeAPIResponse(data) {
      // Deep sanitize structured data: strip dangerous keys and angle brackets from strings
      const seen = new WeakSet();
      const clean = (val) => {
        if (val === null || val === undefined) return val;
        const t = typeof val;
        if (t === 'string') {
          // very conservative
          return val.replace(/[<>]/g, '');
        }
        if (t !== 'object') return val;
        if (seen.has(val)) return val;
        seen.add(val);
        if (Array.isArray(val)) return val.map(clean);
        const out = {};
        Object.keys(val).forEach(k => {
          if (/^(__proto__|constructor|prototype)$/i.test(k)) return;
          out[k] = clean(val[k]);
        });
        return out;
      };
      return clean(data);
    }

    getRequestQueue() {
      return {
        pendingInMemory: this._queue.length,
        offlinePersisted: this._offlineQueue.length,
        metrics: { ...this.metrics }
      };
    }

    // ---------- Core request machinery ----------
    async _makeRequest({ url, method = 'GET', body = null, headers = {} }) {
      const task = { url, method, body, headers, createdAt: Date.now() };

      // If offline, queue & return a placeholder
      if (!navigator.onLine) {
        this._enqueueOffline(task);
        this.eventBus?.emit?.('api:queuedOffline', { task });
        return { offline: true, queued: true };
      }

      // Queue for rate limiting
      return new Promise((resolve, reject) => {
        this._queue.push({ task, resolve, reject, attempt: 0 });
        this._drainQueue();
      });
    }

    _refillTokens() {
      const now = Date.now();
      const elapsed = (now - this._lastRefill) / 1000;
      const toAdd = Math.floor(elapsed * this.config.rateLimitRPS);
      if (toAdd > 0) {
        this._tokens = Math.min(this._tokens + toAdd, this.config.rateLimitRPS);
        this._lastRefill = now;
        this._drainQueue();
      }
    }

    _drainQueue() {
      while (this._tokens > 0 && this._queue.length > 0) {
        const next = this._queue.shift();
        this._tokens -= 1;
        this._execute(next).finally(() => {
          // allow new items after completion
          setTimeout(() => this._drainQueue(), 0);
        });
      }
    }

    async _execute(entry) {
      const { task, resolve, reject } = entry;
      const start = performance.now();

      try {
        const resp = await this._sendWithRetries(task);
        const latency = performance.now() - start;
        this._updateLatency(latency);
        this.metrics.sent += 1;
        this.lastActivity = new Date().toISOString();
        resolve(resp);
      } catch (err) {
        this.metrics.failed += 1;
        this.recordError('Request failed', err);
        reject(err);
      }
    }

    _updateLatency(latencyMs) {
      const m = this.metrics;
      // simple moving average
      m.avgLatencyMs = m.avgLatencyMs ? Math.round((m.avgLatencyMs * 0.8) + (latencyMs * 0.2)) : Math.round(latencyMs);
    }

    async _sendWithRetries(task) {
      let attempt = 0;
      let lastErr = null;
      while (attempt <= this.config.maxRetries) {
        try {
          return await this._send(task);
        } catch (err) {
          lastErr = err;
          attempt++;
          if (attempt > this.config.maxRetries) break;

          // Only retry on network-ish or 5xx errors
          if (!this._shouldRetry(err)) break;

          this.metrics.retried += 1;
          const delay = this.config.backoffBaseMs * Math.pow(2, attempt - 1);
          await this._sleep(delay);
        }
      }

      // If we end up here, queue offline if currently offline
      if (!navigator.onLine) {
        this._enqueueOffline(task);
        return { offline: true, queued: true };
      }
      throw lastErr || new Error('Unknown request error');
    }

    _shouldRetry(err) {
      const msg = (err && err.message) ? err.message : String(err);
      if (/network|timeout|fetch|failed|abort/i.test(msg)) return true;
      const code = err && err.status;
      return code >= 500 && code < 600;
    }

    async _send(task) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('Request timed out')), this.config.timeoutMs);

      try {
        const headers = Object.assign({
          'Accept': 'application/json'
        }, task.headers || {});

        // Add signature header for integrity (best-effort)
        //const signature = await this._sign(`${task.method}:${task.url}:${task.body ? JSON.stringify(task.body) : ''}`);
        //if (signature) headers['X-SS-Signature'] = signature;

        const init = {
          method: task.method,
          headers,
          signal: controller.signal,
          // Only set body for non-GET
          body: (task.method && task.method.toUpperCase() !== 'GET' && task.body) ? JSON.stringify(task.body) : undefined
        };

        const res = await fetch(task.url, init);
        if (!res.ok) {
          const err = new Error(`HTTP ${res.status}`);
          err.status = res.status;
          throw err;
        }

        // Try JSON first; if not JSON, fallback to text/xml and wrap
        const ct = res.headers.get('content-type') || '';
        let data;
        if (ct.includes('application/json') || ct.includes('text/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          // Return as structured wrapper
          data = { contentType: ct, raw: text };
        }
        return data;
      } finally {
        clearTimeout(timeout);
      }
    }

    _sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    // ---------- Offline queue ----------
    _loadOfflineQueue() {
      try {
        const raw = localStorage.getItem(this._offlineKey);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      } catch { return []; }
    }

    _saveOfflineQueue() {
      try {
        localStorage.setItem(this._offlineKey, JSON.stringify(this._offlineQueue));
      } catch {}
    }

    _enqueueOffline(task) {
      this._offlineQueue.push(task);
      this.metrics.queued = this._offlineQueue.length;
      this._saveOfflineQueue();
      this.log(`Queued offline: ${task.method} ${task.url}`);
      // Nudge SW to register a sync if available
      navigator.serviceWorker?.ready?.then(reg => {
        try { reg.sync?.register?.('silentstacks-sync'); } catch {}
      });
    }

    async flushOfflineQueue() {
      if (!navigator.onLine) return { flushed: 0, remaining: this._offlineQueue.length };

      const copy = this._offlineQueue.slice();
      this._offlineQueue = [];
      this._saveOfflineQueue();

      let flushed = 0;
      for (const task of copy) {
        try {
          await this._makeRequest(task);
          flushed++;
        } catch (e) {
          // Re-queue if still failing (e.g., offline again)
          this._enqueueOffline(task);
        }
      }
      this.metrics.queued = this._offlineQueue.length;
      this.eventBus?.emit?.('api:offlineFlushed', { flushed, remaining: this._offlineQueue.length });
      return { flushed, remaining: this._offlineQueue.length };
    }

    // ---------- Signing ----------
    _initSigningKey() {
      try {
        const k = sessionStorage.getItem('ss_sign_key');
        if (k) return k;
        const newKey = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '_' + Math.random().toString(36).slice(2));
        sessionStorage.setItem('ss_sign_key', newKey);
        return newKey;
      } catch {
        return 'ss_fallback_key';
      }
    }

    async _sign(payload) {
      try {
        const enc = new TextEncoder();
        const keyData = enc.encode(this._signingKey);
        const msgData = enc.encode(String(payload));

        // Derive a simple HMAC-like digest with subtle crypto (SHA-256)
        const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sigBuf = await crypto.subtle.sign('HMAC', key, msgData);
        const sigBytes = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
        return sigBytes.slice(0, 64);
      } catch {
        return null; // non-fatal
      }
    }

    // ---------- Diagnostics ----------
    recordError(message, error) {
      const rec = {
        message,
        error: error?.message || String(error),
        stack: error?.stack,
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);

      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'APIClient',
        message,
        error: rec.error
      });
    }

    log(message) {
      if (window.SilentStacks?.config?.debug) {
        console.log('[APIClient]', message);
      }
    }

    getHealthStatus() {
      return {
        name: 'APIClient',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {
          queueDepth: this._queue.length,
          offlineQueued: this._offlineQueue.length,
          avgLatencyMs: this.metrics.avgLatencyMs,
          sent: this.metrics.sent,
          retried: this.metrics.retried,
          failed: this.metrics.failed
        },
        rateLimit: {
          rps: this.config.rateLimitRPS,
          tokens: this._tokens
        }
      };
    }
  }

  // Registration (single-shot, clean)
  const apiClient = new APIClient();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('APIClient', apiClient);
  } else {
    window.SilentStacks = window.SilentStacks || {};
    window.SilentStacks.modules = window.SilentStacks.modules || {};
    window.SilentStacks.modules.APIClient = apiClient;
  }

  console.log('📦 APIClient loaded');
})();
