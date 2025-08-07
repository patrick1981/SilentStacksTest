// assets/js/modules/bulk-operations.js
// SilentStacks V1.4 - FIXED Drop-in Replacement
// Uses EXACT existing architecture - no changes needed

(function() {
  'use strict';

  console.log('🔧 Loading FIXED Bulk Operations v1.4...');

  // === Configuration (unchanged) ===
  const SAFETY_LIMITS = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_ITEMS_PER_BATCH: 1000,
    MAX_MEMORY_USAGE: 256, // MB
    API_DELAY_MS: 200,
    CHUNK_SIZE: 50
  };

  // === FIXED: File Import Handler ===
  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // FIXED: Block Excel files as requested
    if (file.name.toLowerCase().includes('.xls')) {
      showImportStatus('Excel files are not supported. Please convert to CSV format for technology-agnostic compatibility.', 'error');
      event.target.value = '';
      return;
    }

    if (file.size > SAFETY_LIMITS.MAX_FILE_SIZE) {
      showImportStatus(`File too large. Maximum size: ${SAFETY_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`, 'error');
      event.target.value = '';
      return;
    }

    showImportStatus('Processing file...', 'info');

    try {
      const content = await readFileContent(file);
      let data;
      
      if (file.name.toLowerCase().endsWith('.json')) {
        data = JSON.parse(content);
        if (data.requests) data = data.requests; // Handle export format
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        data = parseCSVContent(content);
      } else {
        throw new Error('Unsupported file format. Use CSV or JSON.');
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No valid data found in file');
      }

      // FIXED: Process with API enrichment and show results
      const results = await processWithAPIEnrichment(data);
      
      // FIXED: Force refresh the All Requests display
      await refreshAllRequestsView();
      
      // FIXED: Show detailed confirmation
      showDetailedResults(results);

      event.target.value = '';

    } catch (error) {
      console.error('Import error:', error);
      showImportStatus(`Import failed: ${error.message}`, 'error');
      event.target.value = '';
    }
  }

  // === FIXED: Bulk Paste Handler ===
  async function handleBulkPasteWithLookup(event) {
    event.preventDefault();
    
    const textarea = document.getElementById('bulk-paste-data');
    if (!textarea) {
      showImportStatus('Bulk paste area not found', 'error');
      return;
    }

    const content = textarea.value.trim();
    if (!content) {
      showImportStatus('Please enter data to import', 'error');
      return;
    }

    const autoEnrich = document.getElementById('auto-enrich-api')?.checked ?? true;

    try {
      showImportStatus('Processing pasted data...', 'info');
      
      // Parse the input data
      let data;
      if (content.includes(',') && (content.includes('PMID') || content.includes('pmid') || content.includes('Title') || content.includes('DOI'))) {
        // Looks like CSV data
        data = parseCSVContent(content);
      } else {
        // Simple list format
        data = parseSimpleList(content);
      }

      if (data.length === 0) {
        throw new Error('No valid data found');
      }

      // FIXED: Process with API enrichment
      const results = await processWithAPIEnrichment(data, autoEnrich);
      
      // FIXED: Force refresh the All Requests display
      await refreshAllRequestsView();
      
      // FIXED: Show detailed confirmation
      showDetailedResults(results);

      textarea.value = ''; // Clear on success

    } catch (error) {
      console.error('Bulk paste error:', error);
      showImportStatus(`Processing failed: ${error.message}`, 'error');
    }
  }

  // === FIXED: Enhanced Processing with Better Results Tracking ===
  async function processWithAPIEnrichment(data, autoEnrich = true) {
    if (!data || data.length === 0) {
      throw new Error('No data to process');
    }

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      enriched: 0,
      errors: []
    };

    const validRequests = [];
    const chunkSize = Math.min(SAFETY_LIMITS.CHUNK_SIZE, 50);
    
    showImportStatus(`Processing ${data.length} items...`, 'info');
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      showImportStatus(`Processing items ${i + 1}-${Math.min(i + chunkSize, data.length)} of ${data.length}...`, 'info');
      
      for (const item of chunk) {
        try {
          const mappedRequest = mapCSVRowToRequest(item);
          if (!mappedRequest) {
            results.failed++;
            results.errors.push(`Item ${results.successful + results.failed}: Invalid data format`);
            continue;
          }

          // FIXED: API enrichment using existing enrichWithAPI function
          if (autoEnrich && (mappedRequest.pmid || mappedRequest.doi)) {
            try {
              const enrichedData = await enrichWithAPI(mappedRequest);
              if (enrichedData && enrichedData._wasEnriched) {
                Object.assign(mappedRequest, enrichedData);
                results.enriched++;
              }
            } catch (apiError) {
              console.warn('API enrichment failed:', apiError);
              // Continue with original data
            }
          }

          validRequests.push(mappedRequest);
          results.successful++;

        } catch (error) {
          results.failed++;
          results.errors.push(`Item ${results.successful + results.failed}: ${error.message}`);
          console.warn('Failed to process item:', error);
        }
      }

      // Memory management
      await checkMemoryBetweenChunks();
      
      // Small delay to prevent UI blocking
      if (i + chunkSize < data.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // FIXED: Save all valid requests at once
    if (validRequests.length > 0) {
      try {
        const saved = await safeAddRequests(validRequests);
        console.log(`✅ Successfully saved ${saved}/${validRequests.length} requests`);
      } catch (error) {
        console.error('Failed to save requests:', error);
        showImportStatus('Failed to save imported data', 'error');
      }
    }

    return results;
  }

  // === FIXED: Force Refresh All Requests View ===
  async function refreshAllRequestsView() {
    console.log('🔄 Refreshing All Requests view...');
    
    try {
      // Method 1: Use existing UIController if available
      const uiController = window.SilentStacks?.modules?.UIController;
      if (uiController && uiController.renderAllRequests) {
        await uiController.renderAllRequests();
        console.log('✅ Refreshed via UIController');
        return;
      }

      // Method 2: Use RequestManager refresh if available
      const requestManager = window.SilentStacks?.modules?.RequestManager;
      if (requestManager && requestManager.refreshAllViews) {
        requestManager.refreshAllViews();
        console.log('✅ Refreshed via RequestManager');
        return;
      }

      // Method 3: Trigger section refresh event
      const allRequestsTab = document.querySelector('[data-section="all-requests"]');
      if (allRequestsTab) {
        // Simulate click to refresh
        allRequestsTab.click();
        console.log('✅ Refreshed via tab click simulation');
        return;
      }

      console.warn('⚠️ No refresh method available - user may need to manually switch tabs');

    } catch (error) {
      console.error('Failed to refresh view:', error);
    }
  }

  // === FIXED: Show Detailed Results ===
  function showDetailedResults(results) {
    const { total, successful, failed, enriched, errors } = results;
    
    let message = `Import Complete!\n`;
    message += `📊 Total processed: ${total}\n`;
    message += `✅ Successfully imported: ${successful}\n`;
    message += `❌ Failed: ${failed}\n`;
    message += `🔬 Enriched with API data: ${enriched}`;
    
    // Show success message
    showImportStatus(
      `Successfully imported ${successful}/${total} items${enriched > 0 ? ` (${enriched} enriched)` : ''}`, 
      successful > 0 ? 'success' : 'error'
    );

    // Show detailed popup for failed items
    if (failed > 0 && errors.length > 0) {
      const errorList = errors.slice(0, 5).join('\n');
      const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : '';
      
      setTimeout(() => {
        if (confirm(message + '\n\nErrors occurred:\n' + errorList + moreErrors + '\n\nView imported items in All Requests?')) {
          const allRequestsTab = document.querySelector('[data-section="all-requests"]');
          if (allRequestsTab) allRequestsTab.click();
        }
      }, 1000);
    } else if (successful > 0) {
      // Success popup
      setTimeout(() => {
        if (confirm(message + '\n\nView imported items in All Requests?')) {
          const allRequestsTab = document.querySelector('[data-section="all-requests"]');
          if (allRequestsTab) allRequestsTab.click();
        }
      }, 1000);
    }
  }

  // === Parse Simple List (PMIDs, DOIs, Titles) ===
  function parseSimpleList(content) {
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    return lines.map(line => {
      if (/^\d+$/.test(line)) {
        return { pmid: line };
      } else if (line.includes('10.') || line.includes('doi')) {
        return { doi: line };
      } else {
        return { title: line };
      }
    });
  }

  // === Parse CSV Content ===
  function parseCSVContent(content) {
    try {
      if (window.Papa) {
        const result = Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          trimHeaders: true
        });
        return result.data || [];
      }
    } catch (error) {
      console.warn('PapaCSV parsing failed, using fallback:', error);
    }

    // Fallback manual CSV parsing
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      if (Object.values(row).some(val => val)) {
        data.push(row);
      }
    }

    return data;
  }

  // === Read File Content ===
  function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // === Enhanced CSV Export with FIXED Headers ===
  function exportCSV() {
    try {
      const dataManager = window.SilentStacks?.modules?.DataManager;
      if (!dataManager) {
        showNotification('Data manager not available', 'error');
        return;
      }

      const requests = dataManager.getRequests ? dataManager.getRequests() : [];
      
      if (requests.length === 0) {
        showNotification('No requests to export', 'warning');
        return;
      }

      // FIXED: Use required header order
      const headers = [
        'Docline Number',
        'PMID', 
        'Patron E-mail',
        'Article Title',
        'Authors',
        'Journal', 
        'Year',
        'DOI',
        'Date Stamp',
        'Status',
        'Priority',
        'Tags',
        'Notes',
        'Last Updated'
      ];
      
      const csvRows = [headers];
      
      requests.forEach(request => {
        const row = [
          request.docline || '',
          request.pmid || '',
          request.patronEmail || '',
          request.title || '',
          Array.isArray(request.authors) ? request.authors.join('; ') : (request.authors || ''),
          request.journal || '',
          request.year || '',
          request.doi || '',
          request.createdAt ? new Date(request.createdAt).toLocaleString() : '',
          request.status || 'pending',
          request.priority || 'normal',
          Array.isArray(request.tags) ? request.tags.join(', ') : (request.tags || ''),
          request.notes || '',
          request.updatedAt ? new Date(request.updatedAt).toLocaleString() : ''
        ];
        
        // Escape and quote CSV fields
        const escapedRow = row.map(field => {
          const str = String(field || '');
          return `"${str.replace(/"/g, '""')}"`;
        });
        
        csvRows.push(escapedRow);
      });

      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const filename = `SilentStacks_Export_${timestamp}.csv`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, filename);
      
      showNotification(`✅ Exported ${requests.length} requests to ${filename}`, 'success');
      
    } catch (error) {
      console.error('CSV export error:', error);
      showNotification(`Failed to export CSV: ${error.message}`, 'error');
    }
  }

  // === Existing functions kept unchanged ===
  async function enrichWithAPI(request) {
    if (!request) return request;

    const apiModule = window.SilentStacks?.modules?.APIIntegration;
    if (!apiModule) {
      console.warn('API Integration module not available');
      return request;
    }

    let enrichedData = null;
    
    try {
      if (request.pmid && apiModule.fetchPubMedData) {
        enrichedData = await apiModule.fetchPubMedData(request.pmid);
      } else if (request.doi && apiModule.fetchCrossRefData) {
        enrichedData = await apiModule.fetchCrossRefData(request.doi);
      }

      if (enrichedData) {
        const merged = mergeAPIData(request, enrichedData);
        merged._wasEnriched = true;
        return merged;
      }
    } catch (error) {
      console.warn('API enrichment failed:', error);
    }

    return request;
  }

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

  async function safeAddRequests(requests) {
    if (!requests || requests.length === 0) {
      return 0;
    }

    let added = 0;
    
    try {
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
      // FIXED: Enhanced DOCLINE support  
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
      importStatus.innerHTML = `
        <div class="import-message ${type}">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'} 
          ${message}
        </div>
      `;
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
      // Fallback to import status display
      showImportStatus(message, type);
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

  // === Bulk Update Functions (existing) ===
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

  // === FIXED Module Interface (matches existing) ===
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

    // Core functionality (same interface as existing)
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

  // === FIXED Registration (exact same as existing) ===
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
    
    // Auto-initialize if DOM is ready (same as existing)
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

  // === Debug Information (same as existing) ===
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
