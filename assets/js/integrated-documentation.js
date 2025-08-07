// assets/js/integrated-documentation.js
// SilentStacks V1.5 - Updated Integrated Documentation
// Reflects all fixes: sorting, delete, bulk PMID fetch, NLM format, Clinical Trials

export const documentationContent = {
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
        <li><strong>✅ REMOVED: Excel Dependencies</strong> - Pure CSV approach for maximum compatibility</li>
      </ul>

      <h4>🚀 Quick Start Guide:</h4>
      <ol>
        <li><strong>Single Request:</strong> Use "Add Request" → Enter PMID → Click "Lookup & Get Clinical Trials"</li>
        <li><strong>Bulk Import:</strong> Go to "Bulk Operations" → Paste PMIDs or upload CSV → Auto-fetch metadata</li>
        <li><strong>View & Manage:</strong> Use "All Requests" with working sort and delete functions</li>
        <li><strong>Export Data:</strong> Download as CSV in proper NLM format with DOCLINE numbers first</li>
      </ol>

      <h4>💡 Example Workflow - PMID 32658653:</h4>
      <p>1. Paste <code>32658653</code> in bulk upload</p>
      <p>2. System automatically fetches:</p>
      <ul>
        <li>✅ Title, authors (NLM format), journal, year, volume, pages</li>
        <li>✅ Associated clinical trials from ClinicalTrials.gov</li>
        <li>✅ DOI and MeSH terms</li>
        <li>✅ Formatted citation ready for export</li>
      </ul>

      <div class="help-tip">
        <strong>🎯 Perfect for DOCLINE Users:</strong> Upload "DOCLINE + PMID" pairs to get rich metadata while maintaining your existing workflow!
      </div>
    `
  },

  bulk_operations: {
    id: "bulk_operations",
    title: "Bulk Operations - Fixed & Enhanced V1.5",
    content: `
      <h3>Bulk Operations - All Issues Resolved!</h3>
      
      <h4>📥 Method 1: PMID Batch Upload (FIXED)</h4>
      <p><strong>Status:</strong> ✅ FULLY WORKING with auto-metadata fetch</p>
      
      <h5>Supported Formats:</h5>
      <pre>32658653
32658653, 138ABC123
PMID: 32658653, DOCLINE: 138ABC123
32658653 (Research notes here)

CSV Format:
PMID, DOCLINE, Status, Priority
32658653, 138ABC123, pending, normal
12345678, 139DEF456, in-progress, rush</pre>

      <h5>What Happens Automatically:</h5>
      <ul>
        <li>✅ <strong>PubMed API Fetch:</strong> Gets complete metadata for each PMID</li>
        <li>✅ <strong>NLM Formatting:</strong> Authors formatted as "Last, First Initial"</li>
        <li>✅ <strong>Clinical Trials:</strong> Searches ClinicalTrials.gov for related studies</li>
        <li>✅ <strong>Progress Tracking:</strong> Real-time updates during processing</li>
        <li>✅ <strong>Error Handling:</strong> Individual failures won't stop the batch</li>
      </ul>

      <h4>📁 Method 2: CSV File Upload (FIXED)</h4>
      <p><strong>Status:</strong> ✅ FULLY WORKING with enhanced error reporting</p>
      
      <h5>Required CSV Headers (case-insensitive):</h5>
      <ul>
        <li><strong>DOCLINE</strong> or <strong>DOCLINE Number</strong> - Your institution's request number</li>
        <li><strong>PMID</strong> - PubMed identifier (triggers auto-fetch)</li>
        <li><strong>Title, Authors, Journal, Year</strong> - Publication details</li>
        <li><strong>Status, Priority</strong> - Request management</li>
        <li><strong>Patron Email</strong> - Requester contact</li>
      </ul>

      <h4>🔄 Method 3: Bulk Updates (FIXED)</h4>
      <p><strong>Status:</strong> ✅ FULLY WORKING with proper selection tracking</p>
      
      <h5>How to Use:</h5>
      <ol>
        <li>Go to <strong>"All Requests"</strong> tab</li>
        <li>Use checkboxes to select multiple requests</li>
        <li>Return to <strong>"Bulk Operations"</strong> tab</li>
        <li>Use bulk update controls to change status or priority</li>
        <li>✅ Get confirmation of exactly how many items were updated</li>
      </ol>

      <h4>📤 Export (Enhanced NLM Format)</h4>
      <p><strong>New Export Order:</strong> DOCLINE first for institutional compatibility</p>
      <pre>DOCLINE, PMID, Title, Authors (NLM), Journal, Year, Volume, Issue, Pages, DOI, Status, Priority, Patron Email, Clinical Trials, Created Date, Updated Date, Notes</pre>

      <div class="help-success">
        <strong>✅ All V1.5 Features Working:</strong> Bulk upload displays immediately in All Requests, CSV upload functions perfectly, and bulk updates provide clear feedback!
      </div>
    `
  },

  pmid_clinical_trials: {
    id: "pmid_clinical_trials",
    title: "PMID + Clinical Trials Integration - NEW!",
    content: `
      <h3>🧪 Automatic Clinical Trials Discovery</h3>
      
      <h4>What's New in V1.5:</h4>
      <p>When you lookup a PMID or bulk import PMIDs, SilentStacks now automatically:</p>
      <ul>
        <li>✅ <strong>Fetches PubMed metadata</strong> in proper NLM citation format</li>
        <li>✅ <strong>Searches ClinicalTrials.gov</strong> for related clinical trials</li>
        <li>✅ <strong>Links NCT numbers</strong> found in abstracts or databases</li>
        <li>✅ <strong>Displays trial details</strong> including phase, status, and conditions</li>
        <li>✅ <strong>Includes in exports</strong> for comprehensive reporting</li>
      </ul>

      <h4>🔍 Example - PMID 32658653:</h4>
      <p>When you process this PMID, the system will:</p>
      <ol>
        <li><strong>Fetch Publication Data:</strong>
          <ul>
            <li>Title: [Full article title from PubMed]</li>
            <li>Authors: [Formatted as "Last, FI; Last, FI" in NLM style]</li>
            <li>Journal: [Full journal name, year, volume, issue, pages]</li>
            <li>DOI: [Digital object identifier if available]</li>
          </ul>
        </li>
        <li><strong>Search Clinical Trials:</strong>
          <ul>
            <li>Query ClinicalTrials.gov for references to PMID 32658653</li>
            <li>Find associated NCT numbers</li>
            <li>Retrieve trial details (phase, status, conditions, interventions)</li>
          </ul>
        </li>
        <li><strong>Create Complete Record:</strong>
          <ul>
            <li>Publication metadata in NLM format</li>
            <li>Linked clinical trials with trial details</li>
            <li>Ready for export or further management</li>
          </ul>
        </li>
      </ol>

      <h4>🎯 How Clinical Trials Are Found:</h4>
      <ul>
        <li><strong>Direct PMID References:</strong> Trials that cite the PMID in their results</li>
        <li><strong>NCT Numbers in Abstracts:</strong> Clinical trial IDs mentioned in article abstracts</li>
        <li><strong>Database Cross-References:</strong> Linked through PubMed's DataBank entries</li>
      </ul>

      <h4>📋 Clinical Trial Information Captured:</h4>
      <ul>
        <li><strong>NCT Number:</strong> Unique ClinicalTrials.gov identifier</li>
        <li><strong>Title:</strong> Brief and official study titles</li>
        <li><strong>Status:</strong> Recruiting, Completed, Terminated, etc.</li>
        <li><strong>Phase:</strong> Phase I, II, III, IV for interventional studies</li>
        <li><strong>Conditions:</strong> Medical conditions being studied</li>
        <li><strong>Interventions:</strong> Treatments or procedures being tested</li>
        <li><strong>Enrollment:</strong> Number of participants</li>
        <li><strong>Sponsors:</strong> Organizations funding the research</li>
      </ul>

      <div class="help-tip">
        <strong>💡 Bulk Processing:</strong> This works for bulk uploads too! Paste 100 PMIDs and get both publication metadata AND clinical trials data automatically.
      </div>

      <div class="help-success">
        <strong>🎉 Result:</strong> Every request now includes rich publication data in proper NLM format PLUS associated clinical research context!
      </div>
    `
  },

  nlm_formatting: {
    id: "nlm_formatting", 
    title: "NLM Format Implementation - FIXED!",
    content: `
      <h3>📚 NLM (National Library of Medicine) Format</h3>
      
      <h4>✅ What's Fixed in V1.5:</h4>
      <p>All citations and exports now follow proper NLM standards:</p>

      <h5>Author Formatting:</h5>
      <ul>
        <li><strong>Correct NLM Style:</strong> "Smith JA, Johnson BK, Williams CD"</li>
        <li><strong>Format:</strong> Last name, First Initial, Middle Initial (no periods)</li>
        <li><strong>Multiple Authors:</strong> Separated by semicolons</li>
        <li><strong>Auto-Conversion:</strong> PubMed data automatically formatted to NLM standards</li>
      </ul>

      <h5>Complete Citation Format:</h5>
      <pre>Authors. Title. Journal. Year;Volume(Issue):Pages. doi: DOI</pre>

      <h5>Example - Properly Formatted:</h5>
      <pre>Smith JA, Johnson BK, Williams CD. Effect of treatment on patient outcomes. 
N Engl J Med. 2020;382(15):1425-1434. doi: 10.1056/NEJMoa1234567</pre>

      <h4>🔄 Export Format (DOCLINE First):</h4>
      <p>CSV exports now follow institutional requirements:</p>
      <pre>DOCLINE, PMID, Title, Authors (NLM), Journal, Year, Volume, Issue, Pages, DOI, Status, Priority, Patron Email, Clinical Trials, Created Date, Updated Date, Notes</pre>

      <h4>🧪 Clinical Trials Integration:</h4>
      <p>Clinical trials information is formatted as:</p>
      <ul>
        <li><strong>Format:</strong> "NCT12345678: Brief Study Title"</li>
        <li><strong>Multiple Trials:</strong> Separated by semicolons</li>
        <li><strong>Export Ready:</strong> Included in CSV exports for comprehensive records</li>
      </ul>

      <h4>⚡ Automatic Processing:</h4>
      <p>V1.5 automatically handles NLM formatting:</p>
      <ul>
        <li>✅ <strong>PMID Lookup:</strong> Fetched data is NLM-formatted automatically</li>
        <li>✅ <strong>Bulk Upload:</strong> All processed records follow NLM standards</li>
        <li>✅ <strong>CSV Import:</strong> Existing data is reformatted to NLM standards</li>
        <li>✅ <strong>Display:</strong> All request cards show proper NLM formatting</li>
        <li>✅ <strong>Export:</strong> CSV and JSON exports maintain NLM formatting</li>
      </ul>

      <div class="help-tip">
        <strong>🎯 For Librarians:</strong> This ensures all your data meets standard bibliographic formatting requirements for reports, grants, and institutional documentation.
      </div>

      <div class="help-success">
        <strong>✅ Result:</strong> Every citation in your system now follows professional NLM standards automatically!
      </div>
    `
  },

  troubleshooting: {
    id: "troubleshooting",
    title: "Troubleshooting - V1.5 Solutions",
    content: `
      <h3>🔧 Troubleshooting Guide - All Issues Fixed!</h3>
      
      <h4>✅ Previously Reported Issues - Now RESOLVED:</h4>

      <h5>1. Delete Functions Not Working</h5>
      <p><strong>Status:</strong> ✅ FIXED</p>
      <ul>
        <li>✅ Individual delete buttons now work</li>
        <li>✅ Bulk delete with checkboxes functional</li>
        <li>✅ "Select All" checkbox works properly</li>
        <li>✅ Confirmation dialogs prevent accidental deletions</li>
      </ul>

      <h5>2. Sorting Functions Not Working</h5>
      <p><strong>Status:</strong> ✅ FIXED</p>
      <ul>
        <li>✅ All sort buttons functional (Date, Priority, Title, Journal, Status)</li>
        <li>✅ Visual indicators show current sort direction (↑↓)</li>
        <li>✅ Sort state persists during searches</li>
        <li>✅ Priority sorting follows logical order (Urgent → Rush → Normal → Low)</li>
      </ul>

      <h5>3. CSV Upload Not Working</h5>
      <p><strong>Status:</strong> ✅ FIXED</p>
      <ul>
        <li>✅ CSV file upload button functional</li>
        <li>✅ Progress tracking shows real-time processing</li>
        <li>✅ Error reporting identifies specific issues</li>
        <li>✅ Auto-fetch works during CSV processing</li>
      </ul>

      <h5>4. Bulk Upload Not Displaying in All Requests</h5>
      <p><strong>Status:</strong> ✅ FIXED</p>
      <ul>
        <li>✅ Bulk uploaded items immediately appear in All Requests</li>
        <li>✅ Request counter updates correctly</li>
        <li>✅ Search and filter work with bulk-imported data</li>
        <li>✅ Data persists in browser storage</li>
      </ul>

      <h4>🚀 New Features Working Perfectly:</h4>

      <h5>PMID Auto-Fetch with Clinical Trials</h5>
      <ul>
        <li>✅ Paste PMIDs and get instant metadata</li>
        <li>✅ NLM formatting applied automatically</li>
        <li>✅ Clinical trials discovered and linked</li>
        <li>✅ Progress tracking for large batches</li>
      </ul>

      <h5>Enhanced DOCLINE Integration</h5>
      <ul>
        <li>✅ DOCLINE numbers in bulk import</li>
        <li>✅ DOCLINE first in export format</li>
        <li>✅ "PMID + DOCLINE" batch processing</li>
        <li>✅ Maintains institutional workflow compatibility</li>
      </ul>

      <h4>🛠 If You Still Experience Issues:</h4>

      <h5>Clear Browser Cache</h5>
      <ol>
        <li>Hard refresh: <kbd>Ctrl+F5</kbd> (Windows) or <kbd>Cmd+Shift+R</kbd> (Mac)</li>
        <li>This ensures you're using the latest V1.5 JavaScript files</li>
      </ol>

      <h5>Check Browser Console (F12)</h5>
      <p>V1.5 includes comprehensive logging. Look for:</p>
      <ul>
        <li>✅ "Fixed Bulk Operations v1.5 module loaded"</li>
        <li>✅ "Fixed Search & Filter v1.5 module loaded"</li>
        <li>✅ "Enhanced API Integration v1.5 module loaded"</li>
      </ul>

      <h5>Test with Known PMID</h5>
      <p>Try bulk importing: <code>32658653</code></p>
      <p>Should auto-fetch complete metadata + clinical trials</p>

      <div class="help-success">
        <strong>✅ V1.5 Confidence:</strong> All previously reported issues have been resolved with comprehensive testing and enhanced error handling.
      </div>

      <div class="help-tip">
        <strong>🆘 Still Need Help?</strong> Check the browser console (F12) for specific error messages. V1.5 includes detailed logging for troubleshooting.
      </div>
    `
  }
};

// Export for use in application
if (typeof window !== 'undefined') {
  window.SilentStacks = window.SilentStacks || {};
  window.SilentStacks.documentation = documentationContent;
}