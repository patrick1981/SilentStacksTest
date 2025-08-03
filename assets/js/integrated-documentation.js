// integrated-documentation.js - In-App Documentation System

(() => {
  'use strict';

  // Documentation Content Structure
  const DOCUMENTATION = {
    user_manual: {
      title: "User's Manual",
      icon: "👤",
      sections: [
        {
          id: "getting_started",
          title: "Getting Started",
          content: `
            <h3>Welcome to SilentStacks!</h3>
            <p>SilentStacks is your comprehensive document request management system. This guide will help you get started quickly.</p>
            
            <h4>First Steps:</h4>
            <ol>
              <li><strong>Add Your First Request:</strong> Click the "Add Request" tab to create your first document request</li>
              <li><strong>Use Auto-Lookup:</strong> Enter a PMID or DOI and click lookup to automatically fill details</li>
              <li><strong>Organize with Tags:</strong> Add tags to categorize your requests for easy searching</li>
              <li><strong>Track Progress:</strong> Update request status as you work through them</li>
            </ol>
            
            <div class="help-tip">
              <strong>💡 Pro Tip:</strong> Use the bulk entry feature to add multiple requests at once by pasting PMIDs, DOIs, or citations.
            </div>
          `
        },
        {
          id: "navigation",
          title: "Navigation & Interface",
          content: `
            <h3>Understanding the Interface</h3>
            
            <h4>Main Navigation Tabs:</h4>
            <ul>
              <li><strong>📊 Dashboard:</strong> Overview of all your requests with statistics</li>
              <li><strong>➕ Add Request:</strong> Create new document requests</li>
              <li><strong>📋 All Requests:</strong> View, search, and manage all requests</li>
              <li><strong>📁 Import/Export:</strong> Bulk operations and data management</li>
              <li><strong>⚙️ Settings:</strong> Configure app preferences</li>
            </ul>
            
            <h4>Status Indicators:</h4>
            <div class="status-examples">
              <span class="status-pending">Pending</span> - New requests waiting to be processed<br>
              <span class="status-in-progress">In Progress</span> - Actively being worked on<br>
              <span class="status-fulfilled">Fulfilled</span> - Successfully completed<br>
              <span class="status-cancelled">Cancelled</span> - No longer needed
            </div>
            
            <div class="help-warning">
              <strong>🔗 Connection Status:</strong> The indicator in the top-right shows your internet connection. When offline, some features may be limited.
            </div>
          `
        },
        {
          id: "adding_requests",
          title: "Adding Requests",
          content: `
            <h3>Creating Document Requests</h3>
            
            <h4>Auto-Lookup Feature:</h4>
            <p>Save time by using our automatic lookup feature:</p>
            <ol>
              <li>Enter a <strong>PMID</strong> (PubMed ID) or <strong>DOI</strong> in the respective field</li>
              <li>Click the <strong>"Lookup"</strong> button</li>
              <li>Watch as article details are automatically filled in</li>
            </ol>
            
            <h4>Manual Entry:</h4>
            <p>If auto-lookup doesn't work or for non-standard materials:</p>
            <ul>
              <li><strong>Title:</strong> Full title of the document (required)</li>
              <li><strong>Authors:</strong> Author names, separated by semicolons</li>
              <li><strong>Journal:</strong> Publication name</li>
              <li><strong>Year:</strong> Publication year</li>
              <li><strong>Email:</strong> Patron's email address</li>
            </ul>
            
            <h4>Priority Levels:</h4>
            <ul>
              <li><strong>🔴 Urgent:</strong> Needs immediate attention</li>
              <li><strong>🟡 Rush:</strong> High priority, expedited processing</li>
              <li><strong>🟢 Normal:</strong> Standard processing timeline</li>
            </ul>
            
            <h4>Tags & Organization:</h4>
            <p>Add tags to categorize requests (e.g., "psychology", "urgent", "faculty"). Click on any tag to change its color for visual organization.</p>
          `
        },
        {
          id: "searching_filtering",
          title: "Searching & Filtering",
          content: `
            <h3>Finding Your Requests</h3>
            
            <h4>Search Functionality:</h4>
            <p>Use the search box to find requests by:</p>
            <ul>
              <li>Title keywords</li>
              <li>Author names</li>
              <li>Journal names</li>
              <li>PMID or DOI</li>
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
              <li>Priority level</li>
              <li>Title (alphabetical)</li>
              <li>Status</li>
            </ul>
            
            <div class="help-tip">
              <strong>🔍 Search Tips:</strong> Search is instant and works across all visible fields. Use quotes for exact phrases.
            </div>
          `
        },
        {
          id: "bulk_operations",
          title: "Bulk Operations",
          content: `
            <h3>Working with Multiple Requests</h3>
            
            <h4>Bulk Entry:</h4>
            <p>Add multiple requests at once using the bulk entry feature:</p>
            <ol>
              <li>Go to <strong>Add Request</strong> → <strong>Bulk Entry</strong></li>
              <li>Paste a list of PMIDs, DOIs, or citations (one per line)</li>
              <li>Click <strong>"Process Bulk Data"</strong></li>
              <li>Review and confirm the parsed requests</li>
            </ol>
            
            <h4>Bulk Status Updates:</h4>
            <ol>
              <li>In <strong>All Requests</strong>, select multiple requests using checkboxes</li>
              <li>Use the bulk actions bar to update status for all selected</li>
              <li>Choose new status from dropdown and apply</li>
            </ol>
            
            <h4>Bulk Export:</h4>
            <p>Export your data in multiple formats:</p>
            <ul>
              <li><strong>Excel (.xlsx):</strong> Formatted spreadsheet with all fields</li>
              <li><strong>CSV:</strong> Simple comma-separated values</li>
              <li><strong>JSON:</strong> Raw data format for backups</li>
            </ul>
            
            <div class="help-warning">
              <strong>⚠️ Performance Note:</strong> Large bulk operations (>500 items) may take time. The app will warn you and may enable performance mode automatically.
            </div>
          `
        }
      ]
    },
    
    developer_guide: {
      title: "Developer's Guide",
      icon: "👩‍💻",
      sections: [
        {
          id: "architecture",
          title: "Code Architecture",
          content: `
            <h3>SilentStacks Architecture</h3>
            
            <h4>Modular CSS Structure:</h4>
            <pre>assets/css/
├── style.css (main orchestrator)
├── base/ (reset, typography, tokens)
├── layout/ (grid, navigation, responsive)
├── components/ (buttons, forms, cards)
├── themes/ (light, dark, high-contrast)
└── utilities/ (accessibility, print)</pre>
            
            <h4>JavaScript Modules:</h4>
            <ul>
              <li><strong>enhanced-data-manager.js:</strong> Data storage, validation, performance</li>
              <li><strong>offline-manager.js:</strong> Offline detection, request queuing</li>
              <li><strong>integrated-documentation.js:</strong> This help system</li>
              <li><strong>silentstacks.js:</strong> Main application logic</li>
            </ul>
            
            <h4>Key Design Patterns:</h4>
            <ul>
              <li><strong>Module Pattern:</strong> Self-contained functionality in IIFEs</li>
              <li><strong>Observer Pattern:</strong> Event-driven communication between modules</li>
              <li><strong>Factory Pattern:</strong> Request object creation and validation</li>
              <li><strong>Strategy Pattern:</strong> Different export formats and themes</li>
            </ul>
            
            <h4>Data Flow:</h4>
            <ol>
              <li>User input → Validation → Enhanced Data Manager</li>
              <li>API requests → Offline Manager → Service Worker → Cache/Network</li>
              <li>Storage → LocalStorage → Automatic cleanup and optimization</li>
            </ol>
          `
        },
        {
          id: "customization",
          title: "Customization Guide",
          content: `
            <h3>Customizing SilentStacks</h3>
            
            <h4>Adding New Themes:</h4>
            <ol>
              <li>Create new CSS file in <code>assets/css/themes/</code></li>
              <li>Define CSS custom properties for your theme</li>
              <li>Add theme to settings dropdown in HTML</li>
              <li>Update theme switching logic in main app</li>
            </ol>
            
            <h4>Custom Validation Rules:</h4>
            <pre>// In enhanced-data-manager.js
function validateRequest(request) {
  const errors = [];
  
  // Add your custom validation
  if (request.customField && !customFieldValidator(request.customField)) {
    errors.push('Custom field validation failed');
  }
  
  return errors;
}</pre>
            
            <h4>New Export Formats:</h4>
            <ol>
              <li>Add new case to export switch statement</li>
              <li>Implement format-specific conversion function</li>
              <li>Add UI button and format option</li>
              <li>Test with various data sizes</li>
            </ol>
            
            <h4>API Integration:</h4>
            <pre>// Adding new lookup service
async function customAPILookup(identifier) {
  try {
    const response = await OfflineManager.fetch(\`https://api.example.com/lookup/\${identifier}\`);
    return await response.json();
  } catch (error) {
    console.error('Custom API lookup failed:', error);
    return null;
  }
}</pre>
            
            <div class="help-tip">
              <strong>🔧 Development Tip:</strong> Always test customizations with both online and offline modes, and various data sizes.
            </div>
          `
        },
        {
          id: "api_integration",
          title: "API Integration",
          content: `
            <h3>Working with External APIs</h3>
            
            <h4>Supported APIs:</h4>
            <ul>
              <li><strong>PubMed eUtils:</strong> Article metadata lookup by PMID</li>
              <li><strong>CrossRef:</strong> Article metadata lookup by DOI</li>
            </ul>
            
            <h4>Offline Handling:</h4>
            <p>All API requests automatically handle offline scenarios:</p>
            <ul>
              <li>Requests are queued when offline</li>
              <li>Placeholder data is shown when available</li>
              <li>Automatic retry when connection returns</li>
              <li>User notification of queue status</li>
            </ul>
            
            <h4>Rate Limiting:</h4>
            <ul>
              <li>Built-in delays between requests</li>
              <li>Automatic retry with exponential backoff</li>
              <li>User notification of rate limit issues</li>
            </ul>
            
            <h4>Error Handling:</h4>
            <pre>// Example API call with full error handling
async function lookupPMID(pmid) {
  try {
    const response = await OfflineManager.fetch(\`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=\${pmid}&retmode=json\`);
    
    if (!response.ok) {
      throw new Error(\`API returned \${response.status}\`);
    }
    
    const data = await response.json();
    return parseePubMedData(data);
    
  } catch (error) {
    if (error.message === 'OFFLINE_MODE') {
      // Handle offline gracefully
      return getPlaceholderData('pubmed', pmid);
    }
    throw error;
  }
}</pre>
            
            <div class="help-warning">
              <strong>🔑 API Keys:</strong> Some APIs may require authentication. Store keys securely in settings and never commit them to version control.
            </div>
          `
        }
      ]
    },
    
    upkeep_guide: {
      title: "Upkeep Guide", 
      icon: "🔧",
      sections: [
        {
          id: "maintenance",
          title: "Regular Maintenance",
          content: `
            <h3>Keeping SilentStacks Running Smoothly</h3>
            
            <h4>Daily Tasks:</h4>
            <ul>
              <li>Monitor connection status indicator</li>
              <li>Check for any error notifications</li>
              <li>Verify automatic lookups are working</li>
            </ul>
            
            <h4>Weekly Tasks:</h4>
            <ul>
              <li>Review fulfilled requests for archiving</li>
              <li>Check storage usage in Settings</li>
              <li>Clear any failed/stuck requests</li>
              <li>Backup data using Export feature</li>
            </ul>
            
            <h4>Monthly Tasks:</h4>
            <ul>
              <li>Update fulfilled requests to final status</li>
              <li>Archive old completed requests</li>
              <li>Review and clean up tag system</li>
              <li>Check browser storage limits</li>
            </ul>
            
            <h4>Performance Monitoring:</h4>
            <p>Watch for these warning signs:</p>
            <ul>
              <li>Slow loading times</li>
              <li>Memory warnings in browser console</li>
              <li>Large storage usage (>50MB)</li>
              <li>Frequent offline mode triggers</li>
            </ul>
          `
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting",
          content: `
            <h3>Common Issues & Solutions</h3>
            
            <h4>App Won't Load:</h4>
            <ol>
              <li>Check browser console for errors (F12)</li>
              <li>Verify all CSS/JS files are loading</li>
              <li>Clear browser cache and reload</li>
              <li>Check file permissions on server</li>
            </ol>
            
            <h4>Auto-Lookup Not Working:</h4>
            <ol>
              <li>Check internet connection</li>
              <li>Verify PMID/DOI format is correct</li>
              <li>Check browser console for API errors</li>
              <li>Try manual entry as fallback</li>
            </ol>
            
            <h4>Slow Performance:</h4>
            <ol>
              <li>Check memory usage in Settings → Performance</li>
              <li>Enable Performance Mode if available</li>
              <li>Clear old fulfilled requests</li>
              <li>Refresh page to reset memory</li>
            </ol>
            
            <h4>Data Not Saving:</h4>
            <ol>
              <li>Check browser storage quota</li>
              <li>Verify no private/incognito mode</li>
              <li>Clear old data to make space</li>
              <li>Export data as backup first</li>
            </ol>
            
            <h4>Offline Mode Issues:</h4>
            <ol>
              <li>Verify service worker is registered</li>
              <li>Check for cached resources</li>
              <li>Force page refresh to update cache</li>
              <li>Check browser's offline mode settings</li>
            </ol>
            
            <div class="help-emergency">
              <strong>🚨 Emergency Recovery:</strong> If the app becomes unusable, go to Settings → Advanced → Clear All Data. Your browser's local storage will be reset, but you'll lose all current data.
            </div>
          `
        },
        {
          id: "updates",
          title: "Updates & Upgrades",
          content: `
            <h3>Keeping the App Updated</h3>
            
            <h4>Version Checking:</h4>
            <p>The app version is displayed in the header. Check periodically for updates:</p>
            <ul>
              <li>Compare with latest version documentation</li>
              <li>Check for browser compatibility updates</li>
              <li>Review changelog for new features</li>
            </ul>
            
            <h4>Update Process:</h4>
            <ol>
              <li><strong>Backup First:</strong> Export all data before updating</li>
              <li><strong>Download:</strong> Get latest version files</li>
              <li><strong>Replace:</strong> Overwrite existing files</li>
              <li><strong>Clear Cache:</strong> Force browser cache refresh</li>
              <li><strong>Test:</strong> Verify all features work correctly</li>
            </ol>
            
            <h4>Data Migration:</h4>
            <p>When updating between major versions:</p>
            <ul>
              <li>Export data in JSON format before updating</li>
              <li>New version will attempt automatic migration</li>
              <li>Verify data integrity after update</li>
              <li>Import backup if migration fails</li>
            </ul>
            
            <h4>Browser Compatibility:</h4>
            <table class="compatibility-table">
              <tr><th>Browser</th><th>Minimum Version</th><th>Recommended</th></tr>
              <tr><td>Chrome</td><td>80+</td><td>Latest</td></tr>
              <tr><td>Firefox</td><td>75+</td><td>Latest</td></tr>
              <tr><td>Safari</td><td>13+</td><td>Latest</td></tr>
              <tr><td>Edge</td><td>80+</td><td>Latest</td></tr>
            </table>
            
            <div class="help-tip">
              <strong>🔄 Auto-Updates:</strong> When service worker detects a new version, you'll see an update notification. Refresh the page to apply updates.
            </div>
          `
        },
        {
          id: "backup_recovery",
          title: "Backup & Recovery",
          content: `
            <h3>Data Protection</h3>
            
            <h4>Automatic Backups:</h4>
            <p>The app provides several automatic backup mechanisms:</p>
            <ul>
              <li><strong>LocalStorage:</strong> Data persists across browser sessions</li>
              <li><strong>Auto-save:</strong> All changes saved immediately</li>
              <li><strong>Version Control:</strong> Change history for critical data</li>
            </ul>
            
            <h4>Manual Backup Process:</h4>
            <ol>
              <li>Go to <strong>Import/Export</strong> tab</li>
              <li>Click <strong>"Export All Data"</strong></li>
              <li>Choose <strong>JSON format</strong> for complete backup</li>
              <li>Save file with date in filename: <code>silentstacks-backup-2024-01-15.json</code></li>
              <li>Store in multiple locations (cloud, local, USB)</li>
            </ol>
            
            <h4>Recovery Process:</h4>
            <ol>
              <li>Go to <strong>Import/Export</strong> tab</li>
              <li>Click <strong>"Import Data"</strong></li>
              <li>Select your backup JSON file</li>
              <li>Choose merge or replace option</li>
              <li>Verify data integrity after import</li>
            </ol>
            
            <h4>Backup Schedule Recommendations:</h4>
            <ul>
              <li><strong>Daily:</strong> If processing >20 requests per day</li>
              <li><strong>Weekly:</strong> For moderate usage</li>
              <li><strong>Before Updates:</strong> Always backup before version changes</li>
              <li><strong>Before Bulk Operations:</strong> Backup before large imports</li>
            </ul>
            
            <div class="help-warning">
              <strong>💾 Data Loss Prevention:</strong> Browser data can be lost due to cache clearing, private mode usage, or storage quota exceeded. Regular backups are essential.
            </div>
          `
        }
      ]
    }
  };

  // Documentation System State
  let isDocOpen = false;
  let currentGuide = 'user_manual';
  let currentSection = null;

  // Initialize Documentation System
  function initializeDocumentation() {
    createDocumentationInterface();
    setupDocumentationEvents();
    
    // Add help button to navigation
    addHelpButton();
    
    console.log('📚 Documentation system initialized');
  }

  function createDocumentationInterface() {
    const docContainer = document.createElement('div');
    docContainer.id = 'documentation-container';
    docContainer.className = 'documentation-container hidden';
    
    docContainer.innerHTML = `
      <div class="documentation-overlay" onclick="closeDocumentation()"></div>
      <div class="documentation-panel">
        <div class="documentation-header">
          <div class="documentation-nav">
            ${Object.entries(DOCUMENTATION).map(([key, guide]) => 
              `<button class="doc-nav-btn ${key === currentGuide ? 'active' : ''}" data-guide="${key}">
                <span class="doc-nav-icon">${guide.icon}</span>
                ${guide.title}
              </button>`
            ).join('')}
          </div>
          <button class="documentation-close" onclick="closeDocumentation()" title="Close Help">✕</button>
        </div>
        
        <div class="documentation-content">
          <div class="documentation-sidebar">
            <div id="doc-section-nav"></div>
          </div>
          
          <div class="documentation-main">
            <div id="doc-content-area"></div>
          </div>
        </div>
        
        <div class="documentation-footer">
          <div class="documentation-actions">
            <button onclick="printDocumentation()" class="btn btn-secondary btn-small">
              <span class="btn-icon">🖨️</span> Print Guide
            </button>
            <button onclick="exportDocumentation()" class="btn btn-secondary btn-small">
              <span class="btn-icon">💾</span> Export PDF
            </button>
          </div>
          <div class="documentation-info">
            SilentStacks v1.2.0 - Comprehensive Document Management
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(docContainer);
  }

  function setupDocumentationEvents() {
    // Guide navigation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('doc-nav-btn')) {
        switchGuide(e.target.dataset.guide);
      }
      
      if (e.target.classList.contains('doc-section-btn')) {
        showSection(e.target.dataset.section);
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (isDocOpen) {
        if (e.key === 'Escape') {
          closeDocumentation();
        }
      } else {
        // F1 or Ctrl+? to open help
        if (e.key === 'F1' || (e.ctrlKey && e.key === '?')) {
          e.preventDefault();
          openDocumentation();
        }
      }
    });
  }

  function addHelpButton() {
    const navTabs = document.querySelector('.nav-tabs');
    if (!navTabs) return;
    
    const helpButton = document.createElement('button');
    helpButton.className = 'nav-tab help-tab';
    helpButton.onclick = () => openDocumentation();
    helpButton.innerHTML = `
      <span class="nav-icon">❓</span>
      Help
    `;
    helpButton.title = 'Open Help Documentation (F1)';
    
    navTabs.appendChild(helpButton);
  }

  // Documentation Navigation
  function openDocumentation(guide = 'user_manual', section = null) {
    const container = document.getElementById('documentation-container');
    if (!container) return;
    
    isDocOpen = true;
    container.classList.remove('hidden');
    document.body.classList.add('documentation-open');
    
    // Switch to requested guide
    if (guide) {
      switchGuide(guide);
    }
    
    // Show specific section if requested
    if (section) {
      setTimeout(() => showSection(section), 100);
    }
    
    // Focus management for accessibility
    const firstButton = container.querySelector('.doc-nav-btn');
    if (firstButton) firstButton.focus();
  }

  function closeDocumentation() {
    const container = document.getElementById('documentation-container');
    if (!container) return;
    
    isDocOpen = false;
    container.classList.add('hidden');
    document.body.classList.remove('documentation-open');
    
    // Return focus to help button
    const helpButton = document.querySelector('.help-tab');
    if (helpButton) helpButton.focus();
  }

  function switchGuide(guideKey) {
    currentGuide = guideKey;
    currentSection = null;
    
    // Update nav buttons
    document.querySelectorAll('.doc-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.guide === guideKey);
    });
    
    // Build section navigation
    buildSectionNavigation();
    
    // Show first section by default
    const firstSection = DOCUMENTATION[guideKey].sections[0];
    if (firstSection) {
      showSection(firstSection.id);
    }
  }

  function buildSectionNavigation() {
    const sectionNav = document.getElementById('doc-section-nav');
    if (!sectionNav) return;
    
    const guide = DOCUMENTATION[currentGuide];
    if (!guide) return;
    
    sectionNav.innerHTML = `
      <h3>${guide.icon} ${guide.title}</h3>
      <div class="doc-section-list">
        ${guide.sections.map(section => `
          <button class="doc-section-btn ${section.id === currentSection ? 'active' : ''}" 
                  data-section="${section.id}">
            ${section.title}
          </button>
        `).join('')}
      </div>
    `;
  }

  function showSection(sectionId) {
    currentSection = sectionId;
    
    // Update section navigation
    document.querySelectorAll('.doc-section-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
    
    // Find and display section content
    const guide = DOCUMENTATION[currentGuide];
    const section = guide.sections.find(s => s.id === sectionId);
    
    if (!section) return;
    
    const contentArea = document.getElementById('doc-content-area');
    if (!contentArea) return;
    
    contentArea.innerHTML = `
      <div class="doc-section-content">
        <div class="doc-breadcrumb">
          <span>${guide.title}</span> → <span>${section.title}</span>
        </div>
        <h2>${section.title}</h2>
        <div class="doc-content">${section.content}</div>
      </div>
    `;
    
    // Scroll to top of content
    contentArea.scrollTop = 0;
  }

  // Print and Export Functions
  function printDocumentation() {
    const guide = DOCUMENTATION[currentGuide];
    if (!guide) return;
    
    // Create printable version
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${guide.title} - SilentStacks Documentation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; margin: 40px; }
          h1 { color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; }
          h3 { color: #666; }
          h4 { color: #333; margin-top: 20px; }
          .help-tip, .help-warning, .help-emergency { 
            padding: 15px; margin: 15px 0; border-radius: 6px; 
          }
          .help-tip { background: #e8f4fd; border-left: 4px solid #0066cc; }
          .help-warning { background: #fff3cd; border-left: 4px solid #ffc107; }
          .help-emergency { background: #f8d7da; border-left: 4px solid #dc3545; }
          pre { background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; }
          code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f8f9fa; }
          ol, ul { padding-left: 20px; }
          .status-examples span { 
            padding: 4px 8px; border-radius: 12px; font-size: 0.8em; 
            margin-right: 10px; display: inline-block; margin-bottom: 5px;
          }
          @page { margin: 1in; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${guide.icon} ${guide.title}</h1>
        <p><strong>SilentStacks Documentation</strong> • Generated: ${new Date().toLocaleDateString()}</p>
        
        ${guide.sections.map(section => `
          <h2>${section.title}</h2>
          <div>${section.content}</div>
        `).join('')}
        
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666;">
          SilentStacks v1.2.0 - Document Request Management System
        </footer>
      </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function exportDocumentation() {
    const guide = DOCUMENTATION[currentGuide];
    if (!guide) return;
    
    // Create markdown version for export
    let markdown = `# ${guide.icon} ${guide.title}\n\n`;
    markdown += `**SilentStacks Documentation** • Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    guide.sections.forEach(section => {
      markdown += `## ${section.title}\n\n`;
      
      // Convert HTML to markdown (basic conversion)
      let content = section.content
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
        .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n')
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<code>(.*?)<\/code>/g, '`$1`')
        .replace(/<pre>(.*?)<\/pre>/gs, '```\n$1\n```\n')
        .replace(/<li>(.*?)<\/li>/g, '- $1\n')
        .replace(/<ol[^>]*>|<\/ol>/g, '')
        .replace(/<ul[^>]*>|<\/ul>/g, '')
        .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags
      
      markdown += content + '\n\n';
    });
    
    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `silentstacks-${currentGuide}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    // Show success notification
    showDocNotification('Documentation exported successfully!', 'success');
  }

  // Context-Sensitive Help
  function showContextHelp(topic) {
    const helpMappings = {
      'add-request': { guide: 'user_manual', section: 'adding_requests' },
      'search': { guide: 'user_manual', section: 'searching_filtering' },
      'bulk-entry': { guide: 'user_manual', section: 'bulk_operations' },
      'settings': { guide: 'upkeep_guide', section: 'maintenance' },
      'performance': { guide: 'upkeep_guide', section: 'troubleshooting' },
      'developer': { guide: 'developer_guide', section: 'architecture' }
    };
    
    const mapping = helpMappings[topic];
    if (mapping) {
      openDocumentation(mapping.guide, mapping.section);
    } else {
      openDocumentation();
    }
  }

  // Helper Functions
  function showDocNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `doc-notification doc-notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10002;
      padding: 12px 16px;
      background: ${type === 'success' ? '#28a745' : '#17a2b8'};
      color: white;
      border-radius: 6px;
      font-size: 0.9rem;
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
    }, 3000);
  }

  // Add styles for documentation system
  function addDocumentationStyles() {
    const style = document.createElement('style');
    style.id = 'documentation-styles';
    style.textContent = `
      /* Documentation Container */
      .documentation-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transition: opacity 0.3s ease;
      }
      
      .documentation-container.hidden {
        opacity: 0;
        pointer-events: none;
      }
      
      .documentation-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
      }
      
      .documentation-panel {
        position: relative;
        width: 90vw;
        max-width: 1200px;
        height: 85vh;
        background: var(--bg-primary);
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid var(--border-color);
      }
      
      /* Documentation Header */
      .documentation-header {
        background: var(--bg-secondary);
        border-bottom: 2px solid var(--border-color);
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .documentation-nav {
        display: flex;
        gap: 10px;
      }
      
      .doc-nav-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border: 2px solid var(--border-color);
        background: var(--bg-primary);
        color: var(--text-primary);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
        white-space: nowrap;
      }
      
      .doc-nav-btn:hover {
        border-color: var(--primary-color);
        background: var(--bg-secondary);
      }
      
      .doc-nav-btn.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
      
      .doc-nav-icon {
        font-size: 1.2em;
      }
      
      .documentation-close {
        width: 40px;
        height: 40px;
        border: none;
        background: var(--danger-color);
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1.2em;
        transition: all 0.2s ease;
      }
      
      .documentation-close:hover {
        background: #c82333;
        transform: scale(1.05);
      }
      
      /* Documentation Content */
      .documentation-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }
      
      .documentation-sidebar {
        width: 250px;
        background: var(--bg-secondary);
        border-right: 1px solid var(--border-color);
        padding: 20px;
        overflow-y: auto;
      }
      
      .documentation-sidebar h3 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 1.1em;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .doc-section-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .doc-section-btn {
        text-align: left;
        padding: 10px 15px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9em;
      }
      
      .doc-section-btn:hover {
        background: var(--bg-primary);
        color: var(--text-primary);
      }
      
      .doc-section-btn.active {
        background: var(--primary-color);
        color: white;
      }
      
      .documentation-main {
        flex: 1;
        padding: 30px;
        overflow-y: auto;
        background: var(--bg-primary);
      }
      
      /* Documentation Content Styling */
      .doc-breadcrumb {
        font-size: 0.9em;
        color: var(--text-muted);
        margin-bottom: 20px;
      }
      
      .doc-content h3 {
        color: var(--primary-color);
        margin: 25px 0 15px 0;
        font-size: 1.3em;
      }
      
      .doc-content h4 {
        color: var(--text-primary);
        margin: 20px 0 10px 0;
        font-size: 1.1em;
      }
      
      .doc-content p {
        margin-bottom: 15px;
        line-height: 1.6;
        color: var(--text-primary);
      }
      
      .doc-content ul, .doc-content ol {
        margin-bottom: 15px;
        padding-left: 25px;
      }
      
      .doc-content li {
        margin-bottom: 5px;
        line-height: 1.5;
        color: var(--text-primary);
      }
      
      .doc-content pre {
        background: var(--bg-secondary);
        padding: 15px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 15px 0;
        border: 1px solid var(--border-color);
        font-size: 0.9em;
      }
      
      .doc-content code {
        background: var(--bg-secondary);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.9em;
        color: var(--text-primary);
      }
      
      /* Special Content Boxes */
      .help-tip {
        background: rgba(0, 102, 204, 0.1);
        border: 1px solid var(--primary-color);
        border-left: 4px solid var(--primary-color);
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
      }
      
      .help-warning {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid var(--warning-color);
        border-left: 4px solid var(--warning-color);
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
      }
      
      .help-emergency {
        background: rgba(220, 53, 69, 0.1);
        border: 1px solid var(--danger-color);
        border-left: 4px solid var(--danger-color);
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
      }
      
      .compatibility-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      
      .compatibility-table th,
      .compatibility-table td {
        border: 1px solid var(--border-color);
        padding: 10px;
        text-align: left;
      }
      
      .compatibility-table th {
        background: var(--bg-secondary);
        font-weight: 600;
      }
      
      /* Status Examples */
      .status-examples {
        margin: 15px 0;
      }
      
      .status-examples .status-pending {
        background: #fff8e1;
        border: 1px solid #ffc107;
        color: #f57f17;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        margin-right: 10px;
        display: inline-block;
        margin-bottom: 5px;
      }
      
      .status-examples .status-in-progress {
        background: #e3f2fd;
        border: 1px solid #2196f3;
        color: #0d47a1;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        margin-right: 10px;
        display: inline-block;
        margin-bottom: 5px;
      }
      
      .status-examples .status-fulfilled {
        background: #e8f5e8;
        border: 1px solid #4caf50;
        color: #2e7d32;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        margin-right: 10px;
        display: inline-block;
        margin-bottom: 5px;
      }
      
      .status-examples .status-cancelled {
        background: #fafafa;
        border: 1px solid #9e9e9e;
        color: #424242;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        margin-right: 10px;
        display: inline-block;
        margin-bottom: 5px;
      }
      
      /* Documentation Footer */
      .documentation-footer {
        background: var(--bg-secondary);
        border-top: 1px solid var(--border-color);
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .documentation-actions {
        display: flex;
        gap: 10px;
      }
      
      .documentation-info {
        color: var(--text-muted);
        font-size: 0.9em;
      }
      
      /* Help Tab in Navigation */
      .help-tab {
        margin-left: auto;
        background: var(--info-color) !important;
        color: white !important;
        border-color: var(--info-color) !important;
      }
      
      .help-tab:hover {
        background: #138496 !important;
        border-color: #138496 !important;
      }
      
      /* Body state when documentation is open */
      .documentation-open {
        overflow: hidden;
      }
      
      /* Mobile Responsive */
      @media (max-width: 768px) {
        .documentation-panel {
          width: 95vw;
          height: 95vh;
          margin: 2.5vh 2.5vw;
        }
        
        .documentation-content {
          flex-direction: column;
        }
        
        .documentation-sidebar {
          width: 100%;
          max-height: 200px;
          border-right: none;
          border-bottom: 1px solid var(--border-color);
        }
        
        .documentation-main {
          padding: 20px;
        }
        
        .documentation-nav {
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .doc-nav-btn {
          padding: 8px 12px;
          font-size: 0.9em;
        }
        
        .documentation-footer {
          flex-direction: column;
          gap: 10px;
          text-align: center;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Public API
  const DocumentationSystem = {
    initialize: initializeDocumentation,
    open: openDocumentation,
    close: closeDocumentation,
    showContextHelp,
    isOpen: () => isDocOpen
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addDocumentationStyles();
      initializeDocumentation();
    });
  } else {
    addDocumentationStyles();
    initializeDocumentation();
  }

  // Export for global access
  window.DocumentationSystem = DocumentationSystem;
// Missing Documentation Functions - Add to your integrated-documentation.js or in script tags

// Make functions globally available
window.closeDocumentation = function() {
  const container = document.getElementById('documentation-container');
  if (!container) return;
  
  container.classList.add('hidden');
  document.body.classList.remove('documentation-open');
  
  // Return focus to help button
  const helpButton = document.querySelector('.help-tab');
  if (helpButton) helpButton.focus();
  
  console.log('📚 Documentation closed');
};

window.printDocumentation = function() {
  const currentGuide = getCurrentGuide();
  const guide = getGuideData(currentGuide);
  
  if (!guide) {
    alert('No guide data available to print');
    return;
  }
  
  // Create printable version
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${guide.title} - SilentStacks Documentation</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          line-height: 1.6; 
          margin: 40px; 
          color: #333;
        }
        h1 { 
          color: #0066cc; 
          border-bottom: 2px solid #0066cc; 
          padding-bottom: 10px; 
          font-size: 28px;
        }
        h2 { 
          color: #333; 
          margin-top: 30px; 
          font-size: 20px;
          page-break-after: avoid;
        }
        h3 { 
          color: #666; 
          margin-top: 25px;
          font-size: 16px;
        }
        h4 { 
          color: #333; 
          margin-top: 20px; 
          font-size: 14px;
        }
        .help-tip, .help-warning, .help-emergency { 
          padding: 15px; 
          margin: 15px 0; 
          border-radius: 6px; 
          page-break-inside: avoid;
        }
        .help-tip { 
          background: #e8f4fd; 
          border-left: 4px solid #0066cc; 
        }
        .help-warning { 
          background: #fff3cd; 
          border-left: 4px solid #ffc107; 
        }
        .help-emergency { 
          background: #f8d7da; 
          border-left: 4px solid #dc3545; 
        }
        pre { 
          background: #f8f9fa; 
          padding: 15px; 
          border-radius: 6px; 
          overflow-x: auto; 
          font-size: 12px;
          page-break-inside: avoid;
        }
        code { 
          background: #f8f9fa; 
          padding: 2px 6px; 
          border-radius: 3px; 
          font-size: 12px;
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 15px 0; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background: #f8f9fa; 
          font-weight: 600;
        }
        ol, ul { 
          padding-left: 20px; 
        }
        li {
          margin-bottom: 5px;
        }
        .status-examples span { 
          padding: 4px 8px; 
          border-radius: 12px; 
          font-size: 11px; 
          margin-right: 10px; 
          display: inline-block; 
          margin-bottom: 5px;
          border: 1px solid #ccc;
        }
        @page { 
          margin: 1in; 
          @bottom-right {
            content: "Page " counter(page);
          }
        }
        @media print { 
          body { margin: 0; }
          h1, h2, h3 { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>${guide.icon} ${guide.title}</h1>
      <p><strong>SilentStacks Documentation v1.2.1</strong> • Generated: ${new Date().toLocaleDateString()}</p>
      
      ${guide.sections.map(section => `
        <h2>${section.title}</h2>
        <div>${section.content}</div>
      `).join('')}
      
      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        SilentStacks v1.2.1 - Document Request Management System<br>
        Generated: ${new Date().toLocaleString()}
      </footer>
    </body>
    </html>
  `;
  
  // Open print window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Small delay then print
  setTimeout(() => {
    printWindow.print();
  }, 500);
  
  console.log('🖨️ Documentation sent to printer');
};

