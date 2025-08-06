// Complete Enhanced SilentStacks Data Manager

(() => {
  'use strict';

  // === Enhanced Configuration ===
  const PERFORMANCE_LIMITS = {
    MAX_IMPORT_SIZE: 2000,
    MEMORY_WARNING_THRESHOLD: 400,
    MEMORY_CRITICAL_THRESHOLD: 500,
    MAX_TOTAL_REQUESTS: 10000,
    CLEANUP_INTERVAL: 60000,
    GC_FORCE_THRESHOLD: 300
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

  let cleanupInterval = null;

  // === Storage Keys ===
  const STORAGE_KEYS = {
    SETTINGS: 'silentstacks_settings',
    REQUESTS: 'silentstacks_requests', 
    TAGS: 'silentstacks_tags',
    METRICS: 'silentstacks_metrics'
  };

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
      
      if (requests.length > PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS) {
        console.warn('⚠️ Request limit exceeded, truncating to', PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS);
        requests = requests.slice(0, PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS);
        saveRequests();
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

  // === Data Saving Functions ===
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
      const dataSize = JSON.stringify(requests).length;
      if (dataSize > 5 * 1024 * 1024) {
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

  // === Memory Management Functions ===
  function initializeMemoryMonitoring() {
    if (performance.memory) {
      performanceMetrics.memoryBaseline = performance.memory.usedJSHeapSize;
      console.log('📊 Memory baseline set:', Math.round(performanceMetrics.memoryBaseline / 1024 / 1024), 'MB');
    }

    if (settings.autoCleanup) {
      startAutoCleanup();
    }

    setInterval(checkMemoryUsage, 30000);
  }

  function checkMemoryUsage() {
    if (!performance.memory || !settings.memoryWarnings) return;

    const currentMemory = performance.memory.usedJSHeapSize / 1024 / 1024;
    
    if (currentMemory > performanceMetrics.peakMemoryUsage) {
      performanceMetrics.peakMemoryUsage = currentMemory;
    }

    if (currentMemory > PERFORMANCE_LIMITS.MEMORY_WARNING_THRESHOLD) {
      showMemoryWarning(currentMemory);
    }

    if (currentMemory > PERFORMANCE_LIMITS.MEMORY_CRITICAL_THRESHOLD) {
      handleCriticalMemoryUsage(currentMemory);
    }

    if (currentMemory > PERFORMANCE_LIMITS.GC_FORCE_THRESHOLD && window.gc) {
      console.log('🧹 Forcing garbage collection at', Math.round(currentMemory), 'MB');
      window.gc();
    }
  }

  function showMemoryWarning(memoryMB) {
    showNotification(
      `⚠️ High memory usage: ${Math.round(memoryMB)}MB. Consider refreshing page for better performance.`,
      'warning',
      10000
    );
    
    console.warn('⚠️ Memory warning:', Math.round(memoryMB), 'MB');
  }

  function handleCriticalMemoryUsage(memoryMB) {
    console.error('🚨 Critical memory usage:', Math.round(memoryMB), 'MB');
    
    performAggressiveCleanup();
    
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

    document.querySelectorAll('.temp-element, .temporary, [data-temporary="true"]').forEach(el => {
      el.remove();
    });

    if (window.SilentStacks?.modules?.SearchFilter?.clearCache) {
      window.SilentStacks.modules.SearchFilter.clearCache();
    }

    if (window.SilentStacks?.modules?.SearchFilter?.initFuse) {
      window.SilentStacks.modules.SearchFilter.initFuse();
    }

    if (window.gc) {
      window.gc();
    }

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
    
    performMemoryCleanup();
    
    if (window.tempData) {
      window.tempData = null;
    }
    
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

  function performStorageCleanup() {
    console.log('🧹 Performing storage cleanup...');
    
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
    
    performanceMetrics = {
      lastCleanup: Date.now(),
      importCount: 0,
      memoryBaseline: performance.memory ? performance.memory.usedJSHeapSize : 0,
      peakMemoryUsage: 0
    };
    saveMetrics();
  }

  // === Request Management Functions ===
  function validateImportSize(newRequests) {
    const currentCount = requests.length;
    const newCount = Array.isArray(newRequests) ? newRequests.length : 1;
    const totalAfterImport = currentCount + newCount;

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

      if (newCount > PERFORMANCE_LIMITS.MAX_IMPORT_SIZE) {
        enablePerformanceMode();
      }
    }

    if (totalAfterImport > PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS) {
      throw new Error(
        `Total request limit exceeded. ` +
        `Current: ${currentCount}, Adding: ${newCount}, ` +
        `Limit: ${PERFORMANCE_LIMITS.MAX_TOTAL_REQUESTS}`
      );
    }

    return newRequests;
  }

  function bulkAddRequests(newRequests) {
    try {
      const validatedData = validateImportSize(newRequests);
      const validRequests = validatedData.filter(req => req.title || req.pmid || req.doi);
      
      requests.unshift(...validRequests);
      saveRequests();
      
      performanceMetrics.importCount += validRequests.length;
      saveMetrics();
      
      if (validRequests.length > 100) {
        setTimeout(performMemoryCleanup, 1000);
      }
      
      console.log('✅ Bulk added', validRequests.length, 'requests');
      return validRequests.length;
      
    } catch (error) {
      console.error('Bulk add requests failed:', error);
      throw error;
    }
  }

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
    
    if (request.year) {
      const yearNum = parseInt(request.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1800 || yearNum > currentYear + 1) {
        errors.push(`Year must be between 1800 and ${currentYear + 1}`);
      }
    }
    
    return errors;
  }

  function getPerformanceStats() {
    const currentMemory = performance.memory ? 
      Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0;
    
    return {
      currentMemory,
      peakMemory: Math.round(performanceMetrics.peakMemoryUsage / 1024 / 1024),
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
    
    document.documentElement.classList.add('performance-mode');
    
    const style = document.createElement('style');
    style.id = 'performance-mode-styles';
    style.textContent = `
      .performance-mode * {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
      
      .performance-mode .request-card {
        padding: 12px !important;
        margin-bottom: 8px !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
      }
      
      .performance-mode .request-tags,
      .performance-mode .request-notes {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = setInterval(performMemoryCleanup, 30000);
    }
    
    console.log('🚀 Performance mode enabled');
    
    showNotification(
      'Performance mode enabled. Animations disabled for better performance.',
      'info',
      5000
    );
  }

  function disablePerformanceMode() {
    settings.performanceMode = false;
    saveSettings();
    
    document.documentElement.classList.remove('performance-mode');
    
    const performanceStyles = document.getElementById('performance-mode-styles');
    if (performanceStyles) {
      performanceStyles.remove();
    }
    
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
      if (settings.autoCleanup) {
        startAutoCleanup();
      }
    }
    
    console.log('🎨 Performance mode disabled');
  }

  // === Standard CRUD Functions ===
  function getSettings() {
    return { ...settings };
  }

  function updateSettings(newSettings) {
    const oldSettings = { ...settings };
    settings = { ...settings, ...newSettings };
    
    if (newSettings.performanceMode !== undefined) {
      if (newSettings.performanceMode && !oldSettings.performanceMode) {
        enablePerformanceMode();
      } else if (!newSettings.performanceMode && oldSettings.performanceMode) {
        disablePerformanceMode();
      }
    }
    
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
      stopAutoCleanup();
      
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
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
      
      initializeMemoryMonitoring();
      
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  // === Utility Functions ===
  function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
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

    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
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

  // === Enhanced Module Interface ===
  const DataManager = {
    initialize() {
      console.log('🔧 Initializing Enhanced Manager...');
      try {
        loadSettings();
        loadRequests();
        loadGlobalTags();
        loadMetrics();
        initializeMemoryMonitoring();
        console.log('✅ Enhanced Manager initialized successfully');
      } catch (error) {
        console.error('❌ Enhanced Data Manager initialization failed:', error);
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

    // Performance management
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
    performStorageCleanup,

    // Constants
    STORAGE_KEYS,
    PERFORMANCE_LIMITS
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      DataManager.initialize();
    });
  } else {
    DataManager.initialize();
  }

  // Export for global access
  window.DataManager = DataManager;
  window.SilentStacks = window.SilentStacks || { modules: {} };
window.SilentStacks.modules.DataManager = DataManager;

})();
