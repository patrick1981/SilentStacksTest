// assets/js/enhanced-apis.js
// Enhanced API Integration for SilentStacks v1.4 - Modular Architecture

'use strict';

(function() {
  // ----- Configuration -----
  const CONFIG = {
    pubmed: {
      baseURL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
      rateLimit: 200,
      timeout: 30000
    },
    crossref: {
      baseURL: 'https://api.crossref.org/works/',
      rateLimit: 100,
      timeout: 30000
    },
    clinicaltrials: {
      baseURL: 'https://clinicaltrials.gov/api/v2/studies',
      rateLimit: 1000,
      timeout: 30000
    }
  };

  // ----- Rate limiting state -----
  const rateLimits = {
    pubmed: 0,
    crossref: 0,
    clinicaltrials: 0
  };

  // ----- Utility: fetch with timeout -----
  function fetchWithTimeout(url, timeout, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  }

  // ----- Rate limiter -----
  async function respectRateLimit(service) {
    const now = Date.now();
    const last = rateLimits[service] || 0;
    const interval = CONFIG[service].rateLimit;
    if (now - last < interval) {
      await new Promise(r => setTimeout(r, interval - (now - last)));
    }
    rateLimits[service] = Date.now();
  }

  // ----- Connection Manager -----
  class ConnectionManager {
    constructor() {
      this.status = navigator.onLine ? 'online' : 'offline';
      this.listeners = [];
      this._setupEvents();
    }
    _setupEvents() {
      window.addEventListener('online', () => {
        this.status = 'online';
        this._notify('online');
        APIQueue.processAll();
      });
      window.addEventListener('offline', () => {
        this.status = 'offline';
        this._notify('offline');
      });
    }
    isOnline() {
      return this.status === 'online';
    }
    addListener(fn) {
      this.listeners.push(fn);
    }
    _notify(status) {
      this.listeners.forEach(fn => fn(status));
    }
  }

  // ----- API Queue for offline requests -----
  class APIQueue {
    static queue = [];
    static processing = false;

    static add(req) {
      APIQueue.queue.push({
        ...req,
        timestamp: Date.now(),
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2,9)}`
      });
      APIQueue._save();
    }

    static async processAll() {
      if (APIQueue.processing || !APIQueue.queue.length) return;
      APIQueue.processing = true;
      const results = [];
      for (const req of APIQueue.queue) {
        try {
          await APIQueue._execute(req);
          results.push({ req, success: true });
        } catch {
          results.push({ req, success: false });
        }
      }
      APIQueue.queue = APIQueue.queue.filter(
        q => !results.find(r => r.success && r.req.id === q.id)
      );
      APIQueue._save();
      APIQueue.processing = false;
    }

    static async _execute(request) {
      switch (request.type) {
        case 'pmid': return PubMedAPI.fetchPubMed(request.identifier);
        case 'doi':  return CrossRefAPI.fetchCrossRef(request.identifier);
        case 'nct':  return ClinicalTrialsAPI.getStudyDetails(request.identifier);
        default: throw new Error(`Unknown request type: ${request.type}`);
      }
    }

    static _save() {
      try {
        localStorage.setItem('silentStacks_apiQueue', JSON.stringify(APIQueue.queue));
      } catch {
        console.warn('Could not save API queue, clearing it');
        APIQueue.queue = [];
      }
    }

    static load() {
      try {
        const raw = localStorage.getItem('silentStacks_apiQueue');
        if (raw) APIQueue.queue = JSON.parse(raw);
      } catch {
        console.warn('Could not load API queue');
        APIQueue.queue = [];
      }
    }
  }

  // ----- PubMed API -----
  class PubMedAPI {
    static async fetchPubMed(pmid) {
      console.log(`PubMed lookup: ${pmid}`);
      if (!connectionManager.isOnline()) {
        APIQueue.add({ type: 'pmid', identifier: pmid });
        return { pmid, title: '[QUEUED]', authors: '', journal: '', year: '', doi: '', meshHeadings: [], nctNumbers: [] };
      }
      await respectRateLimit('pubmed');
      const apiKey = window.settings?.apiKey || '';
      const keyParam = apiKey ? `&api_key=${apiKey}` : '';

      // ESummary
      const sumUrl = `${CONFIG.pubmed.baseURL}esummary.fcgi?db=pubmed&id=${pmid}&retmode=json${keyParam}`;
      const sumRes = await fetchWithTimeout(sumUrl, CONFIG.pubmed.timeout);
      if (!sumRes.ok) throw new Error(`ESummary ${sumRes.status}`);
      const sumData = await sumRes.json();
      const rec = sumData.result[pmid];
      if (!rec) throw new Error(`PMID ${pmid} not found`);

      const meta = {
        pmid,
        title: rec.title || '',
        authors: (rec.authors || []).map(a => a.name).join('; '),
        journal: rec.fulljournalname || rec.source || '',
        year: (rec.pubdate || '').split(' ')[0] || '',
        doi: ''
      };

      // EFetch XML
      const fetchUrl = `${CONFIG.pubmed.baseURL}efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${keyParam}`;
      const xmlRes = await fetchWithTimeout(fetchUrl, CONFIG.pubmed.timeout);
      if (xmlRes.ok) {
        const xmlText = await xmlRes.text();
        const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
        meta.doi = this._extractDOI(doc);
        meta.meshHeadings = this._extractMeSH(doc);
        meta.nctNumbers = this._extractNCT(doc);
        meta.hasLinkedClinicalTrial = meta.nctNumbers.length > 0;
        meta.primaryNCT = meta.nctNumbers[0] || null;
        meta.abstract = this._extractAbstract(doc);
        meta.publicationTypes = this._extractPubTypes(doc);
        meta.medicalSpecialties = this._identifySpecialties(meta.meshHeadings);
        meta.studyType = this._identifyStudyType(meta.publicationTypes, meta.meshHeadings);
        meta.evidenceLevel = this._assessEvidence(meta.publicationTypes);
      }

      return meta;
    }

    static _extractDOI(doc) {
      const n1 = doc.querySelector('ArticleId[IdType="doi"]');
      if (n1) return n1.textContent.trim();
      for (let id of doc.querySelectorAll('ArticleId')) {
        const t = id.textContent.trim();
        if (t.startsWith('10.')) return t;
      }
      const el = doc.querySelector('ELocationID[EIdType="doi"]');
      return el?.textContent.trim() || '';
    }

    static _extractMeSH(doc) {
      const out = [];
      doc.querySelectorAll('MeshHeadingList MeshHeading').forEach(m => {
        const d = m.querySelector('DescriptorName');
        if (!d) return;
        const term = d.textContent.trim();
        out.push({
          term,
          ui: d.getAttribute('UI') || '',
          isMajor: d.getAttribute('MajorTopicYN') === 'Y',
          qualifiers: Array.from(m.querySelectorAll('QualifierName')).map(q => ({
            term: q.textContent.trim(),
            ui: q.getAttribute('UI'),
            isMajor: q.getAttribute('MajorTopicYN') === 'Y'
          }))
        });
      });
      return out;
    }

    static _extractNCT(doc) {
      const set = new Set();
      doc.querySelectorAll('DataBankList DataBank').forEach(bank => {
        if (bank.querySelector('DataBankName')?.textContent.trim() === 'ClinicalTrials.gov') {
          bank.querySelectorAll('AccessionNumberList AccessionNumber').forEach(acc => {
            const t = acc.textContent.trim();
            if (/^NCT\d{8}$/.test(t)) set.add(t);
          });
        }
      });
      const abs = this._extractAbstract(doc) || '';
      (abs.match(/NCT\d{8}/g) || []).forEach(n => set.add(n));
      return Array.from(set);
    }

    static _extractAbstract(doc) {
      return doc.querySelector('AbstractText')?.textContent.trim() || '';
    }

    static _extractPubTypes(doc) {
      return Array.from(doc.querySelectorAll('PublicationTypeList PublicationType')).map(el => el.textContent.trim());
    }

    static _identifySpecialties(mesh) {
      const specialtyMap = {
        cardiology: ['Heart Diseases', 'Cardiovascular System', 'Myocardial Infarction', 'Heart Failure', 'Arrhythmias', 'Coronary Disease'],
        oncology: ['Neoplasms', 'Cancer', 'Tumor', 'Oncology', 'Chemotherapy', 'Radiation Therapy', 'Immunotherapy'],
        neurology: ['Nervous System Diseases', 'Brain', 'Neurological', 'Stroke', 'Epilepsy', 'Alzheimer', 'Parkinson'],
        endocrinology: ['Diabetes Mellitus', 'Endocrine System', 'Hormones', 'Thyroid', 'Insulin', 'Metabolism'],
        infectiousDiseases: ['Infection', 'Bacteria', 'Virus', 'Antibiotics', 'Antimicrobial', 'COVID-19', 'Pneumonia'],
        psychiatry: ['Mental Disorders', 'Depression', 'Anxiety', 'Schizophrenia', 'Bipolar', 'Psychotherapy'],
        pediatrics: ['Child', 'Infant', 'Adolescent', 'Pediatrics', 'Neonatal', 'Child Development'],
        obGyn: ['Pregnancy', 'Obstetrics', 'Gynecology', 'Women', 'Reproductive', 'Contraception'],
        surgery: ['Surgery', 'Surgical Procedures', 'Postoperative', 'Anesthesia', 'Operative'],
        emergency: ['Emergency', 'Trauma', 'Critical Care', 'Intensive Care', 'Resuscitation'],
        radiology: ['Radiology', 'Imaging', 'MRI', 'CT', 'Ultrasound', 'X-Ray', 'Nuclear Medicine'],
        pharmacology: ['Pharmacology', 'Drug Therapy', 'Pharmacokinetics', 'Drug Interactions', 'Medication']
      };
      const found = new Set();
      mesh.forEach(m => {
        const lt = m.term.toLowerCase();
        Object.entries(specialtyMap).forEach(([key, kws]) => {
          if (kws.some(k => lt.includes(k.toLowerCase()))) found.add(key);
        });
      });
      return Array.from(found);
    }

    static _identifyStudyType(pubTypes, mesh) {
      const pts = pubTypes.map(t => t.toLowerCase());
      if (pts.some(t => t.includes('clinical trial'))) return 'clinical-trial';
      if (pts.some(t => t.includes('randomized controlled trial'))) return 'clinical-trial';
      if (pts.some(t => t.includes('systematic review'))) return 'systematic-review';
      if (pts.some(t => t.includes('meta-analysis'))) return 'systematic-review';
      if (pts.some(t => t.includes('case report'))) return 'case-report';
      if (pts.some(t => t.includes('cohort')) || mesh.some(m => m.term.toLowerCase().includes('cohort'))) return 'cohort-study';
      return 'other';
    }

    static _assessEvidence(pubTypes) {
      const pts = pubTypes.map(t => t.toLowerCase());
      if (pts.some(t => t.includes('systematic review'))) return 'level-1';
      if (pts.some(t => t.includes('meta-analysis'))) return 'level-1';
      if (pts.some(t => t.includes('randomized controlled trial'))) return 'level-2';
      if (pts.some(t => t.includes('cohort'))) return 'level-4';
      if (pts.some(t => t.includes('case-control'))) return 'level-5';
      if (pts.some(t => t.includes('case report'))) return 'level-6';
      return 'level-7';
    }
  }

  // ----- CrossRef API -----
  class CrossRefAPI {
    static async fetchCrossRef(doi) {
      console.log(`CrossRef lookup: ${doi}`);
      if (!connectionManager.isOnline()) {
        APIQueue.add({ type: 'doi', identifier: doi });
        return { doi, title: '[QUEUED]', authors: '', journal: '', year: '', pmid: '' };
      }
      await respectRateLimit('crossref');
      const clean = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '').trim();
      const url = CONFIG.crossref.baseURL + encodeURIComponent(clean);
      const res = await fetchWithTimeout(url, CONFIG.crossref.timeout, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`CrossRef ${res.status}`);
      const msg = (await res.json()).message;
      return {
        doi: clean,
        title: msg.title?.[0] || '',
        authors: (msg.author || []).map(a => `${a.given} ${a.family}`).join('; '),
        journal: msg['container-title']?.[0] || '',
        year: msg.published?.['date-parts']?.[0]?.[0] || '',
        pmid: ''
      };
    }
  }

  // ----- ClinicalTrials.gov API -----
  class ClinicalTrialsAPI {
    static async getStudyDetails(nctId) {
      console.log(`ClinicalTrials.gov lookup: ${nctId}`);
      if (!connectionManager.isOnline()) {
        APIQueue.add({ type: 'nct', identifier: nctId });
        throw new Error('Offline – queued');
      }
      await respectRateLimit('clinicaltrials');
      const url = `${CONFIG.clinicaltrials.baseURL}/${nctId}?format=json`;
      const res = await fetchWithTimeout(url, CONFIG.clinicaltrials.timeout);
      if (!res.ok) throw new Error(`CTG ${res.status}`);
      const data = await res.json();
      if (!data.studies?.length) throw new Error('No study data');
      const s = data.studies[0].protocolSection.identificationModule || {};
      return {
        nctId: s.nctId || '',
        briefTitle: s.briefTitle || '',
        officialTitle: s.officialTitle || '',
        leadSponsor: s.organization?.fullName || '',
        sourceUrl: `https://clinicaltrials.gov/study/${s.nctId}`
      };
    }
  }

  // ----- Enhanced Lookup Orchestrator -----
  class EnhancedLookup {
    static detectType(id) {
      const c = id.trim();
      if (/^NCT\d{8}$/i.test(c)) return 'nct';
      if (/^\d{1,8}$/.test(c)) return 'pmid';
      if (/^10\.\d+\/.+$/.test(c) || /^doi:/i.test(c)) return 'doi';
      return 'unknown';
    }
    static async perform(id) {
      const t = this.detectType(id);
      switch (t) {
        case 'pmid': return PubMedAPI.fetchPubMed(id);
        case 'doi':  return CrossRefAPI.fetchCrossRef(id);
        case 'nct':  return ClinicalTrialsAPI.getStudyDetails(id);
        default: throw new Error(`Unsupported type: ${t}`);
      }
    }
  }

  // ----- Initialization -----
  const connectionManager = new ConnectionManager();

  document.addEventListener('DOMContentLoaded', () => {
    APIQueue.load();
    if (connectionManager.isOnline()) setTimeout(() => APIQueue.processAll(), 1000);
  });

  // ----- Public API export -----
  window.SilentStacksAPI = {
    PubMedAPI,
    CrossRefAPI,
    ClinicalTrialsAPI,
    EnhancedLookup,
    connectionManager,
    APIQueue,
    fetchPubMed: PubMedAPI.fetchPubMed.bind(PubMedAPI),
    fetchCrossRef: CrossRefAPI.fetchCrossRef.bind(CrossRefAPI)
  };
})();

