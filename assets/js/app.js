// SilentStacks v1.4 Main Integration - Modular Architecture
// Updates to main.js for enhanced functionality

// Enhanced request data model
function createEnhancedRequest(data = {}) {
    return {
        id: data.id || generateId(),
        title: data.title || '',
        authors: data.authors || '',
        journal: data.journal || '',
        year: data.year || '',
        doi: data.doi || '',
        pmid: data.pmid || '',
        
        // Clinical trial fields (new in v1.4)
        nctId: data.nctId || '',
        studyPhase: data.studyPhase || '',
        studyStatus: data.studyStatus || '',
        studyType: data.studyType || '',
        
        // MeSH and medical classification (new in v1.4)
        meshHeadings: data.meshHeadings || [],
        majorMeshTerms: data.majorMeshTerms || [],
        medicalSpecialties: data.medicalSpecialties || [],
        studyTypeClassification: data.studyTypeClassification || '',
        evidenceLevel: data.evidenceLevel || '',
        meshMajorTerms: data.meshMajorTerms || '', // String version for form
        
        // Enhanced metadata
        hasLinkedClinicalTrial: data.hasLinkedClinicalTrial || false,
        publicationType: data.publicationType || 'standard-publication',
        nctNumbers: data.nctNumbers || [],
        
        // Standard fields
        priority: data.priority || 'normal',
        status: data.status || 'pending',
        notes: data.notes || '',
        tags: data.tags || '',
        dateAdded: data.dateAdded || new Date().toISOString(),
        lastModified: data.lastModified || new Date().toISOString(),
        
        // Source tracking
        source: data.source || 'manual',
        sourceUrl: data.sourceUrl || ''
    };
}

// Enhanced form submission with validation
function enhancedSubmitRequest() {
    const formData = getEnhancedFormData();
    
    // Enhanced validation
    const validation = validateEnhancedRequest(formData);
    if (!validation.isValid) {
        showFormErrors(validation.errors);
        return;
    }

    // Create enhanced request object
    const request = createEnhancedRequest(formData);
    
    // Save request using existing app.js pattern
    try {
        if (window.requests) {
            if (window.currentEdit != null) { 
                window.requests[window.currentEdit] = request; 
                window.currentEdit = null; 
            } else { 
                window.requests.unshift(request); 
            }
            
            if (window.saveAll) window.saveAll();
            if (window.renderAll) window.renderAll();
            
            showSuccess('Request saved successfully');
            clearEnhancedForm();
            
            // Show the newly added request
            setTimeout(() => {
                const requestCard = document.querySelector(`[data-index="0"]`);
                if (requestCard) {
                    requestCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    requestCard.style.backgroundColor = 'rgba(0, 102, 204, 0.1)';
                    setTimeout(() => {
                        requestCard.style.backgroundColor = '';
                    }, 2000);
                }
            }, 100);
            
        } else {
            throw new Error('Application not properly initialized');
        }
        
    } catch (error) {
        console.error('Failed to save request:', error);
        showError('Failed to save request. Please try again.');
    }
}

// Enhanced form data collection
function getEnhancedFormData() {
    return {
        title: document.getElementById('title')?.value?.trim() || '',
        authors: document.getElementById('authors')?.value?.trim() || '',
        journal: document.getElementById('journal')?.value?.trim() || '',
        year: document.getElementById('year')?.value?.trim() || '',
        doi: document.getElementById('doi')?.value?.trim() || '',
        pmid: document.getElementById('pmid')?.value?.trim() || '',
        
        // Clinical trial fields
        nctId: document.getElementById('nctId')?.value?.trim() || '',
        studyPhase: document.getElementById('studyPhase')?.value || '',
        studyStatus: document.getElementById('studyStatus')?.value || '',
        studyType: document.getElementById('studyType')?.value || '',
        
        // MeSH and medical classification fields
        meshMajorTerms: document.getElementById('meshMajorTerms')?.value?.trim() || '',
        studyTypeClassification: document.getElementById('studyTypeClassification')?.value || '',
        evidenceLevel: document.getElementById('evidenceLevel')?.value || '',
        medicalSpecialties: document.getElementById('medicalSpecialties')?.value?.trim() || '',
        
        // Standard fields
        priority: document.getElementById('priority')?.value || 'normal',
        status: document.getElementById('status')?.value || 'pending',
        notes: document.getElementById('notes')?.value?.trim() || '',
        tags: document.getElementById('tags')?.value?.trim() || ''
    };
}

