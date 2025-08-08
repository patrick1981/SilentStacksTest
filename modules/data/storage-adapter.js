// modules/data/storage-adapter.js
(() => {
  'use strict';

  /**
   * StorageAdapter
   * - IndexedDB primary store with AES-GCM encryption
   * - localStorage metadata for quick stats
   * - Backups, integrity checks, quota hints, batch ops
   */
  class StorageAdapter {
    static dependencies = ['AppConfig'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;

      // DB
      this.DB_NAME = 'silentstacks-v2';
      this.DB_VERSION = 1;
      this.STORE = 'kv';         // main encrypted KV
      this.BACKUPS = 'backups';  // backup snapshots

      // Crypto
      this._cryptoKey = null;
      this._keyMetaKey = 'ss2:crypto:key.v1'; // base64 key in sessionStorage (not persistent)
      this._nonceLen = 12; // AES-GCM nonce length

      // Config
      const cfg = window.SilentStacks?.config ?? {};
      this.ns = cfg?.storage?.namespace || 'ss2';
      this.maxBackups = cfg?.storage?.maxBackupEntries ?? 10;
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;

        await this._ensureKey();
        await this._open();

        // Expose quick helpers for other modules (optional)
        window.SilentStacks = window.SilentStacks || {};
        window.SilentStacks.modules = window.SilentStacks.modules || {};
        window.SilentStacks.modules.StorageAdapter = this;

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized StorageAdapter');
        return { status: 'success', module: 'StorageAdapter' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    async setupModule() {}

    // ===== Required API =====
    async store(key, data) {
      const payload = await this._encrypt(JSON.stringify(data ?? null));
      await this._tx(this.STORE, 'readwrite', (store) => store.put(payload, this._k(key)));
      this.lastActivity = new Date().toISOString();
      return true;
    }

    async retrieve(key) {
      const payload = await this._tx(this.STORE, 'readonly', (store) => store.get(this._k(key)));
      if (!payload) return null;
      try {
        const json = await this._decrypt(payload);
        return JSON.parse(json);
      } catch (e) {
        this.recordError('Decrypt/parse failed', e);
        return null;
      }
    }

    async remove(key) {
      await this._tx(this.STORE, 'readwrite', (store) => store.delete(this._k(key)));
      this.lastActivity = new Date().toISOString();
      return true;
    }

    async backup() {
      const snapshot = {};
      await this._tx(this.STORE, 'readonly', async (store) => {
        const req = store.getAllKeys();
        const keys = await this._request(req);
        for (const k of keys) {
          const v = await this._request(store.get(k));
          try {
            const json = await this._decrypt(v);
            snapshot[k] = JSON.parse(json);
          } catch {}
        }
      });

      const entry = {
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        data: snapshot
      };

      await this._tx(this.BACKUPS, 'readwrite', (store) => store.put(entry, entry.id));
      // Trim old backups
      await this._trimBackups();
      return entry.id;
    }

    async restore(backupIdOrData) {
      let data = backupIdOrData;
      if (typeof data === 'string') {
        data = await this._tx(this.BACKUPS, 'readonly', (store) => store.get(data));
        data = data?.data;
      } else {
        data = data?.data ?? data;
      }
      if (!data || typeof data !== 'object') throw new Error('Invalid backup');

      // Clear main store then write entries
      await this._tx(this.STORE, 'readwrite', async (store) => {
        // clear
        const keys = await this._request(store.getAllKeys());
        for (const k of keys) await this._request(store.delete(k));
        // write
        for (const [k, v] of Object.entries(data)) {
          const enc = await this._encrypt(JSON.stringify(v));
          await this._request(store.put(enc, k));
        }
      });
      this.lastActivity = new Date().toISOString();
      return true;
    }

    async checkIntegrity() {
      // Try decrypting a small sample of entries
      try {
        let ok = true;
        await this._tx(this.STORE, 'readonly', async (store) => {
          const keys = await this._request(store.getAllKeys());
          const sample = keys.slice(0, Math.min(keys.length, 5));
          for (const k of sample) {
            const v = await this._request(store.get(k));
            await this._decrypt(v); // throw if bad
          }
        });
        return ok;
      } catch (e) {
        this.recordError('Integrity check failed', e);
        return false;
      }
    }

    async getStorageStats() {
      const stats = { keys: 0, backups: 0, approxBytes: 0 };
      await this._tx(this.STORE, 'readonly', async (store) => {
        const keys = await this._request(store.getAllKeys());
        stats.keys = keys.length;
        for (const k of keys) {
          const v = await this._request(store.get(k));
          stats.approxBytes += (v?.cipher?.length || 0) + (v?.nonce?.length || 0);
        }
      });
      await this._tx(this.BACKUPS, 'readonly', async (store) => {
        const keys = await this._request(store.getAllKeys());
        stats.backups = keys.length;
      });
      return stats;
    }

    // ===== Internals: DB/Crypto =====
    async _open() {
      this.db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(this.STORE)) db.createObjectStore(this.STORE);
          if (!db.objectStoreNames.contains(this.BACKUPS)) db.createObjectStore(this.BACKUPS);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    _tx(storeName, mode, fn) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        Promise.resolve(fn(store))
          .then((res) => tx.oncomplete = () => resolve(res))
          .catch((e) => reject(e));
        tx.onerror = () => reject(tx.error);
      });
    }

    _request(req) {
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    _k(key) { return `${this.ns}:${key}`; }

    async _ensureKey() {
      try {
        let b64 = sessionStorage.getItem(this._keyMetaKey);
        if (!b64) {
          const raw = crypto.getRandomValues(new Uint8Array(32));
          b64 = this._bufToB64(raw);
          sessionStorage.setItem(this._keyMetaKey, b64);
        }
        const raw = this._b64ToBuf(b64);
        this._cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
      } catch (e) {
        this.recordError('Crypto key init failed', e);
        // Fallback to a dummy key to keep app working
        const raw = new Uint8Array(32);
        this._cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
      }
    }

    async _encrypt(plaintext) {
      const nonce = crypto.getRandomValues(new Uint8Array(this._nonceLen));
      const data = new TextEncoder().encode(plaintext);
      const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, this._cryptoKey, data);
      return { nonce: this._bufToB64(nonce), cipher: this._bufToB64(new Uint8Array(cipherBuf)) };
    }

    async _decrypt(obj) {
      const nonce = this._b64ToBuf(obj.nonce);
      const cipher = this._b64ToBuf(obj.cipher);
      const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, this._cryptoKey, cipher);
      return new TextDecoder().decode(plainBuf);
    }

    async _trimBackups() {
      await this._tx(this.BACKUPS, 'readwrite', async (store) => {
        const keys = await this._request(store.getAllKeys());
        const excess = keys.length - this.maxBackups;
        if (excess > 0) {
          const toRemove = keys.sort().slice(0, excess);
          for (const k of toRemove) await this._request(store.delete(k));
        }
      });
    }

    _bufToB64(buf) {
      const b = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
      let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      return btoa(s);
    }
    _b64ToBuf(b64) {
      const s = atob(b64); const b = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
      return b.buffer;
    }

    // Boilerplate
    getHealthStatus() {
      return {
        name: 'StorageAdapter',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {}
      };
    }
    recordError(message, error) {
      const rec = { message, error: error?.message || String(error), stack: window.SilentStacks?.config?.debug ? error?.stack : undefined, timestamp: new Date().toISOString() };
      this.errors.push(rec); if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'StorageAdapter', message, error: rec.error });
    }
    log(msg) { if (window.SilentStacks?.config?.debug) console.log(`[StorageAdapter] ${msg}`); }
  }

  const moduleInstance = new StorageAdapter();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('StorageAdapter', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.StorageAdapter = moduleInstance; }
  console.log('📦 StorageAdapter loaded');
})();
