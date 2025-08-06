// Enhanced API Integration for SilentStacks v1.4 - Modular Architecture
// File: assets/js/enhanced-apis.js

// Enhanced API Module with PubMed, CrossRef, and ClinicalTrials.gov integration
window.SilentStacksAPI = (() => {
    'use strict';

    // Configuration
    const CONFIG = {
        pubmed: {
            baseURL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/',
            rateLimit: 200, // ms between requests (respects 3 req/sec limit)
            timeout: 30000
        },
        crossref: {
            baseURL: 'https://api.crossref.org/works/',
            rateLimit: 100, // ms between requests
            timeout: 30000
        },
        clinicaltrials: {
            baseURL: 'https://clinicaltrials.gov/api/v2/studies',
            rateLimit: 1000, // ms between requests (conservative)
            timeout: 30000
        }
    };

    // Rate limiting tracking
    const rateLimits = {
        pubmed: 0,
        crossref: 0,
        clinicaltrials: 0
    };

    // Connection Manager
    class ConnectionManager {
        constructor() {
            this.status = navigator.onLine ? 'online' : 'offline';
            this.listeners = [];
            this.setupEventListeners();
        }

        setupEventListeners() {
            window.addEventListener('online', () => {
                this.status = 'online';
                this.notifyListeners('online');
                APIQueue.processAll();
            });

            window.addEventListener('offline', () => {
                this.status = 'offline';
                this.notifyListeners('offline');
            });
        }

        isOnline() {
            return this.status === 'online';
        }

        addListener(callback) {
            this.listeners.push(callback);
        }

        notifyListeners(status) {
            this.listeners.forEach(callback => callback(status));
        }
    }

    // API Queue for offline requests
    class APIQueue {
        static queue = [];
        static processing = false;

        static add(request) {
            this.queue.push({
                ...request,
                timestamp: Date.now(),
                id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            });
            this.saveQueue();
        }

        static async processAll() {
            if (this.processing || this.queue.length === 0) return;
            
            this.processing = true;
            const results = [];

            for (const request of this.queue) {
                try {
                    const result = await this.executeRequest(request);
                    results.push({ request, result, success: true });
                } catch (error) {
                    results.push({ request, error, success: false });
                }
            }

            this.queue = this.queue.filter(req => 
                !results.some(result => result.success && result.request.id === req.id)
            );
            
            this.saveQueue();
            this.processing = false;
            
            return results;
        }

        static async executeRequest(request) {
            switch (request.type) {
                case 'pmid':
                    return await PubMedAPI.fetchPubMed(request.identifier);
                case 'doi':
                    return await CrossRefAPI.fetchCrossRef(request.identifier);
                case 'nct':
                    return await ClinicalTrialsAPI.getStudyDetails(request.identifier);
                default:
                    throw new Error(`Unknown request type: ${request.type}`);
            }
        }

        static saveQueue() {
            try {
                localStorage.setItem('silentStacks_apiQueue', JSON.stringify(this.queue));
            } catch (error) {
                console.warn('Failed to save API queue:', error);
            }
        }

        static loadQueue() {
            try {
                const saved = localStorage.getItem('silentStacks_apiQueue');
                if (saved) {
                    this.queue = JSON.parse(saved);
                }
            } catch (error) {
                console.warn('Failed to load API queue:', error);
                this.queue = [];
            }
        }
    }

    // Rate limiting utility
    async function respectRateLimit(service) {
        const now = Date.now();
        const lastRequest = rateLimits[service];
        const minInterval = CONFIG[service].rateLimit;

        if (now - lastRequest < minInterval) {
            await new Promise(resolve => 
                setTimeout(resolve, minInterval - (now - lastRequest))
            );
        }

        rateLimits[service] = Date.now();
    }

    // Enhanced PubMed API with MeSH extraction
    class PubMedAPI {
        static async fetchPubMed(pmid) {
            console.log(`Fetching PubMed data for PMID: ${pmid}`);
            
            // Check if offline and queue the request
            if (!connectionManager.isOnline()) {
                APIQueue.add({ type: 'pmid', identifier: pmid });
                return {
                    pmid: pmid,
                    title: `[QUEUED] Article ${pmid} - Will lookup when online`,
                    authors: 'Authors will be retrieved when online',
                    journal: 'Journal information pending',
                    year: 'Year pending',
                    doi: 'DOI pending',
                    meshHeadings: [],
                    nctNumbers: []
                };
            }

            await respectRateLimit('pubmed');

            try {
                const apiKey = window.settings?.apiKey || '';
                const keyParam = apiKey ? `&api_key=${apiKey}` : '';
                
                // Step 1: Get basic metadata from ESummary
                const summaryUrl = `${CONFIG.pubmed.baseURL}esummary.fcgi?db=pubmed&id=${pmid}&retmode=json${keyParam}`;
                console.log('Fetching summary:', summaryUrl);
                
                const summaryResponse = await fetch(summaryUrl, {
                    signal: AbortSignal.timeout(CONFIG.pubmed.timeout)
                });
                
                if (!summaryResponse.ok) {
                    throw new Error(`ESummary failed: ${summaryResponse.status}`);
                }
                
                const summaryData = await summaryResponse.json();
                console.log('Summary response:', summaryData);
                
                if (summaryData.error) {
                    throw new Error(`PubMed error: ${summaryData.error}`);
                }
                
                const record = summaryData.result[pmid];
                if (!record || record.error) {
                    throw new Error(`PMID ${pmid} not found`);
                }
                
                // Build basic metadata
                const meta = {
                    pmid: pmid,
                    title: record.title || '',
                    authors: (record.authors || []).map(author => author.name).join('; '),
                    journal: record.fulljournalname || record.source || '',
                    year: (record.pubdate || '').split(' ')[0] || '',
                    doi: ''
                };
                
                console.log('Basic metadata:', meta);
                
                // Step 2: Get detailed data from EFetch XML
                const fetchUrl = `${CONFIG.pubmed.baseURL}efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${keyParam}`;
                console.log('Fetching XML for detailed data:', fetchUrl);
                
                const xmlResponse = await fetch(fetchUrl, {
                    signal: AbortSignal.timeout(CONFIG.pubmed.timeout)
                });
                
                if (!xmlResponse.ok) {
                    console.warn(`EFetch failed: ${xmlResponse.status}, continuing with basic data`);
                    return meta;
                }
                
                const xmlText = await xmlResponse.text();
                console.log('XML response length:', xmlText.length);
                
                // Parse XML for enhanced data
                const parser = new DOMParser();
                const doc = parser.parseFromString(xmlText, 'application/xml');
                
                // Extract DOI (multiple strategies)
                let doi = this.extractDOI(doc);
                meta.doi = doi;
                
                // Extract MeSH headings
                const meshHeadings = this.extractMeSHHeadings(doc);
                meta.meshHeadings = meshHeadings;
                meta.majorMeshTerms = meshHeadings.filter(mesh => mesh.isMajorTopic);
                
                // Extract publication types
                const publicationTypes = this.extractPublicationTypes(doc);
                meta.publicationTypes = publicationTypes;
                
                // Extract NCT numbers (clinical trial identifiers)
                const nctNumbers = this.extractNCTNumbers(doc);
                meta.nctNumbers = nctNumbers;
                meta.hasLinkedClinicalTrial = nctNumbers.length > 0;
                meta.primaryNCT = nctNumbers[0] || null;
                
                // Extract abstract
                const abstract = this.extractAbstract(doc);
                meta.abstract = abstract;
                
                // Medical classification
                meta.medicalSpecialties = this.identifyMedicalSpecialties(meshHeadings);
                meta.studyType = this.identifyStudyType(publicationTypes, meshHeadings);
                meta.evidenceLevel = this.assessEvidenceLevel(publicationTypes);
                
                // Source tracking
                meta.source = 'pubmed';
                meta.sourceUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
                meta.publicationType = meta.hasLinkedClinicalTrial ? 'clinical-trial-publication' : 'standard-publication';
                
                console.log('Final enhanced metadata:', meta);
                return meta;
                
            } catch (error) {
                console.error('PubMed fetch error:', error);
                throw new Error(`PubMed lookup failed: ${error.message}`);
            }
        }

        static extractDOI(doc) {
            let doi = '';
            
            // Strategy 1: ArticleId with IdType="doi"
            const doiNode1 = doc.querySelector('ArticleId[IdType="doi"]');
            if (doiNode1) {
                doi = doiNode1.textContent.trim();
                console.log('Found DOI (method 1):', doi);
                return doi;
            }
            
            // Strategy 2: ArticleId containing "10." (DOI prefix)
            const articleIds = doc.querySelectorAll('ArticleId');
            for (const node of articleIds) {
                const text = node.textContent.trim();
                if (text.startsWith('10.')) {
                    doi = text;
                    console.log('Found DOI (method 2):', doi);
                    return doi;
                }
            }
            
            // Strategy 3: Look in ELocationID with EIdType="doi"
            const elocationNode = doc.querySelector('ELocationID[EIdType="doi"]');
            if (elocationNode) {
                doi = elocationNode.textContent.trim();
                console.log('Found DOI (method 3):', doi);
                return doi;
            }
            
            return doi;
        }

        static extractMeSHHeadings(doc) {
            const meshHeadings = [];
            const meshList = doc.querySelectorAll('MeshHeadingList MeshHeading');
            
            meshList.forEach(meshHeading => {
                const descriptor = meshHeading.querySelector('DescriptorName');
                if (descriptor) {
                    const meshTerm = {
                        term: descriptor.textContent?.trim() || '',
                        ui: descriptor.getAttribute('UI') || '',
                        isMajorTopic: descriptor.getAttribute('MajorTopicYN') === 'Y',
                        qualifiers: []
                    };
                    
                    // Extract qualifiers (subheadings)
                    const qualifiers = meshHeading.querySelectorAll('QualifierName');
                    qualifiers.forEach(qualifier => {
                        meshTerm.qualifiers.push({
                            term: qualifier.textContent?.trim() || '',
                            ui: qualifier.getAttribute('UI') || '',
                            isMajorTopic: qualifier.getAttribute('MajorTopicYN') === 'Y'
                        });
                    });
                    
                    meshHeadings.push(meshTerm);
                }
            });
            
            return meshHeadings;
        }

        static extractPublicationTypes(doc) {
            const publicationTypes = [];
            const pubTypes = doc.querySelectorAll('PublicationTypeList PublicationType');
            
            pubTypes.forEach(pubType => {
                const type = {
                    term: pubType.textContent?.trim() || '',
                    ui: pubType.getAttribute('UI') || ''
                };
                publicationTypes.push(type);
            });
            
            return publicationTypes;
        }

        static extractNCTNumbers(doc) {
            const nctNumbers = new Set();
            
            // Method 1: Check DataBankList for ClinicalTrials.gov entries
            const dataBanks = doc.querySelectorAll('DataBankList DataBank');
            dataBanks.forEach(bank => {
                const bankName = bank.querySelector('DataBankName')?.textContent?.trim();
                if (bankName === 'ClinicalTrials.gov') {
                    const accessions = bank.querySelectorAll('AccessionNumberList AccessionNumber');
                    accessions.forEach(acc => {
                        const nct = acc.textContent?.trim();
                        if (nct && nct.match(/^NCT\d{8}$/)) {
                            nctNumbers.add(nct);
                        }
                    });
                }
            });
            
            // Method 2: Search in abstract text for NCT patterns
            const abstractText = this.extractAbstract(doc);
            if (abstractText) {
                const nctMatches = abstractText.match(/NCT\d{8}/g);
                if (nctMatches) {
                    nctMatches.forEach(nct => nctNumbers.add(nct));
                }
            }
            
            // Method 3: Check Secondary ID fields
            const secondaryIds = doc.querySelectorAll('OtherID');
            secondaryIds.forEach(id => {
                const idText = id.textContent?.trim();
                if (idText && idText.match(/NCT\d{8}/)) {
                    const nctMatch = idText.match(/NCT\d{8}/)[0];
                    nctNumbers.add(nctMatch);
                }
            });
            
            return Array.from(nctNumbers);
        }

        static extractAbstract(doc) {
            const abstractNode = doc.querySelector('AbstractText');
            return abstractNode ? abstractNode.textContent?.trim() || '' : '';
        }

        static identifyMedicalSpecialties(meshHeadings) {
            const specialtyMap = {
                'cardiology': ['Heart Diseases', 'Cardiovascular System', 'Myocardial Infarction', 'Heart Failure', 'Arrhythmias', 'Coronary Disease'],
                'oncology': ['Neoplasms', 'Cancer', 'Tumor', 'Oncology', 'Chemotherapy', 'Radiation Therapy', 'Immunotherapy'],
                'neurology': ['Nervous System Diseases', 'Brain', 'Neurological', 'Stroke', 'Epilepsy', 'Alzheimer', 'Parkinson'],
                'endocrinology': ['Diabetes Mellitus', 'Endocrine System', 'Hormones', 'Thyroid', 'Insulin', 'Metabolism'],
                'infectious-diseases': ['Infection', 'Bacteria', 'Virus', 'Antibiotics', 'Antimicrobial', 'COVID-19', 'Pneumonia'],
                'psychiatry': ['Mental Disorders', 'Depression', 'Anxiety', 'Schizophrenia', 'Bipolar', 'Psychotherapy'],
                'pediatrics': ['Child', 'Infant', 'Adolescent', 'Pediatrics', 'Neonatal', 'Child Development'],
                'ob-gyn': ['Pregnancy', 'Obstetrics', 'Gynecology', 'Women', 'Reproductive', 'Contraception'],
                'surgery': ['Surgery', 'Surgical Procedures', 'Postoperative', 'Anesthesia', 'Operative'],
                'emergency': ['Emergency', 'Trauma', 'Critical Care', 'Intensive Care', 'Resuscitation'],
                'radiology': ['Radiology', 'Imaging', 'MRI', 'CT', 'Ultrasound', 'X-Ray', 'Nuclear Medicine'],
                'pharmacology': ['Pharmacology', 'Drug Therapy', 'Pharmacokinetics', 'Drug Interactions', 'Medication']
            };
            
            const identifiedSpecialties = new Set();
            
            meshHeadings.forEach(mesh => {
                const meshTerm = mesh.term.toLowerCase();
                
                Object.entries(specialtyMap).forEach(([specialty, keywords]) => {
                    if (keywords.some(keyword => meshTerm.includes(keyword.toLowerCase()))) {
                        identifiedSpecialties.add(specialty);
                    }
                });
            });
            
            return Array.from(identifiedSpecialties);
        }

        static identifyStudyType(publicationTypes, meshHeadings) {
            const pubTypeTerms = publicationTypes.map(pt => pt.term.toLowerCase());
            const meshTerms = meshHeadings.map(mh => mh.term.toLowerCase());
            
            if (pubTypeTerms.some(term => 
                term.includes('clinical trial') || 
                term.includes('randomized controlled trial') ||
                term.includes('controlled clinical trial')
            )) {
                return 'clinical-trial';
            }
            
            if (pubTypeTerms.some(term => 
                term.includes('systematic review') || 
                term.includes('meta-analysis')
            )) {
                return 'systematic-review';
            }
            
            if (pubTypeTerms.some(term => term.includes('case report'))) {
                return 'case-report';
            }
            
            if (pubTypeTerms.some(term => term.includes('cohort')) ||
                meshTerms.some(term => term.includes('cohort studies'))) {
                return 'cohort-study';
            }
            
            if (meshTerms.some(term => term.includes('cross-sectional'))) {
                return 'cross-sectional';
            }
            
            if (meshTerms.some(term => term.includes('case-control'))) {
                return 'case-control';
            }
            
            if (pubTypeTerms.some(term => term.includes('review'))) {
                return 'review';
            }
            
            return 'other';
        }

        static assessEvidenceLevel(publicationTypes) {
            const pubTypeTerms = publicationTypes.map(pt => pt.term.toLowerCase());
            
            if (pubTypeTerms.some(term => 
                term.includes('systematic review') || 
                term.includes('meta-analysis')
            )) {
                return 'level-1';
            }
            
            if (pubTypeTerms.some(term => 
                term.includes('randomized controlled trial') ||
                term.includes('controlled clinical trial')
            )) {
                return 'level-2';
            }
            
            if (pubTypeTerms.some(term => term.includes('clinical trial'))) {
                return 'level-3';
            }
            
            if (pubTypeTerms.some(term => term.includes('cohort'))) {
                return 'level-4';
            }
            
            if (pubTypeTerms.some(term => term.includes('case-control'))) {
                return 'level-5';
            }
            
            if (pubTypeTerms.some(term => term.includes('case report'))) {
                return 'level-6';
            }
            
            return 'level-7';
        }
    }

    // Enhanced CrossRef API
    class CrossRefAPI {
        static async fetchCrossRef(doi) {
            console.log(`Fetching CrossRef data for DOI: ${doi}`);
            
            // Check if offline and queue the request
            if (!connectionManager.isOnline()) {
                APIQueue.add({ type: 'doi', identifier: doi });
                return {
                    doi: doi,
                    title: `[QUEUED] Article with DOI ${doi} - Will lookup when online`,
                    authors: 'Authors will be retrieved when online',
                    journal: 'Journal information pending',
                    year: 'Year pending',
                    pmid: 'PMID pending'
                };
            }

            await respectRateLimit('crossref');

            try {
                // Normalize DOI (remove URL prefixes)
                const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '').trim();
                console.log('Cleaned DOI:', cleanDoi);
                
                const url = `${CONFIG.crossref.baseURL}${encodeURIComponent(cleanDoi)}`;
                console.log('CrossRef URL:', url);
                
                const response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json'
                    },
                    signal: AbortSignal.timeout(CONFIG.crossref.timeout)
                });
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`DOI not found: ${cleanDoi}`);
                    }
                    throw new Error(`CrossRef API error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('CrossRef response:', data);
                
                const work = data.message;
                if (!work) {
                    throw new Error('No work data in CrossRef response');
                }
                
                // Build metadata
                const meta = {
                    doi: cleanDoi,
                    title: (work.title && work.title[0]) || '',
                    authors: (work.author || [])
                        .map(author => `${author.given || ''} ${author.family || ''}`.trim())
                        .filter(name => name)
                        .join('; '),
                    journal: (work['container-title'] && work['container-title'][0]) || '',
                    year: (work.published && work.published['date-parts'] && work.published['date-parts'][0] && work.published['date-parts'][0][0]) || '',
                    pmid: '', // Will be filled by PubMed search if needed
                    source: 'crossref',
                    sourceUrl: `https://doi.org/${cleanDoi}`
                };
                
                console.log('CrossRef metadata:', meta);
                return meta;
                
            } catch (error) {
                console.error('CrossRef fetch error:', error);
                throw new Error(`CrossRef lookup failed: ${error.message}`);
            }
        }
    }

    // ClinicalTrials.gov API
    class ClinicalTrialsAPI {
        static async getStudyDetails(nctId) {
            console.log(`Fetching ClinicalTrials.gov data for NCT: ${nctId}`);
            
            if (!connectionManager.isOnline()) {
                APIQueue.add({ type: 'nct', identifier: nctId });
                throw new Error('Offline - clinical trial request queued for when connection returns');
            }

            await respectRateLimit('clinicaltrials');

            try {
                const url = `${CONFIG.clinicaltrials.baseURL}/${nctId}?format=json`;
                const response = await fetch(url, {
                    signal: AbortSignal.timeout(CONFIG.clinicaltrials.timeout)
                });
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`Clinical trial ${nctId} not found`);
                    }
                    throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
                }

                const data = await response.json();
                const result = this.parseStudyResponse(data);
                
                return result;

            } catch (error) {
                console.error('ClinicalTrials.gov lookup failed:', error);
                throw error;
            }
        }

        static parseStudyResponse(data) {
            if (!data.studies || data.studies.length === 0) {
                throw new Error('No study data found in response');
            }

            const study = data.studies[0];
            const protocolSection = study.protocolSection || {};
            const identification = protocolSection.identificationModule || {};
            const status = protocolSection.statusModule || {};
            const design = protocolSection.designModule || {};
            const conditions = protocolSection.conditionsModule || {};
            const interventions = protocolSection.interventionsModule || {};

            return {
                nctId: identification.nctId || '',
                briefTitle: identification.briefTitle || '',
                officialTitle: identification.officialTitle || '',
                acronym: identification.acronym || '',
                leadSponsor: identification.organization?.fullName || '',
                overallStatus: status.overallStatus || '',
                startDate: status.startDateStruct?.date || '',
                completionDate: status.primaryCompletionDateStruct?.date || status.completionDateStruct?.date || '',
                studyType: design.studyType || '',
                phases: design.phases || [],
                conditions: conditions.conditions || [],
                interventions: this.parseInterventions(interventions.interventions || []),
                source: 'clinicaltrials.gov',
                sourceUrl: `https://clinicaltrials.gov/study/${identification.nctId}`
            };
        }

        static parseInterventions(interventions) {
            return interventions.map(intervention => ({
                type: intervention.type || '',
                name: intervention.name || '',
                description: intervention.description || ''
            }));
        }

        static async searchStudies(params) {
            if (!connectionManager.isOnline()) {
                throw new Error('Search requires internet connection');
            }

            await respectRateLimit('clinicaltrials');

            try {
                const queryParams = new URLSearchParams();
                
                if (params.condition) queryParams.append('query.cond', params.condition);
                if (params.intervention) queryParams.append('query.intr', params.intervention);
                if (params.term) queryParams.append('query.term', params.term);
                if (params.status) queryParams.append('filter.overallStatus', params.status);
                if (params.phase) queryParams.append('filter.phase', params.phase);
                
                queryParams.append('pageSize', params.pageSize || 20);
                queryParams.append('format', 'json');

                const url = `${CONFIG.clinicaltrials.baseURL}?${queryParams.toString()}`;
                const response = await fetch(url, {
                    signal: AbortSignal.timeout(CONFIG.clinicaltrials.timeout)
                });
                
                if (!response.ok) {
                    throw new Error(`ClinicalTrials.gov search error: ${response.status}`);
                }

                const data = await response.json();
                return {
                    studies: (data.studies || []).map(study => this.parseStudyResponse({ studies: [study] })),
                    totalCount: data.totalCount || 0,
                    nextPageToken: data.nextPageToken || null
                };

            } catch (error) {
                console.error('ClinicalTrials.gov search failed:', error);
                throw error;
            }
        }
    }

    // Enhanced Lookup Orchestrator
    class EnhancedLookup {
        static async performLookup(identifier, options = {}) {
            const type = this.detectIdentifierType(identifier);
            
            try {
                switch (type) {
                    case 'pmid':
                        return await this.lookupPubMedWithTrials(identifier, options);
                    case 'nct':
                        return await this.lookupClinicalTrial(identifier, options);
                    case 'doi':
                        return await this.lookupDOI(identifier, options);
                    default:
                        throw new Error(`Unsupported identifier type: ${type}`);
                }
            } catch (error) {
                console.error('Enhanced lookup failed:', error);
                throw error;
            }
        }

        static async lookupPubMedWithTrials(pmid, options) {
            // Step 1: Get PubMed data with MeSH
            const pubmedData = await PubMedAPI.fetchPubMed(pmid);
            
            // Step 2: If NCT numbers found, get clinical trial data
            let clinicalTrialData = null;
            if (pubmedData.nctNumbers && pubmedData.nctNumbers.length > 0) {
                try {
                    // Use the first NCT number as primary
                    clinicalTrialData = await ClinicalTrialsAPI.getStudyDetails(pubmedData.primaryNCT);
                } catch (error) {
                    console.warn('Failed to fetch clinical trial data:', error);
                    // Continue without trial data
                }
            }

            // Step 3: Merge data
            return this.mergePublicationAndTrialData(pubmedData, clinicalTrialData);
        }

        static async lookupClinicalTrial(nctId, options) {
            const trialData = await ClinicalTrialsAPI.getStudyDetails(nctId);
            
            return {
                ...trialData,
                publicationType: 'clinical-trial-protocol',
                hasLinkedClinicalTrial: true,
                primaryNCT: nctId,
                nctNumbers: [nctId]
            };
        }

        static async lookupDOI(doi, options) {
            return await CrossRefAPI.fetchCrossRef(doi);
        }

        static mergePublicationAndTrialData(pubmedData, clinicalTrialData) {
            const result = {
                ...pubmedData,
                publicationType: clinicalTrialData ? 'clinical-trial-publication' : 'standard-publication'
            };

            if (clinicalTrialData) {
                result.clinicalTrial = {
                    nctId: clinicalTrialData.nctId,
                    briefTitle: clinicalTrialData.briefTitle,
                    officialTitle: clinicalTrialData.officialTitle,
                    acronym: clinicalTrialData.acronym,
                    overallStatus: clinicalTrialData.overallStatus,
                    studyType: clinicalTrialData.studyType,
                    phases: clinicalTrialData.phases,
                    conditions: clinicalTrialData.conditions,
                    interventions: clinicalTrialData.interventions,
                    startDate: clinicalTrialData.startDate,
                    completionDate: clinicalTrialData.completionDate,
                    leadSponsor: clinicalTrialData.leadSponsor,
                    sourceUrl: clinicalTrialData.sourceUrl
                };

                // Enhance title if different from publication
                if (clinicalTrialData.briefTitle && clinicalTrialData.briefTitle !== result.title) {
                    result.trialTitle = clinicalTrialData.briefTitle;
                }
            }

            return result;
        }

        static detectIdentifierType(identifier) {
            // Remove whitespace
            const clean = identifier.toString().trim();
            
            // NCT number pattern
            if (/^NCT\d{8}$/i.test(clean)) {
                return 'nct';
            }
            
            // PMID pattern (numeric, typically 1-8 digits)
            if (/^\d{1,8}$/.test(clean)) {
                return 'pmid';
            }
            
            // DOI pattern
            if (/^10\.\d+\/.+$/i.test(clean)) {
                return 'doi';
            }
            
            // DOI with doi: prefix
            if (/^doi:\s*10\.\d+\/.+$/i.test(clean)) {
                return 'doi';
            }
            
            // Default to PMID for numeric values
            if (/^\d+$/.test(clean)) {
                return 'pmid';
            }
            
            return 'unknown';
        }
    }

    // Initialize connection manager
    const connectionManager = new ConnectionManager();

    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
        APIQueue.loadQueue();
        
        // Process queued requests if online
        if (connectionManager.isOnline()) {
            setTimeout(() => APIQueue.processAll(), 1000);
        }
    });

    // Public API
    return {
        PubMedAPI,
        CrossRefAPI,
        ClinicalTrialsAPI,
        EnhancedLookup,
        connectionManager,
        APIQueue,
        
        // Legacy compatibility with production app.js patterns
        fetchPubMed: PubMedAPI.fetchPubMed.bind(PubMedAPI),
        fetchCrossRef: CrossRefAPI.fetchCrossRef.bind(CrossRefAPI)
    };
    // Adapter to make this work with existing SilentStacks architecture
