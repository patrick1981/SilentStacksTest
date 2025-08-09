// modules/ui/notifications.js
(() => {
  'use strict';

  /**
   * Notifications
   * Toast notifications + status messages
   * - Types: success | error | warning | info
   * - Auto-dismiss with hover pause
   * - Stacking with max visible
   * - ARIA live announcements
   * - Action buttons
   * - Persistent (duration=0 or null)
   */
  class Notifications {
    static dependencies = ['UIController'];
    static required = true;

    constructor() {
      this.initialized = false;
      this.lastActivity = new Date().toISOString();
      this.errors = [];

      // Core
      this.stateManager = null;
      this.eventBus = null;

      // DOM utils
      this.dom = window.SilentStacks?.utils?.domUtils ?? {
        createElement: (tag, attrs = {}, children = []) => {
          const el = document.createElement(tag);
          for (const [k, v] of Object.entries(attrs)) {
            if (k === 'text') { el.textContent = v; continue; }
            if (k === 'class') { el.className = v; continue; }
            if (k === 'dataset') { for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv; continue; }
            if (k.startsWith('aria-')) { el.setAttribute(k, v); continue; }
            el.setAttribute(k, v);
          }
          for (const c of [].concat(children)) {
            if (c == null) continue;
            el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
          }
          return el;
        },
        safeSetText: (el, text) => { if (el) el.textContent = String(text ?? ''); }
      };

      // Sanitizer
      this.sanitize = (window.SilentStacks?.security?.sanitizer?.sanitize) ?? ((v) => (typeof v === 'string' ? v.replace(/[<>"'&]/g, '') : v));

      // State
      this.container = null;
      this.liveRegion = null;
      this.items = new Map(); // id -> {el, timeoutId, createdAt}
      this.maxVisible = 4;
      this.nextId = 1;
    }

    async initialize() {
      try {
        this.stateManager = window.SilentStacks?.core?.stateManager ?? null;
        this.eventBus = window.SilentStacks?.core?.eventBus ?? null;

        await this.setupModule();

        this.initialized = true;
        this.lastActivity = new Date().toISOString();
        this.log('Initialized Notifications');
        return { status: 'success', module: 'Notifications' };
      } catch (error) {
        this.recordError('Initialization failed', error);
        throw error;
      }
    }

    async setupModule() {
      // Toast container
      this.container = this.dom.createElement('div', {
        id: 'toast-container',
        class: 'notification-container',
        'aria-live': 'polite',
        'aria-relevant': 'additions'
      });

      // Screen-reader live region (visually hidden)
      this.liveRegion = this.dom.createElement('div', {
        id: 'toast-live',
        class: 'visually-hidden',
        role: 'status',
        'aria-live': 'polite'
      });

      document.body.appendChild(this.container);
      document.body.appendChild(this.liveRegion);

      // Listen for global errors to surface as toasts (optional)
      this.eventBus?.on?.('error', (e) => {
        if (!e?.message) return;
        this.showError(e.message);
      });
    }

    // ===== Required API =====

    /**
     * show(message, type, duration, actions)
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} [type='info']
     * @param {number} [duration=4000] ms; 0/null => persistent
     * @param {Array<{label:string,onClick:Function,type?:'primary'|'danger'|'ghost'}>} [actions=[]]
     * @returns {string} notificationId
     */
    show(message, type = 'info', duration = 4000, actions = []) {
      try {
        const msg = this.sanitize(String(message ?? '').trim());
        const kind = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
        const id = `ntf-${Date.now()}-${this.nextId++}`;

        // Enforce max visible (dismiss oldest non-persistent)
        this._enforceMaxVisible();

        const toast = this._buildToast({ id, msg, kind, actions, duration });
        this.container.appendChild(toast.el);
        requestAnimationFrame(() => toast.el.classList.add('active')); // animate-in

        // SR announce
        this.dom.safeSetText(this.liveRegion, `${kind.toUpperCase()}: ${msg}`);

        // Auto-dismiss
        if (duration && duration > 0) {
          toast.timeoutId = setTimeout(() => this.dismiss(id), duration);
        }

        this.items.set(id, toast);
        this.eventBus?.emit?.('notify:show', { id, type: kind, message: msg, duration });
        this.lastActivity = new Date().toISOString();
        return id;
      } catch (e) {
        this.recordError('show failed', e);
        return '';
      }
    }

    showSuccess(message, duration = 4000) { return this.show(message, 'success', duration); }
    showError(message, duration = 6000) { return this.show(message, 'error', duration); }
    showWarning(message, duration = 5000) { return this.show(message, 'warning', duration); }

    /**
     * dismiss(notificationId)
     */
    dismiss(notificationId) {
      const item = this.items.get(notificationId);
      if (!item) return;
      try {
        if (item.timeoutId) clearTimeout(item.timeoutId);
        item.el.classList.remove('active');
        item.el.classList.add('hidden');
        // Remove after CSS transition (~250ms)
        setTimeout(() => {
          item.el.remove();
          this.items.delete(notificationId);
          this.eventBus?.emit?.('notify:dismiss', { id: notificationId });
        }, 300);
      } catch (e) {
        this.recordError('dismiss failed', e);
      }
    }

    /**
     * dismissAll()
     */
    dismissAll() {
      for (const id of [...this.items.keys()]) {
        this.dismiss(id);
      }
    }

    // ===== Internals =====

    _enforceMaxVisible() {
      const entries = [...this.items.entries()];
      const visible = entries.filter(([_, t]) => !!t && document.body.contains(t.el));
      if (visible.length < this.maxVisible) return;

      // Dismiss the oldest with an active timeout (non-persistent first)
      const sorted = visible.sort((a, b) => (a[1].createdAt - b[1].createdAt));
      for (const [id, t] of sorted) {
        const persistent = !(t.duration && t.duration > 0);
        if (!persistent) {
          this.dismiss(id);
          return;
        }
      }
      // If all persistent, remove the very oldest (last resort)
      const [oldestId] = sorted[0] || [];
      if (oldestId) this.dismiss(oldestId);
    }

    _buildToast({ id, msg, kind, actions, duration }) {
      const iconMap = {
        success: '✓',
        error: '⛔',
        warning: '⚠️',
        info: 'ℹ️'
      };

      const el = this.dom.createElement('div', {
        class: `notification notification--${kind}`,
        role: 'status',
        'aria-live': 'polite',
        tabindex: '0',
        dataset: { id }
      }, [
        this.dom.createElement('div', { class: 'notification__icon', text: iconMap[kind] || '•' }),
        this.dom.createElement('div', { class: 'notification__message', text: msg }),
        this._buildActions(actions, id),
        this._buildCloseButton(id)
      ]);

      // Pause auto-dismiss on hover/focus
      const onEnter = () => {
        const t = this.items.get(id);
        if (t?.timeoutId) {
          clearTimeout(t.timeoutId);
          t.timeoutId = null;
        }
      };
      const onLeave = () => {
        const t = this.items.get(id);
        if (t && !t.timeoutId && duration && duration > 0) {
          t.timeoutId = setTimeout(() => this.dismiss(id), 1200); // short grace after hover
        }
      };
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('focusin', onEnter);
      el.addEventListener('mouseleave', onLeave);
      el.addEventListener('focusout', onLeave);

      return {
        id,
        el,
        timeoutId: null,
        createdAt: Date.now(),
        duration
      };
    }

    _buildActions(actions, id) {
      const wrap = this.dom.createElement('div', { class: 'notification__actions' });
      if (!Array.isArray(actions) || actions.length === 0) return wrap;

      for (const a of actions) {
        const label = this.sanitize(String(a?.label ?? 'Action'));
        const type = ['primary', 'danger', 'ghost'].includes(a?.type) ? a.type : 'ghost';
        const btn = this.dom.createElement('button', {
          type: 'button',
          class: `btn btn--sm btn--${type}`,
          'aria-label': label,
          text: label
        });
        btn.addEventListener('click', async () => {
          try {
            if (typeof a?.onClick === 'function') {
              await a.onClick();
            }
            // default behavior: keep toast; caller can call dismiss inside onClick if desired
          } catch (e) {
            this.recordError('notification action failed', e);
          }
        });
        wrap.appendChild(btn);
      }

      return wrap;
    }

    _buildCloseButton(id) {
      const close = this.dom.createElement('button', {
        type: 'button',
        class: 'btn btn--icon notification__close',
        'aria-label': 'Dismiss notification'
      }, [this.dom.createElement('span', { class: 'visually-hidden', text: 'Close' })]);

      close.addEventListener('click', () => this.dismiss(id));
      return close;
    }

    // ===== Diagnostics =====

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
        module: 'Notifications',
        message,
        error: errorRecord.error
      });
    }

    log(message) {
      if (window.SilentStacks?.config?.debug) {
        console.log(`[Notifications] ${message}`);
      }
    }

    getHealthStatus() {
      return {
        name: 'Notifications',
        status: this.initialized ? 'healthy' : 'not-initialized',
        initialized: this.initialized,
        lastActivity: this.lastActivity,
        errors: this.errors.slice(-5),
        performance: {
          activeToasts: this.items.size,
          maxVisible: this.maxVisible
        }
      };
    }
  }

  // Registration
  const moduleInstance = new Notifications();
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('Notifications', moduleInstance);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.Notifications = moduleInstance;
  }

  console.log('📦 Notifications loaded');
})();