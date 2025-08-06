// Enhanced Bulk Operations Module for SilentStacks v1.3.0
// Addresses: PMID bulk fetch, bulk updates, CSV fixes, DOCLINE support

(function() {
  'use strict';

  console.log('🚀 Loading Enhanced Bulk Operations v1.3.0...');

  // Safety limits
  const SAFETY_LIMITS = {
    MAX_IMPORT_SIZE: 1000,
    MAX_MEMORY_USAGE: 200, // MB
    MAX_BATCH_SIZE: 50,
    API_DELAY: 1000 // ms between API calls
  };

  // === Enhanced CSV Import with PMID Auto-Population ===
  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`📂 Processing import file: ${file.name}`);
    
    try {
      showImportStatus('📥 Reading file...', 'loading');
      
      const data = await readFile(file);
      let importedData = [];
      
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(data);
        importedData = Array.isArray(parsed) ? parsed : (parsed.requests || []);
      } else if (file.name.endsWith('.csv')) {
        if (!window.Papa) {
          throw new Error('CSV parsing library not available');
        }
        
        const results = Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false, // Keep as strings for better processing
          delimitersToGuess: [',', '\t', '|', ';']
        });
        
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        
        importedData = results.data.map(row => mapCSVRowToRequest(row));
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON files.');
      }
      
      // Process import with API lookups
      await processImportWithAPILookup(importedData, file.name);
      
    } catch (error) {
      console.error('Import error:', error);
      showImportStatus(`❌ Import failed: ${error.message}`, 'error');
    }
  }

  // === New: Process Import with Automatic API Lookups ===
  async function processImportWithAPILookup(importedData, filename) {
    // Filter and validate data
    const validRequests = importedData.filter(req => 
      req && (req.title || req.pmid || req.doi || req.docline)
    );
    
    if (validRequests.length === 0) {
      throw new Error('No valid requests found. Ensure you have Title, PMID, DOI, or DOCLINE columns.');
    }

    // Check size limits
    if (validRequests.length > SAFETY_LIMITS.MAX_IMPORT_SIZE) {
      const proceed = confirm(
        `⚠️ Large import detected (${validRequests.length} items).\n\n` +
        `This will include automatic PMID lookups and may take time.\n\n` +
        `Continue with bulk API processing?`
      );
      
      if (!proceed) {
        showImportStatus('❌ Import cancelled', 'error');
        return;
      }
    }

    showImportStatus(`🔄 Processing ${validRequests.length} requests with API lookups...`, 'loading');
    
    // Process with chunked API lookups
    let processedCount = 0;
    let enrichedCount = 0;
    const chunkSize = 10; // Small chunks for API calls
    
    for (let i = 0; i < validRequests.length; i += chunkSize) {
      const chunk = validRequests.slice(i, i + chunkSize);
      
      // Process each request in chunk with API enrichment
      for (const request of chunk) {
        try {
          const enrichedRequest = await enrichRequestWithAPI(request);
          
          // Add to data store
          window.SilentStacks.modules.DataManager.addRequest(enrichedRequest);
          processedCount++;
          
          if (enrichedRequest._wasEnriched) {
            enrichedCount++;
          }
          
          // Update progress
          const progress = Math.round((processedCount / validRequests.length) * 100);
          showImportStatus(
            `🔄 Processing ${processedCount}/${validRequests.length} (${enrichedCount} enriched via API)...`, 
            'loading'
          );
          
          // Rate limiting between API calls
          await new Promise(resolve => setTimeout(resolve, SAFETY_LIMITS.API_DELAY));
          
        } catch (error) {
          console.warn(`Failed to process request:`, error);
          // Still add the request even if API failed
          window.SilentStacks.modules.DataManager.addRequest(request);
          processedCount++;
        }
      }
      
      // Memory cleanup between chunks
      await checkMemoryBetweenChunks();
    }

    // Update UI
    window.SilentStacks.modules.RequestManager.refreshAllViews();
    
    // Clear file input
    const importFile = document.getElementById('import-file');
    if (importFile) {
      importFile.value = '';
    }
    
    showImportStatus(
      `✅ Successfully imported ${processedCount} requests (${enrichedCount} auto-populated via PubMed API)`, 
      'success'
    );
  }

  // === New: Enrich Request with API Data ===
  async function enrichRequestWithAPI(request) {
    let enriched = { ...request };
    let wasEnriched = false;

    // Skip if already has complete metadata
    const hasCompleteMetadata = enriched.title && enriched.authors && enriched.journal && enriched.year;
    
    if (hasCompleteMetadata && !enriched.pmid && !enriched.doi) {
      return enriched;
    }

    try {
      // Try PMID lookup first if available
      if (enriched.pmid && (!enriched.title || !enriched.authors)) {
        console.log(`🔍 Fetching PubMed data for PMID: ${enriched.pmid}`);
        
        if (window.SilentStacks?.modules?.APIIntegration?.fetchPubMed) {
          const pubmedData = await window.SilentStacks.modules.APIIntegration.fetchPubMed(enriched.pmid);
          
          if (pubmedData && pubmedData.title) {
            // Merge API data with existing data (existing takes precedence)
            enriched = {
              ...pubmedData,
              ...Object.fromEntries(Object.entries(enriched).filter(([_, v]) => v && v !== ''))
            };
            wasEnriched = true;
            console.log(`✅ Enriched request with PubMed data for PMID: ${enriched.pmid}`);
          }
        }
      }
      
      // Try DOI lookup if still missing data
      if (!wasEnriched && enriched.doi && (!enriched.title || !enriched.authors)) {
        console.log(`🔍 Fetching CrossRef data for DOI: ${enriched.doi}`);
        
        if (window.SilentStacks?.modules?.APIIntegration?.fetchCrossRef) {
          const crossrefData = await window.SilentStacks.modules.APIIntegration.fetchCrossRef(enriched.doi);
          
          if (crossrefData && crossrefData.title) {
            enriched = {
              ...crossrefData,
              ...Object.fromEntries(Object.entries(enriched).filter(([_, v]) => v && v !== ''))
            };
            wasEnriched = true;
            console.log(`✅ Enriched request with CrossRef data for DOI: ${enriched.doi}`);
          }
        }
      }
    } catch (error) {
      console.warn(`API enrichment failed for request:`, error);
      // Continue with original data
    }

    enriched._wasEnriched = wasEnriched;
    return enriched;
  }

  // === Enhanced Bulk Paste with PMID Support ===
  async function handleBulkPasteWithLookup() {
    const textarea = document.getElementById('bulk-paste-data');
    if (!textarea) {
      console.error('Bulk paste textarea not found');
      return;
    }
    
    const data = textarea.value.trim();
    
    if (!data) {
      window.SilentStacks.modules.UIController.showNotification('Please paste some data first', 'warning');
      return;
    }

    try {
      // Check if it's just a list of PMIDs/DOIs
      const lines = data.split('\n').map(line => line.trim()).filter(Boolean);
      let parsedData;

      // Simple PMID/DOI list detection
      if (lines.length > 0 && lines.every(line => /^(\d+|10\.\d+\/.+)$/.test(line))) {
        console.log('🔍 Detected simple PMID/DOI list');
        
        // Convert to CSV format for processing
        const csvData = 'PMID,DOI\n' + lines.map(line => {
          if (/^\d+$/.test(line)) {
            return `${line},`;
          } else {
            return `,${line}`;
          }
        }).join('\n');
        
        parsedData = Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false
        });
      } else {
        // Regular CSV parsing
        parsedData = Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          delimitersToGuess: [',', '\t', '|', ';']
        });
      }
      
      if (!parsedData.data || parsedData.data.length === 0) {
        throw new Error('No valid data found. Check your format.');
      }
      
      const importedData = parsedData.data.map(row => mapCSVRowToRequest(row));
      await processImportWithAPILookup(importedData, 'pasted-data');
      
      // Clear textarea on success
      textarea.value = '';
      
    } catch (error) {
      console.error('Bulk paste error:', error);
      window.SilentStacks.modules.UIController.showNotification(
        `Bulk paste failed: ${error.message}`,
        'error'
      );
    }
  }

  // === New: Bulk Update Functions ===
  async function bulkUpdateStatus(requestIds, newStatus) {
    if (!requestIds || requestIds.length === 0) {
      throw new Error('No requests selected for update');
    }

    let updated = 0;
    const total = requestIds.length;

    try {
      // Process in batches to avoid performance issues
      for (let i = 0; i < requestIds.length; i += SAFETY_LIMITS.MAX_BATCH_SIZE) {
        const batch = requestIds.slice(i, i + SAFETY_LIMITS.MAX_BATCH_SIZE);
        
        batch.forEach(id => {
          const success = window.SilentStacks.modules.DataManager.updateRequest(id, { status: newStatus });
          if (success) updated++;
        });
        
        // Memory cleanup between batches
        if (batch.length === SAFETY_LIMITS.MAX_BATCH_SIZE) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Refresh UI
      window.SilentStacks.modules.RequestManager.refreshAllViews();
      
      window.SilentStacks.modules.UIController.showNotification(
        `✅ Updated ${updated}/${total} request${updated !== 1 ? 's' : ''} to ${newStatus}`,
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
      throw new Error('No requests selected for update');
    }

    let updated = 0;
    const total = requestIds.length;

    try {
      // Process in batches
      for (let i = 0; i < requestIds.length; i += SAFETY_LIMITS.MAX_BATCH_SIZE) {
        const batch = requestIds.slice(i, i + SAFETY_LIMITS.MAX_BATCH_SIZE);
        
        batch.forEach(id => {
          const success = window.SilentStacks.modules.DataManager.updateRequest(id, { priority: newPriority });
          if (success) updated++;
        });
        
        // Memory cleanup between batches
        if (batch.length === SAFETY_LIMITS.MAX_BATCH_SIZE) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Refresh UI
      window.SilentStacks.modules.RequestManager.refreshAllViews();
      
      window.SilentStacks.modules.UIController.showNotification(
        `✅ Updated ${updated}/${total} request${updated !== 1 ? 's' : ''} to ${newPriority} priority`,
        'success'
      );
      
      return updated;
    } catch (error) {
      console.error('Bulk priority update error:', error);
      throw error;
    }
  }

  // === Enhanced CSV Export with DOCLINE ===
  async function exportCSV() {
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    
    if (requests.length === 0) {
      window.SilentStacks.modules.UIController.showNotification('No requests to export', 'warning');
      return;
    }
    
    try {
      if (requests.length > 5000) {
        if (!confirm(`Large export detected (${requests.length} requests).\n\nContinue?`)) {
          return;
        }
      }

      // Enhanced headers including DOCLINE
      const headers = [
        'PMID', 'DOI', 'Title', 'Authors', 'Journal', 'Year', 
        'Status', 'Priority', 'Tags', 'Notes', 'Patron Email', 
        'DOCLINE', 'Created', 'Updated'
      ];
      
      let csvContent = headers.join(',') + '\n';
      
      // Process in chunks for large exports
      const chunkSize = 1000;
      for (let i = 0; i < requests.length; i += chunkSize) {
        const chunk = requests.slice(i, i + chunkSize);
        
        const chunkRows = chunk.map(r => [
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
          r.docline || '', // DOCLINE support
          r.createdAt || '',
          r.updatedAt || r.createdAt || ''
        ]);
        
        csvContent += chunkRows
          .map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))
          .join('\n') + '\n';
        
        // Memory check for large exports
        if (performance.memory && performance.memory.usedJSHeapSize / 1024 / 1024 > SAFETY_LIMITS.MAX_MEMORY_USAGE) {
          console.warn('⚠️ High memory usage during export, taking break...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `silentstacks-requests-${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadFile(blob, filename);
      
      window.SilentStacks.modules.UIController.showNotification(
        `✅ Exported ${requests.length} requests to ${filename}`, 
        'success'
      );
      
    } catch (error) {
      console.error('CSV export error:', error);
      window.SilentStacks.modules.UIController.showNotification(
        `Failed to export CSV: ${error.message}`, 
        'error'
      );
    }
  }

  // === Enhanced CSV Row Mapping with DOCLINE ===
  function mapCSVRowToRequest(row) {
    // Handle different case variations for all fields
    const getValue = (keys) => {
      for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null) {
          return String(row[key]).trim();
        }
      }
      return '';
    };

    return {
      pmid: getValue(['pmid', 'PMID', 'Pmid', 'PmId']),
      doi: getValue(['doi', 'DOI', 'Doi', 'DoI']),
      title: getValue(['title', 'Title', 'TITLE', 'publication_title', 'Publication Title']),
      authors: getValue(['authors', 'Authors', 'AUTHORS', 'author', 'Author']),
      journal: getValue(['journal', 'Journal', 'JOURNAL', 'source', 'Source']),
      year: getValue(['year', 'Year', 'YEAR', 'publication_year', 'Publication Year']),
      priority: validatePriority(getValue(['priority', 'Priority', 'PRIORITY']).toLowerCase() || 'normal'),
      status: validateStatus(getValue(['status', 'Status', 'STATUS']).toLowerCase() || 'pending'),
      patronEmail: getValue(['patronEmail', 'PatronEmail', 'patron_email', 'Patron Email', 'patron-email', 'email', 'Email']),
      docline: getValue(['docline', 'Docline', 'DOCLINE', 'docline_number', 'DOCLINE_NUMBER', 'request_number', 'Request Number']),
      notes: getValue(['notes', 'Notes', 'NOTES', 'note', 'Note', 'comments', 'Comments']),
      tags: parseTagsFromString(getValue(['tags', 'Tags', 'TAGS', 'keywords', 'Keywords'])),
      createdAt: getValue(['createdAt', 'Created', 'created', 'date_created', 'Date Created']) || new Date().toISOString()
    };
  }

  // === Utility Functions ===
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  }

  function validatePriority(priority) {
    const validPriorities = ['urgent', 'rush', 'normal', 'low'];
    return validPriorities.includes(priority) ? priority : 'normal';
  }

  function validateStatus(status) {
    const validStatuses = ['pending', 'in-progress', 'fulfilled', 'cancelled', 'on-hold'];
    return validStatuses.includes(status) ? status : 'pending';
  }

  function parseTagsFromString(tagString) {
    if (!tagString || typeof tagString !== 'string') return [];
    return tagString.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
  }

  function showImportStatus(message, type) {
    const importStatus = document.getElementById('import-status');
    if (importStatus) {
      importStatus.textContent = message;
      importStatus.className = `import-status ${type}`;
      importStatus.style.display = 'block';
      
      // Auto-hide success messages after 10 seconds
      if (type === 'success') {
        setTimeout(() => {
          importStatus.style.display = 'none';
        }, 10000);
      }
    }
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function checkMemoryBetweenChunks() {
    if (performance.memory) {
      const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
      
      if (memoryMB > SAFETY_LIMITS.MAX_MEMORY_USAGE) {
        console.log('🧹 High memory usage detected, performing cleanup...');
        
        if (window.SilentStacks.modules.DataManager.performMemoryCleanup) {
          window.SilentStacks.modules.DataManager.performMemoryCleanup();
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // === Module Interface ===
  const EnhancedBulkOperations = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing Enhanced BulkOperations v1.3.0...');
      
      // Set up file input handlers
      const importFile = document.getElementById('import-file');
      if (importFile) {
        importFile.addEventListener('change', handleImport);
      }

      // Set up bulk paste handler
      const bulkPasteBtn = document.getElementById('bulk-paste-btn');
      if (bulkPasteBtn) {
        bulkPasteBtn.addEventListener('click', handleBulkPasteWithLookup);
      }

      // Set up export handlers
      const exportCSVBtn = document.getElementById('export-csv');
      if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportCSV);
      }
      
      console.log('✅ Enhanced BulkOperations initialized with PMID auto-fetch and DOCLINE support');
    },

    // Core functions
    handleImport,
    processImportWithAPILookup,
    enrichRequestWithAPI,
    handleBulkPasteWithLookup,
    exportCSV,
    
    // Bulk update functions (new)
    bulkUpdateStatus,
    bulkUpdatePriority,

    // Utility functions
    mapCSVRowToRequest,
    validatePriority,
    validateStatus,
    parseTagsFromString,
    downloadFile,
    checkMemoryBetweenChunks,

    // Configuration
    SAFETY_LIMITS
  };

  // Register with SilentStacks
  if (!window.SilentStacks) {
    window.SilentStacks = { modules: {} };
  }
  if (!window.SilentStacks.modules) {
    window.SilentStacks.modules = {};
  }

  window.SilentStacks.modules.BulkOperations = EnhancedBulkOperations;
  
  console.log('✅ Enhanced BulkOperations v1.3.0 registered successfully');

})();
