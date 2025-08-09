// modules/integrations/pubmed-integration.js
// SilentStacks v2.0 — PubMed Integration (offline-resilient, cached, sanitized)

(() => {
  'use strict';

  class PubMedIntegration {
    static dependencies = ['APIClient'];
    static required = false;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      // Core references
      this.stateManager = null;
      this.eventBus = null;

      // API client (wired in initialize)
      this.api = null;

      // In-memory cache (also persisted)
      this.cacheKey = 'ss_pubmed_cache';
      this.cache = new Map(); // pmid -> record

      // Simple related articles cache
      this.relatedCacheKey = 'ss_pubmed_related_cache';
      this.relatedCache = new Map(); // pmid -> pmid[]
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager || null;
        this.eventBus = window.SilentStacks?.core?.eventBus || null;
        this.api = (window.SilentStacks?.modules?.APIClient) || null;

        // Restore caches
        this._restoreCache();
        this._restoreRelated();

        // Listen for network restore to optionally refresh pending items
        window.addEventListener('online', () => {
          // no-op: APIClient does its own queue flush; we just log here
          this.log('Online — PubMedIntegration ready to refresh if requested');
        });

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('PubMedIntegration initialized');
        return { status: 'success', module: 'PubMedIntegration' };
      } catch (err) {
        this.recordError('Initialization failed', err);
        throw err;
      }
    }

    // ------------------------------------------------------------
    // Public API (required methods)
    // ------------------------------------------------------------

    /**
     * Fetch a PubMed record. Works offline (returns cached/placeholder).
     * Strategy: use APIClient.fetchPubMedData(pmid) which hits ESummary JSON.
     */
    async fetchPubMedRecord(pmid) {
      const id = String(pmid || '').trim();
      if (!/^\d{1,8}$/.test(id)) throw new Error('Invalid PMID');

      // Serve cached if offline or already cached
      const cached = this.cache.get(id);
      if (!navigator.onLine && cached) {
        this.log(`Offline — serving cached PubMed ${id}`);
        return cached;
      }

      try {
        if (!this.api?.fetchPubMedData) throw new Error('APIClient not available');

        const raw = await this.api.fetchPubMedData(id);
        // Normalize shape into a consistent record
        const record = this._normalizeESummary(id, raw);
        this._cacheSet(id, record);
        this.eventBus?.emit?.('pubmed:recordFetched', { pmid: id, record });
        return record;
      } catch (err) {
        this.recordError(`PubMed fetch failed: ${id}`, err);
        if (cached) return cached; // fallback to cached
        // Minimal placeholder
        const placeholder = { pmid: id, title: '', journal: '', authors: [], year: '', citation: '', mesh: [], offline: !navigator.onLine };
        this._cacheSet(id, placeholder);
        return placeholder;
      }
    }

    /**
     * Parse XML (EFetch) response text into a Document for further processing.
     * If offline or invalid, returns a DOM with empty root to keep pipeline safe.
     */
    parseXMLResponse(xmlData) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(String(xmlData || ''), 'text/xml');
        return doc;
      } catch (err) {
        this.recordError('parseXMLResponse failed', err);
        const parser = new DOMParser();
        return parser.parseFromString('<Empty/>', 'text/xml');
      }
    }

    /**
     * Extract MeSH headings (major/minor). Returns [{ term, isMajor }]
     * Accepts an XML Document (EFetch). If not XML, returns [].
     */
    extractMeshHeadings(xmlDoc) {
      try {
        if (!xmlDoc || !xmlDoc.querySelectorAll) return [];
        const nodes = xmlDoc.querySelectorAll('MeshHeading');
        const out = [];
        nodes.forEach(n => {
          const d = n.querySelector('DescriptorName');
          const term = (d?.textContent || '').replace(/[<>]/g, '');
          const isMajor = (d?.getAttribute('MajorTopicYN') || 'N') === 'Y';
          if (term) out.push({ term, isMajor });
        });
        return out;
      } catch (err) {
        this.recordError('extractMeshHeadings failed', err);
        return [];
      }
    }

    /**
     * Format authors to NLM-ish style array of strings: "Last FM"
     * Accepts raw array like [{name:""}, or CrossRef-like author objects].
     */
    formatAuthors(authors = []) {
      try {
        const fmt = (a) => {
          // Handle a few common structures
          if (a?.name) return a.name.replace(/[<>]/g, '');
          const family = (a?.family || a?.last || a?.LastName || '').replace(/[<>]/g, '');
          const given = (a?.given || a?.first || a?.ForeName || '').replace(/[<>]/g, '');
          // Reduce given names to initials
          const initials = given.split(/\s+/).map(x => x.charAt(0)).join('');
          const base = [family, initials].filter(Boolean).join(' ');
          return base || String(a || '').replace(/[<>]/g, '');
        };
        return authors.map(fmt).filter(Boolean);
      } catch (err) {
        this.recordError('formatAuthors failed', err);
        return [];
      }
    }

    /**
     * Fetch related articles (if supported/available). For offline safety,
     * returns cached or empty array.
     */
    async getRelatedArticles(pmid) {
      const id = String(pmid || '').trim();
      if (!/^\d{1,8}$/.test(id)) throw new Error('Invalid PMID');

      const cached = this.relatedCache.get(id);
      if (!navigator.onLine && cached) return cached;

      // Placeholder: E-utilities "elink" could be used here. We keep this
      // offline-friendly by returning [] unless you later wire elink.
      // Emit event for UI stubs or future integration.
      const related = cached || [];
      this.relatedCache.set(id, related);
      this._persistRelated();
      this.eventBus?.emit?.('pubmed:relatedFetched', { pmid: id, related });
      return related;
    }

    /**
     * Return NLM-ish formatted citation string. Tolerant to missing fields.
     * style: only 'NLM' supported here (soft parameter).
     */
    formatCitation(record, style = 'NLM') {
      if (!record) return '';
      try {
        const authors = Array.isArray(record.authors) ? record.authors.slice(0, 6) : [];
        const authorStr = authors.join(', ') + (Array.isArray(record.authors) && record.authors.length > 6 ? ', et al' : '');
        const parts = [];

        if (authorStr.trim()) parts.push(`${authorStr}.`);
        if (record.title) parts.push(`${record.title}${record.title.endsWith('.') ? '' : '.'}`);
        const j = [];
        if (record.journal) j.push(record.journal);
        if (record.year) {
          let y = `${record.year}`;
          if (record.volume) {
            y += `;${record.volume}`;
            if (record.issue) y += `(${record.issue})`;
            if (record.pages) y += `:${record.pages}`;
          }
          j.push(y);
        }
        if (j.length) parts.push(j.join('. ') + '.');
        if (record.pmid) parts.push(`PMID: ${record.pmid}.`);
        if (record.doi) parts.push(`doi: ${record.doi}.`);

        return parts.join(' ');
      } catch (err) {
        this.recordError('formatCitation failed', err);
        return '';
      }
    }

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    _normalizeESummary(pmid, esum) {
      try {
        // eSummary JSON layout: { result: { uids:[pmid], [pmid]:{...} } }
        const node = (esum && esum[pmid]) || esum?.result?.[pmid] || esum;
        const title = (node?.title || '').replace(/[<>]/g, '');
        const journal = (node?.fulljournalname || node?.source || '').replace(/[<>]/g, '');
        const year = (node?.pubdate || '').match(/\d{4}/)?.[0] || '';
        const volume = node?.volume || '';
        const issue = node?.issue || '';
        const pages = node?.pages || '';
        const doi = (Array.isArray(node?.articleids) ? node.articleids.find(a => a.idtype === 'doi')?.value : '') || '';
        const authorList = Array.isArray(node?.authors) ? node.authors : [];
        const authors = this.formatAuthors(authorList);

        const rec = {
          pmid,
          title,
          journal,
          year,
          volume,
          issue,
          pages,
          doi,
          authors,
          mesh: [],         // can be filled by EFetch XML if you add that path
          citation: '',     // computed on demand
          raw: undefined    // for debugging if needed
        };
        rec.citation = this.formatCitation(rec);
        return rec;
      } catch (err) {
        this.recordError('_normalizeESummary failed', err);
        return { pmid, title: '', journal: '', year: '', volume: '', issue: '', pages: '', doi: '', authors: [], mesh: [], citation: '' };
      }
    }

    // Caching
    _restoreCache() {
      try {
        const raw = localStorage.getItem(this.cacheKey);
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach(r => r?.pmid && this.cache.set(String(r.pmid), r));
      } catch (_) {}
    }
    _persistCache() {
      try {
        const arr = Array.from(this.cache.values());
        localStorage.setItem(this.cacheKey, JSON.stringify(arr));
      } catch (_) {}
    }
    _cacheSet(id, record) {
      this.cache.set(String(id), record);
      this._persistCache();
      this.lastActivity = new Date().toISOString();
    }

    _restoreRelated() {
      try {
        const raw = localStorage.getItem(this.relatedCacheKey);
        if (!raw) return;
        const obj = JSON.parse(raw);
        if (obj && typeof obj === 'object') {
          Object.entries(obj).forEach(([k, v]) => this.relatedCache.set(k, Array.isArray(v) ? v : []));
        }
      } catch (_) {}
    }
    _persistRelated() {
      try {
        const obj = {};
        this.relatedCache.forEach((v, k) => obj[k] = v);
        localStorage.setItem(this.relatedCacheKey, JSON.stringify(obj));
      } catch (_) {}
    }

    // Diagnostics & logging
    recordError(message, error) {
      const rec = { message, error: error?.message || String(error), stack: error?.stack, timestamp: new Date().toISOString() };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'PubMedIntegration', message, error: rec.error });
    }
    log(message) {
      if (window.SilentStacks?.config?.debug) console.log('[PubMedIntegration]', message);
    }
    getHealthStatus() {
      return {
        name: 'PubMedIntegration',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        cachedRecords: this.cache.size,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5)
      };
    }
  }

  // Register module
  const mod = new PubMedIntegration();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('PubMedIntegration', mod);
  } else {
    window.SilentStacks = window.SilentStacks || {};
    window.SilentStacks.modules = window.SilentStacks.modules || {};
    window.SilentStacks.modules.PubMedIntegration = mod;
  }

  console.log('📦 PubMedIntegration loaded');
})();
