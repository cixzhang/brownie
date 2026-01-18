import Brownie from '../core.js';

/**
 * A data table component that renders rows from child elements.
 * Supports headers, custom column templates, footers, and empty states.
 *
 * @element brow-table
 * @csspart base - The table element
 * @csspart head - The thead element
 * @csspart body - The tbody element
 * @csspart foot - The tfoot element
 * @csspart empty - The empty state container
 *
 * @example
 * <brow-table>
 *   <brow-table-header data-name="Name" data-status="Status"/>
 *   <brow-table-row data-name="Alice" data-status="active"/>
 *   <brow-table-row data-name="Bob" data-status="pending"/>
 * </brow-table>
 */
export class BrownieTable extends HTMLElement {
  static get observedAttributes() {
    return ['striped', 'bordered', 'compact'];
  }

  /** @type {MutationObserver | null} */
  #observer = null;

  /** @type {number | null} */
  #renderTimeout = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
    this.#observeChildren();
  }

  disconnectedCallback() {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
    if (this.#renderTimeout) {
      clearTimeout(this.#renderTimeout);
      this.#renderTimeout = null;
    }
  }

  attributeChangedCallback() {
    this.render();
  }

  /** @returns {boolean} */
  get striped() {
    return this.hasAttribute('striped');
  }

  /** @param {boolean} value */
  set striped(value) {
    if (value) {
      this.setAttribute('striped', '');
    } else {
      this.removeAttribute('striped');
    }
  }

  /** @returns {boolean} */
  get bordered() {
    return this.hasAttribute('bordered');
  }

  /** @param {boolean} value */
  set bordered(value) {
    if (value) {
      this.setAttribute('bordered', '');
    } else {
      this.removeAttribute('bordered');
    }
  }

  /** @returns {boolean} */
  get compact() {
    return this.hasAttribute('compact');
  }

  /** @param {boolean} value */
  set compact(value) {
    if (value) {
      this.setAttribute('compact', '');
    } else {
      this.removeAttribute('compact');
    }
  }

  /**
   * Sets up mutation observer to watch for child changes.
   */
  #observeChildren() {
    this.#observer = new MutationObserver(() => {
      this.#scheduleRender();
    });

    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-*', 'selected'],
    });
  }

  /**
   * Debounces render calls.
   */
  #scheduleRender() {
    if (this.#renderTimeout) {
      clearTimeout(this.#renderTimeout);
    }
    this.#renderTimeout = window.setTimeout(() => {
      this.render();
      this.#renderTimeout = null;
    }, 10);
  }

  /**
   * Converts a camelCase field name to a Title Case label.
   * e.g., "firstName" -> "First Name", "status" -> "Status"
   * @param {string} field
   * @returns {string}
   */
  #fieldToLabel(field) {
    return field
      .replace(/([A-Z])/g, ' $1') // Add space before capitals
      .replace(/^./, (c) => c.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Gets column definitions from header or infers from first row.
   * @returns {Array<{field: string, label: string}>}
   */
  #getColumns() {
    const header = this.querySelector('brow-table-header');
    if (header) {
      // Read attributes directly to avoid timing issues with custom element upgrade
      const columns = [];
      for (const attr of header.attributes) {
        if (attr.name.startsWith('data-')) {
          const field = attr.name
            .replace(/^data-/, '')
            .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          columns.push({ field, label: attr.value || field });
        }
      }
      if (columns.length > 0) {
        return columns;
      }
    }

    // Infer from first row
    /** @type {HTMLElement | null} */
    const firstRow = this.querySelector('brow-table-row');
    if (firstRow) {
      return Object.keys(firstRow.dataset).map((field) => ({
        field,
        label: this.#fieldToLabel(field),
      }));
    }

    return [];
  }

  /**
   * Extracts data-* attributes from an element as an object.
   * @param {Element} el
   * @returns {Record<string, string>}
   */
  #getDataAttributes(el) {
    /** @type {Record<string, string>} */
    const data = {};
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-')) {
        const field = attr.name
          .replace(/^data-/, '')
          .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        data[field] = attr.value;
      }
    }
    return data;
  }

  /**
   * Gets all row data.
   * @returns {Array<{data: Record<string, string>, selected: boolean}>}
   */
  #getRows() {
    const rows = this.querySelectorAll('brow-table-row');
    return Array.from(rows).map((row) => ({
      data: this.#getDataAttributes(row),
      selected: row.hasAttribute('selected'),
    }));
  }

  /**
   * Gets footer data if present.
   * @returns {Record<string, string> | null}
   */
  #getFooter() {
    const footer = this.querySelector('brow-table-footer');
    if (footer) {
      return this.#getDataAttributes(footer);
    }
    return null;
  }

  /**
   * @typedef {Object} ColumnTemplate
   * @property {string} template - The innerHTML template
   * @property {string} align - Column alignment
   * @property {string} width - Column width
   */

  /**
   * Gets column templates keyed by field name.
   * @returns {Map<string, ColumnTemplate>}
   */
  #getColumnTemplates() {
    /** @type {Map<string, ColumnTemplate>} */
    const templates = new Map();
    const columns = this.querySelectorAll('brow-table-column');
    columns.forEach((col) => {
      const field = col.getAttribute('field');
      if (field) {
        templates.set(field, {
          template: col.innerHTML.trim(),
          align: col.getAttribute('align') || 'start',
          width: col.getAttribute('width') || 'auto',
        });
      }
    });
    return templates;
  }

  /**
   * Gets empty state content if present.
   * @returns {string | null}
   */
  #getEmptyContent() {
    /** @type {import('./brow-table-empty.js').BrownieTableEmpty | null} */
    const empty = this.querySelector('brow-table-empty');
    if (empty) {
      return typeof empty.getContent === 'function' ? empty.getContent() : empty.innerHTML;
    }
    return null;
  }

  /**
   * Renders a cell value, using template if available.
   * @param {string} field
   * @param {Record<string, string>} rowData
   * @param {Map<string, ColumnTemplate>} templates
   * @returns {string}
   */
  #renderCell(field, rowData, templates) {
    const colTemplate = templates.get(field);
    if (colTemplate && colTemplate.template.length > 0) {
      return this.#applyTemplate(colTemplate.template, rowData);
    }
    return this.#escapeHtml(rowData[field] ?? '');
  }

  /**
   * Applies template substitution with row data.
   * {{property}} for escaped values, {{{property}}} for raw HTML.
   * @param {string} template
   * @param {Record<string, string>} data
   * @returns {string}
   */
  #applyTemplate(template, data) {
    let html = template;

    // Triple braces for raw HTML (unescaped)
    html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
      return data[key] ?? '';
    });

    // Double braces for escaped HTML
    html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return this.#escapeHtml(data[key] ?? '');
    });

    return html;
  }

  /**
   * HTML-escapes a string.
   * @param {string} str
   * @returns {string}
   */
  #escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Gets alignment style for a column.
   * @param {string} field
   * @param {Map<string, ColumnTemplate>} templates
   * @returns {string}
   */
  #getCellAlign(field, templates) {
    const colTemplate = templates.get(field);
    if (colTemplate) {
      const align = colTemplate.align;
      if (align === 'center') return 'text-align: center;';
      if (align === 'end') return 'text-align: right;';
    }
    return '';
  }

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);
    const columns = this.#getColumns();
    const rows = this.#getRows();
    const footer = this.#getFooter();
    const templates = this.#getColumnTemplates();
    const emptyContent = this.#getEmptyContent();
    const hasRows = rows.length > 0;

    // Build header row
    const headerCells = columns
      .map((col) => `<th style="${this.#getCellAlign(col.field, templates)}">${this.#escapeHtml(col.label)}</th>`)
      .join('');

    // Build body rows
    const bodyRows = rows
      .map(
        (row) => `
        <tr${row.selected ? ' class="selected"' : ''}>
          ${columns.map((col) => `<td style="${this.#getCellAlign(col.field, templates)}">${this.#renderCell(col.field, row.data, templates)}</td>`).join('')}
        </tr>
      `
      )
      .join('');

    // Build footer row
    const footerRow = footer
      ? `<tr>${columns.map((col) => `<td style="${this.#getCellAlign(col.field, templates)}">${this.#renderCell(col.field, footer, templates)}</td>`).join('')}</tr>`
      : '';

    // Build empty state
    const emptyState =
      !hasRows && emptyContent
        ? `<div part="empty">${emptyContent}</div>`
        : !hasRows
          ? `<div part="empty">No data</div>`
          : '';

    shadow.innerHTML = /*html*/ `
      <style>
        :host {
          display: block;

          /* Table-specific variables (override in themes via brow-table { --var: value }) */
          --table-cell-padding: var(--space-2) var(--space-3);
          --table-cell-padding-compact: var(--space-1) var(--space-2);
          --table-border-color: var(--color-border-muted);
          --table-header-border-color: var(--color-border);
          --table-row-bg: transparent;
          --table-row-bg-alt: var(--color-muted);
          --table-row-bg-hover: var(--color-highlight);
          --table-row-bg-selected: color-mix(in srgb, var(--color-accent) 15%, transparent);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        th, td {
          padding: var(--table-cell-padding);
          text-align: left;
          border-bottom: 1px solid var(--table-border-color);
        }

        :host([compact]) th,
        :host([compact]) td {
          padding: var(--table-cell-padding-compact);
        }

        th {
          font-weight: 600;
          color: var(--color-text-secondary);
          border-bottom-color: var(--table-header-border-color);
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        :host([striped]) tbody tr:nth-child(odd) td {
          background: var(--table-row-bg-alt);
        }

        :host([bordered]) th,
        :host([bordered]) td {
          border: 1px solid var(--table-border-color);
        }

        tbody tr:hover td {
          background: var(--table-row-bg-hover);
        }

        :host([striped]) tbody tr:hover td {
          background: var(--table-row-bg-hover);
        }

        tbody tr.selected td {
          background: var(--table-row-bg-selected);
        }

        :host([striped]) tbody tr.selected td {
          background: var(--table-row-bg-selected);
        }

        tfoot td {
          font-weight: 600;
          border-top: 1px solid var(--table-header-border-color);
          border-bottom: none;
        }

        [part="empty"] {
          padding: var(--space-8);
          text-align: center;
          color: var(--color-text-muted);
        }

        code {
          font-family: var(--font-code);
          font-size: 0.875em;
          background: var(--color-muted);
          padding: 0.125em 0.375em;
          border-radius: var(--radius-element, 0.25rem);
        }
      </style>

      ${
        hasRows
          ? /*html*/ `
        <table part="base">
          <thead part="head">
            <tr>${headerCells}</tr>
          </thead>
          <tbody part="body">
            ${bodyRows}
          </tbody>
          ${footer ? `<tfoot part="foot">${footerRow}</tfoot>` : ''}
        </table>
      `
          : emptyState
      }
    `;
  }
}

Brownie.register('brow-table', BrownieTable);
