// modules/integrations/pubmed-integration.js
(() => {
  'use strict';

  class PubMedIntegration {
    static dependencies = ['APIClient'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;
      this.api = null;
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.api = window.SilentStacks?.modules?.APIClient ?? null;

        await this.setupModule();
        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'PubMedIntegration' };
      } catch (e) { this.recordError('Initialization failed', e); throw e; }
    }

    async setupModule() {}

    // ===== Public API =====
    async fetchPubMedRecord(pmid) {
      const summary = await this.api.fetchPubMedData(pmid);

      // EFetch (XML) for MeSH, abstract, publication types
      let xmlDoc = null, xmlStr = '';
      try {
        const url = await this.api.buildSecureURL(
          window.SilentStacks.config.api.endpoints.pubmed || this.api.endpoints.pubmed,
          '/efetch.fcgi',
          { db: 'pubmed', id: pmid, retmode: 'xml' }
        );
        const res = await fetch(url, { cache: 'no-store' });
        xmlStr = await res.text();
        xmlDoc = this.parseXMLResponse(xmlStr);
      } catch (e) {
        this.recordError('EFetch failed; proceeding with ESummary only', e);
      }

      const mesh = xmlDoc ? this.extractMeshHeadings(xmlDoc) : [];
      const abstract = xmlDoc ? (xmlDoc.querySelector('AbstractText')?.textContent || '') : '';
      const pubTypes = xmlDoc ? this.extractPublicationTypes(xmlDoc) : [];
      const classification = this.classifyPublication(pubTypes);

      return { summary, xml: xmlStr, mesh, abstract, pubTypes, classification };
    }

    parseXMLResponse(xmlData) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlData, 'application/xml');
      const err = doc.querySelector('parsererror');
      if (err) throw new Error('XML parsing error');
      return doc;
    }

    extractMeshHeadings(xmlDoc) {
      const heads = [];
      xmlDoc.querySelectorAll('MeshHeading').forEach(h => {
        const desc = h.querySelector('DescriptorName');
        if (desc) {
          heads.push({
            term: desc.textContent.trim(),
            major: desc.getAttribute('MajorTopicYN') === 'Y'
          });
        }
      });
      return heads;
    }

    extractPublicationTypes(xmlDoc) {
      const types = [];
      xmlDoc.querySelectorAll('PublicationTypeList > PublicationType').forEach(pt => {
        types.push(pt.textContent.trim());
      });
      return types;
    }

    classifyPublication(pubTypes = []) {
      const T = pubTypes.map(t => t.toLowerCase());
      const has = (needle) => T.some(t => t.includes(needle));

      if (has('randomized controlled trial') || has('randomised controlled trial')) return 'Randomized Controlled Trial';
      if (has('clinical trial')) return 'Clinical Trial';
      if (has('systematic review')) return 'Systematic Review';
      if (has('meta-analysis')) return 'Meta-analysis';
      if (has('comparative study')) return 'Comparative Study';
      if (has('case-control')) return 'Case-Control Study';
      if (has('cohort')) return 'Cohort Study';
      if (has('case reports')) return 'Case Report';
      return pubTypes[0] || 'Article';
    }

    formatAuthors(authorsArray) {
      const safe = Array.isArray(authorsArray) ? authorsArray : [];
      return safe.map(a => {
        const last = a?.family || a?.LastName || a?.last || a?.lname || a?.name?.split(' ').slice(-1)[0] || '';
        const first = a?.given || a?.ForeName || a?.first || a?.fname || '';
        return [last, first].filter(Boolean).join(', ');
      });
    }

    async getRelatedArticles(pmid) {
      try {
        const url = await this.api.buildSecureURL(
          window.SilentStacks.config.api.endpoints.pubmed || this.api.endpoints.pubmed,
          '/elink.fcgi',
          { dbfrom: 'pubmed', id: pmid, cmd: 'prlinks' }
        );
        const res = await fetch(url);
        return { linksFetched: res.ok };
      } catch (e) {
        this.recordError('Related fetch failed', e); return { linksFetched: false };
      }
    }

    formatCitation(record, style = 'NLM') {
      const title = record?.title || '';
      const journal = record?.journal || '';
      const year = record?.year || '';
      const volume = record?.volume || '';
      const issue = record?.issue || '';
      const pages = record?.pages || '';
      const authors = (record?.authors || '').replace(/\s*;\s*/g, '; ');
      if (style === 'NLM') {
        const vi = [volume, issue && `(${issue})`].filter(Boolean).join('');
        const p = pages ? `:${pages}` : '';
        return `${authors}. ${title}. ${journal}. ${year};${vi}${p}.`;
      }
      return `${authors}. ${title}. ${journal}. ${year}.`;
    }

    // ===== Boilerplate =====
    getHealthStatus() {
      return { name: 'PubMedIntegration', status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized, lastActivity: this.lastActivity, errors: this.errors.slice(-5), performance: {} };
    }
    recordError(message, error) {
      const rec = { message, error: error?.message || String(error), timestamp: new Date().toISOString() };
      this.errors.push(rec); if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'PubMedIntegration', message, error: rec.error });
    }
    log(m){ if (window.SilentStacks?.config?.debug) console.log(`[PubMedIntegration] ${m}`); }
  }

  const moduleInstance = new PubMedIntegration();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('PubMedIntegration', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.PubMedIntegration = moduleInstance; }
  console.log('📦 PubMedIntegration loaded');
})();
