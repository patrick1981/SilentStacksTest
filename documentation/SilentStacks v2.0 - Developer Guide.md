# SilentStacks v2.0 - Developer Guide

## Development Setup

### Prerequisites
- Modern text editor (VS Code, Sublime, etc.)
- Web browser with developer tools
- Basic understanding of vanilla JavaScript, HTML5, CSS3
- Local web server for testing (optional but recommended)

### File Structure
```
silentstacks-v2.0/
├── index.html              # Main application shell
├── dependencies.min.js     # External libraries (PapaParse + Fuse.js)
├── app.min.js             # Core application logic
├── fonts/                 # Self-hosted fonts (optional)
│   ├── main-regular.woff
│   └── main-bold.woff
└── docs/                  # Documentation
    ├── user-guide.md
    ├── tech-guide.md
    └── dev-guide.md
```

### Development Workflow
1. **Edit source**: Modify the unminified source files
2. **Test locally**: Open in browser or use local server
3. **Validate**: Check console for errors, test core functionality
4. **Minify**: Compress for production deployment
5. **Deploy**: Copy to target environment

## Core Architecture

### Application State Management
```javascript
// Central application state
const APP_STATE = {
    requests: [],           // All ILL requests
    settings: {},          // User preferences
    currentView: 'table',  // UI state
    currentSort: {...},    // Sort configuration
    selectedRequests: new Set(), // Bulk operations
    fuse: null,           // Search engine instance
    rateLimit: new RateLimit() // API throttling
};
```

### Security Layer
```javascript
// All input must go through SecurityUtils
const SecurityUtils = {
    sanitizeHtml: (str) => {...},     // Prevent XSS
    isValidPMID: (pmid) => {...},     // Format validation
    isValidEmail: (email) => {...},   // Email validation
    cleanForStorage: (data) => {...}  // Storage sanitization
};
```

### Storage Layer
```javascript
// Safe localStorage wrapper
const SafeStorage = {
    setItem: (key, data) => {...},    // Auto-sanitization
    getItem: (key, fallback) => {...}, // Error recovery
    cleanup: () => {...}              // Maintenance
};
```

## Key Components

### 1. Enrichment Pipeline
```javascript
class PMIDEnrichmentPipeline {
    async enrichPMID(pmid) {
        // Validate input
        if (!SecurityUtils.isValidPMID(pmid)) {
            throw new Error('Invalid PMID format');
        }
        
        // Rate limiting
        if (!this.rateLimit.canMakeRequest()) {
            throw new Error('Rate limit exceeded');
        }
        
        // API call logic
        // Return normalized data
    }
}
```

