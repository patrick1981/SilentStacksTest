// utils/dom-utils.js
// SilentStacks v2.0 - Safe DOM Utilities
// Copy this file to: utils/dom-utils.js

(() => {
  'use strict';

  class DOMUtils {
    constructor() {
      this.sanitizer = null; // Will be set by bootstrap
    }

    // Create element safely without innerHTML
    createElement(tag, attributes = {}, children = []) {
      const element = document.createElement(tag);
      
      // Set attributes safely
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'textContent') {
          element.textContent = this.sanitizeText(value);
        } else if (key === 'className') {
          element.className = value;
        } else if (key === 'innerHTML') {
          // Discouraged - use children instead
          console.warn('Use children instead of innerHTML for security');
          element.innerHTML = this.sanitizeHTML(value);
        } else if (key.startsWith('on')) {
          // Event handlers
          if (typeof value === 'function') {
            element.addEventListener(key.substring(2), value);
          }
        } else {
          element.setAttribute(key, value);
        }
      });
      
      // Add children safely
      children.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
          element.appendChild(child);
        } else if (child && typeof child === 'object') {
          // Object with tag/attributes/children
          const childElement = this.createElement(child.tag, child.attributes, child.children);
          element.appendChild(childElement);
        }
      });
      
      return element;
    }

    // Safe text content setting
    safeSetText(element, text) {
      if (!element) return;
      element.textContent = this.sanitizeText(text);
    }

    // Safe HTML setting (discouraged - use createElement instead)
    safeSetHTML(element, htmlString) {
      if (!element) return;
      
      console.warn('safeSetHTML is discouraged - use createElement instead');
      
      // Clear existing content
      element.textContent = '';
      
      // Parse HTML safely
      const sanitizedHTML = this.sanitizeHTML(htmlString);
      const template = document.createElement('template');
      template.innerHTML = sanitizedHTML;
      
      // Clone and append
      const fragment = template.content.cloneNode(true);
      element.appendChild(fragment);
    }

    // Sanitize text content
    sanitizeText(text) {
      if (!text) return '';
      
      // Use global sanitizer if available
      if (window.SilentStacks?.security?.sanitizer) {
        return window.SilentStacks.security.sanitizer.sanitize(text, 'text');
      }
      
      // Fallback sanitization
      return String(text).replace(/[<>]/g, '');
    }

    // Sanitize HTML (basic protection)
    sanitizeHTML(html) {
      if (!html) return '';
      
      // Use global sanitizer if available
      if (window.SilentStacks?.security?.sanitizer) {
        return window.SilentStacks.security.sanitizer.sanitize(html, 'text');
      }
      
      // Fallback - remove all HTML tags
      const div = document.createElement('div');
      div.textContent = html;
      return div.innerHTML;
    }

    // Create request card using safe DOM methods
    createRequestCard(request) {
      const card = this.createElement('div', {
        className: 'request-card',
        'data-request-id': request.id
      });

      // Title section
      const titleSection = this.createElement('div', { className: 'card-header' }, [
        this.createElement('h3', { className: 'request-title' }, [
          this.sanitizeText(request.title || 'Untitled Request')
        ]),
        this.createElement('div', { className: 'request-meta' }, [
          this.createElement('span', { className: 'request-id' }, [`ID: ${request.id}`]),
          this.createElement('span', { className: 'request-date' }, [
            new Date(request.dateAdded).toLocaleDateString()
          ])
        ])
      ]);

      // Content section
      const contentSection = this.createElement('div', { className: 'card-content' }, [
        this.createElement('div', { className: 'request-authors' }, [
          this.createElement('strong', {}, ['Authors: ']),
          this.sanitizeText(request.authors || 'Not specified')
        ]),
        this.createElement('div', { className: 'request-journal' }, [
          this.createElement('strong', {}, ['Journal: ']),
          this.sanitizeText(request.journal || 'Not specified')
        ]),
        this.createElement('div', { className: 'request-year' }, [
          this.createElement('strong', {}, ['Year: ']),
          this.sanitizeText(request.year || 'Unknown')
        ])
      ]);

      // Add PMID if available
      if (request.pmid) {
        contentSection.appendChild(
          this.createElement('div', { className: 'request-pmid' }, [
            this.createElement('strong', {}, ['PMID: ']),
            this.createElement('a', {
              href: `https://pubmed.ncbi.nlm.nih.gov/${request.pmid}/`,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, [request.pmid])
          ])
        );
      }

      // Add DOI if available
      if (request.doi) {
        contentSection.appendChild(
          this.createElement('div', { className: 'request-doi' }, [
            this.createElement('strong', {}, ['DOI: ']),
            this.createElement('a', {
              href: `https://doi.org/${request.doi}`,
              target: '_blank',
              rel: 'noopener noreferrer'
            }, [request.doi])
          ])
        );
      }

      // Status and priority
      const statusSection = this.createElement('div', { className: 'card-status' }, [
        this.createElement('span', {
          className: `status-badge status-${request.status || 'pending'}`
        }, [this.sanitizeText(request.status || 'Pending')]),
        this.createElement('span', {
          className: `priority-badge priority-${request.priority || 'normal'}`
        }, [this.sanitizeText(request.priority || 'Normal')])
      ]);

      // Action buttons
      const actionsSection = this.createElement('div', { className: 'card-actions' }, [
        this.createElement('button', {
          className: 'btn btn-sm btn-primary',
          onclick: () => this.editRequest(request.id)
        }, ['Edit']),
        this.createElement('button', {
          className: 'btn btn-sm btn-secondary',
          onclick: () => this.duplicateRequest(request.id)
        }, ['Duplicate']),
        this.createElement('button', {
          className: 'btn btn-sm btn-danger',
          onclick: () => this.deleteRequest(request.id)
        }, ['Delete'])
      ]);

      // Clinical trials indicator
      if (request.clinicalTrials && request.clinicalTrials.length > 0) {
        const trialsIndicator = this.createElement('div', {
          className: 'clinical-trials-indicator'
        }, [
          this.createElement('span', { className: 'trials-icon' }, ['🧪']),
          this.createElement('span', {}, [`${request.clinicalTrials.length} Clinical Trial(s)`])
        ]);
        statusSection.appendChild(trialsIndicator);
      }

      // MeSH headings indicator
      if (request.meshHeadings && request.meshHeadings.length > 0) {
        const meshIndicator = this.createElement('div', {
          className: 'mesh-indicator'
        }, [
          this.createElement('span', { className: 'mesh-icon' }, ['🏷️']),
          this.createElement('span', {}, [`${request.meshHeadings.length} MeSH Terms`])
        ]);
        statusSection.appendChild(meshIndicator);
      }

      // Assemble card
      card.appendChild(titleSection);
      card.appendChild(contentSection);
      card.appendChild(statusSection);
      card.appendChild(actionsSection);

      return card;
    }

    // Create form field safely
    createFormField(config) {
      const {
        type = 'text',
        id,
        name,
        label,
        placeholder = '',
        required = false,
        value = '',
        options = [], // for select fields
        className = 'form-group'
      } = config;

      const fieldContainer = this.createElement('div', { className });

      // Label
      if (label) {
        const labelElement = this.createElement('label', {
          'for': id
        }, [this.sanitizeText(label)]);
        fieldContainer.appendChild(labelElement);
      }

      // Input field
      let inputElement;
      
      if (type === 'select') {
        inputElement = this.createElement('select', {
          id, name, required
        });
        
        options.forEach(option => {
          const optionElement = this.createElement('option', {
            value: option.value
          }, [this.sanitizeText(option.label)]);
          
          if (option.value === value) {
            optionElement.selected = true;
          }
          
          inputElement.appendChild(optionElement);
        });
      } else if (type === 'textarea') {
        inputElement = this.createElement('textarea', {
          id, name, placeholder, required,
          textContent: this.sanitizeText(value)
        });
      } else {
        inputElement = this.createElement('input', {
          type, id, name, placeholder, required,
          value: this.sanitizeText(value)
        });
      }

      fieldContainer.appendChild(inputElement);

      return fieldContainer;
    }

    // Create notification safely
    createNotification(message, type = 'info', duration = 5000) {
      const notification = this.createElement('div', {
        className: `notification notification-${type}`,
        role: 'alert',
        'aria-live': 'polite'
      }, [
        this.createElement('div', { className: 'notification-content' }, [
          this.sanitizeText(message)
        ]),
        this.createElement('button', {
          className: 'notification-close',
          'aria-label': 'Close notification',
          onclick: (e) => {
            e.currentTarget.closest('.notification').remove();
          }
        }, ['×'])
      ]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, duration);
      }

      return notification;
    }

    // Show notification in container
    showNotification(message, type = 'info', duration = 5000) {
      let container = document.querySelector('.notifications-container');
      
      if (!container) {
        container = this.createElement('div', {
          className: 'notifications-container',
          style: 'position: fixed; top: 20px; right: 20px; z-index: 10000;'
        });
        document.body.appendChild(container);
      }

      const notification = this.createNotification(message, type, duration);
      container.appendChild(notification);

      // Slide in animation
      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
      });
    }

    // Create table safely
    createTable(headers, rows, config = {}) {
      const {
        className = 'data-table',
        sortable = false,
        selectable = false
      } = config;

      const table = this.createElement('table', { className });

      // Header
      const thead = this.createElement('thead');
      const headerRow = this.createElement('tr');

      if (selectable) {
        const selectAllCell = this.createElement('th', {}, [
          this.createElement('input', {
            type: 'checkbox',
            onclick: (e) => this.toggleAllRows(table, e.target.checked)
          })
        ]);
        headerRow.appendChild(selectAllCell);
      }

      headers.forEach((header, index) => {
        const th = this.createElement('th', {}, [this.sanitizeText(header)]);
        
        if (sortable) {
          th.style.cursor = 'pointer';
          th.addEventListener('click', () => this.sortTable(table, index));
        }
        
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body
      const tbody = this.createElement('tbody');
      
      rows.forEach(rowData => {
        const row = this.createElement('tr');
        
        if (selectable) {
          const selectCell = this.createElement('td', {}, [
            this.createElement('input', {
              type: 'checkbox',
              value: rowData.id || '',
              onchange: (e) => this.handleRowSelection(e)
            })
          ]);
          row.appendChild(selectCell);
        }

        rowData.cells.forEach(cellData => {
          const cell = this.createElement('td', {}, [
            this.sanitizeText(cellData)
          ]);
          row.appendChild(cell);
        });

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      return table;
    }

    // Toggle all table rows
    toggleAllRows(table, checked) {
      const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
        this.handleRowSelection({ target: checkbox });
      });
    }

    // Handle individual row selection
    handleRowSelection(event) {
      const checkbox = event.target;
      const row = checkbox.closest('tr');
      
      if (checkbox.checked) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }

      // Emit event for external handling
      window.SilentStacks?.core?.eventBus?.emit('table:row:selected', {
        id: checkbox.value,
        selected: checkbox.checked
      });
    }

    // Sort table by column
    sortTable(table, columnIndex) {
      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      
      const sortedRows = rows.sort((a, b) => {
        const aCell = a.cells[columnIndex].textContent.trim();
        const bCell = b.cells[columnIndex].textContent.trim();
        
        // Try numeric comparison first
        const aNum = parseFloat(aCell);
        const bNum = parseFloat(bCell);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // Fall back to string comparison
        return aCell.localeCompare(bCell);
      });

      // Clear tbody and re-append sorted rows
      tbody.innerHTML = '';
      sortedRows.forEach(row => tbody.appendChild(row));
    }

    // Create loading spinner
    createLoadingSpinner(size = 'medium') {
      return this.createElement('div', {
        className: `loading-spinner loading-${size}`,
        role: 'status',
        'aria-label': 'Loading'
      }, [
        this.createElement('div', { className: 'spinner-ring' })
      ]);
    }

    // Create progress bar
    createProgressBar(value = 0, max = 100, label = '') {
      const container = this.createElement('div', { className: 'progress-container' });
      
      if (label) {
        container.appendChild(
          this.createElement('div', { className: 'progress-label' }, [
            this.sanitizeText(label)
          ])
        );
      }

      const progressBar = this.createElement('div', { className: 'progress-bar' }, [
        this.createElement('div', {
          className: 'progress-fill',
          style: `width: ${Math.min(100, Math.max(0, (value / max) * 100))}%`
        })
      ]);

      container.appendChild(progressBar);
      return container;
    }

    // Update progress bar
    updateProgressBar(container, value, max = 100) {
      const fill = container.querySelector('.progress-fill');
      if (fill) {
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));
        fill.style.width = `${percentage}%`;
      }
    }

    // Placeholder methods for request actions (to be implemented by modules)
    editRequest(id) {
      window.SilentStacks?.core?.eventBus?.emit('request:edit', { id });
    }

    duplicateRequest(id) {
      window.SilentStacks?.core?.eventBus?.emit('request:duplicate', { id });
    }

    deleteRequest(id) {
      window.SilentStacks?.core?.eventBus?.emit('request:delete', { id });
    }

    // Get health status for diagnostics
    getHealthStatus() {
      return {
        name: 'DOMUtils',
        status: 'healthy',
        methods: Object.getOwnPropertyNames(DOMUtils.prototype).length,
        lastActivity: new Date().toISOString(),
        errors: []
      };
    }
  }

  // Create and register the utility
  const domUtils = new DOMUtils();

  // Register with SilentStacks
  if (window.SilentStacks?.registerModule) {
    window.SilentStacks.registerModule('DOMUtils', domUtils);
  } else {
    window.SilentStacks = window.SilentStacks || { modules: {} };
    window.SilentStacks.modules.DOMUtils = domUtils;
  }

  // Also make available as utility
  window.SilentStacks = window.SilentStacks || {};
  window.SilentStacks.utils = window.SilentStacks.utils || {};
  window.SilentStacks.utils.domUtils = domUtils;

  console.log('🛠️ DOM utilities loaded');

})();