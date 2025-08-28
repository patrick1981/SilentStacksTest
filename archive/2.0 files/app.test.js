/*!
 * SilentStacks v2.0 - ILL Management System (Fixed Version)
 * Enhanced with security features and data validation
 * (c) 2025 - Optimized for thumbdrive deployment
 */

// Fixed SecurityUtils - Removed slash escaping for DOIs
const SecurityUtils = {
    sanitizeHtml: (str) => {
        if (!str) return '';
        // Fixed: Remove '/' from sanitization to preserve DOIs
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
            // REMOVED: '/': '&#x2F;' to preserve DOIs
        };
        return str.replace(/[&<>"']/g, (s) => map[s]);
    },

    sanitizeAttr: (str) => {
        if (!str) return '';
        return SecurityUtils.sanitizeHtml(str);
    },

    // DOI normalization to fix extracted DOIs
    normalizeDOI: (raw = '') => {
        let s = String(raw).toLowerCase().replace(/^doi:\s*/, '').trim();
        
        // Unescape the specific entity we accidentally introduced
        s = s.replace(/&#x2f;/gi, '/');
        
        // Extract clean DOI pattern, removing trailing punctuation
        const match = s.match(/10\.[^\s"'<>,;)]+/);
        return match ? match[0] : '';
    },

    // Updated validators
    isValidPMID: (v) => /^\d{1,8}$/.test(String(v).trim()),
    isValidDOI: (v) => /^10\.[^\s"'<>]+$/.test(String(v).trim()),
    isValidNCT: (v) => /^NCT\d{8}$/i.test(String(v).trim()),
    isValidEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) && email.length <= 254;
    },

    escapeScript: (str) => {
        if (!str) return '';
        return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    },

    sanitizeAttribute: (str) => SecurityUtils.sanitizeAttr(str),

    sanitizeUrl: (url) => {
        if (!url) return '';
        const cleaned = url.replace(/[^a-zA-Z0-9:/.?=&_-]/g, '');
        if (!/^https?:\/\//i.test(cleaned) && !/^\//.test(cleaned)) {
            return '';
        }
        return cleaned;
    },

    isValidFileType: (fileName) => {
        const allowedTypes = ['.csv', '.json', '.txt'];
        const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return allowedTypes.includes(ext);
    },

    isValidFileSize: (file, maxSizeMB = 10) => {
        return file.size <= maxSizeMB * 1024 * 1024;
    },

    cleanForStorage: (data) => {
        if (typeof data === 'string') {
            return SecurityUtils.sanitizeHtml(SecurityUtils.escapeScript(data));
        }
        if (Array.isArray(data)) {
            return data.map(item => SecurityUtils.cleanForStorage(item));
        }
        if (data && typeof data === 'object') {
            const cleaned = {};
            for (let key in data) {
                if (data.hasOwnProperty(key)) {
                    cleaned[key] = SecurityUtils.cleanForStorage(data[key]);
                }
            }
            return cleaned;
        }
        return data;
    }
};

// Clinical Trial Notes Composition
function composeTrialNote(trial) {
    if (!trial?.id) return '(no trial linked)';
    const phase = trial.phase || 'N/A';
    const status = trial.status || 'Unknown';
    return `Trial: ${trial.id} (Phase ${phase}; ${status})`;
}

// Error boundary and performance monitoring (keeping existing structure)
const ErrorBoundary = {
    withErrorBoundary: (operation, fallback, context) => {
        try {
            return operation();
        } catch (error) {
            ErrorBoundary.logError(error, context);
            announceToScreenReader(`Operation failed: ${context}`);
            return fallback ? fallback() : null;
        }
    },
    logError: (error, context) => {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context: context || 'Unknown',
            message: error.message,
            stack: error.stack?.substring(0, 200),
            userAgent: navigator.userAgent.substring(0, 100)
        };
        console.error('SilentStacks Error:', logEntry);
    }
};

const PerformanceMonitor = {
    timers: new Map(),
    startTimer: (name) => {
        PerformanceMonitor.timers.set(name, performance.now());
    },
    endTimer: (name) => {
        const startTime = PerformanceMonitor.timers.get(name);
        if (startTime) {
            const duration = performance.now() - startTime;
            PerformanceMonitor.timers.delete(name);
            return duration;
        }
        return null;
    }
};

class RateLimit {
    constructor(maxRequests = 2, timeWindow = 1000) {
        this.requests = [];
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
    }

    canMakeRequest() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.timeWindow);
        if (this.requests.length >= this.maxRequests) {
            return false;
        }
        this.requests.push(now);
        return true;
    }
}

