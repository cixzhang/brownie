import Brownie from '../core.js';
import { escapeHtml } from '../utils/html.js';

/**
 * @typedef {Object} Column
 * @property {string} field - The field name
 * @property {string} label - The display label
 */

/**
 * @typedef {Object} Row
 * @property {Record<string, string>} data - Row data from data-* attributes
 * @property {boolean} selected - Whether the row is selected
 * @property {Element} element - Reference to the original row element
 */

/**
 * @typedef {Object} RenderContext
 * @property {BrownieTable} table - The table element
 * @property {Column[]} columns - Column definitions
 * @property {Row[]} rows - Row data
 * @property {Record<string, string> | null} footer - Footer data
 * @property {TablePlugin[]} plugins - Active plugins
 * @property {Record<string, any>} shared - Shared data for plugin communication
 */

/**
 * @typedef {Object} TablePlugin
 * @property {number} [priority] - Plugin execution order (lower = runs first, default 50)
 * @property {(context: RenderContext) => void} [onTableRender] - Called before rendering
 * @property {(columns: Column[], context: RenderContext) => Column[]} [transformColumns] - Transform columns
 * @property {(rows: Row[], context: RenderContext) => Row[]} [transformRows] - Transform rows
 * @property {() => string} [getStyles] - Return additional CSS
 * @property {(table: BrownieTable, shadowRoot: ShadowRoot, context: RenderContext) => void} [onTableReady] - Called after render
 */

