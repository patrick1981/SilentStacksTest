// Updated Integrated Documentation for SilentStacks v1.3.0
// Reflects: PMID auto-fetch, bulk updates, DOCLINE support, removed Excel references

(function() {
  'use strict';

  console.log('📚 Loading Updated Integrated Documentation v1.3.0...');

  const documentationSections = [
    {
      id: "getting_started",
      title: "Getting Started",
      content: `
        <h3>Welcome to SilentStacks v1.3.0</h3>
        
        <p>SilentStacks is a client-side application for managing Interlibrary Loan (ILL) requests with advanced features including:</p>
        
        <ul>
          <li><strong>Automatic metadata fetching</strong> from PubMed and CrossRef APIs</li>
          <li><strong>Bulk operations</strong> for importing and updating multiple requests</li>
          <li><strong>DOCLINE integration</strong> for existing ILL workflows</li>
          <li><strong>Offline capability</strong> with automatic sync when online</li>
          <li><strong>Technology-agnostic CSV/JSON formats</strong> for data portability</li>
        </ul>

        <h4>Quick Start:</h4>
        <ol>
          <li>Add your first request using <strong>"Add Request"</strong></li>
          <li>Enter a PMID or DOI to automatically fetch publication details</li>
          <li>Use <strong>"Import/Export"</strong> for bulk operations</li>
          <li>View and manage all requests in <strong>"All Requests"</strong></li>
        </ol>

        <div class="help-tip">
          <strong>💡 Pro Tip:</strong> Start with a few PMIDs to see the automatic metadata fetching in action!
        </div>
      `
    },
    {
      id: "adding_requests",
      title: "Adding Requests",
      content: `
        <h3>Creating New ILL Requests</h3>
        
        <h4>Manual Entry:</h4>
        <ol>
          <li>Click <strong>"Add Request"</strong> in the navigation</li>
          <li>Fill in required fields (Title is mandatory)</li>
          <li>Use <strong>"Lookup PMID"</strong> or <strong>"Lookup DOI"</strong> buttons for automatic population</li>
          <li>Add DOCLINE number if this is an existing DOCLINE request</li>
          <li>Set priority and add tags as needed</li>
          <li>Click <strong>"Submit Request"</strong></li>
        </ol>

        <h4>API-Powered Lookups:</h4>
        <p>Enter a PMID (PubMed ID) or DOI and click the respective lookup button:</p>
        <ul>
          <li><strong>PMID Lookup:</strong> Fetches title, authors, journal, year from PubMed</li>
          <li><strong>DOI Lookup:</strong> Fetches metadata from CrossRef database</li>
          <li><strong>Automatic MeSH terms:</strong> Medical subject headings are included when available</li>
        </ul>

        <h4>Form Fields:</h4>
        <ul>
          <li><strong>PMID/DOI:</strong> Use for automatic metadata fetching</li>
          <li><strong>DOCLINE:</strong> Existing DOCLINE request number (e.g., 138ABC123)</li>
          <li><strong>Title:</strong> Publication title (required)</li>
          <li><strong>Authors, Journal, Year:</strong> Publication details</li>
          <li><strong>Priority:</strong> Low, Normal, Rush, Urgent</li>
          <li><strong>Status:</strong> Pending, In Progress, Fulfilled, Cancelled, On Hold</li>
          <li><strong>Tags:</strong> Comma-separated keywords for organization</li>
          <li><strong>Patron Email:</strong> Requesting user's contact</li>
          <li><strong>Notes:</strong> Additional information or special instructions</li>
        </ul>

        <div class="help-tip">
          <strong>⚡ Quick Entry:</strong> Just enter a PMID and click "Lookup PMID" - most fields will be filled automatically!
        </div>
      `
    },
    {
      id: "bulk_operations",
      title: "Bulk Operations & Import",
      content: `
        <h3>Working with Multiple Requests</h3>
        
        <h4>Bulk Import with Auto-Fetch:</h4>
        <p>Import multiple requests and automatically fetch metadata:</p>
        <ol>
          <li>Go to <strong>Import/Export</strong> section</li>
          <li>Choose from three import methods:</li>
        </ol>

        <h5>Method 1: File Upload</h5>
        <ul>
          <li>Upload CSV or JSON files</li>
          <li>PMIDs and DOIs will automatically fetch metadata</li>
          <li>Supports DOCLINE numbers</li>
        </ul>

        <h5>Method 2: Simple PMID/DOI List</h5>
        <p>Paste a simple list in the bulk paste area:</p>
        <pre>12345678
23456789
10.1000/example.doi</pre>

        <h5>Method 3: CSV Data Paste</h5>
        <p>Paste CSV data with headers:</p>
        <pre>PMID,DOCLINE,Status,Priority
12345678,138ABC123,pending,rush
23456789,,in-progress,normal</pre>

        <h4>Supported Import Headers:</h4>
        <p>The system recognizes these column headers (case-insensitive):</p>
        <ul>
          <li><strong>PMID/pmid:</strong> PubMed identifier</li>
          <li><strong>DOI/doi:</strong> Digital Object Identifier</li>
          <li><strong>DOCLINE/docline:</strong> DOCLINE request number</li>
          <li><strong>Title/title:</strong> Publication title</li>
          <li><strong>Authors/authors:</strong> Author names</li>
          <li><strong>Journal/journal:</strong> Journal name</li>
          <li><strong>Year/year:</strong> Publication year</li>
          <li><strong>Priority/priority:</strong> Low, Normal, Rush, Urgent</li>
          <li><strong>Status/status:</strong> Request status</li>
          <li><strong>Tags/tags:</strong> Comma-separated keywords</li>
          <li><strong>Patron Email/patron_email:</strong> Requesting user email</li>
          <li><strong>Notes/notes:</strong> Additional information</li>
        </ul>

        <h4>Bulk Updates:</h4>
        <p>Update multiple existing requests simultaneously:</p>
        <ol>
          <li>Go to <strong>All Requests</strong></li>
          <li>Select requests using checkboxes</li>
          <li>Go to <strong>Import/Export</strong></li>
          <li>Use <strong>Bulk Update Operations</strong> to change status or priority</li>
        </ol>

        <div class="help-tip">
          <strong>🚀 Auto-Enrichment:</strong> Any PMID or DOI in your import will automatically fetch complete publication metadata!
        </div>

        <div class="help-warning">
          <strong>⚠️ Performance:</strong> Large imports (>1000 items) with API lookups may take several minutes due to rate limiting.
        </div>
      `
    },
    {
      id: "export_formats",
      title: "Export & Data Portability",
      content: `
        <h3>Exporting Your Data</h3>
        
        <h4>Export Formats:</h4>
        <ul>
          <li><strong>CSV:</strong> Technology-agnostic format compatible with any spreadsheet software</li>
          <li><strong>JSON:</strong> Structured data format for backup and system integration</li>
        </ul>

        <h4>CSV Export Fields:</h4>
        <p>The CSV export includes all fields for maximum compatibility:</p>
        <pre>PMID, DOI, Title, Authors, Journal, Year, Status, 
Priority, Tags, Notes, Patron Email, DOCLINE, 
Created, Updated</pre>

        <h4>Why No Excel Support:</h4>
        <p>SilentStacks uses technology-agnostic formats to ensure:</p>
        <ul>
          <li><strong>Universal compatibility:</strong> CSV works with Excel, Google Sheets, LibreOffice, and any database</li>
          <li><strong>Long-term accessibility:</strong> CSV is a plain text format that will always be readable</li>
          <li><strong>Cross-platform support:</strong> Works on any operating system</li>
          <li><strong>No vendor lock-in:</strong> Your data isn't tied to specific proprietary formats</li>
        </ul>

        <h4>Import/Export Workflow:</h4>
        <ol>
          <li><strong>Export:</strong> Download your data as CSV or JSON</li>
          <li><strong>Edit:</strong> Open CSV in any spreadsheet application</li>
          <li><strong>Import:</strong> Upload modified CSV back to SilentStacks</li>
          <li><strong>Auto-process:</strong> New PMIDs will automatically fetch metadata</li>
        </ol>

        <div class="help-tip">
          <strong>📊 Excel Users:</strong> Simply save your Excel files as CSV format before importing to SilentStacks!
        </div>
      `
    },
    {
      id: "docline_integration",
      title: "DOCLINE Integration",
      content: `
        <h3>Working with DOCLINE Requests</h3>
        
        <h4>DOCLINE Field Support:</h4>
        <p>SilentStacks now includes full support for DOCLINE integration:</p>
        <ul>
          <li><strong>DOCLINE field:</strong> Track existing DOCLINE request numbers</li>
          <li><strong>Import/Export:</strong> DOCLINE numbers included in all data operations</li>
          <li><strong>Bulk processing:</strong> Import lists of DOCLINE numbers with PMIDs</li>
        </ul>

        <h4>DOCLINE + PMID Workflow:</h4>
        <p>Ideal for existing DOCLINE users who want enhanced metadata:</p>
        <ol>
          <li>Export DOCLINE requests with PMIDs</li>
          <li>Create CSV with columns: DOCLINE, PMID</li>
          <li>Import to SilentStacks</li>
          <li>System automatically fetches complete publication metadata</li>
          <li>Export enriched data back to your workflow</li>
        </ol>

        <h4>Example DOCLINE Import:</h4>
        <pre>DOCLINE,PMID,Status
138ABC123,12345678,pending
139DEF456,23456789,in-progress
140GHI789,34567890,pending</pre>

        <h4>DOCLINE Number Format:</h4>
        <p>Supports various DOCLINE number formats:</p>
        <ul>
          <li>Standard format: 138ABC123</li>
          <li>Numeric only: 1234567</li>
          <li>Custom institutional formats</li>
        </ul>

        <div class="help-tip">
          <strong>🔗 Best Practice:</strong> Always include both DOCLINE and PMID when possible for complete tracking and metadata!
        </div>
      `
    },
    {
      id: "searching_filtering",
      title: "Search & Filter",
      content: `
        <h3>Finding Your Requests</h3>
        
        <h4>Search Functionality:</h4>
        <p>Use the search box to find requests by:</p>
        <ul>
          <li>Title keywords</li>
          <li>Author names</li>
          <li>Journal names</li>
          <li>PMID or DOI</li>
          <li>DOCLINE numbers</li>
          <li>Tags</li>
          <li>Patron email</li>
        </ul>

        <h4>Filter Options:</h4>
        <ul>
          <li><strong>Status Filter:</strong> Show only pending, fulfilled, etc.</li>
          <li><strong>Priority Filter:</strong> Focus on urgent or rush requests</li>
          <li><strong>Date Range:</strong> Find requests from specific time periods</li>
        </ul>

        <h4>Sorting:</h4>
        <p>Click column headers to sort by:</p>
        <ul>
          <li>Date created (newest/oldest first)</li>
          <li>Priority level (urgent → low)</li>
          <li>Title (alphabetical)</li>
          <li>Status</li>
          <li>DOCLINE number</li>
        </ul>

        <div class="help-tip">
          <strong>🔍 Search Tips:</strong> Search works across all fields including DOCLINE numbers. Use partial matches for flexibility.
        </div>
      `
    },
    {
      id: "api_integration",
      title: "API Integration & Offline Mode",
      content: `
        <h3>External API Integration</h3>
        
        <h4>Supported APIs:</h4>
        <ul>
          <li><strong>PubMed eUtils:</strong> Article metadata lookup by PMID</li>
          <li><strong>CrossRef:</strong> Article metadata lookup by DOI</li>
          <li><strong>Automatic enrichment:</strong> Fetches title, authors, journal, year, MeSH terms</li>
        </ul>

        <h4>API Features:</h4>
        <ul>
          <li><strong>Rate limiting:</strong> Respects API guidelines with automatic delays</li>
          <li><strong>Error handling:</strong> Graceful fallback when APIs are unavailable</li>
          <li><strong>Batch processing:</strong> Handles bulk imports with API lookups</li>
          <li><strong>MeSH terms:</strong> Includes medical subject headings from PubMed</li>
        </ul>

        <h4>Offline Capability:</h4>
        <p>SilentStacks works offline and queues API requests:</p>
        <ul>
          <li>All data is stored locally in your browser</li>
          <li>API requests are queued when offline</li>
          <li>Automatic processing when connection returns</li>
          <li>No data loss during offline periods</li>
        </ul>

        <h4>API Rate Limiting:</h4>
        <p>To respect API providers and ensure reliability:</p>
        <ul>
          <li>1-second delay between PubMed requests</li>
          <li>Automatic retry with exponential backoff</li>
          <li>Progress indicators for long operations</li>
          <li>Chunked processing for large imports</li>
        </ul>

        <div class="help-tip">
          <strong>🔑 API Performance:</strong> For best results with large imports, ensure stable internet connection and consider splitting very large batches.
        </div>
      `
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      content: `
        <h3>Common Issues & Solutions</h3>
        
        <h4>Import Issues:</h4>
        <ul>
          <li><strong>CSV not recognized:</strong> Ensure headers match supported field names</li>
          <li><strong>API lookups failing:</strong> Check internet connection and try smaller batches</li>
          <li><strong>DOCLINE numbers missing:</strong> Use "DOCLINE", "docline", or "DOCLINE_NUMBER" as header</li>
          <li><strong>Special characters:</strong> Ensure CSV uses UTF-8 encoding</li>
        </ul>

        <h4>Performance Issues:</h4>
        <ul>
          <li><strong>Large imports slow:</strong> Split into batches of 100-500 items</li>
          <li><strong>Browser freezing:</strong> Close other tabs and try smaller batches</li>
          <li><strong>Memory warnings:</strong> Export data and refresh browser, then reimport</li>
        </ul>

        <h4>API-Related Issues:</h4>
        <ul>
          <li><strong>PMID not found:</strong> Verify PMID exists in PubMed database</li>
          <li><strong>Rate limit errors:</strong> Wait a few minutes and try again</li>
          <li><strong>Incomplete metadata:</strong> Some PubMed records may have missing fields</li>
          <li><strong>DOI lookup failing:</strong> Check DOI format (e.g., 10.1000/example)</li>
        </ul>

        <h4>Data Export Issues:</h4>
        <ul>
          <li><strong>CSV opens incorrectly in Excel:</strong> Use "Data → From Text" import wizard</li>
          <li><strong>Special characters garbled:</strong> Ensure UTF-8 encoding when opening</li>
          <li><strong>DOCLINE numbers as dates:</strong> Format column as "Text" in spreadsheet</li>
        </ul>

        <h4>Browser Compatibility:</h4>
        <p>SilentStacks works best with:</p>
        <ul>
          <li>Chrome 80+ (recommended)</li>
          <li>Firefox 75+</li>
          <li>Safari 13+</li>
          <li>Edge 80+</li>
        </ul>

        <div class="help-warning">
          <strong>⚠️ Data Safety:</strong> Always export your data before major updates or troubleshooting steps!
        </div>
      `
    },
    {
      id: "best_practices",
      title: "Best Practices",
      content: `
        <h3>Recommended Workflows</h3>
        
        <h4>Efficient Data Entry:</h4>
        <ol>
          <li><strong>Start with identifiers:</strong> Always enter PMID or DOI first for auto-population</li>
          <li><strong>Use bulk import:</strong> For multiple requests, use CSV import rather than manual entry</li>
          <li><strong>Include DOCLINE:</strong> Add DOCLINE numbers for existing ILL tracking</li>
          <li><strong>Tag consistently:</strong> Use consistent tagging for better organization</li>
        </ol>

        <h4>DOCLINE Integration Workflow:</h4>
        <ol>
          <li>Export existing DOCLINE requests</li>
          <li>Add PMID column where available</li>
          <li>Import to SilentStacks for metadata enrichment</li>
          <li>Export enriched data for enhanced ILL management</li>
        </ol>

        <h4>Data Management:</h4>
        <ul>
          <li><strong>Regular exports:</strong> Export data weekly as backup</li>
          <li><strong>Clean imports:</strong> Review import data before processing</li>
          <li><strong>Batch updates:</strong> Use bulk update features for status changes</li>
          <li><strong>Tag strategy:</strong> Develop consistent tagging for departments/subjects</li>
        </ul>

        <h4>Performance Optimization:</h4>
        <ul>
          <li><strong>Batch size:</strong> Import 100-500 items at a time for best performance</li>
          <li><strong>API timing:</strong> Schedule large imports during off-peak hours</li>
          <li><strong>Browser maintenance:</strong> Clear cache periodically, keep updated</li>
          <li><strong>Data cleanup:</strong> Remove fulfilled requests periodically</li>
        </ul>

        <h4>Collaboration Tips:</h4>
        <ul>
          <li><strong>Shared CSV files:</strong> Use shared drives for team CSV imports/exports</li>
          <li><strong>Consistent formatting:</strong> Establish team standards for data entry</li>
          <li><strong>Status updates:</strong> Use bulk updates for team status changes</li>
          <li><strong>Documentation:</strong> Document custom tags and workflows</li>
        </ul>

        <div class="help-tip">
          <strong>💡 Pro Workflow:</strong> DOCLINE → CSV Export → SilentStacks Import → Metadata Enrichment → Enhanced ILL Management
        </div>
      `
    }
  ];

  // Generate HTML content for all sections
  function generateDocumentationHTML() {
    const sectionsHTML = documentationSections.map(section => `
      <div class="doc-section" id="${section.id}">
        <h2>${section.title}</h2>
        ${section.content}
      </div>
    `).join('');

    const navigationHTML = documentationSections.map(section => `
      <li><a href="#${section.id}" class="doc-nav-link">${section.title}</a></li>
    `).join('');

    return {
      navigation: `<ul class="doc-navigation">${navigationHTML}</ul>`,
      content: sectionsHTML
    };
  }

  // Enhanced documentation with search
  const IntegratedDocumentation = {
    sections: documentationSections,
    
    initialize() {
      console.log('📚 Initializing Updated Documentation v1.3.0...');
      this.setupDocumentationUI();
      this.setupSearch();
      console.log('✅ Documentation initialized with PMID auto-fetch and DOCLINE guidance');
    },

    setupDocumentationUI() {
      const docContainer = document.getElementById('documentation-content');
      if (docContainer) {
        const { navigation, content } = generateDocumentationHTML();
        
        docContainer.innerHTML = `
          <div class="documentation-layout">
            <aside class="doc-sidebar">
              <div class="doc-search-container">
                <input type="text" id="doc-search" placeholder="Search documentation..." class="doc-search-input">
              </div>
              ${navigation}
            </aside>
            <main class="doc-content">
              ${content}
            </main>
          </div>
        `;

        // Add navigation click handlers
        document.querySelectorAll('.doc-nav-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            this.showSection(targetId);
          });
        });

        // Show first section by default
        this.showSection(documentationSections[0].id);
      }
    },

    setupSearch() {
      const searchInput = document.getElementById('doc-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchDocumentation(e.target.value);
        });
      }
    },

    showSection(sectionId) {
      // Hide all sections
      document.querySelectorAll('.doc-section').forEach(section => {
        section.style.display = 'none';
      });

      // Show target section
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }

      // Update navigation
      document.querySelectorAll('.doc-nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      const activeLink = document.querySelector(`a[href="#${sectionId}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    },

    searchDocumentation(query) {
      if (!query.trim()) {
        // Show all sections if no search query
        document.querySelectorAll('.doc-section').forEach(section => {
          section.style.display = 'block';
        });
        return;
      }

      const searchTerm = query.toLowerCase();
      let foundSections = [];

      documentationSections.forEach(section => {
        const content = section.content.toLowerCase();
        const title = section.title.toLowerCase();
        
        if (content.includes(searchTerm) || title.includes(searchTerm)) {
          foundSections.push(section.id);
        }
      });

      // Show/hide sections based on search
      document.querySelectorAll('.doc-section').forEach(section => {
        if (foundSections.includes(section.id)) {
          section.style.display = 'block';
          this.highlightSearchTerms(section, searchTerm);
        } else {
          section.style.display = 'none';
        }
      });

      // Update navigation to show relevant sections
      document.querySelectorAll('.doc-nav-link').forEach(link => {
        const sectionId = link.getAttribute('href').substring(1);
        if (foundSections.includes(sectionId)) {
          link.style.display = 'block';
          link.classList.add('search-match');
        } else {
          link.style.display = 'none';
          link.classList.remove('search-match');
        }
      });
    },

    highlightSearchTerms(section, searchTerm) {
      // Simple highlighting (can be enhanced)
      const content = section.innerHTML;
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      section.innerHTML = content.replace(regex, '<mark>$1</mark>');
    },

    // Public methods for external use
    openSection(sectionId) {
      this.showSection(sectionId);
    },

    getSection(sectionId) {
      return documentationSections.find(section => section.id === sectionId);
    },

    getAllSections() {
      return documentationSections;
    }
  };

  // Register with SilentStacks
  if (!window.SilentStacks) {
    window.SilentStacks = { modules: {} };
  }
  if (!window.SilentStacks.modules) {
    window.SilentStacks.modules = {};
  }

  window.SilentStacks.modules.IntegratedDocumentation = IntegratedDocumentation;
  
  console.log('✅ Updated Integrated Documentation v1.3.0 registered successfully');

})();

