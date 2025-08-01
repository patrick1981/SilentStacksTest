// SilentStacks Search & Filter Module
// Handles Fuse.js search, filtering, and sorting functionality
(() => {
  'use strict';

  // === Module State ===
  let fuse = null;
  let initialized = false;

  // === Fuse.js Configuration ===
  const FUSE_OPTIONS = {
    keys: [
      { name: 'title', weight: 3 },
      { name: 'authors', weight: 2 },
      { name: 'journal', weight: 2 },
      { name: 'tags', weight: 2 },
      { name: 'notes', weight: 1 },
      { name: 'pmid', weight: 2 },
      { name: 'doi', weight: 2 },
      { name: 'patronEmail', weight: 1 },
      { name: 'priority', weight: 1.5 }
    ],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true,
    useExtendedSearch: true
  };

  // === Search Functions ===
  function initFuse() {
    if (!window.Fuse) {
      console.warn('Fuse.js not available, search will be limited');
      return;
    }

    const requests = window.SilentStacks.modules.DataManager.getRequests();
    if (requests.length > 0) {
      fuse = new Fuse(requests, FUSE_OPTIONS);
      console.log('✅ Fuse.js initialized with', requests.length, 'requests');
    } else {
      fuse = null;
      console.log('ℹ️ No requests available for search indexing');
    }
  }

  function performSearch() {
    const filteredRequests = getFilteredRequests();
    window.SilentStacks.modules.UIController.renderRequests();
    
    // Update search results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = `${filteredRequests.length} requests`;
    }
  }

  function getFilteredRequests() {
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    let filteredRequests = [];

    // Get search query
    const searchInput = document.getElementById('search-requests');
    const query = searchInput ? searchInput.value.trim() : '';

    // Apply search filter
    if (query && fuse) {
      const searchResults = fuse.search(query);
      filteredRequests = searchResults.map(result => ({
        request: result.item,
        originalIndex: requests.indexOf(result.item),
        score: result.score
      }));
    } else {
      filteredRequests = requests.map((request, index) => ({
        request: request,
        originalIndex: index,
        score: 0
      }));
    }

    // Apply status filter
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter && statusFilter.value) {
      filteredRequests = filteredRequests.filter(item => 
        item.request.status === statusFilter.value
      );
    }

    // Apply priority filter
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter && priorityFilter.value) {
      filteredRequests = filteredRequests.filter(item => 
        (item.request.priority || 'normal') === priorityFilter.value
      );
    }

    // Apply follow-up filter
    const followupOnly = window.SilentStacks.state.followupOnly;
    if (followupOnly) {
      const settings = window.SilentStacks.modules.DataManager.getSettings();
      const followupThreshold = Date.now() - (settings.followupDays * 24 * 60 * 60 * 1000);
      
      filteredRequests = filteredRequests.filter(item => 
        item.request.status === 'pending' && 
        new Date(item.request.createdAt).getTime() < followupThreshold
      );
    }

    // Apply sorting
    applySorting(filteredRequests);

    return filteredRequests;
  }

  // === Sorting Functions ===
  function applySorting(filteredRequests) {
    const sortField = window.SilentStacks.state.currentSortField;
    const sortDirection = window.SilentStacks.state.currentSortDirection;

    filteredRequests.sort((a, b) => {
      let aVal = a.request[sortField];
      let bVal = b.request[sortField];

      // Handle special cases
      if (sortField === 'createdAt') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else if (sortField === 'priority') {
        // Priority order: urgent > rush > normal
        const priorityOrder = { urgent: 3, rush: 2, normal: 1 };
        aVal = priorityOrder[aVal || 'normal'];
        bVal = priorityOrder[bVal || 'normal'];
      } else if (sortField === 'score') {
        // Search relevance score (lower is better for Fuse.js)
        aVal = a.score || 0;
        bVal = b.score || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      // Handle undefined/null values
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;

      // For search scores, lower is better (more relevant)
      if (sortField === 'score') {
        return sortDirection === 'desc' ? comparison : -comparison;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  function setSortField(field, direction = null) {
    const currentField = window.SilentStacks.state.currentSortField;
    const currentDirection = window.SilentStacks.state.currentSortDirection;

    // Toggle direction if same field, otherwise use provided direction or default to desc
    if (field === currentField && direction === null) {
      window.SilentStacks.state.currentSortDirection = 
        currentDirection === 'desc' ? 'asc' : 'desc';
    } else {
      window.SilentStacks.state.currentSortField = field;
      window.SilentStacks.state.currentSortDirection = direction || 'desc';
    }

    // Update sort button visuals
    updateSortButtons();

    // Re-render with new sort
    performSearch();
  }

  function updateSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    const currentField = window.SilentStacks.state.currentSortField;
    const currentDirection = window.SilentStacks.state.currentSortDirection;

    sortButtons.forEach(btn => {
      const field = btn.getAttribute('data-field');

      // Remove all sort classes
      btn.classList.remove('sort-asc', 'sort-desc');

      // Add appropriate class for current field
      if (field === currentField) {
        btn.classList.add(`sort-${currentDirection}`);
      }
    });
  }

  // === Filter Functions ===
  function toggleFollowupFilter() {
    const followupOnly = window.SilentStacks.state.followupOnly;
    window.SilentStacks.state.followupOnly = !followupOnly;

    const followupBtn = document.getElementById('filter-followup');
    if (followupBtn) {
      followupBtn.classList.toggle('active', window.SilentStacks.state.followupOnly);
      followupBtn.textContent = window.SilentStacks.state.followupOnly ? 'Show All' : 'Follow-up Needed';
    }

    performSearch();
  }

  function clearAllFilters() {
    // Clear search input
    const searchInput = document.getElementById('search-requests');
    if (searchInput) {
      searchInput.value = '';
    }

    // Reset status filter
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
      statusFilter.value = '';
    }

    // Reset priority filter
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) {
      priorityFilter.value = '';
    }

    // Reset follow-up filter
    window.SilentStacks.state.followupOnly = false;
    const followupBtn = document.getElementById('filter-followup');
    if (followupBtn) {
      followupBtn.classList.remove('active');
      followupBtn.textContent = 'Follow-up Needed';
    }

    // Reset sort to default
    window.SilentStacks.state.currentSortField = 'createdAt';
    window.SilentStacks.state.currentSortDirection = 'desc';
    updateSortButtons();

    // Re-render
    performSearch();

    window.SilentStacks.modules.UIController.showNotification('All filters cleared', 'success', 2000);
  }

  // === Advanced Search Functions ===
  function searchByTag(tagName) {
    const searchInput = document.getElementById('search-requests');
    if (searchInput) {
      searchInput.value = tagName;
      performSearch();
    }
  }

  function searchByStatus(status) {
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
      statusFilter.value = status;
      performSearch();
    }
  }

  function searchByPriority(priority) {
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) {
      priorityFilter.value = priority;
      performSearch();
    }
  }

  // === Search Statistics ===
  function getSearchStats() {
    const filteredRequests = getFilteredRequests();
    const allRequests = window.SilentStacks.modules.DataManager.getRequests();

    return {
      total: allRequests.length,
      filtered: filteredRequests.length,
      hasActiveFilters: hasActiveFilters(),
      searchQuery: document.getElementById('search-requests')?.value.trim() || '',
      activeFilters: getActiveFilters()
    };
  }

  function hasActiveFilters() {
    const searchInput = document.getElementById('search-requests');
    const statusFilter = document.getElementById('filter-status');
    const priorityFilter = document.getElementById('priority-filter');
    const followupOnly = window.SilentStacks.state.followupOnly;

    return (searchInput && searchInput.value.trim()) ||
           (statusFilter && statusFilter.value) ||
           (priorityFilter && priorityFilter.value) ||
           followupOnly;
  }

  function getActiveFilters() {
    const filters = [];

    const searchInput = document.getElementById('search-requests');
    if (searchInput && searchInput.value.trim()) {
      filters.push({ type: 'search', value: searchInput.value.trim() });
    }

    const statusFilter = document.getElementById('filter-status');
    if (statusFilter && statusFilter.value) {
      filters.push({ type: 'status', value: statusFilter.value });
    }

    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter && priorityFilter.value) {
      filters.push({ type: 'priority', value: priorityFilter.value });
    }

    if (window.SilentStacks.state.followupOnly) {
      filters.push({ type: 'followup', value: true });
    }

    return filters;
  }

  // === Event Listeners Setup ===
  function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-requests');
    if (searchInput) {
      searchInput.addEventListener('input', performSearch);
    }

    // Filter dropdowns
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', performSearch);
    }

    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) {
      priorityFilter.addEventListener('change', performSearch);
    }

    // Follow-up filter button
    const followupBtn = document.getElementById('filter-followup');
    if (followupBtn) {
      followupBtn.addEventListener('click', toggleFollowupFilter);
    }

    // Sort buttons
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.getAttribute('data-field');
        if (field) {
          setSortField(field);
        }
      });
    });

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
  }

  // === Module Interface ===
  const SearchFilter = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing SearchFilter...');
      
      initFuse();
      setupEventListeners();
      updateSortButtons();
      
      initialized = true;
      console.log('✅ SearchFilter initialized');
    },

    // Core functions
    initFuse,
    performSearch,
    getFilteredRequests,

    // Sorting
    setSortField,
    updateSortButtons,
    applySorting,

    // Filtering
    toggleFollowupFilter,
    clearAllFilters,
    searchByTag,
    searchByStatus,
    searchByPriority,

    // Statistics and utility
    getSearchStats,
    hasActiveFilters,
    getActiveFilters,

    // State check
    isInitialized: () => initialized,
    hasFuse: () => !!fuse,

    // Constants
    FUSE_OPTIONS
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('SearchFilter', SearchFilter);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.SearchFilter = SearchFilter;
  }
})();
