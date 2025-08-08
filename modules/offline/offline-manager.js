// modules/offline/offline-manager.js
(() => {
  'use strict';

  class OfflineManager {
    static dependencies = [];
    static required = true;

    constructor() {
      this.initialized=false; this.lastActivity=new Date().toISOString(); this.errors=[];
      this.stateManager=null; this.eventBus=null;
      this.status={ online:navigator.onLine, swReady:false, swVersion:null, lastAssetUpdate:null, syncing:false };
      this._onOnline=()=>this._handleOnline(); this._onOffline=()=>this._handleOffline(); this._onSWMessage=(e)=>this._handleSWMessage(e);
    }

    async initialize(){
      try{
        this.stateManager=window.SilentStacks?.core?.stateManager??null;
        this.eventBus=window.SilentStacks?.core?.eventBus??null;
        await this.setupModule();
        this.initialized=true; this.lastActivity=new Date().toISOString();
        this.log('Initialized OfflineManager'); return {status:'success', module:'OfflineManager'};
      }catch(e){ this.recordError('Initialization failed', e); throw e;}
    }

    async setupModule(){
      window.addEventListener('online', this._onOnline);
      window.addEventListener('offline', this._onOffline);
      if('serviceWorker' in navigator){
        navigator.serviceWorker.addEventListener('message', this._onSWMessage);
        try{ const reg=await navigator.serviceWorker.getRegistration(); reg?.active?.postMessage?.({type:'GET_VERSION'});}catch{}
      }
      this.eventBus?.on?.('offline:syncRequests', ()=>this.requestBackgroundSync());
      this._commitState();
    }

    getStatus(){ return {...this.status}; }
    async requestBackgroundSync(){ this.status.syncing=true; this._commitState();
      try{ const reg=await navigator.serviceWorker.getRegistration(); await reg?.sync?.register('sync-requests'); this.eventBus?.emit?.('offline:sync-queued'); }
      catch(e){ this.recordError('Background sync register failed', e);} finally{ this.status.syncing=false; this._commitState(); }
    }

    _handleOnline(){ this.status.online=true; this._commitState(); this.eventBus?.emit?.('net:online'); this.requestBackgroundSync(); }
    _handleOffline(){ this.status.online=false; this._commitState(); this.eventBus?.emit?.('net:offline'); }
    _handleSWMessage(event){
      const data=event.data||{};
      switch(data.type){
        case 'SW_READY': this.status.swReady=true; this.status.swVersion=data.version||null; this._commitState(); this.eventBus?.emit?.('sw:ready', {version:data.version}); break;
        case 'ASSET_UPDATED': this.status.lastAssetUpdate=data.url; this._commitState(); this.eventBus?.emit?.('sw:assetUpdated', data); break;
        case 'CACHE_CLEARED': this.eventBus?.emit?.('sw:cacheCleared'); break;
        case 'SW_VERSION': this.status.swVersion=data.version||null; this._commitState(); break;
        default: break;
      }
    }
    _commitState(){ this.stateManager?.setState('offline:status', {...this.status}); this.lastActivity=new Date().toISOString(); }

    getHealthStatus(){ return {name:'OfflineManager', status:this.initialized?'healthy':'not-initialized', initialized:this.initialized, lastActivity:this.lastActivity, errors:this.errors.slice(-5), performance:{online:this.status.online, swReady:this.status.swReady}}; }
    recordError(message, error){ const rec={message, error:error?.message||String(error), stack:(window.SilentStacks?.config?.debug?error?.stack:undefined), timestamp:new Date().toISOString()}; this.errors.push(rec); if(this.errors.length>100)this.errors=this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({type:'error', module:'OfflineManager', message, error:rec.error}); }
    log(m){ if(window.SilentStacks?.config?.debug) console.log(`[OfflineManager] ${m}`); }
  }

  const moduleInstance = new OfflineManager();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('OfflineManager', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.OfflineManager = moduleInstance; }
  console.log('📦 OfflineManager loaded');
})();
