// assets/js/modules/api-integration.js
// SilentStacks API Integration Module v1.5 - COMPLETE
// Handles PubMed API, CrossRef API, and ClinicalTrials.gov integration with NLM formatting

(() => {
  'use strict';

  const CONFIG = {
    pubmed: {
      baseURL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000
    },
    crossref: {
      baseURL: 'https://api.crossref.org/',
      timeout: 8000
    },
    clinicaltrials: {
      baseURL: 'https://clinicaltrials.gov/api/v2/',
      timeout: 10000
    }
  };

  const EnhancedAPIIntegration = {
    initialized: false,

    // Initialize API integration
    initialize() {
      console.log('🔧 Initializing Enhanced API Integration v1.5...');
      
      try {
        this.setupEventHandlers();
        this.setupPubMedIntegration();
        this.setupCrossRefIntegration();
        this.setupClinicalTrialsIntegration();
        this.initialized = true;
        
        console.log('✅ Enhanced API Integration v1.5 initialized successfully');
        
      } catch (error) {
        console.error('❌ API Integration initialization failed:', error);
      }
    },

    // Setup event handlers for lookup buttons
    setupEventHandlers() {
      // PMID lookup button
      const pmidBtn = document.getElementById('lookup-pmid');
      if (pmidBtn) {
        pmidBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.lookupPMID();
        });
        console.log('✅ PMID lookup button connected');
      }

      // DOI lookup button  
      const doiBtn = document.getElementById('lookup-doi');
      if (doiBtn) {
        doiBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.lookupDOI();
        });
        console.log('✅ DOI lookup button connected');
      }

      // Clinical trials button (if exists)
      const clinicalBtn = document.getElementById('lookup-clinical-trials');
      if (clinicalBtn) {
        clinicalBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.lookupClinicalTrials();
        });
        console.log('✅ Clinical trials button connected');
      }
    },

    // Setup PubMed API integration
    setupPubMedIntegration() {
      console.log('🧬 Setting up PubMed API integration...');
      
      // Check for API key
      const apiKey = window.SilentStacks?.config?.ncbiApiKey;
      if (apiKey) {
        console.log('✅ NCBI API key configured');
      } else {
        console.log('⚠️ No NCBI API key - using rate-limited access (3 requests/second)');
      }
    },

    // Setup CrossRef API integration
    setupCrossRefIntegration() {
      console.log('📚 Setting up CrossRef API integration...');
      console.log('✅ CrossRef API integration ready (no auth required)');
    },

    // Setup ClinicalTrials.gov API integration
    setupClinicalTrialsIntegration() {
      console.log('🧪 Setting up ClinicalTrials.gov API integration...');
      console.log('✅ ClinicalTrials.gov API integration ready (no auth required)');
    },

    // Fetch PubMed metadata with enhanced NLM formatting
    async fetchPubMedMetadata(pmid, includeClinicalTrials = true) {
      if (!pmid || !/^\d+$/.test(pmid)) {
        throw new Error('Invalid PMID format');
      }

      console.log(`🔍 Fetching PubMed metadata for PMID ${pmid}...`);

      try {
        const apiKey = window.SilentStacks?.config?.ncbiApiKey;
        const keyParam = apiKey ? `&api_key=${apiKey}` : '';
        
        // Step 1: Get basic metadata from ESummary
        const summaryUrl = `${CONFIG.pubmed.baseURL}esummary.fcgi?db=pubmed&id=${pmid}&retmode=json${keyParam}`;
        
        const summaryResponse = await this.fetchWithRetry(summaryUrl, {
          timeout: CONFIG.pubmed.timeout
        });
        
        const summaryData = await summaryResponse.json();
        
        if (summaryData.error) {
          throw new Error(`PubMed error: ${summaryData.error}`);
        }
        
        const record = summaryData.result[pmid];
        if (!record || record.error) {
          throw new Error(`PMID ${pmid} not found`);
        }

        // Build enhanced metadata in NLM format
        const metadata = this.parseSummaryRecord(record, pmid);

        // Step 2: Fetch associated clinical trials if requested
        if (includeClinicalTrials) {
          try {
            metadata.clinicalTrials = await this.fetchClinicalTrialsForPMID(pmid);
            metadata.hasLinkedClinicalTrial = metadata.clinicalTrials.length > 0;
            
            if (metadata.clinicalTrials.length > 0) {
              console.log(`✅ Found ${metadata.clinicalTrials.length} clinical trials for PMID ${pmid}`);
            }
          } catch (error) {
            console.warn(`Failed to fetch clinical trials for PMID ${pmid}:`, error);
            metadata.clinicalTrials = [];
            metadata.hasLinkedClinicalTrial = false;
          }
        }

        console.log(`✅ Successfully fetched metadata for PMID ${pmid}`);
        return metadata;

      } catch (error) {
        console.error(`❌ PubMed fetch failed for PMID ${pmid}:`, error);
        throw error;
      }
    },

    // Parse ESummary record into NLM-formatted metadata
    parseSummaryRecord(record, pmid) {
      const metadata = {
        pmid: pmid,
        source: 'pubmed',
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      };

      // Title
      metadata.title = record.title || '';

      // Authors in NLM format (Last, First Initial)
      metadata.authors = this.formatAuthorsNLM(record.authors || []);

      // Journal information
      metadata.journal = record.fulljournalname || record.source || '';
      
      // Publication date
      metadata.year = this.parsePublicationYear(record.pubdate);
      
      // Volume, Issue, Pages
      metadata.volume = record.volume || '';
      metadata.issue = record.issue || '';
      metadata.pages = record.pages || '';

      // DOI from ELocationID
      metadata.doi = record.elocationid || '';

      return metadata;
    },

    // Format authors in NLM style
    formatAuthorsNLM(authors) {
      if (!authors || !Array.isArray(authors)) {
        return '';
      }

      return authors.map(author => {
        const name = author.name || '';
        if (!name) return '';
        
        // PubMed format is usually "Last FM" or "Last F M"
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
          return parts[0]; // Just last name
        }
        
        const lastName = parts[0];
        const otherParts = parts.slice(1);
        
        // Extract initials from remaining parts
        const initials = otherParts.map(part => part.charAt(0).toUpperCase()).join('');
        
        return initials ? `${lastName} ${initials}` : lastName;
      }).filter(author => author).join(', ');
    },

    // Parse publication year from pubdate
    parsePublicationYear(pubdate) {
      if (!pubdate) return '';
      
      // Extract 4-digit year
      const yearMatch = pubdate.match(/(\d{4})/);
      return yearMatch ? yearMatch[1] : '';
    },

    // Fetch clinical trials associated with PMID
    async fetchClinicalTrialsForPMID(pmid) {
      console.log(`🧪 Searching clinical trials for PMID ${pmid}...`);

      try {
        // Search ClinicalTrials.gov for studies that reference this PMID
        const searchUrl = `${CONFIG.clinicaltrials.baseURL}studies?query.term=${pmid}&pageSize=20&format=json`;
        
        const response = await this.fetchWithRetry(searchUrl, {
          timeout: CONFIG.clinicaltrials.timeout
        });
        
        if (!response.ok) {
          console.warn(`ClinicalTrials.gov API returned ${response.status} for PMID ${pmid}`);
          return [];
        }
        
        const data = await response.json();
        const studies = data.studies || [];
        
        const clinicalTrials = studies
          .map(study => this.parseClinicalTrialStudy(study))
          .filter(trial => trial.nctNumber); // Only include trials with NCT numbers
        
        return clinicalTrials;
        
      } catch (error) {
        console.warn(`⚠️ Failed to fetch clinical trials for PMID ${pmid}:`, error);
        return [];
      }
    },

    // Parse clinical trial study data
    parseClinicalTrialStudy(study) {
      const protocol = study.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const status = protocol.statusModule || {};
      const design = protocol.designModule || {};
      const conditions = protocol.conditionsModule || {};
      const interventions = protocol.armsInterventionsModule || {};

      return {
        nctNumber: identification.nctId || '',
        title: identification.briefTitle || identification.officialTitle || '',
        status: status.overallStatus || '',
        phase: design.phases ? design.phases.join(', ') : '',
        studyType: design.studyType || '',
        conditions: conditions.conditions || [],
        interventions: interventions.interventions ? 
          interventions.interventions.map(intervention => ({
            type: intervention.type || '',
            name: intervention.name || ''
          })) : [],
        startDate: status.startDateStruct ? 
          `${status.startDateStruct.date || ''}` : '',
        completionDate: status.completionDateStruct ? 
          `${status.completionDateStruct.date || ''}` : '',
        enrollment: status.enrollmentInfo ? status.enrollmentInfo.count : null,
        sponsors: protocol.sponsorCollaboratorsModule ? 
          (protocol.sponsorCollaboratorsModule.leadSponsor ? 
            [protocol.sponsorCollaboratorsModule.leadSponsor] : []) : []
      };
    },

    // Fetch CrossRef metadata using DOI
    async fetchCrossRefMetadata(doi) {
      if (!doi) {
        throw new Error('DOI is required');
      }

      console.log(`📚 Fetching CrossRef metadata for DOI ${doi}...`);

      try {
        const cleanDOI = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '');
        const url = `${CONFIG.crossref.baseURL}works/${encodeURIComponent(cleanDOI)}`;
        
        const response = await this.fetchWithRetry(url, {
          timeout: CONFIG.crossref.timeout,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`CrossRef API error: ${response.status}`);
        }
        
        const data = await response.json();
        const work = data.message;
        
        if (!work) {
          throw new Error('No metadata found in CrossRef response');
        }

        // Format in NLM style
        const metadata = {
          title: work.title ? work.title[0] : '',
          authors: this.formatCrossRefAuthorsNLM(work.author || []),
          journal: work['container-title'] ? work['container-title'][0] : '',
          year: work.published && work.published['date-parts'] && work.published['date-parts'][0] ? 
            work.published['date-parts'][0][0].toString() : '',
          volume: work.volume || '',
          issue: work.issue || '',
          pages: work.page || '',
          doi: work.DOI || cleanDOI,
          source: 'crossref'
        };

        console.log(`✅ Successfully fetched CrossRef metadata for DOI ${doi}`);
        return metadata;

      } catch (error) {
        console.error(`❌ CrossRef fetch failed for DOI ${doi}:`, error);
        throw error;
      }
    },

    // Format CrossRef authors in NLM style
    formatCrossRefAuthorsNLM(authors) {
      return authors.map(author => {
        const family = author.family || '';
        const given = author.given || '';
        
        if (family && given) {
          // Extract initials from given name
          const initials = given.split(/\s+/)
            .map(name => name.charAt(0).toUpperCase())
            .join('');
          
          return `${family} ${initials}`;
        } else if (family) {
          return family;
        } else if (given) {
          return given;
        }
        
        return '';
      }).filter(author => author).join(', ');
    },

    // Search clinical trials by condition or intervention
    async searchClinicalTrials(query, options = {}) {
      console.log(`🔍 Searching clinical trials for: ${query}`);

      try {
        const params = new URLSearchParams({
          'query.term': query,
          'pageSize': options.pageSize || 10,
          'format': 'json'
        });

        if (options.status) {
          params.append('filter.overallStatus', options.status);
        }

        const url = `${CONFIG.clinicaltrials.baseURL}studies?${params.toString()}`;
        
        const response = await this.fetchWithRetry(url, {
          timeout: CONFIG.clinicaltrials.timeout
        });
        
        if (!response.ok) {
          throw new Error(`ClinicalTrials.gov search error: ${response.status}`);
        }
        
        const data = await response.json();
        const studies = data.studies || [];
        
        const results = studies.map(study => this.parseClinicalTrialStudy(study));
        
        console.log(`✅ Found ${results.length} clinical trials for query: ${query}`);
        return results;

      } catch (error) {
        console.error(`❌ Clinical trials search failed for: ${query}`, error);
        throw error;
      }
    },

    // Fetch with retry logic and better error handling
    async fetchWithRetry(url, options = {}) {
      const maxAttempts = CONFIG.pubmed.retryAttempts;
      let lastError;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          
          // Consider 404 as a valid response for APIs (item not found)
          if (response.ok || response.status === 404) {
            return response;
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          
        } catch (error) {
          lastError = error;
          
          // Don't retry on certain errors
          if (error.name === 'AbortError') {
            throw new Error('Request timeout');
          }
          
          if (attempt === maxAttempts) {
            break;
          }
          
          console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${CONFIG.pubmed.retryDelay}ms...`, error.message);
          await new Promise(resolve => setTimeout(resolve, CONFIG.pubmed.retryDelay));
        }
      }

      throw lastError;
    },

    // Validation functions
    validatePMID(pmid) {
      return /^\d{1,8}$/.test(pmid);
    },

    validateDOI(doi) {
      return /^10\.\d+\/.+$/.test(doi);
    },

    validateNCT(nct) {
      return /^NCT\d{8}$/i.test(nct);
    },

    // PMID lookup button handler
    async lookupPMID() {
      const pmidInput = document.getElementById('pmid');
      const statusDiv = document.getElementById('pmid-status');
      
      if (!pmidInput) {
        console.error('PMID input field not found');
        return;
      }
      
      if (!statusDiv) {
        console.error('PMID status element not found');
        return;
      }

      const pmid = pmidInput.value.trim();
      
      if (!pmid) {
        this.showStatus(statusDiv, 'Please enter a PMID', 'error');
        return;
      }

      if (!this.validatePMID(pmid)) {
        this.showStatus(statusDiv, 'PMID must be 1-8 digits', 'error');
        return;
      }

      this.showStatus(statusDiv, 'Looking up PMID and clinical trials...', 'loading');

      try {
        const metadata = await this.fetchPubMedMetadata(pmid, true);
        
        // Fill form fields
        this.fillFormFields(metadata);
        
        // Display clinical trials if found
        if (metadata.clinicalTrials && metadata.clinicalTrials.length > 0) {
          this.displayClinicalTrials(metadata.clinicalTrials);
          this.showStatus(statusDiv, 
            `✅ Found metadata for PMID ${pmid} + ${metadata.clinicalTrials.length} clinical trials`, 
            'success'
          );
        } else {
          this.showStatus(statusDiv, 
            `✅ Found metadata for PMID ${pmid} (no associated clinical trials)`, 
            'success'
          );
        }

      } catch (error) {
        console.error('PMID lookup error:', error);
        this.showStatus(statusDiv, `❌ Error: ${error.message}`, 'error');
      }
    },

    // DOI lookup button handler
    async lookupDOI() {
      const doiInput = document.getElementById('doi');
      const statusDiv = document.getElementById('doi-status');
      
      if (!doiInput || !statusDiv) {
        console.error('DOI lookup elements not found');
        return;
      }

      const doi = doiInput.value.trim();
      
      if (!doi) {
        this.showStatus(statusDiv, 'Please enter a DOI', 'error');
        return;
      }

      if (!this.validateDOI(doi)) {
        this.showStatus(statusDiv, 'DOI must be in format 10.xxxx/xxxxx', 'error');
        return;
      }

      this.showStatus(statusDiv, 'Looking up DOI...', 'loading');

      try {
        const metadata = await this.fetchCrossRefMetadata(doi);
        
        // Fill form fields
        this.fillFormFields(metadata);
        
        this.showStatus(statusDiv, `✅ Found metadata for DOI`, 'success');

      } catch (error) {
        console.error('DOI lookup error:', error);
        this.showStatus(statusDiv, `❌ Error: ${error.message}`, 'error');
      }
    },

    // Clinical trials lookup (if PMID is already entered)
    async lookupClinicalTrials() {
      const pmidInput = document.getElementById('pmid');
      const statusDiv = document.getElementById('clinical-trials-status');
      
      if (!pmidInput || !statusDiv) {
        console.error('Clinical trials lookup elements not found');
        return;
      }

      const pmid = pmidInput.value.trim();
      
      if (!pmid) {
        this.showStatus(statusDiv, 'Please enter a PMID first', 'error');
        return;
      }

      if (!this.validatePMID(pmid)) {
        this.showStatus(statusDiv, 'Invalid PMID format', 'error');
        return;
      }

      this.showStatus(statusDiv, 'Searching for clinical trials...', 'loading');

      try {
        const clinicalTrials = await this.fetchClinicalTrialsForPMID(pmid);
        
        if (clinicalTrials.length > 0) {
          this.displayClinicalTrials(clinicalTrials);
          this.showStatus(statusDiv, `✅ Found ${clinicalTrials.length} clinical trials`, 'success');
        } else {
          this.showStatus(statusDiv, 'No clinical trials found for this PMID', 'info');
        }

      } catch (error) {
        console.error('Clinical trials lookup error:', error);
        this.showStatus(statusDiv, `❌ Error: ${error.message}`, 'error');
      }
    },

    // Fill form fields with metadata
    fillFormFields(metadata) {
      const fields = {
        'title': metadata.title,
        'authors': metadata.authors,
        'journal': metadata.journal,
        'year': metadata.year,
        'volume': metadata.volume,
        'issue': metadata.issue,
        'pages': metadata.pages,
        'doi': metadata.doi
      };

      Object.entries(fields).forEach(([fieldId, value]) => {
        const input = document.getElementById(fieldId);
        if (input && value) {
          input.value = value;
          input.classList.add('auto-filled');
          console.log(`✅ Filled ${fieldId}: ${value}`);
        }
      });
    },

    // Display clinical trials in UI
    displayClinicalTrials(clinicalTrials) {
      const section = document.getElementById('clinical-trials-section');
      const list = document.getElementById('clinical-trials-list');
      
      if (!section || !list || clinicalTrials.length === 0) {
        console.warn('Clinical trials display elements not found or no trials to display');
        return;
      }
      
      list.innerHTML = clinicalTrials.map(trial => `
        <div class="clinical-trial-card">
          <div class="clinical-trial-header">
            <strong>${trial.nctNumber}</strong>
            ${trial.phase ? `<span class="clinical-trial-phase">${trial.phase}</span>` : ''}
            <span class="clinical-trial-status status-${trial.status.toLowerCase().replace(/\s+/g, '-')}">${trial.status}</span>
          </div>
          <div class="clinical-trial-title">${trial.title}</div>
          ${trial.conditions.length > 0 ? `<div class="clinical-trial-conditions">
            <strong>Conditions:</strong> ${trial.conditions.join(', ')}
          </div>` : ''}
          ${trial.interventions.length > 0 ? `<div class="clinical-trial-interventions">
            <strong>Interventions:</strong> ${trial.interventions.map(i => i.name).join(', ')}
          </div>` : ''}
          ${trial.enrollment ? `<div class="clinical-trial-enrollment">
            <strong>Enrollment:</strong> ${trial.enrollment} participants
          </div>` : ''}
        </div>
      `).join('');
      
      section.style.display = 'block';
      console.log(`✅ Displayed ${clinicalTrials.length} clinical trials`);
    },

    // Show status message with proper styling
    showStatus(element, message, type) {
      if (!element) return;
      
      element.innerHTML = message;
      element.className = `status-indicator ${type}`;
      element.style.display = 'block';
      
      // Auto-hide success/error messages after 5 seconds
      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          if (element.className.includes(type)) { // Only hide if still showing same message
            element.style.display = 'none';
          }
        }, 5000);
      }
    }
  };

  // Export module
  window.SilentStacks = window.SilentStacks || { modules: {} };
  window.SilentStacks.modules.APIIntegration = EnhancedAPIIntegration;

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      EnhancedAPIIntegration.initialize();
    });
  } else {
    // DOM already loaded, initialize immediately
    setTimeout(() => {
      EnhancedAPIIntegration.initialize();
    }, 100);
  }

  console.log('🧬 Enhanced API Integration v1.5 module loaded');

})();