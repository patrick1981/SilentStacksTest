// assets/js/security/input-sanitizer.js
// Copy this entire file and save it as: assets/js/security/input-sanitizer.js

(() => {
  'use strict';

  // Input Sanitizer - Prevents XSS and validates data types
  class InputSanitizer {
    constructor() {
      // Regex patterns for different input types
      this.patterns = {
        pmid: /^\d{1,8}$/,
        doi: /^10\.\d{4,}\/[^\s]+$/,
        url: /^https?:\/\/[^\s<>"']+$/,
        alphanumeric: /^[a-zA-Z0-9_-]+$/,
        text: /^[^<>]*$/ // Basic XSS prevention
      };
    }
    
    sanitize(input, type = 'text') {
      if (!input) return '';
      
      const str = String(input);
      
      switch (type) {
        case 'pmid':
          return this.patterns.pmid.test(str) ? str : '';
        case 'doi':
          return this.patterns.doi.test(str) ? str : '';
        case 'url':
          return this.patterns.url.test(str) ? str : '';
        case 'alphanumeric':
          return str.replace(/[^a-zA-Z0-9_-]/g, '');
        case 'text':
        default:
          return this.sanitizeHTML(str);
      }
    }
    
    sanitizeHTML(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  // Rate limiter for API calls (2 requests per second)
  class RateLimiter {
    constructor(requestsPerSecond = 2) {
      this.rps = requestsPerSecond;
      this.interval = 1000 / requestsPerSecond;
      this.queue = [];
      this.lastRequest = 0;
      this.processing = false;
    }
    
    async execute(fn) {
      return new Promise((resolve, reject) => {
        this.queue.push({ fn, resolve, reject });
        this.processQueue();
      });
    }
    
    async processQueue() {
      if (this.processing || this.queue.length === 0) return;
      
      this.processing = true;
      
      while (this.queue.length > 0) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;
        
        if (timeSinceLastRequest < this.interval) {
          await this.delay(this.interval - timeSinceLastRequest);
        }
        
        const { fn, resolve, reject } = this.queue.shift();
        this.lastRequest = Date.now();
        
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
      
      this.processing = false;
    }
    
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }

  // Safe DOM utilities - No more innerHTML!
  class DOMUtils {
    static createElement(tag, attributes = {}, children = []) {
      const element = document.createElement(tag);
      
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'textContent') {
          element.textContent = value;
        } else if (key === 'className') {
          element.className = value;
        } else {
          element.setAttribute(key, value);
        }
      });
      
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child) {
          element.appendChild(child);
        }
      });
      
      return element;
    }
    
    static safeSetHTML(element, content) {
      // Clear existing content safely
      element.textContent = '';
      
      // Create safe text node
      element.appendChild(document.createTextNode(content));
    }

    static safeSetInnerHTML(element, htmlString) {
      // Use DOMParser for safer HTML parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');
      
      // Clear element
      element.textContent = '';
      
      // Add parsed content
      Array.from(doc.body.childNodes).forEach(node => {
        element.appendChild(node.cloneNode(true));
      });
    }
  }

  // Make available globally
  window.SilentStacks = window.SilentStacks || {};
  window.SilentStacks.security = window.SilentStacks.security || {};
  
  window.SilentStacks.security.InputSanitizer = InputSanitizer;
  window.SilentStacks.security.RateLimiter = RateLimiter;
  window.SilentStacks.security.DOMUtils = DOMUtils;
  
  // Create global instances
  window.SilentStacks.security.sanitizer = new InputSanitizer();
  window.SilentStacks.security.rateLimiter = new RateLimiter(2);
  window.SilentStacks.security.domUtils = DOMUtils;

  console.log('🔒 Security utilities loaded');

})();