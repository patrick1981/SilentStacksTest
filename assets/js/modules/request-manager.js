// SilentStacks Request Manager Module - v1.2.1 FIXED VERSION
// Enhanced with proper validation, memory management, and performance monitoring

(() => {
  'use strict';

  // === Enhanced Field Mapping ===
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

  // === Enhanced Form Population ===
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
        
        // Trigger validation for the field
        triggerFieldValidation(element);
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

  // === Enhanced Form Validation ===
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
    
    // Enhanced year validation - FIXED to prevent future dates
    if (data.year) {
      const yearNum = parseInt(data.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear + 1) {
        errors.push(`Year must be between 1800 and ${currentYear + 1}`);
      }
    }
    
    // Validate title length
    if (data.title && data.title.length > 500) {
      errors.push('Title must be less than 500 characters');
    }
    
    // Validate notes length
    if (data.notes && data.notes.length > 2000) {
      errors.push('Notes must be less than 2000 characters');
    }
    
    return errors;
  }

  function triggerFieldValidation(element) {
    if (!element) return;
    
    const fieldId = element.id;
    const value = element.value.trim();
    
    // Clear previous validation state
    element.classList.remove('valid', 'invalid');
    
    // Field-specific validation
    switch (fieldId) {
      case 'pmid':
        if (value && !/^\d+$/.test(value)) {
          element.setCustomValidity('PMID must be numeric');
          element.classList.add('invalid');
        } else {
          element.setCustomValidity('');
          if (value) element.classList.add('valid');
        }
        break;
        
      case 'patron-email':
        if (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            element.setCustomValidity('Please enter a valid email address');
            element.classList.add('invalid');
          } else {
            element.setCustomValidity('');
            element.classList.add('valid');
          }
        } else {
          element.setCustomValidity('');
        }
        break;
        
      case 'year':
        if (value) {
          const yearNum = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear + 1) {
            element.setCustomValidity(`Year must be between 1800 and ${currentYear + 1}`);
            element.classList.add('invalid');
          } else {
            element.setCustomValidity('');
            element.classList.add('valid');
          }
        } else {
          element.setCustomValidity('');
        }
        break;
        
      case 'title':
        if (value) {
          if (value.length > 500) {
            element.setCustomValidity('Title must be less than 500 characters');
            element.classList.add('invalid');
          } else {
            element.setCustomValidity('');
            element.classList.add('valid');
          }
        }
        break;
        
      case 'notes':
        if (value && value.length > 2000) {
          element.setCustomValidity('Notes must be less than 2000 characters');
          element.classList.add('invalid');
        } else {
          element.setCustomValidity('');
          if (value) element.classList.add('valid');
        }
        break;
    }
  }

  // === Enhanced Form Handlers ===
  function handleFormSubmit() {
    try {
      const formData = extractFormData();
      
      // Enhanced validation
      const validationErrors = validateFormData(formData);
      if (validationErrors.length > 0) {
        const errorMessage = 'Validation errors:\n• ' + validationErrors.join('\n• ');
        window.SilentStacks.modules.UIController.setStatus(errorMessage, 'error');
        
        // Focus first invalid field
        const firstInvalidField = document.querySelector('.form-control.invalid');
        if (firstInvalidField) {
          firstInvalidField.focus();
        }
        return;
      }
      
      // Check memory usage before large operations
      checkMemoryBeforeOperation();
      
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
      
      // Handle specific error types
      if (error.message.includes('limit exceeded')) {
        handleLimitExceededError(error);
      } else if (error.message.includes('memory')) {
        handleMemoryError(error);
      }
    }
  }

  function clearForm() {
    const form = document.getElementById('request-form');
    if (form) {
      form.reset();
      
      // Clear validation states
      form.querySelectorAll('.form-control').forEach(field => {
        field.classList.remove('valid', 'invalid');
        field.setCustomValidity('');
      });
    }
    
    // Reset current edit state
    window.SilentStacks.state.currentEdit = null;
    
    // Reset progress step if medical features are available
    if (window.SilentStacks.modules.MedicalFeatures?.resetProgress) {
      window.SilentStacks.modules.MedicalFeatures.resetProgress();
    }
    
    window.SilentStacks.modules.UIController.setStatus('Form cleared', 'success');
  }

  function checkMemoryBeforeOperation() {
    if (performance.memory) {
      const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
      
      if (memoryMB > 300) {
        console.log('🧹 High memory usage before operation, performing cleanup...');
        
        if (window.SilentStacks.modules.DataManager.performMemoryCleanup) {
          window.SilentStacks.modules.DataManager.performMemoryCleanup();
        }
      }
    }
  }

  function handleLimitExceededError(error) {
    const message = 'Request limit exceeded. Consider cleaning up old data or increasing limits.';
    
    if (confirm(`${message}\n\nWould you like to clean up old fulfilled requests?`)) {
      // Trigger cleanup if available
      if (window.SilentStacks.modules.DataManager.performStorageCleanup) {
        window.SilentStacks.modules.DataManager.performStorageCleanup();
      }
    }
  }

  function handleMemoryError(error) {
    const message = 'Memory limit reached. The page may need to be refreshed for optimal performance.';
    
    if (confirm(`${message}\n\nRefresh page now? (Your data is automatically saved)`)) {
      window.location.reload();
    }
  }

  // === Enhanced Request Management Functions ===
  function editRequest(index) {
    try {
      const requests = window.SilentStacks.modules.DataManager.getRequests();
      const request = requests[index];
      
      if (!request) {
        throw new Error(`Request at index ${index} not found`);
      }
      
      // Check if user has unsaved changes
      if (isFormDirty() && !warnIfUnsavedChanges()) {
        return;
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
      
      // Focus first input with scroll to view
      setTimeout(() => {
        const firstInput = document.querySelector('#add-request input, #add-request select, #add-request textarea');
        if (firstInput) {
          firstInput.focus();
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      
      // Enhanced confirmation with request details
      const confirmMessage = `Delete "${requestTitle}"?\n\n` +
        `Authors: ${request.authors || 'Unknown'}\n` +
        `Journal: ${request.journal || 'Unknown'}\n` +
        `Status: ${request.status || 'pending'}\n\n` +
        `This action cannot be undone.`;
      
      if (confirm(confirmMessage)) {
        window.SilentStacks.modules.DataManager.deleteRequest(index);
        refreshAllViews();
        window.SilentStacks.modules.UIController.showNotification('Request deleted successfully', 'success');
        
        // Memory cleanup after deletions
        setTimeout(() => {
          if (window.SilentStacks.modules.DataManager.performMemoryCleanup) {
            window.SilentStacks.modules.DataManager.performMemoryCleanup();
          }
        }, 500);
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
    
    const confirmMessage = `Delete ${selectedRequests.size} selected request${selectedRequests.size > 1 ? 's' : ''}?\n\n` +
      `This action cannot be undone.`;
    
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
        
        // Memory cleanup after large deletions
        if (indices.length > 10) {
          setTimeout(() => {
            if (window.SilentStacks.modules.DataManager.performMemoryCleanup) {
              window.SilentStacks.modules.DataManager.performMemoryCleanup();
            }
          }, 1000);
        }
        
      } catch (error) {
        console.error('Bulk delete error:', error);
        window.SilentStacks.modules.UIController.showNotification(`Failed to delete requests: ${error.message}`, 'error');
      }
    }
  }

  // === Enhanced Utility Functions ===
  function refreshAllViews() {
    try {
      // Refresh all UI components
      window.SilentStacks.modules.UIController.renderStats();
      window.SilentStacks.modules.UIController.renderRequests();
      window.SilentStacks.modules.UIController.renderRecentRequests();
      
      // Re-initialize search if needed
      if (window.SilentStacks.modules.SearchFilter?.initFuse) {
        window.SilentStacks.modules.SearchFilter.initFuse();
      }
    } catch (error) {
      console.error('Failed to refresh views:', error);
      window.SilentStacks.modules.UIController.showNotification('Failed to refresh display', 'error');
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

  // === Enhanced Form State Management ===
  function isFormDirty() {
    const form = document.getElementById('request-form');
    if (!form) return false;
    
    // Check if any field has been modified
    const formElements = form.querySelectorAll('input, select, textarea');
    for (const element of formElements) {
      if (element.value && element.value.trim()) {
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

  function setupFormValidation() {
    // Enhanced real-time validation for key fields
    const pmidInput = document.getElementById('pmid');
    const emailInput = document.getElementById('patron-email');
    const yearInput = document.getElementById('year');
    const titleInput = document.getElementById('title');
    const notesInput = document.getElementById('notes');
    
    // Set up event listeners for real-time validation
    [pmidInput, emailInput, yearInput, titleInput, notesInput].forEach(input => {
      if (input) {
        input.addEventListener('input', (e) => triggerFieldValidation(e.target));
        input.addEventListener('blur', (e) => triggerFieldValidation(e.target));
      }
    });
    
    // Form-wide validation
    const form = document.getElementById('request-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        // Validate all fields before submission
        const allFields = form.querySelectorAll('.form-control');
        let hasErrors = false;
        
        allFields.forEach(field => {
          triggerFieldValidation(field);
          if (field.classList.contains('invalid')) {
            hasErrors = true;
          }
        });
        
        if (hasErrors) {
          e.preventDefault();
          window.SilentStacks.modules.UIController.setStatus('Please fix validation errors before submitting', 'error');
        }
      });
    }
  }

  // === Performance Monitoring ===
  function monitorFormPerformance() {
    // Monitor form submission time
    const form = document.getElementById('request-form');
    if (form) {
      form.addEventListener('submit', () => {
        const startTime = performance.now();
        
        setTimeout(() => {
          const endTime = performance.now();
          const submitTime = endTime - startTime;
          
          if (submitTime > 1000) {
            console.warn('Slow form submission:', submitTime, 'ms');
          }
        }, 0);
      });
    }
  }

  // === Global Functions for Button Clicks ===
  window.editRequest = editRequest;
  window.deleteRequest = deleteRequest;
  window.duplicateRequest = duplicateRequest;
  window.deleteSelectedRequests = deleteSelectedRequests;

  // === Enhanced Module Interface ===
  const RequestManager = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing FIXED RequestManager v1.2.1...');
      
      // Set up enhanced form validation
      setupFormValidation();
      
      // Set up performance monitoring
      monitorFormPerformance();
      
      console.log('✅ FIXED RequestManager initialized');
    },

    // Form management
    populateForm,
    extractFormData,
    validateFormData,
    handleFormSubmit,
    clearForm,
    triggerFieldValidation,

    // Request management
    editRequest,
    deleteRequest,
    duplicateRequest,
    deleteSelectedRequests,

    // Enhanced utility functions
    refreshAllViews,
    getRequestSummary,
    formatRequestForDisplay,
    isFormDirty,
    warnIfUnsavedChanges,
    checkMemoryBeforeOperation,

    // Error handling
    handleLimitExceededError,
    handleMemoryError,

    // Constants
    FIELD_MAPPING
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('RequestManager', RequestManager);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.RequestManager = RequestManager;
  }

  console.log('✅ FIXED RequestManager registered successfully');
})();
