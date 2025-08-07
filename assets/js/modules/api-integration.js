// assets/js/modules/api-integration.js  
// SilentStacks API Integration Module v1.5 - COMPLETE WITH MESH & CLINICAL TRIALS
// Handles PubMed API, CrossRef API, ClinicalTrials.gov + MeSH headings + Clinical trial detection

(() => {
  'use strict';

  // Prevent multiple loading
  if (window.SilentStacks?.modules?.APIIntegration?.initialized) {
    console.log('🧬 API Integration already loaded, skipping...');
    return;
  }

  const CONFIG = {
    pubmed: {
      baseURL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
      timeout: 15000,
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

  const CompleteAPIIntegration = {
    initialized: false,

    // Initialize API integration
    initialize() {
      if (this.initialized) return;
      
      console.log('🔧 Initializing COMPLETE API Integration v1.5...');
      
      try {
        this.setupEventHandlers();
        this.setupPubMedIntegration();
        this.setupCrossRefIntegration();
        this.setupClinicalTrialsIntegration();
        this.initialized = true;
        
        console.log('✅ COMPLETE API Integration v1.5 initialized successfully');
        
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

    // ENHANCED: Fetch PubMed metadata with MeSH headings AND clinical trials
    async fetchPubMedMetadata(pmid, includeClinicalTrials = true, includeMeSH = true) {
      if (!pmid || !/^\d+$/.test(pmid)) {
        throw new Error('Invalid PMID format');
      }

      console.log(`🔍 Fetching COMPLETE metadata for PMID ${pmid}...`);

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

        // Build enhanced metadata from summary
        const metadata = this.parseSummaryRecord(record, pmid);

        // Step 2: Get detailed XML data for MeSH headings and clinical trials
        if (includeMeSH || includeClinicalTrials) {
          const fetchUrl = `${CONFIG.pubmed.baseURL}efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${keyParam}`;
          
          try {
            const fetchResponse = await this.fetchWithRetry(fetchUrl, {
              timeout: CONFIG.pubmed.timeout
            });
            
            const xmlText = await fetchResponse.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

            // Extract MeSH headings if requested
            if (includeMeSH) {
              metadata.meshHeadings = this.extractMeSHTerms(xmlDoc);
              metadata.majorMeshTerms = metadata.meshHeadings.filter(mesh => mesh.majorTopic);
              console.log(`✅ Extracted ${metadata.meshHeadings.length} MeSH terms (${metadata.majorMeshTerms.length} major)`);
            }

            // Extract clinical trial information from XML
            if (includeClinicalTrials) {
              metadata.nctNumbers = this.extractNCTNumbers(xmlDoc);
              metadata.hasLinkedClinicalTrial = metadata.nctNumbers.length > 0;
              
              if (metadata.nctNumbers.length > 0) {
                console.log(`✅ Found ${metadata.nctNumbers.length} NCT numbers in abstract/data: ${metadata.nctNumbers.join(', ')}`);
              }
            }

            // Extract publication types for better classification
            metadata.publicationTypes = this.extractPublicationTypes(xmlDoc);
            metadata.isRandomizedControlledTrial = metadata.publicationTypes.some(type => 
              type.toLowerCase().includes('randomized controlled trial')
            );
            metadata.isClinicalTrial = metadata.publicationTypes.some(type => 
              type.toLowerCase().includes('clinical trial')
            ) || metadata.nctNumbers.length > 0;

          } catch (xmlError) {
            console.warn('Failed to fetch XML data:', xmlError);
            // Continue with summary data only
          }
        }

        // Step 3: Search ClinicalTrials.gov for related trials
        if (includeClinicalTrials) {
          try {
            const clinicalTrials = await this.searchClinicalTrialsForPMID(pmid);
            metadata.clinicalTrials = clinicalTrials;
            
            if (clinicalTrials.length > 0) {
              metadata.hasLinkedClinicalTrial = true;
              console.log(`✅ Found ${clinicalTrials.length} related clinical trials via ClinicalTrials.gov search`);
            }
          } catch (error) {
            console.warn(`Failed to search clinical trials for PMID ${pmid}:`, error);
            metadata.clinicalTrials = [];
          }
        }

        console.log(`✅ COMPLETE metadata fetch successful for PMID ${pmid}`);
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
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        fetchedAt: new Date().toISOString()
      };

      // Title
      metadata.title = record.title || '';

      // Authors in NLM format
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

    // RESTORED: Extract MeSH terms from XML
    extractMeSHTerms(xmlDoc) {
      const meshTerms = [];
      const meshElements = xmlDoc.querySelectorAll('MeshHeading');

      meshElements.forEach(meshHeading => {
        const descriptorName = meshHeading.querySelector('DescriptorName');
        if (descriptorName) {
          const term = {
            term: descriptorName.textContent.trim(),
            majorTopic: descriptorName.getAttribute('MajorTopicYN') === 'Y',
            ui: descriptorName.getAttribute('UI') || ''
          };
          
          // Also get qualifiers (subheadings)
          const qualifiers = [];
          const qualifierElements = meshHeading.querySelectorAll('QualifierName');
          qualifierElements.forEach(qualifier => {
            qualifiers.push({
              qualifier: qualifier.textContent.trim(),
              majorTopic: qualifier.getAttribute('MajorTopicYN') === 'Y',
              ui: qualifier.getAttribute('UI') || ''
            });
          });
          
          term.qualifiers = qualifiers;
          meshTerms.push(term);
        }
      });

      return meshTerms;
    },

    // Extract publication types
    extractPublicationTypes(xmlDoc) {
      const types = [];
      const typeElements = xmlDoc.querySelectorAll('PublicationType');

      typeElements.forEach(type => {
        const ui = type.getAttribute('UI') || '';
        const text = type.textContent.trim();
        
        if (text) {
          types.push(text);
        }
      });

      return types;
    },

    // ENHANCED: Extract NCT numbers from article XML
    extractNCTNumbers(xmlDoc) {
      const nctNumbers = [];
      
      // Method 1: Look in DataBankList for ClinicalTrials.gov entries
      const dataBankElements = xmlDoc.querySelectorAll('DataBank');
      dataBankElements.forEach(dataBank => {
        const dataBankName = dataBank.querySelector('DataBankName');
        if (dataBankName && dataBankName.textContent.includes('ClinicalTrials.gov')) {
          const accessionElements = dataBank.querySelectorAll('AccessionNumber');
          accessionElements.forEach(accession => {
            const nct = accession.textContent.trim();
            if (nct.match(/^NCT\d{8}$/i)) {
              nctNumbers.push(nct.toUpperCase());
            }
          });
        }
      });

      // Method 2: Search in abstract text for NCT numbers
      const abstractElements = xmlDoc.querySelectorAll('AbstractText');
      abstractElements.forEach(abstractElement => {
        const abstractText = abstractElement.textContent;
        const nctMatches = abstractText.match(/NCT\d{8}/gi);
        if (nctMatches) {
          nctMatches.forEach(nct => {
            const upperNCT = nct.toUpperCase();
            if (!nctNumbers.includes(upperNCT)) {
              nctNumbers.push(upperNCT);
            }
          });
        }
      });

      // Method 3: Look in OtherID elements
      const otherIdElements = xmlDoc.querySelectorAll('OtherID');
      otherIdElements.forEach(otherId => {
        const idText = otherId.textContent.trim();
        if (idText.match(/^NCT\d{8}$/i)) {
          const upperNCT = idText.toUpperCase();
          if (!nctNumbers.includes(upperNCT)) {
            nctNumbers.push(upperNCT);
          }
        }
      });

      return nctNumbers;
    },

    // ENHANCED: Search ClinicalTrials.gov for studies mentioning this PMID
    async searchClinicalTrialsForPMID(pmid) {
      console.log(`🧪 Searching ClinicalTrials.gov for PMID ${pmid}...`);

      const clinicalTrials = [];

      try {
        // Search strategy 1: Direct PMID reference
        const pmidSearchUrl = `${CONFIG.clinicaltrials.baseURL}studies?query.term=${pmid}&pageSize=20&format=json`;
        
        const pmidResponse = await this.fetchWithRetry(pmidSearchUrl, {
          timeout: CONFIG.clinicaltrials.timeout
        });
        
        if (pmidResponse.ok) {
          const pmidData = await pmidResponse.json();
          const pmidStudies = pmidData.studies || [];
          
          pmidStudies.forEach(study => {
            const trial = this.parseClinicalTrialStudy(study);
            if (trial.nctNumber) {
              clinicalTrials.push(trial);
            }
          });
        }

        // Search strategy 2: If we found NCT numbers in the article, get their details
        // (This would be done in a separate call to get full trial details)

      } catch (error) {
        console.warn(`⚠️ ClinicalTrials.gov search failed for PMID ${pmid}:`, error);
      }

      return clinicalTrials;
    },

    // Parse clinical trial study data with enhanced fields
    parseClinicalTrialStudy(study) {
      const protocol = study.protocolSection || {};
      const identification = protocol.identificationModule || {};
      const status = protocol.statusModule || {};
      const design = protocol.designModule || {};
      const conditions = protocol.conditionsModule || {};
      const interventions = protocol.armsInterventionsModule || {};
      const eligibility = protocol.eligibilityModule || {};

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
            name: intervention.name || '',
            description: intervention.description || ''
          })) : [],
        startDate: status.startDateStruct ? 
          this.formatDateStruct(status.startDateStruct) : '',
        completionDate: status.completionDateStruct ? 
          this.formatDateStruct(status.completionDateStruct) : '',
        enrollment: status.enrollmentInfo ? status.enrollmentInfo.count : null,
        eligibilityCriteria: eligibility.eligibilityCriteria || '',
        ageRange: eligibility.minimumAge || eligibility.maximumAge ? 
          `${eligibility.minimumAge || 'N/A'} to ${eligibility.maximumAge || 'N/A'}` : '',
        sex: eligibility.sex || '',
        sponsors: protocol.sponsorCollaboratorsModule ? 
          this.extractSponsors(protocol.sponsorCollaboratorsModule) : []
      };
    },

    // Helper: Format date struct
    formatDateStruct(dateStruct) {
      if (!dateStruct.date) return '';
      return dateStruct.date;
    },

    // Helper: Extract sponsors
    extractSponsors(sponsorModule) {
      const sponsors = [];
      
      if (sponsorModule.leadSponsor) {
        sponsors.push({
          name: sponsorModule.leadSponsor.name || '',
          type: 'Lead Sponsor'
        });
      }
      
      if (sponsorModule.collaborators) {
        sponsorModule.collaborators.forEach(collab => {
          sponsors.push({
            name: collab.name || '',
            type: 'Collaborator'
          });
        });
      }
      
      return sponsors;
    },

    // PMID lookup button handler with MeSH and clinical trials
    async lookupPMID() {
      const pmidInput = document.getElementById('pmid');
      const statusDiv = document.getElementById('pmid-status');
      
      if (!pmidInput || !statusDiv) {
        console.error('PMID lookup elements not found');
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

      this.showStatus(statusDiv, 'Fetching metadata + MeSH terms + clinical trials...', 'loading');

      try {
        // Fetch complete metadata including MeSH and clinical trials
        const metadata = await this.fetchPubMedMetadata(pmid, true, true);
        
        // Fill form fields
        this.fillFormFields(metadata);
        
        // Display MeSH headings if found
        if (metadata.meshHeadings && metadata.meshHeadings.length > 0) {
          this.displayMeSHHeadings(metadata.meshHeadings);
        }
        
        // Display clinical trials if found
        if (metadata.clinicalTrials && metadata.clinicalTrials.length > 0) {
          this.displayClinicalTrials(metadata.clinicalTrials);
        }
        
        // Show comprehensive status
        let statusMessage = `✅ PMID ${pmid}: Metadata fetched`;
        if (metadata.meshHeadings?.length > 0) {
          statusMessage += ` + ${metadata.meshHeadings.length} MeSH terms`;
        }
        if (metadata.nctNumbers?.length > 0) {
          statusMessage += ` + ${metadata.nctNumbers.length} NCT numbers`;
        }
        if (metadata.clinicalTrials?.length > 0) {
          statusMessage += ` + ${metadata.clinicalTrials.length} clinical trials`;
        }
        
        this.showStatus(statusDiv, statusMessage, 'success');

      } catch (error) {
        console.error('PMID lookup error:', error);
        this.showStatus(statusDiv, `❌ Error: ${error.message}`, 'error');
      }
    },

    // Display MeSH headings in UI
    displayMeSHHeadings(meshHeadings) {
      const meshSection = document.getElementById('mesh-section');
      const meshList = document.getElementById('mesh-tags');
      
      if (!meshSection || !meshList) {
        console.warn('MeSH display elements not found');
        return;
      }
      
      meshList.innerHTML = meshHeadings.map(mesh => `
        <span class="mesh-term ${mesh.majorTopic ? 'mesh-major' : 'mesh-minor'}" 
              title="${mesh.ui}">
          ${mesh.term}${mesh.majorTopic ? ' *' : ''}
        </span>
      `).join('');
      
      meshSection.style.display = 'block';
      console.log(`✅ Displayed ${meshHeadings.length} MeSH headings`);
    },

    // Display clinical trials in UI (enhanced)
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
          ${trial.ageRange ? `<div class="clinical-trial-age">
            <strong>Age Range:</strong> ${trial.ageRange}
          </div>` : ''}
          ${trial.sponsors.length > 0 ? `<div class="clinical-trial-sponsors">
            <strong>Sponsors:</strong> ${trial.sponsors.map(s => s.name).join(', ')}
          </div>` : ''}
        </div>
      `).join('');
      
      section.style.display = 'block';
      console.log(`✅ Displayed ${clinicalTrials.length} clinical trials with enhanced details`);
    },

    // DOI lookup button handler (unchanged)
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

    // Fetch CrossRef metadata using DOI (unchanged)
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
  window.SilentStacks.modules.APIIntegration = CompleteAPIIntegration;

  console.log('🧬 COMPLETE API Integration v1.5 module loaded (with MeSH + Clinical Trials)');

})();