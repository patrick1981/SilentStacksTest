// config/api-endpoints.js
(() => {
  'use strict';

  const AppConfig = window.SilentStacks?.config || (window.SilentStacks = { config: {} }).config;

  AppConfig.api = AppConfig.api || {};
  AppConfig.api.endpoints = {
    pubmed: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils', // esummary/efetch
    crossref: 'https://api.crossref.org/works',
    clinicaltrials: 'https://clinicaltrials.gov/api/v2/studies'
  };

  // Optional polite pool identifiers
  AppConfig.api.headers = {
    // 'User-Agent': 'SilentStacks/2.0 (mailto:you@example.org)'
  };

  AppConfig.api.timeoutMs = 30000;
  AppConfig.api.maxRetries = 3;
  AppConfig.api.jitterMs = 150;

  AppConfig.limits = AppConfig.limits || {};
  AppConfig.limits.externalRPS = 2; // 2 req/s default

  // Interceptors (optional): add functions to mutate requests/responses
  AppConfig.api.interceptors = {
    request: [
      (ctx) => {
        // Add polite headers if provided
        const hdrs = window.SilentStacks?.config?.api?.headers;
        if (hdrs) Object.entries(hdrs).forEach(([k, v]) => ctx.headers.set(k, v));
        return ctx;
      }
    ],
    response: [
      ({ url, response }) => {
        if (window.SilentStacks?.config?.debug) {
          console.debug('[API response]', response.status, url);
        }
      }
    ]
  };

  console.log('⚙️ api-endpoints configured');
})();
