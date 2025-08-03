// SilentStacks Request Manager Module v1.4
// Enhanced with MeSH Headings and Clinical Trials Support
(() => {
  'use strict';

  // Enhanced form field mappings for v1.4
  const FORM_FIELDS = {
    // Basic fields
    pmid: 'pmid',
    doi: 'doi', 
    title: 'title',
    authors: 'authors',
    journal: 'journal',
    year: 'year',
    priority: 'priority',
    status: 'status',
    patronEmail: 'patron-email',
    docline: 'docline',
    notes: 'notes',
    
    // NEW v1.4 fields
    publicationType: 'publication-type',
    meshHeadings: 'mesh-headings',
    clinicalTrials: 'clinical-trials'
  };

  let isEditing = false;
  let editingIndex = -1;
  let currentMeshTerms = [];
  let currentClinicalTrials = [];

  // Enhanced form population with MeSH and Clinical Trials
  function populateForm(data) {
    console.log('📝 Populating form with enhanced data:', data);
    
    // Populate basic fields
    Object.entries(FORM_FIELDS).forEach(([dataKey, fieldId]) => {
      if (dataKey === 'meshHeadings' || dataKey === 'clinicalTrials') return; // Handle separately
      
      const element = document.getElementById(fieldId);
      if (element && data[dataKey] !== undefined) {
        element.value = data[dataKey] || '';
      }
    });
    
    // Handle MeSH headings
    if (data.meshHeadings && Array.isArray(data.meshHeadings)) {
      currentMeshTerms = [...data.meshHeadings];
      renderMeshTerms();
      console.log('🏷️ Populated MeSH terms:', currentMeshTerms.length);
    }
    
    // Handle clinical trials
    if (data.clinicalTrials && Array.isArray(data.clinicalTrials)) {
      currentClinicalTrials = [...data.clinicalTrials];
      renderClinicalTrials();
      console.log('🧪 Populated clinical trials:', currentClinicalTrials.length);
    }
    
    // Update publication type display
    if (data.publicationType) {
      const pubTypeElement = document.getElementById('publication-type');
      if (pubTypeElement) {
        pubTypeElement.value = data.publicationType;
      }
    }
  }

  // NEW: Render MeSH terms in the UI
  function renderMeshTerms() {
    const meshList = document.getElementById('mesh-list');
    if (!meshList) return;
    
    const majorOnlyFilter = document.getElementById('mesh-major-only');
    const showMajorOnly = majorOnlyFilter && majorOnlyFilter.checked;
    
    meshList.innerHTML = '';
    
    if (currentMeshTerms.length === 0) {
      meshList.innerHTML = '<div class="mesh-empty">No MeSH terms available</div>';
      return;
    }
    
    const filteredTerms = showMajorOnly 
      ? currentMeshTerms.filter(term => term.majorTopic)
      : currentMeshTerms;
    
    filteredTerms.forEach((meshTerm, index) => {
      const termElement = document.createElement('span');
      termElement.className = `mesh-term ${meshTerm.majorTopic ? 'major-topic' : ''}`;
      termElement.innerHTML = `
        ${meshTerm.term}
        <span class="remove-mesh" data-index="${index}" title="Remove MeSH term">×</span>
      `;
      meshList.appendChild(termElement);
    });
    
    // Add event listeners for remove buttons
    meshList.querySelectorAll('.remove-mesh').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        removeMeshTerm(index);
      });
    });
  }

  // NEW: Add custom MeSH term
  function addCustomMeshTerm(term) {
    if (!term || term.trim() === '') return;
    
    const cleanTerm = term.trim();
    
    // Check if term already exists
    const exists = currentMeshTerms.some(meshTerm => 
      meshTerm.term.toLowerCase() === cleanTerm.toLowerCase()
    );
    
    if (exists) {
      setFormStatus('MeSH term already exists', 'warning');
      return;
    }
    
    // Add new custom term (marked as not major topic)
    currentMeshTerms.push({
      term: cleanTerm,
      majorTopic: false,
      custom: true
    });
    
    renderMeshTerms();
    setFormStatus(`Added MeSH term: ${cleanTerm}`, 'success');
  }

  // NEW: Remove MeSH term
  function removeMeshTerm(index) {
    if (index >= 0 && index < currentMeshTerms.length) {
      const removedTerm = currentMeshTerms.splice(index, 1)[0];
      renderMeshTerms();
      setFormStatus(`Removed MeSH term: ${removedTerm.term}`, 'info');
    }
  }

  // NEW: Clear all MeSH terms
  function clearAllMeshTerms() {
    currentMeshTerms = [];
    renderMeshTerms();
    setFormStatus('All MeSH terms cleared', 'info');
  }

  // NEW: Render clinical trials in the UI
  function renderClinicalTrials() {
    const trialsList = document.getElementById('clinical-trials-list');
    if (!trialsList) return;
    
    trialsList.innerHTML = '';
    
    if (currentClinicalTrials.length === 0) {
      trialsList.innerHTML = '<div class="clinical-trials-empty">No clinical trials associated</div>';
      return;
    }
    
    currentClinicalTrials.forEach((trial, index) => {
      const trialCard = document.createElement('div');
      trialCard.className = 'clinical-trial-card';
      
      // Handle both full trial data and placeholder data
      const isPlaceholder = trial.briefTitle && trial.briefTitle.includes('[QUEUED]');
      
      trialCard.innerHTML = `
        <button class="clinical-trial-remove" data-index="${index}" title="Remove clinical trial">×</button>
        <div class="clinical-trial-header">
          <div class="clinical-trial-nct">${trial.nctNumber || 'Unknown NCT'}</div>
          ${trial.phase ? `<div class="clinical-trial-phase">${trial.phase}</div>` : ''}
        </div>
        <div class="clinical-trial-title">${trial.briefTitle || trial.officialTitle || 'Title not available'}</div>
        <div class="clinical-trial-status">Status: ${trial.status || 'Unknown'}</div>
        <div class="clinical-trial-details">
          ${trial.studyType ? `Study Type: ${trial.studyType}<br>` : ''}
          ${trial.startDate ? `Start Date: ${trial.startDate}<br>` : ''}
          ${trial.completionDate ? `Completion Date: ${trial.completionDate}<br>` : ''}
          ${trial.conditions && trial.conditions.length > 0 ? `Conditions: ${trial.conditions.join(', ')}<br>` : ''}
          ${trial.sponsors && trial.sponsors.length > 0 ? `Sponsors: ${trial.sponsors.map(s => s.name).join(', ')}` : ''}
        </div>
        ${isPlaceholder ? '<div class="clinical-trial-placeholder">⏳ Details will load when online</div>' : ''}
      `;
      
      trialsList.appendChild(trialCard);
    });
    
    // Add event listeners for remove buttons
    trialsList.querySelectorAll('.clinical-trial-remove').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        removeClinicalTrial(index);
      });
    });
  }

  // NEW: Add clinical trial by NCT number
  async function addClinicalTrialByNCT(nctNumber) {
    if (!nctNumber || !nctNumber.match(/^NCT\d{8}$/i)) {
      setFormStatus('Invalid NCT number format. Use NCT followed by 8 digits.', 'error');
      return;
    }
    
    const cleanNCT = nctNumber.toUpperCase();
    
    // Check if trial already exists
    const exists = currentClinicalTrials.some(trial => 
      trial.nctNumber === cleanNCT
    );
    
    if (exists) {
      setFormStatus('Clinical trial already added', 'warning');
      return;
    }
    
    // Show loading status
    setFormStatus(`Looking up clinical trial ${cleanNCT}...`, 'loading');
    
    try {
      // Use the API integration module to fetch trial data
      const trialData = await window.SilentStacks.modules.APIIntegration.fetchClinicalTrial(cleanNCT);
      
      currentClinicalTrials.push(trialData);
      renderClinicalTrials();
      
      setFormStatus(`Added clinical trial: ${cleanNCT}`, 'success');
      
    } catch (error) {
      console.error('Error adding clinical trial:', error);
      setFormStatus(`Failed to add clinical trial: ${error.message}`, 'error');
    }
  }

  // NEW: Remove clinical trial
  function removeClinicalTrial(index) {
    if (index >= 0 && index < currentClinicalTrials.length) {
      const removedTrial = currentClinicalTrials.splice(index, 1)[0];
      renderClinicalTrials();
      setFormStatus(`Removed clinical trial: ${removedTrial.nctNumber}`, 'info');
    }
  }

  // Enhanced form data collection
  function collectFormData() {
    const formData = {};
    
    // Collect basic form fields
    Object.entries(FORM_FIELDS).forEach(([dataKey, fieldId]) => {
      if (dataKey === 'meshHeadings' || dataKey === 'clinicalTrials') return; // Handle separately
      
      const element = document.getElementById(fieldId);
      if (element) {
        formData[dataKey] = element.value.trim();
      }
    });
    
    // Add enhanced fields
    formData.meshHeadings = [...currentMeshTerms];
    formData.clinicalTrials = [...currentClinicalTrials];
    
    // Add metadata
    formData.createdAt = formData.createdAt || new Date().toISOString();
    formData.updatedAt = new Date().toISOString();
    formData.id = formData.id || generateRequestId();
    
    // Handle tags (if tags module is available)
    const tagsContainer = document.querySelector('.selected-tags');
    if (tagsContainer) {
      const tagElements = tagsContainer.querySelectorAll('.tag-item');
      formData.tags = Array.from(tagElements).map(tag => ({
        text: tag.textContent.replace('×', '').trim(),
        color: tag.dataset.color || 'blue'
      }));
    } else {
      formData.tags = formData.tags || [];
    }
    
    return formData;
  }

  // Enhanced form validation
  function validateForm() {
    const errors = [];
    
    // Required field validation
    const title = document.getElementById('title')?.value.trim();
    if (!title) {
      errors.push('Title is required');
    }
    
    // Validate email if provided
    const email = document.getElementById('patron-email')?.value.trim();
    if (email && !isValidEmail(email)) {
      errors.push('Invalid email address format');
    }
    
    // Validate year if provided
    const year = document.getElementById('year')?.value.trim();
    if (year && (!year.match(/^\d{4}$/) || parseInt(year) < 1900 || parseInt(year) > new Date().getFullYear() + 10)) {
      errors.push('Year must be a valid 4-digit year');
    }
    
    // Validate NCT numbers in clinical trials
    for (const trial of currentClinicalTrials) {
      if (trial.nctNumber && !trial.nctNumber.match(/^NCT\d{8}$/)) {
        errors.push(`Invalid clinical trial number: ${trial.nctNumber}`);
      }
    }
    
    return errors;
  }

  // Enhanced form submission
  function submitForm() {
    console.log('📤 Submitting enhanced form...');
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setFormStatus(`Validation errors: ${validationErrors.join(', ')}`, 'error');
      return false;
    }
    
    try {
      const formData = collectFormData();
      console.log('📋 Collected form data:', formData);
      
      // Save or update request
      if (isEditing) {
        updateRequest(editingIndex, formData);
      } else {
        addRequest(formData);
      }
      
      // Reset form
      resetForm();
      
      // Show success message
      const message = isEditing ? 'Request updated successfully' : 'Request added successfully';
      setFormStatus(message, 'success');
      
      // Auto-advance to next step if available
      if (window.SilentStacks.modules.MedicalFeatures?.autoAdvanceStep) {
        window.SilentStacks.modules.MedicalFeatures.autoAdvanceStep(3);
      }
      
      return true;
      
    } catch (error) {
      console.error('Form submission error:', error);
      setFormStatus(`Error saving request: ${error.message}`, 'error');
      return false;
    }
  }

  // Enhanced form reset
  function resetForm() {
    console.log('🔄 Resetting enhanced form...');
    
    // Reset basic form fields
    const form = document.getElementById('request-form');
    if (form) {
      form.reset();
    }
    
    // Reset enhanced data
    currentMeshTerms = [];
    currentClinicalTrials = [];
    
    // Re-render enhanced components
    renderMeshTerms();
    renderClinicalTrials();
    
    // Reset editing state
    isEditing = false;
    editingIndex = -1;
    
    // Clear any status messages
    setFormStatus('', '');
    
    // Reset form button text
    const submitButton = document.getElementById('add-request');
    if (submitButton) {
      submitButton.textContent = 'Add Request';
    }
  }

  // Initialize enhanced event listeners
  function initializeEventListeners() {
    console.log('🎯 Initializing enhanced event listeners...');
    
    // MeSH term input handler
    const meshInput = document.getElementById('mesh-input');
    if (meshInput) {
      meshInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const term = meshInput.value.trim();
          if (term) {
            addCustomMeshTerm(term);
            meshInput.value = '';
          }
        }
      });
    }
    
    // MeSH filter handler
    const meshMajorOnly = document.getElementById('mesh-major-only');
    if (meshMajorOnly) {
      meshMajorOnly.addEventListener('change', renderMeshTerms);
    }
    
    // MeSH clear button
    const meshClear = document.getElementById('mesh-clear');
    if (meshClear) {
      meshClear.addEventListener('click', clearAllMeshTerms);
    }
    
    // Clinical trial NCT input handler
    const nctInput = document.getElementById('nct-input');
    const addNCTButton = document.getElementById('add-nct');
    
    if (nctInput && addNCTButton) {
      const handleNCTAdd = () => {
        const nctNumber = nctInput.value.trim();
        if (nctNumber) {
          addClinicalTrialByNCT(nctNumber);
          nctInput.value = '';
        }
      };
      
      nctInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleNCTAdd();
        }
      });
      
      addNCTButton.addEventListener('click', handleNCTAdd);
    }
    
    // Enhanced form submission
    const submitButton = document.getElementById('add-request');
    if (submitButton) {
      submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        submitForm();
      });
    }
    
    console.log('✅ Enhanced event listeners initialized');
  }

  // Utility functions
  function setFormStatus(message, type = '') {
    if (window.SilentStacks.modules.UIController?.setStatus) {
      window.SilentStacks.modules.UIController.setStatus(message, type);
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function generateRequestId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function addRequest(data) {
    if (window.SilentStacks.modules.DataManager?.addRequest) {
      window.SilentStacks.modules.DataManager.addRequest(data);
    }
  }

  function updateRequest(index, data) {
    if (window.SilentStacks.modules.DataManager?.updateRequest) {
      window.SilentStacks.modules.DataManager.updateRequest(index, data);
    }
  }

  // Enhanced edit request function
  function editRequest(index) {
    console.log('✏️ Editing request with enhanced data:', index);
    
    const requests = window.SilentStacks.modules.DataManager?.getRequests() || [];
    if (index < 0 || index >= requests.length) {
      setFormStatus('Request not found', 'error');
      return;
    }
    
    const request = requests[index];
    
    // Set editing state
    isEditing = true;
    editingIndex = index;
    
    // Populate form with request data
    populateForm(request);
    
    // Update submit button text
    const submitButton = document.getElementById('add-request');
    if (submitButton) {
      submitButton.textContent = 'Update Request';
    }
    
    // Scroll to form
    const form = document.getElementById('request-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
    
    setFormStatus('Editing request - make changes and click Update Request', 'info');
  }

  // Enhanced duplicate request function
  function duplicateRequest(index) {
    console.log('📋 Duplicating request with enhanced data:', index);
    
    const requests = window.SilentStacks.modules.DataManager?.getRequests() || [];
    if (index < 0 || index >= requests.length) {
      setFormStatus('Request not found', 'error');
      return;
    }
    
    const original = requests[index];
    
    // Create duplicate with new ID and timestamp
    const duplicate = {
      ...original,
      id: generateRequestId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: `${original.title} (Copy)`,
      status: 'pending' // Reset status for duplicate
    };
    
    // Deep copy arrays to avoid reference issues
    duplicate.meshHeadings = original.meshHeadings ? [...original.meshHeadings.map(term => ({...term}))] : [];
    duplicate.clinicalTrials = original.clinicalTrials ? [...original.clinicalTrials.map(trial => ({...trial}))] : [];
    duplicate.tags = original.tags ? [...original.tags.map(tag => ({...tag}))] : [];
    
    // Populate form with duplicate data
    populateForm(duplicate);
    
    // Scroll to form
    const form = document.getElementById('request-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth' });
    }
    
    setFormStatus('Request duplicated - review and submit', 'success');
  }

  // Enhanced export functions for CSV/JSON with new fields
  function enhanceExportData(requests) {
    return requests.map(request => ({
      ...request,
      // Flatten MeSH headings for export
      meshHeadingsList: request.meshHeadings ? 
        request.meshHeadings.map(term => `${term.term}${term.majorTopic ? ' (Major)' : ''}`).join('; ') : '',
      meshHeadingsCount: request.meshHeadings ? request.meshHeadings.length : 0,
      meshMajorTopics: request.meshHeadings ? 
        request.meshHeadings.filter(term => term.majorTopic).map(term => term.term).join('; ') : '',
      
      // Flatten clinical trials for export
      clinicalTrialsList: request.clinicalTrials ? 
        request.clinicalTrials.map(trial => trial.nctNumber).join('; ') : '',
      clinicalTrialsCount: request.clinicalTrials ? request.clinicalTrials.length : 0,
      clinicalTrialsDetails: request.clinicalTrials ? 
        request.clinicalTrials.map(trial => `${trial.nctNumber}: ${trial.briefTitle || 'No title'}`).join(' | ') : '',
      
      // Publication type
      publicationType: request.publicationType || ''
    }));
  }

  // Enhanced search functionality to include MeSH and clinical trial data
  function enhanceSearchableContent(request) {
    const searchableFields = [
      request.title,
      request.authors,
      request.journal,
      request.notes,
      request.pmid,
      request.doi,
      request.publicationType
    ];
    
    // Add MeSH terms to searchable content
    if (request.meshHeadings) {
      request.meshHeadings.forEach(term => {
        searchableFields.push(term.term);
      });
    }
    
    // Add clinical trial data to searchable content
    if (request.clinicalTrials) {
      request.clinicalTrials.forEach(trial => {
        searchableFields.push(trial.nctNumber);
        searchableFields.push(trial.briefTitle);
        searchableFields.push(trial.officialTitle);
        if (trial.conditions) {
          searchableFields.push(...trial.conditions);
        }
      });
    }
    
    return searchableFields.filter(Boolean).join(' ').toLowerCase();
  }

  // Filter requests by MeSH terms
  function filterByMeshTerms(requests, meshFilter) {
    if (!meshFilter || meshFilter.trim() === '') return requests;
    
    const filterTerm = meshFilter.toLowerCase().trim();
    
    return requests.filter(request => {
      if (!request.meshHeadings || request.meshHeadings.length === 0) return false;
      
      return request.meshHeadings.some(meshTerm => 
        meshTerm.term.toLowerCase().includes(filterTerm)
      );
    });
  }

  // Filter requests by clinical trial status
  function filterByClinicalTrials(requests, hasTrials = null) {
    if (hasTrials === null) return requests;
    
    return requests.filter(request => {
      const hasAssociatedTrials = request.clinicalTrials && request.clinicalTrials.length > 0;
      return hasTrials ? hasAssociatedTrials : !hasAssociatedTrials;
    });
  }

  // Enhanced statistics calculation
  function calculateEnhancedStats(requests) {
    const stats = {
      total: requests.length,
      withMeshTerms: 0,
      withClinicalTrials: 0,
      totalMeshTerms: 0,
      totalClinicalTrials: 0,
      majorTopicTerms: 0,
      publicationTypes: {},
      clinicalTrialPhases: {}
    };
    
    requests.forEach(request => {
      // MeSH statistics
      if (request.meshHeadings && request.meshHeadings.length > 0) {
        stats.withMeshTerms++;
        stats.totalMeshTerms += request.meshHeadings.length;
        stats.majorTopicTerms += request.meshHeadings.filter(term => term.majorTopic).length;
      }
      
      // Clinical trial statistics
      if (request.clinicalTrials && request.clinicalTrials.length > 0) {
        stats.withClinicalTrials++;
        stats.totalClinicalTrials += request.clinicalTrials.length;
        
        // Count phases
        request.clinicalTrials.forEach(trial => {
          if (trial.phase) {
            stats.clinicalTrialPhases[trial.phase] = (stats.clinicalTrialPhases[trial.phase] || 0) + 1;
          }
        });
      }
      
      // Publication type statistics
      if (request.publicationType) {
        stats.publicationTypes[request.publicationType] = (stats.publicationTypes[request.publicationType] || 0) + 1;
      }
    });
    
    return stats;
  }

  // Module Interface
  const RequestManager = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing Enhanced RequestManager v1.4...');
      
      initializeEventListeners();
      
      // Initialize enhanced UI components
      renderMeshTerms();
      renderClinicalTrials();
      
      console.log('✅ Enhanced RequestManager v1.4 initialized with MeSH and Clinical Trials support');
    },

    // Core functions
    populateForm,
    collectFormData,
    validateForm,
    submitForm,
    resetForm,
    editRequest,
    duplicateRequest,

    // Enhanced data management
    enhanceExportData,
    enhanceSearchableContent,
    filterByMeshTerms,
    filterByClinicalTrials,
    calculateEnhancedStats,

    // MeSH term management
    addCustomMeshTerm,
    removeMeshTerm,
    clearAllMeshTerms,
    renderMeshTerms,
    getCurrentMeshTerms: () => [...currentMeshTerms],

    // Clinical trial management
    addClinicalTrialByNCT,
    removeClinicalTrial,
    renderClinicalTrials,
    getCurrentClinicalTrials: () => [...currentClinicalTrials],

    // State management
    isEditing: () => isEditing,
    getEditingIndex: () => editingIndex,
    
    // Version info
    version: '1.4.0',
    features: ['Enhanced Form Management', 'MeSH Headings', 'Clinical Trials', 'Advanced Validation', 'Enhanced Export']
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('RequestManager', RequestManager);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.RequestManager = RequestManager;
  }
})();
