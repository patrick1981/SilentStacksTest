// modules/integrations/clinical-trials.js
// SilentStacks v2.0 — ClinicalTrials.gov Integration (offline-resilient)

(() => {
  'use strict';

  class ClinicalTrialsIntegration {
    static dependencies = ['APIClient'];
    static required = false;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      // Core
      this.stateManager = null;
      this.eventBus = null;
      this.api = null;

      // Cache (NCT -> details)
      this.cacheKey = 'ss_trials_cache';
      this.cache = new Map(); // nctId -> trialData

      // Mapping PMID -> NCT[] (extracted or looked up)
      this.mapKey = 'ss_trials_pmid_map';
      this.pmidMap = new Map(); // pmid -> [NCT...]
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager || null;
        this.eventBus = window.SilentStacks?.core?.eventBus || null;
        this.api = (window.SilentStacks?.modules?.APIClient) || null;

        this._restoreCaches();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('ClinicalTrialsIntegration initialized');
        return { status: 'success', module: 'ClinicalTrialsIntegration' };
      } catch (err) {
        this.recordError('Initialization failed', err);
        throw err;
      }
    }

    // ------------------------------------------------------------
    // Public API (required methods)
    // ------------------------------------------------------------

    /**
     * Given a PMID, try to find related trials.
     * Strategy:
     *  1) Use cached mapping if present
     *  2) If a PubMed record is available in state/cache, scan abstract/title for NCT IDs
     *  3) Return NCT list (empty if offline and none cached)
     */
    async findTrialsByPMID(pmid) {
      const id = String(pmid || '').trim();
      if (!/^\d{1,8}$/.test(id)) throw new Error('Invalid PMID');

      // 1) Cached mapping
      const cached = this.pmidMap.get(id);
      if (cached && cached.length) return cached;

      // 2) Try to read PubMed record from PubMedIntegration module cache (if loaded)
      const pub = window.SilentStacks?.modules?.PubMedIntegration;
      let text = '';
      if (pub && pub.cache && pub.cache.get) {
        const rec = pub.cache.get(id);
        if (rec) {
          text = [rec.title, rec.abstract || '', rec.journal || ''].filter(Boolean).join(' ');
        }
      }

      const ncts = this.extractNCTFromText(text);
      if (ncts.length) {
        this.pmidMap.set(id, ncts);
        this._persistPmidMap();
        this.eventBus?.emit?.('trials:pmidLinked', { pmid: id, ncts });
      }
      return ncts;
    }

    /**
     * Fetch detailed trial info. Works offline (serves cached).
     */
    async fetchTrialDetails(nctId) {
      const id = this._normalizeNCT(nctId);
      if (!/^NCT\d{8}$/.test(id)) throw new Error('Invalid NCT Id');

      const cached = this.cache.get(id);
      if (!navigator.onLine && cached) {
        this.log(`Offline — serving cached trial ${id}`);
        return cached;
      }

      try {
        if (!this.api?.fetchClinicalTrialsData) throw new Error('APIClient not available');
        const data = await this.api.fetchClinicalTrialsData(id);
        const trial = this._normalizeTrial(data, id);
        this._cacheSet(id, trial);
        this.eventBus?.emit?.('trials:detailsFetched', { nctId: id, trial });
        return trial;
      } catch (err) {
        this.recordError(`ClinicalTrials fetch failed: ${id}`, err);
        if (cached) return cached;
        const placeholder = { nctId: id, title: '', status: 'unknown', phase: '', enrollment: '', locations: [], sponsors: [], offline: !navigator.onLine };
        this._cacheSet(id, placeholder);
        return placeholder;
      }
    }

    /**
     * Extract NCT IDs from text (title/abstract). Returns unique array.
     */
    extractNCTFromText(text = '') {
      try {
        const ids = new Set();
        const re = /\bNCT\d{8}\b/gi;
        const m = String(text).match(re) || [];
        m.forEach(x => ids.add(x.toUpperCase()));
        return Array.from(ids);
      } catch (err) {
        this.recordError('extractNCTFromText failed', err);
        return [];
      }
    }

    /**
     * Format a trial for UI card rendering.
     */
    formatTrialInfo(trialData = {}) {
      const t = trialData || {};
      return {
        nctId: t.nctId || '',
        title: (t.title || '').replace(/[<>]/g, ''),
        status: this.getTrialStatus(t),
        phase: this.getTrialPhase(t),
        enrollment: t.enrollment || '',
        sponsors: Array.isArray(t.sponsors) ? t.sponsors.join(', ') : String(t.sponsors || ''),
        locations: Array.isArray(t.locations) ? t.locations.slice(0, 3).join('; ') + (t.locations.length > 3 ? '…' : '') : ''
      };
    }

    getTrialPhase(trialData = {}) {
      const phase = (trialData.phase || '').replace(/[<>]/g, '').trim();
      // Normalize common variants (e.g., "Phase 2/Phase 3")
      return phase || 'Not Provided';
    }

    getTrialStatus(trialData = {}) {
      const st = (trialData.status || '').replace(/[<>]/g, '').trim();
      return st || 'Unknown';
    }

    // ------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------
    _normalizeNCT(nct) {
      const s = String(nct || '').toUpperCase();
      if (s.startsWith('NCT')) return s;
      return `NCT${s.replace(/\D/g, '').padStart(8, '0')}`;
    }

    _normalizeTrial(apiResponse, fallbackId) {
      try {
        // ClinicalTrials.gov v2-ish JSON wrapper: figure out a few common shapes
        // We'll search for the first good-looking study node.
        const obj = apiResponse || {};
        const study =
          obj?.FullStudiesResponse?.FullStudies?.[0]?.Study ||
          obj?.Study ||
          obj?.full_studies?.[0]?.study ||
          obj; // last resort

        const id =
          study?.ProtocolSection?.IdentificationModule?.NCTId ||
          fallbackId;

        const title =
          study?.ProtocolSection?.IdentificationModule?.OfficialTitle ||
          study?.ProtocolSection?.IdentificationModule?.BriefTitle ||
          '';

        const status =
          study?.ProtocolSection?.StatusModule?.OverallStatus ||
          study?.status ||
          '';

        const phase =
          study?.ProtocolSection?.DesignModule?.PhaseList?.Phase?.[0] ||
          study?.ProtocolSection?.DesignModule?.Phase ||
          study?.phase ||
          '';

        const enrollment =
          study?.ProtocolSection?.DesignModule?.EnrollmentInfo?.EnrollmentCount ||
          study?.ProtocolSection?.DesignModule?.EnrollmentInfo?.EnrollmentCount?.toString?.() ||
          study?.enrollment ||
          '';

        const sponsors =
          study?.ProtocolSection?.SponsorCollaboratorsModule?.LeadSponsor?.Name ||
          study?.sponsors ||
          '';

        const sponsorList = Array.isArray(sponsors) ? sponsors
                            : sponsors ? [String(sponsors)] : [];

        // Locations (collapse to "City, Country")
        const locationsRaw = study?.ProtocolSection?.ContactsLocationsModule?.LocationList?.Location || [];
        const locs = Array.isArray(locationsRaw) ? locationsRaw.map(l => {
          const city = l?.LocationCity || '';
          const country = l?.LocationCountry || '';
          return [city, country].filter(Boolean).join(', ');
        }).filter(Boolean) : [];

        return {
          nctId: id || fallbackId,
          title: (title || '').replace(/[<>]/g, ''),
          status: (status || '').replace(/[<>]/g, ''),
          phase: (phase || '').replace(/[<>]/g, ''),
          enrollment: String(enrollment || '').replace(/[<>]/g, ''),
          sponsors: sponsorList.map(s => String(s).replace(/[<>]/g, '')),
          locations: locs
        };
      } catch (err) {
        this.recordError('_normalizeTrial failed', err);
        return { nctId: fallbackId, title: '', status: 'unknown', phase: '', enrollment: '', sponsors: [], locations: [] };
      }
    }

    _restoreCaches() {
      try {
        const raw = localStorage.getItem(this.cacheKey);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) arr.forEach(t => t?.nctId && this.cache.set(String(t.nctId).toUpperCase(), t));
        }
      } catch (_) {}
      try {
        const raw2 = localStorage.getItem(this.mapKey);
        if (raw2) {
          const obj = JSON.parse(raw2);
          if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([k, v]) => this.pmidMap.set(String(k), Array.isArray(v) ? v : []));
          }
        }
      } catch (_) {}
    }

    _persistCache() {
      try {
        const arr = Array.from(this.cache.values());
        localStorage.setItem(this.cacheKey, JSON.stringify(arr));
      } catch (_) {}
    }
    _cacheSet(id, trial) {
      this.cache.set(String(id).toUpperCase(), trial);
      this._persistCache();
      this.lastActivity = new Date().toISOString();
    }

    _persistPmidMap() {
      try {
        const obj = {};
        this.pmidMap.forEach((v, k) => obj[k] = v);
        localStorage.setItem(this.mapKey, JSON.stringify(obj));
      } catch (_) {}
    }

    // Diagnostics
    recordError(message, error) {
      const rec = { message, error: error?.message || String(error), stack: error?.stack, timestamp: new Date().toISOString() };
      this.errors.push(rec);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);
      window.SilentStacks?.core?.diagnostics?.recordIssue?.({ type: 'error', module: 'ClinicalTrialsIntegration', message, error: rec.error });
    }
    log(message) {
      if (window.SilentStacks?.config?.debug) console.log('[ClinicalTrialsIntegration]', message);
    }
    getHealthStatus() {
      return {
        name: 'ClinicalTrialsIntegration',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        cachedTrials: this.cache.size,
        mappedPmids: this.pmidMap.size,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5)
      };
    }
  }

  // Register module
  const mod = new ClinicalTrialsIntegration();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('ClinicalTrialsIntegration', mod);
  } else {
    window.SilentStacks = window.SilentStacks || {};
    window.SilentStacks.modules = window.SilentStacks.modules || {};
    window.SilentStacks.modules.ClinicalTrialsIntegration = mod;
  }

  console.log('📦 ClinicalTrialsIntegration loaded');
})();