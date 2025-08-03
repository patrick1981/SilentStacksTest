// SilentStacks API Integration Module v1.4
// Enhanced with MeSH Headings and Clinical Trials.gov Integration
// Handles PubMed, CrossRef, and Clinical Trials API calls with offline support and rate limiting
(() => {
  'use strict';

  // === Rate Limiting Configuration ===
  const RATE_LIMITS = {
    PUBMED: { requests: 3, perSeconds: 1 }, // NCBI recommends 3 requests per second
    CROSSREF: { requests: 50, perSeconds: 1 }, // CrossRef is more generous
    CLINICALTRIALS: { requests: 10, perSeconds: 1 } // Conservative for ClinicalTrials.gov
  };

  // === Rate Limiting State ===
  const rateLimiters = {
    pubmed: { queue: [], lastRequest: 0, processing: false },
    crossref: { queue: [], lastRequest: 0, processing: false },
    clinicaltrials: { queue: [], lastRequest: 0, processing: false }
  };

  // === Enhanced API Functions ===
  async function fetchPubMed(pmid) {
    console.log(`🔍 Fetching PubMed data for PMID: ${pmid}`);
    
    // Check if offline and queue the request
    if (window.offlineManager && !window.offlineManager.isOnline) {
      window.offlineManager.queueApiCall('pmid', pmid, null);
      return createOfflinePlaceholder('pmid', pmid);
    }
    
    return new Promise((resolve, reject) => {
      // Add to rate-limited queue
      rateLimiters.pubmed.queue.push({
        pmid,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      processPubMedQueue();
    });
  }

  async function processPubMedQueue() {
    if (rateLimiters.pubmed.processing || rateLimiters.pubmed.queue.length === 0) {
      return;
    }
    
    rateLimiters.pubmed.processing = true;
    
    while (rateLimiters.pubmed.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - rateLimiters.pubmed.lastRequest;
      const minInterval = (RATE_LIMITS.PUBMED.perSeconds * 1000) / RATE_LIMITS.PUBMED.requests;
      
      if (timeSinceLastRequest < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
      }
      
      const request = rateLimiters.pubmed.queue.shift();
      rateLimiters.pubmed.lastRequest = Date.now();
      
      try {
        const result = await executePubMedRequest(request.pmid);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
    
    rateLimiters.pubmed.processing = false;
  }

  async function executePubMedRequest(pmid) {
    try {
      const settings = window.SilentStacks.modules.DataManager.getSettings();
      const keyParam = settings.apiKey ? `&api_key=${settings.apiKey}` : '';
      
      // Step 1: Get basic metadata from ESummary
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json${keyParam}`;
      console.log('📡 Fetching PubMed summary:', summaryUrl);
      
      const summaryResponse = await fetch(summaryUrl);
      if (!summaryResponse.ok) {
        throw new Error(`PubMed ESummary failed: ${summaryResponse.status}`);
      }
      
      const summaryData = await summaryResponse.json();
      
      if (summaryData.error) {
        throw new Error(`PubMed error: ${summaryData.error}`);
      }
      
      const record = summaryData.result[pmid];
      if (!record || record.error) {
        throw new Error(`PMID ${pmid} not found`);
      }
      
      // Build basic metadata
      const meta = {
        pmid: pmid,
        title: record.title || '',
        authors: (record.authors || []).map(author => author.name).join('; '),
        journal: record.fulljournalname || record.source || '',
        year: (record.pubdate || '').split(' ')[0] || '',
        doi: '',
        meshHeadings: [], // NEW: MeSH headings array
        publicationType: '', // NEW: Publication type
        clinicalTrials: [] // NEW: Associated clinical trials
      };
      
      // Step 2: Get enhanced metadata from EFetch XML (DOI, MeSH, Clinical Trials)
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${keyParam}`;
      
      try {
        const xmlResponse = await fetch(fetchUrl);
        if (xmlResponse.ok) {
          const xmlText = await xmlResponse.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlText, 'application/xml');
          
          // Extract DOI (existing functionality)
          let doi = '';
          
          // Strategy 1: ArticleId with IdType="doi"
          const doiNode1 = doc.querySelector('ArticleId[IdType="doi"]');
          if (doiNode1) {
            doi = doiNode1.textContent.trim();
          }
          
          // Strategy 2: ArticleId containing "10." (DOI prefix)
          if (!doi) {
            const articleIds = doc.querySelectorAll('ArticleId');
            for (const node of articleIds) {
              const text = node.textContent.trim();
              if (text.startsWith('10.')) {
                doi = text;
                break;
              }
            }
          }
          
          // Strategy 3: ELocationID with EIdType="doi"
          if (!doi) {
            const doiNode3 = doc.querySelector('ELocationID[EIdType="doi"]');
            if (doiNode3) {
              doi = doiNode3.textContent.trim();
            }
          }
          
          if (doi) {
            meta.doi = doi;
            console.log('✅ DOI found:', doi);
          }
          
          // NEW: Extract MeSH Headings
          const meshHeadings = [];
          const meshNodes = doc.querySelectorAll('MeshHeading DescriptorName');
          meshNodes.forEach(node => {
            const meshTerm = node.textContent.trim();
            const majorTopic = node.getAttribute('MajorTopicYN') === 'Y';
            if (meshTerm) {
              meshHeadings.push({
                term: meshTerm,
                majorTopic: majorTopic
              });
            }
          });
          
          meta.meshHeadings = meshHeadings;
          console.log('🏷️ MeSH headings found:', meshHeadings.length);
          
          // NEW: Extract Publication Type
          const pubTypeNodes = doc.querySelectorAll('PublicationType');
          const pubTypes = Array.from(pubTypeNodes).map(node => node.textContent.trim());
          meta.publicationType = pubTypes.join(', ');
          console.log('📄 Publication type:', meta.publicationType);
          
          // NEW: Extract Clinical Trial Numbers (NCT numbers)
          const clinicalTrialNumbers = extractClinicalTrialNumbers(xmlText);
          
          if (clinicalTrialNumbers.length > 0) {
            console.log('🧪 Clinical trial numbers found:', clinicalTrialNumbers);
            
            // Fetch clinical trial details for each NCT number
            const clinicalTrialPromises = clinicalTrialNumbers.map(nctNumber => 
              fetchClinicalTrial(nctNumber).catch(error => {
                console.warn(`Failed to fetch clinical trial ${nctNumber}:`, error);
                return { nctNumber, error: error.message };
              })
            );
            
            const clinicalTrialResults = await Promise.all(clinicalTrialPromises);
            meta.clinicalTrials = clinicalTrialResults.filter(result => !result.error);
            
            console.log('🧪 Clinical trial details fetched:', meta.clinicalTrials.length);
          }
          
        } else {
          console.warn(`EFetch failed: ${xmlResponse.status}, continuing without enhanced metadata`);
        }
        
      } catch (xmlError) {
        console.warn('XML parsing error:', xmlError);
        // Continue with basic metadata
      }
      
      console.log('✅ Enhanced PubMed metadata retrieved:', meta);
      return meta;
      
    } catch (error) {
      console.error('❌ PubMed fetch error:', error);
      throw new Error(`PubMed lookup failed: ${error.message}`);
    }
  }

  // NEW: Extract Clinical Trial Numbers from PubMed XML
  function extractClinicalTrialNumbers(xmlText) {
    const nctNumbers = new Set(); // Use Set to avoid duplicates
    
    // Strategy 1: Look for NCT numbers in DataBankList
    const databankRegex = /<DataBankName>ClinicalTrials\.gov<\/DataBankName>[\s\S]*?<AccessionNumberList>([\s\S]*?)<\/AccessionNumberList>/gi;
    let match;
    
    while ((match = databankRegex.exec(xmlText)) !== null) {
      const accessionSection = match[1];
      const nctRegex = /<AccessionNumber>(NCT\d+)<\/AccessionNumber>/gi;
      let nctMatch;
      
      while ((nctMatch = nctRegex.exec(accessionSection)) !== null) {
        nctNumbers.add(nctMatch[1]);
      }
    }
    
    // Strategy 2: General NCT pattern search in abstract and text
    const generalNctRegex = /NCT\d{8}/gi;
    let generalMatch;
    
    while ((generalMatch = generalNctRegex.exec(xmlText)) !== null) {
      nctNumbers.add(generalMatch[0].toUpperCase());
    }
    
    return Array.from(nctNumbers);
  }

  // NEW: Fetch Clinical Trial Details from ClinicalTrials.gov API
  async function fetchClinicalTrial(nctNumber) {
    console.log(`🧪 Fetching clinical trial data for: ${nctNumber}`);
    
    // Check if offline
    if (window.offlineManager && !window.offlineManager.isOnline) {
      return createClinicalTrialPlaceholder(nctNumber);
    }
    
    return new Promise((resolve, reject) => {
      rateLimiters.clinicaltrials.queue.push({
        nctNumber,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      processClinicalTrialsQueue();
    });
  }

  async function processClinicalTrialsQueue() {
    if (rateLimiters.clinicaltrials.processing || rateLimiters.clinicaltrials.queue.length === 0) {
      return;
    }
    
    rateLimiters.clinicaltrials.processing = true;
    
    while (rateLimiters.clinicaltrials.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - rateLimiters.clinicaltrials.lastRequest;
      const minInterval = (RATE_LIMITS.CLINICALTRIALS.perSeconds * 1000) / RATE_LIMITS.CLINICALTRIALS.requests;
      
      if (timeSinceLastRequest < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
      }
      
      const request = rateLimiters.clinicaltrials.queue.shift();
      rateLimiters.clinicaltrials.lastRequest = Date.now();
      
      try {
        const result = await executeClinicalTrialRequest(request.nctNumber);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
    
    rateLimiters.clinicaltrials.processing = false;
  }

  async function executeClinicalTrialRequest(nctNumber) {
    try {
      // Use ClinicalTrials.gov API v2
      const url = `https://clinicaltrials.gov/api/v2/studies/${nctNumber}`;
      console.log('📡 ClinicalTrials.gov URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SilentStacks/1.4.0 (https://github.com/silentlibrarian/silentstacks)'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Clinical trial not found: ${nctNumber}`);
        }
        throw new Error(`ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const study = data.protocolSection || data;
      
      // Extract relevant clinical trial information
      const trialData = {
        nctNumber: nctNumber,
        briefTitle: study.identificationModule?.briefTitle || '',
        officialTitle: study.identificationModule?.officialTitle || '',
        phase: extractPhase(study),
        status: study.statusModule?.overallStatus || '',
        startDate: extractStartDate(study),
        completionDate: extractCompletionDate(study),
        conditions: extractConditions(study),
        interventions: extractInterventions(study),
        sponsors: extractSponsors(study),
        studyType: study.designModule?.studyType || ''
      };
      
      console.log('✅ Clinical trial data retrieved:', trialData);
      return trialData;
      
    } catch (error) {
      console.error('❌ Clinical trial fetch error:', error);
      throw new Error(`Clinical trial lookup failed: ${error.message}`);
    }
  }

  // Helper functions for clinical trial data extraction
  function extractPhase(study) {
    return study.designModule?.phases?.join(', ') || '';
  }

  function extractStartDate(study) {
    const startDate = study.statusModule?.startDateStruct;
    if (startDate) {
      return startDate.date || '';
    }
    return '';
  }

  function extractCompletionDate(study) {
    const completionDate = study.statusModule?.completionDateStruct;
    if (completionDate) {
      return completionDate.date || '';
    }
    return '';
  }

  function extractConditions(study) {
    return study.conditionsModule?.conditions || [];
  }

  function extractInterventions(study) {
    const interventions = study.armsInterventionsModule?.interventions || [];
    return interventions.map(intervention => ({
      type: intervention.type || '',
      name: intervention.name || '',
      description: intervention.description || ''
    }));
  }

  function extractSponsors(study) {
    const sponsorModule = study.sponsorCollaboratorsModule;
    if (!sponsorModule) return [];
    
    const sponsors = [];
    
    if (sponsorModule.leadSponsor) {
      sponsors.push({
        type: 'Lead Sponsor',
        name: sponsorModule.leadSponsor.name || '',
        class: sponsorModule.leadSponsor.class || ''
      });
    }
    
    if (sponsorModule.collaborators) {
      sponsorModule.collaborators.forEach(collab => {
        sponsors.push({
          type: 'Collaborator',
          name: collab.name || '',
          class: collab.class || ''
        });
      });
    }
    
    return sponsors;
  }

  // Existing CrossRef function (unchanged)
  async function fetchCrossRef(doi) {
    console.log(`🔍 Fetching CrossRef data for DOI: ${doi}`);
    
    if (window.offlineManager && !window.offlineManager.isOnline) {
      window.offlineManager.queueApiCall('doi', doi, null);
      return createOfflinePlaceholder('doi', doi);
    }
    
    return new Promise((resolve, reject) => {
      rateLimiters.crossref.queue.push({
        doi,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      processCrossRefQueue();
    });
  }

  async function processCrossRefQueue() {
    if (rateLimiters.crossref.processing || rateLimiters.crossref.queue.length === 0) {
      return;
    }
    
    rateLimiters.crossref.processing = true;
    
    while (rateLimiters.crossref.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - rateLimiters.crossref.lastRequest;
      const minInterval = (RATE_LIMITS.CROSSREF.perSeconds * 1000) / RATE_LIMITS.CROSSREF.requests;
      
      if (timeSinceLastRequest < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
      }
      
      const request = rateLimiters.crossref.queue.shift();
      rateLimiters.crossref.lastRequest = Date.now();
      
      try {
        const result = await executeCrossRefRequest(request.doi);
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }
    
    rateLimiters.crossref.processing = false;
  }

  async function executeCrossRefRequest(doi) {
    try {
      const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '').trim();
      console.log('🔧 Cleaned DOI:', cleanDoi);
      
      const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
      console.log('📡 CrossRef URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SilentStacks/1.4.0 (https://github.com/silentlibrarian/silentstacks)'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`DOI not found: ${cleanDoi}`);
        }
        throw new Error(`CrossRef API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const work = data.message;
      if (!work) {
        throw new Error('No work data in CrossRef response');
      }
      
      // Build metadata (enhanced for consistency with PubMed format)
      const meta = {
        doi: cleanDoi,
        title: (work.title && work.title[0]) || '',
        authors: (work.author || [])
          .map(author => `${author.given || ''} ${author.family || ''}`.trim())
          .filter(name => name)
          .join('; '),
        journal: (work['container-title'] && work['container-title'][0]) || '',
        year: (work.published && work.published['date-parts'] && work.published['date-parts'][0] && work.published['date-parts'][0][0]) || '',
        pmid: '',
        meshHeadings: [], // Empty for CrossRef data
        publicationType: work.type || '',
        clinicalTrials: [] // Empty for CrossRef data
      };
      
      console.log('✅ CrossRef metadata retrieved:', meta);
      return meta;
      
    } catch (error) {
      console.error('❌ CrossRef fetch error:', error);
      throw new Error(`CrossRef lookup failed: ${error.message}`);
    }
  }

  // Enhanced offline placeholder creation
  function createOfflinePlaceholder(type, identifier) {
    const placeholders = {
      pmid: {
        pmid: identifier,
        title: `[QUEUED] Article ${identifier} - Will lookup when online`,
        authors: 'Authors will be retrieved when online',
        journal: 'Journal information pending',
        year: 'Year pending',
        doi: 'DOI pending',
        meshHeadings: [],
        publicationType: 'Publication type pending',
        clinicalTrials: []
      },
      doi: {
        doi: identifier,
        title: `[QUEUED] Article with DOI ${identifier} - Will lookup when online`,
        authors: 'Authors will be retrieved when online',
        journal: 'Journal information pending',
        year: 'Year pending',
        pmid: 'PMID pending',
        meshHeadings: [],
        publicationType: 'Publication type pending',
        clinicalTrials: []
      }
    };
    
    return placeholders[type] || {};
  }

  function createClinicalTrialPlaceholder(nctNumber) {
    return {
      nctNumber: nctNumber,
      briefTitle: `[QUEUED] Clinical trial ${nctNumber} - Will lookup when online`,
      officialTitle: 'Official title pending',
      phase: 'Phase pending',
      status: 'Status pending',
      startDate: 'Start date pending',
      completionDate: 'Completion date pending',
      conditions: [],
      interventions: [],
      sponsors: [],
      studyType: 'Study type pending'
    };
  }

  // Enhanced public API functions
  async function lookupPMID() {
    const pmidInput = document.getElementById('pmid');
    if (!pmidInput) return;
    
    const pmid = pmidInput.value.trim();
    if (!pmid) {
      setStatus('Please enter a PMID', 'error');
      return;
    }
    
    if (!/^\d+$/.test(pmid)) {
      setStatus('PMID must be numeric', 'error');
      return;
    }
    
    setStatus('Looking up PMID...', 'loading');
    
    try {
      const pubmedData = await fetchPubMed(pmid);
      
      // Populate form with enhanced PubMed data
      if (window.SilentStacks.modules.RequestManager?.populateForm) {
        window.SilentStacks.modules.RequestManager.populateForm(pubmedData);
      }
      
      // Enhanced success message
      let message = 'Metadata populated successfully';
      if (pubmedData.doi && !pubmedData.doi.includes('pending')) {
        message += `. DOI found: ${pubmedData.doi}`;
      }
      if (pubmedData.meshHeadings && pubmedData.meshHeadings.length > 0) {
        message += `. MeSH terms: ${pubmedData.meshHeadings.length}`;
      }
      if (pubmedData.clinicalTrials && pubmedData.clinicalTrials.length > 0) {
        message += `. Clinical trials: ${pubmedData.clinicalTrials.length}`;
      }
      
      if (pubmedData.title.includes('[QUEUED]')) {
        setStatus('Request queued for when online. Placeholder data populated.', 'loading');
      } else {
        setStatus(message, 'success');
      }
      
      // Auto-advance progress step if available
      if (window.SilentStacks.modules.MedicalFeatures?.autoAdvanceStep) {
        window.SilentStacks.modules.MedicalFeatures.autoAdvanceStep(1);
      }
      
    } catch (error) {
      console.error('PMID lookup error:', error);
      setStatus(`PMID lookup failed: ${error.message}`, 'error');
    }
  }

  async function lookupDOI() {
    const doiInput = document.getElementById('doi');
    if (!doiInput) return;
    
    const doi = doiInput.value.trim();
    if (!doi) {
      setStatus('Please enter a DOI', 'error');
      return;
    }
    
    setStatus('Looking up DOI...', 'loading');
    
    try {
      const crossrefData = await fetchCrossRef(doi);
      
      // Populate form with CrossRef data
      if (window.SilentStacks.modules.RequestManager?.populateForm) {
        window.SilentStacks.modules.RequestManager.populateForm(crossrefData);
      }
      
      if (crossrefData.title.includes('[QUEUED]')) {
        setStatus('Request queued for when online. Placeholder data populated.', 'loading');
      } else {
        setStatus('DOI lookup successful!', 'success');
      }
      
      // Auto-advance progress step if available
      if (window.SilentStacks.modules.MedicalFeatures?.autoAdvanceStep) {
        window.SilentStacks.modules.MedicalFeatures.autoAdvanceStep(1);
      }
      
    } catch (error) {
      console.error('DOI lookup error:', error);
      setStatus(`DOI lookup failed: ${error.message}`, 'error');
    }
  }

  // Utility Functions
  function setStatus(message, type = '') {
    if (window.SilentStacks.modules.UIController?.setStatus) {
      window.SilentStacks.modules.UIController.setStatus(message, type);
    } else {
      // Fallback for direct status updates
      const statusEl = document.getElementById('lookup-status');
      if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = ['lookup-status', type].filter(Boolean).join(' ');
      }
    }
  }

  function getQueueStatus() {
    return {
      pubmed: {
        pending: rateLimiters.pubmed.queue.length,
        processing: rateLimiters.pubmed.processing,
        lastRequest: rateLimiters.pubmed.lastRequest
      },
      crossref: {
        pending: rateLimiters.crossref.queue.length,
        processing: rateLimiters.crossref.processing,
        lastRequest: rateLimiters.crossref.lastRequest
      },
      clinicaltrials: {
        pending: rateLimiters.clinicaltrials.queue.length,
        processing: rateLimiters.clinicaltrials.processing,
        lastRequest: rateLimiters.clinicaltrials.lastRequest
      }
    };
  }

  function clearQueues() {
    // Clear all queues and reject pending requests
    ['pubmed', 'crossref', 'clinicaltrials'].forEach(service => {
      rateLimiters[service].queue.forEach(req => {
        req.reject(new Error('Queue cleared'));
      });
      
      rateLimiters[service].queue = [];
      rateLimiters[service].processing = false;
    });
    
    console.log('🧹 All API queues cleared');
  }

  // Module Interface
  const APIIntegration = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing Enhanced APIIntegration v1.4...');
      
      // Make API functions globally available for offline manager
      window.fetchPubMed = fetchPubMed;
      window.fetchCrossRef = fetchCrossRef;
      window.fetchClinicalTrial = fetchClinicalTrial;
      
      console.log('✅ Enhanced APIIntegration v1.4 initialized with MeSH and Clinical Trials support');
    },

    // Public API functions
    lookupPMID,
    lookupDOI,
    
    // Direct API access
    fetchPubMed,
    fetchCrossRef,
    fetchClinicalTrial,
    
    // Enhanced utility functions
    getQueueStatus,
    clearQueues,
    createOfflinePlaceholder,
    createClinicalTrialPlaceholder,
    extractClinicalTrialNumbers,
    
    // Constants
    RATE_LIMITS,
    
    // Version info
    version: '1.4.0',
    features: ['PubMed', 'CrossRef', 'MeSH Headings', 'Clinical Trials', 'Offline Support', 'Rate Limiting']
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('APIIntegration', APIIntegration);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.APIIntegration = APIIntegration;
  }
})();
