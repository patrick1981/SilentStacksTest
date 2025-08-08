// modules/workflows/bulk-upload.js
(() => {
  'use strict';

  class BulkUpload {
    static dependencies = ['RequestManager', 'APIClient', 'DataManager', 'PubMedIntegration', 'ClinicalTrialsIntegration'];
    static required = true;

    constructor() {
      this.initialized=false; this.lastActivity=new Date().toISOString(); this.errors=[];
      this.stateManager=null; this.eventBus=null; this.rm=null; this.api=null; this.dm=null; this.pubmed=null; this.ct=null;
      this._cancel=false; this.rateLimitMs=600;
    }

    async initialize(){
      try{
        this.stateManager=window.SilentStacks?.core?.stateManager??null;
        this.eventBus=window.SilentStacks?.core?.eventBus??null;
        this.rm=window.SilentStacks?.modules?.RequestManager??null;
        this.api=window.SilentStacks?.modules?.APIClient??null;
        this.dm=window.SilentStacks?.modules?.DataManager??null;
        this.pubmed=window.SilentStacks?.modules?.PubMedIntegration??null;
        this.ct=window.SilentStacks?.modules?.ClinicalTrialsIntegration??null;

        await this.setupModule();
        this.initialized=true; this.lastActivity=new Date().toISOString();
        return { status:'success', module:'BulkUpload' };
      }catch(e){ this.recordError('Initialization failed', e); throw e; }
    }

    async setupModule(){}

    async processBulkData(data, format){
      this._cancel=false;
      const entries = await this._parseByFormat(data, format);
      const total = entries.length; let current = 0;

      for (const item of entries) {
        if (this._cancel) break;
        try { await this._handleOne(item); } catch (e) { this.recordError('Item failed', e); }
        current++; this.showProgress(current, total); await this._sleep(this.rateLimitMs);
      }
      return { processed: current, total };
    }

    parseCSV(csvText){
      const rows = Papa.parse(csvText.trim(), { header: true }).data || [];
      return rows.map(r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k.trim().toLowerCase(), String(v||'').trim()])));
    }
    parsePMIDList(pmidText){ return String(pmidText||'').split(/[,\s]+/).map(s=>s.trim()).filter(Boolean).map(pmid=>({pmid})); }
    parseDOCLINEPairs(doclineText){
      return String(doclineText||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(line=>{
        const [pmid, docline] = line.split(',').map(s=>s.trim()); return { pmid, docline };
      });
    }
    validateBulkData(data){ return Array.isArray(data) && data.length>0; }
    showProgress(current, total){
      this.eventBus?.emit?.('bulk:progress', { current, total });
      const el = document.getElementById('bulk-status'); if (el) el.textContent = `Processed ${current}/${total}`;
    }

    async _parseByFormat(data, format){
      switch((format||'').toLowerCase()){
        case 'csv': return this.parseCSV(data);
        case 'pmid': return this.parsePMIDList(data);
        case 'docline': return this.parseDOCLINEPairs(data);
        default:
          if (Array.isArray(data)) return data;
          try{ const j=JSON.parse(data); return Array.isArray(j)?j:[]; }catch{ return []; }
      }
    }

    async _handleOne(item){
      const record = this._seedRecord(item);
      const id = await this.rm.createRequest(record);

      const online = navigator.onLine;
      if (!online) {
        await this.dm?.queueWrite('custom', { handler: 'fetchEnrichment', args: { id, pmid: record.pmid, doi: record.doi } });
        return;
      }

      // Enrich now + NCT extraction
      await this._enrichNow(id, record);
      if (record.pmid) {
        try {
          const pm = await this.pubmed.fetchPubMedRecord(record.pmid);
          const ncts = this.ct.extractNCTFromText(pm.abstract || '');
          for (const n of ncts) {
            try {
              const trial = await this.ct.fetchTrialDetails(n);
              await this.rm.updateRequest(id, { clinicalTrials: [...(record.clinicalTrials||[]), trial] });
            } catch (e) { this.recordError('Trial fetch failed', e); }
          }
        } catch (e) { this.recordError('PM record for NCT extraction failed', e); }
      }
    }

    async _enrichNow(id, record){
      if (record.pmid) {
        try {
          const sum = await this.api.fetchPubMedData(record.pmid);
          const base = sum?.result?.[record.pmid] || {};
          const authors = (base.authors || []).map(a => a.name).join('; ');
          const year = (base.pubdate || '').match(/\b(19|20)\d{2}\b/)?.[0] || '';
          await this.rm.updateRequest(id, {
            title: base.title || record.title,
            journal: base.fulljournalname || base.source || record.journal,
            authors: authors || record.authors, year: year || record.year
          });
        } catch (e) { this.recordError('PubMed enrich failed', e); }
      }
      if (record.doi) {
        try {
          const cross = await this.api.fetchCrossRefData(record.doi);
          const msg = cross?.message || {};
          const authors = (msg.author || []).map(a => [a.family, a.given].filter(Boolean).join(', ')).join('; ');
          const year = msg?.issued?.['date-parts']?.[0]?.[0] || record.year;
          await this.rm.updateRequest(id, {
            title: (Array.isArray(msg.title) ? msg.title[0] : msg.title) || record.title,
            journal: (Array.isArray(msg['container-title']) ? msg['container-title'][0] : msg['container-title']) || record.journal,
            authors: authors || record.authors, year: year || record.year,
            volume: msg.volume || record.volume, issue: msg.issue || record.issue, pages: msg.page || record.pages
          });
        } catch (e) { this.recordError('CrossRef enrich failed', e); }
      }
    }

    _seedRecord(item){
      return {
        pmid: item.pmid || '', doi: item.doi || '',
        title: item.title || '', authors: item.authors || '',
        journal: item.journal || '', year: item.year || '',
        volume: item.volume || '', issue: item.issue || '', pages: item.pages || '',
        priority: item.priority || 'normal', status: item.status || 'pending',
        notes: item.notes || '', tags: item.tags || ''
      };
    }

    _sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

    getHealthStatus(){ return { name:'BulkUpload', status:this.initialized?'healthy':'not-initialized', initialized:this.initialized, lastActivity:this.lastActivity, errors:this.errors.slice(-5), performance:{} }; }
    recordError(message, error){
      const rec={ message, error:error?.message||String(error), timestamp:new Date().toISOString() };
      this.errors.push(rec); if(this.errors.length>100)this.errors=this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type:'error', module:'BulkUpload', message, error:rec.error });
    }
    log(m){ if(window.SilentStacks?.config?.debug) console.log(`[BulkUpload] ${m}`); }
  }

  const moduleInstance = new BulkUpload();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('BulkUpload', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.BulkUpload = moduleInstance; }
  console.log('📦 BulkUpload loaded');
})();
