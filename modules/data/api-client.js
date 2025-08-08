// modules/data/api-client.js
(() => {
  'use strict';

  class APIClient {
    static dependencies = ['LocalAPICache'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;

      const cfg = window.SilentStacks?.config ?? {};
      this.timeoutMs = Number(cfg?.api?.timeoutMs ?? 30000);
      this.maxRetries = Number(cfg?.api?.maxRetries ?? 3);
      this.jitterMs = Number(cfg?.api?.jitterMs ?? 150);
      this.rps = Math.max(1, Number(cfg?.limits?.externalRPS ?? 2));

      this.endpoints = {
        pubmed: cfg?.api?.endpoints?.pubmed || 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
        crossref: cfg?.api?.endpoints?.crossref || 'https://api.crossref.org/works',
        clinicaltrials: cfg?.api?.endpoints?.clinicaltrials || 'https://clinicaltrials.gov/api/v2/studies'
      };

      // interceptors (overridden via config:update)
      this.requestInterceptors = [];
      this.responseInterceptors = [];

      // Security
      const sanitizer = window.SilentStacks?.security?.sanitizer;
      this.sanitizeScalar = (v) => (typeof v === 'string' ? (sanitizer?.sanitize ? sanitizer.sanitize(v) : v.replace(/[<>"'&]/g, '')) : v);
      this.sanitizeDeep = (o) => (o && typeof o === 'object'
        ? (Array.isArray(o) ? o.map((x) => this.sanitizeDeep(x)) : Object.fromEntries(Object.entries(o).map(([k, v]) => [k, this.sanitizeDeep(v)])))
        : this.sanitizeScalar(o));

      // Signing
      this._hmacKey = null; this._sessionKeyB64 = null;

      // Rate limit queue
      this._queue = []; this._pending = 0;
      this._tickMs = Math.max(500, Math.floor(1000 / this.rps));
      this._timer = null; this._nextId = 1;

      this.metrics = { totalQueued: 0, totalCompleted: 0, totalFailed: 0, lastDurationMs: 0 };

      // Local cache
      this.cache = null;
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.cache = window.SilentStacks?.modules?.LocalAPICache ?? null;

        await this.setupModule();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized APIClient');
        return { status: 'success', module: 'APIClient' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    async setupModule() {
      await this._ensureHmacKey();
      this.eventBus?.on?.('config:update', (patch) => {
        try {
          const api = patch?.api; const limits = patch?.limits;
          if (api?.endpoints) this.endpoints = { ...this.endpoints, ...api.endpoints };
          if (limits?.externalRPS != null) {
            this.rps = Math.max(1, Number(limits.externalRPS));
            const newTick = Math.max(500, Math.floor(1000 / this.rps));
            if (newTick !== this._tickMs) { this._tickMs = newTick; this._restartTimer(); }
          }
          if (api?.interceptors) {
            if (Array.isArray(api.interceptors.request)) this.requestInterceptors = api.interceptors.request;
            if (Array.isArray(api.interceptors.response)) this.responseInterceptors = api.interceptors.response;
          }
        } catch (e) { this.recordError('config:update handling failed', e); }
      });
      this._startTimer();
    }

    // ===== Public (required) =====
    async fetchPubMedData(pmid) {
      const id = String(pmid ?? '').trim();
      if (!/^[1-9]\d*$/.test(id)) throw this._publicError('Invalid PMID');

      // Offline path
      if (!navigator.onLine) {
        const cached = await this.cache?.get('pubmed', id);
        if (cached) return this.sanitizeAPIResponse(cached);
        // placeholder and emit enrichment job
        this.eventBus?.emit?.('data:queue:enrich', { pmid: id });
        return { result: { [id]: { title: '', source: '', fulljournalname: '', authors: [], pubdate: '' } } };
      }

      const url = await this.buildSecureURL(this.endpoints.pubmed, '/esummary.fcgi', { db: 'pubmed', id, retmode: 'json' });
      const json = await this._enqueueJSON({ url, label: `pubmed:esummary:${id}` });
      // write-through cache
      try { await this.cache?.set('pubmed', id, json); } catch {}
      return json;
    }

    async fetchCrossRefData(doi) {
      const safeDoi = String(doi ?? '').trim();
      if (!/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(safeDoi)) throw this._publicError('Invalid DOI');

      if (!navigator.onLine) {
        const cached = await this.cache?.get('crossref', safeDoi);
        if (cached) return this.sanitizeAPIResponse(cached);
        this.eventBus?.emit?.('data:queue:enrich', { doi: safeDoi });
        return { message: { DOI: safeDoi, title: [''], author: [], 'container-title': [''], issued: { 'date-parts': [[null]] } } };
      }

      const endpoint = `${this.endpoints.crossref}/${encodeURIComponent(safeDoi)}`;
      const url = await this.buildSecureURL('', '', {}, endpoint);
      const json = await this._enqueueJSON({ url, label: `crossref:${safeDoi}` });
      try { await this.cache?.set('crossref', safeDoi, json); } catch {}
      return json;
    }

    async fetchClinicalTrialsData(nctId) {
      const id = String(nctId ?? '').toUpperCase();
      if (!/^NCT\d{8}$/.test(id)) throw this._publicError('Invalid NCT ID');

      if (!navigator.onLine) {
        const cached = await this.cache?.get('ctgov', id);
        if (cached) return this.sanitizeAPIResponse(cached);
        this.eventBus?.emit?.('data:queue:enrich', { nctId: id });
        return { studies: [] };
      }

      const url = await this.buildSecureURL(this.endpoints.clinicaltrials, '', { ['filter.ids']: id });
      const json = await this._enqueueJSON({ url, label: `ctgov:${id}` });
      try { await this.cache?.set('ctgov', id, json, 1000 * 60 * 60 * 24 * 1); } catch {} // 1d ttl
      return json;
    }

    async buildSecureURL(baseURL, endpoint = '', params = {}, absoluteOverride = '') {
      if (absoluteOverride) {
        const abs = new URL(absoluteOverride, location.href);
        const signed = await this._signURL(abs);
        return signed.toString();
      }
      const base = new URL(String(baseURL || ''), location.href);
      const path = String(endpoint || '');
      const url = new URL(path, base.toString());
      for (const [k, v] of Object.entries(params || {})) {
        const key = this.sanitizeScalar(k);
        const val = Array.isArray(v) ? v.map(this.sanitizeScalar).join(',') : this.sanitizeScalar(String(v ?? ''));
        url.searchParams.set(key, val);
      }
      const signed = await this._signURL(url);
      return signed.toString();
    }

    sanitizeAPIResponse(data) { return this.sanitizeDeep(data); }
    getRequestQueue() { return { queued: this._queue.length, pending: this._pending, rps: this.rps, tickMs: this._tickMs, metrics: { ...this.metrics } }; }

    // ===== Core queue w/ interceptors =====
    async _enqueueJSON({ url, label }) {
      return new Promise((resolve, reject) => {
        const id = this._nextId++; const enqueuedAt = Date.now();
        const run = async () => {
          const startedAt = performance.now();
          try {
            this.eventBus?.emit?.('net:started', { id, label, url });
            const json = await this._fetchJSONWithInterceptors(url, { label });
            const clean = this.sanitizeAPIResponse(json);
            this.metrics.totalCompleted++; this.metrics.lastDurationMs = performance.now() - startedAt;
            this.eventBus?.emit?.('net:completed', { id, label, url, ms: this.metrics.lastDurationMs });
            resolve(clean);
          } catch (e) {
            this.metrics.totalFailed++; this.eventBus?.emit?.('net:failed', { id, label, url, error: e?.message || 'failed' });
            reject(this._publicError('Network request failed'));
          } finally {
            this._pending = Math.max(0, this._pending - 1);
          }
        };
        this._queue.push({ id, label, url, enqueuedAt, run });
        this.metrics.totalQueued++; this.eventBus?.emit?.('net:queued', { id, label, url });
      });
    }

    async _fetchJSONWithInterceptors(url, { label }) {
      let ctx = {
        url: String(url),
        label: label || 'request',
        headers: new Headers({ 'Accept': 'application/json' }),
        options: { method: 'GET', redirect: 'follow' }
      };
      const cfg = window.SilentStacks?.config;
      const reqInts = Array.isArray(cfg?.api?.interceptors?.request) ? cfg.api.interceptors.request : this.requestInterceptors;
      const resInts = Array.isArray(cfg?.api?.interceptors?.response) ? cfg.api.interceptors.response : this.responseInterceptors;
      for (const fn of reqInts) {
        try { const maybe = fn?.(ctx); if (maybe && typeof maybe === 'object') ctx = { ...ctx, ...maybe }; } catch (e) { this.recordError('request interceptor threw', e); }
      }
      const json = await this._fetchJSON(ctx, resInts);
      return json;
    }

    async _fetchJSON(ctx, responseInterceptors) {
      const maxAttempts = Math.max(1, this.maxRetries + 1);
      let attempt = 0; let lastErr = null;
      while (attempt < maxAttempts) {
        attempt++;
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), this.timeoutMs);
        try {
          const res = await fetch(ctx.url, { ...ctx.options, headers: ctx.headers, signal: ac.signal });
          let json = null; try { json = await res.clone().json(); } catch { json = null; }
          for (const fn of responseInterceptors) { try { fn?.({ url: ctx.url, label: ctx.label, response: res, json }); } catch (e) { this.recordError('response interceptor threw', e); } }
          if (res.ok) return json ?? {};
          if (this._isRetryableStatus(res.status) && attempt < maxAttempts) {
            await this._backoff(attempt); this.eventBus?.emit?.('net:retry', { label: ctx.label, url: ctx.url, attempt, status: res.status }); continue;
          }
          throw new Error(`HTTP ${res.status}`);
        } catch (e) {
          lastErr = e;
          if (e?.name === 'AbortError' && attempt < maxAttempts) { await this._backoff(attempt); this.eventBus?.emit?.('net:retry', { label: ctx.label, url: ctx.url, attempt, reason: 'timeout' }); continue; }
          if (attempt < maxAttempts) { await this._backoff(attempt); this.eventBus?.emit?.('net:retry', { label: ctx.label, url: ctx.url, attempt, reason: 'network' }); continue; }
          throw e;
        } finally { clearTimeout(t); }
      }
      throw lastErr || new Error('Request failed');
    }

    _isRetryableStatus(s) { return s === 429 || (s >= 500 && s < 600); }
    async _backoff(attempt) { const base = Math.min(1000 * 2 ** (attempt - 1), 8000); const jitter = Math.floor(Math.random() * this.jitterMs); await new Promise(r => setTimeout(r, base + jitter)); }

    // Signing
    async _ensureHmacKey() {
      try {
        if (!this._sessionKeyB64) { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); this._sessionKeyB64 = this._bufToB64(bytes); }
        const raw = this._b64ToBuf(this._sessionKeyB64);
        this._hmacKey = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      } catch (e) { this.recordError('HMAC key init failed', e); }
    }

    async _signURL(url) {
      const u = new URL(url);
      const ts = Date.now().toString();
      u.searchParams.set('_ts', ts);
      const toSign = `${u.pathname}?${u.searchParams.toString()}`;
      const mac = await this._hmac(toSign);
      u.searchParams.set('_sig', mac);
      return u;
    }

    async _hmac(str) {
      try { const data = new TextEncoder().encode(str); const sig = await crypto.subtle.sign('HMAC', this._hmacKey, data); return this._bufToB64(new Uint8Array(sig)); }
      catch (e) { this.recordError('HMAC sign failed', e); return ''; }
    }

    // Queue
    _startTimer() { if (this._timer) return; this._timer = setInterval(() => this._dequeueTick(), this._tickMs); }
    _restartTimer() { if (this._timer) clearInterval(this._timer); this._timer = null; this._startTimer(); }
    async _dequeueTick() { if (this._pending > 0) return; const job = this._queue.shift(); if (!job) return; this._pending++; try { await job.run(); } finally { /* pending handled in run */ } }

    // Utils
    _bufToB64(buf) { const b = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf; let s=''; for (let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s); }
    _b64ToBuf(b64) { const s=atob(b64); const b=new Uint8Array(s.length); for (let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b.buffer; }
    _publicError(message) { const err = new Error(String(message||'Unexpected error')); err.public = true; return err; }

    // Boilerplate
    getHealthStatus() {
      return { name: 'APIClient', status: this.initialized ? 'healthy':'not-initialized', initialized:this.initialized, lastActivity:this.lastActivity,
        errors:this.errors.slice(-5), performance:{ rps:this.rps, tickMs:this._tickMs, queued:this._queue.length, pending:this._pending, metrics:this.metrics } };
    }
    recordError(message, error) {
      const rec = { message, error: error?.message || String(error), stack: (window.SilentStacks?.config?.debug ? error?.stack : undefined), timestamp: new Date().toISOString() };
      this.errors.push(rec); if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'APIClient', message, error: rec.error });
    }
    log(m) { if (window.SilentStacks?.config?.debug) console.log(`[APIClient] ${m}`); }
  }

  const moduleInstance = new APIClient();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('APIClient', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.APIClient = moduleInstance; }
  console.log('📦 APIClient loaded');
})();
