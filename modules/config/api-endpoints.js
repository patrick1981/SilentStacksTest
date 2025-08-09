// modules/config/api-endpoints.js — SilentStacks v2.0
(() => {
  'use strict';

  // === SAFE NAMESPACE INIT (never overwrite SilentStacks object) ===
  const SS = (window.SilentStacks = window.SilentStacks || {});
  SS.config = SS.config || {};
  const AppConfig = SS.config;

  // === API ENDPOINTS CONFIG ===
  AppConfig.api = AppConfig.api || {};

  AppConfig.api.endpoints = {
    pubmed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    crossref: 'https://api.crossref.org/works',
    clinicaltrials: 'https://clinicaltrials.gov/api/v2/studies'
  };

  // Optional: default headers for all API calls
  AppConfig.api.headers = {
    // Example:
    // 'User-Agent': 'SilentStacks/2.0 (mailto:you@example.org)'
  };

  // Optional: interceptors to modify requests/responses centrally
  AppConfig.api.interceptors = AppConfig.api.interceptors || { request: [], response: [] };

  // Basic request passthrough
  AppConfig.api.interceptors.request.push(({ url, init }) => {
    // Modify init.headers here if needed
    return { url, init };
  });

  // Basic response passthrough
  AppConfig.api.interceptors.response.push(({ url, response }) => {
    // You could add logging or response transformation here
    return { url, response };
  });

  console.log('⚙️ api-endpoints configured');

  // === REGISTER WITH LOADER ===
  // This ensures bootstrap.js knows the module is ready
  if (typeof SS.registerModule === 'function') {
    SS.registerModule('ApiEndpoints', {
      ready: true,
      endpoints: AppConfig.api.endpoints
    });
  } else {
    SS.modules = SS.modules || {};
    SS.modules.ApiEndpoints = {
      ready: true,
      endpoints: AppConfig.api.endpoints
    };
  }
})();
