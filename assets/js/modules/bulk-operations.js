// SilentStacks Bulk Operations Module
// Handles import/export, bulk paste with API lookups, and batch operations
(() => {
  'use strict';

  // === Import/Export Functions ===
  function exportCSV() {
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    
    if (requests.length === 0) {
      window.SilentStacks.modules.UIController.showNotification('No requests to export', 'warning');
      return;
    }
    
    try {
      const headers = ['PMID', 'DOI', 'Title', 'Authors', 'Journal', 'Year', 'Status', 'Priority', 'Tags', 'Notes', 'Patron Email', 'Docline', 'Created'];
      
      const rows = requests.map(r => [
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
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `silentstacks-requests-${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadFile(blob, filename);
      
      window.SilentStacks.modules.UIController.showNotification(
        `✅ Exported ${requests.length} requests to ${filename}`, 
        'success'
      );
      
    } catch (error) {
      console.error('CSV export error:', error);
      window.SilentStacks.modules.UIController.showNotification('Failed to export CSV', 'error');
    }
  }

  function exportJSON() {
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    
    if (requests.length === 0) {
      window.SilentStacks.modules.UIController.showNotification('No requests to export', 'warning');
      return;
    }
    
    try {
      const exportData = {
        version: window.SilentStacks.version,
        exportDate: new Date().toISOString(),
        totalRequests: requests.length,
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
      window.SilentStacks.modules.UIController.showNotification('Failed to export JSON', 'error');
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

  // === Import Functions ===
  function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        processImportedData(e.target.result, file.name);
      } catch (error) {
        console.error('Import error:', error);
        showImportStatus(`❌ Import failed: ${error.message}`, 'error');
      }
    };
    
    reader.readAsText(file);
  }

  function processImportedData(data, filename) {
    let importedData = [];
    
    try {
      if (filename.endsWith('.json')) {
        const parsed = JSON.parse(data);
        // Handle both direct array and wrapped format
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
      
      // Filter out invalid requests
      const validRequests = importedData.filter(req => 
        req && (req.title || req.pmid || req.doi)
      );
      
      if (validRequests.length === 0) {
        throw new Error('No valid requests found in file. Ensure you have Title, PMID, or DOI columns.');
      }
      
      // Process valid requests
      const addedCount = window.SilentStacks.modules.DataManager.bulkAddRequests(validRequests);
      
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
      
    } catch (error) {
      throw new Error(`Failed to process ${filename}: ${error.message}`);
    }
  }

  function mapCSVRowToRequest(row) {
    // Flexible mapping to handle various CSV formats
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
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        importStatus.style.display = 'none';
      }, 10000);
    }
  }

  // === Bulk Paste with API Lookups ===
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
      
      window.SilentStacks.modules.UIController.updateProgress(
        progressDiv, 10, `Found ${results.data.length} rows to process...`
      );
      
      const importedRequests = [];
      const total = results.data.length;
      let processed = 0;
      
      // Process each row with API lookups
      for (let i = 0; i < results.data.length; i++) {
        const row = results.data[i];
        processed++;
        
        const baseProgress = 10 + ((processed / total) * 80); // 10-90% range
        window.SilentStacks.modules.UIController.updateProgress(
          progressDiv, baseProgress, `Processing row ${processed} of ${total}...`
        );
        
        // Build request data
        let requestData = mapCSVRowToRequest(row);
        
        // Try to fetch metadata if we have PMID or DOI but missing other data
        const needsMetadata = !requestData.title || !requestData.authors || !requestData.journal;
        
        if (needsMetadata && (requestData.pmid || requestData.doi)) {
          try {
            let metadata = null;
            
            if (requestData.pmid) {
              window.SilentStacks.modules.UIController.updateProgress(
                progressDiv, baseProgress, `Fetching PMID ${requestData.pmid}... (${processed}/${total})`
              );
              metadata = await window.SilentStacks.modules.APIIntegration.fetchPubMed(requestData.pmid);
              
              // Small delay to be API-friendly
              await new Promise(resolve => setTimeout(resolve, 200));
            } else if (requestData.doi) {
              window.SilentStacks.modules.UIController.updateProgress(
                progressDiv, baseProgress, `Fetching DOI ${requestData.doi}... (${processed}/${total})`
              );
              metadata = await window.SilentStacks.modules.APIIntegration.fetchCrossRef(requestData.doi);
              
              // Small delay to be API-friendly
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            if (metadata) {
              // Merge fetched metadata with existing data (existing data takes precedence)
              requestData = {
                ...metadata,
                ...Object.fromEntries(Object.entries(requestData).filter(([_, v]) => v !== ''))
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch metadata for row ${i + 1}:`, error);
            // Continue with the data we have
          }
        }
        
        // Only add if we have at least a title or identifier
        if (requestData.title || requestData.pmid || requestData.doi) {
          importedRequests.push(requestData);
        } else {
          console.warn(`Skipping row ${i + 1}: No title or identifier found`);
        }
      }
      
      window.SilentStacks.modules.UIController.updateProgress(
        progressDiv, 90, 'Saving imported requests...'
      );
      
      if (importedRequests.length > 0) {
        const addedCount = window.SilentStacks.modules.DataManager.bulkAddRequests(importedRequests);
        
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

  // === Batch Operations ===
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
      console.log('🔧 Initializing BulkOperations...');
      
      // Set up file input handlers
      const importFile = document.getElementById('import-file');
      if (importFile) {
        importFile.addEventListener('change', handleImport);
      }
      
      console.log('✅ BulkOperations initialized');
    },

    // Export functions
    exportCSV,
    exportJSON,

    // Import functions
    handleImport,
    processImportedData,

    // Bulk paste
    handleBulkPasteWithLookup,

    // Batch operations
    batchUpdateStatus,
    batchUpdatePriority,

    // Utility functions
    mapCSVRowToRequest,
    validatePriority,
    validateStatus,
    parseTagsFromString,
    downloadFile
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('BulkOperations', BulkOperations);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.BulkOperations = BulkOperations;
  }
})();
