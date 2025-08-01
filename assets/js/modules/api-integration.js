// SilentStacks API Integration Module
// Handles PubMed, CrossRef API calls with offline support and rate limiting
(() => {
  'use strict';

  // === Rate Limiting Configuration ===
  const RATE_LIMITS = {
    PUBMED: { requests: 3, perSeconds: 1 }, // NCBI recommends 3 requests per second
    CROSSREF: { requests: 50, perSeconds: 1 } // CrossRef is more generous
  };

  // === Rate Limiting State ===
  const rateLimiters = {
    pubmed: { queue: [], lastRequest: 0, processing: false },
    crossref: { queue: [], lastRequest: 0, processing: false }
  };

  // === API Functions ===
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
        doi: ''
      };
      
      // Step 2: Get DOI from EFetch XML
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${keyParam}`;
      
      try {
        const xmlResponse = await fetch(fetchUrl);
        if (xmlResponse.ok) {
          const xmlText = await xmlResponse.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlText, 'application/xml');
          
          // Multiple strategies to find DOI
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
          
          // Strategy 3: Look in ELocationID with EIdType="doi"
          if (!doi) {
            const elocationNode = doc.querySelector('ELocationID[EIdType="doi"]');
            if (elocationNode) {
              doi = elocationNode.textContent.trim();
            }
          }
          
          meta.doi = doi;
        }
      } catch (xmlError) {
        console.warn('Failed to fetch DOI from XML, continuing without:', xmlError);
      }
      
      console.log('✅ PubMed metadata retrieved:', meta);
      return meta;
      
    } catch (error) {
      console.error('❌ PubMed fetch error:', error);
      throw new Error(`PubMed lookup failed: ${error.message}`);
    }
  }

  async function fetchCrossRef(doi) {
    console.log(`🔍 Fetching CrossRef data for DOI: ${doi}`);
    
    // Check if offline and queue the request
    if (window.offlineManager && !window.offlineManager.isOnline) {
      window.offlineManager.queueApiCall('doi', doi, null);
      return createOfflinePlaceholder('doi', doi);
    }
    
    return new Promise((resolve, reject) => {
      // Add to rate-limited queue
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
      // Normalize DOI (remove URL prefixes)
      const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '').trim();
      console.log('🔧 Cleaned DOI:', cleanDoi);
      
      const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
      console.log('📡 CrossRef URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SilentStacks/1.2.0 (https://github.com/silentlibrarian/silentstacks)'
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
      
      // Build metadata
      const meta = {
        doi: cleanDoi,
        title: (work.title && work.title[0]) || '',
        authors: (work.author || [])
          .map(author => `${author.given || ''} ${author.family || ''}`.trim())
          .filter(name => name)
          .join('; '),
        journal: (work['container-title'] && work['container-title'][0]) || '',
        year: (work.published && work.published['date-parts'] && work.published['date-parts'][0] && work.published['date-parts'][0][0]) || '',
        pmid: ''
      };
      
      console.log('✅ CrossRef metadata retrieved:', meta);
      return meta;
      
    } catch (error) {
      console.error('❌ CrossRef fetch error:', error);
      throw new Error(`CrossRef lookup failed: ${error.message}`);
    }
  }

  // === Offline Support ===
  function createOfflinePlaceholder(type, identifier) {
    const placeholders = {
      pmid: {
        pmid: identifier,
        title: `[QUEUED] Article ${identifier} - Will lookup when online`,
        authors: 'Authors will be retrieved when online',
        journal: 'Journal information pending',
        year: 'Year pending',
        doi: 'DOI pending'
      },
      doi: {
        doi: identifier,
        title: `[QUEUED] Article with DOI ${identifier} - Will lookup when online`,
        authors: 'Authors will be retrieved when online',
        journal: 'Journal information pending',
        year: 'Year pending',
        pmid: 'PMID pending'
      }
    };
    
    return placeholders[type] || {};
  }

  // === Public API Functions ===
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
      
      // Populate form with PubMed data
      if (window.SilentStacks.modules.RequestManager?.populateForm) {
        window.SilentStacks.modules.RequestManager.populateForm(pubmedData);
      }
      
      // Success message with DOI status
      if (pubmedData.doi && !pubmedData.doi.includes('pending')) {
        setStatus(`Metadata populated successfully. DOI found: ${pubmedData.doi}`, 'success');
      } else if (pubmedData.title.includes('[QUEUED]')) {
        setStatus('Request queued for when online. Placeholder data populated.', 'loading');
      } else {
        setStatus('Metadata populated successfully. No DOI found for this article.', 'success');
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

  // === Utility Functions ===
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
      }
    };
  }

  function clearQueues() {
    rateLimiters.pubmed.queue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    rateLimiters.crossref.queue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    
    rateLimiters.pubmed.queue = [];
    rateLimiters.crossref.queue = [];
    rateLimiters.pubmed.processing = false;
    rateLimiters.crossref.processing = false;
    
    console.log('🧹 API queues cleared');
  }

  // === Module Interface ===
  const APIIntegration = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing APIIntegration...');
      
      // Make API functions globally available for offline manager
      window.fetchPubMed = fetchPubMed;
      window.fetchCrossRef = fetchCrossRef;
      
      console.log('✅ APIIntegration initialized');
    },

    // Public API functions
    lookupPMID,
    lookupDOI,
    
    // Direct API access
    fetchPubMed,
    fetchCrossRef,
    
    // Utility functions
    getQueueStatus,
    clearQueues,
    createOfflinePlaceholder,
    
    // Constants
    RATE_LIMITS
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