/**
 * A data table component that renders rows from child elements.
 * Supports headers, custom column templates, footers, empty states, and plugins.
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
    this.#waitForPlugins();
  }

  /**
   * Wait for plugin custom elements to be defined, then re-render.
   */
  async #waitForPlugins() {
    const pluginTags = ['brow-table-sort', 'brow-table-select', 'brow-table-paginate', 'brow-table-tree'];
    const hasPlugins = pluginTags.some((tag) => this.querySelector(tag));
    if (!hasPlugins) return;

    // Wait for all plugin types to be defined
    await Promise.all(
      pluginTags
        .filter((tag) => this.querySelector(tag))
        .map((tag) => customElements.whenDefined(tag))
    );

    // Re-render now that plugins are upgraded
    this.render();
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
   * Observes row data, selection state, and plugin attribute changes.
   */
  #observeChildren() {
    this.#observer = new MutationObserver(() => {
      this.#scheduleRender();
    });

    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      // Observe data attributes, selection state, and common plugin attributes
      attributeFilter: [
        'data-*',
        'selected',
        'expanded',
        // Plugin attributes
        'field',
        'direction',
        'fields',
        'mode',
        'key',
        'page',
        'page-size',
        'sortable',
        'no-select',
        'select-disabled',
        'id-key',
        'parent-key',
      ],
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
   * @returns {Row[]}
   */
  #getRows() {
    const rows = this.querySelectorAll('brow-table-row');
    return Array.from(rows).map((row) => ({
      data: this.#getDataAttributes(row),
      selected: row.hasAttribute('selected'),
      element: row,
    }));
  }

  /**
   * Gets plugin elements from the table's children, sorted by priority.
   * Lower priority values run first. Default priority is 50.
   * @returns {TablePlugin[]}
   */
  #getPlugins() {
    const pluginSelectors = [
      'brow-table-sort',
      'brow-table-select',
      'brow-table-paginate',
      'brow-table-tree',
    ];
    const plugins = /** @type {TablePlugin[]} */ (
      [...this.querySelectorAll(pluginSelectors.join(', '))]
    );
    // Sort by priority (lower = runs first)
    return plugins.sort((a, b) => {
      const aPriority = typeof a.priority === 'number' ? a.priority : 50;
      const bPriority = typeof b.priority === 'number' ? b.priority : 50;
      return aPriority - bPriority;
    });
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
        templates.set(escapeHtml(field), {
          template: col.innerHTML.trim(),
          align: escapeHtml(col.getAttribute('align') || 'start'),
          width: escapeHtml(col.getAttribute('width') || 'auto'),
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
    return escapeHtml(rowData[field] ?? '');
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
      return escapeHtml(data[key] ?? '');
    });

    return html;
  }

  /**
   * Generates CSS rules for column styles (width, align, etc).
   * @param {Array<{field: string, label: string}>} columns
   * @param {Map<string, ColumnTemplate>} templates
   * @returns {string}
   */
  #getColumnStyles(columns, templates) {
    const rules = [];
    for (const col of columns) {
      const colTemplate = templates.get(col.field);
      if (!colTemplate) continue;

      const declarations = [];

      // Width
      if (colTemplate.width && colTemplate.width !== 'auto') {
        declarations.push(`width: ${colTemplate.width};`);
      }

      // Alignment
      if (colTemplate.align === 'center') {
        declarations.push('text-align: center;');
      } else if (colTemplate.align === 'end') {
        declarations.push('text-align: end;');
      }

      // Header content alignment (for flex layout)
      if (colTemplate.align === 'center') {
        rules.push(`th.col-${col.field} .th-content { justify-content: center; }`);
      } else if (colTemplate.align === 'end') {
        rules.push(`th.col-${col.field} .th-content { justify-content: flex-end; }`);
      }

      if (declarations.length > 0) {
        rules.push(`.col-${col.field} { ${declarations.join(' ')} }`);
      }
    }
    return rules.join('\n');
  }

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    // Save focus info before re-render
    const focusInfo = this.#saveFocus(shadow);

    let columns = this.#getColumns();
    let rows = this.#getRows();
    const footer = this.#getFooter();
    const templates = this.#getColumnTemplates();
    const emptyContent = this.#getEmptyContent();
    const plugins = this.#getPlugins();

    // Create render context for plugins
    /** @type {RenderContext} */
    const context = {
      table: this,
      columns,
      rows,
      footer,
      plugins,
      shared: {},
    };

    // Call onTableRender for each plugin
    for (const plugin of plugins) {
      if (typeof plugin.onTableRender === 'function') {
        plugin.onTableRender(context);
      }
    }

    // Apply plugin column transforms
    for (const plugin of plugins) {
      if (typeof plugin.transformColumns === 'function') {
        columns = plugin.transformColumns(columns, context);
        context.columns = columns;
      }
    }

    // Apply plugin row transforms
    for (const plugin of plugins) {
      if (typeof plugin.transformRows === 'function') {
        rows = plugin.transformRows(rows, context);
        context.rows = rows;
      }
    }

    // Collect plugin styles
    const pluginStyles = plugins
      .map((plugin) => (typeof plugin.getStyles === 'function' ? plugin.getStyles() : ''))
      .filter(Boolean)
      .join('\n');

    // Generate column styles (width, align, etc)
    const columnStyles = this.#getColumnStyles(columns, templates);

    const hasRows = rows.length > 0;

    // Build header row with standard structure for plugins
    const headerCells = columns
      .map((col) => `<th class="col-${col.field}"><div class="th-content"><span class="th-start"></span><span class="th-label">${escapeHtml(col.label)}</span><span class="th-end"></span></div></th>`)
      .join('');

    // Build body rows
    const bodyRows = rows
      .map(
        (row) => `
        <tr${row.selected ? ' class="selected"' : ''}>
          ${columns.map((col) => `<td class="col-${col.field}">${this.#renderCell(col.field, row.data, templates)}</td>`).join('')}
        </tr>
      `
      )
      .join('');

    // Build footer row
    const footerRow = footer
      ? `<tr>${columns.map((col) => `<td class="col-${col.field}">${this.#renderCell(col.field, footer, templates)}</td>`).join('')}</tr>`
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
          --table-padding-x: var(--space-3);
          --table-padding-x-compact: var(--space-2);
          --table-cell-padding: var(--space-2) var(--table-padding-x);
          --table-cell-padding-compact: var(--space-1) var(--table-padding-x-compact);
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

        /* Standard header cell structure for plugins */
        .th-content {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .th-start:empty,
        .th-end:empty {
          display: none;
        }

        .th-start,
        .th-end {
          flex-shrink: 0;
          display: flex;
          align-items: center;
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

        /* Column styles */
        ${columnStyles}

        /* Plugin styles */
        ${pluginStyles}
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

    // Call onTableReady for each plugin (after DOM is built)
    for (const plugin of plugins) {
      if (typeof plugin.onTableReady === 'function') {
        plugin.onTableReady(this, shadow, context);
      }
    }

    // Restore focus after re-render
    this.#restoreFocus(shadow, focusInfo);
  }

  /**
   * Save information about the currently focused element.
   * @param {ShadowRoot} shadow
   * @returns {{ rowIndex: number, colIndex: number, section: string, selector: string } | null}
   */
  #saveFocus(shadow) {
    const active = shadow.activeElement;
    if (!active) return null;

    // Find row and column indices
    const tr = active.closest('tr');
    const td = active.closest('td, th');
    const tbody = active.closest('tbody');
    const thead = active.closest('thead');

    let rowIndex = -1;
    let colIndex = -1;
    let section = '';

    if (thead && tr) {
      section = 'thead';
      rowIndex = 0;
    } else if (tbody && tr) {
      section = 'tbody';
      const rows = tbody.querySelectorAll('tr');
      rowIndex = [...rows].indexOf(tr);
    }

    if (td && tr) {
      const cells = tr.querySelectorAll('td, th');
      colIndex = [...cells].indexOf(td);
    }

    // Build a selector for the focused element within its cell
    const container = td || tr;
    const selector = container ? this.#getElementSelector(active, container) : '';

    return { rowIndex, colIndex, section, selector };
  }

  /**
   * Get a selector to identify an element within a container.
   * @param {Element} element
   * @param {Element} container
   * @returns {string}
   */
  #getElementSelector(element, container) {
    const parts = [];
    /** @type {Element | null} */
    let current = element;

    while (current && current !== container) {
      let selector = current.tagName.toLowerCase();

      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(Boolean);
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }

      // Add nth-child for disambiguation
      const parent = current.parentElement;
      if (parent && current) {
        const tagName = current.tagName;
        const siblings = [...parent.children].filter(
          (c) => c.tagName === tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  /**
   * Restore focus to the equivalent element after re-render.
   * @param {ShadowRoot} shadow
   * @param {{ rowIndex: number, colIndex: number, section: string, selector: string } | null} focusInfo
   */
  #restoreFocus(shadow, focusInfo) {
    if (!focusInfo) return;

    const { rowIndex, colIndex, section, selector } = focusInfo;

    // Find the target cell
    let cell = null;
    if (section === 'thead') {
      const headerRow = shadow.querySelector('thead tr');
      if (headerRow) {
        const cells = headerRow.querySelectorAll('th');
        cell = cells[colIndex];
      }
    } else if (section === 'tbody' && rowIndex >= 0) {
      const rows = shadow.querySelectorAll('tbody tr');
      const row = rows[rowIndex];
      if (row && colIndex >= 0) {
        const cells = row.querySelectorAll('td');
        cell = cells[colIndex];
      }
    }

    // Try to find the element using the selector
    if (cell && selector) {
      try {
        const target = cell.querySelector(selector);
        if (target && typeof /** @type {HTMLElement} */ (target).focus === 'function') {
          /** @type {HTMLElement} */ (target).focus();
          return;
        }
      } catch {
        // Selector might be invalid, ignore
      }
    }

    // Fallback: try to find any focusable element in the cell
    if (cell) {
      const focusable = cell.querySelector('button, input, [tabindex]');
      if (focusable && typeof /** @type {HTMLElement} */ (focusable).focus === 'function') {
        /** @type {HTMLElement} */ (focusable).focus();
      }
    }
  }
}

Brownie.register('brow-table', BrownieTable);

export default BrownieTable;
