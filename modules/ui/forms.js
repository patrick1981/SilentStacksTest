// modules/ui/forms.js
(() => {
  'use strict';

  /**
   * Forms Module
   * Handles:
   * - Real-time validation (with utils/validators if available)
   * - Submission workflow via RequestManager
   * - Form state persistence (autoSave)
   * - Dynamic field population
   * - Error display/clearing
   */
  class Forms {
    static dependencies = ['UIController', 'RequestManager'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      this.stateManager = null;
      this.eventBus = null;
      this.ui = null;
      this.requestManager = null;

      // Validation utils
      this.validators = window.SilentStacks?.utils?.validators ?? {};

      // DOM utils
      this.dom = window.SilentStacks?.utils?.domUtils ?? {
        qs: (sel, root = document) => root.querySelector(sel),
        qsa: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
        safeSetText: (el, text) => { if (el) el.textContent = String(text ?? ''); }
      };

      // Form state
      this.forms = new Map(); // formId -> {el, autoSaveTimer}
      this.autoSaveInterval = 5000; // ms

      // CSS selectors / IDs from spec
      this.formIds = ['request-form'];
      this.fieldIds = [
        'pmid', 'doi', 'title', 'authors', 'journal', 'year',
        'volume', 'issue', 'pages', 'priority', 'status', 'notes'
      ];
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;
        this.ui = window.SilentStacks?.modules?.UIController ?? null;
        this.requestManager = window.SilentStacks?.modules?.RequestManager ?? null;

        await this.setupModule();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized Forms module');
        return { status: 'success', module: 'Forms' };
      } catch (error) {
        this.recordError('Initialization failed', error);
        throw error;
      }
    }

    async setupModule() {
      for (const id of this.formIds) {
        const formEl = this.dom.qs(`#${id}`);
        if (!formEl) continue;
        this.forms.set(id, { el: formEl, autoSaveTimer: null });

        // Wire submit
        formEl.addEventListener('submit', (e) => {
          e.preventDefault();
          this.submitForm(id).catch(err => this.recordError('Form submit failed', err));
        });

        // Wire change for autoSave + live validation
        formEl.addEventListener('input', () => {
          this.autoSave(id);
          this.validateForm(id);
        });

        // Restore saved state if exists
        const saved = this.stateManager?.getState(`form:${id}`);
        if (saved) this.populateForm(id, saved);
      }
    }

    // ===== Required API =====

    validateForm(formId) {
      try {
        const form = this.forms.get(formId)?.el;
        if (!form) throw this._publicError(`No such form: ${formId}`);

        const errors = [];
        for (const fid of this.fieldIds) {
          const input = form.querySelector(`#${fid}`);
          if (!input) continue;

          let isValid = true;
          const val = input.value.trim();

          if (fid === 'pmid' && val && this.validators.validatePMID && !this.validators.validatePMID(val)) {
            isValid = false;
          }
          if (fid === 'doi' && val && this.validators.validateDOI && !this.validators.validateDOI(val)) {
            isValid = false;
          }
          if (fid === 'year' && val && !/^\d{4}$/.test(val)) {
            isValid = false;
          }

          input.classList.toggle('error', !isValid);
          if (!isValid) errors.push({ field: fid, message: `Invalid ${fid}` });
        }

        if (errors.length) {
          this.showFieldErrors(errors);
          return false;
        } else {
          this.clearFieldErrors(formId);
          return true;
        }
      } catch (e) {
        this.recordError('validateForm failed', e);
        return false;
      }
    }

    async submitForm(formId) {
      try {
        if (!this.validateForm(formId)) {
          this.ui?.showModal('Please correct form errors before submitting.', { title: 'Form Error', type: 'warning' });
          return;
        }
        const form = this.forms.get(formId)?.el;
        if (!form) return;

        const formData = {};
        for (const fid of this.fieldIds) {
          const input = form.querySelector(`#${fid}`);
          formData[fid] = input?.value?.trim() ?? '';
        }

        await this.requestManager.addRequest(formData);

        this.clearForm(formId);
        this.stateManager?.setState(`form:${formId}`, null);
        this.ui?.showModal('Request submitted successfully.', { title: 'Success', type: 'success' });
      } catch (e) {
        this.recordError('submitForm failed', e);
        this.ui?.showModal('Failed to submit request. Please try again.', { title: 'Error', type: 'error' });
      }
    }

    populateForm(formId, data) {
      try {
        const form = this.forms.get(formId)?.el;
        if (!form) return;
        for (const [fid, value] of Object.entries(data || {})) {
          const input = form.querySelector(`#${fid}`);
          if (input) input.value = value ?? '';
        }
      } catch (e) {
        this.recordError('populateForm failed', e);
      }
    }

    clearForm(formId) {
      try {
        const form = this.forms.get(formId)?.el;
        if (!form) return;
        form.reset();
        this.clearFieldErrors(formId);
      } catch (e) {
        this.recordError('clearForm failed', e);
      }
    }

    showFieldErrors(errors) {
      try {
        for (const err of errors) {
          const fieldEl = document.getElementById(err.field);
          if (!fieldEl) continue;
          fieldEl.classList.add('error');
          let msgEl = fieldEl.parentElement.querySelector('.error-message');
          if (!msgEl) {
            msgEl = document.createElement('div');
            msgEl.className = 'error-message';
            fieldEl.parentElement.appendChild(msgEl);
          }
          this.dom.safeSetText(msgEl, err.message);
        }
      } catch (e) {
        this.recordError('showFieldErrors failed', e);
      }
    }

    clearFieldErrors(formId) {
      try {
        const form = this.forms.get(formId)?.el;
        if (!form) return;
        const errEls = form.querySelectorAll('.error-message');
        errEls.forEach(el => el.remove());
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
      } catch (e) {
        this.recordError('clearFieldErrors failed', e);
      }
    }

    autoSave(formId) {
      try {
        const formEntry = this.forms.get(formId);
        if (!formEntry) return;
        const form = formEntry.el;
        const data = {};
        for (const fid of this.fieldIds) {
          const input = form.querySelector(`#${fid}`);
          data[fid] = input?.value ?? '';
        }
        this.stateManager?.setState(`form:${formId}`, data);
        this.lastActivity = new Date().toISOString();
      } catch (e) {
        this.recordError('autoSave failed', e);
      }
    }

    // REQUIRED: Error handling
    recordError(message, error) {
      const errorRecord = {
        message,
        error: error?.message || String(error),
        stack: (window.SilentStacks?.config?.debug ? error?.stack : undefined),
        timestamp: new Date().toISOString()
      };
      this.errors.push(errorRecord);
      if (this.errors.length > 100) this.errors = this.errors.slice(-100);

      window.SilentStacks?.core?.diagnostics?.recordIssue?.({
        type: 'error',
        module: 'Forms',
        message,
        error: errorRecord.error
      });
    }

    log(message) {
      if (window.SilentStacks?.config?.debug) {
        console.log(`[Forms] ${message}`);
      }
    }

    getHealthStatus() {
      return {
        name: 'Forms',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {
          formsManaged: this.forms.size,
          autoSaveInterval: this.autoSaveInterval
        }
      };
    }

    _publicError(message) {
      const safe = String(message || 'Unexpected error');
      const err = new Error(safe);
      err.public = true;
      return err;
    }
  }

  const moduleInstance = new Forms();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('Forms', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.Forms = moduleInstance;
  }

  console.log('📦 Forms loaded');
})();
