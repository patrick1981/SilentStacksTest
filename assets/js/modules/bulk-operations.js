// SilentStacks Bulk Operations Module - v1.2.1 FIXED VERSION
// Enhanced with safety limits, memory management, and progress tracking

(() => {
  'use strict';

  // === Safety Configuration ===
  const SAFETY_LIMITS = {
    MAX_IMPORT_SIZE: 2000,
    CHUNK_SIZE: 100,
    PROGRESS_UPDATE_INTERVAL: 250,
    MAX_CONCURRENT_API_CALLS: 5,
    API_DELAY_BETWEEN_CALLS: 200,
    MEMORY_CHECK_INTERVAL: 50,
    MAX_MEMORY_USAGE: 400 // MB
  };

  // === Enhanced Import/Export Functions ===
  function exportCSV() {
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    
    if (requests.length === 0) {
      window.SilentStacks.modules.UIController.showNotification('No requests to export', 'warning');
      return;
    }
    
    try {
      // Check if large export
      if (requests.length > 5000) {
        if (!confirm(`Large export detected (${requests.length} requests).\n\nThis may take a while. Continue?`)) {
          return;
        }
      }

      const headers = ['PMID', 'DOI', 'Title', 'Authors', 'Journal', 'Year', 'Status', 'Priority', 'Tags', 'Notes', 'Patron Email', 'Docline', 'Created'];
      
      // Process in chunks for large exports
      const chunkSize = 1000;
      let csvContent = headers.join(',') + '\n';
      
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
          r.docline || '',
          r.createdAt || ''
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

  function exportJSON() {
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    
    if (requests.length === 0) {
      window.SilentStacks.modules.UIController.showNotification('No requests to export', 'warning');
      return;
    }
    
    try {
      // Check if large export
      if (requests.length > 5000) {
        if (!confirm(`Large export detected (${requests.length} requests).\n\nThis may take a while. Continue?`)) {
          return;
        }
      }

      const exportData = {
        version: window.SilentStacks.version || '1.2.1',
        exportDate: new Date().toISOString(),
        totalRequests: requests.length,
        performanceInfo: window.SilentStacks.modules.DataManager.getPerformanceStats?.() || {},
        requests: requests
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const filename = `silentstacks-requests-${new Date().toISOString().split('T')[0]}.json`;
      
      downloadFile(blob, filename);
      
      window.SilentStacks.modules.UIController.showNotification(
        `✅ Exported ${requests.length} requests to ${filename}`, 
        'success'
      );
      
    } catch (error) {
      console.error('JSON export error:', error);
      window.SilentStacks.modules.UIController.showNotification(
        `Failed to export JSON: ${error.message}`, 
        'error'
      );
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
      
      // Clean up URL after download
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Download failed:', error);
      throw new Error('Failed to download file');
    }
  }

  // === Enhanced Import Functions ===
  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // File size validation
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      window.SilentStacks.modules.UIController.showNotification(
        `File too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size: 50MB`,
        'error'
      );
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        processImportedData(e.target.result, file.name, file.size);
      } catch (error) {
        console.error('Import error:', error);
        showImportStatus(`❌ Import failed: ${error.message}`, 'error');
      }
    };
    
    reader.onerror = () => {
      showImportStatus('❌ Failed to read file', 'error');
    };
    
    showImportStatus('📖 Reading file...', 'loading');
    reader.readAsText(file);
  }

  async function processImportedData(data, filename, fileSize) {
    let importedData = [];
    
    try {
      showImportStatus('📊 Processing data...', 'loading');
      
      if (filename.endsWith('.json')) {
        const parsed = JSON.parse(data);
        importedData = Array.isArray(parsed) ? parsed : (parsed.requests || []);
      } else if (filename.endsWith('.csv')) {
        if (!window.Papa) {
          throw new Error('CSV parsing library not available');
        }
        
        const results = Papa.parse(data, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          delimitersToGuess: [',', '\t', '|', ';']
        });
        
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        
        importedData = results.data.map(row => mapCSVRowToRequest(row));
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON files.');
      }
      
      // Validate import size
      if (importedData.length > SAFETY_LIMITS.MAX_IMPORT_SIZE) {
        const proceed = confirm(
          `⚠️ Large import detected (${importedData.length} items).\n\n` +
          `Recommended maximum: ${SAFETY_LIMITS.MAX_IMPORT_SIZE} items.\n\n` +
          `Large imports may cause performance issues.\n\n` +
          `Continue anyway?`
        );
        
        if (!proceed) {
          showImportStatus('❌ Import cancelled by user', 'error');
          return;
        }
        
        // Offer to split import
        if (importedData.length > SAFETY_LIMITS.MAX_IMPORT_SIZE * 2) {
          if (confirm('Split into smaller chunks for better performance?')) {
            await processChunkedImport(importedData, filename);
            return;
          }
        }
      }
      
      // Filter out invalid requests
      const validRequests = importedData.filter(req => 
        req && (req.title || req.pmid || req.doi)
      );
      
      if (validRequests.length === 0) {
        throw new Error('No valid requests found in file. Ensure you have Title, PMID, or DOI columns.');
      }
      
      showImportStatus(`📥 Importing ${validRequests.length} requests...`, 'loading');
      
      // Process valid requests with memory monitoring
      const addedCount = await safeImport(validRequests);
      
      // Update global tags from imported requests
      validRequests.forEach(req => {
        if (req.tags && req.tags.length > 0) {
          window.SilentStacks.modules.DataManager.addTagsFromRequest(req.tags);
        }
      });
      
      // Refresh UI
      window.SilentStacks.modules.RequestManager.refreshAllViews();
      
      // Clear file input
      event.target.value = '';
      
      showImportStatus(
        `✅ Successfully imported ${addedCount} requests from ${filename}`, 
        'success'
      );
      
      window.SilentStacks.modules.UIController.showNotification(
        `Import complete! Added ${addedCount} requests.`, 
        'success'
      );
      
      // Cleanup after import
      if (addedCount > 100) {
        setTimeout(() => {
          window.SilentStacks.modules.DataManager.performMemoryCleanup?.();
        }, 1000);
      }
      
    } catch (error) {
      throw new Error(`Failed to process ${filename}: ${error.message}`);
    }
  }

  async function processChunkedImport(data, filename) {
    const chunks = [];
    const chunkSize = SAFETY_LIMITS.CHUNK_SIZE;
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    showImportStatus(`📦 Processing ${chunks.length} chunks...`, 'loading');
    
    let totalAdded = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      showImportStatus(
        `📦 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} items)...`,
        'loading'
      );
      
      const validChunk = chunk.filter(req => req && (req.title || req.pmid || req.doi));
      const addedCount = await safeImport(validChunk);
      totalAdded += addedCount;
      
      // Memory check between chunks
      await checkMemoryBetweenChunks();
      
      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final cleanup and UI refresh
    window.SilentStacks.modules.RequestManager.refreshAllViews();
    
    showImportStatus(
      `✅ Chunked import complete! Added ${totalAdded} requests from ${filename}`,
      'success'
    );
    
    window.SilentStacks.modules.UIController.showNotification(
      `Chunked import complete! Added ${totalAdded} requests.`,
      'success'
    );
  }

  async function safeImport(validRequests) {
    try {
      return window.SilentStacks.modules.DataManager.bulkAddRequests(validRequests);
    } catch (error) {
      console.error('Safe import failed:', error);
      throw error;
    }
  }

  async function checkMemoryBetweenChunks() {
    if (performance.memory) {
      const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
      
      if (memoryMB > SAFETY_LIMITS.MAX_MEMORY_USAGE) {
        console.log('🧹 High memory usage detected, performing cleanup...');
        
        if (window.SilentStacks.modules.DataManager.performMemoryCleanup) {
          window.SilentStacks.modules.DataManager.performMemoryCleanup();
        }
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  function mapCSVRowToRequest(row) {
    return {
      pmid: String(row.pmid || row.PMID || row.Pmid || '').trim(),
      doi: String(row.doi || row.DOI || row.Doi || '').trim(),
      title: String(row.title || row.Title || row.TITLE || '').trim(),
      authors: String(row.authors || row.Authors || row.AUTHORS || '').trim(),
      journal: String(row.journal || row.Journal || row.JOURNAL || '').trim(),
      year: String(row.year || row.Year || row.YEAR || '').trim(),
      priority: validatePriority(String(row.priority || row.Priority || row.PRIORITY || 'normal').toLowerCase().trim()),
      status: validateStatus(String(row.status || row.Status || row.STATUS || 'pending').toLowerCase().trim()),
      patronEmail: String(row.patronEmail || row.PatronEmail || row['patron-email'] || row['Patron Email'] || '').trim(),
      docline: String(row.docline || row.Docline || row.DOCLINE || '').trim(),
      notes: String(row.notes || row.Notes || row.NOTES || '').trim(),
      tags: parseTagsFromString(String(row.tags || row.Tags || row.TAGS || '')),
      createdAt: row.createdAt || row.Created || row.created || new Date().toISOString()
    };
  }

  function validatePriority(priority) {
    const validPriorities = ['urgent', 'rush', 'normal'];
    return validPriorities.includes(priority) ? priority : 'normal';
  }

  function validateStatus(status) {
    const validStatuses = ['pending', 'in-progress', 'fulfilled', 'cancelled'];
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

  // === Enhanced Bulk Paste with API Lookups ===
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
    
    // Remove any existing progress indicators
    const existingProgress = document.getElementById('bulk-import-progress');
    if (existingProgress) {
      existingProgress.remove();
    }
    
    // Create progress indicator
    const progressDiv = window.SilentStacks.modules.UIController.createProgressIndicator(
      'bulk-import-progress', 
      textarea.parentNode
    );
    
    try {
      window.SilentStacks.modules.UIController.updateProgress(
        progressDiv, 5, 'Parsing pasted data...'
      );
      
      // Parse the data
      if (!window.Papa) {
        throw new Error('CSV parsing library not available');
      }
      
      const results = Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimitersToGuess: [',', '\t', '|', ';']
      });
      
      if (!results.data || results.data.length === 0) {
        throw new Error('No valid data found. Check your CSV format and headers.');
      }
      
      // Validate size before processing
      if (results.data.length > SAFETY_LIMITS.MAX_IMPORT_SIZE) {
        const proceed = confirm(
          `⚠️ Large paste detected (${results.data.length} rows).\n\n` +
          `Recommended maximum: ${SAFETY_LIMITS.MAX_IMPORT_SIZE} items.\n\n` +
          `This may cause performance issues. Continue?`
        );
        
        if (!proceed) {
          progressDiv.remove();
          return;
        }
      }
      
      window.SilentStacks.modules.UIController.updateProgress(
        progressDiv, 10, `Found ${results.data.length} rows to process...`
      );
      
      const importedRequests = [];
      const total = results.data.length;
      const maxConcurrent = SAFETY_LIMITS.MAX_CONCURRENT_API_CALLS;
      let processed = 0;
      
      // Process in controlled batches to prevent API overload
      for (let i = 0; i < total; i += maxConcurrent) {
        const batch = results.data.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(async (row, batchIndex) => {
          const globalIndex = i + batchIndex;
          processed++;
          
          const baseProgress = 10 + ((processed / total) * 80); // 10-90% range
          window.SilentStacks.modules.UIController.updateProgress(
            progressDiv, baseProgress, `Processing row ${processed} of ${total}...`
          );
          
          return await processRowWithAPILookup(row, globalIndex, total, progressDiv);
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Collect successful results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            importedRequests.push(result.value);
          }
        });
        
        // Memory check between batches
        await checkMemoryBetweenChunks();
        
        // Rate limiting delay between batches
        if (i + maxConcurrent < total) {
          await new Promise(resolve => setTimeout(resolve, SAFETY_LIMITS.API_DELAY_BETWEEN_CALLS));
        }
      }
      
      window.SilentStacks.modules.UIController.updateProgress(
        progressDiv, 90, 'Saving imported requests...'
      );
      
      if (importedRequests.length > 0) {
        const addedCount = await safeImport(importedRequests);
        
        // Update global tags
        importedRequests.forEach(req => {
          if (req.tags && req.tags.length > 0) {
            window.SilentStacks.modules.DataManager.addTagsFromRequest(req.tags);
          }
        });
        
        // Refresh UI
        window.SilentStacks.modules.RequestManager.refreshAllViews();
        
        // Clear textarea
        textarea.value = '';
        
        window.SilentStacks.modules.UIController.updateProgress(
          progressDiv, 100, `✅ Successfully imported ${addedCount} requests!`
        );
        
        // Auto-remove progress after 5 seconds
        setTimeout(() => {
          if (progressDiv.parentNode) {
            progressDiv.remove();
          }
        }, 5000);
        
        // Show success notification
        setTimeout(() => {
          window.SilentStacks.modules.UIController.showNotification(
            `Bulk import complete! Added ${addedCount} requests with API lookups.`,
            'success'
          );
        }, 500);
        
        // Cleanup after large import
        if (addedCount > 100) {
          setTimeout(() => {
            window.SilentStacks.modules.DataManager.performMemoryCleanup?.();
          }, 2000);
        }
        
      } else {
        throw new Error(`No valid requests found in ${total} rows. Please check your data format.`);
      }
      
    } catch (error) {
      console.error('Bulk paste error:', error);
      window.SilentStacks.modules.UIController.updateProgress(
        progressDiv, 0, `❌ Error: ${error.message}`, true
      );
      
      // Auto-remove progress after 10 seconds on error
      setTimeout(() => {
        if (progressDiv.parentNode) {
          progressDiv.remove();
        }
      }, 10000);
      
      window.SilentStacks.modules.UIController.showNotification(
        `Bulk import failed: ${error.message}`,
        'error'
      );
    }
  }

  async function processRowWithAPILookup(row, index, total, progressDiv) {
    try {
      // Build request data
      let requestData = mapCSVRowToRequest(row);
      
      // Try to fetch metadata if we have PMID or DOI but missing other data
      const needsMetadata = !requestData.title || !requestData.authors || !requestData.journal;
      
      if (needsMetadata && (requestData.pmid || requestData.doi)) {
        try {
          let metadata = null;
          
          if (requestData.pmid && window.SilentStacks.modules.APIIntegration) {
            window.SilentStacks.modules.UIController.updateProgress(
              progressDiv, 
              10 + ((index / total) * 80), 
              `Fetching PMID ${requestData.pmid}... (${index + 1}/${total})`
            );
            
            metadata = await window.SilentStacks.modules.APIIntegration.fetchPubMed(requestData.pmid);
            
          } else if (requestData.doi && window.SilentStacks.modules.APIIntegration) {
            window.SilentStacks.modules.UIController.updateProgress(
              progressDiv, 
              10 + ((index / total) * 80), 
              `Fetching DOI ${requestData.doi}... (${index + 1}/${total})`
            );
            
            metadata = await window.SilentStacks.modules.APIIntegration.fetchCrossRef(requestData.doi);
          }
          
          if (metadata) {
            // Merge fetched metadata with existing data (existing data takes precedence)
            requestData = {
              ...metadata,
              ...Object.fromEntries(Object.entries(requestData).filter(([_, v]) => v !== ''))
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch metadata for row ${index + 1}:`, error);
          // Continue with the data we have
        }
      }
      
      // Only return if we have at least a title or identifier
      if (requestData.title || requestData.pmid || requestData.doi) {
        return requestData;
      } else {
        console.warn(`Skipping row ${index + 1}: No title or identifier found`);
        return null;
      }
    } catch (error) {
      console.warn(`Error processing row ${index + 1}:`, error);
      return null;
    }
  }

  // === Enhanced Batch Operations ===
  function batchUpdateStatus(requestIndices, newStatus) {
    try {
      let updated = 0;
      
      requestIndices.forEach(index => {
        try {
          window.SilentStacks.modules.DataManager.updateRequest(index, { status: newStatus });
          updated++;
        } catch (error) {
          console.warn(`Failed to update request ${index}:`, error);
        }
      });
      
      if (updated > 0) {
        window.SilentStacks.modules.RequestManager.refreshAllViews();
        window.SilentStacks.modules.UIController.showNotification(
          `Updated ${updated} request${updated > 1 ? 's' : ''} to ${newStatus}`,
          'success'
        );
        
        // Cleanup after large batch operations
        if (updated > 50) {
          setTimeout(() => {
            window.SilentStacks.modules.DataManager.performMemoryCleanup?.();
          }, 1000);
        }
      }
      
      return updated;
    } catch (error) {
      console.error('Batch status update error:', error);
      window.SilentStacks.modules.UIController.showNotification(
        'Failed to update request statuses',
        'error'
      );
      return 0;
    }
  }

  function batchUpdatePriority(requestIndices, newPriority) {
    try {
      let updated = 0;
      
      requestIndices.forEach(index => {
        try {
          window.SilentStacks.modules.DataManager.updateRequest(index, { priority: newPriority });
          updated++;
        } catch (error) {
          console.warn(`Failed to update request ${index}:`, error);
        }
      });
      
      if (updated > 0) {
        window.SilentStacks.modules.RequestManager.refreshAllViews();
        window.SilentStacks.modules.UIController.showNotification(
          `Updated ${updated} request${updated > 1 ? 's' : ''} to ${newPriority} priority`,
          'success'
        );
        
        // Cleanup after large batch operations
        if (updated > 50) {
          setTimeout(() => {
            window.SilentStacks.modules.DataManager.performMemoryCleanup?.();
          }, 1000);
        }
      }
      
      return updated;
    } catch (error) {
      console.error('Batch priority update error:', error);
      window.SilentStacks.modules.UIController.showNotification(
        'Failed to update request priorities',
        'error'
      );
      return 0;
    }
  }

  // === Module Interface ===
  const BulkOperations = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing FIXED BulkOperations v1.2.1...');
      
      // Set up file input handlers
      const importFile = document.getElementById('import-file');
      if (importFile) {
        importFile.addEventListener('change', handleImport);
      }
      
      console.log('✅ FIXED BulkOperations initialized');
    },

    // Export functions
    exportCSV,
    exportJSON,

    // Import functions
    handleImport,
    processImportedData,
    processChunkedImport,
    safeImport,

    // Bulk paste
    handleBulkPasteWithLookup,
    processRowWithAPILookup,

    // Batch operations
    batchUpdateStatus,
    batchUpdatePriority,

    // Utility functions
    mapCSVRowToRequest,
    validatePriority,
    validateStatus,
    parseTagsFromString,
    downloadFile,
    checkMemoryBetweenChunks,

    // Safety limits
    SAFETY_LIMITS
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('BulkOperations', BulkOperations);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.BulkOperations = BulkOperations;
  }

  console.log('✅ FIXED BulkOperations registered successfully');
})();