window.exportDocumentation = function() {
  const currentGuide = getCurrentGuide();
  const guide = getGuideData(currentGuide);
  
  if (!guide) {
    alert('No guide data available to export');
    return;
  }
  
  // Create markdown version for export
  let markdown = `# ${guide.icon} ${guide.title}\n\n`;
  markdown += `**SilentStacks Documentation v1.2.1** • Generated: ${new Date().toLocaleDateString()}\n\n`;
  
  guide.sections.forEach(section => {
    markdown += `## ${section.title}\n\n`;
    
    // Convert HTML to markdown (basic conversion)
    let content = section.content
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<pre>(.*?)<\/pre>/gs, '```\n$1\n```\n')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<ol[^>]*>|<\/ol>/g, '')
      .replace(/<ul[^>]*>|<\/ul>/g, '')
      .replace(/<[^>]+>/g, ''); // Remove remaining HTML tags
    
    markdown += content + '\n\n';
  });
  
  // Create and download file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `silentstacks-${currentGuide}-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
  
  console.log('💾 Documentation exported successfully');
  alert('Documentation exported successfully!');
};

// Helper functions to get current guide data
function getCurrentGuide() {
  // Try to find active guide button
  const activeBtn = document.querySelector('.doc-nav-btn.active');
  if (activeBtn) {
    return activeBtn.dataset.guide;
  }
  return 'user_manual'; // default
}

