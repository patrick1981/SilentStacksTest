// modules/data/api-client.js
(() => {
  'use strict';

  /**
   * Central API client with:
   * - Global rate limit (default 2 RPS)
   * - Timeout (30s)
   * - Retries (exponential backoff)
   * - Request signing (HMAC-lite with session salt)
   * - Sanitization of inputs/outputs
   * - PubMed / CrossRef / ClinicalTrials.gov helpers
   */
  class APIClient {
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      // Core references
      this.stateManager = null;
      this.eventBus = null;

      // Config
      this.rateLimitRPS = 2; // Default: 2 requests / second (NCBI-friendly)
      this.timeoutMs = 30000;
      this.maxRetries = 3;
      this.backoffBase = 400; // ms

      // Endpoints
      this.endpoints = {
        pubmed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
        crossref: 'https://api.crossref.org',
        clinical: 'https://clinicaltrials.gov/api/v2'
      };

      // Queue + Rate limiting
      this._queue = [];
      this._inflight = 0;
      this._lastTick = 0;
      this._ticker = null;

      // Security
      this.sanitizer = null;
      this._signingSalt = (Math.random().toString(36).slice(2) + Date.now().toString(36));
    }

    async initialize() {
      try {
        // Core
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;

        // Config overrides
        const cfg = window.SilentStacks?.config?.api || {};
        if (cfg.endpoints) this.endpoints = { ...this.endpoints, ...cfg.endpoints };
        if (typeof cfg.rateLimitRPS === 'number') this.rateLimitRPS = Math.max(1, cfg.rateLimitRPS);
        if (typeof cfg.timeoutMs === 'number') this.timeoutMs = Math.max(5000, cfg.timeoutMs);

        // Security
        this.sanitizer = window.SilentStacks?.security?.sanitizer || null;

        await this.setupModule();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'APIClient' };
      } catch (error) {
        this.recordError('Initialization failed', error);
        throw error;
      }
    }

    async setupModule() {
      // Start the rate-limit ticker
      const interval = Math.max(250, Math.floor(1000 / this.rateLimitRPS));
      this._ticker = setInterval(() => this._drainQueue(), interval);
      this.log(`Rate limiter started at ~${this.rateLimitRPS} req/sec`);
    }

    // ====== Public API helpers ======

    async fetchPubMedData(pmid) {
      const id = this._sanitizeId(String(pmid || ''));
      if (!/^\d+$/.test(id)) throw new Error('Invalid PMID');
      const url = await this.buildSecureURL(this.endpoints.pubmed, '/esummary.fcgi', {
        db: 'pubmed',
        id,
        retmode: 'json'
      });
      const res = await this._queueFetch(url, { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      return this.sanitizeAPIResponse(data);
    }

    async fetchCrossRefData(doi) {
      const clean = this._sanitizeQuery(String(doi || ''));
      if (!clean || !/[./]/.test(clean)) throw new Error('Invalid DOI');
      const url = await this.buildSecureURL(this.endpoints.crossref, `/works/${encodeURIComponent(clean)}`, {});
      const res = await this._queueFetch(url, { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      return this.sanitizeAPIResponse(data);
    }

    async fetchClinicalTrialsData(nctId) {
      const clean = this._sanitizeQuery(String(nctId || ''));
      if (!/^NCT\d{8}$/i.test(clean)) throw new Error('Invalid NCT ID');
      // Using v2 studies endpoint
      const url = await this.buildSecureURL(this.endpoints.clinical, `/studies/${encodeURIComponent(clean.toUpperCase())}`, {});
      const res = await this._queueFetch(url, { method: 'GET' });
      const data = await res.json().catch(() => ({}));
      return this.sanitizeAPIResponse(data);
    }

    async buildSecureURL(baseURL, endpoint, params) {
      const base = String(baseURL || '').replace(/\/+$/, '');
      const path = String(endpoint || '').startsWith('/') ? endpoint : `/${endpoint}`;
      const qp = new URLSearchParams();

      Object.entries(params || {}).forEach(([k, v]) => {
        if (v == null) return;
        qp.set(this._sanitizeKey(k), this._sanitizeQuery(String(v)));
      });

      // Attach polite pool id for NCBI / CrossRef if configured
      const polite = window.SilentStacks?.config?.api?.headers || {};
      if (base.includes('eutils.ncbi.nlm.nih.gov') && window.SilentStacks?.config?.api?.ncbiTool) {
        qp.set('tool', this._sanitizeQuery(window.SilentStacks.config.api.ncbiTool));
      }
      if (base.includes('eutils.ncbi.nlm.nih.gov') && window.SilentStacks?.config?.api?.ncbiEmail) {
        qp.set('email', this._sanitizeQuery(window.SilentStacks.config.api.ncbiEmail));
      }

      // Request signing (query param sig + ts)
      const ts = Date.now().toString();
      const sig = await this._sign(`${base}${path}?${qp.toString()}&ts=${ts}`);
      qp.set('ts', ts);
      qp.set('sig', sig);

      return `${base}${path}?${qp.toString()}`;
    }

    sanitizeAPIResponse(data) {
      // Basic deep-sanitize: strip dangerous chars from strings
      const clean = (val) => {
        if (val == null) return val;
        if (typeof val === 'string') {
          const s = this.sanitizer?.sanitize ? this.sanitizer.sanitize(val) : val.replace(/[<>"'&]/g, '');
          return s.length > 100000 ? s.slice(0, 100000) : s; // prevent absurd payloads
        }
        if (Array.isArray(val)) return val.map(clean);
        if (typeof val === 'object') {
          const out = {};
          Object.keys(val).forEach(k => { out[this._sanitizeKey(k)] = clean(val[k]); });
          return out;
        }
        return val;
      };
      return clean(data);
    }

    getRequestQueue() {
      return {
        pending: this._queue.length,
        inflight: this._inflight,
        rateLimitRPS: this.rateLimitRPS
      };
    }

    // ====== Internal: Rate-limited fetch with retry/timeout ======

    _queueFetch(url, options = {}) {
      return new Promise((resolve, reject) => {
        const task = async () => {
          try {
            const resp = await this._fetchWithRetry(url, options);
            resolve(resp);
          } catch (e) {
            reject(e);
          }
        };
        this._queue.push(task);
        this._drainQueue();
      });
    }

    async _fetchWithRetry(url, options) {
      const attempt = async (n) => {
        try {
          const controller = new AbortController();
          const to = setTimeout(() => controller.abort(), this.timeoutMs);

          // Emit network started
          this.eventBus?.emit?.('net:started', { url });

          const resp = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
          clearTimeout(to);

          // Emit completed
          this.eventBus?.emit?.('net:completed', { url, status: resp.status });

          if (!resp.ok) {
            if (resp.status >= 500 && n < this.maxRetries) {
              const wait = this._backoff(n);
              await this._sleep(wait);
              return attempt(n + 1);
            }
            // 4xx or exhausted
            throw new Error(`HTTP ${resp.status}`);
          }
          return resp;
        } catch (err) {
          this.eventBus?.emit?.('net:failed', { url, error: err?.message || String(err) });
          if (n < this.maxRetries) {
            const wait = this._backoff(n);
            await this._sleep(wait);
            return attempt(n + 1);
          }
          this.recordError('Fetch failed', err);
          throw err;
        }
      };
      return attempt(0);
    }

    _drainQueue() {
      const now = Date.now();
      if (now - this._lastTick < 1000 / this.rateLimitRPS) return;
      if (this._inflight > 0) return; // simple conservative limiter: 1 at a time paced to RPS
      const task = this._queue.shift();
      if (!task) return;
      this._inflight++;
      this._lastTick = now;
      Promise.resolve()
        .then(task)
        .catch((e) => this.recordError('Task error', e))
        .finally(() => { this._inflight = 0; });
    }

    _backoff(n) {
      // exponential with jitter
      const base = this.backoffBase * Math.pow(2, n);
      return base + Math.floor(Math.random() * 200);
    }
    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ====== Security helpers ======
    async _sign(text) {
      // Lightweight HMAC-like using subtle crypto if available (fall back to hash-like)
      try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw', enc.encode(this._signingSalt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, enc.encode(text));
        return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
      } catch {
        let h = 0; const s = `${this._signingSalt}|${text}`;
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        return h.toString(16);
      }
    }

    _sanitizeKey(key) {
      return String(key || '').replace(/[^\w\-.:]/g, '');
    }
    _sanitizeQuery(val) {
      if (this.sanitizer?.sanitize) return this.sanitizer.sanitize(val);
      return String(val).replace(/[<>"'&]/g, '');
    }

    // ====== Health / Logging ======
    getHealthStatus() {
      return {
        name: 'APIClient',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: { queue: this.getRequestQueue() }
      };
    }

    recordError(message, error) {
      const errorRecord = {
        message,
        error: error?.message || String(error),
        stack: error?.stack,
        timestamp: new Date().toISOString()
      };
      this.errors.push(errorRecord);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error', module: 'APIClient', message, error
      });
    }

    log(message) {
      if (window.SilentStacks?.config?.debug) console.log(`[APIClient] ${message}`);
    }
  }

  const moduleInstance = new APIClient();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('APIClient', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.APIClient = moduleInstance;
  }
  console.log('📦 APIClient loaded');
})();