// Enhanced validation with clinical trial fields
function validateEnhancedRequest(data) {
    const errors = [];
    
    // Required field validation
    if (!data.title) {
        errors.push({ field: 'title', message: 'Title is required' });
    }
    
    // Format validations
    if (data.pmid && !/^\d{1,8}$/.test(data.pmid)) {
        errors.push({ field: 'pmid', message: 'PMID must be a numeric value (1-8 digits)' });
    }
    
    if (data.nctId && !/^NCT\d{8}$/i.test(data.nctId)) {
        errors.push({ field: 'nctId', message: 'NCT ID must be in format NCT12345678' });
    }
    
    if (data.year && !/^\d{4}$/.test(data.year)) {
        errors.push({ field: 'year', message: 'Year must be a 4-digit number' });
    }
    
    if (data.doi && data.doi.length > 0 && !/^10\.\d+\/.+$/i.test(data.doi)) {
        errors.push({ field: 'doi', message: 'DOI must be in format 10.xxxx/xxxxx' });
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Enhanced form clearing
function clearEnhancedForm() {
    const fields = [
        'title', 'authors', 'journal', 'year', 'doi', 'pmid',
        'nctId', 'studyPhase', 'studyStatus', 'studyType',
        'meshMajorTerms', 'studyTypeClassification', 'evidenceLevel', 'medicalSpecialties',
        'priority', 'status', 'notes', 'tags'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.classList.remove('auto-filled', 'error');
        }
    });
    
    // Reset priority select to normal
    const prioritySelect = document.getElementById('priority');
    if (prioritySelect) {
        prioritySelect.value = 'normal';
        prioritySelect.className = 'form-control priority-select priority-normal';
    }
    
    // Reset status to pending
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.value = 'pending';
    }
    
    // Clear lookup results
    const resultsContainer = document.getElementById('lookup-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    const ctResultsContainer = document.getElementById('ct-search-results');
    if (ctResultsContainer) {
        ctResultsContainer.innerHTML = '';
    }
    
    // Clear lookup inputs
    const lookupInputs = ['nct-lookup', 'ct-condition', 'ct-intervention'];
    lookupInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    });
    
    // Hide status messages
    const statusElement = document.getElementById('lookup-status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}

// Enhanced request display with clinical trial information
function displayEnhancedRequest(request) {
    const hasTrialInfo = request.nctId || request.hasLinkedClinicalTrial;
    const isTrialPublication = request.publicationType === 'clinical-trial-publication';
    const isTrialProtocol = request.publicationType === 'clinical-trial-protocol';
    
    return `
        <div class="request-card ${hasTrialInfo ? 'has-clinical-trial' : ''} ${request.priority !== 'normal' ? 'priority-' + request.priority : ''}" 
             data-request-id="${request.id}">
            
            <!-- Priority Indicator -->
            ${request.priority !== 'normal' ? `<div class="priority-indicator ${request.priority}"></div>` : ''}
            
            <div class="request-header">
                <div class="request-checkbox">
                    <input type="checkbox" id="select-${request.id}" onchange="toggleRequestSelection('${request.id}')">
                </div>
                
                <div class="request-main">
                    <div class="request-title-row">
                        <h3 class="request-title">${request.title}</h3>
                        
                        <!-- Enhanced badges -->
                        <div class="request-badges">
                            ${request.pmid ? `<span class="badge pmid-badge">PMID: ${request.pmid}</span>` : ''}
                            ${request.nctId ? `<span class="badge nct-badge">NCT: ${request.nctId}</span>` : ''}
                            ${hasTrialInfo ? `<span class="badge clinical-trial-badge">🧪 Clinical Trial</span>` : ''}
                            ${request.evidenceLevel ? `<span class="badge evidence-badge">${formatEvidenceLevelName(request.evidenceLevel)}</span>` : ''}
                            ${request.priority !== 'normal' ? `<span class="priority-badge ${request.priority}">${request.priority.toUpperCase()}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="request-meta">
                        ${request.authors ? `<span><strong>Authors:</strong> ${request.authors}</span>` : ''}
                        ${request.journal ? `<span><strong>Journal:</strong> ${request.journal}${request.year ? ` (${request.year})` : ''}</span>` : ''}
                        ${request.doi ? `<span><strong>DOI:</strong> ${request.doi}</span>` : ''}
                    </div>
                    
                    <!-- Clinical trial information -->
                    ${hasTrialInfo ? generateTrialInfoDisplay(request) : ''}
                    
                    <!-- MeSH headings and medical classification -->
                    ${request.meshMajorTerms ? generateMeshDisplay(request) : ''}
                    
                    <!-- Study type and evidence level -->
                    ${request.studyTypeClassification || request.evidenceLevel ? generateStudyClassificationDisplay(request) : ''}
                    
                    <!-- Tags -->
                    ${request.tags ? `
                        <div class="request-tags">
                            ${request.tags.split(',').map(tag => 
                                `<span class="tag tag-colorable" onclick="toggleTagColor(this)">${tag.trim()}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Notes preview -->
                    ${request.notes ? `
                        <div class="request-notes">
                            <strong>Notes:</strong> ${truncateText(request.notes, 150)}
                        </div>
                    ` : ''}
                    
                    <div class="request-details">
                        <span class="request-date">Added: ${formatDate(request.dateAdded)}</span>
                        ${request.source && request.source !== 'manual' ? `<span class="request-source">Source: ${request.source}</span>` : ''}
                        ${request.sourceUrl ? `<a href="${request.sourceUrl}" target="_blank" class="source-link">🔗 View Source</a>` : ''}
                    </div>
                </div>
                
                <div class="request-status-container">
                    <select class="request-status-select status-${request.status}" 
                            onchange="updateRequestStatus('${request.id}', this.value)">
                        <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${request.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="fulfilled" ${request.status === 'fulfilled' ? 'selected' : ''}>Fulfilled</option>
                        <option value="cancelled" ${request.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
            
            <div class="request-actions">
                <button onclick="editRequest('${request.id}')" class="btn btn-secondary btn-small">
                    ✏️ Edit
                </button>
                <button onclick="duplicateRequest('${request.id}')" class="btn btn-secondary btn-small">
                    📋 Duplicate
                </button>
                <button onclick="deleteRequest('${request.id}')" class="btn btn-danger btn-small">
                    🗑️ Delete
                </button>
                ${request.nctId ? `
                    <button onclick="viewTrialDetails('${request.nctId}')" class="btn btn-info btn-small">
                        🧪 View Trial
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Generate clinical trial information display
function generateTrialInfoDisplay(request) {
    if (!request.nctId && !request.hasLinkedClinicalTrial) return '';
    
    return `
        <div class="clinical-trial-summary">
            <div class="trial-info-header">
                <strong>🧪 Clinical Trial Information</strong>
            </div>
            <div class="trial-info-details">
                ${request.nctId ? `<span><strong>NCT:</strong> ${request.nctId}</span>` : ''}
                ${request.studyPhase ? `<span><strong>Phase:</strong> ${formatStudyPhase(request.studyPhase)}</span>` : ''}
                ${request.studyStatus ? `<span><strong>Status:</strong> <span class="trial-status-badge status-${request.studyStatus.toLowerCase().replace(/[^a-z]/g, '-')}">${formatStudyStatus(request.studyStatus)}</span></span>` : ''}
                ${request.studyType ? `<span><strong>Type:</strong> ${request.studyType}</span>` : ''}
            </div>
        </div>
    `;
}

// Generate MeSH headings display for request cards
function generateMeshDisplay(request) {
    if (!request.meshMajorTerms) return '';
    
    const meshTerms = request.meshMajorTerms.split(',').map(term => term.trim()).filter(Boolean);
    if (meshTerms.length === 0) return '';
    
    const displayTerms = meshTerms.slice(0, 3);
    const specialties = request.medicalSpecialties ? request.medicalSpecialties.split(',').map(s => s.trim()).slice(0, 2) : [];
    
    return `
        <div class="mesh-summary">
            <div class="mesh-summary-header">
                <strong>📚 MeSH Terms:</strong>
            </div>
            <div class="mesh-terms-compact">
                ${displayTerms.map(term => 
                    `<span class="mesh-term-compact major">${term}</span>`
                ).join('')}
                ${meshTerms.length > 3 ? 
                    `<span class="mesh-more-compact">+${meshTerms.length - 3} more</span>` : ''
                }
            </div>
            ${specialties.length > 0 ? `
                <div class="specialties-compact">
                    ${specialties.map(specialty => 
                        `<span class="specialty-compact">${specialty}</span>`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Generate study classification display for request cards
function generateStudyClassificationDisplay(request) {
    if (!request.studyTypeClassification && !request.evidenceLevel) return '';
    
    return `
        <div class="study-classification-summary">
            ${request.studyTypeClassification ? `
                <span class="study-type-compact ${request.studyTypeClassification}">
                    🔬 ${formatStudyTypeName(request.studyTypeClassification)}
                </span>
            ` : ''}
            ${request.evidenceLevel ? `
                <span class="evidence-level-compact ${request.evidenceLevel}">
                    📊 ${formatEvidenceLevelName(request.evidenceLevel)}
                </span>
            ` : ''}
        </div>
    `;
}

// Helper function to format study phase names
function formatStudyPhase(phase) {
    const phaseMap = {
        'PHASE1': 'Phase I',
        'PHASE2': 'Phase II',
        'PHASE3': 'Phase III',
        'PHASE4': 'Phase IV',
        'NOT_APPLICABLE': 'Not Applicable'
    };
    return phaseMap[phase] || phase;
}

// Helper function to format study status names
function formatStudyStatus(status) {
    const statusMap = {
        'RECRUITING': 'Recruiting',
        'NOT_YET_RECRUITING': 'Not Yet Recruiting',
        'ACTIVE_NOT_RECRUITING': 'Active, Not Recruiting',
        'COMPLETED': 'Completed',
        'TERMINATED': 'Terminated',
        'SUSPENDED': 'Suspended',
        'WITHDRAWN': 'Withdrawn'
    };
    return statusMap[status] || status;
}

// Helper function to format study type names
function formatStudyTypeName(studyType) {
    const studyTypeNames = {
        'clinical-trial': 'Clinical Trial',
        'systematic-review': 'Systematic Review',
        'case-report': 'Case Report',
        'cohort-study': 'Cohort Study',
        'cross-sectional': 'Cross-Sectional',
        'case-control': 'Case-Control',
        'review': 'Review',
        'other': 'Other'
    };
    
    return studyTypeNames[studyType] || studyType;
}

// Helper function to format evidence level names  
function formatEvidenceLevelName(evidenceLevel) {
    const evidenceLevels = {
        'level-1': 'Level I',
        'level-2': 'Level II', 
        'level-3': 'Level III',
        'level-4': 'Level IV',
        'level-5': 'Level V',
        'level-6': 'Level VI',
        'level-7': 'Level VII'
    };
    
    return evidenceLevels[evidenceLevel] || evidenceLevel;
}

// Enhanced statistics calculation
function calculateEnhancedStats() {
    const requests = window.requests || [];
    
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        inProgress: requests.filter(r => r.status === 'in-progress').length,
        fulfilled: requests.filter(r => r.status === 'fulfilled').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length,
        
        // Clinical trial statistics
        clinicalTrials: requests.filter(r => r.nctId || r.hasLinkedClinicalTrial).length,
        trialPublications: requests.filter(r => r.publicationType === 'clinical-trial-publication').length,
        trialProtocols: requests.filter(r => r.publicationType === 'clinical-trial-protocol').length,
        
        // Priority statistics
        urgent: requests.filter(r => r.priority === 'urgent').length,
        rush: requests.filter(r => r.priority === 'rush').length,
        normal: requests.filter(r => r.priority === 'normal').length,
        
        // Source statistics
        pubmedSources: requests.filter(r => r.source === 'pubmed').length,
        manualEntries: requests.filter(r => r.source === 'manual').length,
        
        // Recent activity
        addedThisWeek: requests.filter(r => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(r.dateAdded) > weekAgo;
        }).length
    };
    
    return stats;
}

// Enhanced export functionality with clinical trial data
function exportEnhancedData(format) {
    const requests = window.requests || [];
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    if (format === 'csv') {
        const headers = [
            'Title', 'Authors', 'Journal', 'Year', 'DOI', 'PMID',
            'NCT ID', 'Study Phase', 'Study Status', 'Study Type',
            'MeSH Major Terms', 'Study Classification', 'Evidence Level', 'Medical Specialties',
            'Priority', 'Status', 'Notes', 'Tags', 'Date Added', 'Last Modified',
            'Has Clinical Trial', 'Publication Type', 'Source'
        ];
        
        const csvData = requests.map(request => [
            escapeCSV(request.title),
            escapeCSV(request.authors),
            escapeCSV(request.journal),
            request.year,
            request.doi,
            request.pmid,
            request.nctId,
            request.studyPhase,
            request.studyStatus,
            request.studyType,
            escapeCSV(request.meshMajorTerms),
            request.studyTypeClassification,
            request.evidenceLevel,
            escapeCSV(request.medicalSpecialties),
            request.priority,
            request.status,
            escapeCSV(request.notes),
            escapeCSV(request.tags),
            request.dateAdded,
            request.lastModified,
            request.hasLinkedClinicalTrial,
            request.publicationType,
            request.source
        ]);
        
        const csvContent = [headers, ...csvData]
            .map(row => row.join(','))
            .join('\n');
        
        downloadFile(`silentStacks_export_${timestamp}.csv`, csvContent, 'text/csv');
        
    } else if (format === 'json') {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.4.0',
            totalRequests: requests.length,
            requests: requests
        };
        
        downloadFile(
            `silentStacks_export_${timestamp}.json`, 
            JSON.stringify(exportData, null, 2), 
            'application/json'
        );
    }
    
    showSuccess(`Data exported successfully as ${format.toUpperCase()}`);
}

// Helper functions
function escapeCSV(str) {
    if (!str) return '';
    return `"${str.toString().replace(/"/g, '""')}"`;
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function showSuccess(message) {
    console.log('✅', message);
    // Integrate with existing status system if available
    if (window.setStatus) {
        window.setStatus(message, 'success');
    }
}

function showError(message) {
    console.error('❌', message);}

// Generate MeSH headings display for request cards
function generateMeshDisplay(request) {
    if (!request.majorMeshTerms || request.majorMeshTerms.length === 0) return '';
    
    const majorTerms = request.majorMeshTerms.slice(0, 3);
    const specialties = request.medicalSpecialties ? request.medicalSpecialties.slice(0, 2) : [];
    
    return `
        <div class="mesh-summary">
            <div class="mesh-summary-header">
                <strong>📚 MeSH Terms:</strong>
            </div>
            <div class="mesh-terms-compact">
                ${majorTerms.map(term => 
                    `<span class="mesh-term-compact major">${typeof term === 'string' ? term : term.term}</span>`
                ).join('')}
                ${request.majorMeshTerms.length > 3 ? 
                    `<span class="mesh-more-compact">+${request.majorMeshTerms.length - 3} more</span>` : ''
                }
            </div>
            ${specialties.length > 0 ? `
                <div class="specialties-compact">
                    ${specialties.map(specialty => 
                        `<span class="specialty-compact">${formatSpecialtyName(specialty)}</span>`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Generate study classification display for request cards
function generateStudyClassificationDisplay(request) {
    if (!request.studyTypeClassification && !request.evidenceLevel) return '';
    
    return `
        <div class="study-classification-summary">
            ${request.studyTypeClassification ? `
                <span class="study-type-compact ${request.studyTypeClassification}">
                    🔬 ${formatStudyTypeName(request.studyTypeClassification)}
                </span>
            ` : ''}
            ${request.evidenceLevel ? `
                <span class="evidence-level-compact ${request.evidenceLevel}">
                    📊 ${formatEvidenceLevelName(request.evidenceLevel)}
                </span>
            ` : ''}
        </div>
    `;
}

// Helper function to format specialty names
function formatSpecialtyName(specialty) {
    const specialtyNames = {
        'cardiology': 'Cardiology',
        'oncology': 'Oncology',
        'neurology': 'Neurology',
        'endocrinology': 'Endocrinology',
        'infectious-diseases': 'Infectious Diseases',
        'psychiatry': 'Psychiatry',
        'pediatrics': 'Pediatrics',
        'ob-gyn': 'OB/GYN',
        'surgery': 'Surgery',
        'emergency': 'Emergency Medicine',
        'radiology': 'Radiology',
        'pharmacology': 'Pharmacology'
    };
    
    return specialtyNames[specialty] || specialty.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to format study type names
function formatStudyTypeName(studyType) {
    const studyTypeNames = {
        'clinical-trial': 'Clinical Trial',
        'systematic-review': 'Systematic Review',
        'case-report': 'Case Report',
        'cohort-study': 'Cohort Study',
        'cross-sectional': 'Cross-Sectional',
        'case-control': 'Case-Control',
        'review': 'Review',
        'other': 'Other'
    };
    
    return studyTypeNames[studyType] || studyType;
}

// Helper function to format evidence level names  
function formatEvidenceLevelName(evidenceLevel) {
    const evidenceLevels = {
        'level-1': 'Level I',
        'level-2': 'Level II', 
        'level-3': 'Level III',
        'level-4': 'Level IV',
        'level-5': 'Level V',
        'level-6': 'Level VI',
        'level-7': 'Level VII'
    };
    
    return evidenceLevels[evidenceLevel] || evidenceLevel;
}// SilentStacks v1.4 Main Integration
// Updates to main.js for enhanced functionality

// Enhanced request data model
function createEnhancedRequest(data = {}) {
    return {
        id: data.id || generateId(),
        title: data.title || '',
        authors: data.authors || '',
        journal: data.journal || '',
        year: data.year || '',
        doi: data.doi || '',
        pmid: data.pmid || '',
        
        // Clinical trial fields (new in v1.4)
        nctId: data.nctId || '',
        studyPhase: data.studyPhase || '',
        studyStatus: data.studyStatus || '',
        studyType: data.studyType || '',
        
        // Enhanced metadata
        hasLinkedClinicalTrial: data.hasLinkedClinicalTrial || false,
        publicationType: data.publicationType || 'standard-publication',
        nctNumbers: data.nctNumbers || [],
        
        // Standard fields
        priority: data.priority || 'normal',
        status: data.status || 'pending',
        notes: data.notes || '',
        tags: data.tags || '',
        dateAdded: data.dateAdded || new Date().toISOString(),
        lastModified: data.lastModified || new Date().toISOString(),
        
        // Source tracking
        source: data.source || 'manual',
        sourceUrl: data.sourceUrl || ''
    };
}

// Enhanced form submission with validation
function enhancedSubmitRequest() {
    const formData = getEnhancedFormData();
    
    // Enhanced validation
    const validation = validateEnhancedRequest(formData);
    if (!validation.isValid) {
        showFormErrors(validation.errors);
        return;
    }

    // Create enhanced request object
    const request = createEnhancedRequest(formData);
    
    // Save request
    try {
        saveRequest(request);
        showSuccess('Request saved successfully');
        
        // Clear form and reset
        clearEnhancedForm();
        
        // Update displays
        displayRequests();
        updateStats();
        
        // Show the newly added request
        setTimeout(() => {
            const requestCard = document.querySelector(`[data-request-id="${request.id}"]`);
            if (requestCard) {
                requestCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                requestCard.style.backgroundColor = 'rgba(0, 102, 204, 0.1)';
                setTimeout(() => {
                    requestCard.style.backgroundColor = '';
                }, 2000);
            }
        }, 100);
        
    } catch (error) {
        console.error('Failed to save request:', error);
        showError('Failed to save request. Please try again.');
    }
}

// Enhanced form data collection
function getEnhancedFormData() {
    return {
        title: document.getElementById('title')?.value?.trim() || '',
        authors: document.getElementById('authors')?.value?.trim() || '',
        journal: document.getElementById('journal')?.value?.trim() || '',
        year: document.getElementById('year')?.value?.trim() || '',
        doi: document.getElementById('doi')?.value?.trim() || '',
        pmid: document.getElementById('pmid')?.value?.trim() || '',
        
        // Clinical trial fields
        nctId: document.getElementById('nctId')?.value?.trim() || '',
        studyPhase: document.getElementById('studyPhase')?.value || '',
        studyStatus: document.getElementById('studyStatus')?.value || '',
        studyType: document.getElementById('studyType')?.value || '',
        
        // MeSH and medical classification fields
        meshMajorTerms: document.getElementById('meshMajorTerms')?.value?.trim() || '',
        studyTypeClassification: document.getElementById('studyTypeClassification')?.value || '',
        evidenceLevel: document.getElementById('evidenceLevel')?.value || '',
        medicalSpecialties: document.getElementById('medicalSpecialties')?.value?.trim() || '',
        
        // Standard fields
        priority: document.getElementById('priority')?.value || 'normal',
        status: document.getElementById('status')?.value || 'pending',
        notes: document.getElementById('notes')?.value?.trim() || '',
        tags: document.getElementById('tags')?.value?.trim() || ''
    };
}

// Enhanced validation with clinical trial fields
function validateEnhancedRequest(data) {
    const errors = [];
    
    // Required field validation
    if (!data.title) {
        errors.push({ field: 'title', message: 'Title is required' });
    }
    
    // Format validations
    if (data.pmid && !/^\d{1,8}$/.test(data.pmid)) {
        errors.push({ field: 'pmid', message: 'PMID must be a numeric value (1-8 digits)' });
    }
    
    if (data.nctId && !/^NCT\d{8}$/i.test(data.nctId)) {
        errors.push({ field: 'nctId', message: 'NCT ID must be in format NCT12345678' });
    }
    
    if (data.year && !/^\d{4}$/.test(data.year)) {
        errors.push({ field: 'year', message: 'Year must be a 4-digit number' });
    }
    
    if (data.doi && data.doi.length > 0 && !/^10\.\d+\/.+$/i.test(data.doi)) {
        errors.push({ field: 'doi', message: 'DOI must be in format 10.xxxx/xxxxx' });
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Enhanced form clearing
function clearEnhancedForm() {
    const fields = [
        'title', 'authors', 'journal', 'year', 'doi', 'pmid',
        'nctId', 'studyPhase', 'studyStatus', 'studyType',
        'priority', 'status', 'notes', 'tags'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.classList.remove('auto-filled', 'error');
        }
    });
    
    // Reset priority select to normal
    const prioritySelect = document.getElementById('priority');
    if (prioritySelect) {
        prioritySelect.value = 'normal';
        prioritySelect.className = 'form-control priority-select priority-normal';
    }
    
    // Reset status to pending
    const statusSelect = document.getElementById('status');
    if (statusSelect) {
        statusSelect.value = 'pending';
    }
    
    // Clear lookup results
    const resultsContainer = document.getElementById('lookup-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    }
    
    const ctResultsContainer = document.getElementById('ct-search-results');
    if (ctResultsContainer) {
        ctResultsContainer.innerHTML = '';
    }
    
    // Clear lookup inputs
    const lookupInputs = ['pmid-lookup', 'nct-lookup', 'doi-lookup', 'ct-condition', 'ct-intervention'];
    lookupInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    });
    
    // Hide status messages
    const statusElement = document.getElementById('lookup-status');
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}

// Enhanced request display with clinical trial information
function displayEnhancedRequest(request) {
    const hasTrialInfo = request.nctId || request.hasLinkedClinicalTrial;
    const isTrialPublication = request.publicationType === 'clinical-trial-publication';
    const isTrialProtocol = request.publicationType === 'clinical-trial-protocol';
    
    return `
        <div class="request-card ${hasTrialInfo ? 'has-clinical-trial' : ''} ${request.priority !== 'normal' ? 'priority-' + request.priority : ''}" 
             data-request-id="${request.id}">
            
            <!-- Priority Indicator -->
            ${request.priority !== 'normal' ? `<div class="priority-indicator ${request.priority}"></div>` : ''}
            
            <div class="request-header">
                <div class="request-checkbox">
                    <input type="checkbox" id="select-${request.id}" onchange="toggleRequestSelection('${request.id}')">
                </div>
                
                <div class="request-main">
                    <div class="request-title-row">
                        <h3 class="request-title">${request.title}</h3>
                        
                        <!-- Enhanced badges -->
                        <div class="request-badges">
                            ${request.pmid ? `<span class="badge pmid-badge">PMID: ${request.pmid}</span>` : ''}
                            ${request.nctId ? `<span class="badge nct-badge">NCT: ${request.nctId}</span>` : ''}
                            ${hasTrialInfo ? `<span class="badge clinical-trial-badge">🧪 Clinical Trial</span>` : ''}
                            ${request.priority !== 'normal' ? `<span class="priority-badge ${request.priority}">${request.priority.toUpperCase()}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="request-meta">
                        ${request.authors ? `<span><strong>Authors:</strong> ${request.authors}</span>` : ''}
                        ${request.journal ? `<span><strong>Journal:</strong> ${request.journal}${request.year ? ` (${request.year})` : ''}</span>` : ''}
                        ${request.doi ? `<span><strong>DOI:</strong> ${request.doi}</span>` : ''}
                    </div>
                    
                    <!-- Clinical trial information -->
                    ${hasTrialInfo ? generateTrialInfoDisplay(request) : ''}
                    
                    <!-- MeSH headings and medical classification -->
                    ${request.majorMeshTerms && request.majorMeshTerms.length ? generateMeshDisplay(request) : ''}
                    
                    <!-- Study type and evidence level -->
                    ${request.studyTypeClassification || request.evidenceLevel ? generateStudyClassificationDisplay(request) : ''}
                    
                    <!-- Tags -->
                    ${request.tags ? `
                        <div class="request-tags">
                            ${request.tags.split(',').map(tag => 
                                `<span class="tag tag-colorable" onclick="toggleTagColor(this)">${tag.trim()}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Notes preview -->
                    ${request.notes ? `
                        <div class="request-notes">
                            <strong>Notes:</strong> ${truncateText(request.notes, 150)}
                        </div>
                    ` : ''}
                    
                    <div class="request-details">
                        <span class="request-date">Added: ${formatDate(request.dateAdded)}</span>
                        ${request.source && request.source !== 'manual' ? `<span class="request-source">Source: ${request.source}</span>` : ''}
                        ${request.sourceUrl ? `<a href="${request.sourceUrl}" target="_blank" class="source-link">🔗 View Source</a>` : ''}
                    </div>
                </div>
                
                <div class="request-status-container">
                    <select class="request-status-select status-${request.status}" 
                            onchange="updateRequestStatus('${request.id}', this.value)">
                        <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${request.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="fulfilled" ${request.status === 'fulfilled' ? 'selected' : ''}>Fulfilled</option>
                        <option value="cancelled" ${request.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
            
            <div class="request-actions">
                <button onclick="editRequest('${request.id}')" class="btn btn-secondary btn-small">
                    ✏️ Edit
                </button>
                <button onclick="duplicateRequest('${request.id}')" class="btn btn-secondary btn-small">
                    📋 Duplicate
                </button>
                <button onclick="deleteRequest('${request.id}')" class="btn btn-danger btn-small">
                    🗑️ Delete
                </button>
                ${request.nctId ? `
                    <button onclick="viewTrialDetails('${request.nctId}')" class="btn btn-info btn-small">
                        🧪 View Trial
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Generate clinical trial information display
function generateTrialInfoDisplay(request) {
    if (!request.nctId && !request.hasLinkedClinicalTrial) return '';
    
    return `
        <div class="clinical-trial-summary">
            <div class="trial-info-header">
                <strong>🧪 Clinical Trial Information</strong>
            </div>
            <div class="trial-info-details">
                ${request.nctId ? `<span><strong>NCT:</strong> ${request.nctId}</span>` : ''}
                ${request.studyPhase ? `<span><strong>Phase:</strong> ${formatStudyPhase(request.studyPhase)}</span>` : ''}
                ${request.studyStatus ? `<span><strong>Status:</strong> <span class="trial-status-badge status-${request.studyStatus.toLowerCase().replace(/[^a-z]/g, '-')}">${formatStudyStatus(request.studyStatus)}</span></span>` : ''}
                ${request.studyType ? `<span><strong>Type:</strong> ${request.studyType}</span>` : ''}
            </div>
        </div>
    `;
}

// Format study phase for display
function formatStudyPhase(phase) {
    const phaseMap = {
        'PHASE1': 'Phase I',
        'PHASE2': 'Phase II',
        'PHASE3': 'Phase III',
        'PHASE4': 'Phase IV',
        'NOT_APPLICABLE': 'Not Applicable'
    };
    return phaseMap[phase] || phase;
}

// Format study status for display
function formatStudyStatus(status) {
    const statusMap = {
        'RECRUITING': 'Recruiting',
        'NOT_YET_RECRUITING': 'Not Yet Recruiting',
        'ACTIVE_NOT_RECRUITING': 'Active, Not Recruiting',
        'COMPLETED': 'Completed',
        'TERMINATED': 'Terminated',
        'SUSPENDED': 'Suspended',
        'WITHDRAWN': 'Withdrawn'
    };
    return statusMap[status] || status;
}

// Enhanced statistics calculation
function calculateEnhancedStats() {
    const requests = loadRequests();
    
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        inProgress: requests.filter(r => r.status === 'in-progress').length,
        fulfilled: requests.filter(r => r.status === 'fulfilled').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length,
        
        // Clinical trial statistics
        clinicalTrials: requests.filter(r => r.nctId || r.hasLinkedClinicalTrial).length,
        trialPublications: requests.filter(r => r.publicationType === 'clinical-trial-publication').length,
        trialProtocols: requests.filter(r => r.publicationType === 'clinical-trial-protocol').length,
        
        // Priority statistics
        urgent: requests.filter(r => r.priority === 'urgent').length,
        rush: requests.filter(r => r.priority === 'rush').length,
        normal: requests.filter(r => r.priority === 'normal').length,
        
        // Source statistics
        pubmedSources: requests.filter(r => r.source === 'pubmed').length,
        manualEntries: requests.filter(r => r.source === 'manual').length,
        
        // Recent activity
        addedThisWeek: requests.filter(r => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(r.dateAdded) > weekAgo;
        }).length
    };
    
    return stats;
}

// Enhanced dashboard display
function displayEnhancedDashboard() {
    const stats = calculateEnhancedStats();
    const requests = loadRequests();
    
    // Sort requests by date for recent activity
    const recentRequests = requests
        .sort((a, b) => new Date(b.lastModified || b.dateAdded) - new Date(a.lastModified || a.dateAdded))
        .slice(0, 5);
    
    const dashboardHTML = `
        <div class="dashboard-container">
            <!-- Enhanced Statistics Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Requests</h3>
                    <div class="stat-number">${stats.total}</div>
                </div>
                
                <div class="stat-card">
                    <h3>Clinical Trials</h3>
                    <div class="stat-number">${stats.clinicalTrials}</div>
                </div>
                
                <div class="stat-card">
                    <h3>Completed</h3>
                    <div class="stat-number">${stats.fulfilled}</div>
                </div>
                
                <div class="stat-card">
                    <h3>In Progress</h3>
                    <div class="stat-number">${stats.inProgress}</div>
                </div>
                
                <div class="stat-card">
                    <h3>Added This Week</h3>
                    <div class="stat-number">${stats.addedThisWeek}</div>
                </div>
                
                <div class="stat-card">
                    <h3>Priority Items</h3>
                    <div class="stat-number">${stats.urgent + stats.rush}</div>
                </div>
            </div>
            
            <!-- Status Distribution Chart -->
            <div class="status-distribution">
                <h3>Status Distribution</h3>
                <div class="status-bars">
                    <div class="status-bar">
                        <label>Pending (${stats.pending})</label>
                        <div class="bar-container">
                            <div class="bar bar-pending" style="width: ${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%"></div>
                        </div>
                    </div>
                    <div class="status-bar">
                        <label>In Progress (${stats.inProgress})</label>
                        <div class="bar-container">
                            <div class="bar bar-in-progress" style="width: ${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%"></div>
                        </div>
                    </div>
                    <div class="status-bar">
                        <label>Fulfilled (${stats.fulfilled})</label>
                        <div class="bar-container">
                            <div class="bar bar-fulfilled" style="width: ${stats.total > 0 ? (stats.fulfilled / stats.total) * 100 : 0}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="recent-activity">
                <h3>Recent Activity</h3>
                <div class="recent-requests">
                    ${recentRequests.length > 0 ? 
                        recentRequests.map(request => `
                            <div class="recent-request-card ${request.nctId ? 'has-trial' : ''}">
                                <div class="recent-header">
                                    <h4 class="recent-title">${request.title}</h4>
                                    ${request.nctId ? '<span class="trial-indicator">🧪</span>' : ''}
                                </div>
                                <div class="recent-meta">
                                    ${request.journal ? `${request.journal}${request.year ? ` (${request.year})` : ''}` : 'No journal specified'}
                                </div>
                                <div class="recent-status-row">
                                    <span class="recent-status status-${request.status}">${request.status.replace('-', ' ')}</span>
                                    <span class="recent-date">${formatRelativeDate(request.lastModified || request.dateAdded)}</span>
                                </div>
                            </div>
                        `).join('') 
                        : '<p class="no-recent">No recent activity</p>'
                    }
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="quick-actions">
                <h3>Quick Actions</h3>
                <div class="action-buttons">
                    <button onclick="showSection('add-request')" class="btn btn-primary">
                        ➕ Add New Request
                    </button>
                    <button onclick="showSection('all-requests')" class="btn btn-secondary">
                        📋 View All Requests
                    </button>
                    <button onclick="exportData('json')" class="btn btn-secondary">
                        💾 Export Data
                    </button>
                    <button onclick="showBulkActions()" class="btn btn-secondary">
                        ⚡ Bulk Actions
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
        dashboardSection.innerHTML = dashboardHTML;
    }
}

// Enhanced export functionality with clinical trial data
function exportEnhancedData(format) {
    const requests = loadRequests();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    if (format === 'csv') {
        const headers = [
            'Title', 'Authors', 'Journal', 'Year', 'DOI', 'PMID',
            'NCT ID', 'Study Phase', 'Study Status', 'Study Type',
            'Priority', 'Status', 'Notes', 'Tags', 'Date Added', 'Last Modified',
            'Has Clinical Trial', 'Publication Type', 'Source'
        ];
        
        const csvData = requests.map(request => [
            escapeCSV(request.title),
            escapeCSV(request.authors),
            escapeCSV(request.journal),
            request.year,
            request.doi,
            request.pmid,
            request.nctId,
            request.studyPhase,
            request.studyStatus,
            request.studyType,
            request.priority,
            request.status,
            escapeCSV(request.notes),
            escapeCSV(request.tags),
            request.dateAdded,
            request.lastModified,
            request.hasLinkedClinicalTrial,
            request.publicationType,
            request.source
        ]);
        
        const csvContent = [headers, ...csvData]
            .map(row => row.join(','))
            .join('\n');
        
        downloadFile(`silentStacks_export_${timestamp}.csv`, csvContent, 'text/csv');
        
    } else if (format === 'json') {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.4.0',
            totalRequests: requests.length,
            requests: requests
        };
        
        downloadFile(
            `silentStacks_export_${timestamp}.json`, 
            JSON.stringify(exportData, null, 2), 
            'application/json'
        );
    }
    
    showSuccess(`Data exported successfully as ${format.toUpperCase()}`);
}

// Enhanced search functionality
function enhancedSearch(query) {
    if (!query.trim()) {
        displayRequests();
        return;
    }
    
    const requests = loadRequests();
    const searchTerms = query.toLowerCase().split(' ');
    
    const filteredRequests = requests.filter(request => {
        const searchableText = [
            request.title,
            request.authors,
            request.journal,
            request.notes,
            request.tags,
            request.nctId,
            request.pmid,
            request.doi,
            request.studyStatus,
            request.studyType
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
    });
    
    displayFilteredRequests(filteredRequests);
    
    // Update search results count
    const resultsCount = document.getElementById('search-results-count');
    if (resultsCount) {
        resultsCount.textContent = `Found ${filteredRequests.length} of ${requests.length} requests`;
    }
}

// View trial details function
function viewTrialDetails(nctId) {
    if (nctId) {
        const url = `https://clinicaltrials.gov/study/${nctId}`;
        window.open(url, '_blank');
    }
}

// Enhanced error handling
function showFormErrors(errors) {
    // Clear previous errors
    document.querySelectorAll('.form-control.error').forEach(field => {
        field.classList.remove('error');
    });
    
    // Show new errors
    errors.forEach(error => {
        const field = document.getElementById(error.field);
        if (field) {
            field.classList.add('error');
            
            // Create or update error message
            let errorElement = field.parentNode.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = error.message;
        }
    });
    
    // Scroll to first error
    const firstError = document.querySelector('.form-control.error');
    if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
    }
}

// Utility functions
function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(dateString);
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Initialize enhanced functionality
document.addEventListener('DOMContentLoaded', function() {
    // Load cached data
    if (window.SilentStacksAPI) {
        window.SilentStacksAPI.CacheManager.loadCache();
        window.SilentStacksAPI.APIQueue.loadQueue();
    }
    
    // Initialize enhanced dashboard
    if (document.getElementById('dashboard')) {
        displayEnhancedDashboard();
    }
    
    // Set up enhanced form validation
    const form = document.querySelector('.request-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            enhancedSubmitRequest();
        });
    }
    
    // Set up enhanced search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                enhancedSearch(e.target.value);
            }, 300);
        });
    }
    
    // Process queued API requests if online
    if (window.SilentStacksAPI && window.SilentStacksAPI.connectionManager.isOnline()) {
        setTimeout(() => {
            window.SilentStacksAPI.APIQueue.processAll().then(results => {
                if (results && results.length > 0) {
                    console.log(`Processed ${results.length} queued API requests`);
                }
            });
        }, 2000);
    }
});
