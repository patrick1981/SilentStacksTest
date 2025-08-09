// assets/js/app.js
// SilentStacks v2.0 - Main Application Controller
(() => {
  'use strict';

  class SilentStacksApp {
    constructor() {
      this.initialized = false;
      this.modules = new Map();
      this.currentSection = 'dashboard';
      this.selectedRequests = new Set();
    }

    async initialize() {
      console.log('🚀 Initializing SilentStacks v2.0...');
      
      try {
        // Wait for core modules to be available
        await this.waitForCoreModules();
        
        // Initialize UI
        this.setupNavigation();
        this.setupBulkOperations();
        this.setupHelp();
        this.setupSearch();
        this.setupAPILookups();
        
        // Load initial data
        await this.loadInitialData();
        
        this.initialized = true;
        console.log('✅ SilentStacks v2.0 initialized successfully');
        
        // Show initial dashboard
        this.switchToSection('dashboard');
        
      } catch (error) {
        console.error('❌ Failed to initialize SilentStacks:', error);
        this.showError('Failed to initialize application. Please refresh the page.');
      }
    }

    async waitForCoreModules() {
      const maxAttempts = 50;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const hasCore = window.SilentStacks?.core?.eventBus && 
                       window.SilentStacks?.modules?.RequestManager &&
                       window.SilentStacks?.modules?.APIIntegration;
        
        if (hasCore) {
          console.log('✅ Core modules ready');
          return;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      throw new Error('Core modules failed to load');
    }

    // ===== Navigation Setup =====
    setupNavigation() {
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const section = tab.getAttribute('data-section');
          if (section) {
            this.switchToSection(section);
          }
        });
      });
    }

    switchToSection(sectionId) {
      // Update navigation
      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      });
      
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
      });

      // Activate new section
      const targetTab = document.querySelector(`[data-section="${sectionId}"]`);
      const targetSection = document.getElementById(sectionId);
      
      if (targetTab) {
        targetTab.classList.add('active');
        targetTab.setAttribute('aria-selected', 'true');
      }
      
      if (targetSection) {
        targetSection.classList.add('active');
      }

      this.currentSection = sectionId;
      
      // Load section-specific data
      if (sectionId === 'dashboard') {
        this.updateDashboard();
      } else if (sectionId === 'all-requests') {
        this.loadAllRequests();
      }
    }

    // ===== API Lookups Setup =====
    setupAPILookups() {
      // PMID Lookup
      const pmidBtn = document.getElementById('lookup-pmid');
      if (pmidBtn) {
        pmidBtn.addEventListener('click', async () => {
          const pmidInput = document.getElementById('pmid');
          const pmid = pmidInput?.value?.trim();
          if (pmid) {
            await this.performPMIDLookup(pmid);
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
            await this.performDOILookup(doi);
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
            await this.performClinicalTrialsLookup(pmid);
          }
        });
      }
    }

    // ===== PMID Lookup with Metadata Integration =====
    async performPMIDLookup(pmid) {
      const apiIntegration = window.SilentStacks?.modules?.APIIntegration;
      if (!apiIntegration) {
        this.showError('API Integration module not available');
        return;
      }

      try {
        // Show loading
        this.showStatus('pmid-status', 'Fetching PubMed data...', 'loading');
        
        // Fetch PubMed data
        const pubmedData = await apiIntegration.fetchPubMedData(pmid);
        
        if (pubmedData) {
          // Auto-fill form with PubMed data (primary source)
          this.autoFillFormFields(pubmedData);
          
          // Try to get additional data from CrossRef if DOI available
          if (pubmedData.doi) {
            try {
              const crossrefData = await apiIntegration.fetchCrossRefData(pubmedData.doi);
              
              // Merge data, preferring PubMed for conflicts
              const mergedData = this.mergeMetadata(pubmedData, crossrefData);
              this.autoFillFormFields(mergedData);
            } catch (crossrefError) {
              console.warn('CrossRef lookup failed, using PubMed data only:', crossrefError);
            }
          }
          
          // Fetch MeSH headings
          await apiIntegration.fetchAndDisplayMeSH(pmid);
          
          // Fetch clinical trials
          await apiIntegration.fetchAndDisplayClinicalTrials(pmid, pubmedData.title);
          
          this.showStatus('pmid-status', '✅ Data loaded successfully', 'success');
        } else {
          this.showStatus('pmid-status', 'No data found for this PMID', 'error');
        }
      } catch (error) {
        console.error('PMID lookup failed:', error);
        this.showStatus('pmid-status', `Error: ${error.message}`, 'error');
      }
    }

    // ===== DOI Lookup =====
    async performDOILookup(doi) {
      const apiIntegration = window.SilentStacks?.modules?.APIIntegration;
      if (!apiIntegration) {
        this.showError('API Integration module not available');
        return;
      }

      try {
        this.showStatus('doi-status', 'Fetching CrossRef data...', 'loading');
        
        const crossrefData = await apiIntegration.fetchCrossRefData(doi);
        
        if (crossrefData) {
          this.autoFillFormFields(crossrefData);
          
          // If we found a PMID, get PubMed data for MeSH and trials
          if (crossrefData.pmid) {
            try {
              const pubmedData = await apiIntegration.fetchPubMedData(crossrefData.pmid);
              const mergedData = this.mergeMetadata(pubmedData, crossrefData);
              this.autoFillFormFields(mergedData);
              
              await apiIntegration.fetchAndDisplayMeSH(crossrefData.pmid);
              await apiIntegration.fetchAndDisplayClinicalTrials(crossrefData.pmid, mergedData.title);
            } catch (pubmedError) {
              console.warn('PubMed lookup failed, using CrossRef data only:', pubmedError);
            }
          }
          
          this.showStatus('doi-status', '✅ Data loaded successfully', 'success');
        } else {
          this.showStatus('doi-status', 'No data found for this DOI', 'error');
        }
      } catch (error) {
        console.error('DOI lookup failed:', error);
        this.showStatus('doi-status', `Error: ${error.message}`, 'error');
      }
    }

    // ===== Clinical Trials Lookup =====
    async performClinicalTrialsLookup(pmid) {
      const apiIntegration = window.SilentStacks?.modules?.APIIntegration;
      if (!apiIntegration) {
        this.showError('API Integration module not available');
        return;
      }

      try {
        this.showStatus('clinical-trials-status', 'Searching clinical trials...', 'loading');
        
        await apiIntegration.lookupClinicalTrials(pmid);
        
        this.showStatus('clinical-trials-status', '✅ Clinical trials search completed', 'success');
      } catch (error) {
        console.error('Clinical trials lookup failed:', error);
        this.showStatus('clinical-trials-status', `Error: ${error.message}`, 'error');
      }
    }

    // ===== Metadata Merging (PubMed Priority) =====
    mergeMetadata(pubmedData, crossrefData) {
      return {
        // PubMed takes priority for these fields
        pmid: pubmedData.pmid || crossrefData.pmid || '',
        title: pubmedData.title || crossrefData.title || '',
        authors: pubmedData.authors || crossrefData.authors || '',
        journal: pubmedData.journal || crossrefData.journal || '',
        year: pubmedData.year || crossrefData.year || '',
        
        // CrossRef often has better volume/issue/pages data
        volume: crossrefData.volume || pubmedData.volume || '',
        issue: crossrefData.issue || pubmedData.issue || '',
        pages: crossrefData.pages || pubmedData.pages || '',
        
        // DOI from either source
        doi: pubmedData.doi || crossrefData.doi || '',
        
        // Source tracking
        source: 'merged',
        pubmedSource: !!pubmedData.pmid,
        crossrefSource: !!crossrefData.doi
      };
    }

    // ===== Form Auto-fill =====
    autoFillFormFields(data) {
      const fieldMappings = {
        'title': data.title,
        'authors': data.authors,
        'journal': data.journal,
        'year': data.year,
        'volume': data.volume,
        'issue': data.issue,
        'pages': data.pages,
        'pmid': data.pmid,
        'doi': data.doi
      };

      Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field && value) {
          field.value = value;
          field.classList.add('auto-filled');
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            field.classList.remove('auto-filled');
          }, 3000);
        }
      });
    }

    // ===== Bulk Operations Setup =====
    setupBulkOperations() {
      // Bulk paste processing
      const bulkPasteBtn = document.getElementById('bulk-paste-btn');
      if (bulkPasteBtn) {
        bulkPasteBtn.addEventListener('click', async () => {
          await this.processBulkPaste();
        });
      }

      // CSV file upload
      const csvUploadBtn = document.getElementById('upload-csv-btn');
      if (csvUploadBtn) {
        csvUploadBtn.addEventListener('click', async () => {
          await this.processCSVUpload();
        });
      }
    }

    // ===== Bulk Paste Processing =====
    async processBulkPaste() {
      const textarea = document.getElementById('bulk-paste-textarea');
      const autoFetch = document.getElementById('bulk-paste-auto-fetch')?.checked;
      const fetchTrials = document.getElementById('bulk-paste-fetch-trials')?.checked;
      
      if (!textarea?.value?.trim()) {
        this.showBulkStatus('Please enter PMIDs or CSV data', 'error');
        return;
      }

      const data = textarea.value.trim();
      
      try {
        this.showBulkStatus('Processing bulk data...', 'loading');
        
        // Detect format and parse
        let items = [];
        if (data.includes(',') && data.includes('\n')) {
          // CSV format
          items = this.parseCSVData(data);
        } else {
          // Simple PMID list
          items = data.split('\n').map(line => ({
            pmid: line.trim()
          })).filter(item => item.pmid);
        }

        if (items.length === 0) {
          this.showBulkStatus('No valid data found', 'error');
          return;
        }

        // Process items with enrichment
        const results = await this.processBulkItems(items, { autoFetch, fetchTrials });
        
        // Add to request manager
        const requestManager = window.SilentStacks?.modules?.RequestManager;
        if (requestManager) {
          results.forEach(item => {
            if (item.success) {
              requestManager.createRequest(item.data);
            }
          });
        }

        const successCount = results.filter(r => r.success).length;
        this.showBulkStatus(`✅ Successfully processed ${successCount}/${items.length} items`, 'success');
        
        // Clear textarea
        textarea.value = '';
        
        // Refresh the requests list
        this.loadAllRequests();
        
      } catch (error) {
        console.error('Bulk paste failed:', error);
        this.showBulkStatus(`Error: ${error.message}`, 'error');
      }
    }

    // ===== CSV Upload Processing =====
    async processCSVUpload() {
      const fileInput = document.getElementById('csv-file-input');
      const file = fileInput?.files?.[0];
      
      if (!file) {
        this.showCSVStatus('Please select a CSV file', 'error');
        return;
      }

      try {
        this.showCSVStatus('Reading CSV file...', 'loading');
        
        const text = await this.readFileAsText(file);
        const items = this.parseCSVData(text);
        
        if (items.length === 0) {
          this.showCSVStatus('No valid data found in CSV', 'error');
          return;
        }

        this.showCSVStatus('Processing CSV data...', 'loading');
        
        const results = await this.processBulkItems(items, { 
          autoFetch: true, 
          fetchTrials: true 
        });
        
        // Add to request manager
        const requestManager = window.SilentStacks?.modules?.RequestManager;
        if (requestManager) {
          results.forEach(item => {
            if (item.success) {
              requestManager.createRequest(item.data);
            }
          });
        }

        const successCount = results.filter(r => r.success).length;
        this.showCSVStatus(`✅ Successfully processed ${successCount}/${items.length} items`, 'success');
        
        // Clear file input
        fileInput.value = '';
        
        // Refresh the requests list
        this.loadAllRequests();
        
      } catch (error) {
        console.error('CSV upload failed:', error);
        this.showCSVStatus(`Error: ${error.message}`, 'error');
      }
    }

    // ===== Bulk Item Processing =====
    async processBulkItems(items, options = {}) {
      const results = [];
      const total = items.length;
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        try {
          // Update progress
          this.updateBulkProgress(i + 1, total, `Processing item ${i + 1}...`);
          
          let enrichedData = { ...item };
          
          // Fetch PubMed data if PMID available and auto-fetch enabled
          if (options.autoFetch && item.pmid) {
            try {
              const apiIntegration = window.SilentStacks?.modules?.APIIntegration;
              if (apiIntegration) {
                const pubmedData = await apiIntegration.fetchPubMedData(item.pmid);
                enrichedData = { ...enrichedData, ...pubmedData };
                
                // Fetch clinical trials if enabled
                if (options.fetchTrials && pubmedData.abstract) {
                  const nctNumbers = apiIntegration.extractNCTNumbers(pubmedData.abstract);
                  const trials = [];
                  
                  for (const nct of nctNumbers.slice(0, 2)) {
                    const trialData = await apiIntegration.fetchClinicalTrialData(nct);
                    if (trialData) trials.push(trialData);
                  }
                  
                  enrichedData.clinicalTrials = trials;
                }
              }
            } catch (enrichError) {
              console.warn(`Enrichment failed for PMID ${item.pmid}:`, enrichError);
            }
          }
          
          // Add metadata
          enrichedData.id = this.generateRequestId();
          enrichedData.dateAdded = new Date().toISOString();
          enrichedData.status = enrichedData.status || 'pending';
          enrichedData.priority = enrichedData.priority || 'normal';
          
          results.push({ success: true, data: enrichedData });
          
          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, 350));
          
        } catch (error) {
          console.error(`Processing failed for item ${i + 1}:`, error);
          results.push({ success: false, error: error.message, data: item });
        }
      }

      return results;
    }

    // ===== Search Setup =====
    setupSearch() {
      const searchInput = document.getElementById('search-input');
      const statusFilter = document.getElementById('status-filter');
      const priorityFilter = document.getElementById('priority-filter');
      const clearSearch = document.getElementById('clear-search');

      // Debounced search
      let searchTimeout;
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
            this.performSearch();
          }, 300);
        });
      }

      // Filter changes
      if (statusFilter) {
        statusFilter.addEventListener('change', () => this.performSearch());
      }
      
      if (priorityFilter) {
        priorityFilter.addEventListener('change', () => this.performSearch());
      }

      // Clear search
      if (clearSearch) {
        clearSearch.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          this.performSearch();
        });
      }

      // Sort buttons
      document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const field = btn.getAttribute('data-field');
          this.toggleSort(field, btn);
        });
      });
    }

    // ===== Search Performance =====
    performSearch() {
      const searchInput = document.getElementById('search-input');
      const statusFilter = document.getElementById('status-filter');
      const priorityFilter = document.getElementById('priority-filter');

      const query = searchInput?.value?.trim() || '';
      const status = statusFilter?.value || '';
      const priority = priorityFilter?.value || '';

      const searchFilter = window.SilentStacks?.modules?.SearchFilter;
      if (searchFilter) {
        searchFilter.applyFilters({ status, priority });
        searchFilter.performSearch(query, true);
      } else {
        // Fallback search
        this.performFallbackSearch(query, status, priority);
      }
    }

    performFallbackSearch(query, status, priority) {
      const requestManager = window.SilentStacks?.modules?.RequestManager;
      if (!requestManager) return;

      let requests = requestManager.getAllRequests();

      // Apply filters
      if (status) {
        requests = requests.filter(req => req.status === status);
      }
      
      if (priority) {
        requests = requests.filter(req => req.priority === priority);
      }

      // Apply search query
      if (query) {
        const lowerQuery = query.toLowerCase();
        requests = requests.filter(req => {
          const searchText = `${req.title} ${req.authors} ${req.journal} ${req.notes}`.toLowerCase();
          return searchText.includes(lowerQuery);
        });
      }

      this.renderRequestsList(requests);
    }

    // ===== Sort Functionality =====
    toggleSort(field, button) {
      // Remove sort indicators from other buttons
      document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('sort-asc', 'sort-desc');
      });

      // Determine sort direction
      const isCurrentlyDesc = button.classList.contains('sort-desc');
      const newDirection = isCurrentlyDesc ? 'asc' : 'desc';
      
      button.classList.add(`sort-${newDirection}`);

      // Perform sort
      const searchFilter = window.SilentStacks?.modules?.SearchFilter;
      if (searchFilter) {
        searchFilter.setSortField(field, newDirection);
      } else {
        this.performFallbackSort(field, newDirection);
      }
    }

    performFallbackSort(field, direction) {
      const requestManager = window.SilentStacks?.modules?.RequestManager;
      if (!requestManager) return;

      let requests = requestManager.getAllRequests();
      
      requests.sort((a, b) => {
        let aVal = a[field] || '';
        let bVal = b[field] || '';
        
        // Special handling for priority
        if (field === 'priority') {
          const priorityOrder = { 'urgent': 4, 'rush': 3, 'normal': 2, 'low': 1 };
          aVal = priorityOrder[aVal] || 0;
          bVal = priorityOrder[bVal] || 0;
        }
        
        // Special handling for dates
        if (field === 'createdAt' || field === 'updatedAt') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      this.renderRequestsList(requests);
    }

    // ===== Help System Setup =====
    setupHelp() {
      const helpBtn = document.getElementById('show-help');
      if (helpBtn) {
        helpBtn.addEventListener('click', () => {
          this.showHelpModal();
        });
      }

      // F1 key for help
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
          e.preventDefault();
          this.showHelpModal();
        }
      });
    }

    showHelpModal() {
      const helpModal = document.getElementById('help-modal');
      if (helpModal) {
        helpModal.style.display = 'block';
        
        // Focus search input
        const searchInput = document.getElementById('help-search-input');
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 100);
        }
      }
    }

    // ===== Data Loading =====
    async loadInitialData() {
      this.updateDashboard();
      this.loadAllRequests();
    }

    updateDashboard() {
      const requestManager = window.SilentStacks?.modules?.RequestManager;
      if (!requestManager) return;

      const requests = requestManager.getAllRequests();
      
      // Update statistics
      const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        completed: requests.filter(r => r.status === 'completed' || r.status === 'fulfilled').length,
        urgent: requests.filter(r => r.priority === 'urgent').length
      };

      this.updateStatElement('total-requests', stats.total);
      this.updateStatElement('pending-requests', stats.pending);
      this.updateStatElement('completed-requests', stats.completed);
      this.updateStatElement('urgent-requests', stats.urgent);

      // Update recent requests
      const recentRequests = requests
        .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
        .slice(0, 5);
      
      this.renderRecentRequests(recentRequests);
    }

    loadAllRequests() {
      const requestManager = window.SilentStacks?.modules?.RequestManager;
      if (!requestManager) return;

      const requests = requestManager.getAllRequests();
      this.renderRequestsList(requests);
    }

    // ===== Rendering Functions =====
    renderRequestsList(requests) {
      const listContainer = document.getElementById('request-list');
      if (!listContainer) return;

      listContainer.innerHTML = '';

      if (requests.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">No requests found</p>';
        return;
      }

      requests.forEach(request => {
        const card = this.createRequestCard(request);
        listContainer.appendChild(card);
      });

      // Update results count
      const countEl = document.getElementById('results-count');
      if (countEl) {
        countEl.textContent = `${requests.length} requests`;
      }
    }

    createRequestCard(request) {
      const card = document.createElement('div');
      card.className = 'request-card';
      card.setAttribute('data-request-id', request.id);

      // Build NLM citation
      const citation = this.buildNLMCitation(request);
      
      // Clinical trials indicator
      const trialsCount = request.clinicalTrials?.length || 0;
      const trialsIndicator = trialsCount > 0 ? `🧪 ${trialsCount} Clinical Trial(s)` : '';

      card.innerHTML = `
        <div class="request-row">
          <div class="request-select">
            <input type="checkbox" class="request-checkbox" data-request-id="${request.id}">
          </div>
          <div class="request-content">
            <div class="request-title">${citation}</div>
            <div class="request-meta">
              PMID: ${request.pmid || '—'} • DOI: ${request.doi || '—'} • Status: ${request.status || 'pending'} ${trialsIndicator ? '• ' + trialsIndicator : ''}
            </div>
            ${this.renderMeSHTags(request.meshHeadings)}
            ${this.renderClinicalTrialsCards(request.clinicalTrials)}
          </div>
        </div>
      `;

      return card;
    }

    buildNLMCitation(request) {
      const parts = [];
      
      // Authors (limit to 6, add et al if more)
      if (request.authors) {
        const authorList = request.authors.split(',').map(a => a.trim()).slice(0, 6);
        const authorsText = authorList.join(', ');
        const etAl = request.authors.split(',').length > 6 ? ', et al' : '';
        parts.push(`${authorsText}${etAl}.`);
      }
      
      // Title
      if (request.title) {
        const title = request.title.endsWith('.') ? request.title : `${request.title}.`;
        parts.push(title);
      }
      
      // Journal with volume/issue/pages
      if (request.journal) {
        let journalPart = request.journal;
        if (request.year) journalPart += `. ${request.year}`;
        if (request.volume) {
          journalPart += `;${request.volume}`;
          if (request.issue) journalPart += `(${request.issue})`;
          if (request.pages) journalPart += `:${request.pages}`;
        }
        journalPart += '.';
        parts.push(journalPart);
      }
      
      // PMID
      if (request.pmid) {
        parts.push(`PMID: ${request.pmid}.`);
      }
      
      return parts.join(' ').replace(/\s+/g, ' ').trim();
    }

    renderMeSHTags(meshHeadings) {
      if (!Array.isArray(meshHeadings) || meshHeadings.length === 0) {
        return '';
      }

      const tags = meshHeadings.slice(0, 5).map(mesh => 
        `<span class="tag mesh-tag ${mesh.isMajor ? 'mesh-major' : 'mesh-minor'}" title="${mesh.term}">
          ${mesh.term}${mesh.isMajor ? ' ⭐' : ''}
        </span>`
      ).join('');

      return `<div class="request-tags">${tags}</div>`;
    }

    renderClinicalTrialsCards(clinicalTrials) {
      if (!Array.isArray(clinicalTrials) || clinicalTrials.length === 0) {
        return '';
      }

      const cards = clinicalTrials.slice(0, 2).map(trial => 
        `<div class="trial-card">
          <strong>${trial.nctId}</strong> - ${trial.status}, ${trial.phase}
          <br><small>${trial.title}</small>
        </div>`
      ).join('');

      return `<div class="trials-wrap">${cards}</div>`;
    }

    renderRecentRequests(requests) {
      const container = document.getElementById('recent-requests');
      if (!container) return;

      container.innerHTML = '';

      if (requests.length === 0) {
        container.innerHTML = '<p class="empty-message">No recent requests</p>';
        return;
      }

      requests.forEach(request => {
        const item = document.createElement('div');
        item.className = 'recent-request-item';
        
        const citation = this.buildNLMCitation(request);
        const trialsCount = request.clinicalTrials?.length || 0;
        const trialsText = trialsCount > 0 ? ` (${trialsCount} trials)` : '';
        
        item.innerHTML = `
          <div class="recent-title">${citation}${trialsText}</div>
          <div class="recent-meta">Added: ${new Date(request.dateAdded).toLocaleDateString()}</div>
        `;
        
        container.appendChild(item);
      });
    }

    // ===== Utility Functions =====
    parseCSVData(csvText) {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) return [];

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const item = {};
        
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });
        
        if (item.pmid || item.doi || item.title) {
          items.push(item);
        }
      }

      return items;
    }

    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    }

    generateRequestId() {
      return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    // ===== Status and Progress =====
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

    showBulkStatus(message, type) {
      this.showStatus('bulk-paste-status', message, type);
    }

    showCSVStatus(message, type) {
      this.showStatus('csv-upload-status', message, type);
    }

    updateBulkProgress(current, total, message) {
      const statusEl = document.getElementById('bulk-paste-status');
      if (statusEl) {
        statusEl.textContent = `${message} (${current}/${total})`;
        statusEl.className = 'bulk-upload-status loading';
        statusEl.style.display = 'block';
      }
    }

    updateStatElement(elementId, value) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
      }
    }

    showError(message) {
      console.error(message);
      alert(message); // Simple fallback
    }
  }

  // ===== Global Functions for HTML onclick handlers =====
  window.toggleSelectAll = function(checked) {
    const checkboxes = document.querySelectorAll('.request-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = checked;
    });
    
    const deleteBtn = document.getElementById('delete-selected-btn');
    if (deleteBtn) {
      deleteBtn.style.display = checked && checkboxes.length > 0 ? 'inline-block' : 'none';
    }
  };

  window.deleteSelectedRequests = function() {
    const selectedCheckboxes = document.querySelectorAll('.request-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-request-id'));
    
    if (selectedIds.length === 0) {
      alert('No requests selected');
      return;
    }
    
    if (confirm(`Delete ${selectedIds.length} selected request(s)?`)) {
      const requestManager = window.SilentStacks?.modules?.RequestManager;
      if (requestManager) {
        selectedIds.forEach(id => requestManager.deleteRequest(id));
        
        // Refresh the list
        window.silentStacksApp?.loadAllRequests();
        
        // Clear selection
        document.getElementById('select-all').checked = false;
        document.getElementById('delete-selected-btn').style.display = 'none';
      }
    }
  };

  window.closeHelpModal = function() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
      helpModal.style.display = 'none';
    }
  };

  // ===== Initialize Application =====
  document.addEventListener('DOMContentLoaded', async () => {
    // Wait for modules to load
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      if (window.SilentStacks?.core?.eventBus) {
        break;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Create and initialize app
    window.silentStacksApp = new SilentStacksApp();
    await window.silentStacksApp.initialize();
  });

})();