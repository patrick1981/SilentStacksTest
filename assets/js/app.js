// Complete SilentStacks App.js with All Critical Fixes Applied + Offline Support
(() => {
  // === Constants & State ===
  const MAX_IMPORT = 100;
  const settings = { followupDays: 5, theme: 'light', apiKey: '', crossrefEmail: '' };
  let requests = [];
  let followupOnly = false;
  let fuse;
  let currentEdit = null;
  let selectedRequests = new Set();
  let globalTags = new Map(); // For tag color customization
  let currentStep = 1;
  const totalSteps = 3;
  let currentSortField = 'createdAt';
  let currentSortDirection = 'desc';

  // === DOM Elements ===
  const els = {
    followupDays: document.getElementById('followup-days'),
    theme: document.getElementById('theme'),
    apiKey: document.getElementById('api-key'),
    crossrefEmail: document.getElementById('crossref-email'),
    status: document.getElementById('lookup-status'),
    pmidInput: document.getElementById('pmid'),
    doiInput: document.getElementById('doi'),
    titleInput: document.getElementById('title'),
    authorsInput: document.getElementById('authors'),
    journalInput: document.getElementById('journal'),
    yearInput: document.getElementById('year'),
    doclineInput: document.getElementById('docline'),
    patronEmailInput: document.getElementById('patron-email'),
    statusSelect: document.getElementById('status'),
    tagsInput: document.getElementById('tags'),
    notesInput: document.getElementById('notes'),
    form: document.getElementById('request-form'),
    clearBtn: document.getElementById('clear-form'),
    search: document.getElementById('search-requests'),
    statusFilter: document.getElementById('filter-status'),
    followupFilter: document.getElementById('filter-followup'),
    importFile: document.getElementById('import-file'),
    exportCsv: document.getElementById('export-csv'),
    exportJson: document.getElementById('export-json'),
    requestList: document.getElementById('request-list'),
    navTabs: document.querySelectorAll('.nav-tab'),
    sections: document.querySelectorAll('.section'),
    stats: {
      total: document.getElementById('total-requests'),
      pending: document.getElementById('pending-requests'),
      fulfilled: document.getElementById('fulfilled-requests'),
      followup: document.getElementById('followup-requests')
    }
  };

  // === Persistence ===
  function loadSettings() {
    try { 
      const saved = localStorage.getItem('silentstacks_settings');
      if (saved) {
        Object.assign(settings, JSON.parse(saved)); 
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    if (els.followupDays) els.followupDays.value = settings.followupDays;
    if (els.theme) els.theme.value = settings.theme;
    if (els.apiKey) els.apiKey.value = settings.apiKey;
    if (els.crossrefEmail) els.crossrefEmail.value = settings.crossrefEmail;
  }

  function loadRequests() {
    try { 
      const saved = localStorage.getItem('silentstacks_requests');
      requests = saved ? JSON.parse(saved) : []; 
    } catch (e) { 
      console.warn('Failed to load requests:', e);
      requests = []; 
    }
  }

  function loadGlobalTags() {
    try {
      const saved = localStorage.getItem('silentstacks_tags');
      if (saved) {
        const tagsArray = JSON.parse(saved);
        globalTags = new Map(tagsArray);
      }
    } catch (e) {
      console.warn('Failed to load tags:', e);
    }
  }

  function saveAll() {
    try {
      localStorage.setItem('silentstacks_settings', JSON.stringify(settings));
      localStorage.setItem('silentstacks_requests', JSON.stringify(requests));
      localStorage.setItem('silentstacks_tags', JSON.stringify([...globalTags]));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  // === Theme & Navigation ===
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }

  function switchSection(tabEl) {
    els.navTabs.forEach(t => t.classList.toggle('active', t === tabEl));
    els.sections.forEach(s => s.classList.toggle('active', s.id === tabEl.dataset.section));
  }

  // === Status UI ===
  function setStatus(message, type = '') {
    if (els.status) {
      els.status.textContent = message;
      els.status.className = ['lookup-status', type].filter(Boolean).join(' ');
    }
  }

  // === OFFLINE-AWARE FETCH FUNCTIONS ===
  async function fetchPubMed(pmid) {
    console.log(`Fetching PubMed data for PMID: ${pmid}`);
    
    // Check if offline and queue the request
    if (window.offlineManager && !window.offlineManager.isOnline) {
      window.offlineManager.queueApiCall('pmid', pmid, null);
      // Return placeholder data immediately
      return {
        pmid: pmid,
        title: `[QUEUED] Article ${pmid} - Will lookup when online`,
        authors: 'Authors will be retrieved when online',
        journal: 'Journal information pending',
        year: 'Year pending',
        doi: 'DOI pending'
      };
    }
    
    try {
      const keyParam = settings.apiKey ? `&api_key=${settings.apiKey}` : '';
      
      // Step 1: Get basic metadata from ESummary
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json${keyParam}`;
      console.log('Fetching summary:', summaryUrl);
      
      const summaryResponse = await fetch(summaryUrl);
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
        doi: '' // Will be filled by EFetch
      };
      
      console.log('Basic metadata:', meta);
      
      // Step 2: Get DOI from EFetch XML
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${keyParam}`;
      console.log('Fetching XML for DOI:', fetchUrl);
      
      const xmlResponse = await fetch(fetchUrl);
      if (!xmlResponse.ok) {
        console.warn(`EFetch failed: ${xmlResponse.status}, continuing without DOI`);
        return meta;
      }
      
      const xmlText = await xmlResponse.text();
      console.log('XML response length:', xmlText.length);
      
      // Parse XML for DOI
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'application/xml');
      
      // Multiple strategies to find DOI
      let doi = '';
      
      // Strategy 1: ArticleId with IdType="doi"
      const doiNode1 = doc.querySelector('ArticleId[IdType="doi"]');
      if (doiNode1) {
        doi = doiNode1.textContent.trim();
        console.log('Found DOI (method 1):', doi);
      }
      
      // Strategy 2: ArticleId containing "10." (DOI prefix)
      if (!doi) {
        const articleIds = doc.querySelectorAll('ArticleId');
        for (const node of articleIds) {
          const text = node.textContent.trim();
          if (text.startsWith('10.')) {
            doi = text;
            console.log('Found DOI (method 2):', doi);
            break;
          }
        }
      }
      
      // Strategy 3: Look in ELocationID with EIdType="doi"
      if (!doi) {
        const elocationNode = doc.querySelector('ELocationID[EIdType="doi"]');
        if (elocationNode) {
          doi = elocationNode.textContent.trim();
          console.log('Found DOI (method 3):', doi);
        }
      }
      
      meta.doi = doi;
      console.log('Final metadata with DOI:', meta);
      
      return meta;
      
    } catch (error) {
      console.error('PubMed fetch error:', error);
      throw new Error(`PubMed lookup failed: ${error.message}`);
    }
  }

  async function fetchCrossRef(doi) {
    console.log(`Fetching CrossRef data for DOI: ${doi}`);
    
    // Check if offline and queue the request
    if (window.offlineManager && !window.offlineManager.isOnline) {
      window.offlineManager.queueApiCall('doi', doi, null);
      // Return placeholder data immediately
      return {
        doi: doi,
        title: `[QUEUED] Article with DOI ${doi} - Will lookup when online`,
        authors: 'Authors will be retrieved when online',
        journal: 'Journal information pending',
        year: 'Year pending',
        pmid: 'PMID pending'
      };
    }
    
    try {
      // Normalize DOI (remove URL prefixes)
      const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '').trim();
      console.log('Cleaned DOI:', cleanDoi);
      
      const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;
      console.log('CrossRef URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
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
        pmid: '' // Will be filled by PubMed search
      };
      
      console.log('CrossRef metadata:', meta);
      return meta;
      
    } catch (error) {
      console.error('CrossRef fetch error:', error);
      throw new Error(`CrossRef lookup failed: ${error.message}`);
    }
  }

  // === Form Population ===
  function populateForm(meta) {
    const fieldMap = {
      pmid: 'pmid',
      doi: 'doi',
      title: 'title',
      authors: 'authors',
      journal: 'journal',
      year: 'year',
      docline: 'docline',
      'patron-email': 'patronEmail',
      status: 'status',
      tags: 'tags',
      notes: 'notes',
      priority: 'priority'
    };

    Object.entries(fieldMap).forEach(([fieldId, metaKey]) => {
      const el = document.getElementById(fieldId);
      if (el && meta.hasOwnProperty(metaKey)) {
        let value = meta[metaKey];
        if (Array.isArray(value)) {
          value = value.join(', ');
        }
        el.value = value || '';
      }
    });
  }

  // === LOOKUP HANDLERS ===
  async function onLookupPMID() {
    const pmid = els.pmidInput.value.trim();
    if (!pmid) {
      setStatus('Please enter a PMID', 'error');
      return;
    }
    
    if (!/^\d+$/.test(pmid)) {
      setStatus('PMID must be numeric', 'error');
      return;
    }
    
    setStatus('Looking up PMID...', 'loading');
    
    try {
      const pubmedData = await fetchPubMed(pmid);
      
      // Populate form with PubMed data
      populateForm(pubmedData);
      
      // Success message with DOI status
      if (pubmedData.doi && !pubmedData.doi.includes('pending')) {
        setStatus(`Metadata populated successfully. DOI found: ${pubmedData.doi}`, 'success');
      } else if (pubmedData.title.includes('[QUEUED]')) {
        setStatus('Request queued for when online. Placeholder data populated.', 'loading');
      } else {
        setStatus('Metadata populated successfully. No DOI found for this article.', 'success');
      }
      
    } catch (error) {
      console.error('PMID lookup error:', error);
      setStatus(`PMID lookup failed: ${error.message}`, 'error');
    }
  }

  async function onLookupDOI() {
    const doi = els.doiInput.value.trim();
    if (!doi) {
      setStatus('Please enter a DOI', 'error');
      return;
    }
    
    setStatus('Looking up DOI...', 'loading');
    
    try {
      const crossrefData = await fetchCrossRef(doi);
      populateForm(crossrefData);
      
      if (crossrefData.title.includes('[QUEUED]')) {
        setStatus('Request queued for when online. Placeholder data populated.', 'loading');
      } else {
        setStatus('DOI lookup successful!', 'success');
      }
    } catch (error) {
      console.error('DOI lookup error:', error);
      setStatus(`DOI lookup failed: ${error.message}`, 'error');
    }
  }

  // === CRITICAL FIX: Dynamic Status Color Updates ===
  window.quickStatusChange = (index, newStatus) => {
    if (requests[index]) {
      requests[index].status = newStatus;
      requests[index].updatedAt = new Date().toISOString();
      saveAll();
      renderStats();
      
      // Update the visual status immediately
      const statusSelect = document.querySelector(`[data-index="${index}"] .request-status-select`);
      if (statusSelect) {
        // Remove all status classes
        statusSelect.classList.remove('status-pending', 'status-in-progress', 'status-fulfilled', 'status-cancelled');
        // Add new status class
        statusSelect.classList.add(`status-${newStatus}`);
      }
    }
  };

  // === ENHANCED CARD WITH PRIORITY INDICATORS ===
  function createEnhancedCard(r, index) {
    const tags = (r.tags || []).map(t => {
      const tagColor = globalTags.get(t) || 'default';
      return `<span class="tag tag-color-${tagColor} tag-colorable" onclick="openTagColorPicker('${t}', this)" title="Click to change color">${t}</span>`;
    }).join('');
    
    const followupCls = needsFollowUp(r) ? ' needs-followup' : '';
    const selectedCls = selectedRequests.has(index) ? ' selected' : '';
    const createdDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';
    const priorityBadge = r.priority ? `<span class="priority-badge ${r.priority}">${r.priority.toUpperCase()}</span>` : '';
    
    // Priority indicator for visual scanning - FIXED
    const priorityIndicator = r.priority ? `<div class="priority-indicator ${r.priority}" title="${r.priority.toUpperCase()} Priority" aria-label="${r.priority} priority"></div>` : '<div class="priority-indicator normal" title="Normal Priority" aria-label="normal priority"></div>';
    
    return `
      <div class="request-card${followupCls}${selectedCls}" data-index="${index}" style="position: relative;">
        ${priorityIndicator}
        <div class="request-header">
          <div class="request-checkbox">
            <input type="checkbox" ${selectedRequests.has(index) ? 'checked' : ''} 
                   onchange="toggleRequestSelection(${index}, this.checked)"
                   aria-label="Select request">
          </div>
          <div class="request-main">
            <div class="request-title">${r.title || 'Untitled'} ${priorityBadge}</div>
            <div class="request-meta">
              ${r.authors || ''} • ${r.journal || ''} (${r.year || ''})
              ${r.pmid ? ` • PMID: ${r.pmid}` : ''}
              ${r.doi ? ` • DOI: ${r.doi}` : ''}
            </div>
            <div class="request-details">
              ${r.patronEmail ? `👤 ${r.patronEmail}` : ''}
              ${createdDate ? ` • 📅 ${createdDate}` : ''}
              ${needsFollowUp(r) ? ' • ⚠️ Follow-up needed' : ''}
            </div>
          </div>
          <div class="request-status-container">
            <select class="request-status-select status-${r.status}" 
                    onchange="quickStatusChange(${index}, this.value)" 
                    value="${r.status}"
                    aria-label="Change request status">
              <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="in-progress" ${r.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="fulfilled" ${r.status === 'fulfilled' ? 'selected' : ''}>Fulfilled</option>
              <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>
        ${tags ? `<div class="request-tags">${tags}</div>` : ''}
        ${r.notes ? `<div class="request-notes">📝 ${r.notes}</div>` : ''}
        <div class="request-actions">
          <button onclick="duplicateRequest(${index})" class="btn btn-secondary btn-small" aria-label="Duplicate request">📋 Duplicate</button>
          <button onclick="editRequest(${index})" class="btn btn-secondary btn-small" aria-label="Edit request">✏️ Edit</button>
          <button onclick="deleteRequest(${index})" class="btn btn-secondary btn-small" aria-label="Delete request">🗑️ Delete</button>
        </div>
      </div>
    `;
  }

  // === TAG COLOR PICKER FUNCTIONALITY ===
  window.openTagColorPicker = (tagName, element) => {
    // Remove any existing color pickers
    document.querySelectorAll('.tag-color-picker').forEach(picker => picker.remove());
    
    const currentColor = globalTags.get(tagName) || 'default';
    
    const colorPicker = document.createElement('div');
    colorPicker.className = 'tag-color-picker';
    colorPicker.setAttribute('role', 'dialog');
    colorPicker.setAttribute('aria-label', `Choose color for tag: ${tagName}`);
    
    // Enhanced color palette with 8 colors + default
    const colors = [
      { id: '1', name: 'Red', hex: '#e74c3c' },
      { id: '2', name: 'Orange', hex: '#f39c12' },
      { id: '3', name: 'Green', hex: '#27ae60' },
      { id: '4', name: 'Blue', hex: '#3498db' },
      { id: '5', name: 'Purple', hex: '#9b59b6' },
      { id: '6', name: 'Pink', hex: '#e91e63' },
      { id: '7', name: 'Cyan', hex: '#00bcd4' },
      { id: '8', name: 'Orange Red', hex: '#ff5722' },
      { id: 'default', name: 'Default', hex: 'transparent' }
    ];
    
    colorPicker.innerHTML = colors.map(color => `
      <div class="color-option color-${color.id} ${currentColor === color.id ? 'selected' : ''}" 
           onclick="setTagColor('${tagName}', '${color.id}')" 
           onkeydown="handleColorKeydown(event, '${tagName}', '${color.id}')"
           tabindex="0"
           title="${color.name}"
           aria-label="Set tag color to ${color.name}"
           data-color="${color.id}">
      </div>
    `).join('');
    
    // Position the picker
    const rect = element.getBoundingClientRect();
    const container = element.closest('.request-card') || element.parentNode;
    container.style.position = 'relative';
    container.appendChild(colorPicker);
    
    // Position picker relative to tag
    const pickerRect = colorPicker.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Adjust position to keep picker in viewport
    let top = rect.bottom - containerRect.top + 5;
    let left = rect.left - containerRect.left;
    
    // Prevent picker from going off-screen
    if (left + pickerRect.width > window.innerWidth - 20) {
      left = rect.right - containerRect.left - pickerRect.width;
    }
    
    if (top + pickerRect.height > window.innerHeight - 20) {
      top = rect.top - containerRect.top - pickerRect.height - 5;
    }
    
    colorPicker.style.top = `${top}px`;
    colorPicker.style.left = `${left}px`;
    
    // Activate with animation
    setTimeout(() => {
      colorPicker.classList.add('active');
      
      // Focus the current color or first option
      const currentOption = colorPicker.querySelector('.selected') || colorPicker.querySelector('.color-option');
      if (currentOption) {
        currentOption.focus();
      }
    }, 10);
    
    // Close picker when clicking elsewhere or pressing Escape
    setTimeout(() => {
      const closeHandler = (e) => {
        if (e.type === 'keydown' && e.key !== 'Escape') return;
        if (e.type === 'click' && colorPicker.contains(e.target)) return;
        
        colorPicker.classList.remove('active');
        setTimeout(() => {
          if (colorPicker.parentNode) {
            colorPicker.remove();
          }
        }, 200);
        
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('keydown', closeHandler);
      };
      
      document.addEventListener('click', closeHandler);
      document.addEventListener('keydown', closeHandler);
    }, 100);
  };

  window.setTagColor = (tagName, colorId) => {
    // Validate color ID
    const validColors = ['1', '2', '3', '4', '5', '6', '7', '8', 'default'];
    if (!validColors.includes(colorId)) {
      console.warn('Invalid color ID:', colorId);
      colorId = 'default';
    }
    
    // Update global tags map
    globalTags.set(tagName, colorId);
    
    // CRITICAL: Save data to localStorage
    saveAll();
    
    // CRITICAL: Re-render to apply new colors immediately
    renderRequests();
    renderRecentRequests(); // Also update recent requests if they have tags
    
    // Show brief feedback to user
    showTagColorFeedback(tagName, colorId);
    
    // Remove the color picker with animation
    const picker = document.querySelector('.tag-color-picker');
    if (picker) {
      picker.classList.remove('active');
      setTimeout(() => {
        if (picker.parentNode) {
          picker.remove();
        }
      }, 200);
    }
    
    console.log(`✅ Tag "${tagName}" color changed to ${colorId}`);
  };

  // Keyboard navigation for color picker
  window.handleColorKeydown = (event, tagName, colorId) => {
    const picker = event.target.closest('.tag-color-picker');
    const options = Array.from(picker.querySelectorAll('.color-option'));
    const currentIndex = options.indexOf(event.target);
    
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (currentIndex + 1) % options.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        newIndex = (currentIndex - 1 + options.length) % options.length;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        setTagColor(tagName, colorId);
        return;
      case 'Escape':
        event.preventDefault();
        picker.classList.remove('active');
        setTimeout(() => picker.remove(), 200);
        return;
      default:
        return;
    }
    
    options[newIndex].focus();
  };

  // Feedback notification for color changes
  function showTagColorFeedback(tagName, colorId) {
    const colorNames = {
      '1': 'Red', '2': 'Orange', '3': 'Green', '4': 'Blue',
      '5': 'Purple', '6': 'Pink', '7': 'Cyan', '8': 'Orange Red',
      'default': 'Default'
    };
    
    const feedback = document.createElement('div');
    feedback.className = 'tag-color-feedback';
    feedback.innerHTML = `
      <div class="feedback-content">
        <span class="tag tag-color-${colorId}">${tagName}</span>
        <span class="feedback-text">Color changed to ${colorNames[colorId]}</span>
      </div>
    `;
    
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: var(--bg-card);
      border: 2px solid var(--primary-color);
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    // Animate in
    setTimeout(() => {
      feedback.style.opacity = '1';
      feedback.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translateX(100px)';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.remove();
        }
      }, 300);
    }, 2000);
  }

  // === PROGRESS STEP NAVIGATION FUNCTIONALITY ===
  
  // Initialize progress step navigation
  function initProgressStepNavigation() {
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.querySelector('.progress-fill');
    
    if (!progressSteps.length) return;
    
    // Add click handlers to progress steps
    progressSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      
      // Make steps clickable
      step.style.cursor = 'pointer';
      step.setAttribute('tabindex', '0');
      step.setAttribute('role', 'button');
      step.setAttribute('aria-label', `Go to step ${stepNumber}: ${step.querySelector('.step-label').textContent}`);
      
      // Click handler
      step.addEventListener('click', () => {
        navigateToStep(stepNumber);
      });
      
      // Keyboard handler
      step.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigateToStep(stepNumber);
        }
      });
      
      // Hover effects
      step.addEventListener('mouseenter', () => {
        if (stepNumber !== currentStep) {
          step.style.transform = 'translateY(-2px)';
        }
      });
      
      step.addEventListener('mouseleave', () => {
        step.style.transform = '';
      });
    });
    
    // Initialize first step
    updateProgressDisplay();
    
    // Add form field change listeners to auto-advance
    setupAutoProgress();
  }

  // Navigate to specific step
  function navigateToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > totalSteps) return;
    
    const targetSection = getStepSection(stepNumber);
    if (!targetSection) return;
    
    // Update current step
    currentStep = stepNumber;
    
    // Smooth scroll to target section
    targetSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    
    // Update visual progress
    updateProgressDisplay();
    
    // Focus management
    setTimeout(() => {
      const firstInput = targetSection.querySelector('input, select, textarea');
      if (firstInput && !firstInput.disabled) {
        firstInput.focus();
      }
    }, 500);
    
    // Announce to screen readers
    announceStepChange(stepNumber);
  }

  // Get section element for step
  function getStepSection(stepNumber) {
    const stepMappings = {
      1: '#identifiers-section',
      2: '#details-section',
      3: '#request-section'
    };
    
    const sectionId = stepMappings[stepNumber];
    return sectionId ? document.querySelector(sectionId) : null;
  }

  // Update progress visual display
  function updateProgressDisplay() {
    const progressSteps = document.querySelectorAll('.progress-step');
    const progressFill = document.querySelector('.progress-fill');
    const progressBar = document.querySelector('.form-progress');
    
    if (!progressSteps.length) return;
    
    // Update step states
    progressSteps.forEach((step, index) => {
      const stepNumber = index + 1;
      const stepNumberEl = step.querySelector('.step-number');
      const stepLabelEl = step.querySelector('.step-label');
      
      // Remove all state classes
      step.classList.remove('active', 'completed');
      stepNumberEl.classList.remove('completed');
      
      if (stepNumber < currentStep) {
        // Completed step
        step.classList.add('completed');
        stepNumberEl.classList.add('completed');
        stepNumberEl.innerHTML = '✓';
        step.setAttribute('aria-label', `Completed step ${stepNumber}: ${stepLabelEl.textContent}`);
      } else if (stepNumber === currentStep) {
        // Current active step
        step.classList.add('active');
        stepNumberEl.innerHTML = stepNumber;
        step.setAttribute('aria-label', `Current step ${stepNumber}: ${stepLabelEl.textContent}`);
      } else {
        // Future step
        stepNumberEl.innerHTML = stepNumber;
        step.setAttribute('aria-label', `Step ${stepNumber}: ${stepLabelEl.textContent} (not yet reached)`);
      }
    });
    
    // Update progress bar fill
    if (progressFill) {
      const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
      progressFill.style.width = `${progressPercentage}%`;
    }
    
    // Update progress bar ARIA attributes
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', currentStep);
      progressBar.setAttribute('aria-valuetext', `Step ${currentStep} of ${totalSteps}`);
    }
  }

  // Auto-progress based on form completion
  function setupAutoProgress() {
    // Monitor identifiers section
    const pmidInput = document.getElementById('pmid');
    const doiInput = document.getElementById('doi');
    const titleInput = document.getElementById('title');
    
    // Auto-advance from step 1 when PMID/DOI lookup succeeds or title is entered
    const checkStep1Completion = () => {
      if (currentStep === 1) {
        const hasIdentifier = (pmidInput && pmidInput.value.trim()) || 
                             (doiInput && doiInput.value.trim());
        const hasTitle = titleInput && titleInput.value.trim();
        
        if ((hasIdentifier || hasTitle) && titleInput && titleInput.value.trim()) {
          setTimeout(() => {
            if (currentStep === 1) { // Still on step 1
              navigateToStep(2);
            }
          }, 1000); // Small delay to allow user to see the populated data
        }
      }
    };
    
    // Auto-advance from step 2 when key details are filled
    const checkStep2Completion = () => {
      if (currentStep === 2) {
        const title = titleInput && titleInput.value.trim();
        const authors = document.getElementById('authors') && document.getElementById('authors').value.trim();
        const journal = document.getElementById('journal') && document.getElementById('journal').value.trim();
        
        if (title && (authors || journal)) {
          setTimeout(() => {
            if (currentStep === 2) { // Still on step 2
              navigateToStep(3);
            }
          }, 500);
        }
      }
    };
    
    // Add event listeners
    if (pmidInput) pmidInput.addEventListener('input', checkStep1Completion);
    if (doiInput) doiInput.addEventListener('input', checkStep1Completion);
    if (titleInput) {
      titleInput.addEventListener('input', () => {
        checkStep1Completion();
        checkStep2Completion();
      });
    }
    
    const authorsInput = document.getElementById('authors');
    const journalInput = document.getElementById('journal');
    
    if (authorsInput) authorsInput.addEventListener('input', checkStep2Completion);
    if (journalInput) journalInput.addEventListener('input', checkStep2Completion);
    
    // Monitor successful API lookups
    const originalSetStatus = window.setStatus || setStatus;
    window.setStatus = function(message, type) {
      if (originalSetStatus) originalSetStatus(message, type);
      
      // Auto-advance on successful lookup
      if (type === 'success' && message.includes('successfully') && currentStep === 1) {
        setTimeout(() => {
          if (currentStep === 1) {
            navigateToStep(2);
          }
        }, 1500);
      }
    };
  }

  // Screen reader announcements
  function announceStepChange(stepNumber) {
    const stepLabels = {
      1: 'Identifiers',
      2: 'Publication Details', 
      3: 'Request Details'
    };
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Now on step ${stepNumber}: ${stepLabels[stepNumber]}`;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // === ENHANCED SEARCH INCLUDING TAGS ===
  function initEnhancedSearch() {
    if (window.Fuse && requests.length > 0) {
      fuse = new Fuse(requests, { 
        keys: [
          { name: 'title', weight: 3 },
          { name: 'authors', weight: 2 },
          { name: 'journal', weight: 2 },
          { name: 'tags', weight: 2 }, // Increased weight for tag search
          { name: 'notes', weight: 1 },
          { name: 'pmid', weight: 2 },
          { name: 'doi', weight: 2 },
          { name: 'patronEmail', weight: 1 },
          { name: 'priority', weight: 1.5 }
        ],
        threshold: 0.3,
        includeScore: true,
        // Enable searching within arrays (for tags)
        ignoreLocation: true,
        useExtendedSearch: true
      }); 
    }
  }
function updateProgress(progressDiv, percentage, message, isError = false) {
  if (!progressDiv) return;
  
  const progressFill = progressDiv.querySelector('.progress-bar-fill');
  const progressText = progressDiv.querySelector('.progress-text');
  
  if (progressFill) {
    progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    
    // Change color based on status
    if (isError) {
      progressFill.style.background = 'var(--danger-color)';
    } else if (percentage >= 100) {
      progressFill.style.background = 'var(--success-color)';
    } else {
      progressFill.style.background = 'var(--primary-color)';
    }
  }
  
  if (progressText) {
    progressText.textContent = message;
    
    // Update text color for errors
    if (isError) {
      progressText.style.color = 'var(--danger-color)';
    } else if (percentage >= 100) {
      progressText.style.color = 'var(--success-color)';
    } else {
      progressText.style.color = 'var(--text-secondary)';
    }
  }
}
  // === BULK PASTE FUNCTIONALITY ===
    // Enhanced bulk paste with API lookups
async function handleBulkPasteWithLookup() {
  const textarea = document.getElementById('bulk-paste-data');
  if (!textarea) {
    console.error('Bulk paste textarea not found');
    return;
  }
  
  const data = textarea.value.trim();
  
  if (!data) {
    alert('Please paste some data first');
    return;
  }
  
  // Remove any existing progress indicators
  const existingProgress = document.getElementById('import-progress');
  if (existingProgress) {
    existingProgress.remove();
  }
  
  // Show progress indicator
  const progressDiv = document.createElement('div');
  progressDiv.id = 'import-progress';
  progressDiv.innerHTML = `
    <div class="progress-container">
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: 0%"></div>
      </div>
      <div class="progress-text">Preparing import...</div>
    </div>
  `;
  
  // Insert after the textarea
  textarea.parentNode.insertBefore(progressDiv, textarea.nextSibling);
  
  try {
    updateProgress(progressDiv, 5, 'Parsing data...');
    
    // Parse the data
    const results = Papa.parse(data, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      delimitersToGuess: [',', '\t', '|', ';']
    });
    
    if (!results.data || results.data.length === 0) {
      throw new Error('No valid data found. Check your CSV format and headers.');
    }
    
    updateProgress(progressDiv, 10, `Found ${results.data.length} rows to process...`);
    
    const importedRequests = [];
    const total = results.data.length;
    let processed = 0;
    
    // Process each row with API lookups
    for (let i = 0; i < results.data.length; i++) {
      const row = results.data[i];
      processed++;
      
      const baseProgress = 10 + ((processed / total) * 80); // 10-90% range
      updateProgress(progressDiv, baseProgress, `Processing row ${processed} of ${total}...`);
      
      // Build request data with all possible field mappings
      let requestData = {
        pmid: String(row.pmid || row.PMID || '').trim(),
        doi: String(row.doi || row.DOI || '').trim(),
        title: String(row.title || row.Title || '').trim(),
        authors: String(row.authors || row.Authors || '').trim(),
        journal: String(row.journal || row.Journal || '').trim(),
        year: String(row.year || row.Year || '').trim(),
        priority: String(row.priority || row.Priority || 'normal').toLowerCase().trim(),
        status: String(row.status || row.Status || 'pending').toLowerCase().trim(),
        patronEmail: String(row.patronEmail || row.PatronEmail || row['patron-email'] || '').trim(),
        docline: String(row.docline || row.Docline || row.DOCLINE || '').trim(),
        notes: String(row.notes || row.Notes || '').trim(),
        tags: [],
        createdAt: new Date().toISOString()
      };
      
      // Parse tags from various possible formats
      const tagString = String(row.tags || row.Tags || '').trim();
      if (tagString) {
        requestData.tags = tagString.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
      }
      
      // Validate priority
      if (!['urgent', 'rush', 'normal'].includes(requestData.priority)) {
        requestData.priority = 'normal';
      }
      
      // Validate status
      if (!['pending', 'in-progress', 'fulfilled', 'cancelled'].includes(requestData.status)) {
        requestData.status = 'pending';
      }
      
      // Try to fetch metadata if we have PMID or DOI but missing other data
      const needsMetadata = !requestData.title || !requestData.authors || !requestData.journal;
      
      if (needsMetadata && (requestData.pmid || requestData.doi)) {
        try {
          let metadata = null;
          
          if (requestData.pmid) {
            updateProgress(progressDiv, baseProgress, `Fetching PMID ${requestData.pmid}... (${processed}/${total})`);
            metadata = await fetchPubMed(requestData.pmid);
            
            // Small delay to be API-friendly
            await new Promise(resolve => setTimeout(resolve, 200));
          } else if (requestData.doi) {
            updateProgress(progressDiv, baseProgress, `Fetching DOI ${requestData.doi}... (${processed}/${total})`);
            metadata = await fetchCrossRef(requestData.doi);
            
            // Small delay to be API-friendly
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          if (metadata) {
            // Merge fetched metadata with existing data (existing data takes precedence)
            requestData = {
              ...metadata,
              ...Object.fromEntries(Object.entries(requestData).filter(([_, v]) => v !== ''))
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch metadata for row ${i + 1}:`, error);
          // Continue with the data we have
        }
      }
      
      // Only add if we have at least a title or identifier
      if (requestData.title || requestData.pmid || requestData.doi) {
        // Update global tags map with any new tags
        requestData.tags.forEach(tag => {
          if (!globalTags.has(tag)) {
            globalTags.set(tag, 'default');
          }
        });
        
        importedRequests.push(requestData);
      } else {
        console.warn(`Skipping row ${i + 1}: No title or identifier found`);
      }
    }
    
    updateProgress(progressDiv, 90, 'Saving imported requests...');
    
    if (importedRequests.length > 0) {
      requests.push(...importedRequests);
      saveAll();
      renderAll();
      textarea.value = '';
      
      updateProgress(progressDiv, 100, `✅ Successfully imported ${importedRequests.length} requests!`);
      
      // Auto-remove progress after 5 seconds
      setTimeout(() => {
        if (progressDiv.parentNode) {
          progressDiv.remove();
        }
      }, 5000);
      
      // Show success alert
      setTimeout(() => {
        alert(`Import complete!\n\n✅ ${importedRequests.length} requests imported\n📊 ${total - importedRequests.length} rows skipped (missing required data)\n\nCheck the Dashboard or All Requests tab to see your imported data.`);
      }, 500);
      
    } else {
      throw new Error(`No valid requests found in ${total} rows. Please check your data format and ensure you have Title, PMID, or DOI columns.`);
    }
    
  } catch (error) {
    console.error('Bulk paste error:', error);
    updateProgress(progressDiv, 0, `❌ Error: ${error.message}`, true);
    
    // Auto-remove progress after 10 seconds on error
    setTimeout(() => {
      if (progressDiv.parentNode) {
        progressDiv.remove();
      }
    }, 10000);
    
    // Show error alert
    setTimeout(() => {
      alert(`Import failed!\n\n❌ ${error.message}\n\nPlease check your data format and try again. Make sure you have proper CSV headers like:\nPMID, DOI, Title, Authors, Journal, Year`);
    }, 500);
  }
}

  // === ACCESSIBILITY ENHANCEMENTS ===
  function enhanceAccessibility() {
    // Add ARIA labels to all interactive elements
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      if (btn.textContent.trim()) {
        btn.setAttribute('aria-label', btn.textContent.trim());
      }
    });
    
    // Add role attributes
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.setAttribute('role', 'tab');
    });
    
    document.querySelectorAll('.section').forEach(section => {
      section.setAttribute('role', 'tabpanel');
    });
    
    // Add skip navigation
    if (!document.getElementById('skip-nav')) {
      const skipNav = document.createElement('a');
      skipNav.id = 'skip-nav';
      skipNav.href = '#main-content';
      skipNav.textContent = 'Skip to main content';
      skipNav.className = 'sr-only';
      skipNav.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 9999;
      `;
      skipNav.addEventListener('focus', () => {
        skipNav.style.top = '6px';
      });
      skipNav.addEventListener('blur', () => {
        skipNav.style.top = '-40px';
      });
      document.body.insertBefore(skipNav, document.body.firstChild);
    }
    
    // Ensure main content has proper ID
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.id = 'main-content';
    }
  }

  // === Request Selection & Bulk Operations ===
  window.toggleRequestSelection = (index, checked) => {
    if (checked) {
      selectedRequests.add(index);
    } else {
      selectedRequests.delete(index);
    }
    renderRequests();
  };

  window.duplicateRequest = (index) => {
    const original = requests[index];
    if (original) {
      const duplicate = {
        ...original,
        title: `${original.title} (Copy)`,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      requests.unshift(duplicate);
      saveAll();
      renderAll();
    }
  };

  // === SELECT ALL FUNCTIONALITY ===
  window.toggleSelectAll = (checked) => {
    // Get all currently visible request cards
    const visibleCards = document.querySelectorAll('.request-card[data-index]');
    
    if (checked) {
      // Select all visible requests
      visibleCards.forEach(card => {
        const index = parseInt(card.dataset.index);
        selectedRequests.add(index);
      });
    } else {
      // Deselect all
      selectedRequests.clear();
    }
    
    renderRequests();
  };
    
  function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all');
    const deleteBtn = document.getElementById('delete-selected-btn');
    const visibleCards = document.querySelectorAll('.request-card[data-index]');
    const visibleCount = visibleCards.length;
    
    // Count how many visible cards are selected
    let selectedVisibleCount = 0;
    visibleCards.forEach(card => {
      const index = parseInt(card.dataset.index);
      if (selectedRequests.has(index)) {
        selectedVisibleCount++;
      }
    });
    
    if (selectAllCheckbox) {
      if (selectedVisibleCount === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      } else if (selectedVisibleCount === visibleCount) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      }
    }
    
    // Show/hide delete button
    if (deleteBtn) {
      deleteBtn.style.display = selectedRequests.size > 0 ? 'inline-flex' : 'none';
    }
    
    // Update results count
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      resultsCount.textContent = `${visibleCount} requests`;
      if (selectedRequests.size > 0) {
        resultsCount.textContent += ` (${selectedRequests.size} selected)`;
      }
    }
  }

  // === BULK DELETE FUNCTIONALITY ===
  window.deleteSelectedRequests = () => {
    if (selectedRequests.size === 0) {
      alert('No requests selected');
      return;
    }
    
    if (!confirm(`Delete ${selectedRequests.size} selected requests? This cannot be undone.`)) {
      return;
    }
    
    // Convert to array and sort in descending order to avoid index issues
    const indicesToDelete = Array.from(selectedRequests).sort((a, b) => b - a);
    
    indicesToDelete.forEach(index => {
      requests.splice(index, 1);
    });
    
    selectedRequests.clear();
    saveAll();
    renderAll();
    
    alert(`✅ Deleted ${indicesToDelete.length} requests successfully`);
  };

  // === Other Handlers ===
  function onSettingsSave(e) {
    e.preventDefault();
    settings.followupDays = +els.followupDays.value;
    settings.theme = els.theme.value;
    settings.apiKey = els.apiKey.value.trim();
    settings.crossrefEmail = els.crossrefEmail.value.trim();
    saveAll(); 
    applyTheme(); 
    setStatus('Settings saved!', 'success'); 
    renderAll();
  }

  function onFormSubmit(e) {
    e.preventDefault();
    const entry = {
      pmid: els.pmidInput.value.trim(),
      doi: els.doiInput.value.trim(),
      docline: els.doclineInput.value.trim(),
      title: els.titleInput.value.trim(),
      authors: els.authorsInput.value.trim(),
      journal: els.journalInput.value.trim(),
      year: els.yearInput.value.trim(),
      patronEmail: els.patronEmailInput.value.trim(),
      status: els.statusSelect.value,
      tags: els.tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
      notes: els.notesInput.value.trim(),
      priority: document.getElementById('priority')?.value || 'normal',
      createdAt: new Date().toISOString()
    };
    
    // Update global tags map with any new tags
    entry.tags.forEach(tag => {
      if (!globalTags.has(tag)) {
        globalTags.set(tag, 'default');
      }
    });
    
    if (currentEdit != null) { 
      requests[currentEdit] = entry; 
      currentEdit = null; 
    } else { 
      requests.unshift(entry); 
    }
    
    saveAll(); 
    renderAll(); 
    els.form.reset();
    setStatus('Request saved successfully!', 'success');
  }

  // === Rendering ===
  function initFuse() { 
    initEnhancedSearch();
  }
  
  function needsFollowUp(r) { 
    return (Date.now() - new Date(r.createdAt)) / 86400000 > settings.followupDays && r.status === 'pending'; 
  }
  
  function renderStats() {
    if (els.stats.total) els.stats.total.textContent = requests.length;
    if (els.stats.pending) els.stats.pending.textContent = requests.filter(r => r.status === 'pending').length;
    if (els.stats.fulfilled) els.stats.fulfilled.textContent = requests.filter(r => r.status === 'fulfilled').length;
    if (els.stats.followup) els.stats.followup.textContent = requests.filter(needsFollowUp).length;
  }
  
  function renderRequests() {
    if (!els.requestList) return;
    
    const q = els.search ? els.search.value.trim() : '';
    let filteredRequests = [];
    
    // Apply search filter
    if (q && fuse) {
      filteredRequests = fuse.search(q).map(result => ({
        request: result.item,
        originalIndex: requests.indexOf(result.item)
      }));
    } else {
      filteredRequests = requests.map((request, index) => ({
        request: request,
        originalIndex: index
      }));
    }
    
    // Apply status filter
    if (els.statusFilter && els.statusFilter.value) {
      filteredRequests = filteredRequests.filter(item => item.request.status === els.statusFilter.value);
    }
    
    // Apply priority filter
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter && priorityFilter.value) {
      filteredRequests = filteredRequests.filter(item => 
        (item.request.priority || 'normal') === priorityFilter.value
      );
    }
    
    // Apply follow-up filter
    if (followupOnly) {
      filteredRequests = filteredRequests.filter(item => needsFollowUp(item.request));
    }
    
    // Apply sorting
    filteredRequests.sort((a, b) => {
      let aVal = a.request[currentSortField];
      let bVal = b.request[currentSortField];
      
      // Handle special cases
      if (currentSortField === 'createdAt') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else if (currentSortField === 'priority') {
        // Priority order: urgent > rush > normal
        const priorityOrder = { urgent: 3, rush: 2, normal: 1 };
        aVal = priorityOrder[aVal || 'normal'];
        bVal = priorityOrder[bVal || 'normal'];
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      
      // Handle undefined/null values
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      return currentSortDirection === 'desc' ? -comparison : comparison;
    });
    
    // Render the cards
    els.requestList.innerHTML = filteredRequests.length
      ? filteredRequests.map(item => createEnhancedCard(item.request, item.originalIndex)).join('')
      : '<p class="empty-message">No requests found</p>';
    
    updateSelectAllState();
  }

  function initSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    
    sortButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.getAttribute('data-field');
        
        // Toggle direction if same field, otherwise default to desc
        if (currentSortField === field) {
          currentSortDirection = currentSortDirection === 'desc' ? 'asc' : 'desc';
        } else {
          currentSortField = field;
          currentSortDirection = 'desc';
        }
        
        // Update visual indicators
        updateSortButtons();
        
        // Re-render with new sort
        renderRequests();
      });
    });
  }

  function updateSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    
    sortButtons.forEach(btn => {
      const field = btn.getAttribute('data-field');
      
      // Remove all sort classes
      btn.classList.remove('sort-asc', 'sort-desc');
      
      // Add appropriate class for current field
      if (field === currentSortField) {
        btn.classList.add(`sort-${currentSortDirection}`);
      }
    });
  }

  // === RENDER RECENT REQUESTS FOR DASHBOARD ===
  function renderRecentRequests() {
    const recentContainer = document.getElementById('recent-requests');
    if (!recentContainer) return;
    
    // Get 5 most recent requests
    const recentRequests = requests
      .slice(0, 5)
      .map((r, index) => ({
        request: r,
        originalIndex: index
      }));
    
    if (recentRequests.length === 0) {
      recentContainer.innerHTML = '<p class="empty-message">No recent requests</p>';
      return;
    }
    
    recentContainer.innerHTML = recentRequests.map(item => {
      const r = item.request;
      const index = item.originalIndex;
      const createdDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';
      const priorityBadge = r.priority ? `<span class="priority-badge ${r.priority}">${r.priority.toUpperCase()}</span>` : '';
      
      return `
        <div class="recent-request-card">
          <div class="recent-title">${r.title || 'Untitled'} ${priorityBadge}</div>
          <div class="recent-meta">
            ${r.authors || ''} • ${r.journal || ''} (${r.year || ''})
            ${createdDate ? ` • ${createdDate}` : ''}
          </div>
          <div class="recent-status status-${r.status}">${r.status.replace('-', ' ').toUpperCase()}</div>
        </div>
      `;
    }).join('');
  }
    
  function createCard(r, i) {
    return createEnhancedCard(r, i);
  }
  
  // Global functions for buttons
  window.editRequest = i => { 
    const r = requests[i]; 
    currentEdit = i; 
    populateForm(r); 
    
    // Switch to add request tab
    const addTab = document.querySelector('[data-section="add-request"]');
    if (addTab) switchSection(addTab);
  };
  
  window.deleteRequest = i => { 
    if (confirm('Delete this request?')) { 
      requests.splice(i,1); 
      saveAll(); 
      renderAll(); 
    } 
  };
  
  function renderAll() { 
    initFuse(); 
    renderStats(); 
    renderRequests();
    renderRecentRequests();
  }

  // === Export/Import Handlers ===
  function handleExportCSV() {
    if (requests.length === 0) {
      alert('No requests to export');
      return;
    }
    
    const headers = ['PMID', 'DOI', 'Title', 'Authors', 'Journal', 'Year', 'Status', 'Priority', 'Tags', 'Notes', 'Created'];
    const rows = requests.map(r => [
      r.pmid || '',
      r.doi || '',
      r.title || '',
      r.authors || '',
      r.journal || '',
      r.year || '',
      r.status || '',
      r.priority || 'normal',
      (r.tags || []).join('; '),
      r.notes || '',
      r.createdAt || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silentstacks-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJSON() {
    if (requests.length === 0) {
      alert('No requests to export');
      return;
    }
    
    const blob = new Blob([JSON.stringify(requests, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silentstacks-requests-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let importedData = [];
        
        if (file.name.endsWith('.json')) {
          importedData = JSON.parse(event.target.result);
        } else if (file.name.endsWith('.csv')) {
          const results = Papa.parse(event.target.result, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
          });
          
          importedData = results.data.map(row => ({
            pmid: String(row.PMID || row.pmid || '').trim(),
            doi: String(row.DOI || row.doi || '').trim(),
            title: String(row.Title || row.title || '').trim(),
            authors: String(row.Authors || row.authors || '').trim(),
            journal: String(row.Journal || row.journal || '').trim(),
            year: String(row.Year || row.year || '').trim(),
            status: String(row.Status || row.status || 'pending').trim(),
            priority: String(row.Priority || row.priority || 'normal').trim(),
            tags: String(row.Tags || row.tags || '').split(';').map(t => t.trim()).filter(Boolean),
            notes: String(row.Notes || row.notes || '').trim(),
            patronEmail: String(row.PatronEmail || row.patronEmail || '').trim(),
            createdAt: row.Created || row.createdAt || new Date().toISOString()
          })).filter(req => req.title);
        }
        
        if (importedData.length > 0) {
          // Update global tags
          importedData.forEach(req => {
            (req.tags || []).forEach(tag => {
              if (!globalTags.has(tag)) {
                globalTags.set(tag, 'default');
              }
            });
          });
          
          requests.push(...importedData);
          saveAll();
          renderAll();
          
          const importStatus = document.getElementById('import-status');
          if (importStatus) {
            importStatus.textContent = `✅ Successfully imported ${importedData.length} requests!`;
            importStatus.className = 'import-status success';
          }
        } else {
          throw new Error('No valid requests found in file');
        }
        
      } catch (error) {
        console.error('Import error:', error);
        const importStatus = document.getElementById('import-status');
        if (importStatus) {
          importStatus.textContent = `❌ Import failed: ${error.message}`;
          importStatus.className = 'import-status error';
        }
      }
    };
    
    reader.readAsText(file);
  }

  // === Event Binding ===
  function bindEvents() {
    // Navigation
    els.navTabs.forEach(tab => {
      tab.addEventListener('click', () => switchSection(tab));
    });

    // Settings form
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', onSettingsSave);
    }

    // Main form
    if (els.form) {
      els.form.addEventListener('submit', onFormSubmit);
    }

    // Form buttons
    if (els.clearBtn) {
      els.clearBtn.addEventListener('click', () => { 
        els.form.reset(); 
        currentEdit = null; 
        setStatus('Form cleared', 'success');
      });
    }
    
    // Lookup buttons
    const pmidBtn = document.getElementById('lookup-pmid');
    const doiBtn = document.getElementById('lookup-doi');
    
    if (pmidBtn) pmidBtn.addEventListener('click', onLookupPMID);
    if (doiBtn) doiBtn.addEventListener('click', onLookupDOI);

    // Search and filters - GROUP ALL FILTERS TOGETHER
    if (els.search) els.search.addEventListener('input', renderRequests);
    if (els.statusFilter) els.statusFilter.addEventListener('change', renderRequests);
    
    // Priority filter - ADD HERE WITH OTHER FILTERS
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) priorityFilter.addEventListener('change', renderRequests);
    
    if (els.followupFilter) {
      els.followupFilter.addEventListener('click', () => { 
        followupOnly = !followupOnly; 
        els.followupFilter.classList.toggle('active', followupOnly); 
        els.followupFilter.textContent = followupOnly ? 'Show All' : 'Follow-up Needed';
        renderRequests(); 
      });
    }

    // Import/Export
   if (els.importFile) els.importFile.addEventListener('change', handleImport);
    if (els.exportCsv) els.exportCsv.addEventListener('click', handleExportCSV);
    if (els.exportJson) els.exportJson.addEventListener('click', handleExportJSON);
    
    // Bulk paste functionality - UPDATED FUNCTION NAME
       const bulkPasteBtn = document.getElementById('bulk-paste-btn');
if (bulkPasteBtn) {
  bulkPasteBtn.addEventListener('click', handleBulkPasteWithLookup);
}
}

  // === Make fetchPubMed and fetchCrossRef globally available ===
  window.fetchPubMed = fetchPubMed;
  window.fetchCrossRef = fetchCrossRef;

  // === Initialization ===
  function init() {
    loadSettings(); 
    loadRequests(); 
    loadGlobalTags();
    applyTheme(); 
    bindEvents(); 
    renderAll();
    enhanceAccessibility();
    initProgressStepNavigation(); 
    initSortButtons(); 
    
    console.log('SilentStacks v1.2 initialized with', requests.length, 'requests');
    console.log('Global tags loaded:', globalTags.size, 'tags');
    console.log('Offline support:', window.offlineManager ? 'enabled' : 'pending');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
