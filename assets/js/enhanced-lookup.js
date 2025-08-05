// Enhanced Lookup Interface for SilentStacks v1.4 - Modular Architecture
// File: assets/js/enhanced-lookup.js

// Enhanced Lookup UI Module
window.SilentStacksLookup = (() => {
    'use strict';

    class LookupInterface {
        constructor() {
            this.currentLookupData = null;
            this.setupEventListeners();
            this.setupConnectionStatusMonitoring();
        }

        setupEventListeners() {
            // Enhanced PMID lookup
            const pmidLookupBtn = document.getElementById('lookup-pmid');
            const pmidInput = document.getElementById('pmid');
            
            if (pmidLookupBtn) {
                pmidLookupBtn.addEventListener('click', () => this.performPMIDLookup());
            }
            
            if (pmidInput) {
                pmidInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performPMIDLookup();
                    }
                });
            }

            // DOI lookup
            const doiLookupBtn = document.getElementById('lookup-doi');
            const doiInput = document.getElementById('doi');
            
            if (doiLookupBtn) {
                doiLookupBtn.addEventListener('click', () => this.performDOILookup());
            }
            
            if (doiInput) {
                doiInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performDOILookup();
                    }
                });
            }

            // Clinical trials search
            const searchTrialsBtn = document.getElementById('search-trials-btn');
            if (searchTrialsBtn) {
                searchTrialsBtn.addEventListener('click', () => this.searchClinicalTrials());
            }

            // NCT direct lookup
            const nctLookupBtn = document.getElementById('nct-lookup-btn');
            const nctInput = document.getElementById('nct-lookup');
            
            if (nctLookupBtn) {
                nctLookupBtn.addEventListener('click', () => this.performNCTLookup());
            }
            
            if (nctInput) {
                nctInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.performNCTLookup();
                    }
                });
            }
        }

        setupConnectionStatusMonitoring() {
            if (window.SilentStacksAPI) {
                window.SilentStacksAPI.connectionManager.addListener((status) => {
                    this.updateConnectionStatus(status);
                });
                
                // Initial status
                this.updateConnectionStatus(
                    window.SilentStacksAPI.connectionManager.isOnline() ? 'online' : 'offline'
                );
            }
        }

        updateConnectionStatus(status) {
            const statusElement = document.getElementById('connection-status');
            if (!statusElement) return;

            statusElement.className = 'connection-indicator';
            
            if (status === 'online') {
                statusElement.classList.add('connection-clean');
                statusElement.textContent = 'Online';
            } else {
                statusElement.classList.add('offline');
                statusElement.textContent = 'Offline';
            }
        }

        async performPMIDLookup() {
            const input = document.getElementById('pmid');
            if (!input) return;

            const pmid = input.value.trim();
            if (!pmid) {
                this.setStatus('Please enter a PMID', 'error');
                return;
            }
            
            if (!/^\d+$/.test(pmid)) {
                this.setStatus('PMID must be numeric', 'error');
                return;
            }

            this.setStatus('Looking up PMID...', 'loading');
            this.setLookupButtonState(true, 'pmid');

            try {
                const data = await window.SilentStacksAPI.EnhancedLookup.lookupPubMedWithTrials(pmid);
                this.currentLookupData = data;
                
                // Populate form immediately
                this.populateFormWithData(data);
                
                // Show enhanced results
                this.displayEnhancedResults(data);
                
                if (data.title && data.title.includes('[QUEUED]')) {
                    this.setStatus('Request queued for when online. Placeholder data populated.', 'loading');
                } else if (data.hasLinkedClinicalTrial) {
                    this.setStatus(`✅ Success! Found publication with clinical trial: ${data.primaryNCT}`, 'success');
                } else {
                    this.setStatus('✅ PMID lookup successful!', 'success');
                }
                
            } catch (error) {
                console.error('PMID lookup failed:', error);
                this.setStatus(`PMID lookup failed: ${error.message}`, 'error');
            } finally {
                this.setLookupButtonState(false, 'pmid');
            }
        }

        async performDOILookup() {
            const input = document.getElementById('doi');
            if (!input) return;

            const doi = input.value.trim();
            if (!doi) {
                this.setStatus('Please enter a DOI', 'error');
                return;
            }

            this.setStatus('Looking up DOI...', 'loading');
            this.setLookupButtonState(true, 'doi');

            try {
                const data = await window.SilentStacksAPI.EnhancedLookup.lookupDOI(doi);
                this.currentLookupData = data;
                
                // Populate form immediately
                this.populateFormWithData(data);
                
                // Show results
                this.displayEnhancedResults(data);
                
                if (data.title && data.title.includes('[QUEUED]')) {
                    this.setStatus('Request queued for when online. Placeholder data populated.', 'loading');
                } else {
                    this.setStatus('✅ DOI lookup successful!', 'success');
                }
                
            } catch (error) {
                console.error('DOI lookup failed:', error);
                this.setStatus(`DOI lookup failed: ${error.message}`, 'error');
            } finally {
                this.setLookupButtonState(false, 'doi');
            }
        }

        async performNCTLookup() {
            const input = document.getElementById('nct-lookup');
            if (!input) return;

            const nctId = input.value.trim();
            if (!nctId) {
                this.setStatus('Please enter an NCT number', 'error');
                return;
            }
            
            if (!/^NCT\d{8}$/i.test(nctId)) {
                this.setStatus('NCT number must be in format NCT12345678', 'error');
                return;
            }

            this.setStatus('Looking up clinical trial...', 'loading');
            this.setLookupButtonState(true, 'nct');

            try {
                const data = await window.SilentStacksAPI.EnhancedLookup.lookupClinicalTrial(nctId.toUpperCase());
                this.currentLookupData = data;
                
                // Populate form immediately
                this.populateFormWithData(data);
                
                // Show results
                this.displayEnhancedResults(data);
                this.setStatus('✅ Clinical trial lookup successful!', 'success');
                
            } catch (error) {
                console.error('NCT lookup failed:', error);
                
                if (error.message.includes('queued')) {
                    this.setStatus('Offline - request queued for when connection returns', 'warning');
                } else {
                    this.setStatus(`Clinical trial lookup failed: ${error.message}`, 'error');
                }
            } finally {
                this.setLookupButtonState(false, 'nct');
            }
        }

        displayEnhancedResults(data) {
            const resultsContainer = document.getElementById('lookup-results');
            if (!resultsContainer) return;

            const html = this.generateResultHTML(data);
            resultsContainer.innerHTML = html;
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        generateResultHTML(data) {
            const hasTrialData = data.clinicalTrial || data.hasLinkedClinicalTrial;
            const isTrialProtocol = data.publicationType === 'clinical-trial-protocol';
            
            return `
                <div class="lookup-result-card ${hasTrialData ? 'has-clinical-trial' : ''}">
                    <div class="result-header">
                        <h4>${data.title || data.briefTitle || 'No title available'}</h4>
                        <div class="result-badges">
                            ${data.pmid ? `<span class="badge pmid-badge">PMID: ${data.pmid}</span>` : ''}
                            ${data.nctId ? `<span class="badge nct-badge">NCT: ${data.nctId}</span>` : ''}
                            ${hasTrialData ? `<span class="badge clinical-trial-badge">🧪 Clinical Trial</span>` : ''}
                            ${data.doi ? `<span class="badge doi-badge">DOI</span>` : ''}
                            ${data.evidenceLevel ? `<span class="badge evidence-badge">${this.formatEvidenceLevel(data.evidenceLevel)}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="result-details">
                        ${this.generatePublicationDetails(data)}
                        ${hasTrialData ? this.generateClinicalTrialDetails(data) : ''}
                    </div>
                    
                    <div class="result-actions">
                        <button onclick="lookupInterface.populateForm()" class="btn btn-primary">
                            📋 Populate Form
                        </button>
                        <button onclick="lookupInterface.copyTitle()" class="btn btn-secondary btn-small">
                            📋 Copy Title
                        </button>
                        ${data.sourceUrl ? `
                            <button onclick="window.open('${data.sourceUrl}', '_blank')" class="btn btn-secondary btn-small">
                                🔗 View Source
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        generatePublicationDetails(data) {
            if (data.publicationType === 'clinical-trial-protocol') {
                return `
                    <div class="publication-info">
                        <p><strong>Protocol Title:</strong> ${data.briefTitle || 'N/A'}</p>
                        ${data.officialTitle && data.officialTitle !== data.briefTitle ? 
                            `<p><strong>Official Title:</strong> ${data.officialTitle}</p>` : ''
                        }
                        <p><strong>Lead Sponsor:</strong> ${data.leadSponsor || 'N/A'}</p>
                        <p><strong>Registry:</strong> ClinicalTrials.gov</p>
                    </div>
                `;
            }

            return `
                <div class="publication-info">
                    ${data.authors ? `<p><strong>Authors:</strong> ${data.authors}</p>` : ''}
                    ${data.journal ? `<p><strong>Journal:</strong> ${data.journal}${data.year ? ` (${data.year})` : ''}</p>` : ''}
                    ${data.doi ? `<p><strong>DOI:</strong> ${data.doi}</p>` : ''}
                    
                    ${this.generateMeshDisplay(data)}
                    ${this.generateStudyTypeDisplay(data)}
                    
                    ${data.abstract ? `
                        <div class="abstract-section">
                            <p><strong>Abstract:</strong></p>
                            <div class="abstract-text">${this.truncateText(data.abstract, 300)}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        generateMeshDisplay(data) {
            if (!data.meshHeadings || data.meshHeadings.length === 0) return '';
            
            const majorTerms = data.majorMeshTerms || data.meshHeadings.filter(mesh => mesh.isMajorTopic);
            const minorTerms = data.meshHeadings.filter(mesh => !mesh.isMajorTopic);
            
            return `
                <div class="mesh-section">
                    <p><strong>📚 Medical Subject Headings (MeSH):</strong></p>
                    
                    ${majorTerms.length > 0 ? `
                        <div class="mesh-terms major-mesh">
                            <span class="mesh-label">Major Topics:</span>
                            ${majorTerms.slice(0, 5).map(mesh => 
                                `<span class="mesh-term major-term" title="${mesh.ui || ''}">${mesh.term || mesh}</span>`
                            ).join('')}
                            ${majorTerms.length > 5 ? `<span class="mesh-more">+${majorTerms.length - 5} more</span>` : ''}
                        </div>
                    ` : ''}
                    
                    ${minorTerms.length > 0 ? `
                        <div class="mesh-terms minor-mesh">
                            <span class="mesh-label">Minor Topics:</span>
                            ${minorTerms.slice(0, 3).map(mesh => 
                                `<span class="mesh-term minor-term" title="${mesh.ui || ''}">${mesh.term || mesh}</span>`
                            ).join('')}
                            ${minorTerms.length > 3 ? `<span class="mesh-more">+${minorTerms.length - 3} more</span>` : ''}
                        </div>
                    ` : ''}
                    
                    ${data.medicalSpecialties && data.medicalSpecialties.length > 0 ? `
                        <div class="medical-specialties">
                            <span class="mesh-label">Medical Specialties:</span>
                            ${data.medicalSpecialties.map(specialty => 
                                `<span class="specialty-badge">${this.formatSpecialty(specialty)}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        generateStudyTypeDisplay(data) {
            if (!data.studyType && !data.evidenceLevel) return '';
            
            return `
                <div class="study-classification">
                    ${data.studyType ? `
                        <p><strong>🔬 Study Type:</strong> 
                            <span class="study-type-badge ${data.studyType}">${this.formatStudyType(data.studyType)}</span>
                        </p>
                    ` : ''}
                    
                    ${data.evidenceLevel ? `
                        <p><strong>📊 Evidence Level:</strong> 
                            <span class="evidence-level-badge ${data.evidenceLevel}">${this.formatEvidenceLevel(data.evidenceLevel)}</span>
                        </p>
                    ` : ''}
                </div>
            `;
        }

        generateClinicalTrialDetails(data) {
            const trial = data.clinicalTrial || data;
            
            return `
                <div class="clinical-trial-info">
                    <h5>🧪 Clinical Trial Information</h5>
                    <div class="trial-details">
                        ${trial.nctId ? `<p><strong>NCT Number:</strong> ${trial.nctId}</p>` : ''}
                        ${trial.briefTitle && trial.briefTitle !== data.title ? 
                            `<p><strong>Study Title:</strong> ${trial.briefTitle}</p>` : ''
                        }
                        ${trial.overallStatus ? `
                            <p><strong>Status:</strong> 
                                <span class="status-badge status-${trial.overallStatus.toLowerCase().replace(/[^a-z]/g, '-')}">
                                    ${this.formatStatus(trial.overallStatus)}
                                </span>
                            </p>
                        ` : ''}
                        ${trial.phases && trial.phases.length ? 
                            `<p><strong>Phase:</strong> ${trial.phases.join(', ')}</p>` : ''
                        }
                        ${trial.studyType ? `<p><strong>Type:</strong> ${trial.studyType}</p>` : ''}
                        ${trial.conditions && trial.conditions.length ? 
                            `<p><strong>Conditions:</strong> ${trial.conditions.join(', ')}</p>` : ''
                        }
                        ${trial.interventions && trial.interventions.length ? 
                            `<p><strong>Interventions:</strong> ${this.formatInterventions(trial.interventions)}</p>` : ''
                        }
                        ${trial.startDate ? `<p><strong>Start Date:</strong> ${this.formatDate(trial.startDate)}</p>` : ''}
                        ${trial.completionDate ? `<p><strong>Completion:</strong> ${this.formatDate(trial.completionDate)}</p>` : ''}
                    </div>
                    
                    ${data.nctNumbers && data.nctNumbers.length > 1 ? `
                        <div class="multiple-trials">
                            <p><strong>Related Trials:</strong> ${data.nctNumbers.join(', ')}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        populateFormWithData(data) {
            // Use the existing form population logic from production app.js
            if (window.populateForm) {
                // Map our enhanced data to the expected format
                const mappedData = {
                    pmid: data.pmid || '',
                    doi: data.doi || '',
                    title: data.title || data.briefTitle || '',
                    authors: data.authors || data.leadSponsor || '',
                    journal: data.journal || 'ClinicalTrials.gov',
                    year: data.year || this.extractYearFromDate(data.startDate),
                    status: 'pending',
                    priority: 'normal',
                    tags: [],
                    notes: this.generateNotesFromData(data)
                };

                window.populateForm(mappedData);
                
                // Additional MeSH and clinical trial fields if they exist
                this.setFormField('meshMajorTerms', this.formatMeshTerms(data.majorMeshTerms));
                this.setFormField('studyTypeClassification', data.studyType || '');
                this.setFormField('evidenceLevel', data.evidenceLevel || '');
                this.setFormField('medicalSpecialties', this.formatSpecialties(data.medicalSpecialties));
                
                if (data.clinicalTrial || data.nctId) {
                    const trial = data.clinicalTrial || data;
                    this.setFormField('nctId', trial.nctId || data.nctId || '');
                    this.setFormField('studyPhase', this.getFirstPhase(trial.phases));
                    this.setFormField('studyStatus', trial.overallStatus || '');
                    this.setFormField('studyType', trial.studyType || '');
                }
                
                this.highlightAutoFilledFields();
            }
        }

        populateForm() {
            if (this.currentLookupData) {
                this.populateFormWithData(this.currentLookupData);
                this.setStatus('✅ Form populated with lookup data', 'success');
                
                // Scroll to form
                const form = document.querySelector('.request-form, #request-form');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }

        // Utility methods
        setFormField(fieldId, value) {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
                field.classList.add('auto-filled');
                
                // Trigger change event for any listeners
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        formatMeshTerms(meshTerms) {
            if (!meshTerms || !Array.isArray(meshTerms)) return '';
            return meshTerms.map(term => 
                typeof term === 'string' ? term : term.term
            ).join(', ');
        }

        formatSpecialties(specialties) {
            if (!specialties || !Array.isArray(specialties)) return '';
            return specialties.map(specialty => 
                this.formatSpecialty(specialty)
            ).join(', ');
        }

        formatSpecialty(specialty) {
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

        formatStudyType(studyType) {
            const studyTypeNames = {
                'clinical-trial': 'Clinical Trial',
                'systematic-review': 'Systematic Review',
                'case-report': 'Case Report',
                'cohort-study': 'Cohort Study',
                'cross-sectional': 'Cross-Sectional Study',
                'case-control': 'Case-Control Study',
                'review': 'Review Article',
                'other': 'Other'
            };
            
            return studyTypeNames[studyType] || studyType;
        }

        formatEvidenceLevel(evidenceLevel) {
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

        formatStatus(status) {
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

        formatInterventions(interventions) {
            if (Array.isArray(interventions) && interventions.length > 0) {
                return interventions.map(intervention => {
                    if (typeof intervention === 'string') {
                        return intervention;
                    } else if (intervention.name) {
                        return intervention.name;
                    }
                    return '';
                }).filter(name => name).join(', ');
            }
            return 'N/A';
        }

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch {
                return dateString;
            }
        }

        getFirstPhase(phases) {
            if (!phases || !Array.isArray(phases) || phases.length === 0) return '';
            
            const phaseMap = {
                'PHASE1': 'PHASE1',
                'PHASE2': 'PHASE2', 
                'PHASE3': 'PHASE3',
                'PHASE4': 'PHASE4',
                'NOT_APPLICABLE': 'NOT_APPLICABLE'
            };
            
            return phaseMap[phases[0]] || phases[0];
        }

        extractYearFromDate(dateString) {
            if (!dateString) return '';
            
            try {
                const year = dateString.split('-')[0];
                return year && year.length === 4 ? year : '';
            } catch {
                return '';
            }
        }

        generateNotesFromData(data) {
            const notes = [];
            
            if (data.clinicalTrial) {
                notes.push(`Clinical Trial: ${data.clinicalTrial.nctId} - ${data.clinicalTrial.briefTitle}`);
                notes.push(`Status: ${data.clinicalTrial.overallStatus}`);
                
                if (data.clinicalTrial.conditions && data.clinicalTrial.conditions.length) {
                    notes.push(`Conditions: ${data.clinicalTrial.conditions.join(', ')}`);
                }
                
                if (data.clinicalTrial.interventions && data.clinicalTrial.interventions.length) {
                    const interventionNames = this.formatInterventions(data.clinicalTrial.interventions);
                    notes.push(`Interventions: ${interventionNames}`);
                }
            } else if (data.nctId) {
                notes.push(`Clinical Trial Protocol: ${data.nctId}`);
                if (data.overallStatus) {
                    notes.push(`Status: ${data.overallStatus}`);
                }
            }

            if (data.majorMeshTerms && data.majorMeshTerms.length > 0) {
                const meshTerms = this.formatMeshTerms(data.majorMeshTerms);
                notes.push(`MeSH Major Topics: ${meshTerms}`);
            }

            if (data.medicalSpecialties && data.medicalSpecialties.length > 0) {
                notes.push(`Medical Specialties: ${this.formatSpecialties(data.medicalSpecialties)}`);
            }

            if (data.studyType) {
                notes.push(`Study Type: ${this.formatStudyType(data.studyType)}`);
            }

            if (data.evidenceLevel) {
                notes.push(`Evidence Level: ${this.formatEvidenceLevel(data.evidenceLevel)}`);
            }
            
            if (data.abstract && !data.abstract.includes('[QUEUED]')) {
                notes.push('');
                notes.push('Abstract:');
                notes.push(data.abstract);
            }
            
            return notes.join('\n');
        }

        highlightAutoFilledFields() {
            setTimeout(() => {
                const autoFilledFields = document.querySelectorAll('.auto-filled');
                autoFilledFields.forEach(field => {
                    field.style.backgroundColor = 'rgba(23, 162, 184, 0.1)';
                    field.style.borderColor = '#17a2b8';
                    
                    // Remove highlighting after 3 seconds
                    setTimeout(() => {
                        field.style.backgroundColor = '';
                        field.style.borderColor = '';
                        field.classList.remove('auto-filled');
                    }, 3000);
                });
            }, 100);
        }

        truncateText(text, maxLength) {
            if (!text || text.length <= maxLength) return text;
            
            const truncated = text.substring(0, maxLength);
            const lastSpace = truncated.lastIndexOf(' ');
            
            if (lastSpace > maxLength * 0.8) {
                return truncated.substring(0, lastSpace) + '...';
            }
            
            return truncated + '...';
        }

        copyTitle() {
            if (!this.currentLookupData) return;
            
            const title = this.currentLookupData.title || this.currentLookupData.briefTitle || '';
            if (title) {
                navigator.clipboard.writeText(title).then(() => {
                    this.setStatus('✅ Title copied to clipboard', 'success');
                }).catch(() => {
                    this.setStatus('❌ Failed to copy title', 'error');
                });
            }
        }

        setStatus(message, type = '') {
            const statusElement = document.getElementById('lookup-status');
            if (!statusElement) return;

            statusElement.className = `lookup-status ${type}`;
            statusElement.textContent = message;
            statusElement.style.display = 'block';

            // Auto-hide success and error messages
            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 5000);
            }
        }

        setLookupButtonState(loading, type) {
            const buttonMap = {
                'pmid': 'lookup-pmid',
                'doi': 'lookup-doi',
                'nct': 'nct-lookup-btn'
            };

            const button = document.getElementById(buttonMap[type]);
            if (!button) return;

            if (loading) {
                button.disabled = true;
                button.innerHTML = '<span class="spinner"></span> Looking up...';
            } else {
                button.disabled = false;
                const iconMap = {
                    'pmid': '🔍 Lookup PMID',
                    'doi': '🔍 Lookup DOI', 
                    'nct': '🔍 Lookup NCT'
                };
                button.innerHTML = iconMap[type] || '🔍 Lookup';
            }
        }

        async searchClinicalTrials() {
            const condition = document.getElementById('ct-condition')?.value?.trim() || '';
            const intervention = document.getElementById('ct-intervention')?.value?.trim() || '';
            const status = document.getElementById('ct-status')?.value || '';

            if (!condition && !intervention) {
                this.setStatus('Please enter a condition or intervention to search', 'error');
                return;
            }

            this.setStatus('Searching clinical trials...', 'loading');

            try {
                const searchParams = {
                    condition,
                    intervention,
                    status,
                    pageSize: 20
                };

                const results = await window.SilentStacksAPI.ClinicalTrialsAPI.searchStudies(searchParams);
                this.displayTrialSearchResults(results);
                this.setStatus(`✅ Found ${results.totalCount} clinical trials`, 'success');
            } catch (error) {
                console.error('Clinical trials search failed:', error);
                this.setStatus(`Search failed: ${error.message}`, 'error');
            }
        }

        displayTrialSearchResults(results) {
            const resultsContainer = document.getElementById('ct-search-results');
            if (!resultsContainer) return;

            if (!results.studies || results.studies.length === 0) {
                resultsContainer.innerHTML = '<p class="no-results">No clinical trials found matching your criteria.</p>';
                return;
            }

            const html = `
                <div class="search-results-header">
                    <h4>Clinical Trials Search Results</h4>
                    <p class="results-count">Showing ${results.studies.length} of ${results.totalCount} results</p>
                </div>
                <div class="trials-list">
                    ${results.studies.map(trial => this.generateTrialSearchResultHTML(trial)).join('')}
                </div>
            `;

            resultsContainer.innerHTML = html;
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        generateTrialSearchResultHTML(trial) {
            return `
                <div class="trial-search-result">
                    <div class="trial-header">
                        <h5>${trial.briefTitle}</h5>
                        <span class="trial-nct">${trial.nctId}</span>
                    </div>
                    <div class="trial-meta">
                        <span class="trial-status status-${trial.overallStatus.toLowerCase().replace(/[^a-z]/g, '-')}">
                            ${this.formatStatus(trial.overallStatus)}
                        </span>
                        ${trial.phases && trial.phases.length ? 
                            `<span class="trial-phase">${trial.phases.join(', ')}</span>` : ''
                        }
                        <span class="trial-type">${trial.studyType}</span>
                    </div>
                    ${trial.conditions && trial.conditions.length ? 
                        `<p class="trial-conditions"><strong>Conditions:</strong> ${trial.conditions.join(', ')}</p>` : ''
                    }
                    <div class="trial-actions">
                        <button onclick="lookupInterface.addTrialToForm('${trial.nctId}')" class="btn btn-primary btn-small">
                            📋 Add to Form
                        </button>
                        <button onclick="lookupInterface.viewTrialDetails('${trial.nctId}')" class="btn btn-secondary btn-small">
                            👁️ View Details
                        </button>
                    </div>
                </div>
            `;
        }

        async addTrialToForm(nctId) {
            this.setStatus('Loading trial details...', 'loading');

            try {
                const trialData = await window.SilentStacksAPI.ClinicalTrialsAPI.getStudyDetails(nctId);
                this.populateFormWithData(trialData);
                this.setStatus('✅ Trial data added to form', 'success');
                
                // Scroll to form
                const form = document.querySelector('.request-form, #request-form');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (error) {
                console.error('Failed to add trial to form:', error);
                this.setStatus(`Failed to load trial: ${error.message}`, 'error');
            }
        }

        viewTrialDetails(nctId) {
            const url = `https://clinicaltrials.gov/study/${nctId}`;
            window.open(url, '_blank');
        }
    }

    // Initialize the lookup interface
    const lookupInterface = new LookupInterface();

    // Public API
    return {
        lookupInterface,
        
        // Legacy compatibility functions for global access
        performPMIDLookup: () => lookupInterface.performPMIDLookup(),
        performDOILookup: () => lookupInterface.performDOILookup(),
        performNCTLookup: () => lookupInterface.performNCTLookup(),
        searchClinicalTrials: () => lookupInterface.searchClinicalTrials(),
        addTrialToForm: (nctId) => lookupInterface.addTrialToForm(nctId),
        viewTrialDetails: (nctId) => lookupInterface.viewTrialDetails(nctId)
    };
})();

// Make the lookup interface globally available for backward compatibility
window.lookupInterface = window.SilentStacksLookup.lookupInterface;
                // Enhanced Lookup Interface for SilentStacks v1.4
// File: assets/js/enhanced-lookup.js

class LookupInterface {
    constructor() {
        this.currentLookupData = null;
        this.setupEventListeners();
        this.setupConnectionStatusMonitoring();
    }

    setupEventListeners() {
        // Enhanced PMID lookup
        const pmidLookupBtn = document.getElementById('pmid-lookup-btn');
        const pmidInput = document.getElementById('pmid-lookup');
        
        if (pmidLookupBtn) {
            pmidLookupBtn.addEventListener('click', () => this.performEnhancedLookup('pmid'));
        }
        
        if (pmidInput) {
            pmidInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performEnhancedLookup('pmid');
                }
            });
        }

        // NCT lookup
        const nctLookupBtn = document.getElementById('nct-lookup-btn');
        const nctInput = document.getElementById('nct-lookup');
        
        if (nctLookupBtn) {
            nctLookupBtn.addEventListener('click', () => this.performEnhancedLookup('nct'));
        }
        
        if (nctInput) {
            nctInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performEnhancedLookup('nct');
                }
            });
        }

        // Clinical trials search
        const searchTrialsBtn = document.getElementById('search-trials-btn');
        if (searchTrialsBtn) {
            searchTrialsBtn.addEventListener('click', () => this.searchClinicalTrials());
        }

        // DOI lookup
        const doiLookupBtn = document.getElementById('doi-lookup-btn');
        const doiInput = document.getElementById('doi-lookup');
        
        if (doiLookupBtn) {
            doiLookupBtn.addEventListener('click', () => this.performEnhancedLookup('doi'));
        }
        
        if (doiInput) {
            doiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performEnhancedLookup('doi');
                }
            });
        }
    }

    setupConnectionStatusMonitoring() {
        if (window.SilentStacksAPI) {
            window.SilentStacksAPI.connectionManager.addListener((status) => {
                this.updateConnectionStatus(status);
            });
            
            // Initial status
            this.updateConnectionStatus(
                window.SilentStacksAPI.connectionManager.isOnline() ? 'online' : 'offline'
            );
        }
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connection-status');
        if (!statusElement) return;

        statusElement.className = 'connection-indicator';
        
        if (status === 'online') {
            statusElement.classList.add('connection-clean');
            statusElement.textContent = 'Online';
        } else {
            statusElement.classList.add('offline');
            statusElement.textContent = 'Offline';
        }
    }

    async performEnhancedLookup(type) {
        const inputMap = {
            'pmid': 'pmid-lookup',
            'nct': 'nct-lookup',
            'doi': 'doi-lookup'
        };

        const input = document.getElementById(inputMap[type]);
        if (!input) return;

        const identifier = input.value.trim();
        if (!identifier) {
            this.showLookupStatus('error', 'Please enter a valid identifier');
            return;
        }

        this.showLookupStatus('loading', 'Looking up information...');
        this.setLookupButtonState(true, type);

        try {
            const data = await window.SilentStacksAPI.EnhancedLookup.performLookup(identifier);
            this.currentLookupData = data;
            this.displayEnhancedResults(data);
            this.showLookupStatus('success', 'Information retrieved successfully');
        } catch (error) {
            console.error('Lookup failed:', error);
            
            if (error.message.includes('queued')) {
                this.showLookupStatus('warning', 'Offline - request queued for when connection returns');
            } else {
                this.showLookupStatus('error', `Lookup failed: ${error.message}`);
            }
        } finally {
            this.setLookupButtonState(false, type);
        }
    }

    displayEnhancedResults(data) {
        const resultsContainer = document.getElementById('lookup-results');
        if (!resultsContainer) return;

        const html = this.generateResultHTML(data);
        resultsContainer.innerHTML = html;
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    generateResultHTML(data) {
        const hasTrialData = data.clinicalTrial || data.hasLinkedClinicalTrial;
        const isTrialProtocol = data.publicationType === 'clinical-trial-protocol';
        
        return `
            <div class="lookup-result-card ${hasTrialData ? 'has-clinical-trial' : ''}">
                <div class="result-header">
                    <h4>${data.title || data.briefTitle || 'No title available'}</h4>
                    <div class="result-badges">
                        ${data.pmid ? `<span class="badge pmid-badge">PMID: ${data.pmid}</span>` : ''}
                        ${data.nctId ? `<span class="badge nct-badge">NCT: ${data.nctId}</span>` : ''}
                        ${hasTrialData ? `<span class="badge clinical-trial-badge">🧪 Clinical Trial</span>` : ''}
                        ${data.doi ? `<span class="badge doi-badge">DOI</span>` : ''}
                    </div>
                </div>
                
                <div class="result-details">
                    ${this.generatePublicationDetails(data)}
                    ${hasTrialData ? this.generateClinicalTrialDetails(data) : ''}
                </div>
                
                <div class="result-actions">
                    <button onclick="lookupInterface.addToRequest()" class="btn btn-primary">
                        📋 Add to Request
                    </button>
                    <button onclick="lookupInterface.copyTitle()" class="btn btn-secondary btn-small">
                        📋 Copy Title
                    </button>
                    ${data.sourceUrl ? `
                        <button onclick="window.open('${data.sourceUrl}', '_blank')" class="btn btn-secondary btn-small">
                            🔗 View Source
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    generatePublicationDetails(data) {
        if (data.publicationType === 'clinical-trial-protocol') {
            return `
                <div class="publication-info">
                    <p><strong>Protocol Title:</strong> ${data.briefTitle || 'N/A'}</p>
                    ${data.officialTitle && data.officialTitle !== data.briefTitle ? 
                        `<p><strong>Official Title:</strong> ${data.officialTitle}</p>` : ''
                    }
                    <p><strong>Lead Sponsor:</strong> ${data.leadSponsor || 'N/A'}</p>
                    <p><strong>Registry:</strong> ClinicalTrials.gov</p>
                </div>
            `;
        }

        return `
            <div class="publication-info">
                ${data.authors ? `<p><strong>Authors:</strong> ${data.authors}</p>` : ''}
                ${data.journal ? `<p><strong>Journal:</strong> ${data.journal}${data.year ? ` (${data.year})` : ''}</p>` : ''}
                ${data.doi ? `<p><strong>DOI:</strong> ${data.doi}</p>` : ''}
                
                ${this.generateMeshDisplay(data)}
                ${this.generateStudyTypeDisplay(data)}
                
                ${data.abstract ? `
                    <div class="abstract-section">
                        <p><strong>Abstract:</strong></p>
                        <div class="abstract-text">${this.truncateText(data.abstract, 300)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateMeshDisplay(data) {
        if (!data.meshHeadings || data.meshHeadings.length === 0) return '';
        
        const majorTerms = data.majorMeshTerms || data.meshHeadings.filter(mesh => mesh.isMajorTopic);
        const minorTerms = data.meshHeadings.filter(mesh => !mesh.isMajorTopic);
        
        return `
            <div class="mesh-section">
                <p><strong>📚 Medical Subject Headings (MeSH):</strong></p>
                
                ${majorTerms.length > 0 ? `
                    <div class="mesh-terms major-mesh">
                        <span class="mesh-label">Major Topics:</span>
                        ${majorTerms.slice(0, 5).map(mesh => 
                            `<span class="mesh-term major-term" title="${mesh.ui || ''}">${mesh.term || mesh}</span>`
                        ).join('')}
                        ${majorTerms.length > 5 ? `<span class="mesh-more">+${majorTerms.length - 5} more</span>` : ''}
                    </div>
                ` : ''}
                
                ${minorTerms.length > 0 ? `
                    <div class="mesh-terms minor-mesh">
                        <span class="mesh-label">Minor Topics:</span>
                        ${minorTerms.slice(0, 3).map(mesh => 
                            `<span class="mesh-term minor-term" title="${mesh.ui || ''}">${mesh.term || mesh}</span>`
                        ).join('')}
                        ${minorTerms.length > 3 ? `<span class="mesh-more">+${minorTerms.length - 3} more</span>` : ''}
                    </div>
                ` : ''}
                
                ${data.medicalSpecialties && data.medicalSpecialties.length > 0 ? `
                    <div class="medical-specialties">
                        <span class="mesh-label">Medical Specialties:</span>
                        ${data.medicalSpecialties.map(specialty => 
                            `<span class="specialty-badge">${this.formatSpecialty(specialty)}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateStudyTypeDisplay(data) {
        if (!data.studyType && !data.evidenceLevel) return '';
        
        return `
            <div class="study-classification">
                ${data.studyType ? `
                    <p><strong>🔬 Study Type:</strong> 
                        <span class="study-type-badge ${data.studyType}">${this.formatStudyType(data.studyType)}</span>
                    </p>
                ` : ''}
                
                ${data.evidenceLevel ? `
                    <p><strong>📊 Evidence Level:</strong> 
                        <span class="evidence-level-badge ${data.evidenceLevel}">${this.formatEvidenceLevel(data.evidenceLevel)}</span>
                    </p>
                ` : ''}
            </div>
        `;
    }

    formatSpecialty(specialty) {
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

    formatStudyType(studyType) {
        const studyTypeNames = {
            'clinical-trial': 'Clinical Trial',
            'systematic-review': 'Systematic Review',
            'case-report': 'Case Report',
            'cohort-study': 'Cohort Study',
            'cross-sectional': 'Cross-Sectional Study',
            'case-control': 'Case-Control Study',
            'review': 'Review Article',
            'other': 'Other'
        };
        
        return studyTypeNames[studyType] || studyType;
    }

    formatEvidenceLevel(evidenceLevel) {
        const evidenceLevels = {
            'level-1': 'Level I (Systematic Review/Meta-Analysis)',
            'level-2': 'Level II (Randomized Controlled Trial)',
            'level-3': 'Level III (Non-Randomized Trial)',
            'level-4': 'Level IV (Cohort Study)',
            'level-5': 'Level V (Case-Control Study)',
            'level-6': 'Level VI (Case Series/Report)',
            'level-7': 'Level VII (Expert Opinion)'
        };
        
        return evidenceLevels[evidenceLevel] || evidenceLevel;
    }

    generateClinicalTrialDetails(data) {
        const trial = data.clinicalTrial || data;
        
        return `
            <div class="clinical-trial-info">
                <h5>🧪 Clinical Trial Information</h5>
                <div class="trial-details">
                    ${trial.nctId ? `<p><strong>NCT Number:</strong> ${trial.nctId}</p>` : ''}
                    ${trial.briefTitle && trial.briefTitle !== data.title ? 
                        `<p><strong>Study Title:</strong> ${trial.briefTitle}</p>` : ''
                    }
                    ${trial.overallStatus ? `
                        <p><strong>Status:</strong> 
                            <span class="status-badge status-${trial.overallStatus.toLowerCase().replace(/[^a-z]/g, '-')}">
                                ${this.formatStatus(trial.overallStatus)}
                            </span>
                        </p>
                    ` : ''}
                    ${trial.phases && trial.phases.length ? 
                        `<p><strong>Phase:</strong> ${trial.phases.join(', ')}</p>` : ''
                    }
                    ${trial.studyType ? `<p><strong>Type:</strong> ${trial.studyType}</p>` : ''}
                    ${trial.conditions && trial.conditions.length ? 
                        `<p><strong>Conditions:</strong> ${trial.conditions.join(', ')}</p>` : ''
                    }
                    ${trial.interventions && trial.interventions.length ? 
                        `<p><strong>Interventions:</strong> ${this.formatInterventions(trial.interventions)}</p>` : ''
                    }
                    ${trial.startDate ? `<p><strong>Start Date:</strong> ${this.formatDate(trial.startDate)}</p>` : ''}
                    ${trial.completionDate ? `<p><strong>Completion:</strong> ${this.formatDate(trial.completionDate)}</p>` : ''}
                </div>
                
                ${data.nctNumbers && data.nctNumbers.length > 1 ? `
                    <div class="multiple-trials">
                        <p><strong>Related Trials:</strong> ${data.nctNumbers.join(', ')}</p>
                    </div>
                ` : ''}
                
                <div class="trial-actions">
                    <button onclick="lookupInterface.viewTrialDetails('${trial.nctId}')" class="btn btn-secondary btn-small">
                        📊 View Full Trial Details
                    </button>
                </div>
            </div>
        `;
    }

    formatStatus(status) {
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

    formatInterventions(interventions) {
        if (Array.isArray(interventions) && interventions.length > 0) {
            // Handle both string arrays and object arrays
            return interventions.map(intervention => {
                if (typeof intervention === 'string') {
                    return intervention;
                } else if (intervention.name) {
                    return intervention.name;
                }
                return '';
            }).filter(name => name).join(', ');
        }
        return 'N/A';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        
        const truncated = text.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        if (lastSpace > maxLength * 0.8) {
            return truncated.substring(0, lastSpace) + '...';
        }
        
        return truncated + '...';
    }

    async searchClinicalTrials() {
        const condition = document.getElementById('ct-condition')?.value?.trim() || '';
        const intervention = document.getElementById('ct-intervention')?.value?.trim() || '';
        const status = document.getElementById('ct-status')?.value || '';

        if (!condition && !intervention) {
            this.showLookupStatus('error', 'Please enter a condition or intervention to search');
            return;
        }

        this.showLookupStatus('loading', 'Searching clinical trials...');

        try {
            const searchParams = {
                condition,
                intervention,
                status,
                pageSize: 20
            };

            const results = await window.SilentStacksAPI.ClinicalTrialsAPI.searchStudies(searchParams);
            this.displayTrialSearchResults(results);
            this.showLookupStatus('success', `Found ${results.totalCount} clinical trials`);
        } catch (error) {
            console.error('Clinical trials search failed:', error);
            this.showLookupStatus('error', `Search failed: ${error.message}`);
        }
    }

    displayTrialSearchResults(results) {
        const resultsContainer = document.getElementById('ct-search-results');
        if (!resultsContainer) return;

        if (!results.studies || results.studies.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No clinical trials found matching your criteria.</p>';
            return;
        }

        const html = `
            <div class="search-results-header">
                <h4>Clinical Trials Search Results</h4>
                <p class="results-count">Showing ${results.studies.length} of ${results.totalCount} results</p>
            </div>
            <div class="trials-list">
                ${results.studies.map(trial => this.generateTrialSearchResultHTML(trial)).join('')}
            </div>
        `;

        resultsContainer.innerHTML = html;
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    generateTrialSearchResultHTML(trial) {
        return `
            <div class="trial-search-result">
                <div class="trial-header">
                    <h5>${trial.briefTitle}</h5>
                    <span class="trial-nct">${trial.nctId}</span>
                </div>
                <div class="trial-meta">
                    <span class="trial-status status-${trial.overallStatus.toLowerCase().replace(/[^a-z]/g, '-')}">
                        ${this.formatStatus(trial.overallStatus)}
                    </span>
                    ${trial.phases && trial.phases.length ? 
                        `<span class="trial-phase">${trial.phases.join(', ')}</span>` : ''
                    }
                    <span class="trial-type">${trial.studyType}</span>
                </div>
                ${trial.conditions && trial.conditions.length ? 
                    `<p class="trial-conditions"><strong>Conditions:</strong> ${trial.conditions.join(', ')}</p>` : ''
                }
                <div class="trial-actions">
                    <button onclick="lookupInterface.addTrialToRequest('${trial.nctId}')" class="btn btn-primary btn-small">
                        📋 Add to Request
                    </button>
                    <button onclick="lookupInterface.viewTrialDetails('${trial.nctId}')" class="btn btn-secondary btn-small">
                        👁️ View Details
                    </button>
                </div>
            </div>
        `;
    }

    async addToRequest() {
        if (!this.currentLookupData) {
            this.showLookupStatus('error', 'No data to add');
            return;
        }

        try {
            this.populateFormWithData(this.currentLookupData);
            this.showLookupStatus('success', 'Form populated with lookup data');
            
            // Scroll to form
            const form = document.querySelector('.request-form');
            if (form) {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            console.error('Failed to add to request:', error);
            this.showLookupStatus('error', 'Failed to populate form');
        }
    }

    async addTrialToRequest(nctId) {
        this.showLookupStatus('loading', 'Loading trial details...');

        try {
            const trialData = await window.SilentStacksAPI.ClinicalTrialsAPI.getStudyDetails(nctId);
            this.populateFormWithData(trialData);
            this.showLookupStatus('success', 'Trial data added to form');
            
            // Scroll to form
            const form = document.querySelector('.request-form');
            if (form) {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            console.error('Failed to add trial to request:', error);
            this.showLookupStatus('error', `Failed to load trial: ${error.message}`);
        }
    }

    populateFormWithData(data) {
        // Standard fields
        this.setFormField('title', data.title || data.briefTitle || '');
        this.setFormField('authors', data.authors || data.leadSponsor || '');
        this.setFormField('journal', data.journal || 'ClinicalTrials.gov');
        this.setFormField('year', data.year || this.extractYearFromDate(data.startDate));
        this.setFormField('doi', data.doi || '');
        this.setFormField('pmid', data.pmid || '');

        // Clinical trial fields
        if (data.nctId || data.primaryNCT) {
            this.setFormField('nctId', data.nctId || data.primaryNCT);
        }
        
        if (data.clinicalTrial || data.studyType) {
            const trial = data.clinicalTrial || data;
            
            this.setFormField('studyPhase', this.getFirstPhase(trial.phases));
            this.setFormField('studyStatus', trial.overallStatus || '');
            this.setFormField('studyType', trial.studyType || '');
        }

        // MeSH and medical classification fields
        if (data.majorMeshTerms && data.majorMeshTerms.length > 0) {
            const meshTerms = data.majorMeshTerms.map(term => 
                typeof term === 'string' ? term : term.term
            ).join(', ');
            this.setFormField('meshMajorTerms', meshTerms);
        }

        if (data.studyTypeClassification || data.studyType) {
            this.setFormField('studyTypeClassification', data.studyTypeClassification || data.studyType);
        }

        if (data.evidenceLevel) {
            this.setFormField('evidenceLevel', data.evidenceLevel);
        }

        if (data.medicalSpecialties && data.medicalSpecialties.length > 0) {
            const specialties = data.medicalSpecialties.map(specialty => 
                this.formatSpecialty(specialty)
            ).join(', ');
            this.setFormField('medicalSpecialties', specialties);
        }

        // Notes field - combine relevant information
        const notes = this.generateNotesFromData(data);
        if (notes) {
            this.setFormField('notes', notes);
        }

        // Add visual feedback
        this.highlightAutoFilledFields();
    }

    setFormField(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
            field.classList.add('auto-filled');
            
            // Trigger change event for any listeners
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    getFirstPhase(phases) {
        if (!phases || !Array.isArray(phases) || phases.length === 0) return '';
        
        const phaseMap = {
            'PHASE1': 'PHASE1',
            'PHASE2': 'PHASE2', 
            'PHASE3': 'PHASE3',
            'PHASE4': 'PHASE4',
            'NOT_APPLICABLE': 'NOT_APPLICABLE'
        };
        
        return phaseMap[phases[0]] || phases[0];
    }

    extractYearFromDate(dateString) {
        if (!dateString) return '';
        
        try {
            const year = dateString.split('-')[0];
            return year && year.length === 4 ? year : '';
        } catch {
            return '';
        }
    }

    generateNotesFromData(data) {
        const notes = [];
        
        if (data.clinicalTrial) {
            notes.push(`Clinical Trial: ${data.clinicalTrial.nctId} - ${data.clinicalTrial.briefTitle}`);
            notes.push(`Status: ${data.clinicalTrial.overallStatus}`);
            
            if (data.clinicalTrial.conditions && data.clinicalTrial.conditions.length) {
                notes.push(`Conditions: ${data.clinicalTrial.conditions.join(', ')}`);
            }
            
            if (data.clinicalTrial.interventions && data.clinicalTrial.interventions.length) {
                const interventionNames = this.formatInterventions(data.clinicalTrial.interventions);
                notes.push(`Interventions: ${interventionNames}`);
            }
        } else if (data.nctId) {
            notes.push(`Clinical Trial Protocol: ${data.nctId}`);
            if (data.overallStatus) {
                notes.push(`Status: ${data.overallStatus}`);
            }
        }
        
        if (data.abstract) {
            notes.push('');
            notes.push('Abstract:');
            notes.push(data.abstract);
        }
        
        // Preserve existing notes
        const existingNotes = document.getElementById('notes')?.value || '';
        if (existingNotes) {
            notes.unshift(existingNotes);
            notes.unshift('---');
        }
        
        return notes.join('\n');
    }

    highlightAutoFilledFields() {
        setTimeout(() => {
            const autoFilledFields = document.querySelectorAll('.auto-filled');
            autoFilledFields.forEach(field => {
                field.style.backgroundColor = 'rgba(23, 162, 184, 0.1)';
                field.style.borderColor = '#17a2b8';
                
                // Remove highlighting after 3 seconds
                setTimeout(() => {
                    field.style.backgroundColor = '';
                    field.style.borderColor = '';
                    field.classList.remove('auto-filled');
                }, 3000);
            });
        }, 100);
    }

    copyTitle() {
        if (!this.currentLookupData) return;
        
        const title = this.currentLookupData.title || this.currentLookupData.briefTitle || '';
        if (title) {
            navigator.clipboard.writeText(title).then(() => {
                this.showLookupStatus('success', 'Title copied to clipboard');
            }).catch(() => {
                this.showLookupStatus('error', 'Failed to copy title');
            });
        }
    }

    viewTrialDetails(nctId) {
        const url = `https://clinicaltrials.gov/study/${nctId}`;
        window.open(url, '_blank');
    }

    showLookupStatus(type, message) {
        const statusElement = document.getElementById('lookup-status');
        if (!statusElement) return;

        statusElement.className = `lookup-status ${type}`;
        statusElement.textContent = message;
        statusElement.style.display = 'block';

        // Auto-hide success and error messages
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 5000);
        }
    }

    setLookupButtonState(loading, type) {
        const buttonMap = {
            'pmid': 'pmid-lookup-btn',
            'nct': 'nct-lookup-btn',
            'doi': 'doi-lookup-btn'
        };

        const button = document.getElementById(buttonMap[type]);
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span> Looking up...';
        } else {
            button.disabled = false;
            button.innerHTML = '🔍 Lookup';
        }
    }
}

// Initialize the lookup interface
const lookupInterface = new LookupInterface();

// Make it globally available
window.lookupInterface = lookupInterface;
