// assets/js/modules/search-filter.js
// SilentStacks Search & Filter Module v1.5 - FIXED
// Handles search, sorting, filtering, and delete operations

(() => {
  'use strict';

  let fuseInstance = null;
  let selectedRequests = new Set();
  let currentSortField = 'createdAt';
  let currentSortDirection = 'desc';

  const FixedSearchFilter = {
    // Initialize search and filter functionality
    initialize() {
      console.log('🔧 Initializing FIXED Search & Filter v1.5...');
      
      try {
        this.setupEventListeners();
        this.initializeFuse();
        this.setupSortButtons();
        this.setupDeleteFunctionality();
        
        console.log('✅ FIXED Search & Filter v1.5 initialized successfully');
        
      } catch (error) {
        console.error('❌ Search & Filter initialization failed:', error);
      }
    },

    // Set up event listeners
    setupEventListeners() {
      // Search input
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.performSearch(e.target.value);
        });
        console.log('✅ Search input handler attached');
      }

      // Clear search
      const clearSearchBtn = document.getElementById('clear-search');
      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          this.performSearch('');
        });
        console.log('✅ Clear search handler attached');
      }

      // Filter controls
      const statusFilter = document.getElementById('filter-status');
      const priorityFilter = document.getElementById('filter-priority');
      
      if (statusFilter) {
        statusFilter.addEventListener('change', () => this.applyFilters());
      }
      
      if (priorityFilter) {
        priorityFilter.addEventListener('change', () => this.applyFilters());
      }

      // Select all checkbox
      const selectAllCheckbox = document.getElementById('select-all');
      if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
          this.toggleSelectAll(e.target.checked);
        });
        console.log('✅ Select all handler attached');
      }
    },

    // Initialize Fuse.js for fuzzy search
    initializeFuse() {
      const dataManager = window.SilentStacks?.modules?.DataManager;
      if (!dataManager) {
        console.warn('⚠️ DataManager not available for search initialization');
        return;
      }

      const requests = dataManager.getAllRequests();
      
      if (typeof Fuse === 'undefined') {
        console.warn('⚠️ Fuse.js not loaded, using basic search');
        return;
      }

      const fuseOptions = {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'authors', weight: 0.3 },
          { name: 'journal', weight: 0.2 },
          { name: 'pmid', weight: 0.1 },
          { name: 'docline', weight: 0.1 },
          { name: 'notes', weight: 0.1 },
          { name: 'doi', weight: 0.1 }
        ],
        threshold: 0.3,
        includeScore: true,
        includeMatches: true
      };

      fuseInstance = new Fuse(requests, fuseOptions);
      console.log(`🔍 Fuse.js initialized with ${requests.length} requests`);
    },

    // Setup sort buttons with proper event handling
    setupSortButtons() {
      const sortButtons = document.querySelectorAll('.sort-btn');
      
      sortButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const field = e.target.dataset.field;
          if (field) {
            this.setSortField(field);
          }
        });
      });
      
      // Set initial sort state
      this.updateSortButtonsUI();
      console.log('✅ Sort buttons initialized');
    },

    // Setup delete functionality
    setupDeleteFunctionality() {
      // Delete selected button
      const deleteSelectedBtn = document.getElementById('delete-selected');
      if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', () => {
          this.deleteSelectedRequests();
        });
        console.log('✅ Delete selected handler attached');
      }

      // Listen for checkbox changes to update delete button
      document.addEventListener('change', (e) => {
        if (e.target.classList.contains('request-checkbox')) {
          this.handleCheckboxChange(e.target);
        }
      });
    },

    // Perform search with optional query
    performSearch(query = '') {
      const dataManager = window.SilentStacks?.modules?.DataManager;
      if (!dataManager) {
        console.error('DataManager not available for search');
        return;
      }

      let results = [];
      const allRequests = dataManager.getAllRequests();

      if (!query.trim()) {
        // No search query - return all requests
        results = allRequests.map(request => ({ item: request, score: 0 }));
      } else if (fuseInstance) {
        // Use Fuse.js for fuzzy search
        const fuseResults = fuseInstance.search(query);
        results = fuseResults.map(result => ({
          item: result.item,
          score: result.score
        }));
      } else {
        // Fallback basic search
        const lowerQuery = query.toLowerCase();
        results = allRequests.filter(request => 
          Object.values(request).some(value => 
            value && value.toString().toLowerCase().includes(lowerQuery)
          )
        ).map(request => ({ item: request, score: 0 }));
      }

      // Apply current filters
      results = this.applyFiltersToResults(results);

      // Apply current sorting
      results = this.applySortingToResults(results);

      // Update UI
      this.renderResults(results);
      this.updateResultsCount(results.length);

      console.log(`🔍 Search for "${query}" returned ${results.length} results`);
    },

    // Apply filters to search results
    applyFiltersToResults(results) {
      const statusFilter = document.getElementById('filter-status')?.value;
      const priorityFilter = document.getElementById('filter-priority')?.value;

      return results.filter(result => {
        const request = result.item;
        
        // Status filter
        if (statusFilter && statusFilter !== 'all' && request.status !== statusFilter) {
          return false;
        }
        
        // Priority filter  
        if (priorityFilter && priorityFilter !== 'all' && request.priority !== priorityFilter) {
          return false;
        }
        
        return true;
      });
    },

    // Apply current filters (called when filter dropdowns change)
    applyFilters() {
      const searchInput = document.getElementById('search-input');
      const currentQuery = searchInput ? searchInput.value : '';
      this.performSearch(currentQuery);
    },

    // Set sort field and direction
    setSortField(field) {
      if (currentSortField === field) {
        // Toggle direction if same field
        currentSortDirection = currentSortDirection === 'desc' ? 'asc' : 'desc';
      } else {
        // New field, default to desc
        currentSortField = field;
        currentSortDirection = 'desc';
      }

      this.updateSortButtonsUI();
      
      // Re-run current search with new sorting
      const searchInput = document.getElementById('search-input');
      const currentQuery = searchInput ? searchInput.value : '';
      this.performSearch(currentQuery);

      console.log(`📊 Sort changed to ${field} ${currentSortDirection}`);
    },

    // Apply sorting to results
    applySortingToResults(results) {
      return results.sort((a, b) => {
        let aVal = a.item[currentSortField];
        let bVal = b.item[currentSortField];

        // Handle special cases
        if (currentSortField === 'createdAt' || currentSortField === 'updatedAt') {
          aVal = new Date(aVal || 0).getTime();
          bVal = new Date(bVal || 0).getTime();
        } else if (currentSortField === 'priority') {
          const priorityOrder = { urgent: 4, rush: 3, normal: 2, low: 1 };
          aVal = priorityOrder[aVal] || 0;
          bVal = priorityOrder[bVal] || 0;
        } else if (currentSortField === 'score') {
          // For search scores, lower is better (more relevant)
          aVal = a.score || 0;
          bVal = b.score || 0;
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        }

        // Handle null/undefined
        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;

        // For search scores, lower is better
        if (currentSortField === 'score') {
          return currentSortDirection === 'desc' ? comparison : -comparison;
        }

        return currentSortDirection === 'desc' ? -comparison : comparison;
      });
    },

    // Update sort buttons UI
    updateSortButtonsUI() {
      document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('sort-active', 'sort-desc', 'sort-asc');
        
        if (btn.dataset.field === currentSortField) {
          btn.classList.add('sort-active', `sort-${currentSortDirection}`);
        }
      });
    },

    // Render search results
    renderResults(results) {
      const container = document.getElementById('requests-container');
      const noRequestsDiv = document.getElementById('no-requests');
      
      if (!container) {
        console.error('Requests container not found');
        return;
      }

      if (results.length === 0) {
        container.innerHTML = '';
        if (noRequestsDiv) {
          noRequestsDiv.style.display = 'block';
          noRequestsDiv.innerHTML = '<p>No requests found matching your search criteria.</p>';
        }
        return;
      }

      if (noRequestsDiv) {
        noRequestsDiv.style.display = 'none';
      }

      const requestsHtml = results.map(result => 
        this.renderRequestCard(result.item, result.score)
      ).join('');
      
      container.innerHTML = requestsHtml;
      
      // Attach checkbox event listeners
      container.querySelectorAll('.request-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          this.handleCheckboxChange(e.target);
        });
      });

      // Attach delete button event listeners
      container.querySelectorAll('.delete-request-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const requestId = e.target.dataset.requestId;
          if (requestId) {
            this.deleteRequest(requestId);
          }
        });
      });
    },

    // Render individual request card
    renderRequestCard(request, score = 0) {
      const clinicalTrialsIndicator = request.clinicalTrials && request.clinicalTrials.length > 0 
        ? `<span class="clinical-trials-indicator">🧪 ${request.clinicalTrials.length} Clinical Trials</span>` 
        : '';

      return `
        <div class="request-card ${request.priority !== 'normal' ? 'priority-' + request.priority : ''}" 
             data-request-id="${request.id}">
          <div class="request-header">
            <input type="checkbox" class="request-checkbox" data-request-id="${request.id}">
            <div class="request-main">
              <div class="request-title-row">
                <h3 class="request-title nlm-format">${request.title || 'Untitled Request'}</h3>
                <div class="request-badges">
                  ${request.pmid ? `<span class="badge pmid-badge">PMID: ${request.pmid}</span>` : ''}
                  ${request.docline ? `<span class="badge docline-badge">DOCLINE: ${request.docline}</span>` : ''}
                  ${clinicalTrialsIndicator}
                  <span class="badge status-badge status-${request.status}">${this.formatStatus(request.status)}</span>
                  ${request.priority !== 'normal' ? `<span class="badge priority-badge priority-${request.priority}">${this.formatPriority(request.priority)}</span>` : ''}
                </div>
              </div>
              
              ${request.authors ? `<div class="request-authors nlm-format">${request.authors}</div>` : ''}
              
              <div class="request-details">
                ${request.journal ? `<div class="request-journal nlm-format">
                  <strong>Journal:</strong> ${request.journal}${request.year ? ` (${request.year})` : ''}${request.volume ? ` Vol. ${request.volume}` : ''}${request.issue ? ` Issue ${request.issue}` : ''}${request.pages ? ` Pages ${request.pages}` : ''}
                </div>` : ''}
                ${request.doi ? `<div class="request-doi"><strong>DOI:</strong> <a href="https://doi.org/${request.doi}" target="_blank">${request.doi}</a></div>` : ''}
                ${request.patronEmail ? `<div class="request-patron"><strong>Patron:</strong> ${request.patronEmail}</div>` : ''}
                ${request.notes ? `<div class="request-notes"><strong>Notes:</strong> ${request.notes}</div>` : ''}
              </div>
              
              ${request.clinicalTrials && request.clinicalTrials.length > 0 ? `
                <div class="request-clinical-trials">
                  <strong>Associated Clinical Trials:</strong>
                  <ul>
                    ${request.clinicalTrials.map(trial => `<li>${trial.nctNumber}: ${trial.title}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <div class="request-meta">
                <span class="request-date">Created: ${new Date(request.createdAt).toLocaleDateString()}</span>
                ${request.updatedAt !== request.createdAt ? `<span class="request-updated">Updated: ${new Date(request.updatedAt).toLocaleDateString()}</span>` : ''}
                ${score > 0 ? `<span class="search-score">Relevance: ${(100 - score * 100).toFixed(0)}%</span>` : ''}
              </div>
            </div>
            
            <div class="request-actions">
              <button class="btn-action edit-btn" onclick="editRequest('${request.id}')" title="Edit">✏️</button>
              <button class="btn-action delete-btn delete-request-btn" data-request-id="${request.id}" title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      `;
    },

    // Handle checkbox state changes
    handleCheckboxChange(checkbox) {
      const requestId = checkbox.dataset.requestId;
      
      if (checkbox.checked) {
        selectedRequests.add(requestId);
      } else {
        selectedRequests.delete(requestId);
      }
      
      this.updateSelectionUI();
    },

    // Toggle select all checkboxes
    toggleSelectAll(checked) {
      selectedRequests.clear();
      
      document.querySelectorAll('.request-checkbox').forEach(checkbox => {
        checkbox.checked = checked;
        if (checked) {
          selectedRequests.add(checkbox.dataset.requestId);
        }
      });
      
      this.updateSelectionUI();
    },

    // Update selection UI elements
    updateSelectionUI() {
      const selectedCount = selectedRequests.size;
      const deleteBtn = document.getElementById('delete-selected');
      const countSpan = document.getElementById('selected-count');
      
      if (deleteBtn) {
        deleteBtn.disabled = selectedCount === 0;
        deleteBtn.style.display = selectedCount > 0 ? 'inline-block' : 'none';
      }
      
      if (countSpan) {
        countSpan.textContent = selectedCount;
      }

      // Update select all checkbox state
      const selectAllCheckbox = document.getElementById('select-all');
      const allCheckboxes = document.querySelectorAll('.request-checkbox');
      
      if (selectAllCheckbox && allCheckboxes.length > 0) {
        const checkedCount = document.querySelectorAll('.request-checkbox:checked').length;
        selectAllCheckbox.checked = checkedCount === allCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
      }
    },

    // Delete selected requests
    deleteSelectedRequests() {
      if (selectedRequests.size === 0) return;
      
      if (!confirm(`Delete ${selectedRequests.size} selected request(s)? This action cannot be undone.`)) {
        return;
      }

      const dataManager = window.SilentStacks?.modules?.DataManager;
      if (!dataManager) {
        console.error('DataManager not available for deletion');
        return;
      }

      let deletedCount = 0;
      selectedRequests.forEach(requestId => {
        if (dataManager.deleteRequest(requestId)) {
          deletedCount++;
        }
      });

      selectedRequests.clear();
      
      // Update Fuse.js with new data
      this.initializeFuse();
      
      // Refresh current view
      const searchInput = document.getElementById('search-input');
      const currentQuery = searchInput ? searchInput.value : '';
      this.performSearch(currentQuery);
      
      this.updateSelectionUI();
      
      // Show notification
      if (window.SilentStacks?.modules?.UIController?.showNotification) {
        window.SilentStacks.modules.UIController.showNotification(
          `✅ Deleted ${deletedCount} request(s)`, 'success'
        );
      }
      
      console.log(`🗑️ Deleted ${deletedCount} requests`);
    },

    // Delete single request
    deleteRequest(requestId) {
      if (!confirm('Delete this request? This action cannot be undone.')) {
        return;
      }

      const dataManager = window.SilentStacks?.modules?.DataManager;
      if (!dataManager) {
        console.error('DataManager not available for deletion');
        return;
      }

      if (dataManager.deleteRequest(requestId)) {
        selectedRequests.delete(requestId);
        
        // Update Fuse.js with new data
        this.initializeFuse();
        
        // Refresh current view
        const searchInput = document.getElementById('search-input');
        const currentQuery = searchInput ? searchInput.value : '';
        this.performSearch(currentQuery);
        
        this.updateSelectionUI();
        
        // Show notification
        if (window.SilentStacks?.modules?.UIController?.showNotification) {
          window.SilentStacks.modules.UIController.showNotification(
            '✅ Request deleted', 'success'
          );
        }
        
        console.log(`🗑️ Deleted request ${requestId}`);
      } else {
        console.error(`Failed to delete request ${requestId}`);
      }
    },

    // Update results count display
    updateResultsCount(count) {
      const countElement = document.getElementById('results-count');
      if (countElement) {
        countElement.textContent = `${count} request${count !== 1 ? 's' : ''}`;
      }
    },

    // Format status for display
    formatStatus(status) {
      const statusMap = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'fulfilled': 'Fulfilled',
        'cancelled': 'Cancelled',
        'on-hold': 'On Hold'
      };
      return statusMap[status] || status;
    },

    // Format priority for display
    formatPriority(priority) {
      const priorityMap = {
        'low': 'Low',
        'normal': 'Normal',
        'rush': 'Rush',
        'urgent': 'Urgent'
      };
      return priorityMap[priority] || priority;
    },

    // Refresh data and re-initialize search
    refresh() {
      this.initializeFuse();
      const searchInput = document.getElementById('search-input');
      const currentQuery = searchInput ? searchInput.value : '';
      this.performSearch(currentQuery);
      console.log('🔄 Search & Filter refreshed');
    },

    // Public API for external modules
    getSelectedRequestIds() {
      return Array.from(selectedRequests);
    },

    clearSelection() {
      selectedRequests.clear();
      document.querySelectorAll('.request-checkbox').forEach(cb => {
        cb.checked = false;
      });
      this.updateSelectionUI();
    }
  };

  // Export module
  window.SilentStacks = window.SilentStacks || { modules: {} };
  window.SilentStacks.modules.SearchFilter = FixedSearchFilter;

  console.log('🔍 Fixed Search & Filter v1.5 module loaded');

})();