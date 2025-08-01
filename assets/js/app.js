// SilentStacks v1.2.0 - Main Application Orchestrator
// Coordinates all modules and handles initialization
(() => {
  'use strict';

  // === Application State ===
  window.SilentStacks = {
    version: '1.2.0',
    initialized: false,
    modules: {},
    state: {
      currentEdit: null,
      selectedRequests: new Set(),
      followupOnly: false,
      currentStep: 1,
      totalSteps: 3,
      currentSortField: 'createdAt',
      currentSortDirection: 'desc'
    }
  };

  // === DOM Element Cache ===
  const elements = {
    // Form elements
    form: document.getElementById('request-form'),
    pmidInput: document.getElementById('pmid'),
    doiInput: document.getElementById('doi'),
    titleInput: document.getElementById('title'),
    authorsInput: document.getElementById('authors'),
    journalInput: document.getElementById('journal'),
    yearInput: document.getElementById('year'),
    doclineInput: document.getElementById('docline'),
    patronEmailInput: document.getElementById('patron-email'),
    statusSelect: document.getElementById('status'),
    tagsInput: document.getElementById('tags'),
    notesInput: document.getElementById('notes'),
    clearBtn: document.getElementById('clear-form'),
    
    // Navigation & UI
    navTabs: document.querySelectorAll('.nav-tab'),
    sections: document.querySelectorAll('.section'),
    search: document.getElementById('search-requests'),
    statusFilter: document.getElementById('filter-status'),
    priorityFilter: document.getElementById('priority-filter'),
    followupFilter: document.getElementById('filter-followup'),
    requestList: document.getElementById('request-list'),
    recentRequests: document.getElementById('recent-requests'),
    
    // Import/Export
    importFile: document.getElementById('import-file'),
    exportCsv: document.getElementById('export-csv'),
    exportJson: document.getElementById('export-json'),
    bulkPasteBtn: document.getElementById('bulk-paste-btn'),
    
    // Settings
    followupDays: document.getElementById('followup-days'),
    theme: document.getElementById('theme'),
    apiKey: document.getElementById('api-key'),
    crossrefEmail: document.getElementById('crossref-email'),
    
    // Stats & Status
    stats: {
      total: document.getElementById('total-requests'),
      pending: document.getElementById('pending-requests'),
      fulfilled: document.getElementById('fulfilled-requests'),
      followup: document.getElementById('followup-requests')
    },
    status: document.getElementById('lookup-status')
  };

  // === Module Registration System ===
  function registerModule(name, moduleInstance) {
    window.SilentStacks.modules[name] = moduleInstance;
    console.log(`✅ Module registered: ${name}`);
  }

  function waitForModule(moduleName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (window.SilentStacks.modules[moduleName]) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (window.SilentStacks.modules[moduleName]) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          resolve();
        }
      }, 100);

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`Module ${moduleName} failed to load within ${timeout}ms`));
      }, timeout);
    });
  }

  // === Core Initialization ===
  async function initializeApplication() {
    if (window.SilentStacks.initialized) {
      console.warn('SilentStacks already initialized');
      return;
    }

    console.log('🚀 Initializing SilentStacks v1.2.0...');

    try {
      // Initialize modules in dependency order
      await waitForModule('DataManager');
      window.SilentStacks.modules.DataManager.initialize();
      
      await waitForModule('ThemeManager');
      window.SilentStacks.modules.ThemeManager.initialize();
      
      await waitForModule('APIIntegration');
      window.SilentStacks.modules.APIIntegration.initialize();
      
      await waitForModule('UIController');
      window.SilentStacks.modules.UIController.initialize(elements);
      
      await waitForModule('RequestManager');
      window.SilentStacks.modules.RequestManager.initialize();
      
      await waitForModule('SearchFilter');
      window.SilentStacks.modules.SearchFilter.initialize();
      
      await waitForModule('BulkOperations');
      window.SilentStacks.modules.BulkOperations.initialize();
      
      await waitForModule('MedicalFeatures');
      window.SilentStacks.modules.MedicalFeatures.initialize();

      setupGlobalEventHandlers();
      setupAccessibilityEnhancements();
      renderApplication();
      
      window.SilentStacks.initialized = true;
      console.log('✅ SilentStacks initialization complete!');
      
    } catch (error) {
      console.error('❌ SilentStacks initialization failed:', error);
      showCriticalError('Application failed to initialize. Please refresh the page.');
    }
  }

  // === Global Event Handlers ===
  function setupGlobalEventHandlers() {
    // Navigation
    elements.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        window.SilentStacks.modules.UIController.switchSection(tab);
      });
    });

    // Form handling
    if (elements.form) {
      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        window.SilentStacks.modules.RequestManager.handleFormSubmit();
      });
    }

    if (elements.clearBtn) {
      elements.clearBtn.addEventListener('click', () => {
        window.SilentStacks.modules.RequestManager.clearForm();
      });
    }

    // Search and filters
    if (elements.search) {
      elements.search.addEventListener('input', () => {
        window.SilentStacks.modules.SearchFilter.performSearch();
      });
    }

    // Settings
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        window.SilentStacks.modules.ThemeManager.saveSettings();
      });
    }

    // API lookups
    const pmidBtn = document.getElementById('lookup-pmid');
    const doiBtn = document.getElementById('lookup-doi');
    
    if (pmidBtn) pmidBtn.addEventListener('click', () => {
      window.SilentStacks.modules.APIIntegration.lookupPMID();
    });
    
    if (doiBtn) doiBtn.addEventListener('click', () => {
      window.SilentStacks.modules.APIIntegration.lookupDOI();
    });

    // Import/Export
    if (elements.importFile) {
      elements.importFile.addEventListener('change', (e) => {
        window.SilentStacks.modules.BulkOperations.handleImport(e);
      });
    }

    if (elements.exportCsv) {
      elements.exportCsv.addEventListener('click', () => {
        window.SilentStacks.modules.BulkOperations.exportCSV();
      });
    }

    if (elements.exportJson) {
      elements.exportJson.addEventListener('click', () => {
        window.SilentStacks.modules.BulkOperations.exportJSON();
      });
    }

    if (elements.bulkPasteBtn) {
      elements.bulkPasteBtn.addEventListener('click', () => {
        window.SilentStacks.modules.BulkOperations.handleBulkPasteWithLookup();
      });
    }
  }

  // === Accessibility Enhancements ===
  function setupAccessibilityEnhancements() {
    // Add ARIA labels to buttons without them
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      if (btn.textContent.trim()) {
        btn.setAttribute('aria-label', btn.textContent.trim());
      }
    });
    
    // Add role attributes
    elements.navTabs.forEach(tab => tab.setAttribute('role', 'tab'));
    elements.sections.forEach(section => section.setAttribute('role', 'tabpanel'));
    
    // Add skip navigation
    if (!document.getElementById('skip-nav')) {
      const skipNav = document.createElement('a');
      skipNav.id = 'skip-nav';
      skipNav.href = '#main-content';
      skipNav.textContent = 'Skip to main content';
      skipNav.className = 'sr-only';
      document.body.insertBefore(skipNav, document.body.firstChild);
    }
  }

  // === Rendering & Error Handling ===
  function renderApplication() {
    window.SilentStacks.modules.SearchFilter.initFuse();
    window.SilentStacks.modules.UIController.renderStats();
    window.SilentStacks.modules.UIController.renderRequests();
    window.SilentStacks.modules.UIController.renderRecentRequests();
  }

  function showCriticalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: #dc3545; color: white; padding: 20px; border-radius: 8px; 
                  z-index: 10000; text-align: center;">
        <h3>⚠️ Critical Error</h3>
        <p>${message}</p>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }

  // === Public API ===
  window.SilentStacks.registerModule = registerModule;
  window.SilentStacks.init = initializeApplication;

  // === Auto-Initialize ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
  } else {
    initializeApplication();
  }
})();