// ----- Adapter for existing app.js expectations -----
;(function() {
  'use strict';

  // Global helper for MeSH tag clicks
  window.addMeshToTags = function(term) {
    const input = document.getElementById('mesh-tags-input');
    if (input) {
      input.value = input.value ? `${input.value}; ${term}` : term;
    }
  };

  const APIIntegration = {
    fetchPubMed:   window.SilentStacksAPI.fetchPubMed,
    fetchCrossRef: window.SilentStacksAPI.fetchCrossRef,

    async lookupPMID() {
      const pmidInput = document.getElementById('pmid');
      if (!pmidInput) return;
      const pmid = pmidInput.value.trim();
      if (!/^\d+$/.test(pmid)) {
        this.setStatus('PMID must be numeric', 'error');
        return;
      }
      this.setStatus('Looking up PMID...', 'loading');
      try {
        const data = await this.fetchPubMed(pmid);
        window.SilentStacks.modules.RequestManager?.populateForm(data);
        this.setStatus('Metadata populated', 'success');
        if (data.meshHeadings?.length) this.displayMeSHTerms(data.meshHeadings);
      } catch (err) {
        this.setStatus(`Lookup failed: ${err.message}`, 'error');
      }
    },

    async lookupDOI() {
      const doiInput = document.getElementById('doi');
      if (!doiInput) return;
      const doi = doiInput.value.trim();
      if (!doi) {
        this.setStatus('Enter a DOI', 'error');
        return;
      }
      this.setStatus('Looking up DOI...', 'loading');
      try {
        const data = await this.fetchCrossRef(doi);
        window.SilentStacks.modules.RequestManager?.populateForm(data);
        this.setStatus('DOI lookup successful', 'success');
      } catch (err) {
        this.setStatus(`Lookup failed: ${err.message}`, 'error`);
      }
    },

    setStatus(msg, type = '') {
      ['pmid-status', 'doi-status'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = msg;
          el.className = `status-indicator ${type}`;
          el.style.display = 'block';
          if (type === 'success') setTimeout(() => el.style.display = 'none', 5000);
        }
      });
    },

    displayMeSHTerms(mesh) {
      const sec  = document.getElementById('mesh-section');
      const tags = document.getElementById('mesh-tags');
      if (sec && tags) {
        sec.style.display = 'block';
        tags.innerHTML = mesh.map(m => `
          <button class="mesh-tag" onclick="addMeshToTags('${m.term.replace(/'/g,"\\'")}')" title="${m.isMajor ? 'Major' : 'Minor'}">
            ${m.term}${m.isMajor ? ' ★' : ''}
          </button>
        `).join('') || '<div class="mesh-empty">No MeSH terms</div>';
      }
    },

    initialize() {
      console.log('✅ APIIntegration initialized');
      document.getElementById('lookup-pmid-btn')?.addEventListener('click', () => this.lookupPMID());
      document.getElementById('lookup-doi-btn')?.addEventListener('click', () => this.lookupDOI());
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.APIIntegration = APIIntegration;
    APIIntegration.initialize();
  });
})();
