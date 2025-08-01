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
