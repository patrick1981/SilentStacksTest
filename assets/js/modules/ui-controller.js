// SilentStacks UI Controller Module
// Handles DOM manipulation, rendering, navigation, and user feedback
(() => {
  'use strict';

  // === Module State ===
  let elements = {};
  let initialized = false;

  // Build element cache if none provided
  function buildDefaultElements() {
    const el = {};
    el.navTabs = Array.from(document.querySelectorAll('.nav-tab'));
    el.sections = Array.from(document.querySelectorAll('.section'));
    el.stats = document.getElementById('stats-summary') || document.querySelector('.stats-summary');
    el.requestList = document.getElementById('request-list') || document.querySelector('.request-list');
    el.recentRequests = document.getElementById('recent-requests') || document.querySelector('#recent-requests, .recent-requests');
    el.status = document.querySelector('.lookup-status, .status-message, #lookup-status') || null;
    return el;
  }

  // === Navigation Functions (FIXED VERSION) ===
  function switchSection(tabEl) {
    if (!tabEl || !tabEl.dataset.section) return;
    
    console.log('🔄 Switching to section:', tabEl.dataset.section);
    
    // Ensure elements are available
    if (!elements || !elements.navTabs || !elements.sections) {
      elements = buildDefaultElements();
    }
    
    // Update navigation tabs
    elements.navTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    
    // Update sections
    elements.sections.forEach(s => {
      s.classList.remove('active');
      s.setAttribute('aria-hidden', 'true');
    });
    
    // Activate clicked tab
    tabEl.classList.add('active');
    tabEl.setAttribute('aria-selected', 'true');
    
    // Activate corresponding section
    const targetSection = document.getElementById(tabEl.dataset.section);
    if (targetSection) {
      targetSection.classList.add('active');
      targetSection.setAttribute('aria-hidden', 'false');
      
      // Dispatch section activation event for other modules
      const sectionEvent = new CustomEvent('section:activated', {
        detail: { 
          id: tabEl.dataset.section, 
          section: targetSection,
          tab: tabEl
        }
      });
      document.dispatchEvent(sectionEvent);
      
      console.log('✅ Section activated:', tabEl.dataset.section);
    } else {
      console.warn('⚠️ Target section not found:', tabEl.dataset.section);
    }
    
    // Announce section change for accessibility
    announceSectionChange(tabEl.dataset.section);
  }

  function announceSectionChange(sectionId) {
    const sectionNames = {
      'dashboard': 'Dashboard',
      'add-request': 'Add Request',
      'all-requests': 'All Requests',
      'import-export': 'Import & Export',
      'settings': 'Settings'
    };
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Switched to ${sectionNames[sectionId] || sectionId} section`;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // === Clean Tab Handler Setup ===
  function setupTabHandlers() {
    console.log('🔧 Setting up clean tab handlers...');
    
    // Remove any existing handlers by cloning nodes
    elements.navTabs.forEach(tab => {
      const newTab = tab.cloneNode(true);
      tab.parentNode.replaceChild(newTab, tab);
    });
    
    // Rebuild elements cache with new nodes
    elements.navTabs = Array.from(document.querySelectorAll('.nav-tab'));
    
    // Attach single, clean event handler to each tab
    elements.navTabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        switchSection(this);
      });
    });
    
    console.log('✅ Clean tab handlers attached to', elements.navTabs.length, 'tabs');
  }

  // === Status and Feedback Functions ===
  function setStatus(message, type = '') {
    if (!elements || Object.keys(elements).length === 0) {
      elements = buildDefaultElements();
    }

    if (!elements.status) {
      // create a status element
      const statusEl = document.createElement('div');
      statusEl.className = 'lookup-status';
      statusEl.setAttribute('role', 'status');
      statusEl.style.marginTop = '0.5rem';

      const form = document.getElementById('request-form');
      if (form) {
        form.appendChild(statusEl);
      } else {
        const container = document.querySelector('.section[data-section="add-request"], body');
        (container || document.body).appendChild(statusEl);
      }
      elements.status = statusEl;
    }

    elements.status.textContent = message;
    elements.status.className = ['lookup-status', type].filter(Boolean).join(' ');

    if (type === 'success') {
      setTimeout(() => {
        if (elements.status && elements.status.textContent === message) {
          elements.status.textContent = '';
          elements.status.className = 'lookup-status';
        }
      }, 5000);
    }
  }

  function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 15px 20px;
      background: ${getNotificationColor(type)};
      color: white;
      border-radius: 8px;
      font-size: 0.9rem;
      max-width: 350px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, duration);
  }

  function getNotificationColor(type) {
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    return colors[type] || colors.info;
  }

  // === Rendering Functions ===
  function renderStats() {
    if (!elements.stats) return;
    
    const stats = window.SilentStacks.modules.DataManager.getStats();
    
    if (elements.stats.total) elements.stats.total.textContent = stats.total;
    if (elements.stats.pending) elements.stats.pending.textContent = stats.pending;
    if (elements.stats.fulfilled) elements.stats.fulfilled.textContent = stats.fulfilled;
    if (elements.stats.followup) elements.stats.followup.textContent = stats.followup;
  }

  function renderRequests() {
    if (!elements.requestList) return;
    
    const filteredRequests = window.SilentStacks.modules.SearchFilter.getFilteredRequests();
    const selectedRequests = window.SilentStacks.state.selectedRequests;
    
    if (filteredRequests.length === 0) {
      elements.requestList.innerHTML = '<p class="empty-message">No requests found</p>';
      updateSelectAllState();
      return;
    }
    
    elements.requestList.innerHTML = filteredRequests
      .map(item => createRequestCard(item.request, item.originalIndex))
      .join('');
    
    updateSelectAllState();
  }

  function renderRecentRequests() {
    if (!elements.recentRequests) return;
    
    const requests = window.SilentStacks.modules.DataManager.getRequests();
    const recentRequests = requests.slice(0, 5);
    
    if (recentRequests.length === 0) {
      elements.recentRequests.innerHTML = '<p class="empty-message">No recent requests</p>';
      return;
    }
    
    elements.recentRequests.innerHTML = recentRequests
      .map((r, index) => createRecentRequestCard(r, index))
      .join('');
  }

  function createRequestCard(request, originalIndex) {
    const globalTags = window.SilentStacks.modules.DataManager.getGlobalTags();
    const selectedRequests = window.SilentStacks.state.selectedRequests;
    const settings = window.SilentStacks.modules.DataManager.getSettings();
    
    // Generate tags HTML
    const tags = (request.tags || []).map(t => {
      const tagColor = globalTags.get(t) || 'default';
      return `<span class="tag tag-color-${tagColor} tag-colorable" 
                    onclick="openTagColorPicker('${t}', this)" 
                    title="Click to change color">${t}</span>`;
    }).join('');
    
    // Check if follow-up is needed
    const needsFollowUp = request.status === 'pending' && 
      settings.followupDays && 
      (Date.now() - new Date(request.createdAt)) / 86400000 > settings.followupDays;
    
    const followupCls = needsFollowUp ? ' needs-followup' : '';
    const selectedCls = selectedRequests.has(originalIndex) ? ' selected' : '';
    const createdDate = request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '';
    const priorityBadge = request.priority ? 
      `<span class="priority-badge ${request.priority}">${request.priority.toUpperCase()}</span>` : '';
    
    // Priority indicator for visual scanning
    const priorityIndicator = request.priority ? 
      `<div class="priority-indicator ${request.priority}" 
            title="${request.priority.toUpperCase()} Priority" 
            aria-label="${request.priority} priority"></div>` : 
      '<div class="priority-indicator normal" title="Normal Priority" aria-label="normal priority"></div>';
    
    return `
      <div class="request-card${followupCls}${selectedCls}" data-index="${originalIndex}" style="position: relative;">
        ${priorityIndicator}
        <div class="request-header">
          <div class="request-checkbox">
            <input type="checkbox" ${selectedRequests.has(originalIndex) ? 'checked' : ''} 
                   onchange="toggleRequestSelection(${originalIndex}, this.checked)"
                   aria-label="Select request">
          </div>
          <div class="request-main">
            <div class="request-title">${request.title || 'Untitled'} ${priorityBadge}</div>
            <div class="request-meta">
              ${request.authors || ''} • ${request.journal || ''} (${request.year || ''})
              ${request.pmid ? ` • PMID: ${request.pmid}` : ''}
              ${request.doi ? ` • DOI: ${request.doi}` : ''}
            </div>
            <div class="request-details">
              ${request.patronEmail ? `👤 ${request.patronEmail}` : ''}
              ${createdDate ? ` • 📅 ${createdDate}` : ''}
              ${needsFollowUp ? ' • ⚠️ Follow-up needed' : ''}
            </div>
          </div>
          <div class="request-status-container">
            <select class="request-status-select status-${request.status}" 
                    onchange="quickStatusChange(${originalIndex}, this.value)" 
                    value="${request.status}"
                    aria-label="Change request status">
              <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="in-progress" ${request.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="fulfilled" ${request.status === 'fulfilled' ? 'selected' : ''}>Fulfilled</option>
              <option value="cancelled" ${request.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>
        ${tags ? `<div class="request-tags">${tags}</div>` : ''}
        ${request.notes ? `<div class="request-notes">📝 ${request.notes}</div>` : ''}
        <div class="request-actions">
          <button onclick="duplicateRequest(${originalIndex})" class="btn btn-secondary btn-small" 
                  aria-label="Duplicate request">📋 Duplicate</button>
          <button onclick="editRequest(${originalIndex})" class="btn btn-secondary btn-small" 
                  aria-label="Edit request">✏️ Edit</button>
          <button onclick="deleteRequest(${originalIndex})" class="btn btn-secondary btn-small" 
                  aria-label="Delete request">🗑️ Delete</button>
        </div>
      </div>
    `;
  }

  function createRecentRequestCard(request, index) {
    const createdDate = request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '';
    const priorityBadge = request.priority ? 
      `<span class="priority-badge ${request.priority}">${request.priority.toUpperCase()}</span>` : '';
    
    return `
      <div class="recent-request-card">
        <div class="recent-title">${request.title || 'Untitled'} ${priorityBadge}</div>
        <div class="recent-meta">
          ${request.authors || ''} • ${request.journal || ''} (${request.year || ''})
          ${createdDate ? ` • ${createdDate}` : ''}
        </div>
        <div class="recent-status status-${request.status}">
          ${request.status.replace('-', ' ').toUpperCase()}
        </div>
      </div>
    `;
  }

  // === Selection Management ===
  function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all');
    const deleteBtn = document.getElementById('delete-selected-btn');
    const visibleCards = document.querySelectorAll('.request-card[data-index]');
    const selectedRequests = window.SilentStacks.state.selectedRequests;
    
    const visibleCount = visibleCards.length;
    let selectedVisibleCount = 0;
    
    visibleCards.forEach(card => {
      const index = parseInt(card.dataset.index);
      if (selectedRequests.has(index)) {
        selectedVisibleCount++;
      }
    });
    
    if (selectAllCheckbox) {
      if (selectedVisibleCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else if (selectedVisibleCount === visibleCount) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      }
    }
    
    // Show/hide delete button
    if (deleteBtn) {
      deleteBtn.style.display = selectedRequests.size > 0 ? 'inline-flex' : 'none';
    }
    
    // Update results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = `${visibleCount} requests`;
      if (selectedRequests.size > 0) {
        resultsCount.textContent += ` (${selectedRequests.size} selected)`;
      }
    }
  }

  // === Progress Indicators ===
  function updateProgress(progressDiv, percentage, message, isError = false) {
    if (!progressDiv) return;
    
    const progressFill = progressDiv.querySelector('.progress-bar-fill');
    const progressText = progressDiv.querySelector('.progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
      
      // Change color based on status
      if (isError) {
        progressFill.style.background = 'var(--danger-color)';
      } else if (percentage >= 100) {
        progressFill.style.background = 'var(--success-color)';
      } else {
        progressFill.style.background = 'var(--primary-color)';
      }
    }
    
    if (progressText) {
      progressText.textContent = message;
      
      // Update text color for errors
      if (isError) {
        progressText.style.color = 'var(--danger-color)';
      } else if (percentage >= 100) {
        progressText.style.color = 'var(--success-color)';
      } else {
        progressText.style.color = 'var(--text-secondary)';
      }
    }
  }

  function createProgressIndicator(id, parentElement) {
    const progressDiv = document.createElement('div');
    progressDiv.id = id;
    progressDiv.innerHTML = `
      <div class="progress-container">
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
        <div class="progress-text">Initializing...</div>
      </div>
    `;
    
    if (parentElement) {
      parentElement.appendChild(progressDiv);
    }
    
    return progressDiv;
  }

  // === Global Functions for Button Clicks ===
  window.toggleRequestSelection = (index, checked) => {
    const selectedRequests = window.SilentStacks.state.selectedRequests;
    
    if (checked) {
      selectedRequests.add(index);
    } else {
      selectedRequests.delete(index);
    }
    
    renderRequests();
  };

  window.toggleSelectAll = (checked) => {
    const visibleCards = document.querySelectorAll('.request-card[data-index]');
    const selectedRequests = window.SilentStacks.state.selectedRequests;
    
    if (checked) {
      visibleCards.forEach(card => {
        const index = parseInt(card.dataset.index);
        selectedRequests.add(index);
      });
    } else {
      selectedRequests.clear();
    }
    
    renderRequests();
  };

window.quickStatusChange = (index, newStatus) => {
    try {
      window.SilentStacks.modules.DataManager.updateRequest(index, { status: newStatus });
      renderStats();
      
      // Update the visual status immediately
      const statusSelect = document.querySelector(`[data-index="${index}"] .request-status-select`);
      if (statusSelect) {
        // Remove all status classes
        statusSelect.classList.remove('status-pending', 'status-in-progress', 'status-fulfilled', 'status-cancelled');
        // Add new status class
        statusSelect.classList.add(`status-${newStatus}`);
      }
      
      showNotification(`Request status updated to ${newStatus}`, 'success', 2000);
    } catch (error) {  // <-- REMOVED THE COMMA HERE
      console.error('Failed to update request status:', error);
      showNotification('Failed to update request status', 'error');
    }

  // === Module Interface ===
  const UIController = {
    // Initialization
    initialize(elementCache) {
      console.log('🔧 Initializing UIController...');
      
      // Build element cache
      elements = elementCache && Object.keys(elementCache).length ? elementCache : buildDefaultElements();
      
      // Attach clean tab handlers
      setupTabHandlers();
      
      initialized = true;
      console.log('✅ UIController initialized with', elements.navTabs.length, 'tabs');
    },

    // Navigation
    switchSection,

    // Status and feedback
    setStatus,
    showNotification,

    // Rendering
    renderStats,
    renderRequests,
    renderRecentRequests,
    updateSelectAllState,

    // Progress indicators
    updateProgress,
    createProgressIndicator,

    // Utility
    isInitialized: () => initialized,
    getElements: () => elements,
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('UIController', UIController);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.UIController = UIController;
  }
})();