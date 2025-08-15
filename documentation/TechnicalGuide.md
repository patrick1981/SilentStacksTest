# SilentStacks v2.0 - Technical Guide

## Architecture Overview

### 3-File Modular Design
```
silentstacks-v2.0/
├── index.html           (~15KB) - Complete UI shell with embedded CSS
├── dependencies.min.js  (~80KB) - PapaParse + Fuse.js libraries
└── app.min.js          (~28KB) - Core application logic
```

**Total footprint: ~123KB** (plus fonts: +60KB = ~183KB total)

### Design Principles
- **Memory-Safe Loading**: Staged script loading prevents browser crashes
- **Offline-First**: Complete functionality without internet connection
- **Security-Hardened**: Input validation, XSS prevention, safe storage
- **Library-Optimized**: Purpose-built for ILL workflow requirements

## Core Technologies

### Frontend Stack
- **Vanilla JavaScript**: No framework dependencies, maximum compatibility
- **CSS Custom Properties**: Theme system with dark/light/high-contrast modes
- **LocalStorage**: Client-side data persistence with error handling
- **Web APIs**: FileReader, Blob, URL.createObjectURL for file operations

### External Libraries
- **PapaParse v5.4.1**: Robust CSV parsing with error recovery
- **Fuse.js v6.6.2**: Weighted fuzzy search with scoring algorithms

### API Integrations
- **PubMed/NCBI**: Research article metadata (demo mode for CORS limitations)
- **CrossRef**: DOI resolution and citation data
- **ClinicalTrials.gov**: Clinical trial information

## Security Architecture

### Input Validation
```javascript
// All inputs validated before processing
SecurityUtils.sanitizeHtml(userInput)
SecurityUtils.isValidPMID(pmid)
SecurityUtils.isValidEmail(email)
SecurityUtils.isValidFileType(filename)
```

### XSS Prevention
- HTML entity encoding for all dynamic content
- Script tag removal from user inputs
- Safe DOM manipulation using textContent vs innerHTML

### File Upload Security
- File type whitelist: `.csv`, `.json`, `.txt` only
- Size limits: 10MB maximum
- Content validation before processing

### Rate Limiting
- API calls limited: 15 requests per 60 seconds
- Prevents abuse and respects external API limits
- Graceful degradation when limits exceeded

## Data Management

### Storage Strategy
```javascript
// Enhanced localStorage with error handling
SafeStorage.setItem(key, data)  // Auto-sanitization
SafeStorage.getItem(key, fallback)  // Error recovery
SafeStorage.cleanup()  // Automatic maintenance
```

### Data Validation Pipeline
1. **Input Sanitization**: Clean all user inputs
2. **Format Validation**: Verify PMID/DOI/NCT formats
3. **Business Logic**: Check DOCLINE uniqueness
4. **Storage Cleaning**: Sanitize before persistence

### Data Quality Features
- Duplicate detection (DOCLINE numbers)
- Format standardization (author names, years)
- Value mapping ("rush" → "urgent", "complete" → "completed")
- Comprehensive validation reporting

## Performance Optimization

### Memory Management
- **Staged Loading**: Dependencies load before application
- **Lazy Initialization**: Heavy operations deferred until needed
- **Cleanup Routines**: Automatic storage maintenance
- **Debounced Search**: 300ms delay prevents excessive operations

### Search Performance
```javascript
// Weighted fuzzy search configuration
{
    keys: [
        { name: 'title', weight: 0.3 },
        { name: 'authors', weight: 0.2 },
        { name: 'patronEmail', weight: 0.2 },
        { name: 'journal', weight: 0.1 },
        { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.4,
    minMatchCharLength: 2
}
```

### Rendering Optimization
- Virtual scrolling concepts for large datasets
- Efficient DOM updates with documentFragments
- Minimal reflows through batched operations

## Font Integration Assessment

### Current Impact
Adding 2 self-hosted .woff fonts:
- **Additional Size**: ~60KB (30KB each typical)
- **New Total**: ~183KB (still excellent for thumbdrive)
- **Load Performance**: Requires font preloading strategy

### Implementation Considerations
```html
<!-- Preload fonts for performance -->
<link rel="preload" href="fonts/main-regular.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="fonts/main-bold.woff" as="font" type="font/woff" crossorigin>

<!-- CSS font declarations -->
@font-face {
    font-family: 'CustomFont';
    src: url('fonts/main-regular.woff') format('woff');
    font-display: swap;
}
```

