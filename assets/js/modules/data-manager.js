// SilentStacks Data Manager Module - FULL DEBUG VERSION
// Handles all localStorage persistence, data loading/saving, and state management

console.log('🔧 DataManager script starting execution...');

try {
  'use strict';
  console.log('✅ Strict mode applied');

  // === Default Settings ===
  const DEFAULT_SETTINGS = {
    followupDays: 5,
    theme: 'light',
    apiKey: '',
    crossrefEmail: ''
  };
  console.log('✅ Default settings defined');

  // === Module State ===
  let settings = { ...DEFAULT_SETTINGS };
  let requests = [];
  let globalTags = new Map();
  console.log('✅ Module state initialized');

  // === Storage Keys ===
  const STORAGE_KEYS = {
    SETTINGS: 'silentstacks_settings',
    REQUESTS: 'silentstacks_requests',
    TAGS: 'silentstacks_tags',
    API_QUEUE: 'silentstacks_api_queue'
  };
  console.log('✅ Storage keys defined');

  // === Data Loading Functions ===
  function loadSettings() {
    try {
      console.log('🔧 Loading settings...');
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
      console.log('✅ Settings loaded:', Object.keys(settings).length, 'keys');
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
      settings = { ...DEFAULT_SETTINGS };
    }
  }

  function loadRequests() {
    try {
      console.log('🔧 Loading requests...');
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      requests = saved ? JSON.parse(saved) : [];
      console.log('✅ Requests loaded:', requests.length, 'items');
    } catch (error) {
      console.warn('Failed to load requests:', error);
      requests = [];
    }
  }

  function loadGlobalTags() {
    try {
      console.log('🔧 Loading global tags...');
      const saved = localStorage.getItem(STORAGE_KEYS.TAGS);
      if (saved) {
        const tagsArray = JSON.parse(saved);
        globalTags = new Map(tagsArray);
      }
      console.log('✅ Global tags loaded:', globalTags.size, 'tags');
    } catch (error) {
      console.warn('Failed to load tags:', error);
      globalTags = new Map();
    }
  }

  // === Data Saving Functions ===
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      console.log('✅ Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings to localStorage');
    }
  }

  function saveRequests() {
    try {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
      console.log('✅ Requests saved:', requests.length, 'items');
    } catch (error) {
      console.error('Failed to save requests:', error);
      throw new Error('Failed to save requests to localStorage');
    }
  }

  function saveGlobalTags() {
    try {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify([...globalTags]));
      console.log('✅ Global tags saved:', globalTags.size, 'tags');
    } catch (error) {
      console.error('Failed to save tags:', error);
      throw new Error('Failed to save tags to localStorage');
    }
  }

  function saveAll() {
    try {
      saveSettings();
      saveRequests();
      saveGlobalTags();
      console.log('✅ All data saved successfully');
    } catch (error) {
      console.error('Failed to save data:', error);
      // Show user-friendly error
      if (window.SilentStacks?.modules?.UIController?.setStatus) {
        window.SilentStacks.modules.UIController.setStatus('Failed to save data', 'error');
      }
    }
  }

  // === Data Access Functions ===
  function getSettings() {
    return { ...settings };
  }

  function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    saveSettings();
  }

  function getRequests() {
    return [...requests];
  }

  function addRequest(request) {
    // Ensure required fields
    const newRequest = {
      pmid: '',
      doi: '',
      title: '',
      authors: '',
      journal: '',
      year: '',
      docline: '',
      patronEmail: '',
      status: 'pending',
      priority: 'normal',
      tags: [],
      notes: '',
      createdAt: new Date().toISOString(),
      ...request
    };
    
    requests.unshift(newRequest);
    saveRequests();
    return newRequest;
  }

  function updateRequest(index, updatedRequest) {
    if (index >= 0 && index < requests.length) {
      requests[index] = {
        ...requests[index],
        ...updatedRequest,
        updatedAt: new Date().toISOString()
      };
      saveRequests();
      return requests[index];
    }
    throw new Error(`Invalid request index: ${index}`);
  }

  function deleteRequest(index) {
    if (index >= 0 && index < requests.length) {
      const deleted = requests.splice(index, 1)[0];
      saveRequests();
      return deleted;
    }
    throw new Error(`Invalid request index: ${index}`);
  }

  function deleteMultipleRequests(indices) {
    // Sort indices in descending order to avoid index shifting issues
    const sortedIndices = [...indices].sort((a, b) => b - a);
    const deletedRequests = [];
    
    sortedIndices.forEach(index => {
      if (index >= 0 && index < requests.length) {
        deletedRequests.push(requests.splice(index, 1)[0]);
      }
    });
    
    saveRequests();
    return deletedRequests;
  }

  function bulkAddRequests(newRequests) {
    const validRequests = newRequests.filter(req => 
      req.title || req.pmid || req.doi
    );
    
    requests.push(...validRequests);
    saveRequests();
    return validRequests.length;
  }

  // === Tag Management ===
  function getGlobalTags() {
    return new Map(globalTags);
  }

  function setTagColor(tagName, colorId) {
    globalTags.set(tagName, colorId);
    saveGlobalTags();
  }

  function addTagsFromRequest(tags) {
    let newTags = 0;
    tags.forEach(tag => {
      if (!globalTags.has(tag)) {
        globalTags.set(tag, 'default');
        newTags++;
      }
    });
    
    if (newTags > 0) {
      saveGlobalTags();
    }
    
    return newTags;
  }

  // === Statistics ===
  function getStats() {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in-progress').length,
      fulfilled: requests.filter(r => r.status === 'fulfilled').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
      followup: 0
    };

    // Calculate follow-up needed
    if (settings.followupDays) {
      const followupThreshold = Date.now() - (settings.followupDays * 24 * 60 * 60 * 1000);
      stats.followup = requests.filter(r => 
        r.status === 'pending' && 
        new Date(r.createdAt).getTime() < followupThreshold
      ).length;
    }

    return stats;
  }

  // === Data Validation ===
  function validateRequest(request) {
    const errors = [];
    
    if (!request.title && !request.pmid && !request.doi) {
      errors.push('Request must have at least a title, PMID, or DOI');
    }
    
    if (request.status && !['pending', 'in-progress', 'fulfilled', 'cancelled'].includes(request.status)) {
      errors.push('Invalid status value');
    }
    
    if (request.priority && !['urgent', 'rush', 'normal'].includes(request.priority)) {
      errors.push('Invalid priority value');
    }
    
    return errors;
  }

  // === Storage Management ===
  function getStorageUsage() {
    try {
      const usage = {};
      Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
        const data = localStorage.getItem(storageKey);
        usage[key] = {
          size: data ? new Blob([data]).size : 0,
          items: key === 'REQUESTS' ? requests.length : 
                 key === 'TAGS' ? globalTags.size : 1
        };
      });
      return usage;
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return {};
    }
  }

  function clearAllData() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Reset in-memory data
      settings = { ...DEFAULT_SETTINGS };
      requests = [];
      globalTags = new Map();
      
      console.log('✅ All data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  console.log('✅ All functions defined successfully');

  // === Module Interface ===
  console.log('🔧 Creating DataManager interface...');
  const DataManager = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing DataManager...');
      try {
        loadSettings();
        loadRequests();
        loadGlobalTags();
        console.log('✅ DataManager initialized successfully');
      } catch (error) {
        console.error('❌ DataManager initialization failed:', error);
        throw error;
      }
    },

    // Settings management
    getSettings,
    updateSettings,

    // Request management
    getRequests,
    addRequest,
    updateRequest,
    deleteRequest,
    deleteMultipleRequests,
    bulkAddRequests,
    validateRequest,

    // Tag management
    getGlobalTags,
    setTagColor,
    addTagsFromRequest,

    // Statistics
    getStats,

    // Utility
    saveAll,
    getStorageUsage,
    clearAllData,

    // Constants
    STORAGE_KEYS
  };

  console.log('✅ DataManager interface created:', Object.keys(DataManager));

  // === Registration Process ===
  console.log('🔧 Starting registration process...');
  console.log('Window SilentStacks exists:', !!window.SilentStacks);
  console.log('Register function exists:', !!window.SilentStacks?.registerModule);

  try {
    // Ensure SilentStacks object exists
    if (!window.SilentStacks) {
      console.log('🔧 Creating SilentStacks object...');
      window.SilentStacks = { modules: {} };
    }

    // Ensure modules object exists
    if (!window.SilentStacks.modules) {
      console.log('🔧 Creating modules object...');
      window.SilentStacks.modules = {};
    }

    // Register module
    if (window.SilentStacks.registerModule && typeof window.SilentStacks.registerModule === 'function') {
      console.log('🔧 Using registerModule function...');
      window.SilentStacks.registerModule('DataManager', DataManager);
      console.log('✅ DataManager registered via registerModule');
    } else {
      console.log('🔧 Using direct registration...');
      window.SilentStacks.modules.DataManager = DataManager;
      console.log('✅ DataManager registered directly');
    }

    // Verify registration
    console.log('🔍 Verification check:');
    console.log('  - SilentStacks exists:', !!window.SilentStacks);
    console.log('  - modules exists:', !!window.SilentStacks.modules);
    console.log('  - DataManager exists:', !!window.SilentStacks.modules.DataManager);
    console.log('  - Available modules:', Object.keys(window.SilentStacks.modules || {}));

    if (window.SilentStacks.modules.DataManager) {
      console.log('🎉 DataManager registration SUCCESSFUL!');
    } else {
      console.error('❌ DataManager registration FAILED!');
    }

  } catch (registrationError) {
    console.error('❌ Registration process failed:', registrationError);
    console.error('Error details:', registrationError.message);
    console.error('Stack trace:', registrationError.stack);
  }

} catch (globalError) {
  console.error('❌ CRITICAL ERROR in DataManager script:', globalError);
  console.error('Error message:', globalError.message);
  console.error('Stack trace:', globalError.stack);
  console.error('Error occurred at line:', globalError.lineNumber || 'unknown');
}
