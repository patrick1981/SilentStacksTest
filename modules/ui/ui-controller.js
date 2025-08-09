// modules/ui/ui-controller.js
(() => {
  'use strict';

  class UIController {
    static dependencies = ['RequestManager'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      // Core
      this.stateManager = null;
      this.eventBus = null;

      // Modules
      this.requestManager = null;
      this.pubmed = null;
      this.clinical = null;

      // UI
      this.loadingCount = 0;
      this.activeSectionId = 'dashboard';
      this.currentTheme = 'light';
      this.selectedIds = new Set();
      this.sortHeadersConfigured = false;

      // Utils
      this.dom = null;
      this.sanitizer = null;
      this.formatters = null;
      this.resizeObserver = null;
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;

        this.requestManager = window.SilentStacks?.modules?.RequestManager ?? null;
        this.pubmed = window.SilentStacks?.modules?.PubMedIntegration ?? null;
        this.clinical = window.SilentStacks?.modules?.ClinicalTrialsIntegration ?? null;

        this.dom = window.SilentStacks?.utils?.domUtils || window.SilentStacks?.utils?.dom || null;
        this.sanitizer = window.SilentStacks?.security?.sanitizer || null;
        this.formatters = window.SilentStacks?.utils?.formatters || null;

        await this.setupModule();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'UIController' };
      } catch (e) { this.recordError('Initialization failed', e); throw e; }
    }

    async setupModule() {
      if (!this.dom?.createElement || !this.dom?.safeSetText) {
        this.recordError('dom-utils not available', new Error('Missing dom-utils'));
      }

      document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const section = tab.getAttribute('data-section');
          if (section) this.switchSection(section);
        });
      });
      this.switchSection(document.querySelector('.section.active')?.id || 'dashboard');

      // Events
      this.eventBus?.on?.('ui:render:requests', ({ items, total }) => this.renderRequestList(items, total));
      this.eventBus?.on?.('request:created', () => this.updateStatistics());
      this.eventBus?.on?.('request:changed', () => this.updateStatistics());
      this.eventBus?.on?.('request:deleted', () => { this.updateStatistics(); this.selectedIds.clear(); this.updateBulkToolbar(); });

      this.eventBus?.on?.('ui:showDiagnostics', () => window.SilentStacks?.debug?.showDiagnostics?.());
      this.eventBus?.on?.('net:started', () => this.showLoadingState('Loading...'));
      this.eventBus?.on?.('net:completed', () => this.hideLoadingState());
      this.eventBus?.on?.('net:failed', () => this.hideLoadingState());

      // Theme
      this.setTheme(this.stateManager?.getState?.('ui:theme') || 'light');

      // Resize
      this.handleResize = this.handleResize.bind(this);
      window.addEventListener('resize', this.handleResize, { passive: true });
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      const main = document.getElementById('main-content');
      if (main) this.resizeObserver.observe(main);

      // Sorting + Bulk toolbar
      this.ensureSortHeaderUI();
      this.ensureBulkToolbar();

      // Initial stats + render
      this.updateStatistics();
      const all = this.requestManager?.getAllRequests?.() || [];
      this.renderRequestList(all.slice(0, 20), all.length);

      this.log('UIController setup complete');
    }

    // ===== Required Methods =====

    switchSection(sectionId) {
      const target = this.sanitizeText(sectionId);
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.nav-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      const section = document.getElementById(target);
      const tab = document.querySelector(`.nav-tab[data-section="${target}"]`);
      if (section) section.classList.add('active');
      if (tab) { tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); }
      this.activeSectionId = target;
      this.lastActivity = new Date().toISOString();
    }

    showLoadingState(message = 'Loading...') {
      this.loadingCount = Math.max(0, this.loadingCount + 1);
      const el = document.getElementById('form-status') || document.querySelector('.loading-spinner');
      if (el && this.dom?.safeSetText) { this.dom.safeSetText(el, message); el.classList.add('loading'); }
    }

    hideLoadingState() {
      this.loadingCount = Math.max(0, this.loadingCount - 1);
      if (this.loadingCount > 0) return;
      const el = document.getElementById('form-status') || document.querySelector('.loading-spinner');
      if (el) el.classList.remove('loading');
    }

    showModal(content, options = {}) {
      const modalRoot = document.getElementById('modal-container');
      if (!modalRoot || !this.dom) return;
      modalRoot.textContent = '';

      const overlay = this.dom.createElement('div', { class: 'modal-overlay', role: 'dialog', 'aria-modal': 'true' });
      const panel = this.dom.createElement('div', { class: 'modal-panel' });

      const closeBtn = this.dom.createElement('button', { class: 'btn btn-ghost modal-close', type: 'button' });
      this.dom.safeSetText(closeBtn, '✕');
      closeBtn.addEventListener('click', () => modalRoot.textContent = '');

      if (typeof content === 'string') {
        const p = this.dom.createElement('div', { class: 'modal-content' });
        this.dom.safeSetText(p, this.sanitizeText(content));
        panel.appendChild(p);
      } else if (content instanceof Node) {
        panel.appendChild(content);
      }

      if (Array.isArray(options.actions)) {
        const bar = this.dom.createElement('div', { class: 'modal-actions' });
        options.actions.forEach(a => {
          const btn = this.dom.createElement('button', { class: `btn ${a.class || 'btn-primary'}`, type: 'button' });
          this.dom.safeSetText(btn, a.label || 'OK');
          btn.addEventListener('click', () => a.onClick?.(modalRoot));
          bar.appendChild(btn);
        });
        panel.appendChild(bar);
      }

      panel.appendChild(closeBtn);
      overlay.appendChild(panel);
      modalRoot.appendChild(overlay);
    }

    updateStatistics() {
      try {
        const all = this.requestManager?.getAllRequests?.() || [];
        const setNum = (id, val) => {
          const el = document.getElementById(id);
          if (el && this.dom?.safeSetText) this.dom.safeSetText(el, String(val));
        };
        setNum('total-requests', all.length);
        setNum('pending-requests', all.filter(r => (r.status || 'pending') === 'pending').length);
        setNum('completed-requests', all.filter(r => (r.status || '') === 'completed').length);
        setNum('urgent-requests', all.filter(r => (r.priority || 'normal') === 'urgent').length);

        const recentWrap = document.getElementById('recent-requests');
        if (recentWrap) {
          recentWrap.textContent = '';
          [...all].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 5).forEach(r => {
            const item = this.dom.createElement('div', { class: 'request-card' });
            this.dom.safeSetText(item, this.buildNLMString(r));
            recentWrap.appendChild(item);
          });
        }

        this.lastActivity = new Date().toISOString();
      } catch (e) { this.recordError('updateStatistics failed', e); }
    }

    handleResize() { this.lastActivity = new Date().toISOString(); }

    setTheme(themeName = 'light') {
      const theme = this.sanitizeText(themeName) || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      this.currentTheme = theme;
      this.stateManager?.setState?.('ui:theme', theme);
      this.lastActivity = new Date().toISOString();
    }

    // ===== Sorting Header =====
    ensureSortHeaderUI() {
      if (this.sortHeadersConfigured) return;
      const list = document.getElementById('request-list');
      if (!list) return;

      const header = this.dom.createElement('div', { class: 'list-header' });
      const makeBtn = (label, field) => {
        const b = this.dom.createElement('button', { class: 'sort-btn', 'data-field': field, type: 'button', 'aria-label': `Sort by ${label}` });
        this.dom.safeSetText(b, label);
        b.addEventListener('click', () => {
          const sf = window.SilentStacks?.modules?.SearchFilter;
          if (!sf) return;
          const curr = sf.sort || { field: 'updatedAt', dir: 'desc' };
          const dir = (curr.field === field && curr.dir === 'asc') ? 'desc' : 'asc';
          sf.setSortField(field, dir);
          this.updateSortIndicators(field, dir, header);
        });
        return b;
      };

      header.appendChild(makeBtn('Title', 'title'));
      header.appendChild(makeBtn('Journal', 'journal'));
      header.appendChild(makeBtn('Priority', 'priority'));
      header.appendChild(makeBtn('Status', 'status'));
      header.appendChild(makeBtn('Updated', 'updatedAt'));

      list.parentNode.insertBefore(header, list);

      const sf = window.SilentStacks?.modules?.SearchFilter;
      if (sf) this.updateSortIndicators(sf.sort.field, sf.sort.dir, header);

      this.sortHeadersConfigured = true;
    }

    updateSortIndicators(activeField, dir, headerEl) {
      headerEl.querySelectorAll('.sort-btn').forEach(btn => {
        const f = btn.getAttribute('data-field');
        const base = btn.textContent.replace(/[ ↑↓]$/,'').split(' ')[0];
        const arrow = (f === activeField) ? (dir === 'asc' ? ' ↑' : ' ↓') : '';
        this.dom.safeSetText(btn, base + arrow);
      });
    }

    // ===== Bulk Operations =====
    ensureBulkToolbar() {
      const controls = document.querySelector('.controls-bar .action-controls');
      if (!controls) return;

      if (!document.getElementById('bulk-toolbar')) {
        const bar = this.dom.createElement('div', { id: 'bulk-toolbar', class: 'bulk-toolbar' });

        const selectAll = this.dom.createElement('label', { class: 'bulk-select-all' });
        const cb = this.dom.createElement('input', { type: 'checkbox', id: 'select-all' });
        const txt = this.dom.createElement('span', {});
        this.dom.safeSetText(txt, 'Select All');
        selectAll.appendChild(cb); selectAll.appendChild(txt);
        cb.addEventListener('change', () => this.toggleSelectAll(cb.checked));

        const btnStatus = this.dom.createElement('button', { class: 'btn btn-secondary', type: 'button' });
        this.dom.safeSetText(btnStatus, 'Set Status');
        btnStatus.addEventListener('click', () => this.bulkChangeStatus());

        const btnPriority = this.dom.createElement('button', { class: 'btn btn-secondary', type: 'button' });
        this.dom.safeSetText(btnPriority, 'Set Priority');
        btnPriority.addEventListener('click', () => this.bulkChangePriority());

        const btnDelete = this.dom.createElement('button', { class: 'btn btn-danger', type: 'button' });
        this.dom.safeSetText(btnDelete, 'Delete Selected');
        btnDelete.addEventListener('click', () => this.bulkDelete());

        const count = this.dom.createElement('span', { id: 'bulk-count', class: 'bulk-count' });
        this.dom.safeSetText(count, '0 selected');

        bar.appendChild(selectAll);
        bar.appendChild(btnStatus);
        bar.appendChild(btnPriority);
        bar.appendChild(btnDelete);
        bar.appendChild(count);

        controls.appendChild(bar);
      }
      this.updateBulkToolbar();
    }

    updateBulkToolbar() {
      const countEl = document.getElementById('bulk-count');
      if (countEl) this.dom.safeSetText(countEl, `${this.selectedIds.size} selected`);
      const selectAll = document.getElementById('select-all');
      if (selectAll) {
        const currentPageIds = Array.from(document.querySelectorAll('.request-card input[type="checkbox"][data-id]')).map(cb => cb.getAttribute('data-id'));
        const allSelected = currentPageIds.length > 0 && currentPageIds.every(id => this.selectedIds.has(id));
        selectAll.checked = allSelected;
        selectAll.indeterminate = !allSelected && currentPageIds.some(id => this.selectedIds.has(id));
      }
    }

    toggleSelectAll(checked) {
      document.querySelectorAll('.request-card input[type="checkbox"][data-id]').forEach(cb => {
        const id = cb.getAttribute('data-id');
        cb.checked = checked;
        if (checked) this.selectedIds.add(id); else this.selectedIds.delete(id);
      });
      this.updateBulkToolbar();
    }

    bulkChangeStatus() {
      if (this.selectedIds.size === 0) return;
      const modal = this.dom.createElement('div', {});
      const select = this.dom.createElement('select', { id: 'bulk-status-select' });
      ['pending', 'in-progress', 'completed', 'cancelled'].forEach(s => {
        const opt = this.dom.createElement('option', { value: s }); this.dom.safeSetText(opt, s); select.appendChild(opt);
      });
      modal.appendChild(select);
      this.showModal(modal, {
        actions: [{
          label: 'Apply', class: 'btn-primary', onClick: async (root) => {
            const val = document.getElementById('bulk-status-select').value;
            for (const id of this.selectedIds) await this.requestManager.updateRequest(id, { status: val, updatedAt: Date.now() });
            root.textContent = ''; this.selectedIds.clear(); this.updateBulkToolbar();
            this.eventBus?.emit?.('request:changed');
          }
        }, { label: 'Cancel', class: 'btn-secondary', onClick: (root) => root.textContent = '' }]
      });
    }

    bulkChangePriority() {
      if (this.selectedIds.size === 0) return;
      const modal = this.dom.createElement('div', {});
      const select = this.dom.createElement('select', { id: 'bulk-priority-select' });
      ['urgent', 'high', 'normal'].forEach(s => {
        const opt = this.dom.createElement('option', { value: s }); this.dom.safeSetText(opt, s); select.appendChild(opt);
      });
      modal.appendChild(select);
      this.showModal(modal, {
        actions: [{
          label: 'Apply', class: 'btn-primary', onClick: async (root) => {
            const val = document.getElementById('bulk-priority-select').value;
            for (const id of this.selectedIds) await this.requestManager.updateRequest(id, { priority: val, updatedAt: Date.now() });
            root.textContent = ''; this.selectedIds.clear(); this.updateBulkToolbar();
            this.eventBus?.emit?.('request:changed');
          }
        }, { label: 'Cancel', class: 'btn-secondary', onClick: (root) => root.textContent = '' }]
      });
    }

    async bulkDelete() {
      if (this.selectedIds.size === 0) return;
      const ok = confirm(`Delete ${this.selectedIds.size} selected request(s)? This cannot be undone.`);
      if (!ok) return;
      for (const id of this.selectedIds) await this.requestManager.deleteRequest(id);
      this.selectedIds.clear(); this.updateBulkToolbar();
      this.eventBus?.emit?.('request:deleted');
    }

    // ===== Rendering =====
    renderRequestList(items = [], total = 0) {
      const listEl = document.getElementById('request-list');
      if (!listEl || !this.dom) return;

      listEl.textContent = '';
      items.forEach((rec) => {
        const id = rec.id || rec._id || String(rec.pmid || rec.doi || Math.random());
        const card = this.dom.createElement('div', { class: 'request-card' });
        card.classList.add(`priority--${(rec.priority || 'normal').toLowerCase()}`);

        // selection
        const selWrap = this.dom.createElement('div', { class: 'request-select' });
        const cb = this.dom.createElement('input', { type: 'checkbox', 'data-id': id });
        cb.checked = this.selectedIds.has(id);
        cb.addEventListener('change', () => {
          if (cb.checked) this.selectedIds.add(id); else this.selectedIds.delete(id);
          this.updateBulkToolbar();
        });
        selWrap.appendChild(cb);

        // citation
        const titleEl = this.dom.createElement('div', { class: 'request-title', role: 'heading', 'aria-level': '3' });
        const citation = (this.formatters?.citationNLM) ? this.formatters.citationNLM(rec) : this.buildNLMString(rec);
        this.dom.safeSetText(titleEl, citation);

        // meta
        const metaEl = this.dom.createElement('div', { class: 'request-meta' });
        const pubType = rec.publicationType || rec.classification || '';
        const pmid = rec.pmid ? `PMID: ${rec.pmid}` : 'PMID: —';
        const doi = rec.doi ? `DOI: ${rec.doi}` : 'DOI: —';
        const status = `Status: ${rec.status || 'pending'}`;
        const info = [pmid, doi, status, pubType ? `Type: ${pubType}` : ''].filter(Boolean).join('  •  ');
        this.dom.safeSetText(metaEl, info);

        // tags (MeSH / tags)
        const meshWrap = this.dom.createElement('div', { class: 'request-tags' });
        const mesh = Array.isArray(rec.mesh) ? rec.mesh : this._parseMeshString(rec.tags);
        mesh.forEach(m => {
          const isObj = m && typeof m === 'object';
          const label = isObj ? m.term : String(m);
          const tag = this.dom.createElement('span', { class: `tag ${this.tagColorClass(label)} ${isObj && m.major ? 'tag--major' : ''}`, title: label });
          this.dom.safeSetText(tag, isObj && m.major ? `${label} *` : label);
          tag.addEventListener('click', () => {
            const sf = window.SilentStacks?.modules?.SearchFilter;
            if (!sf) return;
            const current = new Set(sf.filters.tags || []);
            current.add(label);
            sf.applyFilters({ tags: Array.from(current) });
            sf.performSearch(sf.query, true);
          });
          meshWrap.appendChild(tag);
        });

        // trials
        const trialsWrap = this.dom.createElement('div', { class: 'trials-wrap' });
        (rec.clinicalTrials || []).slice(0, 3).forEach(t => {
          const a = this.dom.createElement('a', { class: 'trial-card', href: this._trialUrl(t), target: '_blank', rel: 'noopener noreferrer' });
          const summary = this._trialSummary(t);
          this.dom.safeSetText(a, summary);
          trialsWrap.appendChild(a);
        });

        const topRow = this.dom.createElement('div', { class: 'request-row' });
        topRow.appendChild(selWrap);
        topRow.appendChild(titleEl);

        card.appendChild(topRow);
        card.appendChild(metaEl);
        if (meshWrap.childNodes.length) card.appendChild(meshWrap);
        if (trialsWrap.childNodes.length) card.appendChild(trialsWrap);

        listEl.appendChild(card);
      });

      const countEl = document.getElementById('results-count');
      if (countEl) this.dom.safeSetText(countEl, `${Number(total || items.length)} requests`);

      this.updateBulkToolbar();
      this.lastActivity = new Date().toISOString();
    }

    _parseMeshString(s) {
      const arr = String(s || '').split(',').map(x => x.trim()).filter(Boolean);
      return arr.map(x => ({ term: x, major: false }));
    }
    _trialUrl(t) {
      const id = t?.nctId || t?.protocolSection?.identificationModule?.nctId || '';
      return id ? `https://clinicaltrials.gov/study/${id}` : '#';
    }
    _trialSummary(t) {
      const id = t?.nctId || t?.protocolSection?.identificationModule?.nctId || '';
      const title = t?.protocolSection?.identificationModule?.briefTitle || t?.protocolSection?.identificationModule?.officialTitle || 'Clinical trial';
      const status = t?.protocolSection?.statusModule?.overallStatus || '—';
      const phases = t?.protocolSection?.designModule?.phases || [];
      const phase = Array.isArray(phases) ? phases.join(', ') : phases || '—';
      const enroll = t?.protocolSection?.designModule?.enrollmentInfo?.count || '—';
      return `${id || ''} — ${status}, ${phase}, N=${enroll} — ${title}`;
    }

    // ===== Helpers =====
    buildNLMString(rec = {}) {
      const authors = String(rec.authors || '').replace(/\s*;\s*/g, '; ');
      const title = rec.title || '';
      const journal = rec.journal || '';
      const year = rec.year || '';
      const volume = rec.volume || '';
      const issue = rec.issue || '';
      const pages = rec.pages || '';

      const volIssue = [volume, issue && `(${issue})`].filter(Boolean).join('');
      const pagePart = pages ? `:${pages}` : '';
      const chunks = [
        authors ? authors + '. ' : '',
        title ? title + '. ' : '',
        journal ? journal + '. ' : '',
        year || '',
        volIssue ? ';' + volIssue : '',
        pagePart || '',
        '.'
      ];
      return chunks.join('').replace(/\s+/g, ' ').trim();
    }

    tagColorClass(tag) {
      const s = String(tag || '');
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      const idx = (h % 8) + 1;
      return `tag--c${idx}`;
    }

    getHealthStatus() {
      return { name: 'UIController', status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized, lastActivity: this.lastActivity, errors: this.errors.slice(-5), performance: {} };
    }

    recordError(message, error) {
      const errorRecord = {
        message,
        error: error?.message || String(error),
        stack: error?.stack,
        timestamp: new Date().toISOString()
      };
      this.errors.push(errorRecord);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'UIController', message, error });
    }

    log(message) { if (window.SilentStacks?.config?.debug) console.log(`[UIController] ${message}`); }

    sanitizeText(text) {
      if (!text && text !== 0) return '';
      const s = String(text);
      if (this.sanitizer?.sanitize) return this.sanitizer.sanitize(s);
      return s.replace(/[<>"'&]/g, '');
    }
  }

  const moduleInstance = new UIController();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('UIController', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.UIController = moduleInstance; }
  console.log('📦 UIController loaded');
})();