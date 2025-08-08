// modules/data/data-manager.js
(() => {
  'use strict';

  class DataManager {
    static dependencies = ['StorageAdapter', 'RequestManager', 'APIClient', 'OfflineManager'];
    static required = true;

    constructor(){
      this.initialized=false; this.lastActivity=new Date().toISOString(); this.errors=[];
      this.stateManager=null; this.eventBus=null; this.storage=null; this.requestManager=null; this.api=null; this.offline=null;
      this.queueKey='sync:queue:v1'; this.queue=[]; this.flushing=false; this.maxRetries=5;
    }

    async initialize(){
      try{
        this.stateManager=window.SilentStacks?.core?.stateManager??null;
        this.eventBus=window.SilentStacks?.core?.eventBus??null;
        this.storage=window.SilentStacks?.modules?.StorageAdapter??null;
        this.requestManager=window.SilentStacks?.modules?.RequestManager??null;
        this.api=window.SilentStacks?.modules?.APIClient??null;
        this.offline=window.SilentStacks?.modules?.OfflineManager??null;

        await this.setupModule();
        this.initialized=true; this.lastActivity=new Date().toISOString();
        this.log('Initialized DataManager'); return {status:'success', module:'DataManager'};
      }catch(e){ this.recordError('Initialization failed', e); throw e; }
    }

    async setupModule(){
      const saved=await this.storage?.retrieve(this.queueKey); this.queue=Array.isArray(saved)?saved:[];
      this.eventBus?.on?.('net:online', ()=>this.flushQueue());
      this.eventBus?.on?.('offline:sync-queued', ()=>this.flushQueue());
      // Allow APIClient/Bulk to request enrichment when offline:
      this.eventBus?.on?.('data:queue:enrich', async ({pmid, doi, nctId, id}) => {
        if (!id && pmid) {
          // If no id, just record enrichment job that searches by identifiers later
        }
        await this.queueWrite('custom', { handler:'fetchEnrichment', args:{ id, pmid, doi, nctId } });
      });
      this.eventBus?.on?.('data:flush', ()=>this.flushQueue());
    }

    getQueue(){ return [...this.queue]; }

    async queueWrite(op, payload){
      const item={ id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`, op, payload, ts:Date.now(), tries:0 };
      this.queue.push(item); await this._persistQueue();
      this.eventBus?.emit?.('data:queued', { size:this.queue.length, item }); return item.id;
    }

    async flushQueue(){
      if(this.flushing) return;
      const online = this.offline?.getStatus?.().online ?? navigator.onLine;
      if(!online) return;

      this.flushing=true; this.eventBus?.emit?.('data:flush:start', {size:this.queue.length});
      try{
        let changed=false;
        for(let i=0;i<this.queue.length;i++){
          const job=this.queue[i]; if(!job) continue;
          const ok=await this._replay(job);
          if(ok){ this.queue[i]=null; changed=true; this.eventBus?.emit?.('data:flush:ok', {id:job.id, op:job.op}); }
          else{ job.tries++; if(job.tries>this.maxRetries){ this.eventBus?.emit?.('data:flush:drop', {id:job.id, op:job.op}); this.queue[i]=null; changed=true; } else { await this._backoff(job.tries); } }
        }
        if(changed){ this.queue=this.queue.filter(Boolean); await this._persistQueue(); }
      }catch(e){ this.recordError('flushQueue failed', e); }
      finally{ this.flushing=false; this.eventBus?.emit?.('data:flush:end', {size:this.queue.length}); this.lastActivity=new Date().toISOString(); }
    }

    async _replay(job){
      try{
        switch(job.op){
          case 'create': {
            const rec=job.payload?.record; if(!rec) return true;
            await this.requestManager.createRequest(rec); return true;
          }
          case 'update': {
            const {id, changes}=job.payload||{}; if(!id||!changes) return true;
            await this.requestManager.updateRequest(id, changes); return true;
          }
          case 'delete': {
            const {id}=job.payload||{}; if(!id) return true;
            await this.requestManager.deleteRequest(id); return true;
          }
          case 'custom': {
            const {handler, args}=job.payload||{};
            if(handler==='fetchEnrichment'){ await this._enrichRecord(args?.id, args?.pmid, args?.doi, args?.nctId); return true; }
            return true;
          }
          default: return true;
        }
      }catch(e){ this.recordError(`Replay failed (${job.op})`, e); return false; }
    }

    async _enrichRecord(id, pmid, doi, nctId) {
      // if id missing, we can't update a specific record; future hook could search by ids
      if (!id) return;

      const rec = this.requestManager.getRequestById?.(id); if (!rec) return;

      try {
        if (pmid) {
          const sum = await this.api.fetchPubMedData(pmid);
          const base = sum?.result?.[pmid] || {};
          const authors = (base.authors || []).map(a => a.name).join('; ');
          const year = (base.pubdate || '').match(/\b(19|20)\d{2}\b/)?.[0] || '';
          Object.assign(rec, { title: base.title || rec.title, journal: base.fulljournalname || base.source || rec.journal, authors: authors || rec.authors, year: year || rec.year });
        }
      } catch (e) { this.recordError('enrich PubMed failed', e); }

      try {
        if (doi) {
          const cross = await this.api.fetchCrossRefData(doi);
          const msg = cross?.message || {};
          const authors = (msg.author || []).map(a => [a.family, a.given].filter(Boolean).join(', ')).join('; ');
          const year = msg?.issued?.['date-parts']?.[0]?.[0] || rec.year;
          Object.assign(rec, {
            title: (Array.isArray(msg.title) ? msg.title[0] : msg.title) || rec.title,
            journal: (Array.isArray(msg['container-title']) ? msg['container-title'][0] : msg['container-title']) || rec.journal,
            authors: authors || rec.authors, year: year || rec.year, volume: msg.volume || rec.volume, issue: msg.issue || rec.issue, pages: msg.page || rec.pages
          });
        }
      } catch (e) { this.recordError('enrich CrossRef failed', e); }

      try {
        if (nctId) {
          await this.api.fetchClinicalTrialsData(nctId); // normalize in integration module if needed
        }
      } catch (e) { this.recordError('enrich CT.gov failed', e); }

      await this.requestManager.updateRequest(id, rec);
    }

    async _persistQueue(){ await this.storage?.store(this.queueKey, this.queue); }
    async _backoff(tries){ const base=Math.min(2000*2**(tries-1), 15000); const jitter=Math.floor(Math.random()*250); await new Promise(r=>setTimeout(r, base+jitter)); }

    getHealthStatus(){ return {name:'DataManager', status:this.initialized?'healthy':'not-initialized', initialized:this.initialized, lastActivity:this.lastActivity, errors:this.errors.slice(-5), performance:{queueSize:this.queue.length, flushing:this.flushing}}; }
    recordError(message, error){ const rec={message, error:error?.message||String(error), stack:(window.SilentStacks?.config?.debug?error?.stack:undefined), timestamp:new Date().toISOString()}; this.errors.push(rec); if(this.errors.length>100)this.errors=this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({type:'error', module:'DataManager', message, error:rec.error}); }
    log(m){ if(window.SilentStacks?.config?.debug) console.log(`[DataManager] ${m}`); }
  }

  const moduleInstance = new DataManager();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('DataManager', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.DataManager = moduleInstance; }
  console.log('📦 DataManager loaded');
})();
