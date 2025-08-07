// assets/js/modules/bulk-operations.js
// SilentStacks Bulk Operations Module v1.5 - FINAL FIXED VERSION
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

  const FinalFixedBulkOperations = {
    initialized: false,

    // Initialize bulk operations
    initialize() {
      if (this.initialized) return;
      
      console.log('🔧 Initializing FINAL FIXED Bulk Operations v1.5...');
      
      try {
        this.setupEventListeners();
        this.setupSelectionTracking();
        this.setupExportHandlers();
        this.initialized = true;
        
        console.log('✅ FINAL FIXED Bulk Operations v1.5 initialized successfully');
        
      } catch (error) {
        console.error('❌ Bulk Operations initialization failed:', error);
      }
    },

    // Set up event listeners with correct element IDs
    setupEventListeners() {
      // FIXED: PMID Batch Processing with correct element ID
      const pmidBatchBtn = document.getElementById('bulk-paste-btn');
      if (pmidBatchBtn) {
        pmidBatchBtn.addEventListener('click', () => this.processPMIDBatch());
        console.log('✅ PMID batch handler attached to bulk-paste-btn');
      } else {
        console.warn('⚠️ bulk-paste-btn element not found');
      }

      // FIXED: CSV File Upload with correct element ID
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

      // FIXED: Bulk Status Update with correct element ID
      const bulkStatusBtn = document.getElementById('bulk-update-status');
      if (bulkStatusBtn) {
        bulkStatusBtn.addEventListener('click', () => this.updateBulkStatus());
        console.log('✅ Bulk status update handler attached to bulk-update-status');
      } else {
        console.warn('⚠️ bulk-update-status element not found');
      }

      // FIXED: Bulk Priority Update with correct element ID
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

    // FIXED: Process PMID batch with correct element ID
    async processPMIDBatch() {
      // FIXED: Use correct textarea element ID
      const textarea = document.getElementById('bulk-paste-textarea');
      const statusDiv = document.getElementById('bulk-paste-status');
      const autoFetch = document.getElementById('bulk-paste-auto-fetch')?.checked ?? true;
      
      if (!textarea) {
        console.error('❌ bulk-paste-textarea element not found');
        return;
      }
      
      if (!textarea.value.trim()) {
        this.showStatus(statusDiv, 'Please enter PMID data in the textarea', 'error');
        return;
      }

      if (isProcessing) {
        this.showStatus(statusDiv, 'Processing in progress, please wait...', 'warning');
        return;
      }

      isProcessing = true;
      this.showStatus(statusDiv, 'Processing PMID batch...', 'loading');
      
      try {
        const lines = textarea.value.trim().split('\n').filter(line => line.trim());
        const processed = [];
        const errors = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          try {
            // Update progress
            this.showStatus(statusDiv, 
              `Processing line ${i + 1}/${lines.length}... (${processed.length} successful)`, 
              'loading'
            );
            
            const result = await this.processPMIDLine(line, autoFetch);
            if (result) {
              processed.push(result);
            }
          } catch (error) {
            console.error(`Error processing line ${i + 1}:`, error);
            errors.push(`Line ${i + 1}: ${error.message}`);
          }
          
          // Rate limiting to avoid API overload
          await this.delay(300);
        }
        
        // Save to data manager
        const dataManager = window.SilentStacks?.modules?.DataManager;
        if (dataManager) {
          processed.forEach(request => {
            dataManager.addRequest(request);
          });
          
          // Refresh UI
          if (window.SilentStacks.modules.RequestManager?.refreshAllViews) {
            window.SilentStacks.modules.RequestManager.refreshAllViews();
          }
          
          // Refresh search filter
          if (window.SilentStacks.modules.SearchFilter?.refresh) {
            window.SilentStacks.modules.SearchFilter.refresh();
          }
        }
        
        // Clear textarea
        textarea.value = '';
        
        // Show results
        let message = `✅ Successfully processed ${processed.length} requests`;
        if (errors.length > 0) {
          message += `\n⚠️ ${errors.length} errors occurred`;
          console.log('Bulk processing errors:', errors);
        }
        
        this.showStatus(statusDiv, message, processed.length > 0 ? 'success' : 'error');
        this.showNotification(`Bulk import complete: ${processed.length} requests added`, 'success');
        
      } catch (error) {
        console.error('Bulk processing error:', error);
        this.showStatus(statusDiv, 'Error processing batch', 'error');
      } finally {
        isProcessing = false;
      }
    },

    // Process individual PMID line
    async processPMIDLine(line, autoFetch = true) {
      const request = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        priority: 'normal'
      };

      // Parse different formats
      const pmidMatch = line.match(/(?:PMID:?\s*)?(\d{7,8})/i);
      const doclineMatch = line.match(/(?:DOCLINE:?\s*)?([A-Z0-9]{6,12})/i);
      
      if (pmidMatch) {
        request.pmid = pmidMatch[1];
      }
      
      if (doclineMatch && !pmidMatch?.[0].includes(doclineMatch[1])) {
        request.docline = doclineMatch[1];
      }

      // Handle CSV format (PMID, DOCLINE, Status, Priority)
      if (line.includes(',')) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          request.pmid = request.pmid || parts[0];
          request.docline = request.docline || parts[1];
          if (parts[2]) request.status = parts[2].toLowerCase();
          if (parts[3]) request.priority = parts[3].toLowerCase();
        }
      }

      if (!request.pmid) {
        throw new Error('No valid PMID found in line');
      }

      // Auto-fetch metadata from PubMed
      if (autoFetch) {
        console.log(`Fetching metadata for PMID ${request.pmid}...`);
        
        try {
          const apiModule = window.SilentStacks?.modules?.APIIntegration;
          if (apiModule && apiModule.fetchPubMedMetadata) {
            const metadata = await apiModule.fetchPubMedMetadata(request.pmid, true);
            if (metadata) {
              // Merge metadata in NLM format
              Object.assign(request, metadata);
              console.log(`✅ Fetched metadata for PMID ${request.pmid}`);
            }
          } else {
            console.warn('APIIntegration module not available for metadata fetch');
          }
          
        } catch (error) {
          console.warn(`Failed to fetch metadata for PMID ${request.pmid}:`, error);
          // Continue without metadata
        }
      }

      return request;
    },

    // FIXED: Upload and process CSV file with correct element IDs
    async uploadCSV() {
      const fileInput = document.getElementById('import-file');
      const statusDiv = document.getElementById('import-status');
      const autoFetch = document.getElementById('csv-auto-fetch')?.checked ?? true;
      
      if (!fileInput?.files[0]) {
        this.showStatus(statusDiv, 'Please select a CSV file', 'error');
        return;
      }

      const file = fileInput.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.showStatus(statusDiv, 'Please select a .csv file', 'error');
        return;
      }

      if (isProcessing) {
        this.showStatus(statusDiv, 'Processing in progress, please wait...', 'warning');
        return;
      }

      isProcessing = true;
      this.showStatus(statusDiv, 'Reading CSV file...', 'loading');
      
      try {
        const csvText = await this.readFileAsText(file);
        const lines = csvText.trim().split('\n');
        
        if (lines.length < 2) {
          this.showStatus(statusDiv, 'CSV file must have at least a header and one data row', 'error');
          return;
        }

        // Parse header (case-insensitive)
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const processed = [];
        const errors = [];
        
        for (let i = 1; i < lines.length; i++) {
          try {
            this.showStatus(statusDiv, 
              `Processing row ${i}/${lines.length - 1}... (${processed.length} successful)`, 
              'loading'
            );
            
            const values = lines[i].split(',').map(v => v.trim());
            const request = await this.parseCSVRow(headers, values, autoFetch);
            
            if (request) {
              processed.push(request);
            }
          } catch (error) {
            console.error(`Error processing row ${i + 1}:`, error);
            errors.push(`Row ${i + 1}: ${error.message}`);
          }
          
          // Rate limiting
          await this.delay(200);
        }

        // Save to data manager
        const dataManager = window.SilentStacks?.modules?.DataManager;
        if (dataManager) {
          processed.forEach(request => {
            dataManager.addRequest(request);
          });
          
          // Refresh UI
          if (window.SilentStacks.modules.RequestManager?.refreshAllViews) {
            window.SilentStacks.modules.RequestManager.refreshAllViews();
          }
          
          // Refresh search filter
          if (window.SilentStacks.modules.SearchFilter?.refresh) {
            window.SilentStacks.modules.SearchFilter.refresh();
          }
        }

        // Clear file input
        fileInput.value = '';
        
        // Show results
        let message = `✅ Successfully processed ${processed.length} requests from CSV`;
        if (errors.length > 0) {
          message += `\n⚠️ ${errors.length} errors occurred`;
          console.log('CSV processing errors:', errors);
        }
        
        this.showStatus(statusDiv, message, processed.length > 0 ? 'success' : 'error');
        this.showNotification(`CSV import complete: ${processed.length} requests added`, 'success');
        
      } catch (error) {
        console.error('CSV processing error:', error);
        this.showStatus(statusDiv, 'Error processing CSV file', 'error');
      } finally {
        isProcessing = false;
      }
    },

    // Parse CSV row into request object
    async parseCSVRow(headers, values, autoFetch) {
      const request = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        priority: 'normal'
      };

      // Field mapping (case-insensitive)
      const fieldMapping = {
        'pmid': 'pmid',
        'docline': 'docline', 
        'docline number': 'docline',
        'title': 'title',
        'authors': 'authors',
        'journal': 'journal',
        'year': 'year',
        'volume': 'volume',
        'issue': 'issue',
        'pages': 'pages',
        'doi': 'doi',
        'status': 'status',
        'priority': 'priority',
        'patron email': 'patronEmail',
        'patron_email': 'patronEmail',
        'notes': 'notes'
      };

      // Map CSV values to request fields
      headers.forEach((header, index) => {
        const fieldName = fieldMapping[header];
        if (fieldName && values[index]) {
          request[fieldName] = values[index];
        }
      });

      // Auto-fetch metadata if PMID exists
      if (autoFetch && request.pmid) {
        try {
          const apiModule = window.SilentStacks?.modules?.APIIntegration;
          if (apiModule && apiModule.fetchPubMedMetadata) {
            const metadata = await apiModule.fetchPubMedMetadata(request.pmid, true);
            if (metadata) {
              // Don't overwrite existing data, only fill empty fields
              Object.keys(metadata).forEach(key => {
                if (!request[key] || request[key] === '') {
                  request[key] = metadata[key];
                }
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch metadata for PMID ${request.pmid}:`, error);
        }
      }

      return request;
    },

    // Export to CSV in NLM format
    exportCSV() {
      const dataManager = window.SilentStacks?.modules?.DataManager;
      if (!dataManager) {
        this.showNotification('Data manager not available', 'error');
        return;
      }

      const requests = dataManager.getAllRequests();
      if (requests.length === 0) {
        this.showNotification('No requests to export', 'error');
        return;
      }

      // NLM Format Headers (DOCLINE first as requested)
      const headers = [
        'DOCLINE', 'PMID', 'Title', 'Authors (NLM)', 'Journal', 'Year', 'Volume', 
        'Issue', 'Pages', 'DOI', 'Status', 'Priority', 'Patron Email', 
        'Clinical Trials', 'Created Date', 'Updated Date', 'Notes'
      ];

      const csvRows = [headers.join(',')];
      
      requests.forEach(request => {
        const clinicalTrials = request.clinicalTrials ? 
          request.clinicalTrials.map(t => `${t.nctNumber}: ${t.title}`).join('; ') : '';
        
        const row = [
          this.csvEscape(request.docline || ''),
          this.csvEscape(request.pmid || ''),
          this.csvEscape(request.title || ''),
          this.csvEscape(request.authors || ''),
          this.csvEscape(request.journal || ''),
          this.csvEscape(request.year || ''),
          this.csvEscape(request.volume || ''),
          this.csvEscape(request.issue || ''),
          this.csvEscape(request.pages || ''),
          this.csvEscape(request.doi || ''),
          this.csvEscape(request.status || ''),
          this.csvEscape(request.priority || ''),
          this.csvEscape(request.patronEmail || ''),
          this.csvEscape(clinicalTrials),
          this.csvEscape(new Date(request.createdAt).toISOString().split('T')[0]),
          this.csvEscape(new Date(request.updatedAt).toISOString().split('T')[0]),
          this.csvEscape(request.notes || '')
        ];
        
        csvRows.push(row.join(','));
      });

      this.downloadFile(csvRows.join('\n'), 'text/csv', `silentstacks_requests_${new Date().toISOString().split('T')[0]}.csv`);
      this.showNotification(`✅ Exported ${requests.length} requests to CSV (NLM format)`, 'success');
    },

    // Export to JSON
    exportJSON() {
      const dataManager = window.SilentStacks?.modules?.DataManager;
      if (!dataManager) {
        this.showNotification('Data manager not available', 'error');
        return;
      }

      const requests = dataManager.getAllRequests();
      if (requests.length === 0) {
        this.showNotification('No requests to export', 'error');
        return;
      }

      const jsonContent = JSON.stringify(requests, null, 2);
      this.downloadFile(jsonContent, 'application/json', `silentstacks_requests_${new Date().toISOString().split('T')[0]}.json`);
      this.showNotification(`✅ Exported ${requests.length} requests to JSON`, 'success');
    },

    // FIXED: Bulk update status with correct element IDs
    async updateBulkStatus() {
      const statusSelect = document.getElementById('bulk-status-select');
      const statusDiv = document.getElementById('bulk-update-status-display');
      const newStatus = statusSelect?.value;
      
      if (!newStatus) {
        this.showStatus(statusDiv, 'Please select a status', 'error');
        return;
      }

      const selectedIds = this.getSelectedRequestIds();
      if (selectedIds.length === 0) {
        this.showStatus(statusDiv, 'No requests selected. Select requests in "All Requests" tab first.', 'error');
        return;
      }

      try {
        const dataManager = window.SilentStacks?.modules?.DataManager;
        if (!dataManager) throw new Error('Data manager not available');

        let updated = 0;
        selectedIds.forEach(id => {
          if (dataManager.updateRequest(id, { 
            status: newStatus,
            updatedAt: new Date().toISOString()
          })) {
            updated++;
          }
        });

        // Refresh UI
        if (window.SilentStacks.modules.RequestManager?.refreshAllViews) {
          window.SilentStacks.modules.RequestManager.refreshAllViews();
        }
        
        // Refresh search filter
        if (window.SilentStacks.modules.SearchFilter?.refresh) {
          window.SilentStacks.modules.SearchFilter.refresh();
        }

        statusSelect.value = '';
        this.showStatus(statusDiv, `✅ Updated status for ${updated} requests`, 'success');
        this.showNotification(`✅ Updated ${updated} requests to ${newStatus}`, 'success');

      } catch (error) {
        console.error('Bulk status update error:', error);
        this.showStatus(statusDiv, 'Error updating status', 'error');
      }
    },

    // FIXED: Bulk update priority with correct element IDs
    async updateBulkPriority() {
      const prioritySelect = document.getElementById('bulk-priority-select');
      const statusDiv = document.getElementById('bulk-update-status-display');
      const newPriority = prioritySelect?.value;
      
      if (!newPriority) {
        this.showStatus(statusDiv, 'Please select a priority', 'error');
        return;
      }

      const selectedIds = this.getSelectedRequestIds();
      if (selectedIds.length === 0) {
        this.showStatus(statusDiv, 'No requests selected. Select requests in "All Requests" tab first.', 'error');
        return;
      }

      try {
        const dataManager = window.SilentStacks?.modules?.DataManager;
        if (!dataManager) throw new Error('Data manager not available');

        let updated = 0;
        selectedIds.forEach(id => {
          if (dataManager.updateRequest(id, { 
            priority: newPriority,
            updatedAt: new Date().toISOString()
          })) {
            updated++;
          }
        });

        // Refresh UI
        if (window.SilentStacks.modules.RequestManager?.refreshAllViews) {
          window.SilentStacks.modules.RequestManager.refreshAllViews();
        }
        
        // Refresh search filter
        if (window.SilentStacks.modules.SearchFilter?.refresh) {
          window.SilentStacks.modules.SearchFilter.refresh();
        }

        prioritySelect.value = '';
        this.showStatus(statusDiv, `✅ Updated priority for ${updated} requests`, 'success');
        this.showNotification(`✅ Updated ${updated} requests to ${newPriority} priority`, 'success');

      } catch (error) {
        console.error('Bulk priority update error:', error);
        this.showStatus(statusDiv, 'Error updating priority', 'error');
      }
    },

    // Helper: Get selected request IDs
    getSelectedRequestIds() {
      const checkboxes = document.querySelectorAll('.request-checkbox:checked');
      const ids = Array.from(checkboxes).map(cb => cb.dataset.requestId).filter(Boolean);
      selectedRequestIds = new Set(ids);
      return ids;
    },

    // Helper: Update bulk selection display
    updateBulkSelectionDisplay() {
      const display = document.getElementById('bulk-update-status-display');
      const selectedIds = this.getSelectedRequestIds();
      
      if (display) {
        if (selectedIds.length > 0) {
          display.textContent = `${selectedIds.length} request(s) selected for bulk operations`;
          display.style.display = 'block';
          display.className = 'bulk-status-display selected';
        } else {
          display.textContent = 'No requests selected';
          display.style.display = 'block';
          display.className = 'bulk-status-display';
        }
      }
    },

    // Helper: Update bulk update buttons
    updateBulkUpdateButtons() {
      const statusBtn = document.getElementById('bulk-update-status');
      const priorityBtn = document.getElementById('bulk-update-priority');
      const selectedCount = this.getSelectedRequestIds().length;
      
      const isDisabled = selectedCount === 0;
      
      if (statusBtn) {
        statusBtn.disabled = isDisabled;
        statusBtn.title = isDisabled ? 'Select requests first' : `Update status for ${selectedCount} requests`;
      }
      
      if (priorityBtn) {
        priorityBtn.disabled = isDisabled;
        priorityBtn.title = isDisabled ? 'Select requests first' : `Update priority for ${selectedCount} requests`;
      }
    },

    // Helper: Read file as text
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    },

    // Helper: Download file
    downloadFile(content, mimeType, filename) {
      const blob = new Blob([content], { type: mimeType });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    },

    // Helper: CSV escape
    csvEscape(value) {
      if (!value) return '';
      const str = value.toString();
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    },

    // Helper: Show status message
    showStatus(element, message, type) {
      if (!element) {
        console.warn('Status element not found:', element);
        return;
      }
      
      element.innerHTML = message;
      element.className = `bulk-upload-status ${type}`;
      element.style.display = 'block';
      
      if (type === 'success' || type === 'error') {
        setTimeout(() => {
          element.style.display = 'none';
        }, 5000);
      }
    },

    // Helper: Show notification
    showNotification(message, type) {
      console.log(`${type.toUpperCase()}: ${message}`);
      
      // Try to use global notification system
      if (window.SilentStacks?.modules?.UIController?.showNotification) {
        window.SilentStacks.modules.UIController.showNotification(message, type);
      }
    },

    // Helper: Delay
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  };

  // Export module
  window.SilentStacks = window.SilentStacks || { modules: {} };
  window.SilentStacks.modules.BulkOperations = FinalFixedBulkOperations;

  console.log('📦 FINAL FIXED Bulk Operations v1.5 module loaded');

})();