// SilentStacks Theme Manager Module
// Handles theme switching, settings persistence, and UI preferences
(() => {
  'use strict';

  // === Theme Configuration ===
  const THEMES = {
    light: {
      name: 'Light Theme',
      description: 'Clean, bright interface for well-lit environments'
    },
    dark: {
      name: 'Dark Theme', 
      description: 'Easy on the eyes for low-light environments'
    },
    'high-contrast': {
      name: 'High Contrast',
      description: 'Maximum accessibility with high contrast colors'
    }
  };

  // === Theme Application ===
  function applyTheme(themeName = null) {
    const settings = window.SilentStacks.modules.DataManager.getSettings();
    const theme = themeName || settings.theme || 'light';
    
    // Validate theme
    if (!THEMES[theme]) {
      console.warn(`Invalid theme: ${theme}, falling back to light`);
      theme = 'light';
    }
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update settings if theme was changed
    if (themeName && themeName !== settings.theme) {
      window.SilentStacks.modules.DataManager.updateSettings({ theme: themeName });
    }
    
    // Update theme selector
    const themeSelect = document.getElementById('theme');
    if (themeSelect && themeSelect.value !== theme) {
      themeSelect.value = theme;
    }
    
    console.log(`✅ Applied theme: ${theme}`);
    
    // Announce theme change for accessibility
    announceThemeChange(theme);
  }

  function announceThemeChange(theme) {
    const themeName = THEMES[theme]?.name || theme;
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Theme changed to ${themeName}`;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  // === Settings Management ===
  function saveSettings() {
    try {
      const settingsForm = document.getElementById('settings-form');
      if (!settingsForm) {
        throw new Error('Settings form not found');
      }
      
      const formData = new FormData(settingsForm);
      const newSettings = {};
      
      // Extract form data
      for (let [key, value] of formData.entries()) {
        if (key === 'followup-days') {
          newSettings.followupDays = parseInt(value) || 5;
        } else if (key === 'theme') {
          newSettings.theme = value;
        } else if (key === 'api-key') {
          newSettings.apiKey = value.trim();
        } else if (key === 'crossref-email') {
          newSettings.crossrefEmail = value.trim();
        }
      }
      
      // Validate settings
      const validationErrors = validateSettings(newSettings);
      if (validationErrors.length > 0) {
        throw new Error('Settings validation failed: ' + validationErrors.join(', '));
      }
      
      // Update settings
      window.SilentStacks.modules.DataManager.updateSettings(newSettings);
      
      // Apply theme if it changed
      if (newSettings.theme) {
        applyTheme(newSettings.theme);
      }
      
      window.SilentStacks.modules.UIController.setStatus('Settings saved successfully!', 'success');
      
      // Refresh views if follow-up days changed
      if (newSettings.followupDays) {
        window.SilentStacks.modules.RequestManager.refreshAllViews();
      }
      
    } catch (error) {
      console.error('Settings save error:', error);
      window.SilentStacks.modules.UIController.setStatus(`Failed to save settings: ${error.message}`, 'error');
    }
  }

  function validateSettings(settings) {
    const errors = [];
    
    // Validate follow-up days
    if (settings.followupDays !== undefined) {
      if (isNaN(settings.followupDays) || settings.followupDays < 1 || settings.followupDays > 365) {
        errors.push('Follow-up days must be between 1 and 365');
      }
    }
    
    // Validate theme
    if (settings.theme && !THEMES[settings.theme]) {
      errors.push('Invalid theme selection');
    }
    
    // Validate email format if provided
    if (settings.crossrefEmail && settings.crossrefEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.crossrefEmail.trim())) {
        errors.push('Invalid email format for CrossRef email');
      }
    }
    
    return errors;
  }

  function loadSettingsIntoForm() {
    const settings = window.SilentStacks.modules.DataManager.getSettings();
    
    // Populate form fields
    const followupDaysInput = document.getElementById('followup-days');
    if (followupDaysInput) {
      followupDaysInput.value = settings.followupDays || 5;
    }
    
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
      themeSelect.value = settings.theme || 'light';
    }
    
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) {
      apiKeyInput.value = settings.apiKey || '';
    }
    
    const crossrefEmailInput = document.getElementById('crossref-email');
    if (crossrefEmailInput) {
      crossrefEmailInput.value = settings.crossrefEmail || '';
    }
  }

  // === Theme Detection and Auto-switching ===
  function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function setupSystemThemeDetection() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Listen for system theme changes
      mediaQuery.addListener((e) => {
        const settings = window.SilentStacks.modules.DataManager.getSettings();
        
        // Only auto-switch if user hasn't explicitly set a theme
        if (!settings.theme || settings.theme === 'system') {
          const newTheme = e.matches ? 'dark' : 'light';
          applyTheme(newTheme);
          
          window.SilentStacks.modules.UIController.showNotification(
            `Auto-switched to ${newTheme} theme based on system preference`,
            'info',
            3000
          );
        }
      });
    }
  }

  // === Accessibility Features ===
  function setupAccessibilityFeatures() {
    // Add keyboard shortcuts for theme switching
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + T for theme toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
      
      // Ctrl/Cmd + Shift + H for high contrast toggle
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        toggleHighContrast();
      }
    });
  }

  function toggleTheme() {
    const settings = window.SilentStacks.modules.DataManager.getSettings();
    const currentTheme = settings.theme || 'light';
    
    const themeOrder = ['light', 'dark', 'high-contrast'];
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    
    applyTheme(nextTheme);
    
    window.SilentStacks.modules.UIController.showNotification(
      `Switched to ${THEMES[nextTheme].name}`,
      'success',
      2000
    );
  }

  function toggleHighContrast() {
    const settings = window.SilentStacks.modules.DataManager.getSettings();
    const currentTheme = settings.theme || 'light';
    
    if (currentTheme === 'high-contrast') {
      applyTheme('light');
      window.SilentStacks.modules.UIController.showNotification('High contrast disabled', 'success', 2000);
    } else {
      applyTheme('high-contrast');
      window.SilentStacks.modules.UIController.showNotification('High contrast enabled', 'success', 2000);
    }
  }

  // === Custom CSS Properties Management ===
  function updateCustomProperties(theme) {
    const root = document.documentElement;
    
    // These are handled by CSS but we can add runtime customizations here
    if (theme === 'high-contrast') {
      // Add additional accessibility enhancements
      root.style.setProperty('--focus-outline-width', '3px');
      root.style.setProperty('--button-min-height', '48px');
    } else {
      // Reset to defaults
      root.style.removeProperty('--focus-outline-width');
      root.style.removeProperty('--button-min-height');
    }
  }

  // === Font Management ===
  function setupFontPreferences() {
    // Check if user prefers reduced motion
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      if (prefersReducedMotion.matches) {
        document.documentElement.classList.add('reduced-motion');
      }
      
      prefersReducedMotion.addListener((e) => {
        if (e.matches) {
          document.documentElement.classList.add('reduced-motion');
        } else {
          document.documentElement.classList.remove('reduced-motion');
        }
      });
    }
  }

  // === Settings Export/Import ===
  function exportSettings() {
    try {
      const settings = window.SilentStacks.modules.DataManager.getSettings();
      const exportData = {
        version: window.SilentStacks.version,
        exportDate: new Date().toISOString(),
        settings: settings
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const filename = `silentstacks-settings-${new Date().toISOString().split('T')[0]}.json`;
      
      window.SilentStacks.modules.BulkOperations.downloadFile(blob, filename);
      
      window.SilentStacks.modules.UIController.showNotification(
        'Settings exported successfully',
        'success'
      );
      
    } catch (error) {
      console.error('Settings export error:', error);
      window.SilentStacks.modules.UIController.showNotification(
        'Failed to export settings',
        'error'
      );
    }
  }

  function importSettings(settingsData) {
    try {
      const validationErrors = validateSettings(settingsData);
      if (validationErrors.length > 0) {
        throw new Error('Invalid settings: ' + validationErrors.join(', '));
      }
      
      window.SilentStacks.modules.DataManager.updateSettings(settingsData);
      loadSettingsIntoForm();
      applyTheme(settingsData.theme);
      
      window.SilentStacks.modules.UIController.showNotification(
        'Settings imported successfully',
        'success'
      );
      
    } catch (error) {
      console.error('Settings import error:', error);
      window.SilentStacks.modules.UIController.showNotification(
        `Failed to import settings: ${error.message}`,
        'error'
      );
    }
  }

  // === Module Interface ===  
  const ThemeManager = {
    // Initialization
    initialize() {
      console.log('🔧 Initializing ThemeManager...');
      
      loadSettingsIntoForm();
      applyTheme();
      setupSystemThemeDetection();
      setupAccessibilityFeatures();
      setupFontPreferences();
      
      console.log('✅ ThemeManager initialized');
    },

    // Theme management
    applyTheme,
    toggleTheme,
    toggleHighContrast,
    detectSystemTheme,
    updateCustomProperties,

    // Settings management
    saveSettings,
    validateSettings,
    loadSettingsIntoForm,
    exportSettings,
    importSettings,

    // Utility
    getAvailableThemes: () => ({ ...THEMES }),
    getCurrentTheme: () => {
      const settings = window.SilentStacks.modules.DataManager.getSettings();
      return settings.theme || 'light';
    }
  };

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('ThemeManager', ThemeManager);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.ThemeManager = ThemeManager;
    // Add this to the end of theme-manager.js to fix the syntax error

  }

  // Register module
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('ThemeManager', ThemeManager);
  } else {
    // Fallback for direct loading
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.ThemeManager = ThemeManager;
  }
})();
