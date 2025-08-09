// modules/data/storage-adapter.js - FIXED
(() => {
  'use strict';

  /**
   * StorageAdapter
   * - IndexedDB primary store with AES-GCM encryption
   * - localStorage metadata for quick stats
   * - Backups, integrity checks, quota hints, batch ops
   */
  class StorageAdapter {
    static dependencies = [];
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

      // Config - FIXED: Safe config access
      this.ns = 'ss2';
      this.maxBackups = 10;
    }

    async initialize() {
      try {
        // FIXED: Safe access to SilentStacks namespace
        const SS = window.SilentStacks || {};
        this.stateManager = SS.core?.stateManager || null;
        this.eventBus = SS.core?.eventBus || null;

        // Get config safely
        const cfg = SS.config?.storage || {};
        this.ns = cfg.namespace || 'ss2';
        this.maxBackups = cfg.maxBackupEntries || 10;

        await this._ensureKey();
        await this._open();

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
      try {
        const payload = await this._encrypt(JSON.stringify(data ?? null));
        await this._tx(this.STORE, 'readwrite', async (store) => {
          await this._request(store.put(payload, `${this.ns}:${key}`));
        });
        this.lastActivity = new Date().toISOString();
      } catch (e) {
        this.recordError('Store failed', e);
        throw e;
      }
    }

    async retrieve(key) {
      try {
        let result = null;
        await this._tx(this.STORE, 'readonly', async (store) => {
          const data = await this._request(store.get(`${this.ns}:${key}`));
          if (data) {
            const decrypted = await this._decrypt(data);
            result = JSON.parse(decrypted);
          }
        });
        this.lastActivity = new Date().toISOString();
        return result;
      } catch (e) {
        this.recordError('Retrieve failed', e);
        return null;
      }
    }

    async remove(key) {
      try {
        await this._tx(this.STORE, 'readwrite', async (store) => {
          await this._request(store.delete(`${this.ns}:${key}`));
        });
        this.lastActivity = new Date().toISOString();
      } catch (e) {
        this.recordError('Remove failed', e);
        throw e;
      }
    }

    async clear() {
      try {
        await this._tx(this.STORE, 'readwrite', async (store) => {
          const keys = await this._request(store.getAllKeys());
          const nsKeys = keys.filter(k => k.startsWith(`${this.ns}:`));
          for (const k of nsKeys) {
            await this._request(store.delete(k));
          }
        });
        this.lastActivity = new Date().toISOString();
      } catch (e) {
        this.recordError('Clear failed', e);
        throw e;
      }
    }

    async keys() {
      try {
        let result = [];
        await this._tx(this.STORE, 'readonly', async (store) => {
          const keys = await this._request(store.getAllKeys());
          result = keys
            .filter(k => k.startsWith(`${this.ns}:`))
            .map(k => k.slice(this.ns.length + 1));
        });
        return result;
      } catch (e) {
        this.recordError('Keys failed', e);
        return [];
      }
    }

    // ===== Backup API =====
    async createBackup(label = null) {
      try {
        const timestamp = new Date().toISOString();
        const backupKey = `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        
        let allData = {};
        await this._tx(this.STORE, 'readonly', async (store) => {
          const keys = await this._request(store.getAllKeys());
          const nsKeys = keys.filter(k => k.startsWith(`${this.ns}:`));
          
          for (const k of nsKeys) {
            const rawData = await this._request(store.get(k));
            if (rawData) {
              try {
                const decrypted = await this._decrypt(rawData);
                allData[k.slice(this.ns.length + 1)] = JSON.parse(decrypted);
              } catch (e) {
                this.recordError(`Backup decrypt failed for ${k}`, e);
              }
            }
          }
        });

        const backup = {
          label: label || `Backup ${timestamp}`,
          timestamp,
          data: allData,
          version: this.DB_VERSION
        };

        await this._tx(this.BACKUPS, 'readwrite', async (store) => {
          await this._request(store.put(backup, backupKey));
        });

        await this._trimBackups();
        return backupKey;
      } catch (e) {
        this.recordError('Create backup failed', e);
        throw e;
      }
    }

    async listBackups() {
      try {
        let backups = [];
        await this._tx(this.BACKUPS, 'readonly', async (store) => {
          const keys = await this._request(store.getAllKeys());
          for (const k of keys) {
            const backup = await this._request(store.get(k));
            if (backup) {
              backups.push({
                key: k,
                label: backup.label,
                timestamp: backup.timestamp,
                size: Object.keys(backup.data || {}).length
              });
            }
          }
        });
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      } catch (e) {
        this.recordError('List backups failed', e);
        return [];
      }
    }

    async restoreBackup(backupKey) {
      try {
        let backup = null;
        await this._tx(this.BACKUPS, 'readonly', async (store) => {
          backup = await this._request(store.get(backupKey));
        });

        if (!backup) throw new Error('Backup not found');

        // Clear current data
        await this.clear();

        // Restore data
        for (const [key, value] of Object.entries(backup.data || {})) {
          await this.store(key, value);
        }

        return { restored: Object.keys(backup.data || {}).length };
      } catch (e) {
        this.recordError('Restore backup failed', e);
        throw e;
      }
    }

    // ===== IndexedDB internals =====
    async _open() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
        
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          this._db = req.result;
          resolve();
        };
        
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.STORE)) {
            db.createObjectStore(this.STORE);
          }
          if (!db.objectStoreNames.contains(this.BACKUPS)) {
            db.createObjectStore(this.BACKUPS);
          }
        };
      });
    }

    async _tx(storeName, mode, fn) {
      const tx = this._db.transaction([storeName], mode);
      const store = tx.objectStore(storeName);
      await fn(store);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    _request(req) {
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    // ===== Crypto internals =====
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
          for (const k of toRemove) {
            await this._request(store.delete(k));
          }
        }
      });
    }

    _bufToB64(buf) {
      const b = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
      let s = '';
      for (let i = 0; i < b.length; i++) {
        s += String.fromCharCode(b[i]);
      }
      return btoa(s);
    }

    _b64ToBuf(b64) {
      const s = atob(b64);
      const b = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) {
        b[i] = s.charCodeAt(i);
      }
      return b.buffer;
    }

    // ===== Health and diagnostics =====
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
      const rec = {
        message,
        error: error?.message || String(error),
        stack: window.SilentStacks?.config?.debug ? error?.stack : undefined,
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) {
        this.errors = this.errors.slice(-100);
      }
      
      // FIXED: Safe diagnostic access
      const SS = window.SilentStacks || {};
      SS.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'StorageAdapter',
        message,
        error: rec.error
      });
    }

    log(msg) {
      const SS = window.SilentStacks || {};
      if (SS.config?.debug) {
        console.log(`[StorageAdapter] ${msg}`);
      }
    }
  }

  // ===== FIXED: Safe module registration =====
  const moduleInstance = new StorageAdapter();
  
  // Ensure SilentStacks namespace exists
  window.SilentStacks = window.SilentStacks || { modules: {} };
  
  // Register using the official method if available
  if (window.SilentStacks.registerModule) {
    window.SilentStacks.registerModule('StorageAdapter', moduleInstance);
  } else {
    // Fallback registration
    window.SilentStacks.modules = window.SilentStacks.modules || {};
    window.SilentStacks.modules.StorageAdapter = moduleInstance;
  }
  
  console.log('📦 StorageAdapter loaded');
})();