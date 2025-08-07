// assets/js/modules/bulk-operations.js
// SilentStacks Bulk Operations Module v1.5 - COMPLETE FIXED VERSION
// All console errors resolved, proper element IDs, complete functionality

(() => {
  'use strict';

  // Prevent multiple loading
  if (window.SilentStacks?.modules?.BulkOperations?.initialized) {
    console.log('📦 Bulk Operations already loaded, skipping...');
    return;
  }

  let selectedRequestIds = new Set();
  let isProcessing = false;

  const CompleteBulkOperations = {
    initialized: false,

    // Initialize bulk operations
    initialize() {
      if (this.initialized) return;
      
      console.log('🔧 Initializing COMPLETE Bulk Operations v1.5...');
      
      try {
        this.setupEventListeners();
        this.setupSelectionTracking();
        this.setupExportHandlers();
        this.initialized = true;
        
        console.log('✅ COMPLETE Bulk Operations v1.5 initialized successfully');
        
      } catch (error) {
        console.error('❌ Bulk Operations initialization failed:', error);
      }
    },

    // Set up event listeners with correct element IDs
    setupEventListeners() {
      // PMID Batch Processing
      const pmidBatchBtn = document.getElementById('bulk-paste-btn');
      if (pmidBatchBtn) {
        pmidBatchBtn.addEventListener('click', () => this.processPMIDBatch());
        console.log('✅ PMID batch handler attached to bulk-paste-btn');
      } else {
        console.warn('⚠️ bulk-paste-btn element not found');
      }

      // CSV File Upload
      const csvUploadBtn = document.getElementById('upload-csv-btn');
      const csvFileInput = document.getElementById('import-file');
      
      if (csvUploadBtn) {
        csvUploadBtn.addEventListener('click', () => this.uploadCSV());
        console.log('✅ CSV upload button handler attached to upload-csv-btn');
      } else {
        console.warn('⚠️ upload-csv-btn element not found');
      }
      
      if (csvFileInput) {
        csvFileInput.addEventListener('change', (e) => {
          if (e.target.files[0]) {
            this.uploadCSV();
          }
        });
        console.log('✅ CSV file input handler attached to import-file');
      } else {
        console.warn('⚠️ import-file element not found');
      }

      // Bulk Status Update
      const bulkStatusBtn = document.getElementById('bulk-update-status');
      if (bulkStatusBtn) {
        bulkStatusBtn.addEventListener('click', () => this.updateBulkStatus());
        console.log('✅ Bulk status update handler attached to bulk-update-status');
      } else {
        console.warn('⚠️ bulk-update-status element not found');
      }

      // Bulk Priority Update
      const bulkPriorityBtn = document.getElementById('bulk-update-priority');
      if (bulkPriorityBtn) {
        bulkPriorityBtn.addEventListener('click', () => this.updateBulkPriority());
        console.log('✅ Bulk priority update handler attached to bulk-update-priority');
      } else {
        console.warn('⚠️ bulk-update-priority element not found');
      }
    },

    // Set up selection tracking
    setupSelectionTracking() {
      console.log('🔧 Setting up selection tracking...');
      
      // Listen for checkbox changes
      document.addEventListener('change', (e) => {
        if (e.target.classList.contains('request-checkbox')) {
          const requestId = e.target.dataset.requestId;
          
          if (e.target.checked) {
            selectedRequestIds.add(requestId);
          } else {
            selectedRequestIds.delete(requestId);
          }
          
          this.updateBulkSelectionDisplay();
          this.updateBulkUpdateButtons();
        }
      });

      // Listen for "select all" changes
      document.addEventListener('change', (e) => {
        if (e.target.id === 'select-all') {
          const checkboxes = document.querySelectorAll('.request-checkbox');
          checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
            const requestId = checkbox.dataset.requestId;
            
            if (e.target.checked) {
              selectedRequestIds.add(requestId);
            } else {
              selectedRequestIds.delete(requestId);
            }
          });
          
          this.updateBulkSelectionDisplay();
          this.updateBulkUpdateButtons();
        }
      });
    },

    // Set up export handlers
    setupExportHandlers() {
      const exportCSVBtn = document.getElementById('export-csv');
      const exportJSONBtn = document.getElementById('export-json');
      
      if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', () => this.exportCSV());
        console.log('✅ CSV export handler attached to export-csv');
      } else {
        console.warn('⚠️ export-csv element not found');
      }
      
      if (exportJSONBtn) {
        exportJSONBtn.addEventListener('click', () => this.exportJSON());
        console.log('✅ JSON export handler attached to export-json');
      } else {
        console.warn('⚠️ export-json element not found');
      }
    },

    // ENHANCED: Process PMID batch with clinical trials support
    async processPMIDBatch() {
      const textarea = document.getElementById('bulk-paste-textarea');
      const statusDiv = document.getElementById('bulk-paste-status');
      const autoFetch = document.getElementById('bulk-paste-auto-fetch')?.checked ?? true;
      const fetchTrials = document.getElementById('bulk-paste-fetch-trials')?.checked ?? true;
      
      if (!textarea || !statusDiv) {
        console.error('❌ Required elements not found: bulk-paste-textarea or bulk-paste-status');
        return;
      }

      const input = textarea.value.trim();
      if (!input) {
        this.showStatus(statusDiv, '❌ Please enter PMID data', 'error');
        return;
      }

      if (isProcessing) {
        this.showStatus(statusDiv, '⏳ Processing already in progress...', 'warning');
        return;
      }

      isProcessing = true;
      this.showStatus(statusDiv, '🚀 Processing PMID batch...', 'loading');

      try {
        // Parse input data
        const entries = this.parsePMIDInput(input);
        
        if (entries.length === 0) {
          throw new Error('No valid PMID entries found');
        }

        this.showStatus(statusDiv, `📝 Processing ${entries.length} entries...`, 'loading');

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process each entry
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          
          try {
            this.showStatus(statusDiv, 
              `⏳ Processing ${i + 1}/${entries.length}: PMID ${entry.pmid}...`, 
              'loading'
            );

            let metadata = null;
            
            if (autoFetch && entry.pmid) {
              // Get API integration module
              const apiModule = window.SilentStacks?.modules?.APIIntegration;
              if (apiModule && apiModule.fetchPubMedMetadata) {
                try {
                  metadata = await apiModule.fetchPubMedMetadata(
                    entry.pmid, 
                    fetchTrials, 
                    true // includeMeSH
                  );
                  console.log(`✅ Fetched metadata for PMID ${entry.pmid}`);
                } catch (apiError) {
                  console.warn(`⚠️ API fetch failed for PMID ${entry.pmid}:`, apiError);
                  // Continue with manual data
                }
              }
            }

            // Create request data
            const requestData = this.createRequestFromEntry(entry, metadata);
            
            // Add to data manager
            const dataManager = window.SilentStacks?.modules?.DataManager;
            if (dataManager && dataManager.addRequest) {
              dataManager.addRequest(requestData);
              successCount++;
              console.log(`✅ Added request for PMID ${entry.pmid}`);
            } else {
              throw new Error('DataManager not available');
            }

            // Small delay to prevent API rate limiting
            if (autoFetch && i < entries.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 400));
            }

          } catch (entryError) {
            console.error(`❌ Failed to process entry ${i + 1}:`, entryError);
            errors.push(`PMID ${entry.pmid}: ${entryError.message}`);
            errorCount++;
          }
        }

        // Show final results
        let resultMessage = `✅ Batch processing complete!\n`;
        resultMessage += `📊 Success: ${successCount}, Errors: ${errorCount}`;
        
        if (errors.length > 0) {
          resultMessage += `\n\n❌ Errors:\n${errors.join('\n')}`;
        }

        this.showStatus(statusDiv, resultMessage, successCount > 0 ? 'success' : 'error');

        // Clear textarea on success
        if (successCount > 0) {
          textarea.value = '';
          
          // Refresh UI
          const uiController = window.SilentStacks?.modules?.UIController;
          if (uiController && uiController.renderRequests) {
            uiController.renderRequests();
          }
        }

      } catch (error) {
        console.error('❌ Batch processing failed:', error);
        this.showStatus(statusDiv, `❌ Error: ${error.message}`, 'error');
      } finally {
        isProcessing = false;
      }
    },

    // Parse PMID input with enhanced format support
    parsePMIDInput(input) {
      const entries = [];
      const lines = input.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          // Try to parse as CSV first
          if (trimmed.includes(',')) {
            const parts = trimmed.split(',').map(p => p.trim());
            
            // Handle different CSV formats
            if (parts.length >= 2) {
              const pmid = this.extractPMID(parts[0]);
              const docline = parts[1] || '';
              const status = parts[2] || 'pending';
              const priority = parts[3] || 'normal';
              const patronEmail = parts[4] || '';
              const notes = parts[5] || '';

              if (pmid) {
                entries.push({
                  pmid,
                  docline,
                  status,
                  priority,
                  patronEmail,
                  notes
                });
              }
            }
          } else {
            // Single PMID per line
            const pmid = this.extractPMID(trimmed);
            if (pmid) {
              entries.push({
                pmid,
                docline: '',
                status: 'pending',
                priority: 'normal',
                patronEmail: '',
                notes: ''
              });
            }
          }
        } catch (parseError) {
          console.warn(`⚠️ Failed to parse line: ${trimmed}`, parseError);
        }
      }

      return entries;
    },

    // Extract PMID from input
    extractPMID(input) {
      if (!input) return null;
      
      // Remove common prefixes
      const cleaned = input.replace(/^(pmid:?|pubmed:?)\s*/i, '').trim();
      
      // Extract digits
      const match = cleaned.match(/^\d+/);
      return match ? match[0] : null;
    },

    // Create request from entry with metadata
    createRequestFromEntry(entry, metadata = null) {
      const now = new Date().toISOString();
      const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let requestData = {
        id,
        pmid: entry.pmid || '',
        docline: entry.docline || '',
        title: metadata?.title || '',
        authors: metadata?.authorsNLM || '',
        journal: metadata?.journal || '',
        year: metadata?.year || '',
        volume: metadata?.volume || '',
        issue: metadata?.issue || '',
        pages: metadata?.pages || '',
        doi: metadata?.doi || '',
        patronEmail: entry.patronEmail || '',
        priority: entry.priority || 'normal',
        status: entry.status || 'pending',
        tags: [],
        notes: entry.notes || '',
        createdAt: now,
        updatedAt: now,
        source: 'bulk_upload'
      };

      // Add enhanced metadata if available
      if (metadata) {
        requestData.meshHeadings = metadata.meshHeadings || [];
        requestData.publicationTypes = metadata.publicationTypes || [];
        requestData.abstract = metadata.abstract || '';
        requestData.isRandomizedControlledTrial = metadata.isRandomizedControlledTrial || false;
        requestData.isClinicalTrial = metadata.isClinicalTrial || false;
        requestData.clinicalTrials = metadata.clinicalTrials || [];
        requestData.nctNumbers = metadata.nctNumbers || [];
        
        // Add citation
        if (metadata.citationNLM) {
          requestData.citation = metadata.citationNLM;
        }
      }

      return requestData;
    },

    // Enhanced CSV upload
    async uploadCSV() {
      const fileInput = document.getElementById('import-file');
      const statusDiv = document.getElementById('import-status');
      
      if (!fileInput || !statusDiv) {
        console.error('❌ CSV upload elements not found');
        return;
      }

      const file = fileInput.files[0];
      if (!file) {
        this.showStatus(statusDiv, '❌ Please select a CSV file', 'error');
        return;
      }

      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.showStatus(statusDiv, '❌ Please select a valid CSV file', 'error');
        return;
      }

      if (isProcessing) {
        this.showStatus(statusDiv, '⏳ Processing already in progress...', 'warning');
        return;
      }

      isProcessing = true;
      this.showStatus(statusDiv, '📁 Reading CSV file...', 'loading');

      try {
        // Read file content
        const fileContent = await this.readFileAsText(file);
        
        // Process as PMID batch
        const textarea = document.getElementById('bulk-paste-textarea');
        if (textarea) {
          textarea.value = fileContent;
          await this.processPMIDBatch();
        } else {
          throw new Error('Bulk paste textarea not found');
        }
        
      } catch (error) {
        console.error('❌ CSV upload failed:', error);
        this.showStatus(statusDiv, `❌ Error: ${error.message}`, 'error');
      } finally {
        isProcessing = false;
      }
    },

    // File reader helper
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
      });
    },

    // Update bulk selection display
    updateBulkSelectionDisplay() {
      const display = document.getElementById('bulk-update-status-display');
      const selectedIds = this.getSelectedRequestIds();
      
      if (display) {
        if (selectedIds.length > 0) {
          display.textContent = `${selectedIds.length} request(s) selected for bulk operations`;
          display.className = 'bulk-status-display selected';
        } else {
          display.textContent = 'No requests selected';
          display.className = 'bulk-status-display';
        }
      }
    },

    // Update bulk update buttons
    updateBulkUpdateButtons() {
      const statusBtn = document.getElementById('bulk-update-status');
      const priorityBtn = document.getElementById('bulk-update-priority');
      const selectedCount = this.getSelectedRequestIds().length;
      
      const isDisabled = selectedCount === 0;
      
      if (statusBtn) {
        statusBtn.disabled = isDisabled;
      }
      
      if (priorityBtn) {
        priorityBtn.disabled = isDisabled;
      }
    },

    // Get selected request IDs
    getSelectedRequestIds() {
      const checkboxes = document.querySelectorAll('input[name="request-select"]:checked, .request-checkbox:checked');
      const domIds = Array.from(checkboxes).map(cb => cb.value || cb.dataset.requestId).filter(Boolean);
      
      // Sync with internal tracking
      selectedRequestIds = new Set(domIds);
      
      return Array.from(selectedRequestIds);
    },

    // Bulk status update
    async updateBulkStatus() {
      const statusSelect = document.getElementById('bulk-status-select');
      const resultsDiv = document.getElementById('bulk-update-results');
      
      if (!statusSelect || !resultsDiv) {
        console.error('❌ Bulk status update elements not found');
        return;
      }

      const newStatus = statusSelect.value;
      if (!newStatus) {
        this.showStatus(resultsDiv, '❌ Please select a status', 'error');
        return;
      }

      const selectedIds = this.getSelectedRequestIds();
      if (selectedIds.length === 0) {
        this.showStatus(resultsDiv, '❌ No requests selected', 'error');
        return;
      }

      this.showStatus(resultsDiv, `⏳ Updating ${selectedIds.length} requests...`, 'loading');

      try {
        const dataManager = window.SilentStacks?.modules?.DataManager;
        if (!dataManager) {
          throw new Error('DataManager not available');
        }

        let successCount = 0;
        const errors = [];

        selectedIds.forEach(id => {
          try {
            const success = dataManager.updateRequest(id, { status: newStatus });
            if (success) {
              successCount++;
            } else {
              errors.push(`Request ${id} not found`);
            }
          } catch (error) {
            errors.push(`Request ${id}: ${error.message}`);
          }
        });

        let resultMessage = `✅ Updated ${successCount} requests to "${newStatus}"`;
        if (errors.length > 0) {
          resultMessage += `\n❌ Errors: ${errors.join(', ')}`;
        }

        this.showStatus(resultsDiv, resultMessage, successCount > 0 ? 'success' : 'error');

        // Reset selection and refresh UI
        if (successCount > 0) {
          statusSelect.value = '';
          this.clearSelection();
          
          const uiController = window.SilentStacks?.modules?.UIController;
          if (uiController && uiController.renderRequests) {
            uiController.renderRequests();
          }
        }

      } catch (error) {
        console.error('❌ Bulk status update failed:', error);
        this.showStatus(resultsDiv, `❌ Error: ${error.message}`, 'error');
      }
    },

    // Bulk priority update
    async updateBulkPriority() {
      const prioritySelect = document.getElementById('bulk-priority-select');
      const resultsDiv = document.getElementById('bulk-update-results');
      
      if (!prioritySelect || !resultsDiv) {
        console.error('❌ Bulk priority update elements not found');
        return;
      }

      const newPriority = prioritySelect.value;
      if (!newPriority) {
        this.showStatus(resultsDiv, '❌ Please select a priority', 'error');
        return;
      }

      const selectedIds = this.getSelectedRequestIds();
      if (selectedIds.length === 0) {
        this.showStatus(resultsDiv, '❌ No requests selected', 'error');
        return;
      }

      this.showStatus(resultsDiv, `⏳ Updating ${selectedIds.length} requests...`, 'loading');

      try {
        const dataManager = window.SilentStacks?.modules?.DataManager;
        if (!dataManager) {
          throw new Error('DataManager not available');
        }

        let successCount = 0;
        const errors = [];

        selectedIds.forEach(id => {
          try {
            const success = dataManager.updateRequest(id, { priority: newPriority });
            if (success) {
              successCount++;
            } else {
              errors.push(`Request ${id} not found`);
            }
          } catch (error) {
            errors.push(`Request ${id}: ${error.message}`);
          }
        });

        let resultMessage = `✅ Updated ${successCount} requests to "${newPriority}" priority`;
        if (errors.length > 0) {
          resultMessage += `\n❌ Errors: ${errors.join(', ')}`;
        }

        this.showStatus(resultsDiv, resultMessage, successCount > 0 ? 'success' : 'error');

        // Reset selection and refresh UI
        if (successCount > 0) {
          prioritySelect.value = '';
          this.clearSelection();
          
          const uiController = window.SilentStacks?.modules?.UIController;
          if (uiController && uiController.renderRequests) {
            uiController.renderRequests();
          }
        }

      } catch (error) {
        console.error('❌ Bulk priority update failed:', error);
        this.showStatus(resultsDiv, `❌ Error: ${error.message}`, 'error');
      }
    },

    // Clear selection
    clearSelection() {
      selectedRequestIds.clear();
      
      const checkboxes = document.querySelectorAll('.request-checkbox, input[name="request-select"]');
      checkboxes.forEach(cb => cb.checked = false);
      
      const selectAll = document.getElementById('select-all');
      if (selectAll) {
        selectAll.checked = false;
      }
      
      this.updateBulkSelectionDisplay();
      this.updateBulkUpdateButtons();
    },

    // Export to CSV
    exportCSV() {
      try {
        const dataManager = window.SilentStacks?.modules?.DataManager;
        if (!dataManager) {
          throw new Error('DataManager not available');
        }

        const csvData = dataManager.exportData('csv');
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `silentstacks_requests_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ CSV export completed');
        }
      } catch (error) {
        console.error('❌ CSV export failed:', error);
      }
    },

    // Export to JSON
    exportJSON() {
      try {
        const dataManager = window.SilentStacks?.modules?.DataManager;
        if (!dataManager) {
          throw new Error('DataManager not available');
        }

        const jsonData = dataManager.exportData('json');
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `silentstacks_backup_${new Date().toISOString().split('T')[0]}.json`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ JSON export completed');
        }
      } catch (error) {
        console.error('❌ JSON export failed:', error);
      }
    },

    // Enhanced status display
    showStatus(element, message, type = 'info') {
      if (!element) return;
      
      element.textContent = message;
      element.className = `bulk-upload-status ${type}`;
      element.style.display = 'block';
      
      // Auto-hide success messages after 10 seconds
      if (type === 'success') {
        setTimeout(() => {
          if (element.className.includes('success')) {
            element.style.display = 'none';
          }
        }, 10000);
      }
      
      console.log(`📢 Status: ${message}`);
    }
  };

  // Register with SilentStacks
  window.SilentStacks = window.SilentStacks || { modules: {} };
  window.SilentStacks.modules.BulkOperations = CompleteBulkOperations;

  console.log('📦 FINAL FIXED Bulk Operations v1.5 module loaded');

})()