function getGuideData(guideKey) {
  // This should match the DOCUMENTATION object from integrated-documentation.js
  const DOCUMENTATION = {
    user_manual: {
      title: "User's Manual",
      icon: "👤",
      sections: [
        {
          title: "Getting Started",
          content: `
            <h3>Welcome to SilentStacks v1.2.1!</h3>
            <p>SilentStacks is your comprehensive document request management system with critical performance enhancements.</p>
            
            <h4>First Steps:</h4>
            <ol>
              <li><strong>Add Your First Request:</strong> Click the "Add Request" tab</li>
              <li><strong>Use Auto-Lookup:</strong> Enter PMID or DOI for automatic metadata</li>
              <li><strong>Organize with Tags:</strong> Add colored tags for categorization</li>
              <li><strong>Track Progress:</strong> Update status as you work</li>
            </ol>
            
            <div class="help-tip">
              <strong>💡 Pro Tip:</strong> Use bulk entry for multiple requests. Performance mode automatically activates for large imports.
            </div>
          `
        }
        // Add more sections as needed
      ]
    },
    developer_guide: {
      title: "Developer's Guide", 
      icon: "👩‍💻",
      sections: [
        {
          title: "Architecture Overview",
          content: `
            <h3>SilentStacks v1.2.1 Architecture</h3>
            <p>Enhanced with critical performance fixes and memory management.</p>
          `
        }
      ]
    },
    upkeep_guide: {
      title: "Upkeep Guide",
      icon: "🔧", 
      sections: [
        {
          title: "Performance Monitoring",
          content: `
            <h3>Critical Performance Management</h3>
            <p>v1.2.1 includes essential performance safeguards for large datasets.</p>
          `
        }
      ]
    }
  };
  
  return DOCUMENTATION[guideKey];
}
})();
