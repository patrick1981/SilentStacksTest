// assets/js/security/security-patches.js
// Copy this entire file and save it as: assets/js/security/security-patches.js

(() => {
  'use strict';

  // Wait for security utilities to load
  function waitForSecurity(callback) {
    if (window.SilentStacks?.security?.sanitizer) {
      callback();
    } else {
      setTimeout(() => waitForSecurity(callback), 100);
    }
  }

  // Apply security patches to existing modules
  function applySecurityPatches() {
    console.log('🔧 Applying security patches...');
    
    const { sanitizer, rateLimiter, domUtils } = window.SilentStacks.security;

    // PATCH 1: API Integration - Rate limiting and input sanitization
    if (window.SilentStacks.modules?.APIIntegration) {
      const apiModule = window.SilentStacks.modules.APIIntegration;
      
      // Patch PubMed fetch
      if (apiModule.fetchPubMedData) {
        const originalFetchPubMed = apiModule.fetchPubMedData;
        apiModule.fetchPubMedData = async function(pmid) {
          console.log('🔒 Applying PMID sanitization and rate limiting');
          
          // Sanitize PMID
          const sanitizedPMID = sanitizer.sanitize(pmid, 'pmid');
          if (!sanitizedPMID) {
            throw new Error('Invalid PMID format');
          }
          
          // Rate limit the request
          return rateLimiter.execute(() => originalFetchPubMed.call(this, sanitizedPMID));
        };
        console.log('✅ PubMed API patched with security');
      }

      // Patch DOI fetch
      if (apiModule.fetchCrossRefData) {
        const originalFetchDOI = apiModule.fetchCrossRefData;
        apiModule.fetchCrossRefData = async function(doi) {
          console.log('🔒 Applying DOI sanitization and rate limiting');
          
          // Sanitize DOI
          const sanitizedDOI = sanitizer.sanitize(doi, 'doi');
          if (!sanitizedDOI) {
            throw new Error('Invalid DOI format');
          }
          
          // Rate limit the request
          return rateLimiter.execute(() => originalFetchDOI.call(this, sanitizedDOI));
        };
        console.log('✅ CrossRef API patched with security');
      }
    }

    // PATCH 2: Request Manager - XSS prevention
    if (window.SilentStacks.modules?.RequestManager) {
      const requestModule = window.SilentStacks.modules.RequestManager;
      
      // Patch form submission
      if (requestModule.handleFormSubmission) {
        const originalSubmit = requestModule.handleFormSubmission;
        requestModule.handleFormSubmission = function(formData) {
          console.log('🔒 Sanitizing form data');
          
          // Sanitize all form inputs
          const sanitizedData = {};
          Object.entries(formData).forEach(([key, value]) => {
            if (key === 'pmid') {
              sanitizedData[key] = sanitizer.sanitize(value, 'pmid');
            } else if (key === 'doi') {
              sanitizedData[key] = sanitizer.sanitize(value, 'doi');
            } else {
              sanitizedData[key] = sanitizer.sanitize(value, 'text');
            }
          });
          
          return originalSubmit.call(this, sanitizedData);
        };
        console.log('✅ Form submission patched with sanitization');
      }

      // Patch card rendering to prevent XSS
      if (requestModule.renderRequestCard) {
        const originalRender = requestModule.renderRequestCard;
        requestModule.renderRequestCard = function(request) {
          console.log('🔒 Sanitizing request card data');
          
          // Sanitize request data before rendering
          const sanitizedRequest = {
            ...request,
            title: sanitizer.sanitize(request.title || ''),
            authors: sanitizer.sanitize(request.authors || ''),
            journal: sanitizer.sanitize(request.journal || ''),
            notes: sanitizer.sanitize(request.notes || ''),
            status: sanitizer.sanitize(request.status || ''),
            priority: sanitizer.sanitize(request.priority || '')
          };
          
          return originalRender.call(this, sanitizedRequest);
        };
        console.log('✅ Request card rendering patched');
      }
    }

    // PATCH 3: Search Filter - Debounced input
    if (window.SilentStacks.modules?.SearchFilter) {
      const searchModule = window.SilentStacks.modules.SearchFilter;
      
      // Create debounced search function
      let searchTimeout;
      const debouncedSearch = (query) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          // Sanitize search query
          const sanitizedQuery = sanitizer.sanitize(query, 'text');
          searchModule.originalPerformSearch?.(sanitizedQuery);
        }, 300); // 300ms debounce
      };
      
      // Patch search if it exists
      if (searchModule.performSearch) {
        // Store original function
        searchModule.originalPerformSearch = searchModule.performSearch;
        
        // Replace with debounced version
        searchModule.performSearch = debouncedSearch;
        
        console.log('✅ Search function debounced (300ms)');
      }
    }

    // PATCH 4: UI Controller - Safe DOM manipulation
    if (window.SilentStacks.modules?.UIController) {
      const uiModule = window.SilentStacks.modules.UIController;
      
      // Patch status setting
      if (uiModule.setStatus) {
        const originalSetStatus = uiModule.setStatus;
        uiModule.setStatus = function(message, type = 'info') {
          // Sanitize message
          const sanitizedMessage = sanitizer.sanitize(message, 'text');
          
          return originalSetStatus.call(this, sanitizedMessage, type);
        };
        console.log('✅ UI status messages sanitized');
      }

      // Add safe HTML utilities to UI module
      uiModule.safeSetHTML = domUtils.safeSetHTML;
      uiModule.createElement = domUtils.createElement;
    }

    // PATCH 5: Bulk Upload - Input sanitization
    if (window.SilentStacks.modules?.BulkUpload) {
      const bulkModule = window.SilentStacks.modules.BulkUpload;
      
      if (bulkModule.processBulkData) {
        const originalProcess = bulkModule.processBulkData;
        bulkModule.processBulkData = function(data) {
          console.log('🔒 Sanitizing bulk upload data');
          
          // Sanitize bulk data
          const sanitizedData = data.map(item => {
            if (typeof item === 'string') {
              // Assume it's a PMID
              return sanitizer.sanitize(item.trim(), 'pmid');
            } else if (typeof item === 'object') {
              // Sanitize object properties
              const sanitized = {};
              Object.entries(item).forEach(([key, value]) => {
                if (key === 'pmid') {
                  sanitized[key] = sanitizer.sanitize(value, 'pmid');
                } else if (key === 'doi') {
                  sanitized[key] = sanitizer.sanitize(value, 'doi');
                } else {
                  sanitized[key] = sanitizer.sanitize(value, 'text');
                }
              });
              return sanitized;
            }
            return item;
          }).filter(Boolean); // Remove empty items
          
          return originalProcess.call(this, sanitizedData);
        };
        console.log('✅ Bulk upload data sanitization applied');
      }
    }

    // PATCH 6: Global form input protection
    document.addEventListener('input', (event) => {
      const input = event.target;
      
      // Only patch our app's inputs
      if (input.closest('.silentstacks-app') || input.id?.includes('silentstacks')) {
        const inputType = input.dataset.type || 'text';
        const sanitized = sanitizer.sanitize(input.value, inputType);
        
        if (sanitized !== input.value) {
          console.log('🔒 Input automatically sanitized');
          input.value = sanitized;
        }
      }
    });

    console.log('✅ All security patches applied successfully');
    
    // Show security status
    if (window.SilentStacks.modules?.UIController?.setStatus) {
      window.SilentStacks.modules.UIController.setStatus('🔒 Security patches active', 'success');
    }
  }

  // Apply patches when everything is ready
  waitForSecurity(() => {
    // Wait a bit more for modules to load
    setTimeout(applySecurityPatches, 1000);
  });

  // Export patch function for manual use
  window.SilentStacksSecurityPatch = {
    applyPatches: applySecurityPatches
  };

})();