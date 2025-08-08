// modules/integrations/clinical-trials.js
(() => {
  'use strict';

  class ClinicalTrialsIntegration {
    static dependencies = ['APIClient', 'PubMedIntegration'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;
      this.api = null;
      this.pubmed = null;
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.api = window.SilentStacks?.modules?.APIClient ?? null;
        this.pubmed = window.SilentStacks?.modules?.PubMedIntegration ?? null;

        await this.setupModule();
        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'ClinicalTrialsIntegration' };
      } catch (e) { this.recordError('Initialization failed', e); throw e; }
    }

    async setupModule() {}

    // ===== Required API =====
    async findTrialsByPMID(pmid) {
      // Pull abstract using PubMedIntegration → extract NCTs → fetch each trial
      const rec = await this.pubmed.fetchPubMedRecord(pmid);
      const ncts = this.extractNCTFromText(rec.abstract || '');
      const out = [];
      for (const nctId of ncts) {
        try { out.push(await this.fetchTrialDetails(nctId)); } catch (e) { this.recordError('Trial fetch failed', e); }
      }
      return out;
    }

    async fetchTrialDetails(nctId) {
      const json = await this.api.fetchClinicalTrialsData(nctId);
      const study = Array.isArray(json?.studies) ? json.studies[0] : null;
      if (!study) return { nctId, notFound: true };
      return { nctId, ...study };
    }

    extractNCTFromText(text) {
      const ids = new Set();
      const rx = /\bNCT\d{8}\b/gi;
      let m; while ((m = rx.exec(text))) ids.add(m[0].toUpperCase());
      return [...ids];
    }

    formatTrialInfo(trialData) {
      // produce a compact summary string
      if (!trialData || trialData.notFound) return 'Trial not found';
      const title = trialData?.protocolSection?.identificationModule?.officialTitle || '';
      const status = this.getTrialStatus(trialData) || '';
      const phase = this.getTrialPhase(trialData) || '';
      const enroll = trialData?.protocolSection?.designModule?.enrollmentInfo?.count || '';
      return `${title} — ${status}, ${phase}, N=${enroll}`;
    }

    getTrialPhase(trialData) {
      return trialData?.protocolSection?.designModule?.phases?.join(', ') || '';
    }

    getTrialStatus(trialData) {
      return trialData?.protocolSection?.statusModule?.overallStatus || '';
    }

    // ===== Boilerplate =====
    getHealthStatus(){ return { name: 'ClinicalTrialsIntegration', status: this.initialized ? 'healthy' : 'not-initialized',
      initialized: this.initialized, lastActivity: this.lastActivity, errors: this.errors.slice(-5), performance: {} }; }
    recordError(message, error){
      const rec = { message, error: error?.message || String(error), timestamp: new Date().toISOString() };
      this.errors.push(rec); if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'ClinicalTrialsIntegration', message, error: rec.error });
    }
    log(m){ if (window.SilentStacks?.config?.debug) console.log(`[ClinicalTrialsIntegration] ${m}`); }
  }

  const moduleInstance = new ClinicalTrialsIntegration();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('ClinicalTrialsIntegration', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.ClinicalTrialsIntegration = moduleInstance; }
  console.log('📦 ClinicalTrialsIntegration loaded');
})();
