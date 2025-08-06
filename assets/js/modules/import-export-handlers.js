// Import/Export Event Handlers Module for SilentStacks v1.3.0
// File: assets/js/modules/import-export-handlers.js

(function() {
  'use strict';

  console.log('🔧 Loading Import/Export Event Handlers v1.3.0...');

  let selectedRequestIds = new Set();

  // === Event Handler Functions ===
  
  function setupBulkUpdateHandlers() {
    console.log('🔧 Setting up bulk update handlers...');
    
    const bulkUpdateStatus = document.getElementById('bulk-update-status');
    const bulkUpdatePriority = document.getElementById('bulk-update-priority');
    
    if (bulkUpdateStatus) {
      bulkUpdateStatus.addEventListener('click', async function() {
        const newStatus = document.getElementById('bulk-status-select').value;
        if (!newStatus) {
          window.SilentStacks.modules.UIController.showNotification(
            'Please select a status first', 
            'warning'
          );
          return;
        }
        
        const selectedIds = getSelectedRequestIds();
        if (selectedIds.length === 0) {
          window.SilentStacks.modules.UIController.showNotification(
            'Please select requests in the "All Requests" section first', 
            'warning'
          );
          return;
        }
        
        if (confirm(`Update ${selectedIds.length} request(s) to "${newStatus}" status?`)) {
          try {
            await window.SilentStacks.modules.BulkOperations.bulkUpdateStatus(selectedIds, newStatus);
            updateBulkSelectionDisplay();
          } catch (error) {
            window.SilentStacks.modules.UIController.showNotification(
              `Update failed: ${error.message}`, 
              'error'
            );
          }
        }
      });
      console.log('✅ Bulk status update handler attached');
    }
    
    if (bulkUpdatePriority) {
      bulkUpdatePriority.addEventListener('click', async function() {
        const newPriority = document.getElementById('bulk-priority-select').value;
        if (!newPriority) {
          window.SilentStacks.modules.UIController.showNotification(
            'Please select a priority first', 
            'warning'
          );
          return;
        }
        
        const selectedIds = getSelectedRequestIds();
        if (selectedIds.length === 0) {
          window.SilentStacks.modules.UIController.showNotification(
            'Please select requests in the "All Requests" section first', 
            'warning'
          );
          return;
        }
        
        if (confirm(`Update ${selectedIds.length} request(s) to "${newPriority}" priority?`)) {
          try {
            await window.SilentStacks.modules.BulkOperations.bulkUpdatePriority(selectedIds, newPriority);
            updateBulkSelectionDisplay();
          } catch (error) {
            window.SilentStacks.modules.UIController.showNotification(
              `Update failed: ${error.message}`, 
              'error'
            );
          }
        }
      });
      console.log('✅ Bulk priority update handler attached');
    }
  }

  function setupAdvancedOptionsHandlers() {
    console.log('🔧 Setting up advanced options handlers...');
    
    // API enrichment toggle
    const apiEnrichmentToggle = document.getElementById('enable-api-enrichment');
    if (apiEnrichmentToggle) {
      apiEnrichmentToggle.addEventListener('change', function() {
        const enabled = this.checked;
        localStorage.setItem('silentstacks_api_enrichment', enabled.toString());
        
        window.SilentStacks.modules.UIController.showNotification(
          `API enrichment ${enabled ? 'enabled' : 'disabled'}`, 
          'info'
        );
      });
      
      // Load saved preference
      const savedPref = localStorage.getItem('silentstacks_api_enrichment');
      if (savedPref !== null) {
        apiEnrichmentToggle.checked = savedPref === 'true';
      }
    }
    
    // Preserve existing data toggle
    const preserveDataToggle = document.getElementById('preserve-existing-data');
    if (preserveDataToggle) {
      preserveDataToggle.addEventListener('change', function() {
        const enabled = this.checked;
        localStorage.setItem('silentstacks_preserve_data', enabled.toString());
      });
      
      // Load saved preference
      const savedPref = localStorage.getItem('silentstacks_preserve_data');
      if (savedPref !== null) {
        preserveDataToggle.checked = savedPref === 'true';
      }
    }
    
    // Batch size selection
    const batchSizeSelect = document.getElementById('import-batch-size');
    if (batchSizeSelect) {
      batchSizeSelect.addEventListener('change', function() {
        const batchSize = parseInt(this.value);
        localStorage.setItem('silentstacks_batch_size', batchSize.toString());
        
        // Update the bulk operations module if available
        if (window.SilentStacks.modules.BulkOperations) {
          window.SilentStacks.modules.BulkOperations.SAFETY_LIMITS.MAX_BATCH_SIZE = batchSize;
        }
      });
      
      // Load saved preference
      const savedBatchSize = localStorage.getItem('silentstacks_batch_size');
      if (savedBatchSize) {
        batchSizeSelect.value = savedBatchSize;
      }
    }
  }

  function setupSelectionTracking() {
    console.log('🔧 Setting up selection tracking...');
    
    // Listen for selection changes in the main requests view
    document.addEventListener('change', function(e) {
      if (e.target.name === 'request-select' || e.target.classList.contains('request-checkbox')) {
        const requestId = e.target.value || e.target.dataset.requestId;
        
        if (e.target.checked) {
          selectedRequestIds.add(requestId);
        } else {
          selectedRequestIds.delete(requestId);
        }
        
        updateBulkSelectionDisplay();
        updateBulkUpdateButtons();
      }
    });
    
    // Listen for "select all" changes
    document.addEventListener('change', function(e) {
      if (e.target.id === 'select-all-requests') {
        const checkboxes = document.querySelectorAll('input[name="request-select"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = e.target.checked;
          const requestId = checkbox.value || checkbox.dataset.requestId;
          
          if (e.target.checked) {
            selectedRequestIds.add(requestId);
          } else {
            selectedRequestIds.delete(requestId);
          }
        });
        
        updateBulkSelectionDisplay();
        updateBulkUpdateButtons();
      }
    });
  }

  function getSelectedRequestIds() {
    // Get from actual DOM checkboxes in case of sync issues
    const checkboxes = document.querySelectorAll('input[name="request-select"]:checked, .request-checkbox:checked');
    const domIds = Array.from(checkboxes).map(cb => cb.value || cb.dataset.requestId).filter(Boolean);
    
    // Sync with internal tracking
    selectedRequestIds = new Set(domIds);
    
    return Array.from(selectedRequestIds);
  }

  function updateBulkSelectionDisplay() {
    const display = document.getElementById('bulk-update-status-display');
    const selectedIds = getSelectedRequestIds();
    
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
  }

  function updateBulkUpdateButtons() {
    const statusBtn = document.getElementById('bulk-update-status');
    const priorityBtn = document.getElementById('bulk-update-priority');
    const selectedCount = getSelectedRequestIds().length;
    
    const isDisabled = selectedCount === 0;
    
    if (statusBtn) {
      statusBtn.disabled = isDisabled;
      statusBtn.title = isDisabled ? 'Select requests first' : `Update ${selectedCount} request(s)`;
    }
    
    if (priorityBtn) {
      priorityBtn.disabled = isDisabled;
      priorityBtn.title = isDisabled ? 'Select requests first' : `Update ${selectedCount} request(s)`;
    }
  }

  function setupExportHandlers() {
    console.log('🔧 Setting up export handlers...');
    
    const exportCSVBtn = document.getElementById('export-csv');
    const exportJSONBtn = document.getElementById('export-json');
    
    if (exportCSVBtn) {
      exportCSVBtn.addEventListener('click', async function() {
        try {
          if (window.SilentStacks.modules.BulkOperations.exportCSV) {
            await window.SilentStacks.modules.BulkOperations.exportCSV();
          } else {
            throw new Error('Export function not available');
          }
        } catch (error) {
          window.SilentStacks.modules.UIController.showNotification(
            `CSV export failed: ${error.message}`, 
            'error'
          );
        }
      });
      console.log('✅ CSV export handler attached');
    }
    
    if (exportJSONBtn) {
      exportJSONBtn.addEventListener('click', async function() {
        try {
          if (window.SilentStacks.modules.BulkOperations.exportJSON) {
            await window.SilentStacks.modules.BulkOperations.exportJSON();
          } else {
            throw new Error('Export function not available');
          }
        } catch (error) {
          window.SilentStacks.modules.UIController.showNotification(
            `JSON export failed: ${error.message}`, 
            'error'
          );
        }
      });
      console.log('✅ JSON export handler attached');
    }
  }

  function setupImportHandlers() {
    console.log('🔧 Setting up import handlers...');
    
    // File import handler is set up in BulkOperations module
    // Just ensure the bulk paste button is connected
    const bulkPasteBtn = document.getElementById('bulk-paste-btn');
    if (bulkPasteBtn) {
      bulkPasteBtn.addEventListener('click', async function() {
        try {
          if (window.SilentStacks.modules.BulkOperations.handleBulkPasteWithLookup) {
            await window.SilentStacks.modules.BulkOperations.handleBulkPasteWithLookup();
          } else {
            throw new Error('Bulk paste function not available');
          }
        } catch (error) {
          window.SilentStacks.modules.UIController.showNotification(
            `Bulk paste failed: ${error.message}`, 
            'error'
          );
        }
      });
      console.log('✅ Bulk paste handler attached');
    }
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + A in requests view = select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id === 'all-requests') {
          e.preventDefault();
          const selectAllCheckbox = document.getElementById('select-all-requests');
          if (selectAllCheckbox) {
            selectAllCheckbox.checked = !selectAllCheckbox.checked;
            selectAllCheckbox.dispatchEvent(new Event('change'));
          }
        }
      }
      
      // Escape = clear selection
      if (e.key === 'Escape') {
        const selectAllCheckbox = document.getElementById('select-all-requests');
        if (selectAllCheckbox && selectAllCheckbox.checked) {
          selectAllCheckbox.checked = false;
          selectAllCheckbox.dispatchEvent(new Event('change'));
        }
      }
    });
  }

  // === Module Interface ===
  const ImportExportHandlers = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing Import/Export Event Handlers v1.3.0...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', this.setupAllHandlers.bind(this));
      } else {
        this.setupAllHandlers();
      }
      
      console.log('✅ Import/Export Event Handlers initialized');
    },

    setupAllHandlers() {
      console.log('🔧 Setting up all import/export handlers...');
      
      // Wait a bit for other modules to be available
      setTimeout(() => {
        setupBulkUpdateHandlers();
        setupAdvancedOptionsHandlers();
        setupSelectionTracking();
        setupExportHandlers();
        setupImportHandlers();
        setupKeyboardShortcuts();
        
        // Initial UI state
        updateBulkSelectionDisplay();
        updateBulkUpdateButtons();
        
        console.log('✅ All import/export handlers ready');
      }, 500);
    },

    // Public methods for external use
    getSelectedRequestIds,
    updateBulkSelectionDisplay,
    updateBulkUpdateButtons,
    
    // Selection management
    selectRequest(requestId) {
      selectedRequestIds.add(requestId);
      updateBulkSelectionDisplay();
      updateBulkUpdateButtons();
    },
    
    deselectRequest(requestId) {
      selectedRequestIds.delete(requestId);
      updateBulkSelectionDisplay();
      updateBulkUpdateButtons();
    },
    
    clearSelection() {
      selectedRequestIds.clear();
      updateBulkSelectionDisplay();
      updateBulkUpdateButtons();
      
      // Uncheck all checkboxes
      document.querySelectorAll('input[name="request-select"], .request-checkbox').forEach(cb => {
        cb.checked = false;
      });
    },
    
    getSelectionCount() {
      return selectedRequestIds.size;
    },

    // Version info
    version: '1.3.0'
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('ImportExportHandlers', ImportExportHandlers);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.ImportExportHandlers = ImportExportHandlers;
  }

  console.log('✅ Import/Export Event Handlers module registered');

})();
