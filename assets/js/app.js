// SilentStacks v1.2.1 - Main Application Orchestrator - FIXED VERSION
// Enhanced with better module loading and error handling
(() => {
  'use strict';
  
  console.log('🚀 Starting SilentStacks v1.2.1 initialization...');
  
  // === Application State ===
  const existingModules = window.SilentStacks?.modules || {};
  
  window.SilentStacks = {
    version: '1.2.1',
    initialized: false,
    modules: existingModules,
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

  // === Enhanced Module Registration System ===
  function registerModule(name, moduleInstance) {
    window.SilentStacks.modules[name] = moduleInstance;
    console.log(`✅ Module registered: ${name}`);
  }

  function waitForModule(moduleName, timeout = 10000) {
    return new Promise((resolve, reject) => {
      console.log(`⏳ Waiting for module: ${moduleName}`);
      
      if (window.SilentStacks.modules[moduleName]) {
        console.log(`✅ Module ${moduleName} already available`);
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (window.SilentStacks.modules[moduleName]) {
          console.log(`✅ Module ${moduleName} loaded successfully`);
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          resolve();
        } else {
          console.log(`⏳ Still waiting for ${moduleName}...`);
        }
      }, 500); // Check every 500ms instead of 100ms

      const timeoutId = setTimeout(() => {
        console.error(`❌ Module ${moduleName} failed to load within ${timeout}ms`);
        clearInterval(checkInterval);
        
        // Check what modules ARE available
        console.log('Available modules:', Object.keys(window.SilentStacks.modules));
        
        reject(new Error(`Module ${moduleName} failed to load within ${timeout}ms`));
      }, timeout);
    });
  }

  // === Enhanced Module Initialization ===
  async function initializeApplication() {
    if (window.SilentStacks.initialized) {
      console.warn('SilentStacks already initialized');
      return;
    }

    console.log('🚀 Initializing SilentStacks v1.2.1...');

    try {
      // Check if any modules are already loaded
      console.log('Checking existing modules:', Object.keys(window.SilentStacks.modules));
      
      // Initialize modules in dependency order with better error handling
      const moduleInitOrder = [
        'DataManager',
        'ThemeManager', 
        'APIIntegration',
        'UIController',
        'RequestManager',
        'SearchFilter',
        'BulkOperations',
        'MedicalFeatures'
      ];

      for (const moduleName of moduleInitOrder) {
        try {
          console.log(`🔧 Initializing ${moduleName}...`);
          await waitForModule(moduleName);
          
          if (window.SilentStacks.modules[moduleName]?.initialize) {
            window.SilentStacks.modules[moduleName].initialize(moduleName === 'UIController' ? elements : undefined);
            console.log(`✅ ${moduleName} initialized successfully`);
          } else {
            console.warn(`⚠️ ${moduleName} has no initialize method`);
          }
        } catch (error) {
          console.error(`❌ Failed to initialize ${moduleName}:`, error);
          
          // Continue with other modules instead of failing completely
          if (['DataManager', 'UIController'].includes(moduleName)) {
            // Critical modules - show error but continue
            showCriticalModuleError(moduleName, error);
          }
        }
      }

      // Set up global event handlers
      setupGlobalEventHandlers();
      setupAccessibilityEnhancements();
      
      // Try to render application
      try {
        renderApplication();
      } catch (renderError) {
        console.error('Render error:', renderError);
        showCriticalError('Failed to render application interface');
      }
      
      window.SilentStacks.initialized = true;
      console.log('✅ SilentStacks initialization complete!');
      
    } catch (error) {
      console.error('❌ SilentStacks initialization failed:', error);
      showCriticalError('Application failed to initialize. Please refresh the page.');
    }
  }

  // === Enhanced Error Handling ===
  function showCriticalModuleError(moduleName, error) {
    console.error(`Critical module ${moduleName} failed:`, error);
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed; top: 20px; left: 20px; right: 20px; z-index: 10000;
      background: #ff6b6b; color: white; padding: 15px; border-radius: 8px;
      font-family: system-ui; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    errorDiv.innerHTML = `
      <strong>⚠️ Module Loading Issue</strong><br>
      ${moduleName} failed to load: ${error.message}<br>
      <button onclick="window.location.reload()" style="margin-top:10px; padding:5px 10px; background:white; color:#ff6b6b; border:none; border-radius:4px; cursor:pointer;">
        Refresh Page
      </button>
    `;
    document.body.appendChild(errorDiv);
  }

  function showCriticalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: #dc3545; color: white; padding: 30px; border-radius: 12px; 
                  z-index: 10000; text-align: center; font-family: system-ui; max-width: 500px;">
        <h3 style="margin: 0 0 15px 0;">⚠️ Critical Error</h3>
        <p style="margin: 0 0 20px 0;">${message}</p>
        <button onclick="window.location.reload()" 
                style="padding: 10px 20px; background: white; color: #dc3545; border: none; 
                       border-radius: 6px; cursor: pointer; font-weight: bold;">
          Refresh Page
        </button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }

  // === Global Event Handlers ===
  function setupGlobalEventHandlers() {
    try {
      // Navigation
      elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          if (window.SilentStacks.modules.UIController?.switchSection) {
            window.SilentStacks.modules.UIController.switchSection(tab);
          }
        });
      });

      // Form handling
      if (elements.form) {
        elements.form.addEventListener('submit', (e) => {
          e.preventDefault();
          if (window.SilentStacks.modules.RequestManager?.handleFormSubmit) {
            window.SilentStacks.modules.RequestManager.handleFormSubmit();
          }
        });
      }

      if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', () => {
          if (window.SilentStacks.modules.RequestManager?.clearForm) {
            window.SilentStacks.modules.RequestManager.clearForm();
          }
        });
      }

      // Search and filters
      if (elements.search) {
        elements.search.addEventListener('input', () => {
          if (window.SilentStacks.modules.SearchFilter?.performSearch) {
            window.SilentStacks.modules.SearchFilter.performSearch();
          }
        });
      }

      // Settings
      const settingsForm = document.getElementById('settings-form');
      if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
          e.preventDefault();
          if (window.SilentStacks.modules.ThemeManager?.saveSettings) {
            window.SilentStacks.modules.ThemeManager.saveSettings();
          }
        });
      }

      // API lookups
      const pmidBtn = document.getElementById('lookup-pmid');
      const doiBtn = document.getElementById('lookup-doi');
      
      if (pmidBtn) pmidBtn.addEventListener('click', () => {
        if (window.SilentStacks.modules.APIIntegration?.lookupPMID) {
          window.SilentStacks.modules.APIIntegration.lookupPMID();
        }
      });
      
      if (doiBtn) doiBtn.addEventListener('click', () => {
        if (window.SilentStacks.modules.APIIntegration?.lookupDOI) {
          window.SilentStacks.modules.APIIntegration.lookupDOI();
        }
      });

      // Import/Export
      if (elements.importFile) {
        elements.importFile.addEventListener('change', (e) => {
          if (window.SilentStacks.modules.BulkOperations?.handleImport) {
            window.SilentStacks.modules.BulkOperations.handleImport(e);
          }
        });
      }

      if (elements.exportCsv) {
        elements.exportCsv.addEventListener('click', () => {
          if (window.SilentStacks.modules.BulkOperations?.exportCSV) {
            window.SilentStacks.modules.BulkOperations.exportCSV();
          }
        });
      }

      if (elements.exportJson) {
        elements.exportJson.addEventListener('click', () => {
          if (window.SilentStacks.modules.BulkOperations?.exportJSON) {
            window.SilentStacks.modules.BulkOperations.exportJSON();
          }
        });
      }

      if (elements.bulkPasteBtn) {
        elements.bulkPasteBtn.addEventListener('click', () => {
          if (window.SilentStacks.modules.BulkOperations?.handleBulkPasteWithLookup) {
            window.SilentStacks.modules.BulkOperations.handleBulkPasteWithLookup();
          }
        });
      }

      console.log('✅ Global event handlers set up');
    } catch (error) {
      console.error('Error setting up event handlers:', error);
    }
  }

  // === Accessibility Enhancements ===
  function setupAccessibilityEnhancements() {
    try {
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

      console.log('✅ Accessibility enhancements applied');
    } catch (error) {
      console.error('Error setting up accessibility:', error);
    }
  }

  // === Rendering & Error Handling ===
  function renderApplication() {
    try {
      if (window.SilentStacks.modules.SearchFilter?.initFuse) {
        window.SilentStacks.modules.SearchFilter.initFuse();
      }
      if (window.SilentStacks.modules.UIController?.renderStats) {
        window.SilentStacks.modules.UIController.renderStats();
      }
      if (window.SilentStacks.modules.UIController?.renderRequests) {
        window.SilentStacks.modules.UIController.renderRequests();
      }
      if (window.SilentStacks.modules.UIController?.renderRecentRequests) {
        window.SilentStacks.modules.UIController.renderRecentRequests();
      }
      console.log('✅ Application rendered successfully');
    } catch (error) {
      console.error('Error rendering application:', error);
      throw error;
    }
  }

  // === Module Status Check ===
  function checkModuleStatus() {
    const requiredModules = [
      'DataManager',
      'ThemeManager', 
      'APIIntegration',
      'UIController',
      'RequestManager',
      'SearchFilter',
      'BulkOperations',
      'MedicalFeatures'
    ];

    console.log('📊 Module Status Check:');
    requiredModules.forEach(moduleName => {
      const module = window.SilentStacks.modules[moduleName];
      if (module) {
        console.log(`✅ ${moduleName}: Loaded`);
      } else {
        console.log(`❌ ${moduleName}: Missing`);
      }
    });

    return requiredModules.filter(name => window.SilentStacks.modules[name]).length;
  }

  // === Enhanced Initialization with Fallbacks ===
  async function initializeWithFallbacks() {
    console.log('🔧 Starting initialization with fallbacks...');
    
    // Wait a bit for scripts to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const loadedModules = checkModuleStatus();
    console.log(`📊 Loaded ${loadedModules}/8 modules`);
    
    if (loadedModules >= 4) {
      // Minimum viable modules available
      console.log('✅ Minimum modules available, proceeding with initialization');
      await initializeApplication();
    } else {
      console.error('❌ Insufficient modules loaded, cannot initialize');
      showCriticalError(
        'Failed to load essential application modules. Please check your internet connection and refresh the page.'
      );
    }
  }

  // === Public API ===
  window.SilentStacks.registerModule = registerModule;
  window.SilentStacks.init = initializeApplication;
  window.SilentStacks.checkStatus = checkModuleStatus;

  // === Auto-Initialize with Enhanced Loading ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWithFallbacks);
  } else {
    // Document already loaded
    initializeWithFallbacks();
  }

  // === Global Error Handler ===
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (event.error.message.includes('SilentStacks')) {
      showCriticalError('Application error detected. Please refresh the page.');
    }
  });

  console.log('✅ Enhanced SilentStacks app.js loaded');
})();
