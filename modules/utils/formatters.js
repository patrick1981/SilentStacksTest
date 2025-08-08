// utils/formatters.js
(() => {
  'use strict';

  /**
   * Formatters
   * Date/number/text & citation helpers.
   * Exposed at window.SilentStacks.utils.formatters
   */
  class Formatters {
    static dependencies = [];
    static required = false;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      const sanitizer = window.SilentStacks?.security?.sanitizer;
      this.sanitize = (v) => (sanitizer?.sanitize ? sanitizer.sanitize(String(v ?? '')) : String(v ?? ''));
    }

    async initialize() {
      try {
        // Export into utils bag
        window.SilentStacks = window.SilentStacks || {};
        window.SilentStacks.utils = window.SilentStacks.utils || {};
        window.SilentStacks.utils.formatters = {
          dateISO: (d) => this.dateISO(d),
          dateHuman: (d) => this.dateHuman(d),
          number: (n) => this.number(n),
          truncate: (s, n) => this.truncate(s, n),
          formatAuthorsNLM: (a) => this.formatAuthorsNLM(a),
          abbrevJournal: (j) => this.abbrevJournal(j),
          citationNLM: (r) => this.citationNLM(r)
        };

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        return { status: 'success', module: 'Formatters' };
      } catch (e) {
        this.recordError('Initialization failed', e);
        throw e;
      }
    }

    dateISO(d) {
      try {
        const dt = d instanceof Date ? d : new Date(d);
        if (Number.isNaN(dt.getTime())) return '';
        return dt.toISOString();
      } catch { return ''; }
    }

    dateHuman(d) {
      try {
        const dt = d instanceof Date ? d : new Date(d);
        if (Number.isNaN(dt.getTime())) return '';
        return dt.toLocaleString();
      } catch { return ''; }
    }

    number(n) {
      try {
        const x = typeof n === 'number' ? n : Number(n);
        if (Number.isNaN(x)) return '';
        return x.toLocaleString();
      } catch { return ''; }
    }

    truncate(s, max = 120) {
      const text = this.sanitize(s || '');
      if (text.length <= max) return text;
      return `${text.slice(0, Math.max(0, max - 1))}…`;
    }

    formatAuthorsNLM(authorsStr) {
      if (!authorsStr) return '';
      const arr = this._authorsArray(authorsStr);
      return arr.map(a => {
        const parts = a.includes(',') ? a.split(',').map(x => x.trim()) : (() => {
          const bits = a.trim().split(/\s+/);
          const last = bits.pop();
          return [last, bits.join(' ')];
        })();
        const last = parts[0] || '';
        const given = (parts[1] || '').replace(/\./g, '').split(/\s+/).map(x => x[0] || '').join('');
        return `${last} ${given}`.trim();
      }).join(', ');
    }

    abbrevJournal(journal) {
      // Very light heuristic abbreviation (not official NLM abbrev list)
      if (!journal) return '';
      return journal
        .replace(/\b(Journal|International|Review|Annual|Annals|Proceedings|Transactions)\b/gi, (m) => m[0] + '.')
        .replace(/\band\b/gi, '&')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    citationNLM(r) {
      try {
        const authors = this.formatAuthorsNLM(r.authors);
        const title = this.sanitize(r.title || '');
        const journal = this.abbrevJournal(r.journal || r.journalTitle || '');
        const year = this.sanitize(r.year || '');
        const volume = this.sanitize(r.volume || '');
        const issue = this.sanitize(r.issue || '');
        const pages = this.sanitize(r.pages || '');
        const doi = this.sanitize(r.doi || '');
        const pmid = this.sanitize(r.pmid || '');

        const parts = [];
        if (authors) parts.push(`${authors}.`);
        if (title) parts.push(`${title}.`);

        let citation = '';
        if (journal) citation += `${journal}. `;
        if (year) citation += `${year}`;
        if (volume) citation += `;${volume}`;
        if (issue) citation += `(${issue})`;
        if (pages) citation += `:${pages}`;
        if (citation) citation += '.';
        if (citation) parts.push(citation.trim());

        if (doi) parts.push(`doi:${doi}.`);
        if (pmid) parts.push(`PMID:${pmid}.`);

        return parts.join(' ').replace(/\s+\./g, '.').trim();
      } catch {
        return '';
      }
    }

    _authorsArray(authorsStr) {
      if (!authorsStr) return [];
      let parts = String(authorsStr).split(/;| and /i).map(s => s.trim()).filter(Boolean);
      if (parts.length === 1 && parts[0].includes(',')) {
        const raw = parts[0].split(/\s*,\s*/);
        const rebuilt = [];
        for (let i = 0; i < raw.length; i += 2) {
          const last = raw[i];
          const first = raw[i + 1] || '';
          rebuilt.push(`${last}, ${first}`);
        }
        parts = rebuilt.filter(Boolean);
      }
      return parts;
    }

    getHealthStatus() {
      return {
        name: 'Formatters',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {}
      };
    }

    recordError(message, error) {
      const rec = {
        message,
        error: error?.message || String(error),
        stack: (window.SilentStacks?.config?.debug ? error?.stack : undefined),
        timestamp: new Date().toISOString()
      };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'Formatters',
        message,
        error: rec.error
      });
    }
  }

  const moduleInstance = new Formatters();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('Formatters', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.Formatters = moduleInstance;
  }

  console.log('🧰 Formatters loaded');
})();
