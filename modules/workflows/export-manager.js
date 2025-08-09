// modules/workflows/export-manager.js
(() => {
  'use strict';

  class ExportManager {
    static dependencies = ['RequestManager'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;
      this.rm = null;
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.rm = window.SilentStacks?.modules?.RequestManager ?? null;

        await this.setupModule();
        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'ExportManager' };
      } catch (e) { this.recordError('Initialization failed', e); throw e; }
    }

    async setupModule() {}

    // ===== Required API =====
    async exportData(format, filters = {}, options = {}) {
      const requests = this._filter(this.rm.getAllRequests?.() || [], filters);
      switch ((format || 'json').toLowerCase()) {
        case 'json': return this.exportToJSON(requests, options);
        case 'csv': return this.exportToCSV(requests, options);
        case 'nlm': return this.exportToNLM(requests, options);
        case 'bibtex': return this.exportToBibTeX(requests, options);
        case 'ris': return this.exportToRIS(requests, options);
        default: throw new Error(`Unsupported export format: ${format}`);
      }
    }

    exportToJSON(requests, { filename } = {}) {
      const json = JSON.stringify(requests, null, 2);
      this._downloadBlob(json, 'application/json', filename || `silentstacks-${Date.now()}.json`);
      return json;
    }

    // DOCLINE-first CSV + no blank fields (uses "—")
    exportToCSV(requests, { filename } = {}) {
      const rows = [];
      const H = [
        'docline', 'pmid', 'doi', 'title', 'authors', 'journal',
        'year', 'volume', 'issue', 'pages',
        'priority', 'status', 'tags', 'notes', 'updatedAt'
      ];
      rows.push(H);

      requests.forEach(r => {
        const row = [
          this._nz(r.docline), this._nz(r.pmid), this._nz(r.doi), this._nz(r.title), this._nz(r.authors),
          this._nz(r.journal), this._nz(r.year), this._nz(r.volume), this._nz(r.issue), this._nz(r.pages),
          this._nz(r.priority), this._nz(r.status), this._nz(r.tags), this._nz(r.notes),
          this._nz(r.updatedAt ? new Date(r.updatedAt).toISOString() : '')
        ];
        rows.push(row);
      });

      const csv = rows.map(cols => cols.map(this._csvEscape).join(',')).join('\r\n');
      this._downloadBlob(csv, 'text/csv', filename || `silentstacks-${Date.now()}.csv`);
      return csv;
    }

    exportToNLM(requests, { filename } = {}) {
      const fmt = window.SilentStacks?.utils?.formatters;
      const lines = requests.map(r => (fmt?.citationNLM ? fmt.citationNLM(r) : this._nlmFallback(r)));
      const text = lines.join('\n');
      this._downloadBlob(text, 'text/plain', filename || `silentstacks-${Date.now()}.nlm.txt`);
      return text;
    }

    exportToBibTeX(requests, { filename } = {}) {
      const lines = requests.map((r, i) => {
        const key = `ref${i + 1}`;
        return [
          '@article{', key, ',',
          `  title={${this._nz(r.title)}},`,
          `  author={${this._nz(r.authors)}},`,
          `  journal={${this._nz(r.journal)}},`,
          `  year={${this._nz(r.year)}},`,
          `  volume={${this._nz(r.volume)}},`,
          `  number={${this._nz(r.issue)}},`,
          `  pages={${this._nz(r.pages)}},`,
          r.doi ? `  doi={${r.doi}},` : '',
          r.pmid ? `  pmid={${r.pmid}},` : '',
          '}\n'
        ].filter(Boolean).join('\n');
      });
      const text = lines.join('\n');
      this._downloadBlob(text, 'text/plain', filename || `silentstacks-${Date.now()}.bib`);
      return text;
    }

    exportToRIS(requests, { filename } = {}) {
      const lines = requests.map(r => {
        const out = [
          `TY  - JOUR`,
          `TI  - ${this._nz(r.title)}`,
          `AU  - ${this._nz(r.authors)}`,
          `JO  - ${this._nz(r.journal)}`,
          `PY  - ${this._nz(r.year)}`,
          `VL  - ${this._nz(r.volume)}`,
          `IS  - ${this._nz(r.issue)}`,
          `SP  - ${this._nz(r.pages?.split('-')?.[0] || '')}`,
          `EP  - ${this._nz(r.pages?.split('-')?.[1] || '')}`,
          r.doi ? `DO  - ${r.doi}` : '',
          r.pmid ? `PM  - ${r.pmid}` : '',
          'ER  - '
        ].filter(Boolean);
        return out.join('\n');
      }).join('\n');
      this._downloadBlob(lines, 'application/x-research-info-systems', filename || `silentstacks-${Date.now()}.ris`);
      return lines;
    }

    // ===== Helpers =====
    _filter(list, filters) {
      let out = list;
      if (filters?.status && filters.status !== 'all') out = out.filter(r => (r.status || 'pending') === filters.status);
      if (filters?.priority && filters.priority !== 'all') out = out.filter(r => (r.priority || 'normal') === filters.priority);
      return out;
    }

    _downloadBlob(text, type, filename) {
      try {
        const blob = new Blob([text], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename || 'export.txt';
        a.click(); URL.revokeObjectURL(url);
      } catch (e) { this.recordError('Download blob failed', e); }
    }

    _csvEscape(v) {
      const s = String(v == null ? '' : v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }
    _nlmFallback(r = {}) {
      const authors = String(r.authors || '').replace(/\s*;\s*/g, '; ');
      const title = r.title || ''; const journal = r.journal || '';
      const year = r.year || ''; const volume = r.volume || '';
      const issue = r.issue || ''; const pages = r.pages || '';
      const vi = [volume, issue && `(${issue})`].filter(Boolean).join('');
      const p = pages ? `:${pages}` : '';
      return `${authors ? authors + '. ' : ''}${title ? title + '. ' : ''}${journal ? journal + '. ' : ''}${year}${vi ? ';' + vi : ''}${p}.`.replace(/\s+/g, ' ').trim();
    }
    _nz(v) { const s = (v == null || v === '') ? '—' : String(v); return s; }

    // Boilerplate
    getHealthStatus(){ return { name:'ExportManager', status:this.initialized?'healthy':'not-initialized', initialized:this.initialized, lastActivity:this.lastActivity, errors:this.errors.slice(-5), performance:{} }; }
    recordError(message, error){
      const rec={ message, error:error?.message||String(error), timestamp:new Date().toISOString() };
      this.errors.push(rec); if(this.errors.length>100) this.errors=this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type:'error', module:'ExportManager', message, error:rec.error });
    }
    log(m){ if(window.SilentStacks?.config?.debug) console.log(`[ExportManager] ${m}`); }
  }

  const moduleInstance = new ExportManager();
  if (window.SilentStacks?.registerModule) window.SilentStacks.registerModule('ExportManager', moduleInstance);
  else { window.SilentStacks = window.SilentStacks || { modules: {} }; window.SilentStacks.modules.ExportManager = moduleInstance; }
  console.log('📦 ExportManager loaded');
})();