### CSP Updates Required
```
font-src 'self';
```

## Enterprise Security Plan Assessment

### Current vs Proposed
| Feature | Current v2.0 | Proposed Enterprise |
|---------|--------------|-------------------|
| **Complexity** | Low (3 files) | High (10+ files) |
| **CSP** | Basic | Advanced with nonces |
| **Workers** | None | Multiple web workers |
| **Service Worker** | None | Full offline strategy |
| **Build Process** | Manual | Complex pipeline |
| **AI Maintenance** | ✅ Easy | ❌ Difficult |
| **ILL Use Case** | ✅ Perfect fit | ⚠️ Overkill |

### Recommendation: Selective Adoption

**Adopt These Enterprise Features:**
```javascript
// 1. Enhanced CSP (simple version)
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://eutils.ncbi.nlm.nih.gov;

// 2. Subresource Integrity
<script src="dependencies.min.js" integrity="sha384-..." crossorigin="anonymous"></script>

// 3. Better error boundaries
try {
    // Critical operations
} catch (error) {
    logSecureError(error);
    showUserFriendlyMessage();
}
```

**Skip These Enterprise Features:**
- Web Workers (adds complexity, minimal benefit for ILL scale)
- Service Worker (offline already works, adds maintenance burden)
- Build pipeline (manual process works fine for this scale)
- Nonce rotation (static CSP sufficient for this threat model)

## Accessibility Implementation

### WCAG 2.1 AA Compliance
- **Focus Management**: Visible focus indicators, logical tab order
- **Screen Reader**: ARIA live regions, proper labels, semantic markup
- **Keyboard Navigation**: Full keyboard accessibility without mouse
- **Color Contrast**: High contrast theme, respects user preferences

### Implementation Details
```javascript
// Screen reader announcements
announceToScreenReader('Request saved successfully');

// Keyboard event handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cancelCurrentOperation();
});

// Focus management
element.focus({ preventScroll: false });
```

## Deployment Considerations

### Server Requirements
- **Static hosting**: Any web server (Apache, Nginx, IIS)
- **No backend**: Pure client-side application
- **HTTPS recommended**: For modern browser features

### Content Security Policy
```apache
# Apache .htaccess
Header always set Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://eutils.ncbi.nlm.nih.gov https://api.crossref.org https://clinicaltrials.gov"
```

### Browser Compatibility
- **Minimum**: ES2017 support (Chrome 58+, Firefox 52+, Safari 10+)
- **Optimal**: Modern browsers with full ES2020+ support
- **Graceful degradation**: Core features work on older browsers

## Monitoring and Maintenance

### Error Handling Strategy
```javascript
// Graceful error recovery
function handleEnrichmentError(error, identifier) {
    console.error('Enrichment failed:', error);
    announceToScreenReader(`Lookup failed for ${identifier}`);
    // Continue with manual entry
}
```

### Performance Monitoring
- Monitor LocalStorage usage and cleanup
- Track API response times and failure rates
- Log bulk operation performance metrics

### Data Integrity
- Automatic validation on application start
- Data quality reports for proactive maintenance
- Export functionality for backup strategies

## Development Workflow

### Code Organization
```
src/
├── core/
│   ├── security.js      # SecurityUtils, validation
│   ├── storage.js       # SafeStorage, data management
│   └── enrichment.js    # API integration
├── ui/
│   ├── components.js    # Reusable UI components
│   ├── views.js         # Tab management, rendering
│   └── events.js        # Event handlers
└── utils/
    ├── helpers.js       # Utility functions
    └── constants.js     # Configuration, mappings
```

### Testing Strategy
```javascript
// Unit tests for critical functions
describe('SecurityUtils', () => {
    test('sanitizes HTML properly', () => {
        expect(SecurityUtils.sanitizeHtml('<script>alert(1)</script>'))
            .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
});
```

## Migration and Upgrades

### Version Compatibility
- Data format stability across versions
- Graceful handling of missing fields
- Automatic data migration when needed

### Backup Strategy
```javascript
// Comprehensive backup format
{
    version: "2.0",
    timestamp: "2025-01-01T00:00:00.000Z",
    requests: [...],
    settings: {...},
    counter: 1234
}
```

---

*SilentStacks v2.0 Technical Guide - Last Updated: January 2025*
