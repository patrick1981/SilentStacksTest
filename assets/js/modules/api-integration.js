// assets/js/modules/api-integration.js
// SilentStacks API Integration Module v1.5 - ENHANCED
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
        this.setupPubMedIntegration();
        this.setupCrossRefIntegration();
        this.setupClinicalTrialsIntegration();
        this.initialized = true;
        
        console.log('✅ Enhanced API Integration v1.5 initialized successfully');
        
      } catch (error) {
        console.error('❌ API Integration initialization failed:', error);
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
        console.log('⚠️ No NCBI API key - using rate-limited access');
      }
    },

    // Setup CrossRef API integration
    setupCrossRefIntegration() {
      console.log('📚 Setting up CrossRef API integration...');
      // CrossRef doesn't require API key for basic usage
      console.log('✅ CrossRef API integration ready');
    },

    // Setup ClinicalTrials.gov API integration
    setupClinicalTrialsIntegration() {
      console.log('🧪 Setting up ClinicalTrials.gov API integration...');
      // ClinicalTrials.gov API doesn't require authentication
      console.log('✅ ClinicalTrials.gov API integration ready');
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

        // Step 2: Get detailed metadata from EFetch for better formatting
        const fetchUrl = `${CONFIG.pubmed.baseURL}efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${keyParam}`;
        
        const fetchResponse = await this.fetchWithRetry(fetchUrl, {
          timeout: CONFIG.pubmed.timeout
        });
        
        const xmlText = await fetchResponse.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Build enhanced metadata in NLM format
        const metadata = this.parseEFetchXML(xmlDoc, pmid, record);

        // Step 3: Fetch associated clinical trials if requested
        if (includeClinicalTrials) {
          try {
            metadata.clinicalTrials = await this.fetchClinicalTrialsForPMID(pmid);
            metadata.hasLinkedClinicalTrial = metadata.clinicalTrials.length > 0;
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

    // Parse EFetch XML response into NLM-formatted metadata
    parseEFetchXML(xmlDoc, pmid, summaryRecord) {
      const article = xmlDoc.querySelector('PubmedArticle');
      if (!article) {
        throw new Error('Invalid PubMed XML response');
      }

      const metadata = {
        pmid: pmid,
        source: 'pubmed',
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
      };

      // Title
      const titleElement = article.querySelector('ArticleTitle');
      metadata.title = titleElement ? titleElement.textContent.trim() : summaryRecord.title || '';

      // Authors in NLM format (Last, First Initial)
      metadata.authors = this.parseAuthorsNLM(article);

      // Journal information
      const journal = article.querySelector('Journal');
      if (journal) {
        const journalTitle = journal.querySelector('Title');
        const journalISO = journal.querySelector('ISOAbbreviation');
        
        metadata.journal = journalTitle ? journalTitle.textContent.trim() : 
                          journalISO ? journalISO.textContent.trim() : 
                          summaryRecord.fulljournalname || summaryRecord.source || '';
        
        // Volume, Issue, Pages
        const journalIssue = journal.querySelector('JournalIssue');
        if (journalIssue) {
          const volume = journalIssue.querySelector('Volume');
          const issue = journalIssue.querySelector('Issue');
          
          metadata.volume = volume ? volume.textContent.trim() : '';
          metadata.issue = issue ? issue.textContent.trim() : '';
        }
      }

      // Publication date in NLM format
      metadata.year = this.parsePublicationYear(article, summaryRecord);

      // Pages
      const pagination = article.querySelector('Pagination MedlinePgn');
      metadata.pages = pagination ? pagination.textContent.trim() : '';

      // DOI
      metadata.doi = this.parseDOI(article);

      // Abstract
      const abstractElement = article.querySelector('Abstract AbstractText');
      metadata.abstract = abstractElement ? abstractElement.textContent.trim() : '';

      // MeSH Terms
      metadata.meshHeadings = this.parseMeSHTerms(article);

      // Publication Types
      metadata.publicationTypes = this.parsePublicationTypes(article);

      // NCT numbers (clinical trial identifiers)
      metadata.nctNumbers = this.parseNCTNumbers(article);

      return metadata;
    },

    // Parse authors in NLM format
    parseAuthorsNLM(article) {
      const authors = [];
      const authorElements = article.querySelectorAll('AuthorList Author');

      authorElements.forEach(author => {
        const lastName = author.querySelector('LastName');
        const foreName = author.querySelector('ForeName');
        const initials = author.querySelector('Initials');

        if (lastName) {
          let authorString = lastName.textContent.trim();
          
          if (initials) {
            authorString += `, ${initials.textContent.trim()}`;
          } else if (foreName) {
            // Extract initials from ForeName if Initials not available
            const initials = foreName.textContent.trim()
              .split(' ')
              .map(name => name.
