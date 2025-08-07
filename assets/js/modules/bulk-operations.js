// Fixed Bulk Operations Module for SilentStacks v1.4
// Addresses: Non-working paste/upload functions, PMID auto-fetch, DOCLINE support

(function() {
  'use strict';

  console.log('🚀 Loading FIXED Bulk Operations v1.4...');

  // Safety limits
  const SAFETY_LIMITS = {
    MAX_IMPORT_SIZE: 1000,
    MAX_MEMORY_USAGE: 200, // MB
    MAX_BATCH_SIZE: 25, // Reduced for stability
    API_DELAY: 1200, // Slightly longer delay
    MAX_CONCURRENT_API_CALLS: 5
  };

  // === FIXED: File Import Handler ===
  async function handleImport(event) {
    console.log('📁 File import triggered');
    
    const file = event.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);
    
    // Clear any previous status
    showImportStatus('📖 Reading file...', 'loading');
    
    try {
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum: 50MB`);
      }

      // Read file content
      const data = await readFileContent(file);
      console.log(`File content length: ${data.length} characters`);
      
      // Process the file data
      await processFileData(data, file.name);
      
    } catch (error) {
      console.error('File import error:', error);
      showImportStatus(`❌ Import failed: ${error.message}`, 'error');
    }
  }

  // === FIXED: File Reading with Better Error Handling ===
  function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        console.log('✅ File read successfully');
        resolve(e.target.result);
      };
      
      reader.onerror = function(e) {
        console.error('File reading failed:', e);
        reject(new Error('Failed to read file'));
      };
      
      reader.onabort = function() {
        console.error('File reading aborted');
        reject(new Error('File reading was aborted'));
      };
      
      // Start reading
      reader.readAsText(file);
    });
  }

  // === FIXED: Process File Data ===
  async function processFileData(data, filename) {
    let parsedData = [];
    
    try {
      showImportStatus('📊 Parsing data...', 'loading');
      
      if (filename.endsWith('.json')) {
        console.log('Processing JSON file');
        const jsonData = JSON.parse(data);
        parsedData = Array.isArray(jsonData) ? jsonData : (jsonData.requests || []);
        
      } else if (filename.endsWith('.csv')) {
        console.log('Processing CSV file');
        
        if (!window.Papa) {
          throw new Error('CSV parsing library (PapaCSV) not available. Please check if papaparse.min.js is loaded.');
        }
        
        const parseResults = Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false, // Keep as strings for better control
          delimitersToGuess: [',', '\t', '|', ';'],
          transformHeader: function(header) {
            return header.trim(); // Clean headers
          }
        });
        
        console.log('CSV parse results:', parseResults);
        
        if (parseResults.errors && parseResults.errors.length > 0) {
          console.warn('CSV parsing warnings:', parseResults.errors);
          // Show warnings but continue if we have data
          if (!parseResults.data || parseResults.data.length === 0) {
            throw new Error(`CSV parsing failed: ${parseResults.errors[0].message}`);
          }
        }
        
        parsedData = parseResults.data
          .map(row => mapCSVRowToRequest(row))
          .filter(req => req && (req.title || req.pmid || req.doi || req.docline));
        
      } else {
        throw new Error('Unsupported file format. Please use .csv or .json files only.');
      }
      
      console.log(`Parsed ${parsedData.length} records from ${filename}`);
      
      if (parsedData.length === 0) {
        throw new Error('No valid records found. Check your file format and required fields (Title, PMID, DOI, or DOCLINE).');
      }
      
      // Process with API enrichment
      await processWithAPIEnrichment(parsedData, filename);
      
    } catch (error) {
      console.error('Data processing error:', error);
      throw error;
    }
  }

  // === FIXED: Bulk Paste Handler ===
  async function handleBulkPasteWithLookup() {
    console.log('📋 Bulk paste triggered');
    
    const textarea = document.getElementById('bulk-paste-data');
    if (!textarea) {
      console.error('❌ Bulk paste textarea not found');
      showNotification('Bulk paste area not found', 'error');
      return;
    }
    
    const data = textarea.value.trim();
    if (!data) {
      showNotification('Please paste some data first', 'warning');
      return;
    }

    console.log(`Processing pasted data: ${data.length} characters`);
    
    try {
      showImportStatus('📊 Processing pasted data...', 'loading');
      
      // Detect if it's a simple list vs CSV data
      const lines = data.split('\n').map(line => line.trim()).filter(Boolean);
      let parsedData = [];

      // Simple PMID/DOI list detection (numbers or DOI format)
      const isSimpleList = lines.every(line => 
        /^\d+$/.test(line) || /^10\.\d+\/.+/.test(line)
      );

      if (isSimpleList) {
        console.log('Detected simple PMID/DOI list');
        
        // Convert to structured data
        parsedData = lines.map(line => {
          if (/^\d+$/.test(line)) {
            return { pmid: line.trim() };
          } else if (/^10\.\d+\/.+/.test(line)) {
            return { doi: line.trim() };
          }
          return null;
        }).filter(Boolean);
        
      } else {
        console.log('Processing as CSV data');
        
        if (!window.Papa) {
          throw new Error('CSV parsing library not available');
        }
        
        const parseResults = Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          delimitersToGuess: [',', '\t', '|', ';'],
          transformHeader: function(header) {
            return header.trim();
          }
        });
        
        if (parseResults.errors && parseResults.errors.length > 0) {
          console.warn('CSV paste warnings:', parseResults.errors);
        }
        
        if (!parseResults.data || parseResults.data.length === 0) {
          throw new Error('No valid CSV data found. Check your format and headers.');
        }
        
        parsedData = parseResults.data
          .map(row => mapCSVRowToRequest(row))
          .filter(req => req && (req.title || req.pmid || req.doi || req.docline));
      }
      
      console.log(`Parsed ${parsedData.length} records from paste`);
      
      if (parsedData.length === 0) {
        throw new Error('No valid records found in pasted data.');
      }
      
      // Process with API enrichment
      await processWithAPIEnrichment(parsedData, 'pasted-data');
      
      // Clear textarea on success
      textarea.value = '';
      
    } catch (error) {
      console.error('Bulk paste error:', error);
      showImportStatus(`❌ Paste failed: ${error.message}`, 'error');
    }
  }

  // === NEW: Unified Processing with API Enrichment ===
  async function processWithAPIEnrichment(data, source) {
    console.log(`🔄 Processing ${data.length} records from ${source}`);
    
    // Check size limits
    if (data.length > SAFETY_LIMITS.MAX_IMPORT_SIZE) {
      const proceed = confirm(
        `⚠️ Large dataset detected (${data.length} items).\n\n` +
        `This includes automatic PMID/DOI lookups which may take time.\n\n` +
        `Continue?`
      );
      
      if (!proceed) {
        showImportStatus('❌ Processing cancelled', 'error');
        return;
      }
    }

    // Separate records that need API lookups vs those that don't
    const recordsNeedingAPI = data.filter(req => 
      (req.pmid || req.doi) && (!req.title || !req.authors)
    );
    
    const recordsReadyToImport = data.filter(req => 
      (!req.pmid && !req.doi) || (req.title && req.authors)
    );

    console.log(`Records needing API: ${recordsNeedingAPI.length}, Ready to import: ${recordsReadyToImport.length}`);

    // Import ready records immediately
    let totalImported = 0;
    if (recordsReadyToImport.length > 0) {
      console.log('Importing records without API lookups...');
      showImportStatus(`📥 Importing ${recordsReadyToImport.length} records...`, 'loading');
      
      try {
        const importedCount = await safeAddRequests(recordsReadyToImport);
        totalImported += importedCount;
        console.log(`✅ Imported ${importedCount} records without API`);
      } catch (error) {
        console.error('Error importing ready records:', error);
      }
    }

    // Process API-dependent records with enrichment
    if (recordsNeedingAPI.length > 0) {
      console.log('Processing records with API lookups...');
      showImportStatus(`🔍 Processing ${recordsNeedingAPI.length} records with API lookups...`, 'loading');
      
      let enrichedCount = 0;
      for (let i = 0; i < recordsNeedingAPI.length; i++) {
        const record = recordsNeedingAPI[i];
        
        try {
          const enrichedRecord = await enrichWithAPI(record);
          await safeAddRequests([enrichedRecord]);
          
          if (enrichedRecord._wasEnriched) {
            enrichedCount++;
          }
          totalImported++;
          
          // Progress update
          const progress = Math.round(((i + 1) / recordsNeedingAPI.length) * 100);
          showImportStatus(
            `🔍 API processing: ${i + 1}/${recordsNeedingAPI.length} (${enrichedCount} enriched)`, 
            'loading'
          );
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, SAFETY_LIMITS.API_DELAY));
          
        } catch (error) {
          console.warn(`Failed to process record ${i + 1}:`, error);
          // Add without enrichment
          try {
            await safeAddRequests([record]);
            totalImported++;
          } catch (addError) {
            console.error(`Failed to add record ${i + 1}:`, addError);
          }
        }
      }
      
      console.log(`✅ API processing complete. ${enrichedCount} records enriched.`);
    }

    if (totalImported > 0) {
      // Force UI refresh using multiple methods
      
      // Method 1: UIController renderRequests
      if (window.SilentStacks.modules.UIController?.renderRequests) {
        console.log('🔄 Refreshing UI via UIController...');
        window.SilentStacks.modules.UIController.renderRequests();
      }
      
      // Method 2: UIController renderStats  
      if (window.SilentStacks.modules.UIController?.renderStats) {
        window.SilentStacks.modules.UIController.renderStats();
      }
      
      // Method 3: Legacy renderAll fallback
      if (window.renderAll && typeof window.renderAll === 'function') {
        console.log('🔄 Refreshing UI via legacy renderAll...');
        window.renderAll();
      }
      
      // Method 4: Direct DOM refresh as last resort
      const requestList = document.getElementById('request-list');
      if (requestList && !requestList.children.length) {
        console.log('🔄 Force refreshing request list DOM...');
        const requests = window.SilentStacks.modules.DataManager.getRequests();
        console.log(`Found ${requests.length} requests in DataManager`);
        
        if (requests.length > 0) {
          // Trigger a manual re-render
          const event = new CustomEvent('requestsUpdated', { 
            detail: { requests, source: 'bulk-import' } 
          });
          document.dispatchEvent(event);
        }
      }
      
      // Success message
      showImportStatus(
        `✅ Successfully imported ${totalImported} records${recordsNeedingAPI.length > 0 ? ' with API enrichment' : ''}`, 
        'success'
      );
      
      showNotification(
        `Import complete! ${totalImported} records added.`,
        'success'
      );
    }
  // === FIXED: API Enrichment ===
  async function enrichWithAPI(record) {
    let enriched = { ...record };
    let wasEnriched = false;

    // Skip if already complete
    if (enriched.title && enriched.authors && enriched.journal) {
      return { ...enriched, _wasEnriched: false };
    }

    try {
      // Try PMID lookup first
      if (enriched.pmid && isValidPMID(enriched.pmid)) {
        console.log(`🔍 Looking up PMID: ${enriched.pmid}`);
        
        const api = window.SilentStacks?.modules?.APIIntegration;
        if (api && api.fetchPubMed) {
          const pubmedData = await api.fetchPubMed(enriched.pmid);
          
          if (pubmedData && pubmedData.title) {
            // Merge API data, preserving existing values
            enriched = mergeAPIData(enriched, pubmedData);
            wasEnriched = true;
            console.log(`✅ Enriched PMID ${enriched.pmid}`);
          }
        } else {
          console.warn('APIIntegration module not available for PMID lookup');
        }
      }
      
      // Try DOI lookup if still missing data
      if (!wasEnriched && enriched.doi && isValidDOI(enriched.doi)) {
        console.log(`🔍 Looking up DOI: ${enriched.doi}`);
        
        const api = window.SilentStacks?.modules?.APIIntegration;
        if (api && api.fetchCrossRef) {
          const crossrefData = await api.fetchCrossRef(enriched.doi);
          
          if (crossrefData && crossrefData.title) {
            enriched = mergeAPIData(enriched, crossrefData);
            wasEnriched = true;
            console.log(`✅ Enriched DOI ${enriched.doi}`);
          }
        } else {
          console.warn('APIIntegration module not available for DOI lookup');
        }
      }
      
    } catch (error) {
      console.warn(`API enrichment failed for record:`, error);
    }

    return { ...enriched, _wasEnriched: wasEnriched };
  }

  // === Helper Functions ===
  function isValidPMID(pmid) {
    return pmid && /^\d+$/.test(pmid.toString().trim());
  }

  function isValidDOI(doi) {
    return doi && /^10\.\d+\/.+/.test(doi.toString().trim());
  }

  function mergeAPIData(existing, apiData) {
    const merged = { ...apiData };
    
    // Preserve existing non-empty values
    Object.keys(existing).forEach(key => {
      if (existing[key] && existing[key] !== '' && key !== '_wasEnriched') {
        merged[key] = existing[key];
      }
    });
    
    return merged;
  }

  // === FIXED: Safe Add Requests ===
  async function safeAddRequests(requests) {
    if (!requests || requests.length === 0) {
      return 0;
    }

    let added = 0;
    
    try {
      // Check if DataManager is available
      const dataManager = window.SilentStacks?.modules?.DataManager;
      if (!dataManager) {
        throw new Error('DataManager module not available');
      }

      // Add requests individually for better error handling
      for (const request of requests) {
        try {
          if (dataManager.addRequest) {
            dataManager.addRequest(request);
            added++;
          } else if (dataManager.bulkAddRequests) {
            const result = dataManager.bulkAddRequests([request]);
            added += result;
          } else {
            console.error('No add method available in DataManager');
            break;
          }
        } catch (error) {
          console.warn('Failed to add individual request:', error);
        }
      }
      
      console.log(`✅ Successfully added ${added}/${requests.length} requests`);
      return added;
      
    } catch (error) {
      console.error('Safe add requests failed:', error);
      throw error;
    }
  }

  // === FIXED: CSV Row Mapping with Enhanced DOCLINE Support ===
  function mapCSVRowToRequest(row) {
    if (!row || typeof row !== 'object') {
      return null;
    }

    // Helper to get value from multiple possible header variations
    const getValue = (possibleKeys) => {
      for (const key of possibleKeys) {
        const value = row[key];
        if (value !== undefined && value !== null && value !== '') {
          return String(value).trim();
        }
      }
      return '';
    };

    const mapped = {
      pmid: getValue(['pmid', 'PMID', 'Pmid', 'PmId', 'pubmed_id', 'PubMed ID']),
      doi: getValue(['doi', 'DOI', 'Doi', 'DoI', 'digital_object_identifier']),
      title: getValue(['title', 'Title', 'TITLE', 'publication_title', 'Publication Title', 'article_title']),
      authors: getValue(['authors', 'Authors', 'AUTHORS', 'author', 'Author', 'author_list']),
      journal: getValue(['journal', 'Journal', 'JOURNAL', 'source', 'Source', 'publication_source']),
      year: getValue(['year', 'Year', 'YEAR', 'publication_year', 'Publication Year', 'pub_year']),
      priority: validatePriority(getValue(['priority', 'Priority', 'PRIORITY']).toLowerCase()),
      status: validateStatus(getValue(['status', 'Status', 'STATUS']).toLowerCase()),
      patronEmail: getValue(['patronEmail', 'PatronEmail', 'patron_email', 'Patron Email', 'patron-email', 'email', 'Email', 'user_email']),
      docline: getValue(['docline', 'Docline', 'DOCLINE', 'docline_number', 'DOCLINE_NUMBER', 'request_number', 'Request Number', 'ill_number']),
      notes: getValue(['notes', 'Notes', 'NOTES', 'note', 'Note', 'comments', 'Comments', 'description']),
      tags: parseTagsFromString(getValue(['tags', 'Tags', 'TAGS', 'keywords', 'Keywords', 'subjects'])),
      createdAt: getValue(['createdAt', 'Created', 'created', 'date_created', 'Date Created']) || new Date().toISOString()
    };

    // Validate that we have at least one useful field
    if (!mapped.title && !mapped.pmid && !mapped.doi && !mapped.docline) {
      return null;
    }

    return mapped;
  }

  // === Utility Functions ===
  function validatePriority(priority) {
    const valid = ['urgent', 'rush', 'normal', 'low'];
    return valid.includes(priority) ? priority : 'normal';
  }

  function validateStatus(status) {
    const valid = ['pending', 'in-progress', 'fulfilled', 'cancelled', 'on-hold'];
    return valid.includes(status) ? status : 'pending';
  }

  function parseTagsFromString(tagString) {
    if (!tagString) return [];
    return tagString.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
  }

  function showImportStatus(message, type) {
    const importStatus = document.getElementById('import-status');
    if (importStatus) {
      importStatus.textContent = message;
      importStatus.className = `import-status ${type}`;
      importStatus.style.display = 'block';
      
      if (type === 'success') {
        setTimeout(() => {
          importStatus.style.display = 'none';
        }, 10000);
      }
    }
    console.log(`Import Status: ${message} (${type})`);
  }

  function showNotification(message, type) {
    if (window.SilentStacks?.modules?.UIController?.showNotification) {
      window.SilentStacks.modules.UIController.showNotification(message, type);
    } else {
      console.log(`Notification: ${message} (${type})`);
      // Fallback to alert for critical errors
      if (type === 'error') {
        alert(message);
      }
    }
  }

  async function checkMemoryBetweenChunks() {
    if (performance.memory) {
      const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
      if (memoryMB > SAFETY_LIMITS.MAX_MEMORY_USAGE) {
        console.log('🧹 High memory usage, performing cleanup...');
        
        if (window.SilentStacks.modules.DataManager.performMemoryCleanup) {
          window.SilentStacks.modules.DataManager.performMemoryCleanup();
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // === FIXED: Bulk Update Functions ===
  async function bulkUpdateStatus(requestIds, newStatus) {
    if (!requestIds || requestIds.length === 0) {
      throw new Error('No requests selected');
    }

    console.log(`Updating ${requestIds.length} requests to status: ${newStatus}`);
    
    let updated = 0;
    const dataManager = window.SilentStacks?.modules?.DataManager;
    
    if (!dataManager) {
      throw new Error('DataManager not available');
    }

    try {
      for (const id of requestIds) {
        try {
          if (dataManager.updateRequest) {
            const success = dataManager.updateRequest(id, { 
              status: newStatus,
              updatedAt: new Date().toISOString()
            });
            if (success) updated++;
          }
        } catch (error) {
          console.warn(`Failed to update request ${id}:`, error);
        }
      }
      
      // Refresh UI
      if (window.SilentStacks.modules.RequestManager?.refreshAllViews) {
        window.SilentStacks.modules.RequestManager.refreshAllViews();
      }
      
      showNotification(
        `✅ Updated ${updated}/${requestIds.length} request(s) to ${newStatus}`,
        'success'
      );
      
      return updated;
    } catch (error) {
      console.error('Bulk status update error:', error);
      throw error;
    }
  }

  async function bulkUpdatePriority(requestIds, newPriority) {
    if (!requestIds || requestIds.length === 0) {
      throw new Error('No requests selected');
    }

    console.log(`Updating ${requestIds.length} requests to priority: ${newPriority}`);
    
    let updated = 0;
    const dataManager = window.SilentStacks?.modules?.DataManager;
    
    if (!dataManager) {
      throw new Error('DataManager not available');
    }

    try {
      for (const id of requestIds) {
        try {
          if (dataManager.updateRequest) {
            const success = dataManager.updateRequest(id, { 
              priority: newPriority,
              updatedAt: new Date().toISOString()
            });
            if (success) updated++;
          }
        } catch (error) {
          console.warn(`Failed to update request ${id}:`, error);
        }
      }
      
      // Refresh UI
      if (window.SilentStacks.modules.RequestManager?.refreshAllViews) {
        window.SilentStacks.modules.RequestManager.refreshAllViews();
      }
      
      showNotification(
        `✅ Updated ${updated}/${requestIds.length} request(s) to ${newPriority} priority`,
        'success'
      );
      
      return updated;
    } catch (error) {
      console.error('Bulk priority update error:', error);
      throw error;
    }
  }

  // === FIXED: CSV Export with DOCLINE ===
  async function exportCSV() {
    console.log('📤 Starting CSV export...');
    
    const dataManager = window.SilentStacks?.modules?.DataManager;
    if (!dataManager || !dataManager.getRequests) {
      showNotification('DataManager not available for export', 'error');
      return;
    }
    
    const requests = dataManager.getRequests();
    
    if (!requests || requests.length === 0) {
      showNotification('No requests to export', 'warning');
      return;
    }
    
    try {
      // Headers for CSV export (including DOCLINE)
      const headers = [
        'PMID', 'DOI', 'Title', 'Authors', 'Journal', 'Year', 
        'Status', 'Priority', 'Tags', 'Notes', 'Patron Email', 
        'DOCLINE', 'Created', 'Updated'
      ];
      
      let csvContent = headers.join(',') + '\n';
      
      // Convert requests to CSV rows
      const csvRows = requests.map(r => [
        r.pmid || '',
        r.doi || '',
        r.title || '',
        r.authors || '',
        r.journal || '',
        r.year || '',
        r.status || 'pending',
        r.priority || 'normal',
        (r.tags || []).join('; '),
        r.notes || '',
        r.patronEmail || '',
        r.docline || '', // DOCLINE field
        r.createdAt || '',
        r.updatedAt || r.createdAt || ''
      ]);
      
      // Escape CSV values properly
      csvContent += csvRows
        .map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `silentstacks-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadFile(blob, filename);
      
      showNotification(`✅ Exported ${requests.length} requests to ${filename}`, 'success');
      
    } catch (error) {
      console.error('CSV export error:', error);
      showNotification(`Failed to export CSV: ${error.message}`, 'error');
    }
  }

  function downloadFile(blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download file');
    }
  }

  // === FIXED Module Interface ===
  const FixedBulkOperations = {
    // Initialization with better error handling
    initialize() {
      console.log('🔧 Initializing FIXED Bulk Operations v1.4...');
      
      try {
        // Set up file input handler
        const importFile = document.getElementById('import-file');
        if (importFile) {
          importFile.addEventListener('change', handleImport);
          console.log('✅ File import handler attached');
        } else {
          console.warn('⚠️ File input element not found');
        }

        // Set up bulk paste handler  
        const bulkPasteBtn = document.getElementById('bulk-paste-btn');
        if (bulkPasteBtn) {
          bulkPasteBtn.addEventListener('click', handleBulkPasteWithLookup);
          console.log('✅ Bulk paste handler attached');
        } else {
          console.warn('⚠️ Bulk paste button not found');
        }

        // Set up export handlers
        const exportCSVBtn = document.getElementById('export-csv');
        if (exportCSVBtn) {
          exportCSVBtn.addEventListener('click', exportCSV);
          console.log('✅ CSV export handler attached');
        } else {
          console.warn('⚠️ CSV export button not found');
        }
        
        console.log('✅ FIXED Bulk Operations v1.4 initialized successfully');
        
      } catch (error) {
        console.error('❌ Bulk Operations initialization failed:', error);
      }
    },

    // Core functionality
    handleImport,
    handleBulkPasteWithLookup,
    processWithAPIEnrichment,
    enrichWithAPI,
    exportCSV,
    
    // Bulk updates
    bulkUpdateStatus,
    bulkUpdatePriority,

    // Utilities
    mapCSVRowToRequest,
    safeAddRequests,
    isValidPMID,
    isValidDOI,
    validatePriority,
    validateStatus,
    parseTagsFromString,

    // Configuration
    SAFETY_LIMITS,
    
    // Version info
    version: '1.4.0-fixed'
  };

  // === FIXED Registration ===
  try {
    // Ensure SilentStacks structure exists
    if (!window.SilentStacks) {
      window.SilentStacks = { modules: {} };
    }
    if (!window.SilentStacks.modules) {
      window.SilentStacks.modules = {};
    }

    // Register the module
    window.SilentStacks.modules.BulkOperations = FixedBulkOperations;
    
    console.log('✅ FIXED Bulk Operations v1.4 registered successfully');
    
    // Auto-initialize if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => FixedBulkOperations.initialize(), 100);
      });
    } else {
      // DOM already ready, initialize after a short delay
      setTimeout(() => FixedBulkOperations.initialize(), 100);
    }
    
  } catch (error) {
    console.error('❌ FIXED Bulk Operations registration failed:', error);
  }

  // === Debug Information ===
  console.log('📊 FIXED Bulk Operations v1.4 Debug Info:');
  console.log('- File input ID: import-file');
  console.log('- Bulk paste button ID: bulk-paste-btn'); 
  console.log('- Bulk paste textarea ID: bulk-paste-data');
  console.log('- Export CSV button ID: export-csv');
  console.log('- Import status div ID: import-status');
  console.log('- Safety limits:', SAFETY_LIMITS);
  console.log('- PapaCSV available:', !!window.Papa);
  console.log('- SilentStacks structure:', !!window.SilentStacks);

})();
