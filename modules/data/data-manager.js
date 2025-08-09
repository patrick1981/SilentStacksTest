// modules/data/data-manager.js - FIXED
(() => {
  'use strict';

  class DataManager {
    static dependencies = ['StorageAdapter'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];
      
      this.stateManager = null;
      this.eventBus = null;
      this.storage = null;
      this.requestManager = null;
      this.api = null;
      this.offline = null;
      
      this.queueKey = 'sync:queue:v1';
      this.queue = [];
      this.flushing = false;
      this.maxRetries = 5;
    }

    async initialize() {
      try {
        const SS = window.SilentStacks || {};
        
        this.stateManager = SS.core?.stateManager || null;
        this.eventBus = SS.core?.eventBus || null;
        this.storage = SS.modules?.StorageAdapter || null;
        this.requestManager = SS.modules?.RequestManager || null;
        this.api = SS.modules?.APIClient || null;
        this.offline = SS.modules?.OfflineManager || null;

        if (!this.storage) {
          throw new Error('StorageAdapter dependency not found');
        }

        await this.setupModule();
        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized DataManager');
        return { status: 'success', module: 'DataManager' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    async setupModule() {
      try {
        // Load existing queue
        const saved = await this.storage.retrieve(this.queueKey);
        this.queue = Array.isArray(saved) ? saved : [];

        // Set up event listeners
        this._setupEventListeners();
      } catch (e) {
        this.recordError('Setup failed', e);
      }
    }

    _setupEventListeners() {
      if (this.eventBus) {
        this.eventBus.on?.('net:online', () => this.flushQueue());
        this.eventBus.on?.('offline:sync-queued', () => this.flushQueue());
        this.eventBus.on?.('data:flush', () => this.flushQueue());
        
        // Handle enrichment requests
        this.eventBus.on?.('data:queue:enrich', async (data) => {
          const { pmid, doi, nctId, id } = data || {};
          await this.queueWrite('custom', {
            handler: 'fetchEnrichment',
            args: { id, pmid, doi, nctId }
          });
        });
      }
    }

    // ===== Queue Management =====
    getQueue() {
      return [...this.queue];
    }

    async queueWrite(op, payload) {
      try {
        const item = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          op,
          payload,
          ts: Date.now(),
          tries: 0
        };
        
        this.queue.push(item);
        await this._persistQueue();
        
        this.eventBus?.emit?.('data:queued', { size: this.queue.length, item });
        return item.id;
      } catch (e) {
        this.recordError('Queue write failed', e);
        throw e;
      }
    }

    async flushQueue() {
      if (this.flushing) return;
      
      const online = this.offline?.getStatus?.().online ?? navigator.onLine;
      if (!online) return;

      this.flushing = true;
      this.eventBus?.emit?.('data:flush:start', { size: this.queue.length });
      
      try {
        let changed = false;
        
        for (let i = 0; i < this.queue.length; i++) {
          const job = this.queue[i];
          if (!job) continue;
          
          const success = await this._replayJob(job);
          if (success) {
            this.queue[i] = null;
            changed = true;
            this.eventBus?.emit?.('data:job:success', { job });
          } else {
            job.tries++;
            if (job.tries >= this.maxRetries) {
              this.queue[i] = null;
              changed = true;
              this.eventBus?.emit?.('data:job:failed', { job });
            }
          }
        }
        
        if (changed) {
          this.queue = this.queue.filter(Boolean);
          await this._persistQueue();
        }
        
        this.eventBus?.emit?.('data:flush:complete', { 
          remaining: this.queue.length,
          processed: changed 
        });
      } catch (e) {
        this.recordError('Queue flush failed', e);
      } finally {
        this.flushing = false;
      }
    }

    async _replayJob(job) {
      try {
        switch (job.op) {
          case 'store':
            if (this.storage) {
              await this.storage.store(job.payload.key, job.payload.data);
              return true;
            }
            break;
            
          case 'remove':
            if (this.storage) {
              await this.storage.remove(job.payload.key);
              return true;
            }
            break;
            
          case 'api':
            if (this.api) {
              await this.api.request(job.payload);
              return true;
            }
            break;
            
          case 'custom':
            return await this._handleCustomJob(job);
            
          default:
            this.log(`Unknown job operation: ${job.op}`);
            return true; // Remove unknown jobs
        }
        
        return false;
      } catch (e) {
        this.recordError(`Job replay failed: ${job.id}`, e);
        return false;
      }
    }

    async _handleCustomJob(job) {
      try {
        const { handler, args } = job.payload || {};
        
        switch (handler) {
          case 'fetchEnrichment':
            if (this.api) {
              const { id, pmid, doi, nctId } = args || {};
              // Implement enrichment logic here
              return true;
            }
            break;
            
          default:
            this.log(`Unknown custom handler: ${handler}`);
            return true;
        }
        
        return false;
      } catch (e) {
        this.recordError(`Custom job failed: ${job.payload?.handler}`, e);
        return false;
      }
    }

    async _persistQueue() {
      try {
        if (this.storage) {
          await this.storage.store(this.queueKey, this.queue);
        }
      } catch (e) {
        this.recordError('Queue persistence failed', e);
      }
    }

    // ===== Data Operations =====
    async store(key, data, options = {}) {
      try {
        if (this.storage) {
          await this.storage.store(key, data);
          this.lastActivity = new Date().toISOString();
          return true;
        }
        
        // Queue if storage unavailable
        if (options.queue !== false) {
          await this.queueWrite('store', { key, data });
        }
        
        return false;
      } catch (e) {
        this.recordError('Store operation failed', e);
        if (options.queue !== false) {
          await this.queueWrite('store', { key, data });
        }
        throw e;
      }
    }

    async retrieve(key) {
      try {
        if (this.storage) {
          const result = await this.storage.retrieve(key);
          this.lastActivity = new Date().toISOString();
          return result;
        }
        return null;
      } catch (e) {
        this.recordError('Retrieve operation failed', e);
        return null;
      }
    }

    async remove(key, options = {}) {
      try {
        if (this.storage) {
          await this.storage.remove(key);
          this.lastActivity = new Date().toISOString();
          return true;
        }
        
        // Queue if storage unavailable
        if (options.queue !== false) {
          await this.queueWrite('remove', { key });
        }
        
        return false;
      } catch (e) {
        this.recordError('Remove operation failed', e);
        if (options.queue !== false) {
          await this.queueWrite('remove', { key });
        }
        throw e;
      }
    }

    async clear() {
      try {
        if (this.storage) {
          await this.storage.clear();
          this.lastActivity = new Date().toISOString();
          return true;
        }
        return false;
      } catch (e) {
        this.recordError('Clear operation failed', e);
        return false;
      }
    }

    async keys() {
      try {
        if (this.storage) {
          return await this.storage.keys();
        }
        return [];
      } catch (e) {
        this.recordError('Keys operation failed', e);
        return [];
      }
    }

    // ===== Statistics and Health =====
    getStats() {
      return {
        queueSize: this.queue.length,
        flushing: this.flushing,
        lastActivity: this.lastActivity,
        storageAvailable: !!this.storage,
        initialized: this.initialized
      };
    }

    getHealthStatus() {
      return {
        name: 'DataManager',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {
          queueSize: this.queue.length,
          flushing: this.flushing
        }
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
      
      const SS = window.SilentStacks || {};
      SS.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'DataManager',
        message,
        error: rec.error
      });
    }

    log(msg) {
      const SS = window.SilentStacks || {};
      if (SS.config?.debug) {
        console.log(`[DataManager] ${msg}`);
      }
    }
  }

  // ===== Safe module registration =====
  const moduleInstance = new DataManager();
  
  window.SilentStacks = window.SilentStacks || { modules: {} };
  
  if (window.SilentStacks.registerModule) {
    window.SilentStacks.registerModule('DataManager', moduleInstance);
  } else {
    window.SilentStacks.modules = window.SilentStacks.modules || {};
    window.SilentStacks.modules.DataManager = moduleInstance;
  }
  
  console.log('📦 DataManager loaded');
})();
