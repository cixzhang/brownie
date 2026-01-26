import Brownie from '../core.js';
import { isInteractiveClick } from '../utils/interactive.js';
import { escapeHtml } from '../utils/html.js';

/**
 * Tree plugin for brow-table.
 * Enables hierarchical rows with expand/collapse functionality.
 *
 * @element brow-table-tree
 * @attr {string} id-key - Data attribute for row identity (default: "id")
 * @attr {string} parent-key - Data attribute for parent reference (default: "parent")
 * @attr {string} field - Column to inject tree controls into (default: first column)
 * @attr {boolean} row-click - Enable clicking anywhere on parent row to toggle
 *
 * @example
 * <brow-table>
 *   <brow-table-tree id-key="id" parent-key="parent" field="name" row-click></brow-table-tree>
 *   <brow-table-header data-name="Name" data-size="Size"></brow-table-header>
 *   <brow-table-row data-id="1" data-name="Documents" data-size="--" expanded></brow-table-row>
 *   <brow-table-row data-id="2" data-parent="1" data-name="Report.pdf" data-size="2.4 MB"></brow-table-row>
 *   <brow-table-row data-id="3" data-parent="1" data-name="Notes.txt" data-size="12 KB"></brow-table-row>
 *   <brow-table-row data-id="4" data-name="Images" data-size="--"></brow-table-row>
 * </brow-table>
 */
export class BrownieTableTree extends HTMLElement {
  static get observedAttributes() {
    return ['id-key', 'parent-key', 'field', 'row-click'];
  }

  /**
   * Plugin priority (lower = runs first).
   * Tree runs early to establish hierarchy before other plugins.
   * @type {number}
   */
  priority = 10;

  /** @type {Map<string, number>} */
  #depthMap = new Map();

  /** @type {Map<string, boolean>} */
  #hasChildrenMap = new Map();

  // ============================================================
  // Config
  // ============================================================

  /**
   * Get the id key field.
   * @returns {string}
   */
  get idKey() {
    return escapeHtml(this.getAttribute('id-key') || 'id');
  }

  /**
   * @param {string} value
   */
  set idKey(value) {
    this.setAttribute('id-key', value);
  }

  /**
   * Get the parent key field.
   * @returns {string}
   */
  get parentKey() {
    return escapeHtml(this.getAttribute('parent-key') || 'parent');
  }

  /**
   * @param {string} value
   */
  set parentKey(value) {
    this.setAttribute('parent-key', value);
  }

  /**
   * Get the field to inject tree controls into.
   * @returns {string | null}
   */
  get field() {
    const val = this.getAttribute('field');
    return val ? escapeHtml(val) : null;
  }

  /**
   * @param {string | null} value
   */
  set field(value) {
    if (value) {
      this.setAttribute('field', value);
    } else {
      this.removeAttribute('field');
    }
  }

  /**
   * Get whether full row click is enabled for expand/collapse.
   * @returns {boolean}
   */
  get rowClick() {
    return this.hasAttribute('row-click');
  }

  /**
   * @param {boolean} value
   */
  set rowClick(value) {
    if (value) {
      this.setAttribute('row-click', '');
    } else {
      this.removeAttribute('row-click');
    }
  }

  // ============================================================
  // Public Methods
  // ============================================================

  /**
   * Expand a row by its element.
   * @param {Element} row
   */
  expand(row) {
    row.setAttribute('expanded', '');
    this.#dispatchTreeEvent('expand', row);
  }

  /**
   * Collapse a row by its element.
   * @param {Element} row
   */
  collapse(row) {
    row.removeAttribute('expanded');
    this.#dispatchTreeEvent('collapse', row);
  }

  /**
   * Toggle a row's expanded state.
   * @param {Element} row
   */
  toggle(row) {
    if (row.hasAttribute('expanded')) {
      this.collapse(row);
    } else {
      this.expand(row);
    }
  }

  /**
   * Expand all rows.
   */
  expandAll() {
    const table = this.closest('brow-table');
    if (!table) return;
    table.querySelectorAll('brow-table-row').forEach((row) => {
      if (this.#hasChildrenMap.get(this.#getRowId(row))) {
        row.setAttribute('expanded', '');
      }
    });
    this.#dispatchTreeEvent('expandAll', null);
  }

  /**
   * Collapse all rows.
   */
  collapseAll() {
    const table = this.closest('brow-table');
    if (!table) return;
    table.querySelectorAll('brow-table-row[expanded]').forEach((row) => {
      row.removeAttribute('expanded');
    });
    this.#dispatchTreeEvent('collapseAll', null);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Get the ID of a row.
   * @param {Element} row
   * @returns {string}
   */
  #getRowId(row) {
    return /** @type {HTMLElement} */ (row).dataset[this.idKey] || '';
  }