// CSS Styles for Documentation
const documentationStyles = `
<style>
.documentation-layout {
  display: flex;
  height: 80vh;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.doc-sidebar {
  width: 300px;
  background: #f8f9fa;
  border-right: 1px solid #dee2e6;
  overflow-y: auto;
  padding: 1rem;
}

.doc-search-container {
  margin-bottom: 1rem;
}

.doc-search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

.doc-navigation {
  list-style: none;
  padding: 0;
  margin: 0;
}

.doc-navigation li {
  margin-bottom: 0.25rem;
}

.doc-nav-link {
  display: block;
  padding: 0.5rem 0.75rem;
  color: #495057;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.doc-nav-link:hover {
  background-color: #e9ecef;
  color: #007bff;
}

.doc-nav-link.active {
  background-color: #007bff;
  color: white;
}

.doc-nav-link.search-match {
  background-color: #fff3cd;
  border-left: 3px solid #ffc107;
}

.doc-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background: white;
}

.doc-section {
  display: none;
  max-width: 800px;
}

.doc-section h2 {
  color: #007bff;
  border-bottom: 2px solid #007bff;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.doc-section h3 {
  color: #495057;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.doc-section h4 {
  color: #6c757d;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.doc-section h5 {
  color: #6c757d;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.doc-section ul, .doc-section ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.doc-section li {
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

.doc-section pre {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
}

.doc-section code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
}

.help-tip {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  border-left: 4px solid #28a745;
}

.help-warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  border-left: 4px solid #ffc107;
}

.help-tip strong, .help-warning strong {
  display: block;
  margin-bottom: 0.5rem;
}

mark {
  background-color: #fff3cd;
  padding: 0.1rem 0.2rem;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .documentation-layout {
    flex-direction: column;
    height: auto;
  }
  
  .doc-sidebar {
    width: 100%;
    max-height: 200px;
  }
  
  .doc-content {
    padding: 1rem;
  }
}
</style>
`;

// Inject styles
if (!document.getElementById('documentation-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'documentation-styles';
  styleElement.innerHTML = documentationStyles;
  document.head.appendChild(styleElement);
}