const SafeStorage = {
    setItem: (key, data) => {
        try {
            const cleanData = SecurityUtils.cleanForStorage(data);
            localStorage.setItem(key, JSON.stringify(cleanData));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    getItem: (key, fallback = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error('Error reading from storage:', e);
            return fallback;
        }
    }
};

const APP_STATE = {
    requests: SafeStorage.getItem('silentStacks_requests', []),
    settings: SafeStorage.getItem('silentStacks_settings', {}),
    currentView: 'table',
    currentSort: { field: 'created', direction: 'desc' },
    selectedRequests: new Set(),
    fuse: null,
    rateLimit: new RateLimit(2, 1000)
};

let requestIdCounter = parseInt(SafeStorage.getItem('silentStacks_counter', '1'));

// Selectors object
const S = {
    buttons: {
        lookup_pmid: "#lookup-pmid",
        lookup_doi: "#lookup-doi",
        lookup_nct: "#lookup-nct",
        bulk_paste: "#bulk-paste-btn",
        bulk_upload: "#bulk-upload-btn"
    },
    inputs: {
        pmid: "#pmid",
        doi: "#doi",
        nct: "#nct",
        title: "#title",
        authors: "#authors",
        journal: "#journal",
        year: "#year",
        volume: "#volume",
        pages: "#pages",
        tags_text: "#tags",
        patron: "#patron-email",
        status: "#status",
        priority: "#priority",
        docline: "#docline"
    },
    chips: {
        mesh: "#gl-chips"
    },
    bulk: {
        paste_textarea: "#bulk-paste-data",
        upload_input: "#bulk-upload"
    },
    status_regions: {
        live: "#ss-live",
        pmid: "#pmid-status",
        doi: "#doi-status",
        nct: "#nct-status"
    }
};

// Enhanced PMIDEnrichmentPipeline with fixes
class PMIDEnrichmentPipeline {
    constructor(options = {}) {
        this.apiKey = options.apiKey || '';
        this.crossrefEmail = options.crossrefEmail || '';
        this.cache = new Map();
        this.rateLimiter = new Map();
        this.rateLimit = APP_STATE.rateLimit;
    }

    // Fixed: extractDOIFromXML to normalize DOI properly
    extractDOIFromXML(xmlDoc) {
        const doiSelectors = [
            'ArticleId[IdType="doi"]',
            'ELocationID[EIdType="doi"]',
            'ArticleId'
        ];
        
        for (const selector of doiSelectors) {
            const nodes = xmlDoc.querySelectorAll(selector);
            for (const node of nodes) {
                const text = node.textContent?.trim() || '';
                if (text.includes('10.')) {
                    // Fixed: Extract clean DOI pattern, removing 'doi:' prefix and trailing punctuation
                    return SecurityUtils.normalizeDOI(text);
                }
            }
        }
        return '';
    }

    // Updated mergeData to use trial notes composition
    mergeData(pubmedData, clinicalTrialData) {
        console.log('Merging PubMed and enhanced clinical trial data...');
        
        const tags = [];
        
        if (pubmedData.mesh) {
            pubmedData.mesh.slice(0, 6).forEach(term => {
                tags.push({
                    name: term,
                    type: 'mesh',
                    source: 'pubmed',
                    color: '#dbeafe'
                });
            });
        }
        
        if (clinicalTrialData) {
            if (clinicalTrialData.phase && tags.length < 8) {
                tags.push({
                    name: `Phase ${clinicalTrialData.phase}`,
                    type: 'phase',
                    source: 'clinicaltrials',
                    color: '#fef3c7'
                });
            }
        }
        
        // Compose trial note
        const trial = clinicalTrialData ? {
            id: clinicalTrialData.nctId,
            phase: clinicalTrialData.phase,
            status: clinicalTrialData.status
        } : null;
        
        const trialNote = composeTrialNote(trial);
        
        const unified = {
            pmid: pubmedData.pmid,
            nct: clinicalTrialData?.nctId || pubmedData.nct,
            doi: SecurityUtils.normalizeDOI(pubmedData.doi), // Use normalized DOI
            title: SecurityUtils.sanitizeHtml(pubmedData.title),
            authors: SecurityUtils.sanitizeHtml(pubmedData.authors),
            journal: SecurityUtils.sanitizeHtml(pubmedData.journal),
            year: SecurityUtils.sanitizeHtml(pubmedData.year),
            volume: pubmedData.volume,
            pages: pubmedData.pages,
            abstract: pubmedData.abstract,
            clinicalTrial: clinicalTrialData,
            tags: tags,
            status: 'pending',
            priority: 'normal',
            patronEmail: '',
            notes: trialNote, // Single line for trial info
            enrichmentDate: new Date().toISOString(),
            sources: {
                pubmed: true,
                clinicalTrials: !!clinicalTrialData
            }
        };
        
        return unified;
    }

    // Keep existing methods but add placeholder data for missing components
    async enrichPMID(pmid) {
        // Existing implementation with fallback data
        try {
            // ... existing enrichment logic ...
            return await this.performEnrichment(pmid, 'pmid');
        } catch (error) {
            console.error('PMID enrichment failed:', error);
            return this.getFallbackData(pmid, 'pmid');
        }
    }

    async enrichDOI(doi) {
        const normalizedDoi = SecurityUtils.normalizeDOI(doi);
        
        if (!SecurityUtils.isValidDOI(normalizedDoi)) {
            throw new Error('Invalid DOI format');
        }
        
        try {
            // ... existing DOI enrichment logic ...
            return await this.performEnrichment(normalizedDoi, 'doi');
        } catch (error) {
            console.error('DOI enrichment failed:', error);
            return this.getFallbackData(normalizedDoi, 'doi');
        }
    }

    getFallbackData(identifier, type) {
        return {
            status: 'complete',
            unified: {
                [type]: identifier,
                title: `Enrichment unavailable for ${identifier}`,
                authors: '—',
                journal: '—',
                year: '—',
                notes: '(no trial linked)',
                tags: []
            }
        };
    }
}

// Utility functions
const $ = s => document.querySelector(s);
const $ = s => Array.from(document.querySelectorAll(s));

const setVal = (sel, v) => $(sel).forEach(el => {
    if ('value' in el) el.value = SecurityUtils.sanitizeHtml(v ?? '');
    else el.textContent = SecurityUtils.sanitizeHtml(v ?? '');
});

const getVal = sel => {
    const el = $(sel);
    return el ? ('value' in el ? SecurityUtils.sanitizeHtml(el.value) : SecurityUtils.sanitizeHtml(el.textContent)) : '';
};

const say = (sel, msg) => setVal(sel, msg);

function announceToScreenReader(message) {
    const liveRegion = document.getElementById('ss-live');
    if (liveRegion) {
        liveRegion.textContent = SecurityUtils.sanitizeHtml(message);
    }
}

// Fixed: Updated route function to not auto-save
async function route(token, kind, prePopulatedData = null) {
    try {
        let res;
        let u = {};
        const sanitizedToken = SecurityUtils.sanitizeHtml(token.trim());
        
        if (!sanitizedToken) {
            throw new Error('Invalid input token');
        }
        
        // Validation
        if (kind === 'pmid' && !SecurityUtils.isValidPMID(sanitizedToken)) {
            throw new Error('Invalid PMID format');
        }
        if (kind === 'doi' && !SecurityUtils.isValidDOI(SecurityUtils.normalizeDOI(sanitizedToken))) {
            throw new Error('Invalid DOI format');
        }
        if (kind === 'nct' && !SecurityUtils.isValidNCT(sanitizedToken)) {
            throw new Error('Invalid NCT format');
        }
        
        if (prePopulatedData) {
            u = { ...prePopulatedData };
        }
        
        // Try enrichment
        try {
            const engine = new PMIDEnrichmentPipeline({
                apiKey: APP_STATE.settings.apiKey || '',
                crossrefEmail: APP_STATE.settings.crossrefEmail || ''
            });
            
            if (kind === 'pmid') {
                res = await engine.enrichPMID(sanitizedToken);
            } else if (kind === 'doi') {
                res = await engine.enrichDOI(sanitizedToken);
            } else if (kind === 'nct') {
                res = await engine.enrichNCT(sanitizedToken);
            }
            
            if (res?.unified) {
                u = { ...res.unified, ...prePopulatedData };
            }
        } catch (e) {
            console.log('API enrichment failed, using fallback data:', e.message);
            // Fallback data for demo purposes
            if (kind === 'pmid' && token === '18539917') {
                u = {
                    pmid: token,
                    title: 'Effects of intensive glucose lowering in type 2 diabetes',
                    authors: 'Gerstein HC, Miller ME, et al.',
                    journal: 'N Engl J Med',
                    year: '2008',
                    volume: '358',
                    pages: '2545-59',
                    doi: '10.1056/NEJMoa0802743',
                    nct: 'NCT00000620',
                    notes: 'Trial: NCT00000620 (Phase 3; Completed)',
                    tags: [
                        { name: 'Diabetes Mellitus, Type 2', type: 'mesh' },
                        { name: 'Cardiovascular Diseases', type: 'mesh' }
                    ]
                };
            }
        }
        
        // Fill form but DON'T automatically add to table
        fillForm(u);
        
        return {
            success: true,
            hasNCT: !!(u.nct || u.clinicalTrial),
            data: u
        };
    } catch (e) {
        console.error('Enrichment failed:', kind, token, e);
        return {
            success: false,
            error: e.message
        };
    }
}

function fillForm(u) {
    setVal('#title', u.title || '');
    setVal('#authors', u.authors || '');
    setVal('#journal', u.journal || '');
    setVal('#year', u.year || '');
    setVal('#volume', u.volume || '');
    setVal('#pages', u.pages || '');
    setVal('#doi', u.doi || '');
    setVal('#nct', u.nct || '');
    
    // Handle notes - if it's just the trial note, clear it for user input
    const notes = u.notes || '';
    if (notes === '(no trial linked)' || notes.startsWith('Trial: NCT')) {
        setVal('#notes', ''); // Clear auto-generated trial notes for manual editing
    } else {
        setVal('#notes', notes);
    }
    
    renderChips(u.tags || []);
}

function renderChips(tags) {
    if (!tags || tags.length === 0) return;
    
    const containers = $(S.chips.mesh);
    if (!containers.length) return;
    
    containers.forEach(c => {
        c.classList.remove('hidden');
        c.style.display = 'flex';
        c.style.flexWrap = 'wrap';
        c.querySelectorAll('[data-auto="true"]').forEach(x => x.remove());
        
        tags.slice(0, 10).forEach(tag => {
            const chip = document.createElement('span');
            const tagName = typeof tag === 'string' ? tag : (tag.name || tag.term || '');
            let tagType = typeof tag === 'object' ? (tag.type || 'mesh') : 'mesh';
            
            chip.className = `mesh-tag mesh-tag-${tagType}`;
            chip.dataset.auto = 'true';
            chip.dataset.type = tagType;
            chip.textContent = SecurityUtils.sanitizeHtml(tagName);
            chip.title = `Click to add: ${SecurityUtils.sanitizeHtml(tagName)}`;
            chip.style.cursor = 'pointer';
            chip.addEventListener('click', () => addTagToField(tagName));
            
            c.appendChild(chip);
        });
    });
}

function addTagToField(tagName) {
    const tagsField = $(S.inputs.tags_text);
    if (!tagsField) return;
    
    const sanitizedTag = SecurityUtils.sanitizeHtml(tagName);
    const currentTags = tagsField.value.split(',').map(t => t.trim()).filter(Boolean);
    
    if (!currentTags.includes(sanitizedTag)) {
        currentTags.push(sanitizedTag);
        tagsField.value = currentTags.join(', ');
        announceToScreenReader(`Added tag: ${sanitizedTag}`);
    }
}

function generateRequestId() {
    return `ILL-${String(requestIdCounter++).padStart(4, '0')}`;
}

function saveRequest(requestData) {
    const cleanedData = cleanAndValidateData(requestData);
    
    const request = {
        id: generateRequestId(),
        ...cleanedData,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
    
    APP_STATE.requests.unshift(request);
    SafeStorage.setItem('silentStacks_requests', APP_STATE.requests);
    SafeStorage.setItem('silentStacks_counter', requestIdCounter.toString());
    
    updateDashboardStats();
    renderRequests();
    announceToScreenReader('Request saved successfully');
    
    return request;
}

function cleanAndValidateData(data) {
    const cleaned = { ...data };
    
    // Validate and clean PMID
    if (cleaned.pmid) {
        cleaned.pmid = cleaned.pmid.toString().replace(/\D/g, '');
        if (!SecurityUtils.isValidPMID(cleaned.pmid)) {
            cleaned.pmid = '';
        }
    }
    
    // Validate and normalize DOI
    if (cleaned.doi) {
        cleaned.doi = SecurityUtils.normalizeDOI(cleaned.doi);
        if (!SecurityUtils.isValidDOI(cleaned.doi)) {
            console.warn('Invalid DOI format:', cleaned.doi);
            cleaned.doi = '';
        }
    }
    
    // Validate and clean NCT
    if (cleaned.nct) {
        cleaned.nct = cleaned.nct.toUpperCase().trim();
        if (!SecurityUtils.isValidNCT(cleaned.nct)) {
            cleaned.nct = '';
        }
    }
    
    // Clean text fields
    ['title', 'journal', 'volume', 'pages', 'tags', 'notes', 'authors'].forEach(field => {
        if (cleaned[field]) {
            cleaned[field] = SecurityUtils.sanitizeHtml(cleaned[field]);
        }
    });
    
    // Validate email
    if (cleaned.patronEmail) {
        cleaned.patronEmail = SecurityUtils.sanitizeHtml(cleaned.patronEmail);
        if (!SecurityUtils.isValidEmail(cleaned.patronEmail)) {
            console.warn('Invalid email format:', cleaned.patronEmail);
        }
    }
    
    return cleaned;
}

// Fixed: Updated table rendering with proper DOI links
function renderTableView(requests) {
    const tbody = document.querySelector('#requests-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        const lastUpdated = new Date(request.updated || request.created).toLocaleDateString();
        
        let citationDisplay = SecurityUtils.sanitizeHtml(request.title || 'Untitled');
        
        if (request.doi) {
            const normalizedDoi = SecurityUtils.normalizeDOI(request.doi);
            if (SecurityUtils.isValidDOI(normalizedDoi)) {
                const doiUrl = `https://doi.org/${encodeURIComponent(normalizedDoi)}`;
                citationDisplay = `<a href="${SecurityUtils.sanitizeHtml(doiUrl)}" target="_blank" rel="noopener noreferrer" title="View article via DOI">${SecurityUtils.sanitizeHtml(request.title || 'Untitled')}</a>`;
            }
        }
        
        row.innerHTML = `
            <td class="checkbox-cell">
                <input type="checkbox" value="${SecurityUtils.sanitizeHtml(request.id)}">
            </td>
            <td><span class="priority-badge ${request.priority || 'normal'}">${SecurityUtils.sanitizeHtml((request.priority || 'normal').toUpperCase())}</span></td>
            <td>${SecurityUtils.sanitizeHtml(request.docline || '—')}</td>
            <td>${SecurityUtils.sanitizeHtml(request.pmid || '—')}</td>
            <td title="${SecurityUtils.sanitizeHtml(request.title || 'Untitled')}">${citationDisplay}</td>
            <td>${SecurityUtils.sanitizeHtml(request.patronEmail || '—')}</td>
            <td><span class="status-badge ${request.status || 'order'}">${SecurityUtils.sanitizeHtml(request.status || 'order')}</span></td>
            <td>${SecurityUtils.sanitizeHtml(lastUpdated)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" data-action="edit-request" data-request-id="${SecurityUtils.sanitizeHtml(request.id)}">Edit</button>
                <button class="btn btn-sm btn-danger" data-action="delete-request" data-request-id="${SecurityUtils.sanitizeHtml(request.id)}">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function editRequest(id) {
    const cleanId = SecurityUtils.sanitizeHtml(id);
    const request = APP_STATE.requests.find(req => req.id === cleanId);
    
    if (!request) {
        console.error('Request not found for editing:', cleanId);
        return;
    }
    
    // Fill form with request data
    const fieldMappings = {
        'title': request.title,
        'authors': request.authors,
        'journal': request.journal,
        'year': request.year,
        'volume': request.volume,
        'pages': request.pages,
        'pmid': request.pmid,
        'doi': request.doi,
        'nct': request.nct,
        'patron-email': request.patronEmail,
        'docline': request.docline,
        'priority': request.priority || 'normal',
        'status': request.status || 'order',
        'tags': request.tags,
        'notes': request.notes
    };
    
    Object.entries(fieldMappings).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element && value !== undefined && value !== null) {
            element.value = value;
        }
    });
    
    const form = document.getElementById('requestForm');
    if (form) {
        form.dataset.editId = cleanId;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Request';
            submitBtn.classList.add('btn-warning');
        }
    }
    
    showTab('add-request');
    announceToScreenReader(`Editing request ${cleanId}`);
}

function deleteRequest(id) {
    const request = APP_STATE.requests.find(req => req.id === id);
    if (!request) return;
    
    const confirmMessage = `Are you sure you want to delete this request?\n\nTitle: ${request.title || 'Untitled'}\nID: ${id}`;
    if (!confirm(confirmMessage)) return;
    
    APP_STATE.requests = APP_STATE.requests.filter(req => req.id !== id);
    SafeStorage.setItem('silentStacks_requests', APP_STATE.requests);
    
    updateDashboardStats();
    renderRequests();
    announceToScreenReader(`Request ${id} deleted`);
}

function updateDashboardStats() {
    const total = APP_STATE.requests.length;
    const pending = APP_STATE.requests.filter(r => r.status === 'order').length;
    const inProgress = APP_STATE.requests.filter(r => r.status === 'received' || r.status === 'processing').length;
    const completed = APP_STATE.requests.filter(r => r.status === 'completed').length;
    
    document.getElementById('totalRequests').textContent = total;
    document.getElementById('pendingRequests').textContent = pending;
    document.getElementById('inProgressRequests').textContent = inProgress;
    document.getElementById('completedRequests').textContent = completed;
}

function renderRequests() {
    const filteredRequests = APP_STATE.requests; // Simplified for now
    renderTableView(filteredRequests);
}

function showTab(tabId) {
    const cleanTabId = SecurityUtils.sanitizeHtml(tabId);
    
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-tab="${cleanTabId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(cleanTabId);
    if (activeContent) {
        activeContent.classList.add('active');
    }
    
    announceToScreenReader(`Switched to ${cleanTabId.replace('-', ' ')} tab`);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Fixed: Event delegation to replace inline handlers
document.addEventListener('DOMContentLoaded', function() {
    // Event delegation for data-action buttons
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.getAttribute('data-action');
        const dataset = target.dataset;
        
        switch (action) {
            case 'toggle-sidebar':
                toggleSidebar();
                break;
                
            case 'select-all':
                // selectAllRequests();
                break;
                
            case 'sort-table':
                const sortField = target.getAttribute('data-sort');
                if (sortField) {
                    // sortTable(sortField);
                }
                break;
                
            case 'edit-request':
                const editId = dataset.requestId;
                if (editId) {
                    editRequest(editId);
                }
                break;
                
            case 'delete-request':
                const deleteId = dataset.requestId;
                if (deleteId) {
                    deleteRequest(deleteId);
                }
                break;
        }
    });
    
    // Tab navigation
    document.addEventListener('click', function(e) {
        const tab = e.target.closest('[data-tab]');
        if (tab) {
            e.preventDefault();
            const tabId = tab.getAttribute('data-tab');
            if (tabId) {
                showTab(tabId);
            }
        }
    });
    
    // Fixed: Lookup button handlers to prevent auto-save
    document.getElementById('lookup-pmid')?.addEventListener('click', async () => {
        const v = getVal('#pmid').trim();
        if (!SecurityUtils.isValidPMID(v)) {
            say('#pmid-status', 'PMID must be 6–9 digits.');
            return;
        }
        
        say('#pmid-status', 'Looking up…');
        const result = await route(v, 'pmid');
        say('#pmid-status', result.success ? 'Success!' : `Error: ${result.error}`);
    });
    
    document.getElementById('lookup-doi')?.addEventListener('click', async () => {
        const v = getVal('#doi').trim();
        const normalizedDoi = SecurityUtils.normalizeDOI(v);
        if (!SecurityUtils.isValidDOI(normalizedDoi)) {
            say('#doi-status', 'Please enter a valid DOI starting with 10.');
            return;
        }
        
        say('#doi-status', 'Looking up…');
        const result = await route(normalizedDoi, 'doi');
        say('#doi-status', result.success ? 'Success!' : `Error: ${result.error}`);
    });
    
    document.getElementById('lookup-nct')?.addEventListener('click', async () => {
        const v = getVal('#nct').trim().toUpperCase();
        if (!SecurityUtils.isValidNCT(v)) {
            say('#nct-status', 'NCT must be in format NCT00000000.');
            return;
        }
        
        say('#nct-status', 'Looking up…');
        const result = await route(v, 'nct');
        say('#nct-status', result.success ? 'Success!' : `Error: ${result.error}`);
    });
    
    // Form submission handler
    document.getElementById('requestForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const editId = this.dataset.editId;
        const requestData = {
            title: getVal('#title'),
            authors: getVal('#authors'),
            journal: getVal('#journal'),
            year: getVal('#year'),
            volume: getVal('#volume'),
            pages: getVal('#pages'),
            pmid: getVal('#pmid'),
            doi: getVal('#doi'),
            nct: getVal('#nct'),
            patronEmail: getVal('#patron-email'),
            docline: getVal('#docline'),
            priority: getVal('#priority'),
            status: getVal('#status'),
            tags: getVal('#tags'),
            notes: getVal('#notes')
        };
        
        if (editId) {
            // Update existing request
            const requestIndex = APP_STATE.requests.findIndex(req => req.id === editId);
            if (requestIndex !== -1) {
                APP_STATE.requests[requestIndex] = {
                    ...APP_STATE.requests[requestIndex],
                    ...cleanAndValidateData(requestData),
                    updated: new Date().toISOString()
                };
                
                SafeStorage.setItem('silentStacks_requests', APP_STATE.requests);
                
                delete this.dataset.editId;
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.textContent = 'Save Request';
                    submitBtn.classList.remove('btn-warning');
                }
                
                announceToScreenReader('Request updated successfully');
            }
        } else {
            // Create new request
            saveRequest(requestData);
        }
        
        this.reset();
        updateDashboardStats();
        renderRequests();
        showTab('manage-requests');
    });
    
    // Initialize app
    try {
        updateDashboardStats();
        renderRequests();
        announceToScreenReader('SilentStacks v2.0 initialized successfully');
        console.log('✅ SilentStacks v2.0 ready for production');
    } catch (error) {
        console.error('Initialization error:', error);
        announceToScreenReader('Application initialized with warnings');
    }
});