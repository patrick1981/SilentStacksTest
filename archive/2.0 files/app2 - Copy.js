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
    
    // Priority indicator for visual scanning
    const priorityIndicator = r.priority ? `<div class="priority-indicator ${r.priority}" title="${r.priority.toUpperCase()} Priority" aria-label="${r.priority} priority"></div>` : '';
    
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
    
    const colorPicker = document.createElement('div');
    colorPicker.className = 'tag-color-picker active';
    colorPicker.innerHTML = `
      <div class="color-option color-1" onclick="setTagColor('${tagName}', '1')" title="Red"></div>
      <div class="color-option color-2" onclick="setTagColor('${tagName}', '2')" title="Orange"></div>
      <div class="color-option color-3" onclick="setTagColor('${tagName}', '3')" title="Green"></div>
      <div class="color-option color-4" onclick="setTagColor('${tagName}', '4')" title="Blue"></div>
      <div class="color-option color-5" onclick="setTagColor('${tagName}', '5')" title="Purple"></div>
      <div class="color-option color-default" onclick="setTagColor('${tagName}', 'default')" title="Default"></div>
    `;
    
    element.parentNode.appendChild(colorPicker);
    
    // Close picker when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', function closePickerHandler(e) {
        if (!colorPicker.contains(e.target)) {
          colorPicker.remove();
          document.removeEventListener('click', closePickerHandler);
        }
      });
    }, 100);
  };

  window.setTagColor = (tagName, colorId) => {
    globalTags.set(tagName, colorId);
    saveAll();
    renderRequests();
    
    // Remove the color picker
    document.querySelectorAll('.tag-color-picker').forEach(picker => picker.remove());
  };

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

  // === BULK PASTE FUNCTIONALITY ===
  function handleBulkPaste() {
    const textarea = document.getElementById('bulk-paste-data');
    if (!textarea) return;
    
    const data = textarea.value.trim();
    
    if (!data) {
      alert('Please paste some data first');
      return;
    }
    
    try {
      // Try to parse as CSV first
      const results = Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
      });
      
      if (results.data && results.data.length > 0) {
        const importedRequests = results.data.map(row => ({
          pmid: String(row.pmid || row.PMID || '').trim(),
          doi: String(row.doi || row.DOI || '').trim(),
          title: String(row.title || row.Title || '').trim(),
          authors: String(row.authors || row.Authors || '').trim(),
          journal: String(row.journal || row.Journal || '').trim(),
          year: String(row.year || row.Year || '').trim(),
          priority: String(row.priority || row.Priority || 'normal').trim(),
          status: 'pending',
          tags: [],
          notes: String(row.notes || row.Notes || '').trim(),
          createdAt: new Date().toISOString()
        })).filter(req => req.title);
        
        if (importedRequests.length > 0) {
          requests.push(...importedRequests);
          saveAll();
          renderAll();
          textarea.value = '';
          alert(`✅ Successfully imported ${importedRequests.length} requests from pasted data!`);
        } else {
          alert('❌ No valid requests found in pasted data');
        }
      }
    } catch (error) {
      alert('❌ Error parsing pasted data. Please check the format.');
      console.error('Bulk paste error:', error);
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
    let out = [];
    
    if (q && fuse) {
      out = fuse.search(q).map(r => r.item);
    } else {
      out = [...requests];
    }
    
    if (els.statusFilter && els.statusFilter.value) {
      out = out.filter(r => r.status === els.statusFilter.value);
    }
    
    if (followupOnly) {
      out = out.filter(needsFollowUp);
    }
    
    els.requestList.innerHTML = out.length
      ? out.map((r,i) => createEnhancedCard(r,i)).join('')
      : '<p class="empty-message">No requests found</p>';
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

    // Search and filters
    if (els.search) els.search.addEventListener('input', renderRequests);
    if (els.statusFilter) els.statusFilter.addEventListener('change', renderRequests);
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
    
    // Bulk paste functionality
    const bulkPasteBtn = document.getElementById('bulk-paste-btn');
    if (bulkPasteBtn) {
      bulkPasteBtn.addEventListener('click', handleBulkPaste);
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