(function() {
    'use strict';
    
    // Create the APIIntegration module that app.js expects
    const APIIntegration = {
        // Map to the new API methods
        fetchPubMed: window.SilentStacksAPI.fetchPubMed,
        fetchCrossRef: window.SilentStacksAPI.fetchCrossRef,
        
        // The lookup methods your buttons expect
        async lookupPMID() {
            const pmidInput = document.getElementById('pmid');
            if (!pmidInput) return;
            
            const pmid = pmidInput.value.trim();
            if (!pmid) {
                this.setStatus('Please enter a PMID', 'error');
                return;
            }
            
            if (!/^\d+$/.test(pmid)) {
                this.setStatus('PMID must be numeric', 'error');
                return;
            }
            
            this.setStatus('Looking up PMID...', 'loading');
            
            try {
                const pubmedData = await window.SilentStacksAPI.PubMedAPI.fetchPubMed(pmid);
                
                // Populate form
                if (window.SilentStacks?.modules?.RequestManager?.populateForm) {
                    window.SilentStacks.modules.RequestManager.populateForm(pubmedData);
                }
                
                this.setStatus('Metadata populated successfully', 'success');
                
                // Display MeSH terms if available
                if (pubmedData.meshHeadings && pubmedData.meshHeadings.length > 0) {
                    this.displayMeSHTerms(pubmedData.meshHeadings);
                }
                
            } catch (error) {
                console.error('PMID lookup error:', error);
                this.setStatus(`PMID lookup failed: ${error.message}`, 'error');
            }
        },
        
        async lookupDOI() {
            const doiInput = document.getElementById('doi');
            if (!doiInput) return;
            
            const doi = doiInput.value.trim();
            if (!doi) {
                this.setStatus('Please enter a DOI', 'error');
                return;
            }
            
            this.setStatus('Looking up DOI...', 'loading');
            
            try {
                const crossrefData = await window.SilentStacksAPI.CrossRefAPI.fetchCrossRef(doi);
                
                // Populate form
                if (window.SilentStacks?.modules?.RequestManager?.populateForm) {
                    window.SilentStacks.modules.RequestManager.populateForm(crossrefData);
                }
                
                this.setStatus('DOI lookup successful!', 'success');
                
            } catch (error) {
                console.error('DOI lookup error:', error);
                this.setStatus(`DOI lookup failed: ${error.message}`, 'error');
            }
        },
        
        setStatus(message, type = '') {
            // Update PMID status
            const pmidStatus = document.getElementById('pmid-status');
            if (pmidStatus) {
                pmidStatus.textContent = message;
                pmidStatus.className = 'status-indicator ' + type;
                pmidStatus.style.display = 'block';
            }
            
            // Update DOI status
            const doiStatus = document.getElementById('doi-status');
            if (doiStatus) {
                doiStatus.textContent = message;
                doiStatus.className = 'status-indicator ' + type;
                doiStatus.style.display = 'block';
            }
            
            // Hide after success
            if (type === 'success') {
                setTimeout(() => {
                    if (pmidStatus) pmidStatus.style.display = 'none';
                    if (doiStatus) doiStatus.style.display = 'none';
                }, 5000);
            }
        },
        
        displayMeSHTerms(meshHeadings) {
            const meshSection = document.getElementById('mesh-section');
            const meshTags = document.getElementById('mesh-tags');
            
            if (meshSection && meshTags) {
                meshSection.style.display = 'block';
                
                const meshHTML = meshHeadings.map(mesh => `
                    <button type="button" class="mesh-tag" onclick="addMeshToTags('${mesh.term.replace(/'/g, "\\'")}')" title="${mesh.isMajorTopic ? 'Major Topic' : 'Minor Topic'}">
                        ${mesh.term} ${mesh.isMajorTopic ? '★' : ''}
                    </button>
                `).join('');
                
                meshTags.innerHTML = meshHTML || '<div class="mesh-empty">No MeSH terms found</div>';
            }
        },
        
        // Initialize (required by app.js)
        initialize() {
            console.log('✅ APIIntegration adapter initialized');
        }
    };
    
    // Register with SilentStacks
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.APIIntegration = APIIntegration;
    
    console.log('✅ APIIntegration module registered');
})();
