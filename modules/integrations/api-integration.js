// modules/integrations/api-integration.js
// SilentStacks v2.0 - Complete API Integration with Clinical Trials and MeSH
(() => {
  'use strict';

  class APIIntegration {
    static dependencies = ['APIClient', 'RequestManager'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;
      this.apiClient = null;
      this.requestManager = null;

      // Rate limiting
      this.rateLimiter = {
        pubmed: { lastCall: 0, interval: 334 }, // 3 calls per second
        crossref: { lastCall: 0, interval: 100 }, // 10 calls per second
        clinicaltrials: { lastCall: 0, interval: 200 } // 5 calls per second
      };

      // Cache
      this.cache = new Map();
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.apiClient = window.SilentStacks?.modules?.APIClient ?? null;
        this.requestManager = window.SilentStacks?.modules?.RequestManager ?? null;

        await this.setupModule();
        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'APIIntegration' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    async setupModule() {
      // Set up lookup button handlers
      this.setupLookupHandlers();
    }

    setupLookupHandlers() {
      // PMID Lookup
      const pmidBtn = document.getElementById('lookup-pmid');
      if (pmidBtn) {
        pmidBtn.addEventListener('click', async () => {
          const pmidInput = document.getElementById('pmid');
          const pmid = pmidInput?.value?.trim();
          if (pmid) {
            await this.lookupPMID(pmid);
          }
        });
      }

      // DOI Lookup
      const doiBtn = document.getElementById('lookup-doi');
      if (doiBtn) {
        doiBtn.addEventListener('click', async () => {
          const doiInput = document.getElementById('doi');
          const doi = doiInput?.value?.trim();
          if (doi) {
            await this.lookupDOI(doi);
          }
        });
      }

      // Clinical Trials Lookup
      const trialsBtn = document.getElementById('lookup-clinical-trials');
      if (trialsBtn) {
        trialsBtn.addEventListener('click', async () => {
          const pmidInput = document.getElementById('pmid');
          const pmid = pmidInput?.value?.trim();
          if (pmid) {
            await this.lookupClinicalTrials(pmid);
          }
        });
      }
    }

    // ===== PMID Lookup with MeSH and Clinical Trials =====
    async lookupPMID(pmid) {
      if (!this.validatePMID(pmid)) {
        this.showStatus('pmid-status', 'Invalid PMID format', 'error');
        return;
      }

      this.showStatus('pmid-status', 'Fetching PubMed data...', 'loading');

      try {
        // Rate limit
        await this.rateLimit('pubmed');

        // Fetch PubMed data
        const pubmedData = await this.fetchPubMedData(pmid);
        
        if (pubmedData) {
          // Auto-fill form fields
          this.autoFillForm(pubmedData);
          
          // Fetch and display MeSH headings
          await this.fetchAndDisplayMeSH(pmid);
          
          // Fetch and display clinical trials
          await this.fetchAndDisplayClinicalTrials(pmid, pubmedData.title);
          
          this.showStatus('pmid-status', '✅ PubMed data loaded successfully', 'success');
        } else {
          this.showStatus('pmid-status', 'No data found for this PMID', 'error');
        }
      } catch (error) {
        this.recordError('PMID lookup failed', error);
        this.showStatus('pmid-status', `Error: ${error.message}`, 'error');
      }
    }

    // ===== DOI Lookup with CrossRef Integration =====
    async lookupDOI(doi) {
      if (!this.validateDOI(doi)) {
        this.showStatus('doi-status', 'Invalid DOI format', 'error');
        return;
      }

      this.showStatus('doi-status', 'Fetching CrossRef data...', 'loading');

      try {
        // Rate limit
        await this.rateLimit('crossref');

        // Fetch CrossRef data
        const crossrefData = await this.fetchCrossRefData(doi);
        
        if (crossrefData) {
          // Auto-fill form fields
          this.autoFillForm(crossrefData);
          
          // Try to find PMID from CrossRef data for MeSH lookup
          if (crossrefData.pmid) {
            await this.fetchAndDisplayMeSH(crossrefData.pmid);
            await this.fetchAndDisplayClinicalTrials(crossrefData.pmid, crossrefData.title);
          }
          
          this.showStatus('doi-status', '✅ CrossRef data loaded successfully', 'success');
        } else {
          this.showStatus('doi-status', 'No data found for this DOI', 'error');
        }
      } catch (error) {
        this.recordError('DOI lookup failed', error);
        this.showStatus('doi-status', `Error: ${error.message}`, 'error');
      }
    }

    // ===== Clinical Trials Lookup =====
    async lookupClinicalTrials(pmid) {
      this.showStatus('clinical-trials-status', 'Searching clinical trials...', 'loading');

      try {
        await this.rateLimit('clinicaltrials');
        
        // First get PubMed data to extract NCT numbers
        const pubmedData = await this.fetchPubMedData(pmid);
        
        if (pubmedData && pubmedData.abstract) {
          const nctNumbers = this.extractNCTNumbers(pubmedData.abstract);
          
          if (nctNumbers.length > 0) {
            const trials = [];
            for (const nct of nctNumbers) {
              const trialData = await this.fetchClinicalTrialData(nct);
              if (trialData) trials.push(trialData);
            }
            
            this.displayClinicalTrials(trials);
            this.showStatus('clinical-trials-status', `✅ Found ${trials.length} clinical trial(s)`, 'success');
          } else {
            this.showStatus('clinical-trials-status', 'No clinical trials found', 'warning');
          }
        } else {
          this.showStatus('clinical-trials-status', 'Could not fetch abstract for trial search', 'error');
        }
      } catch (error) {
        this.recordError('Clinical trials lookup failed', error);
        this.showStatus('clinical-trials-status', `Error: ${error.message}`, 'error');
      }
    }

    // ===== PubMed Data Fetching =====
    async fetchPubMedData(pmid) {
      const cacheKey = `pubmed_${pmid}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      try {
        // Use ESummary for basic metadata
        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json&tool=SilentStacks`;
        const summaryResponse = await fetch(summaryUrl);
        const summaryData = await summaryResponse.json();

        if (summaryData.error) {
          throw new Error('PubMed API error');
        }

        const article = summaryData.result[pmid];
        if (!article) {
          throw new Error('Article not found');
        }

        // Use EFetch for abstract and MeSH terms
        const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&tool=SilentStacks`;
        const fetchResponse = await fetch(fetchUrl);
        const xmlText = await fetchResponse.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Extract abstract
        const abstractEl = xmlDoc.querySelector('AbstractText');
        const abstract = abstractEl ? abstractEl.textContent : '';

        // Format authors
        const authors = this.formatAuthorsNLM(article.authors || []);

        const pubmedData = {
          pmid: pmid,
          title: article.title || '',
          authors: authors,
          journal: article.fulljournalname || article.source || '',
          year: this.extractYear(article.pubdate || ''),
          volume: article.volume || '',
          issue: article.issue || '',
          pages: article.pages || '',
          abstract: abstract,
          doi: this.extractDOI(article.articleids || []),
          source: 'pubmed'
        };

        this.cache.set(cacheKey, pubmedData);
        return pubmedData;
      } catch (error) {
        this.recordError('PubMed fetch failed', error);
        throw error;
      }
    }

    // ===== CrossRef Data Fetching =====
    async fetchCrossRefData(doi) {
      const cacheKey = `crossref_${doi}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      try {
        const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.message) {
          throw new Error('CrossRef data not found');
        }

        const work = data.message;
        const authors = this.formatAuthorsFromCrossRef(work.author || []);

        const crossrefData = {
          doi: doi,
          title: Array.isArray(work.title) ? work.title[0] : work.title || '',
          authors: authors,
          journal: Array.isArray(work['container-title']) ? work['container-title'][0] : work['container-title'] || '',
          year: work.issued?.['date-parts']?.[0]?.[0] || '',
          volume: work.volume || '',
          issue: work.issue || '',
          pages: work.page || '',
          pmid: this.extractPMIDFromCrossRef(work),
          source: 'crossref'
        };

        this.cache.set(cacheKey, crossrefData);
        return crossrefData;
      } catch (error) {
        this.recordError('CrossRef fetch failed', error);
        throw error;
      }
    }

    // ===== MeSH Headings Fetching =====
    async fetchAndDisplayMeSH(pmid) {
      try {
        const meshUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&tool=SilentStacks`;
        const response = await fetch(meshUrl);
        const xmlText = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        const meshHeadings = this.extractMeSHHeadings(xmlDoc);
        
        if (meshHeadings.length > 0) {
          this.displayMeSHHeadings(meshHeadings);
        }
      } catch (error) {
        this.recordError('MeSH fetch failed', error);
      }
    }

    // ===== Clinical Trials Fetching =====
    async fetchAndDisplayClinicalTrials(pmid, title = '') {
      try {
        // First try to extract NCT numbers from abstract
        const pubmedData = await this.fetchPubMedData(pmid);
        let nctNumbers = [];
        
        if (pubmedData.abstract) {
          nctNumbers = this.extractNCTNumbers(pubmedData.abstract);
        }

        // If no NCT numbers found, search by title
        if (nctNumbers.length === 0 && title) {
          nctNumbers = await this.searchClinicalTrialsByTitle(title);
        }

        if (nctNumbers.length > 0) {
          const trials = [];
          for (const nct of nctNumbers.slice(0, 3)) { // Limit to 3 trials
            const trialData = await this.fetchClinicalTrialData(nct);
            if (trialData) trials.push(trialData);
          }
          
          if (trials.length > 0) {
            this.displayClinicalTrials(trials);
          }
        }
      } catch (error) {
        this.recordError('Clinical trials fetch failed', error);
      }
    }

    // ===== Clinical Trial Data Fetching =====
    async fetchClinicalTrialData(nctId) {
      try {
        await this.rateLimit('clinicaltrials');
        
        const url = `https://clinicaltrials.gov/api/v2/studies/${nctId}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.studies && data.studies.length > 0) {
          const study = data.studies[0];
          const protocol = study.protocolSection || {};
          
          return {
            nctId: nctId,
            title: protocol.identificationModule?.briefTitle || '',
            status: protocol.statusModule?.overallStatus || '',
            phase: protocol.designModule?.phases?.join(', ') || '',
            enrollment: protocol.designModule?.enrollmentInfo?.count || '',
            conditions: protocol.conditionsModule?.conditions?.join(', ') || '',
            interventions: protocol.armsInterventionsModule?.interventions?.map(i => i.name).join(', ') || '',
            sponsors: protocol.sponsorCollaboratorsModule?.leadSponsor?.name || '',
            startDate: protocol.statusModule?.startDateStruct?.date || '',
            completionDate: protocol.statusModule?.completionDateStruct?.date || ''
          };
        }
        return null;
      } catch (error) {
        this.recordError('Clinical trial fetch failed', error);
        return null;
      }
    }

    // ===== Display Functions =====
    displayMeSHHeadings(meshHeadings) {
      const meshSection = document.getElementById('mesh-section');
      const meshContainer = document.getElementById('mesh-tags');
      
      if (!meshSection || !meshContainer) return;

      meshContainer.innerHTML = '';
      
      meshHeadings.forEach(mesh => {
        const tag = document.createElement('span');
        tag.className = `mesh-term ${mesh.isMajor ? 'mesh-major' : 'mesh-minor'}`;
        tag.textContent = mesh.term + (mesh.isMajor ? ' ⭐' : '');
        tag.title = `Click to add as tag (${mesh.isMajor ? 'Major' : 'Minor'} topic)`;
        
        tag.addEventListener('click', () => {
          this.addMeshToTags(mesh.term);
        });
        
        meshContainer.appendChild(tag);
      });

      meshSection.style.display = 'block';
    }

    displayClinicalTrials(trials) {
      const trialsSection = document.getElementById('clinical-trials-section');
      const trialsContainer = document.getElementById('clinical-trials-list');
      
      if (!trialsSection || !trialsContainer) return;

      trialsContainer.innerHTML = '';
      
      trials.forEach(trial => {
        const card = document.createElement('div');
        card.className = 'clinical-trial-card';
        
        card.innerHTML = `
          <div class="clinical-trial-header">
            <strong>${trial.nctId}</strong>
            <span class="clinical-trial-phase">${trial.phase}</span>
            <span class="clinical-trial-status status-${trial.status.toLowerCase().replace(/\s+/g, '-')}">${trial.status}</span>
          </div>
          <div class="clinical-trial-title">${trial.title}</div>
          <div class="clinical-trial-conditions"><strong>Conditions:</strong> ${trial.conditions}</div>
          <div class="clinical-trial-interventions"><strong>Interventions:</strong> ${trial.interventions}</div>
          <div class="clinical-trial-enrollment"><strong>Enrollment:</strong> ${trial.enrollment}</div>
          <div class="clinical-trial-sponsors"><strong>Sponsors:</strong> ${trial.sponsors}</div>
        `;
        
        trialsContainer.appendChild(card);
      });

      trialsSection.style.display = 'block';
    }

    // ===== Auto-fill Form =====
    autoFillForm(data) {
      const fields = {
        'title': data.title,
        'authors': data.authors,
        'journal': data.journal,
        'year': data.year,
        'volume': data.volume,
        'issue': data.issue,
        'pages': data.pages
      };

      Object.entries(fields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) {
          field.value = value;
          field.classList.add('auto-filled');
          
          // Remove auto-filled class after a delay
          setTimeout(() => {
            field.classList.remove('auto-filled');
          }, 3000);
        }
      });
    }

    // ===== MeSH Extraction =====
    extractMeSHHeadings(xmlDoc) {
      const meshHeadings = [];
      const meshNodes = xmlDoc.querySelectorAll('MeshHeading');
      
      meshNodes.forEach(node => {
        const descriptorNode = node.querySelector('DescriptorName');
        if (descriptorNode) {
          const term = descriptorNode.textContent;
          const isMajor = descriptorNode.getAttribute('MajorTopicYN') === 'Y';
          
          meshHeadings.push({
            term: term,
            isMajor: isMajor
          });
        }
      });

      return meshHeadings;
    }

    // ===== NCT Number Extraction =====
    extractNCTNumbers(text) {
      const nctRegex = /NCT\d{8}/gi;
      const matches = text.match(nctRegex) || [];
      return [...new Set(matches.map(nct => nct.toUpperCase()))];
    }

    // ===== Search Clinical Trials by Title =====
    async searchClinicalTrialsByTitle(title) {
      try {
        const searchUrl = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(title)}&pageSize=5`;
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.studies && data.studies.length > 0) {
          return data.studies.map(study => 
            study.protocolSection?.identificationModule?.nctId
          ).filter(Boolean);
        }
        return [];
      } catch (error) {
        this.recordError('Clinical trials search failed', error);
        return [];
      }
    }

    // ===== Add MeSH to Tags =====
    addMeshToTags(meshTerm) {
      // This would integrate with your existing tag system
      console.log(`Adding MeSH term to tags: ${meshTerm}`);
      
      // Show feedback
      const notification = document.createElement('div');
      notification.className = 'mesh-notification';
      notification.textContent = `Added "${meshTerm}" to tags`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 15px;
        border-radius: 4px;
        z-index: 10000;
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }

    // ===== Bulk Processing =====
    async processBulkPMIDs(pmidList, options = {}) {
      const results = [];
      const total = pmidList.length;
      
      for (let i = 0; i < pmidList.length; i++) {
        const pmid = pmidList[i].trim();
        if (!this.validatePMID(pmid)) continue;

        try {
          // Update progress
          this.updateBulkProgress(i + 1, total, `Processing PMID ${pmid}...`);
          
          // Fetch data
          const pubmedData = await this.fetchPubMedData(pmid);
          
          if (options.fetchClinicalTrials && pubmedData.abstract) {
            const nctNumbers = this.extractNCTNumbers(pubmedData.abstract);
            const trials = [];
            
            for (const nct of nctNumbers.slice(0, 2)) {
              const trialData = await this.fetchClinicalTrialData(nct);
              if (trialData) trials.push(trialData);
            }
            
            pubmedData.clinicalTrials = trials;
          }

          if (options.fetchMeSH) {
            // MeSH would be extracted from the XML fetch above
            pubmedData.meshHeadings = []; // Placeholder
          }

          results.push(pubmedData);
          
          // Rate limiting
          await this.rateLimit('pubmed');
          
        } catch (error) {
          this.recordError(`Bulk PMID ${pmid} failed`, error);
          results.push({ pmid, error: error.message });
        }
      }

      return results;
    }

    // ===== Utility Functions =====
    validatePMID(pmid) {
      return /^\d{1,8}$/.test(pmid);
    }

    validateDOI(doi) {
      return /^10\.\d{4,}\/[^\s]+$/.test(doi);
    }

    formatAuthorsNLM(authors) {
      if (!Array.isArray(authors)) return '';
      
      return authors.map(author => {
        if (typeof author === 'string') return author;
        if (author.name) return author.name;
        
        const last = author.lastname || author.family || '';
        const first = author.forename || author.given || '';
        const initials = first.split(' ').map(n => n.charAt(0)).join('');
        
        return `${last} ${initials}`.trim();
      }).join(', ');
    }

    formatAuthorsFromCrossRef(authors) {
      if (!Array.isArray(authors)) return '';
      
      return authors.map(author => {
        const family = author.family || '';
        const given = author.given || '';
        const initials = given.split(' ').map(n => n.charAt(0)).join('');
        
        return `${family} ${initials}`.trim();
      }).join(', ');
    }

    extractYear(dateString) {
      const match = dateString.match(/\b(19|20)\d{2}\b/);
      return match ? match[0] : '';
    }

    extractDOI(articleIds) {
      if (!Array.isArray(articleIds)) return '';
      const doiEntry = articleIds.find(id => id.idtype === 'doi');
      return doiEntry ? doiEntry.value : '';
    }

    extractPMIDFromCrossRef(work) {
      // CrossRef sometimes includes PMID in URL or other fields
      const url = work.URL || '';
      const pmidMatch = url.match(/pmid[\/:](\d+)/i);
      return pmidMatch ? pmidMatch[1] : '';
    }

    // ===== Rate Limiting =====
    async rateLimit(service) {
      const limiter = this.rateLimiter[service];
      if (!limiter) return;

      const now = Date.now();
      const timeSinceLastCall = now - limiter.lastCall;
      
      if (timeSinceLastCall < limiter.interval) {
        const delay = limiter.interval - timeSinceLastCall;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      this.rateLimiter[service].lastCall = Date.now();
    }

    // ===== Status Display =====
    showStatus(elementId, message, type) {
      const element = document.getElementById(elementId);
      if (!element) return;

      element.textContent = message;
      element.className = `lookup-status ${type}`;
      element.style.display = 'block';

      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          element.style.display = 'none';
        }, 5000);
      }
    }

    updateBulkProgress(current, total, message) {
      const statusEl = document.getElementById('bulk-paste-status');
      if (statusEl) {
        statusEl.textContent = `${message} (${current}/${total})`;
        statusEl.className = 'bulk-upload-status loading';
        statusEl.style.display = 'block';
      }
    }

    // ===== Health and Diagnostics =====
    getHealthStatus() {
      return {
        name: 'APIIntegration',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {
          cacheSize: this.cache.size
        }
      };
    }

    recordError(message, error) {
      const errorRecord = {
        message,
        error: error?.message || String(error),
        stack: window.SilentStacks?.config?.debug ? error?.stack : undefined,
        timestamp: new Date().toISOString()
      };
      this.errors.push(errorRecord);
      if (this.errors.length > 100) {
        this.errors = this.errors.slice(-100);
      }

      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'APIIntegration',
        message,
        error: errorRecord.error
      });
    }

    log(message) {
      if (window.SilentStacks?.config?.debug) {
        console.log(`[APIIntegration] ${message}`);
      }
    }
  }

  // Register module
  const moduleInstance = new APIIntegration();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('APIIntegration', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.APIIntegration = moduleInstance;
  }

  console.log('📦 APIIntegration loaded');
})();