  /**
   * Get the parent ID of a row.
   * @param {Element} row
   * @returns {string}
   */
  #getParentId(row) {
    return /** @type {HTMLElement} */ (row).dataset[this.parentKey] || '';
  }

  /**
   * Check if a row is expanded.
   * @param {Element} row
   * @returns {boolean}
   */
  #isExpanded(row) {
    return row.hasAttribute('expanded');
  }

  /**
   * Build parent-child relationships and compute depths.
   * @param {import('./brow-table.js').Row[]} rows
   */
  #buildTree(rows) {
    this.#depthMap.clear();
    this.#hasChildrenMap.clear();

    // Build id -> row map
    /** @type {Map<string, import('./brow-table.js').Row>} */
    const rowMap = new Map();
    for (const row of rows) {
      const id = row.data[this.idKey];
      if (id) {
        rowMap.set(id, row);
      }
    }

    // Mark which rows have children
    for (const row of rows) {
      const parentId = row.data[this.parentKey];
      if (parentId) {
        this.#hasChildrenMap.set(parentId, true);
      }
    }

    // Compute depths
    for (const row of rows) {
      const id = row.data[this.idKey];
      if (id) {
        const depth = this.#computeDepth(row, rowMap);
        this.#depthMap.set(id, depth);
      }
    }
  }

  /**
   * Compute depth of a row by traversing parents.
   * @param {import('./brow-table.js').Row} row
   * @param {Map<string, import('./brow-table.js').Row>} rowMap
   * @returns {number}
   */
  #computeDepth(row, rowMap) {
    let depth = 0;
    let current = row;
    const visited = new Set();

    while (current) {
      const parentId = current.data[this.parentKey];
      if (!parentId || visited.has(parentId)) break;
      visited.add(parentId);
      const parent = rowMap.get(parentId);
      if (!parent) break;
      depth++;
      current = parent;
    }

    return depth;
  }

  /**
   * Check if a row is visible (all ancestors expanded).
   * @param {import('./brow-table.js').Row} row
   * @param {Map<string, import('./brow-table.js').Row>} rowMap
   * @returns {boolean}
   */
  #isVisible(row, rowMap) {
    let current = row;
    const visited = new Set();

    while (current) {
      const parentId = current.data[this.parentKey];
      if (!parentId || visited.has(parentId)) return true;
      visited.add(parentId);

      const parent = rowMap.get(parentId);
      if (!parent) return true;

      if (!this.#isExpanded(parent.element)) {
        return false;
      }
      current = parent;
    }

    return true;
  }

  /**
   * Sort rows into tree order (parents before children, maintain sibling order).
   * @param {import('./brow-table.js').Row[]} rows
   * @param {Map<string, import('./brow-table.js').Row>} rowMap
   * @returns {import('./brow-table.js').Row[]}
   */
  #sortTreeOrder(rows, rowMap) {
    /** @type {import('./brow-table.js').Row[]} */
    const result = [];
    /** @type {Set<string>} */
    const added = new Set();

    /**
     * @param {import('./brow-table.js').Row} row
     */
    const addWithChildren = (row) => {
      const id = row.data[this.idKey];
      if (!id || added.has(id)) return;
      added.add(id);
      result.push(row);

      // Find and add children in their original order
      for (const child of rows) {
        if (child.data[this.parentKey] === id) {
          addWithChildren(child);
        }
      }
    };

    // Start with root rows (no parent)
    for (const row of rows) {
      if (!row.data[this.parentKey]) {
        addWithChildren(row);
      }
    }

    // Add any orphaned rows (parent doesn't exist)
    for (const row of rows) {
      const id = row.data[this.idKey];
      if (id && !added.has(id)) {
        result.push(row);
      }
    }

    return result;
  }

  /**
   * Dispatch tree event on table.
   * @param {string} action
   * @param {Element | null} row
   */
  #dispatchTreeEvent(action, row) {
    const table = this.closest('brow-table');
    if (!table) return;

    const event = new CustomEvent('brow-tree', {
      bubbles: true,
      detail: {
        action,
        row,
        plugin: this,
      },
    });
    table.dispatchEvent(event);
  }

  // ============================================================
  // Plugin Interface
  // ============================================================

  /**
   * Return CSS styles for tree controls.
   * @returns {string}
   */
  getStyles() {
    return /*css*/ `
      .tree-cell {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .tree-indent {
        flex-shrink: 0;
      }

      .tree-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 0;
        color: var(--color-text-muted);
        border-radius: var(--radius-element, 0.25rem);
        flex-shrink: 0;
        font-size: 0.625rem;
      }

      .tree-toggle:hover {
        background: var(--color-highlight);
        color: var(--color-text-primary);
      }

      .tree-toggle-placeholder {
        width: 1.25rem;
        flex-shrink: 0;
      }

      .tree-content {
        flex: 1;
        min-width: 0;
      }

      .th-start .tree-toggle {
        font-size: 0.75rem;
      }
    `;
  }

  /**
   * Transform rows into tree structure.
   * @param {import('./brow-table.js').Row[]} rows
   * @param {import('./brow-table.js').RenderContext} context
   * @returns {import('./brow-table.js').Row[]}
   */
  transformRows(rows, context) {
    // Build tree structure
    this.#buildTree(rows);

    // Build row map for lookups
    /** @type {Map<string, import('./brow-table.js').Row>} */
    const rowMap = new Map();
    for (const row of rows) {
      const id = row.data[this.idKey];
      if (id) {
        rowMap.set(id, row);
      }
    }

    // Sort into tree order
    const sorted = this.#sortTreeOrder(rows, rowMap);

    // Filter to visible rows only
    const visible = sorted.filter((row) => this.#isVisible(row, rowMap));

    // Share root indices with other plugins (for pagination)
    // Root indices are the positions of root rows in the visible array
    const rootIndices = [];
    for (let i = 0; i < visible.length; i++) {
      const parentId = visible[i].data[this.parentKey];
      if (!parentId) {
        rootIndices.push(i);
      }
    }
    context.shared.tree = {
      rootIndices,
      idKey: this.idKey,
      parentKey: this.parentKey,
    };

    return visible;
  }

  /**
   * Add tree controls to the specified field column.
   * @param {import('./brow-table.js').BrownieTable} table
   * @param {ShadowRoot} shadowRoot
   * @param {import('./brow-table.js').RenderContext} context
   */
  onTableReady(table, shadowRoot, context) {
    const rows = context.rows;

    // Determine target field: specified field or first data column
    const targetField = this.field || context.columns[0]?.field;
    if (!targetField) return;

    // Find column index
    const colIndex = context.columns.findIndex((c) => c.field === targetField);
    if (colIndex === -1) return;

    // Add expand/collapse all button to header
    const headerCell = shadowRoot.querySelector(`th.col-${targetField}`);
    if (headerCell) {
      const thStart = headerCell.querySelector('.th-start');
      if (thStart) {
        // Check if any rows are currently expanded
        const hasExpanded = rows.some((r) => this.#isExpanded(r.element) && this.#hasChildrenMap.get(r.data[this.idKey]));
        const icon = hasExpanded ? '⊟' : '⊞';
        const title = hasExpanded ? 'Collapse All' : 'Expand All';

        const btn = document.createElement('button');
        btn.className = 'tree-toggle';
        btn.title = title;
        btn.textContent = icon;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (hasExpanded) {
            this.collapseAll();
          } else {
            this.expandAll();
          }
          table.render();
        });
        thStart.appendChild(btn);
      }
    }

    // Add tree controls to body cells
    const bodyRows = shadowRoot.querySelectorAll('tbody tr');
    bodyRows.forEach((tr, index) => {
      const rowData = rows[index];
      if (!rowData) return;

      const rowElement = rowData.element;
      const id = rowData.data[this.idKey];
      const depth = id ? (this.#depthMap.get(id) || 0) : 0;
      const hasChildren = id ? (this.#hasChildrenMap.get(id) || false) : false;
      const isExpanded = this.#isExpanded(rowElement);

      // Find target column cell
      const cell = tr.querySelector(`td.col-${targetField}`);
      if (!cell) return;

      // Build indent + toggle + original content
      const indentWidth = depth * 1; // rem per level
      const originalContent = cell.innerHTML;
      let toggleHtml;
      if (hasChildren) {
        const icon = isExpanded ? '▼' : '▶';
        toggleHtml = `<button class="tree-toggle" title="${isExpanded ? 'Collapse' : 'Expand'}">${icon}</button>`;
      } else {
        // Placeholder to maintain alignment with rows that have toggles
        toggleHtml = '<span class="tree-toggle-placeholder"></span>';
      }

      cell.innerHTML = `
        <div class="tree-cell">
          <span class="tree-indent" style="width: ${indentWidth}rem"></span>
          ${toggleHtml}
          <span class="tree-content">${originalContent}</span>
        </div>
      `;

      // Bind toggle click
      if (hasChildren) {
        tr.classList.add('tree-parent');

        const toggleBtn = cell.querySelector('.tree-toggle');
        if (toggleBtn) {
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle(rowElement);
            table.render();
          });
        }

        // Add row click handler if enabled
        if (this.rowClick) {
          /** @type {HTMLElement} */ (tr).style.cursor = 'pointer';
          tr.addEventListener('click', (e) => {
            // Don't toggle if clicking an interactive element or container
            if (isInteractiveClick(e, tr)) return;
            this.toggle(rowElement);
            table.render();
          });
        }
      }
    });
  }
}

Brownie.register('brow-table-tree', BrownieTableTree);
