// modules/ui/integrated-help.js
(() => {
  'use strict';

  /**
   * IntegratedHelp
   * - Adds a small "? Help" button to the header
   * - Opens a modal with searchable, friendly docs
   * - No admin area; dead simple for 8→80
   */
  class IntegratedHelp {
    static dependencies = ['UIController'];
    static required = false;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.eventBus = null;
      this.ui = null;
      this.dom = null;
      this.sanitizer = null;

      this.topics = [
        {
          id: 'add-request',
          title: 'Add a Request',
          body: 'Go to “Add Request”, enter a PMID or DOI. Click “Fetch Data” to auto-fill. Then click “Add Request”.'
        },
        {
          id: 'bulk-upload',
          title: 'Bulk Upload (PMIDs or CSV)',
          body: 'Open “All Requests” → “Bulk Upload”. Paste PMIDs (one per line) or upload CSV. The app fetches metadata automatically, even offline (it will queue).'
        },
        {
          id: 'search',
          title: 'Search & Filter',
          body: 'Use the top search box for fuzzy search. Filter by status or priority. Click MeSH tags on a card to filter by that topic.'
        },
        {
          id: 'sorting',
          title: 'Sorting',
          body: 'Click column headers (Title, Journal, Priority, Status, Updated) to sort. Click again to reverse.'
        },
        {
          id: 'trials',
          title: 'Clinical Trials',
          body: 'When a PMID is added, the app tries to find NCT IDs in the abstract, then fetches trial details. You’ll see trial cards on the request.'
        },
        {
          id: 'export',
          title: 'Export Data',
          body: 'Use Export to download CSV (DOCLINE first) or JSON. No blank fields; placeholders are used.'
        },
        {
          id: 'offline',
          title: 'Working Offline',
          body: 'Everything works offline. Requests save locally. API calls are queued and sync when online. You don’t have to do anything.'
        }
      ];
    }

    async initialize() {
      try {
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.ui = window.SilentStacks?.modules?.UIController ?? null;
        this.dom = window.SilentStacks?.utils?.domUtils || null;
        this.sanitizer = window.SilentStacks?.security?.sanitizer || null;

        await this.setupModule();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'IntegratedHelp' };
      } catch (e) { this.recordError('Initialization failed', e); throw e; }
    }

    async setupModule() {
      // Add a small "? Help" button near the version badge
      const brand = document.querySelector('.nav-brand h1');
      if (brand && this.dom) {
        const btn = this.dom.createElement('button', { class: 'btn btn-ghost', id: 'help-button', type: 'button', style: 'margin-left:8px;' });
        this.dom.safeSetText(btn, '❓ Help');
        btn.addEventListener('click', () => this.openHelpModal());
        brand.appendChild(btn);
      }

      // Keyboard shortcut: Shift + /
      document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.key === '?') {
          e.preventDefault();
          this.openHelpModal();
        }
      });
    }

    openHelpModal() {
      const modalContent = this.dom.createElement('div', { class: 'help-modal' });

      const heading = this.dom.createElement('h3', {});
      this.dom.safeSetText(heading, 'Help');

      const search = this.dom.createElement('input', { type: 'search', placeholder: 'Search help…', 'aria-label': 'Search help topics', style: 'width:100%;padding:8px;margin:8px 0;' });
      const list = this.dom.createElement('div', { class: 'help-list' });

      const renderList = (query = '') => {
        list.textContent = '';
        const q = (query || '').toLowerCase();
        const items = this.topics.filter(t => !q || t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
        items.forEach(t => {
          const item = this.dom.createElement('div', { class: 'help-item' });
          const h = this.dom.createElement('h4', {}); this.dom.safeSetText(h, t.title);
          const p = this.dom.createElement('p', {}); this.dom.safeSetText(p, t.body);
          item.appendChild(h); item.appendChild(p);
          list.appendChild(item);
        });
        if (!items.length) {
          const empty = this.dom.createElement('p', { class: 'help-empty' });
          this.dom.safeSetText(empty, 'No help topics found.');
          list.appendChild(empty);
        }
      };

      search.addEventListener('input', () => renderList(search.value));
      renderList('');

      modalContent.appendChild(heading);
      modalContent.appendChild(search);
      modalContent.appendChild(list);

      this.ui?.showModal?.(modalContent, {
        actions: [{ label: 'Close', class: 'btn-secondary', onClick: (root) => { root.textContent = ''; } }]
      });
    }

    // Boilerplate
    getHealthStatus(){ return { name:'IntegratedHelp', status:this.initialized?'healthy':'not-initialized', initialized:this.initialized, lastActivity:this.lastActivity, errors:this.errors.slice(-5), performance:{} }; }
    recordError(message, error){
      const rec={ message, error:error?.message||String(error), timestamp:new Date().toISOString() };
      this.errors.push(rec); if(this.errors.length>100) this.errors=this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type:'error', module:'IntegratedHelp', message, error:rec.error });
    }
    log(m){ if(window.SilentStacks?.config?.debug) console.log(`[IntegratedHelp] ${m}`); }
  }

  const moduleInstance = new IntegratedHelp();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('IntegratedHelp', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.IntegratedHelp = moduleInstance; }
  console.log('📦 IntegratedHelp loaded');
})();
