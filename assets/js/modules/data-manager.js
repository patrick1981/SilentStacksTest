// SilentStacks Data Manager Module - v1.2.1 FIXED VERSION
// Enhanced with memory management, performance monitoring, and safety limits

(() => {
  'use strict';
  console.log('🔧 Loading FIXED DataManager v1.2.1...');

  // === Enhanced Configuration ===
  const PERFORMANCE_LIMITS = {
    MAX_IMPORT_SIZE: 2000,        // Maximum items per import
    MEMORY_WARNING_THRESHOLD: 400, // MB
    MEMORY_CRITICAL_THRESHOLD: 500, // MB
    MAX_TOTAL_REQUESTS: 10000,    // Total app limit
    CLEANUP_INTERVAL: 60000,      // 1 minute cleanup cycle
    GC_FORCE_THRESHOLD: 300       // Force GC at 300MB
  };

  const DEFAULT_SETTINGS = {
    followupDays: 5,
    theme: 'light',
    apiKey: '',
    crossrefEmail: '',
    performanceMode: false,
    autoCleanup: true,
    memoryWarnings: true
  };

  // === Enhanced State Management ===
  let settings = { ...DEFAULT_SETTINGS };
  let requests = [];
  let globalTags = new Map();
  let performanceMetrics = {
    lastCleanup: Date.now(),
    importCount: 0,
    memoryBaseline: 0,
    peakMemoryUsage: 0
  };

  // Auto-cleanup interval
  let cleanupInterval = null;

  // === Storage Keys ===
  const STORAGE_KEYS = {
    SETTINGS: 'silentstacks_settings',
    REQUESTS: 'silentstacks_requests', 
    TAGS: 'silentstacks_tags',
    METRICS: 'silentstacks_metrics',
    API_QUEUE: 'silentstacks_api_queue'
  };

  // === Memory Management Functions ===
  function initializeMemoryMonitoring() {
    if (performance.memory) {
      performanceMetrics.memoryBaseline = performance.memory.usedJSHeapSize;
      console.log('📊 Memory baseline set:', Math.round(performanceMetrics.memoryBaseline / 1024 / 1024), 'MB');
    }

    // Start cleanup interval if auto-cleanup enabled
    if (settings.autoCleanup) {
      startAutoCleanup();
    }

    // Monitor memory every 30 seconds
    setInterval(checkMemoryUsage, 30000);
  }

  function checkMemoryUsage() {
    if (!performance.memory || !settings.memoryWarnings) return;

    const currentMemory = performance.memory.usedJSHeapSize / 1024 / 1024;
    
    // Update peak usage
    if (currentMemory > performanceMetrics.peakMemoryUsage) {
      performanceMetrics.peakMemoryUsage = currentMemory;
    }

    // Warning threshold
    if (currentMemory > PERFORMANCE_LIMITS.MEMORY_WARNING_THRESHOLD) {
      showMemoryWarning(currentMemory);
    }

    // Critical threshold
    if (currentMemory > PERFORMANCE_LIMITS.MEMORY_CRITICAL_THRESHOLD) {
      handleCriticalMemoryUsage(currentMemory);
    }

    // Force garbage collection if available and threshold reached
    if (currentMemory > PERFORMANCE_LIMITS.GC_FORCE_THRESHOLD && window.gc) {
      console.log('🧹 Forcing garbage collection at', Math.round(currentMemory), 'MB');
      window.gc();
    }
  }

  function showMemoryWarning(memoryMB) {
    if (window.SilentStacks?.modules?.UIController?.showNotification) {
      window.SilentStacks.modules.UIController.showNotification(
        `⚠️ High memory usage: ${Math.round(memoryMB)}MB. Consider refreshing page for better performance.`,
        'warning',
        10000
      );
    }
    
    console.warn('⚠️ Memory warning:', Math.round(memoryMB), 'MB');
  }

  function handleCriticalMemoryUsage(memoryMB) {
    console.error('🚨 Critical memory usage:', Math.round(memoryMB), 'MB');
    
    // Force immediate cleanup
    performAggressiveCleanup();
    
    // Offer page refresh
    if (confirm(
      `🚨 Critical memory usage detected (${Math.round(memoryMB)}MB).\n\n` +
      `Your data is automatically saved. Refresh page to improve performance?\n\n` +
      `Click OK to refresh, Cancel to continue.`
    )) {
      window.location.reload();
    }
  }

  function performMemoryCleanup() {
    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    console.log('🧹 Starting memory cleanup...');

    // Clear temporary DOM elements
    document.querySelectorAll('.temp-element, .temporary, [data-temporary="true"]').forEach(el => {
      el.remove();
    });

    // Clear search cache if available
    if (window.SilentStacks?.modules?.SearchFilter?.clearCache) {
      window.SilentStacks.modules.SearchFilter.clearCache();
    }

    // Rebuild search index to clear memory fragments
    if (window.SilentStacks?.modules?.SearchFilter?.initFuse) {
      window.SilentStacks.modules.SearchFilter.initFuse();
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Update metrics
    performanceMetrics.lastCleanup = Date.now();
    
    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryFreed = (startMemory - endMemory) / 1024 / 1024;
    
    console.log('✅ Memory cleanup completed in', Math.round(endTime - startTime), 'ms');
    if (memoryFreed > 0) {
      console.log('💾 Memory freed:', Math.round(memoryFreed), 'MB');
    }

    saveMetrics();
  }

  function performAggressiveCleanup() {
    console.log('🚨 Performing aggressive cleanup...');
    
    // Standard cleanup
    performMemoryCleanup();
    
    // Clear large temporary data structures
    if (window.tempData) {
      window.tempData = null;
    }
    
    // Clear console if possible (in dev mode)
    if (console.clear && window.location.hostname === 'localhost') {
      console.clear();
    }
    
    // Multiple GC attempts
    if (window.gc) {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => window.gc(), i * 100);
      }
    }
  }

  function startAutoCleanup() {
    if (cleanupInterval) return;
    
    cleanupInterval = setInterval(() => {
      performMemoryCleanup();
    }, PERFORMANCE_LIMITS.CLEANUP_INTERVAL);
    
    console.log('🔄 Auto-cleanup started (every', PERFORMANCE_LIMITS.CLEANUP_INTERVAL / 1000, 'seconds)');
  }

  function stopAutoCleanup() {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
      console.log('⏹️ Auto-cleanup stopped');
    }
  }

  // === Enhanced Data Loading Functions ===
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
      
      // Validate total request limit
      if (requests.length > PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS) {
        console.warn('⚠️ Request limit exceeded, truncating to', PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS);
        requests = requests.slice(0, PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS);
        saveRequests(); // Save truncated data
      }
      
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

  function loadMetrics() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.METRICS);
      if (saved) {
        const parsed = JSON.parse(saved);
        performanceMetrics = { ...performanceMetrics, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load metrics:', error);
    }
  }

  // === Enhanced Data Saving Functions ===
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      console.log('✅ Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      handleStorageError('settings', error);
    }
  }

  function saveRequests() {
    try {
      // Check total size before saving
      const dataSize = JSON.stringify(requests).length;
      if (dataSize > 5 * 1024 * 1024) { // 5MB limit
        console.warn('⚠️ Large data size detected:', Math.round(dataSize / 1024 / 1024), 'MB');
      }
      
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
      console.log('✅ Requests saved:', requests.length, 'items');
    } catch (error) {
      console.error('Failed to save requests:', error);
      handleStorageError('requests', error);
    }
  }

  function saveGlobalTags() {
    try {
      localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify([...globalTags]));
      console.log('✅ Global tags saved:', globalTags.size, 'tags');
    } catch (error) {
      console.error('Failed to save tags:', error);
      handleStorageError('tags', error);
    }
  }

  function saveMetrics() {
    try {
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(performanceMetrics));
    } catch (error) {
      console.warn('Failed to save metrics:', error);
    }
  }

  function handleStorageError(dataType, error) {
    if (error.name === 'QuotaExceededError') {
      console.error('🚨 Storage quota exceeded for', dataType);
      
      if (confirm(
        `Storage quota exceeded while saving ${dataType}.\n\n` +
        `This usually means you have too much data stored.\n\n` +
        `Would you like to clean up old data to make space?`
      )) {
        performStorageCleanup();
      }
    } else {
      console.error('Storage error for', dataType, ':', error);
    }
  }

  function performStorageCleanup() {
    console.log('🧹 Performing storage cleanup...');
    
    // Remove old fulfilled requests (older than 6 months)
    const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
    const initialCount = requests.length;
    
    requests = requests.filter(request => {
      if (request.status === 'fulfilled' && request.createdAt) {
        return new Date(request.createdAt).getTime() > sixMonthsAgo;
      }
      return true;
    });
    
    const removedCount = initialCount - requests.length;
    if (removedCount > 0) {
      console.log('🗑️ Removed', removedCount, 'old fulfilled requests');
      saveRequests();
    }
    
    // Clear old metrics
    performanceMetrics = {
      lastCleanup: Date.now(),
      importCount: 0,
      memoryBaseline: performance.memory ? performance.memory.usedJSHeapSize : 0,
      peakMemoryUsage: 0
    };
    saveMetrics();
  }

  // === Enhanced Request Management ===
  function validateImportSize(newRequests) {
    const currentCount = requests.length;
    const newCount = Array.isArray(newRequests) ? newRequests.length : 1;
    const totalAfterImport = currentCount + newCount;

    // Check import size limit
    if (newCount > PERFORMANCE_LIMITS.MAX_IMPORT_SIZE) {
      const proceed = confirm(
        `⚠️ Large import detected (${newCount} items).\n\n` +
        `Recommended maximum: ${PERFORMANCE_LIMITS.MAX_IMPORT_SIZE} items.\n\n` +
        `Large imports may cause performance issues.\n\n` +
        `Continue anyway?`
      );
      
      if (!proceed) {
        throw new Error(`Import cancelled: Size limit exceeded (${newCount} > ${PERFORMANCE_LIMITS.MAX_IMPORT_SIZE})`);
      }

      // Offer to split import
      if (newCount > PERFORMANCE_LIMITS.MAX_IMPORT_SIZE * 2) {
        if (confirm('Would you like to split this into smaller imports for better performance?')) {
          return splitImportData(newRequests);
        }
      }
    }

    // Check total limit
    if (totalAfterImport > PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS) {
      throw new Error(
        `Total request limit exceeded. ` +
        `Current: ${currentCount}, Adding: ${newCount}, ` +
        `Limit: ${PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS}`
      );
    }

    return newRequests;
  }

  function splitImportData(data) {
    const chunks = [];
    const chunkSize = PERFORMANCE_LIMITS.MAX_IMPORT_SIZE;
    
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }
    
    console.log('📦 Split import into', chunks.length, 'chunks of max', chunkSize, 'items');
    return chunks;
  }

  function bulkAddRequests(newRequests) {
    try {
      // Validate size limits
      const validatedData = validateImportSize(newRequests);
      
      // Handle split data
      if (Array.isArray(validatedData[0]) && Array.isArray(validatedData)) {
        // Data was split into chunks
        let totalAdded = 0;
        
        validatedData.forEach((chunk, index) => {
          console.log(`📦 Processing chunk ${index + 1}/${validatedData.length} (${chunk.length} items)`);
          
          const validChunk = chunk.filter(req => req.title || req.pmid || req.doi);
          requests.push(...validChunk);
          totalAdded += validChunk.length;
          
          // Cleanup after each chunk
          if (index < validatedData.length - 1) {
            performMemoryCleanup();
          }
        });
        
        saveRequests();
        performanceMetrics.importCount += totalAdded;
        saveMetrics();
        
        return totalAdded;
      } else {
        // Normal single import
        const validRequests = validatedData.filter(req => req.title || req.pmid || req.doi);
        requests.push(...validRequests);
        saveRequests();
        
        performanceMetrics.importCount += validRequests.length;
        saveMetrics();
        
        // Cleanup after large imports
        if (validRequests.length > 100) {
          setTimeout(performMemoryCleanup, 1000);
        }
        
        return validRequests.length;
      }
    } catch (error) {
      console.error('Bulk add requests failed:', error);
      throw error;
    }
  }

  // === Enhanced Validation ===
  function validateRequest(request) {
    const errors = [];
    
    if (!request.title && !request.pmid && !request.doi) {
      errors.push('Request must have at least a title, PMID, or DOI');
    }
    
    if (request.pmid && !/^\d+$/.test(request.pmid)) {
      errors.push('PMID must be numeric');
    }
    
    if (request.status && !['pending', 'in-progress', 'fulfilled', 'cancelled'].includes(request.status)) {
      errors.push('Invalid status value');
    }
    
    if (request.priority && !['urgent', 'rush', 'normal'].includes(request.priority)) {
      errors.push('Invalid priority value');
    }
    
    if (request.patronEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(request.patronEmail)) {
        errors.push('Invalid email format');
      }
    }
    
    // Enhanced year validation - FIXED
    if (request.year) {
      const yearNum = parseInt(request.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear + 1) {
        errors.push(`Year must be between 1800 and ${currentYear + 1}`);
      }
    }
    
    return errors;
  }

  // === Performance Analytics ===
  function getPerformanceStats() {
    const currentMemory = performance.memory ? 
      Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0;
    
    return {
      currentMemory,
      peakMemory: Math.round(performanceMetrics.peakMemoryUsage),
      baseline: Math.round(performanceMetrics.memoryBaseline / 1024 / 1024),
      totalRequests: requests.length,
      totalImports: performanceMetrics.importCount,
      lastCleanup: new Date(performanceMetrics.lastCleanup).toLocaleString(),
      autoCleanup: settings.autoCleanup,
      performanceMode: settings.performanceMode
    };
  }

  function enablePerformanceMode() {
    settings.performanceMode = true;
    saveSettings();
    
    // Disable animations
    document.documentElement.classList.add('performance-mode');
    
    // Increase cleanup frequency
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = setInterval(performMemoryCleanup, 30000); // Every 30 seconds
    }
    
    console.log('🚀 Performance mode enabled');
    
    if (window.SilentStacks?.modules?.UIController?.showNotification) {
      window.SilentStacks.modules.UIController.showNotification(
        'Performance mode enabled. Animations disabled for better performance.',
        'info',
        5000
      );
    }
  }

  function disablePerformanceMode() {
    settings.performanceMode = false;
    saveSettings();
    
    document.documentElement.classList.remove('performance-mode');
    
    // Restore normal cleanup frequency
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      if (settings.autoCleanup) {
        startAutoCleanup();
      }
    }
    
    console.log('🎨 Performance mode disabled');
  }

  // === Original Functions (Enhanced) ===
  function getSettings() {
    return { ...settings };
  }

  function updateSettings(newSettings) {
    const oldSettings = { ...settings };
    settings = { ...settings, ...newSettings };
    
    // Handle performance mode changes
    if (newSettings.performanceMode !== undefined) {
      if (newSettings.performanceMode && !oldSettings.performanceMode) {
        enablePerformanceMode();
      } else if (!newSettings.performanceMode && oldSettings.performanceMode) {
        disablePerformanceMode();
      }
    }
    
    // Handle auto-cleanup changes
    if (newSettings.autoCleanup !== undefined) {
      if (newSettings.autoCleanup && !oldSettings.autoCleanup) {
        startAutoCleanup();
      } else if (!newSettings.autoCleanup && oldSettings.autoCleanup) {
        stopAutoCleanup();
      }
    }
    
    saveSettings();
  }

  function getRequests() {
    return [...requests];
  }

  function addRequest(request) {
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
      
      // Cleanup after deletions
      if (requests.length % 100 === 0) {
        setTimeout(performMemoryCleanup, 500);
      }
      
      return deleted;
    }
    throw new Error(`Invalid request index: ${index}`);
  }

  function deleteMultipleRequests(indices) {
    const sortedIndices = [...indices].sort((a, b) => b - a);
    const deletedRequests = [];
    
    sortedIndices.forEach(index => {
      if (index >= 0 && index < requests.length) {
        deletedRequests.push(requests.splice(index, 1)[0]);
      }
    });
    
    saveRequests();
    
    // Cleanup after bulk deletions
    if (deletedRequests.length > 10) {
      setTimeout(performMemoryCleanup, 500);
    }
    
    return deletedRequests;
  }

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

  function getStats() {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in-progress').length,
      fulfilled: requests.filter(r => r.status === 'fulfilled').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
      followup: 0
    };

    if (settings.followupDays) {
      const followupThreshold = Date.now() - (settings.followupDays * 24 * 60 * 60 * 1000);
      stats.followup = requests.filter(r => 
        r.status === 'pending' && 
        new Date(r.createdAt).getTime() < followupThreshold
      ).length;
    }

    return stats;
  }

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
      // Stop cleanup first
      stopAutoCleanup();
      
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Reset in-memory data
      settings = { ...DEFAULT_SETTINGS };
      requests = [];
      globalTags = new Map();
      performanceMetrics = {
        lastCleanup: Date.now(),
        importCount: 0,
        memoryBaseline: 0,
        peakMemoryUsage: 0
      };
      
      console.log('✅ All data cleared');
      
      // Restart monitoring
      initializeMemoryMonitoring();
      
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  console.log('✅ All FIXED DataManager functions defined');

  // === Enhanced Module Interface ===
  const DataManager = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing FIXED DataManager v1.2.1...');
      try {
        loadSettings();
        loadRequests();
        loadGlobalTags();
        loadMetrics();
        initializeMemoryMonitoring();
        console.log('✅ FIXED DataManager initialized successfully');
      } catch (error) {
        console.error('❌ FIXED DataManager initialization failed:', error);
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

    // Performance management - NEW
    getPerformanceStats,
    performMemoryCleanup,
    performAggressiveCleanup,
    enablePerformanceMode,
    disablePerformanceMode,
    checkMemoryUsage,

    // Utility
    saveAll: () => {
      saveSettings();
      saveRequests();
      saveGlobalTags();
      saveMetrics();
    },
    getStorageUsage,
    clearAllData,

    // Constants
    STORAGE_KEYS,
    PERFORMANCE_LIMITS
  };

  console.log('✅ FIXED DataManager interface created');

  // === Enhanced Registration ===
  try {
    if (!window.SilentStacks) {
      window.SilentStacks = { modules: {} };
    }
    if (!window.SilentStacks.modules) {
      window.SilentStacks.modules = {};
    }

    if (window.SilentStacks.registerModule && typeof window.SilentStacks.registerModule === 'function') {
      window.SilentStacks.registerModule('DataManager', DataManager);
      console.log('✅ FIXED DataManager registered via registerModule');
    } else {
      window.SilentStacks.modules.DataManager = DataManager;
      console.log('✅ FIXED DataManager registered directly');
    }

    console.log('🎉 FIXED DataManager registration SUCCESSFUL!');

  } catch (registrationError) {
    console.error('❌ FIXED DataManager registration failed:', registrationError);
  }

})();
