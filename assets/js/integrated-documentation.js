// assets/js/integrated-documentation.js
// SilentStacks V1.5 - Fixed Integrated Documentation (NO EXPORT STATEMENT)

(() => {
  'use strict';

  const documentationContent = {
    getting_started: {
      id: "getting_started",
      title: "Getting Started with SilentStacks v1.5",
      content: `
        <h3>Welcome to SilentStacks V1.5 - All Issues Fixed!</h3>
        
        <h4>🎉 What's Fixed in V1.5:</h4>
        <ul>
          <li><strong>✅ FIXED: Delete & Sorting Functions</strong> - Both individual and bulk delete now work perfectly</li>
          <li><strong>✅ FIXED: Bulk Upload with PMID Auto-Fetch</strong> - Paste PMIDs and get instant metadata in NLM format</li>
          <li><strong>✅ FIXED: CSV Upload Functionality</strong> - Working CSV upload with PMID API integration</li>
          <li><strong>✅ NEW: Clinical Trials Integration</strong> - Automatic ClinicalTrials.gov lookup for PMIDs</li>
          <li><strong>✅ FIXED: All Requests in NLM Format</strong> - Proper citation formatting throughout</li>
          <li><strong>✅ ENHANCED: DOCLINE Integration</strong> - DOCLINE numbers in bulk import/export</li>
        </ul>

        <h4>🧪 Test with PMID 16979104:</h4>
        <p>This is a known clinical trial publication. When you process this PMID:</p>
        <ol>
          <li>System fetches complete metadata from PubMed</li>
          <li>Formats authors in NLM style</li>
          <li>Searches for associated clinical trials</li>
          <li>Creates complete citation ready for export</li>
        </ol>

        <div class="help-tip">
          <strong>🎯 Perfect for Clinical Research:</strong> Upload clinical trial PMIDs to get both publication data AND trial details automatically!
        </div>
      `
    },

    troubleshooting: {
      id: "troubleshooting",
      title: "Troubleshooting - V1.5 Bug Fixes",
      content: `
        <h3>🔧 Critical Bugs Fixed in V1.5</h3>
        
        <h4>✅ Fixed Issues from Console Errors:</h4>

        <h5>1. Export Declaration Error</h5>
        <p><strong>Error:</strong> "export declarations may only appear at top level of a module"</p>
        <p><strong>Fix:</strong> ✅ Removed export statement from integrated-documentation.js</p>

        <h5>2. Missing getFilteredRequests Function</h5>
        <p><strong>Error:</strong> "SearchFilter.getFilteredRequests is not a function"</p>
        <p><strong>Fix:</strong> ✅ Added getFilteredRequests method to SearchFilter module</p>

        <h5>3. Bulk Paste Area Not Found</h5>
        <p><strong>Error:</strong> "Bulk paste area not found"</p>
        <p><strong>Fix:</strong> ✅ Updated HTML to include proper bulk-paste-textarea element</p>

        <h5>4. SearchFilter initFuse Undefined</h5>
        <p><strong>Error:</strong> "originalInitFuse is undefined"</p>
        <p><strong>Fix:</strong> ✅ Fixed SearchFilter initialization and Fuse.js integration</p>

        <h5>5. Module Loading Issues</h5>
        <p><strong>Error:</strong> Modules loading multiple times</p>
        <p><strong>Fix:</strong> ✅ Added proper module loading guards</p>

        <div class="help-success">
          <strong>✅ All Console Errors Resolved:</strong> V1.5 should load without any JavaScript errors.
        </div>
      `
    }
  };

  // Register with SilentStacks (no export)
  window.SilentStacks = window.SilentStacks || {};
  window.SilentStacks.documentation = documentationContent;

  console.log('📚 Fixed Documentation v1.5 loaded (no export errors)');

})();