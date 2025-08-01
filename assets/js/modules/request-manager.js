// SilentStacks Request Manager Module
// Handles CRUD operations, form management, and request validation
(() => {
  'use strict';

  // === Form Field Mapping ===
  const FIELD_MAPPING = {
    pmid: 'pmid',
    doi: 'doi',
    title: 'title',
    authors: 'authors',
    journal: 'journal',
    year: 'year',
    docline: 'docline',
    'patron-email': 'patronEmail',
    status: 'status',
    tags: 'tags',
    notes: 'notes',
    priority: 'priority'
  };

  // === Form Population ===
  function populateForm(data) {
    Object.entries(FIELD_MAPPING).forEach(([fieldId, dataKey]) => {
      const element = document.getElementById(fieldId);
      if (element && data.hasOwnProperty(dataKey)) {
        let value = data[dataKey];
        
        // Handle arrays (like tags)
        if (Array.isArray(value)) {
          value = value.join(', ');
        }
        
        element.value = value || '';
      }
    });
    
    console.log('✅ Form populated with data');
  }

  function extractFormData() {
    const formData = {};
    
    Object.entries(FIELD_MAPPING).forEach(([fieldId, dataKey]) => {
      const element = document.getElementById(fieldId);
      if (element) {
        let value = element.value.trim();
        
        // Special handling for tags - convert comma-separated string to array
        if (dataKey === 'tags') {
          value = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];
        }
        
        formData[dataKey] = value;
      }
    });
    
    // Add metadata
    formData.createdAt = new Date().toISOString();
    
    return formData;
  }

  // === Form Validation ===
  function validateFormData(data) {
    const errors = [];
    
    // At least one identifier or title is required
    if (!data.title && !data.pmid && !data.doi) {
      errors.push('Request must have at least a title, PMID, or DOI');
    }
    
    // Validate PMID format
    if (data.pmid && !/^\d+$/.test(data.pmid)) {
      errors.push('PMID must be numeric');
    }
    
    // Validate status
    if (data.status && !['pending', 'in-progress', 'fulfilled', 'cancelled'].includes(data.status)) {
      errors.push('Invalid status value');
    }
    
    // Validate priority
    if (data.priority && !['urgent', 'rush', 'normal'].includes(data.priority)) {
      errors.push('Invalid priority value');
    }
    
    // Validate email format if provided
    if (data.patronEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.patronEmail)) {
        errors.push('Invalid email format');
      }
    }
    
    // Validate year if provided
    if (data.year) {
      const yearNum = parseInt(data.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear + 1) {
        errors.push('Year must be between 1800 and ' + (currentYear + 1));
      }
    }
    
    return errors;
  }

  // === Form Handlers ===
  function handleFormSubmit() {
    try {
      const formData = extractFormData();
      
      // Validate form data
      const validationErrors = validateFormData(formData);
      if (validationErrors.length > 0) {
        const errorMessage = 'Validation errors:\n• ' + validationErrors.join('\n• ');
        window.SilentStacks.modules.UIController.setStatus(errorMessage, 'error');
        return;
      }
      
      // Handle edit vs new request
      const currentEdit = window.SilentStacks.state.currentEdit;
      
      if (currentEdit !== null) {
        // Update existing request
        window.SilentStacks.modules.DataManager.updateRequest(currentEdit, formData);
        window.SilentStacks.state.currentEdit = null;
        window.SilentStacks.modules.UIController.setStatus('Request updated successfully!', 'success');
      } else {
        // Add new request
        window.SilentStacks.modules.DataManager.addRequest(formData);
        window.SilentStacks.modules.UIController.setStatus('Request added successfully!', 'success');
      }
      
      // Update global tags if new ones were added
      if (formData.tags && formData.tags.length > 0) {
        window.SilentStacks.modules.DataManager.addTagsFromRequest(formData.tags);
      }
      
      // Clear form and refresh UI
      clearForm();
      refreshAllViews();
      
      // Auto-navigate to All Requests tab to show the new/updated request
      setTimeout(() => {
        const allRequestsTab = document.querySelector('[data-section="all-requests"]');
        if (allRequestsTab) {
          window.SilentStacks.modules.UIController.switchSection(allRequestsTab);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Form submission error:', error);
      window.SilentStacks.modules.UIController.setStatus(`Failed to save request: ${error.message}`, 'error');
    }
  }

  function clearForm() {
    const form = document.getElementById('request-form');
    if (form) {
      form.reset();
    }
    
    // Reset current edit state
    window.SilentStacks.state.currentEdit = null;
    
    // Reset progress step if medical features are available
    if (window.SilentStacks.modules.MedicalFeatures?.resetProgress) {
      window.SilentStacks.modules.MedicalFeatures.resetProgress();
    }
    
    window.SilentStacks.modules.UIController.setStatus('Form cleared', 'success');
  }

  // === Request Management Functions ===
  function editRequest(index) {
    try {
      const requests = window.SilentStacks.modules.DataManager.getRequests();
      const request = requests[index];
      
      if (!request) {
        throw new Error(`Request at index ${index} not found`);
      }
      
      // Set edit mode
      window.SilentStacks.state.currentEdit = index;
      
      // Populate form with request data
      populateForm(request);
      
      // Switch to add request tab
      const addTab = document.querySelector('[data-section="add-request"]');
      if (addTab) {
        window.SilentStacks.modules.UIController.switchSection(addTab);
      }
      
      // Show edit mode indicator
      window.SilentStacks.modules.UIController.setStatus('Editing request - make changes and click Save', 'info');
      
      // Focus first input
      setTimeout(() => {
        const firstInput = document.querySelector('#add-request input, #add-request select, #add-request textarea');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
      
    } catch (error) {
      console.error('Edit request error:', error);
      window.SilentStacks.modules.UIController.showNotification(`Failed to edit request: ${error.message}`, 'error');
    }
  }

  function deleteRequest(index) {
    try {
      const requests = window.SilentStacks.modules.DataManager.getRequests();
      const request = requests[index];
      
      if (!request) {
        throw new Error(`Request at index ${index} not found`);
      }
      
      const requestTitle = request.title || `Request ${index + 1}`;
      
      if (confirm(`Delete "${requestTitle}"?\n\nThis action cannot be undone.`)) {
        window.SilentStacks.modules.DataManager.deleteRequest(index);
        refreshAllViews();
        window.SilentStacks.modules.UIController.showNotification('Request deleted successfully', 'success');
      }
      
    } catch (error) {
      console.error('Delete request error:', error);
      window.SilentStacks.modules.UIController.showNotification(`Failed to delete request: ${error.message}`, 'error');
    }
  }

  function duplicateRequest(index) {
    try {
      const requests = window.SilentStacks.modules.DataManager.getRequests();
      const original = requests[index];
      
      if (!original) {
        throw new Error(`Request at index ${index} not found`);
      }
      
      // Create duplicate with modified title and reset status
      const duplicate = {
        ...original,
        title: `${original.title} (Copy)`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Remove updatedAt if it exists
      delete duplicate.updatedAt;
      
      window.SilentStacks.modules.DataManager.addRequest(duplicate);
      refreshAllViews();
      
      window.SilentStacks.modules.UIController.showNotification('Request duplicated successfully', 'success');
      
    } catch (error) {
      console.error('Duplicate request error:', error);
      window.SilentStacks.modules.UIController.showNotification(`Failed to duplicate request: ${error.message}`, 'error');
    }
  }

  function deleteSelectedRequests() {
    const selectedRequests = window.SilentStacks.state.selectedRequests;
    
    if (selectedRequests.size === 0) {
      window.SilentStacks.modules.UIController.showNotification('No requests selected', 'warning');
      return;
    }
    
    const confirmMessage = `Delete ${selectedRequests.size} selected request${selectedRequests.size > 1 ? 's' : ''}?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      try {
        const indices = Array.from(selectedRequests);
        window.SilentStacks.modules.DataManager.deleteMultipleRequests(indices);
        
        selectedRequests.clear();
        refreshAllViews();
        
        window.SilentStacks.modules.UIController.showNotification(
          `Successfully deleted ${indices.length} request${indices.length > 1 ? 's' : ''}`, 
          'success'
        );
        
      } catch (error) {
        console.error('Bulk delete error:', error);
        window.SilentStacks.modules.UIController.showNotification(`Failed to delete requests: ${error.message}`, 'error');
      }
    }
  }

  // === Utility Functions ===
  function refreshAllViews() {
    // Refresh all UI components
    window.SilentStacks.modules.UIController.renderStats();
    window.SilentStacks.modules.UIController.renderRequests();
    window.SilentStacks.modules.UIController.renderRecentRequests();
    
    // Re-initialize search if needed
    if (window.SilentStacks.modules.SearchFilter?.initFuse) {
      window.SilentStacks.modules.SearchFilter.initFuse();
    }
  }

  function getRequestSummary(request) {
    const parts = [];
    
    if (request.title) parts.push(request.title);
    if (request.authors) parts.push(`by ${request.authors}`);
    if (request.journal) parts.push(`in ${request.journal}`);
    if (request.year) parts.push(`(${request.year})`);
    if (request.pmid) parts.push(`PMID: ${request.pmid}`);
    if (request.doi) parts.push(`DOI: ${request.doi}`);
    
    return parts.join(' ');
  }

  function formatRequestForDisplay(request) {
    return {
      ...request,
      displayTitle: request.title || 'Untitled Request',
      displayAuthors: request.authors || 'Unknown Authors',
      displayJournal: request.journal || 'Unknown Journal',
      displayYear: request.year || 'Unknown Year',
      displayStatus: request.status ? request.status.replace('-', ' ').toUpperCase() : 'UNKNOWN',
      displayPriority: request.priority ? request.priority.toUpperCase() : 'NORMAL',
      displayTags: Array.isArray(request.tags) ? request.tags.join(', ') : '',
      formattedDate: request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '',
      formattedDateTime: request.createdAt ? new Date(request.createdAt).toLocaleString() : ''
    };
  }

  // === Form State Management ===
  function isFormDirty() {
    const form = document.getElementById('request-form');
    if (!form) return false;
    
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
      if (value.trim()) {
        return true;
      }
    }
    return false;
  }

  function warnIfUnsavedChanges() {
    if (isFormDirty()) {
      return confirm('You have unsaved changes. Are you sure you want to leave this form?');
    }
    return true;
  }

  // === Global Functions for Button Clicks ===
  window.editRequest = editRequest;
  window.deleteRequest = deleteRequest;
  window.duplicateRequest = duplicateRequest;
  window.deleteSelectedRequests = deleteSelectedRequests;

  // === Module Interface ===
  const RequestManager = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing RequestManager...');
      
      // Set up form validation listeners
      setupFormValidation();
      
      console.log('✅ RequestManager initialized');
    },

    // Form management
    populateForm,
    extractFormData,
    validateFormData,
    handleFormSubmit,
    clearForm,

    // Request management
    editRequest,
    deleteRequest,
    duplicateRequest,
    deleteSelectedRequests,

    // Utility functions
    refreshAllViews,
    getRequestSummary,
    formatRequestForDisplay,
    isFormDirty,
    warnIfUnsavedChanges,

    // Constants
    FIELD_MAPPING
  };

  // === Form Validation Setup ===
  function setupFormValidation() {
    // Real-time validation for key fields
    const pmidInput = document.getElementById('pmid');
    const emailInput = document.getElementById('patron-email');
    const yearInput = document.getElementById('year');
    
    if (pmidInput) {
      pmidInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value && !/^\d+$/.test(value)) {
          e.target.setCustomValidity('PMID must be numeric');
        } else {
          e.target.setCustomValidity('');
        }
      });
    }
    
    if (emailInput) {
      emailInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            e.target.setCustomValidity('Please enter a valid email address');
          } else {
            e.target.setCustomValidity('');
          }
        } else {
          e.target.setCustomValidity('');
        }
      });
    }
    
    if (yearInput) {
      yearInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value) {
          const yearNum = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear + 1) {
            e.target.setCustomValidity(`Year must be between 1800 and ${currentYear + 1}`);
          } else {
            e.target.setCustomValidity('');
          }
        } else {
          e.target.setCustomValidity('');
        }
      });
    }
  }

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('RequestManager', RequestManager);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.RequestManager = RequestManager;
  }
})();
