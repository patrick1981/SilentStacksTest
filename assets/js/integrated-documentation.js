// assets/js/updated-documentation-v14.js
// SilentStacks V1.4 - Updated Integrated Documentation

export const documentationContent = {
  getting_started: {
    id: "getting_started",
    title: "Getting Started with SilentStacks",
    content: `
      <h3>Welcome to SilentStacks V1.4</h3>
      
      <h4>What's New in V1.4:</h4>
      <ul>
        <li><strong>Fixed bulk upload display issues</strong> - Items now properly appear in All Requests</li>
        <li><strong>Enhanced upload confirmations</strong> - Clear success/failure messaging with details</li>
        <li><strong>Improved CSV functionality</strong> - Working CSV upload with PMID API integration</li>
        <li><strong>Reorganized export headers</strong> - Export format matches institutional requirements</li>
        <li><strong>Enhanced DOCLINE support</strong> - Seamless DOCLINE + PMID workflow</li>
        <li><strong>Technology-agnostic approach</strong> - CSV format for maximum compatibility</li>
      </ul>

      <h4>Quick Start Guide:</h4>
      <ol>
        <li><strong>Add Single Request:</strong> Use "Add Request" tab with PMID lookup for auto-population</li>
        <li><strong>Bulk Import:</strong> Go to Import/Export, paste PMIDs or upload CSV</li>
        <li><strong>View & Manage:</strong> Use "All Requests" to view, search, and update requests</li>
        <li><strong>Export Data:</strong> Download as CSV or JSON for external use</li>
      </ol>

      <h4>Key Features:</h4>
      <ul>
        <li><strong>PubMed API Integration:</strong> Automatic metadata fetching from PMIDs</li>
        <li><strong>CrossRef API:</strong> DOI-based metadata retrieval</li>
        <li><strong>DOCLINE Integration:</strong> Track existing DOCLINE requests with enhanced metadata</li>
        <li><strong>Bulk Operations:</strong> Import, export, and update multiple requests</li>
        <li><strong>Technology Agnostic:</strong> CSV format works with any spreadsheet software</li>
        <li><strong>Responsive Design:</strong> Works on desktop, tablet, and mobile</li>
      </ul>

      <div class="help-tip">
        <strong>🚀 Pro Tip:</strong> Start by bulk importing your existing DOCLINE numbers with PMIDs - SilentStacks will automatically enrich them with complete metadata!
      </div>
    `
  },

  bulk_operations: {
    id: "bulk_operations", 
    title: "Bulk Operations & Import - FIXED V1.4",
    content: `
      <h3>Working with Multiple Requests (V1.4 Fixed)</h3>
      
      <h4>✅ FIXED Issues in V1.4:</h4>
      <ul>
        <li><strong>Bulk paste items now display properly</strong> in All Requests tab</li>
        <li><strong>Upload confirmations show detailed results</strong> including success/failure counts</li>
        <li><strong>CSV upload functionality is now operational</strong> with API integration</li>
        <li><strong>Progress indicators work correctly</strong> during bulk operations</li>
      </ul>

      <h4>Bulk Import Methods:</h4>
      
      <h5>Method 1: Simple PMID/DOCLINE List</h5>
      <p>Paste a simple list in the bulk paste area - most efficient for large lists:</p>
      <pre>12345678
23456789
34567890
138ABC123
139DEF456</pre>
      <p>✅ <strong>V1.4:</strong> Items will automatically appear in All Requests after processing</p>

      <h5>Method 2: CSV Upload (FIXED)</h5>
      <p>Upload CSV files with any combination of these headers:</p>
      <pre>DOCLINE,PMID,Status,Priority,Patron Email
138ABC123,12345678,pending,rush,user@library.edu
139DEF456,23456789,in-progress,normal,patron@university.edu</pre>
      <p>✅ <strong>V1.4:</strong> CSV upload now works properly with automatic API enrichment</p>

      <h5>Method 3: CSV Data Paste</h5>
      <p>Copy/paste CSV data directly into the bulk paste area:</p>
      <pre>PMID,DOCLINE,Title,Status
12345678,138ABC123,"Existing Research Title",pending
23456789,,"Auto-fetch this title",in-progress</pre>

      <h4>Enhanced DOCLINE + PMID Workflow:</h4>
      <p>Perfect for existing DOCLINE users who want enhanced metadata:</p>
      <ol>
        <li><strong>Export from DOCLINE:</strong> Get your request list with DOCLINE numbers</li>
        <li><strong>Add PMIDs:</strong> Include PMIDs when available</li>
        <li><strong>Import to SilentStacks:</strong> Bulk paste or upload CSV</li>
        <li><strong>Auto-enrichment:</strong> System fetches complete publication metadata</li>
        <li><strong>Enhanced tracking:</strong> Now have rich metadata + DOCLINE tracking</li>
        <li><strong>Export enriched data:</strong> Download complete dataset</li>
      </ol>

      <h4>Supported Import Headers (Case-Insensitive):</h4>
      <ul>
        <li><strong>DOCLINE/docline:</strong> DOCLINE request number (e.g., 138ABC123)</li>
        <li><strong>PMID/pmid:</strong> PubMed identifier for auto-enrichment</li>
        <li><strong>DOI/doi:</strong> Digital Object Identifier for auto-enrichment</li>
        <li><strong>Title/title:</strong> Publication title</li>
        <li><strong>Authors/authors:</strong> Author names</li>
        <li><strong>Journal/journal:</strong> Publication source</li>
        <li><strong>Year/year:</strong> Publication year</li>
        <li><strong>Priority/priority:</strong> Low, Normal, Rush, Urgent</li>
        <li><strong>Status/status:</strong> Request status</li>
        <li><strong>Patron Email/patron_email:</strong> Requesting user contact</li>
        <li><strong>Tags/tags:</strong> Comma-separated keywords</li>
        <li><strong>Notes/notes:</strong> Additional information</li>
      </ul>

      <h4>✅ V1.4 Bulk Updates (FIXED):</h4>
      <p>Update multiple existing requests simultaneously:</p>
      <ol>
        <li>Go to <strong>All Requests</strong> tab</li>
        <li>Select requests using checkboxes</li>
        <li>Go to <strong>Import/Export</strong> tab</li>
        <li>Use <strong>Bulk Update Operations</strong> to change status or priority</li>
        <li><strong>Confirmation messages</strong> now show exactly how many items were updated</li>
      </ol>

      <div class="help-tip">
        <strong>🔬 Auto-Enrichment:</strong> Any PMID or DOI in your import automatically fetches complete publication metadata from PubMed/CrossRef!
      </div>

      <div class="help-success">
        <strong>✅ V1.4 Improvements:</strong> All bulk operations now provide clear feedback and properly update the All Requests view.
      </div>
    `
  },

  docline_integration: {
    id: "docline_integration",
    title: "DOCLINE Integration & Enhanced Workflow",
    content: `
      <h3>DOCLINE Integration & Enhanced Workflow</h3>
      
      <h4>Why Use SilentStacks with DOCLINE?</h4>
      <p>SilentStacks enhances your existing DOCLINE workflow by:</p>
      <ul>
        <li><strong>Automatic metadata enrichment:</strong> Turn sparse DOCLINE data into rich publication records</li>
        <li><strong>Enhanced searching:</strong> Find requests by title, author, journal, not just DOCLINE numbers</li>
        <li><strong>Patron communication:</strong> Track patron emails and communication</li>
        <li><strong>Reporting:</strong> Generate detailed reports with complete publication information</li>
        <li><strong>API integration:</strong> Automatic PubMed and CrossRef lookups</li>
      </ul>

      <h4>DOCLINE + PMID Power Workflow:</h4>
      <p>The most efficient way to enhance existing DOCLINE requests:</p>
      
      <h5>Step 1: Prepare Your Data</h5>
      <pre>DOCLINE,PMID,Status
138ABC123,12345678,pending
139DEF456,23456789,in-progress
140GHI789,34567890,pending</pre>

      <h5>Step 2: Bulk Import</h5>
      <ol>
        <li>Go to <strong>Import/Export</strong> tab</li>
        <li>Either paste the data or upload as CSV file</li>
        <li>Ensure <strong>"Automatically fetch metadata"</strong> is checked</li>
        <li>Click <strong>"Import Pasted Data with Auto-Fetch"</strong></li>
      </ol>

      <h5>Step 3: Automatic Enrichment</h5>
      <p>SilentStacks will:</p>
      <ul>
        <li>Keep your DOCLINE numbers intact</li>
        <li>Use PMIDs to fetch complete publication metadata</li>
        <li>Add title, authors, journal, year, DOI</li>
        <li>Preserve your status and priority settings</li>
      </ul>

      <h5>Step 4: Enhanced Management</h5>
      <p>Now you can:</p>
      <ul>
        <li>Search by publication title or author name</li>
        <li>Generate reports with complete citation information</li>
        <li>Export enriched data back to your systems</li>
        <li>Track patron communications</li>
      </ul>

      <h4>DOCLINE Number Formats Supported:</h4>
      <ul>
        <li><strong>Standard DOCLINE:</strong> 138ABC123, 139DEF456</li>
        <li><strong>Numeric only:</strong> 1234567, 9876543</li>
        <li><strong>Institution-specific:</strong> LIB-2024-001, REQ-456789</li>
        <li><strong>Legacy formats:</strong> Various older DOCLINE formats</li>
      </ul>

      <h4>Export Options for DOCLINE Users:</h4>
      <p>When you export, the CSV includes DOCLINE numbers in the first column:</p>
      <pre>Docline Number,PMID,Patron E-mail,Article Title,Authors,Journal,Year,DOI,Date Stamp,Status,Priority</pre>
      <p>This format is designed to integrate back into institutional workflows.</p>

      <div class="help-tip">
        <strong>🔗 Best Practice:</strong> Always include both DOCLINE number and PMID when possible for complete tracking and automatic metadata enhancement!
      </div>

      <div class="help-success">
        <strong>💡 Efficiency Tip:</strong> Export your DOCLINE requests with PMIDs, import to SilentStacks for enrichment, then export the enhanced data for reporting or integration with other systems.
      </div>
    `
  },

  export_formats: {
    id: "export_formats",
    title: "Export & Data Portability - Updated V1.4",
    content: `
      <h3>Export & Data Portability (V1.4 Updated)</h3>
      
      <h4>✅ V1.4 Export Improvements:</h4>
      <ul>
        <li><strong>Fixed header order:</strong> CSV exports now use institutional standard field order</li>
        <li><strong>Enhanced confirmation:</strong> Clear success messages with file names</li>
        <li><strong>Technology-agnostic focus:</strong> Removed Excel references, emphasized CSV compatibility</li>
        <li><strong>DOCLINE-first ordering:</strong> Export format optimized for DOCLINE workflows</li>
      </ul>

      <h4>Export Formats:</h4>
      
      <h5>CSV Export (Recommended)</h5>
      <p>Technology-agnostic format with institutional header order:</p>
      <pre>Docline Number, PMID, Patron E-mail, Article Title, Authors, Journal, 
Year, DOI, Date Stamp, Status, Priority, Tags, Notes, Last Updated</pre>
      
      <p><strong>Compatible with:</strong></p>
      <ul>
        <li>Microsoft Excel (any version)</li>
        <li>Google Sheets</li>
        <li>LibreOffice Calc</li>
        <li>Apple Numbers</li>
        <li>Any database system</li>
        <li>Statistical software (R, SPSS, etc.)</li>
        <li>Custom applications via CSV import</li>
      </ul>

      <h5>JSON Export</h5>
      <p>Structured data format for system integration and backup:</p>
      <pre>{
  "exportInfo": {
    "application": "SilentStacks",
    "version": "1.4",
    "exportDate": "2024-08-07T10:30:00Z",
    "recordCount": 150
  },
  "requests": [ ... ]
}</pre>

      <h4>Why No Excel/XLSX Support?</h4>
      <p>SilentStacks uses technology-agnostic formats to ensure:</p>
      <ul>
        <li><strong>Universal compatibility:</strong> CSV works everywhere, forever</li>
        <li><strong>No vendor lock-in:</strong> Your data isn't tied to proprietary formats</li>
        <li><strong>Long-term accessibility:</strong> CSV is plain text, always readable</li>
        <li><strong>Cross-platform support:</strong> Works on Windows, Mac, Linux, mobile</li>
        <li><strong>Smaller file sizes:</strong> More efficient than binary formats</li>
        <li><strong>Version independent:</strong> No compatibility issues between software versions</li>
      </ul>

      <h4>Excel Users Workflow:</h4>
      <ol>
        <li><strong>Export from SilentStacks:</strong> Download CSV file</li>
        <li><strong>Open in Excel:</strong> CSV files open directly in Excel</li>
        <li><strong>Edit as needed:</strong> Use Excel's full functionality</li>
        <li><strong>Save as CSV:</strong> File → Save As → CSV format</li>
        <li><strong>Re-import to SilentStacks:</strong> Upload the modified CSV</li>
      </ol>

      <h4>Export Data Structure:</h4>
      <p>All exports include complete request information:</p>
      <ul>
        <li><strong>Identification:</strong> DOCLINE number, PMID, DOI</li>
        <li><strong>Publication data:</strong> Title, authors, journal, year</li>
        <li><strong>Request details:</strong> Status, priority, patron email</li>
        <li><strong>Tracking info:</strong> Creation date, last update</li>
        <li><strong>Organization:</strong> Tags, notes, custom fields</li>
      </ul>

      <h4>Selective Export:</h4>
      <p>Export only the records you need:</p>
      <ol>
        <li>Go to <strong>All Requests</strong> tab</li>
        <li>Use filters to find desired records</li>
        <li>Select specific requests using checkboxes</li>
        <li>Go to <strong>Import/Export</strong> tab</li>
        <li>Use bulk export functions for selected items</li>
      </ol>

      <div class="help-tip">
        <strong>📊 For Excel Users:</strong> Just open our CSV exports directly in Excel - they'll display perfectly formatted and ready to use!
      </div>

      <div class="help-success">
        <strong>🌐 Technology Agnostic:</strong> SilentStacks' CSV format ensures your data will always be accessible, regardless of what software you use now or in the future.
      </div>
    `
  },

  adding_requests: {
    id: "adding_requests",
    title: "Adding Requests - Enhanced V1.4",
    content: `
      <h3>Creating New ILL Requests (V1.4 Enhanced)</h3>
      
      <h4>Manual Entry Process:</h4>
      <ol>
        <li>Click <strong>"Add Request"</strong> in the navigation</li>
        <li>Choose your entry method based on available information:</li>
      </ol>

      <h5>Method 1: PMID Lookup (Fastest)</h5>
      <ol>
        <li>Enter PMID in the PMID field (e.g., 12345678)</li>
        <li>Click <strong>"Lookup PMID"</strong> button</li>
        <li>System automatically fills: title, authors, journal, year, DOI</li>
        <li>Add DOCLINE number if this relates to existing DOCLINE request</li>
        <li>Set priority and add patron email</li>
        <li>Click <strong>"Submit Request"</strong></li>
      </ol>

      <h5>Method 2: DOI Lookup</h5>
      <ol>
        <li>Enter DOI (e.g., 10.1000/example.doi)</li>
        <li>Click <strong>"Lookup DOI"</strong> button</li>
        <li>System fetches metadata from CrossRef</li>
        <li>Complete remaining fields as needed</li>
      </ol>

      <h5>Method 3: Manual Entry</h5>
      <ol>
        <li>Fill in publication details manually</li>
        <li>Include DOCLINE number for tracking</li>
        <li>Set appropriate priority level</li>
        <li>Add patron contact information</li>
      </ol>

      <h4>Form Fields Explained:</h4>
      
      <h5>Identification Fields:</h5>
      <ul>
        <li><strong>PMID:</strong> PubMed identifier - enables automatic metadata fetching</li>
        <li><strong>DOI:</strong> Digital Object Identifier - alternative to PMID for lookups</li>
        <li><strong>DOCLINE:</strong> Existing DOCLINE request number (e.g., 138ABC123)</li>
      </ul>

      <h5>Publication Details:</h5>
      <ul>
        <li><strong>Title:</strong> Publication title (required if no PMID/DOI)</li>
        <li><strong>Authors:</strong> Use "Last, First Initial" format, separate with semicolons</li>
        <li><strong>Journal:</strong> Full journal name or publication source</li>
        <li><strong>Year:</strong> 4-digit publication year</li>
      </ul>

      <h5>Request Management:</h5>
      <ul>
        <li><strong>Priority:</strong> 
          <ul>
            <li><em>Urgent</em> - Critical patient care</li>
            <li><em>Rush</em> - Expedited timeline</li>
            <li><em>Normal</em> - Standard processing</li>
            <li><em>Low</em> - No rush</li>
          </ul>
        </li>
        <li><strong>Status:</strong> Pending, In Progress, Fulfilled, Cancelled, On Hold</li>
        <li><strong>Patron Email:</strong> Contact information for requesting user</li>
        <li><strong>Tags:</strong> Keywords for organization (comma-separated)</li>
        <li><strong>Notes:</strong> Special instructions or additional information</li>
      </ul>

      <h4>DOCLINE Integration Workflow:</h4>
      <p>When adding requests that originated from DOCLINE:</p>
      <ol>
        <li><strong>Include DOCLINE number:</strong> Maintain link to original request</li>
        <li><strong>Use PMID lookup:</strong> Enhance sparse DOCLINE data with rich metadata</li>
        <li><strong>Preserve request details:</strong> Keep original priority and status</li>
        <li><strong>Add patron info:</strong> Include contact details for follow-up</li>
      </ol>

      <h4>API-Powered Features:</h4>
      <ul>
        <li><strong>PubMed Integration:</strong> Automatic title, authors, journal, year, MeSH terms</li>
        <li><strong>CrossRef Integration:</strong> DOI-based metadata retrieval</li>
        <li><strong>Automatic validation:</strong> System checks data consistency</li>
        <li><strong>Duplicate detection:</strong> Warns if similar requests exist</li>
      </ul>

      <div class="help-tip">
        <strong>⚡ Speed Tip:</strong> For fastest entry, just paste a PMID and click "Lookup PMID" - most fields fill automatically!
      </div>

      <div class="help-success">
        <strong>🔗 DOCLINE Users:</strong> Include your DOCLINE number when creating requests to maintain full traceability between systems.
      </div>
    `
  },

  searching_filtering: {
    id: "searching_filtering", 
    title: "Search & Filter - Enhanced V1.4",
    content: `
      <h3>Finding Your Requests (V1.4 Enhanced)</h3>
      
      <h4>✅ V1.4 Search Improvements:</h4>
      <ul>
        <li><strong>Fixed result display:</strong> Search results now properly update the view</li>
        <li><strong>Enhanced DOCLINE search:</strong> Find requests by DOCLINE numbers</li>
        <li><strong>Improved filtering:</strong> Multiple filter combinations work correctly</li>
      </ul>

      <h4>Search Functionality:</h4>
      <p>Use the search box to find requests across all fields:</p>
      
      <h5>Search by Publication Info:</h5>
      <ul>
        <li><strong>Title keywords:</strong> "cancer therapy", "covid treatment"</li>
        <li><strong>Author names:</strong> "Smith", "Johnson", "Garcia"</li>
        <li><strong>Journal names:</strong> "Nature", "NEJM", "Cell"</li>
        <li><strong>Publication years:</strong> "2023", "2024"</li>
      </ul>

      <h5>Search by Request Details:</h5>
      <ul>
        <li><strong>PMID numbers:</strong> "12345678", "87654321"</li>
        <li><strong>DOI strings:</strong> "10.1000", "nature.2024"</li>
        <li><strong>DOCLINE numbers:</strong> "138ABC123", "DEF456"</li>
        <li><strong>Patron emails:</strong> "user@library.edu", "patron@university"</li>
        <li><strong>Tags/keywords:</strong> "oncology", "urgent", "cardiology"</li>
      </ul>

      <h4>Advanced Filtering:</h4>
      
      <h5>Status Filtering:</h5>
      <ul>
        <li><strong>Pending:</strong> New requests awaiting action</li>
        <li><strong>In Progress:</strong> Currently being processed</li>
        <li><strong>Fulfilled:</strong> Successfully completed</li>
        <li><strong>Cancelled:</strong> Cancelled requests</li>
        <li><strong>On Hold:</strong> Temporarily suspended</li>
      </ul>

      <h5>Priority Filtering:</h5>
      <ul>
        <li><strong>Urgent:</strong> Critical patient care requests</li>
        <li><strong>Rush:</strong> Expedited timeline requests</li>
        <li><strong>Normal:</strong> Standard processing requests</li>
        <li><strong>Low:</strong> No-rush requests</li>
      </ul>

      <h5>Date Range Filtering:</h5>
      <ul>
        <li><strong>Today:</strong> Requests created today</li>
        <li><strong>This Week:</strong> Last 7 days</li>
        <li><strong>This Month:</strong> Last 30 days</li>
        <li><strong>Custom Range:</strong> Specify exact date range</li>
      </ul>

      <h4>Sorting Options:</h4>
      <p>Click column headers to sort by:</p>
      <ul>
        <li><strong>Date Created:</strong> Newest or oldest first</li>
        <li><strong>Priority Level:</strong> Urgent → Low or Low → Urgent</li>
        <li><strong>Title:</strong> Alphabetical order</li>
        <li><strong>Status:</strong> Group by request status</li>
        <li><strong>DOCLINE Number:</strong> Numerical/alphabetical order</li>
        <li><strong>Patron Email:</strong> Alphabetical by patron</li>
      </ul>

      <h4>Combined Search & Filter:</h4>
      <p>Use multiple criteria for precise results:</p>
      <ol>
        <li><strong>Filter by status:</strong> Show only "Pending" requests</li>
        <li><strong>Filter by priority:</strong> Add "Rush" priority filter</li>
        <li><strong>Search by keyword:</strong> Add "cardiology" in search box</li>
        <li><strong>Result:</strong> Only pending, rush-priority cardiology requests</li>
      </ol>

      <h4>DOCLINE-Specific Searching:</h4>
      <p>Enhanced search capabilities for DOCLINE users:</p>
      <ul>
        <li><strong>DOCLINE number search:</strong> Find by exact or partial DOCLINE numbers</li>
        <li><strong>Batch DOCLINE search:</strong> Search for multiple DOCLINE numbers</li>
        <li><strong>DOCLINE + content search:</strong> Find DOCLINE requests about specific topics</li>
        <li><strong>Missing DOCLINE filter:</strong> Find requests without DOCLINE numbers</li>
      </ul>

      <h4>Quick Filter Shortcuts:</h4>
      <ul>
        <li><strong>Today's Requests:</strong> Click date filter → Today</li>
        <li><strong>Urgent Items:</strong> Priority filter → Urgent</li>
        <li><strong>Pending Work:</strong> Status filter → Pending + In Progress</li>
        <li><strong>My Patron's Requests:</strong> Search by patron email domain</li>
      </ul>

      <div class="help-tip">
        <strong>🔍 Search Tips:</strong> Search works across all fields including DOCLINE numbers. Use partial matches for flexibility - searching "138" will find "138ABC123".
      </div>

      <div class="help-success">
        <strong>💡 Pro Tip:</strong> Combine filters with search for powerful query capabilities. For example: Priority=Rush + Search="cardiology" finds all urgent cardiology requests.
      </div>
    `
  },

  troubleshooting_v14: {
    id: "troubleshooting_v14",
    title: "V1.4 Troubleshooting & Known Issues",
    content: `
      <h3>V1.4 Troubleshooting & Fixed Issues</h3>
      
      <h4>✅ FIXED in V1.4:</h4>
      
      <h5>1. Bulk Upload Display Issue</h5>
      <p><strong>Problem:</strong> Items uploaded via bulk paste/CSV not appearing in All Requests tab</p>
      <p><strong>Status:</strong> ✅ FIXED - Items now properly refresh and display</p>
      <p><strong>Solution implemented:</strong> Enhanced refresh mechanism forces All Requests view update</p>

      <h5>2. Missing Upload Confirmations</h5>
      <p><strong>Problem:</strong> No feedback on successful/failed uploads</p>
      <p><strong>Status:</strong> ✅ FIXED - Detailed confirmation messages now display</p>
      <p><strong>Details shown:</strong> Total processed, successful, failed, API-enriched counts</p>

      <h5>3. CSV Upload Functionality</h5>
      <p><strong>Problem:</strong> CSV file upload was non-operational</p>
      <p><strong>Status:</strong> ✅ FIXED - CSV upload now works with PMID API integration</p>
      <p><strong>Features:</strong> Auto-enrichment, progress tracking, error handling</p>

      <h5>4. Export Header Order</h5>
      <p><strong>Problem:</strong> Export headers didn't match institutional requirements</p>
      <p><strong>Status:</strong> ✅ FIXED - Headers now follow required format</p>
      <p><strong>New order:</strong> Docline Number, PMID, Patron E-mail, Article Metadata, Date Stamp</p>

      <h4>Current V1.4 Capabilities:</h4>
      <ul>
        <li>✅ Bulk paste with immediate display in All Requests</li>
        <li>✅ CSV file upload with progress tracking</li>
        <li>✅ Detailed upload success/failure confirmations</li>
        <li>✅ Working bulk status and priority updates</li>
        <li>✅ PMID API auto-enrichment during uploads</li>
        <li>✅ DOCLINE + PMID workflow integration</li>
        <li>✅ Technology-agnostic CSV export format</li>
        <li>✅ Enhanced error reporting and handling</li>
      </ul>

      <h4>If You Still Experience Issues:</h4>
      
      <h5>Clear Browser Cache</h5>
      <ol>
        <li>Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)</li>
        <li>Or clear browser cache and reload page</li>
        <li>This ensures you're using V1.4 JavaScript files</li>
      </ol>

      <h5>Check Console for Errors</h5>
      <ol>
        <li>Press F12 to open developer tools</li>
        <li>Click "Console" tab</li>
        <li>Look for error messages during upload/display</li>
        <li>V1.4 includes enhanced console logging for debugging</li>
      </ol>

      <h5>Verify Upload Data Format</h5>
      <p>Ensure your data includes minimum required fields:</p>
      <ul>
        <li><strong>Minimum required:</strong> Title OR PMID OR DOI OR DOCLINE</li>
        <li><strong>Recommended:</strong> DOCLINE + PMID for best results</li>
        <li><strong>Headers:</strong> Use supported header names (case-insensitive)</li>
      </ul>

      <h4>Performance Notes:</h4>
      <ul>
        <li><strong>Large imports:</strong> 1000+ items may take several minutes due to API rate limits</li>
        <li><strong>API lookups:</strong> PMID/DOI enrichment adds processing time but provides rich metadata</li>
        <li><strong>Batch processing:</strong> V1.4 processes in small batches to avoid timeouts</li>
      </ul>

      <h4>Data Validation:</h4>
      <p>V1.4 includes enhanced data validation:</p>
      <ul>
        <li><strong>PMID format:</strong> Must be numeric (e.g., 12345678)</li>
        <li><strong>DOI format:</strong> Must contain "10." prefix</li>
        <li><strong>Email format:</strong> Basic email validation for patron emails</li>
        <li><strong>Priority values:</strong> Must be: urgent, rush, normal, low</li>
        <li><strong>Status values:</strong> Must be: pending, in-progress, fulfilled, cancelled, on-hold</li>
      </ul>

      <div class="help-success">
        <strong>✅ V1.4 Status:</strong> All major bulk operation issues have been resolved. Upload confirmations, display refresh, and CSV functionality are now working properly.
      </div>

      <div class="help-tip">
        <strong>🔧 Debug Mode:</strong> V1.4 includes enhanced console logging. Check browser console (F12) for detailed processing information during bulk operations.
      </div>
    `
  }
};

// Export the documentation content for use in the main documentation system
export function updateDocumentationContent() {
  // This function updates the integrated documentation with V1.4 content
  if (window.IntegratedDocumentation) {
    Object.keys(documentationContent).forEach(key => {
      window.IntegratedDocumentation.updateSection(key, documentationContent[key]);
    });
    console.log('📚 Documentation updated to V1.4');
  }
}

// Auto-update documentation when this module loads
document.addEventListener('DOMContentLoaded', () => {
  updateDocumentationContent();
});