**Extending Enrichment:**
```javascript
// Add new data source
async enrichCustomAPI(identifier) {
    if (!this.validateCustomID(identifier)) {
        throw new Error('Invalid format');
    }
    
    const response = await fetch(`https://api.example.com/${identifier}`);
    const data = await response.json();
    
    return {
        status: 'complete',
        unified: this.normalizeCustomData(data)
    };
}
```

### 2. Data Management
```javascript
// Save request with validation
function saveRequest(requestData) {
    // Clean and validate
    const cleanedData = cleanAndValidateData(requestData);
    
    // Business logic validation
    if (cleanedData.docline && !validateDoclineUnique(cleanedData.docline)) {
        throw new Error('DOCLINE already exists');
    }
    
    // Create request object
    const request = {
        id: generateRequestId(),
        ...cleanedData,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    // Persist
    APP_STATE.requests.unshift(request);
    SafeStorage.setItem('silentStacks_requests', APP_STATE.requests);
    
    // Update UI
    updateDashboardStats();
    renderRequests();
}
```

### 3. Search Implementation
```javascript
// Initialize fuzzy search
function initializeFuseSearch() {
    const fuseOptions = {
        keys: [
            { name: 'title', weight: 0.3 },
            { name: 'authors', weight: 0.2 },
            { name: 'journal', weight: 0.1 },
            { name: 'patronEmail', weight: 0.2 }
        ],
        threshold: 0.4,
        includeScore: true
    };
    
    APP_STATE.fuse = new Fuse(APP_STATE.requests, fuseOptions);
}
```

## Customization Guide

### Adding New Fields

**1. Update HTML form:**
```html
<div class="form-group">
    <label for="custom-field">Custom Field</label>
    <input type="text" id="custom-field" placeholder="Enter value">
</div>
```

**2. Add to DOM selectors:**
```javascript
const S = {
    inputs: {
        // existing fields...
        custom_field: "#custom-field"
    }
};
```

**3. Update form handling:**
```javascript
// In form submission event
const requestData = {
    // existing fields...
    customField: getVal(S.inputs.custom_field)
};
```

**4. Add to data cleaning:**
```javascript
function cleanAndValidateData(data) {
    const cleaned = { ...data };
    
    // Add custom field validation
    if (cleaned.customField) {
        cleaned.customField = SecurityUtils.sanitizeHtml(cleaned.customField);
        // Add custom validation logic
    }
    
    return cleaned;
}
```

### Adding New Export Formats

```javascript
function exportToCustomFormat() {
    const customData = APP_STATE.requests.map(req => ({
        // Transform to custom format
        customId: req.id,
        customTitle: req.title,
        // ... other mappings
    }));
    
    const content = JSON.stringify(customData, null, 2);
    downloadFile('custom-export.json', content, 'application/json');
}

// Add button event listener
document.getElementById('exportCustom')?.addEventListener('click', exportToCustomFormat);
```

### Creating New Views

```javascript
function renderCustomView(requests) {
    const container = document.getElementById('customView');
    if (!container) return;
    
    container.innerHTML = '';
    
    requests.forEach(request => {
        const element = document.createElement('div');
        element.className = 'custom-item';
        element.innerHTML = `
            <h3>${SecurityUtils.sanitizeHtml(request.title)}</h3>
            <p>${SecurityUtils.sanitizeHtml(request.authors)}</p>
        `;
        container.appendChild(element);
    });
}
```

### Theme Customization

```css
/* Add new theme */
[data-theme="custom"] {
    --primary: #your-color;
    --bg-white: #your-bg;
    --border-gray: #your-border;
}
```

## API Integration

### Adding New Data Sources

**1. Create enrichment method:**
```javascript
class PMIDEnrichmentPipeline {
    async enrichNewSource(identifier) {
        // Validation
        if (!this.validateNewSourceID(identifier)) {
            throw new Error('Invalid identifier');
        }
        
        // Rate limiting
        if (!this.rateLimit.canMakeRequest()) {
            throw new Error('Rate limit exceeded');
        }
        
        try {
            const response = await fetch(`https://new-api.com/lookup/${identifier}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'SilentStacks/2.0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            return this.normalizeNewSourceData(data);
        } catch (error) {
            console.error('New source enrichment failed:', error);
            throw error;
        }
    }
    
    normalizeNewSourceData(rawData) {
        return {
            status: 'complete',
            unified: {
                title: SecurityUtils.sanitizeHtml(rawData.title),
                authors: this.formatAuthors(rawData.authors),
                // ... other fields
            }
        };
    }
}
```

**2. Add UI elements:**
```html
<div class="form-group">
    <label for="new-source-id">New Source ID</label>
    <div class="input-with-button">
        <input type="text" id="new-source-id" placeholder="Enter ID">
        <button type="button" id="lookup-new-source" class="btn">Lookup</button>
    </div>
</div>
```

**3. Wire up event handler:**
```javascript
document.getElementById('lookup-new-source')?.addEventListener('click', async () => {
    const identifier = getVal('#new-source-id').trim();
    
    if (!identifier) {
        announceToScreenReader('Please enter an identifier');
        return;
    }
    
    try {
        const result = await engine.enrichNewSource(identifier);
        fillForm(result.unified);
        announceToScreenReader('Lookup successful');
    } catch (error) {
        announceToScreenReader(`Lookup failed: ${error.message}`);
    }
});
```

## Testing and Validation

### Manual Testing Checklist

**Core Functions:**
- [ ] Add new request manually
- [ ] PMID/DOI/NCT lookups work
- [ ] Bulk paste operations
- [ ] CSV file upload
- [ ] Search and filtering
- [ ] Export functions
- [ ] Theme switching

**Edge Cases:**
- [ ] Invalid identifiers
- [ ] Large datasets (500+ requests)
- [ ] Malformed CSV files
- [ ] Network failures
- [ ] Storage quota exceeded

**Security Testing:**
```javascript
// Test input sanitization
const maliciousInput = '<script>alert("XSS")</script>';
const sanitized = SecurityUtils.sanitizeHtml(maliciousInput);
console.assert(!sanitized.includes('<script>'), 'XSS protection failed');

// Test validation
console.assert(!SecurityUtils.isValidPMID('abc123'), 'PMID validation failed');
console.assert(SecurityUtils.isValidEmail('test@example.com'), 'Email validation failed');
```

### Performance Testing

```javascript
// Test large dataset handling
function testLargeDataset() {
    const testRequests = [];
    for (let i = 0; i < 1000; i++) {
        testRequests.push(generateTestRequest(i));
    }
    
    console.time('renderLargeDataset');
    APP_STATE.requests = testRequests;
    renderRequests();
    console.timeEnd('renderLargeDataset');
}

// Test search performance
function testSearchPerformance() {
    console.time('searchTest');
    performFuzzySearch('cancer research');
    console.timeEnd('searchTest');
}
```

## Error Handling

### Error Recovery Patterns

```javascript
// Graceful degradation
function robustOperation() {
    try {
        return criticalFunction();
    } catch (error) {
        console.error('Critical function failed:', error);
        announceToScreenReader('Operation failed, using fallback');
        return fallbackFunction();
    }
}

// Storage error handling
function safeStorageOperation(key, data) {
    try {
        SafeStorage.setItem(key, data);
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            // Attempt cleanup
            SafeStorage.cleanup();
            try {
                SafeStorage.setItem(key, data);
                return true;
            } catch (retryError) {
                announceToScreenReader('Storage full, please export data');
                return false;
            }
        }
        console.error('Storage error:', error);
        return false;
    }
}
```

### Logging Strategy

```javascript
// Secure logging (no PII/PHI)
function logSecurely(level, event, metadata = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        event,
        metadata: SecurityUtils.cleanForStorage(metadata),
        sessionId: getSessionId() // Non-identifying session tracking
    };
    
    console[level](logEntry);
    
    // Optional: Store in IndexedDB for debugging
    if (APP_STATE.settings.debugMode) {
        storeDebugLog(logEntry);
    }
}
```

## Build and Deployment

### Manual Minification
```bash
# Using terser for JavaScript minification
npx terser app.js --compress --mangle --output app.min.js

# Using cssnano for CSS minification  
npx cssnano styles.css styles.min.css
```

### Automated Build Script
```javascript
// build.js
const fs = require('fs');
const terser = require('terser');

async function buildApp() {
    // Read source files
    const appSource = fs.readFileSync('src/app.js', 'utf8');
    
    // Minify
    const minified = await terser.minify(appSource, {
        compress: true,
        mangle: true
    });
    
    // Write output
    fs.writeFileSync('dist/app.min.js', minified.code);
    
    console.log('Build complete!');
}

buildApp().catch(console.error);
```

### Deployment Checklist
- [ ] All files minified
- [ ] Fonts included (if using custom fonts)
- [ ] CSP headers configured
- [ ] HTTPS enabled
- [ ] Backup procedures tested
- [ ] Performance verified
- [ ] Accessibility tested

## Best Practices

### Code Style
```javascript
// Use consistent naming
const getUserInput = () => getVal('#user-input');
const saveUserData = (data) => SafeStorage.setItem('userData', data);

// Always validate inputs
function processUserInput(input) {
    if (!input || typeof input !== 'string') {
        throw new Error('Invalid input');
    }
    return SecurityUtils.sanitizeHtml(input);
}

// Use meaningful error messages
catch (error) {
    announceToScreenReader('Unable to save request. Please try again.');
    console.error('Save failed:', error);
}
```

### Security Guidelines
1. **Always sanitize user input** before display or storage
2. **Validate all data formats** (PMID, DOI, email, etc.)
3. **Use textContent instead of innerHTML** when possible
4. **Implement rate limiting** for API calls
5. **Never trust external data** - validate API responses

### Performance Guidelines
1. **Debounce expensive operations** (search, API calls)
2. **Use document fragments** for batch DOM updates
3. **Implement virtual scrolling** for large lists
4. **Clean up event listeners** when removing elements
5. **Monitor memory usage** in developer tools

## Maintenance

### Regular Maintenance Tasks
- Update external library versions (PapaParse, Fuse.js)
- Review and update demo data
- Test with latest browser versions
- Validate security practices
- Monitor performance metrics

### Version Migration
```javascript
// Handle data format changes
function migrateData(data, fromVersion, toVersion) {
    if (fromVersion === '1.x' && toVersion === '2.0') {
        // Migrate old format to new format
        return data.map(item => ({
            ...item,
            // Add new required fields
            urgency: item.priority || 'normal',
            fillStatus: item.status || 'order'
        }));
    }
    return data;
}
```

---

*SilentStacks v2.0 Developer Guide - Last Updated: August 2025
