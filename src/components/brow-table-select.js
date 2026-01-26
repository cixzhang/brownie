import Brownie from '../core.js';
import { isInteractiveClick } from '../utils/interactive.js';
import { escapeHtml } from '../utils/html.js';

/**
 * Selection plugin for brow-table.
 * Enables row selection with checkboxes.
 *
 * @element brow-table-select
 * @attr {string} mode - Selection mode: 'single' or 'multi' (default: 'multi')
 * @attr {string} key - Data attribute key for identifying rows
 * @attr {boolean} row-click - Enable clicking anywhere on a row to toggle selection
 * @attr {boolean} cascade - When used with tree, selecting a parent selects all children
 *
 * @example
 * <brow-table>
 *   <brow-table-select mode="multi" key="id" row-click></brow-table-select>
 *   <brow-table-row data-id="1" data-name="Alice" selected></brow-table-row>
 *   <brow-table-row data-id="2" data-name="Bob"></brow-table-row>
 *   <brow-table-row data-id="3" data-name="System" no-select></brow-table-row>
 * </brow-table>
 */
export class BrownieTableSelect extends HTMLElement {
  static get observedAttributes() {
    return ['mode', 'key', 'row-click', 'cascade'];
  }

  /**
   * Plugin priority (lower = runs first).
   * Select runs after tree so its column appears after tree.
   * @type {number}
   */
  priority = 20;

  /** @type {string | null} */
  #treeIdKey = null;

  /** @type {string | null} */
  #treeParentKey = null;

  // ============================================================
  // Config: selection mode and key field
  // ============================================================

  /**
   * Get selection mode.
   * @returns {'single' | 'multi'}
   */
  get mode() {
    const mode = this.getAttribute('mode');
    return mode === 'single' ? 'single' : 'multi';
  }

  /**
   * @param {'single' | 'multi'} value
   */
  set mode(value) {
    this.setAttribute('mode', value === 'single' ? 'single' : 'multi');
  }

  /**
   * Get the key field used to identify rows.
   * @returns {string | null}
   */
  get key() {
    const val = this.getAttribute('key');
    return val ? escapeHtml(val) : null;
  }

  /**
   * @param {string | null} value
   */
  set key(value) {
    if (value) {
      this.setAttribute('key', value);
    } else {
      this.removeAttribute('key');
    }
  }

  /**
   * Get whether full row click is enabled.
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

  /**
   * Get whether cascade selection is enabled.
   * When true and used with tree, selecting a parent selects all children.
   * @returns {boolean}
   */
  get cascade() {
    return this.hasAttribute('cascade');
  }

  /**
   * @param {boolean} value
   */
  set cascade(value) {
    if (value) {
      this.setAttribute('cascade', '');
    } else {
      this.removeAttribute('cascade');
    }
  }

  // ============================================================
  // Selection State
  // ============================================================

  /**
   * Get all selected row elements.
   * @returns {Element[]}
   */
  getSelectedRows() {
    const table = this.closest('brow-table');
    if (!table) return [];
    return [...table.querySelectorAll('brow-table-row[selected]')];
  }

  /**
   * Get selected keys (if key attribute is set).
   * @returns {string[]}
   */
  getSelectedKeys() {
    const keyField = this.key;
    if (!keyField) return [];
    /** @type {string[]} */
    const keys = [];
    for (const row of this.getSelectedRows()) {
      const key = /** @type {HTMLElement} */ (row).dataset[keyField];
      if (key) keys.push(key);
    }
    return keys;
  }

  /**
   * Select a row by element.
   * @param {Element} row
   */
  selectRow(row) {
    if (this.#isRowSelectable(row)) {
      if (this.mode === 'single') {
        this.#clearSelection();
      }
      row.setAttribute('selected', '');

      // Cascade to children and parents if enabled
      if (this.cascade) {
        // Select all descendants
        for (const child of this.#getDescendants(row)) {
          if (this.#isRowSelectable(child)) {
            child.setAttribute('selected', '');
          }
        }
        // Check if parent should be selected (all siblings now selected)
        this.#cascadeUp(row);
      }

      this.#dispatchSelectEvent();
    }
  }

  /**
   * Deselect a row by element.
   * @param {Element} row
   */
  deselectRow(row) {
    row.removeAttribute('selected');

    // Cascade to children and parents if enabled
    if (this.cascade) {
      // Deselect all descendants
      for (const child of this.#getDescendants(row)) {
        child.removeAttribute('selected');
      }
      // Deselect all ancestors
      this.#cascadeUpDeselect(row);
    }

    this.#dispatchSelectEvent();
  }

  /**
   * Toggle row selection.
   * @param {Element} row
   */
  toggleRow(row) {
    if (row.hasAttribute('selected')) {
      this.deselectRow(row);
    } else {
      this.selectRow(row);
    }
  }

  /**
   * Select all selectable rows.
   */
  selectAll() {
    if (this.mode !== 'multi') return;
    const table = this.closest('brow-table');
    if (!table) return;

    const rows = table.querySelectorAll('brow-table-row');
    rows.forEach((row) => {
      if (this.#isRowSelectable(row)) {
        row.setAttribute('selected', '');
      }
    });
    this.#dispatchSelectEvent();
  }

  /**
   * Deselect all rows.
   */
  deselectAll() {
    this.#clearSelection();
    this.#dispatchSelectEvent();
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Check if a row can be selected.
   * @param {Element} row
   * @returns {boolean}
   */
  #isRowSelectable(row) {
    return !row.hasAttribute('no-select') && !row.hasAttribute('select-disabled');
  }

  /**
   * Check if a row has selection disabled (shows checkbox but can't interact).
   * @param {Element} row
   * @returns {boolean}
   */
  #isRowDisabled(row) {
    return row.hasAttribute('select-disabled');
  }

  /**
   * Check if a row should show no checkbox.
   * @param {Element} row
   * @returns {boolean}
   */
  #isRowHidden(row) {
    return row.hasAttribute('no-select');
  }

  /**
   * Get all descendant rows of a given row (for cascade selection).
   * @param {Element} row
   * @returns {Element[]}
   */
  #getDescendants(row) {
    if (!this.#treeIdKey || !this.#treeParentKey) return [];

    const table = this.closest('brow-table');
    if (!table) return [];

    const rowId = /** @type {HTMLElement} */ (row).dataset[this.#treeIdKey];
    if (!rowId) return [];

    const allRows = [...table.querySelectorAll('brow-table-row')];

    // Build parent -> children map (O(n))
    /** @type {Map<string, Element[]>} */
    const childrenMap = new Map();
    for (const r of allRows) {
      const parentId = /** @type {HTMLElement} */ (r).dataset[this.#treeParentKey];
      if (parentId) {
        const children = childrenMap.get(parentId);
        if (children) {
          children.push(r);
        } else {
          childrenMap.set(parentId, [r]);
        }
      }
    }

    // BFS using the map (O(descendants))
    /** @type {Element[]} */
    const descendants = [];
    const idsToCheck = [rowId];

    while (idsToCheck.length > 0) {
      const parentId = /** @type {string} */ (idsToCheck.shift());
      const children = childrenMap.get(parentId);
      if (children) {
        for (const child of children) {
          descendants.push(child);
          const childId = /** @type {HTMLElement} */ (child).dataset[this.#treeIdKey];
          if (childId) {
            idsToCheck.push(childId);
          }
        }
      }
    }

    return descendants;
  }

  /**
   * Get the parent row of a given row.
   * @param {Element} row
   * @returns {Element | null}
   */
  #getParentRow(row) {
    if (!this.#treeIdKey || !this.#treeParentKey) return null;

    const table = this.closest('brow-table');
    if (!table) return null;

    const parentId = /** @type {HTMLElement} */ (row).dataset[this.#treeParentKey];
    if (!parentId) return null;

    for (const r of table.querySelectorAll('brow-table-row')) {
      if (/** @type {HTMLElement} */ (r).dataset[this.#treeIdKey] === parentId) {
        return r;
      }
    }
    return null;
  }

  /**
   * Get sibling rows (same parent) of a given row.
   * @param {Element} row
   * @returns {Element[]}
   */
  #getSiblings(row) {
    if (!this.#treeIdKey || !this.#treeParentKey) return [];

    const table = this.closest('brow-table');
    if (!table) return [];

    const parentId = /** @type {HTMLElement} */ (row).dataset[this.#treeParentKey];
    /** @type {Element[]} */
    const siblings = [];

    for (const r of table.querySelectorAll('brow-table-row')) {
      if (/** @type {HTMLElement} */ (r).dataset[this.#treeParentKey] === parentId) {
        siblings.push(r);
      }
    }
    return siblings;
  }

  /**
   * Cascade selection upward - select parent if all siblings are selected.
   * @param {Element} row
   */
  #cascadeUp(row) {
    const parent = this.#getParentRow(row);
    if (!parent) return;

    const siblings = this.#getSiblings(row);
    const selectableSiblings = siblings.filter((s) => this.#isRowSelectable(s));

    // Check if all selectable siblings are selected
    const allSelected = selectableSiblings.every((s) => s.hasAttribute('selected'));

    if (allSelected && this.#isRowSelectable(parent)) {
      parent.setAttribute('selected', '');
      // Recurse up
      this.#cascadeUp(parent);
    }
  }

  /**
   * Cascade deselection upward - deselect all ancestors.
   * @param {Element} row
   */
  #cascadeUpDeselect(row) {
    let parent = this.#getParentRow(row);
    while (parent) {
      parent.removeAttribute('selected');
      parent = this.#getParentRow(parent);
    }
  }

  /**
   * Clear all selections.
   */
  #clearSelection() {
    const table = this.closest('brow-table');
    if (!table) return;
    table.querySelectorAll('brow-table-row[selected]').forEach((row) => {
      row.removeAttribute('selected');
    });
  }

  /**
   * Dispatch selection change event on table.
   */
  #dispatchSelectEvent() {
    const table = this.closest('brow-table');
    if (!table) return;

    const event = new CustomEvent('brow-select', {
      bubbles: true,
      detail: {
        selected: this.getSelectedKeys(),
        rows: this.getSelectedRows(),
        plugin: this,
      },
    });
    table.dispatchEvent(event);
  }

  // ============================================================
  // Plugin Interface
  // ============================================================

  /**
   * Return CSS styles for selection checkboxes.
   * @returns {string}
   */
  getStyles() {
    return /*css*/ `
      th.select-column,
      td.select-column {
        width: 1rem;
        padding-left: var(--space-3);
        padding-right: var(--space-1);
        text-align: center;
      }

      :host([bordered]) th.select-column,
      :host([bordered]) td.select-column {
        padding-right: var(--space-3);
      }

      td.select-column[data-interactive] {
        cursor: pointer;
      }

      .select-checkbox {
        width: 1rem;
        height: 1rem;
        cursor: pointer;
        accent-color: var(--color-accent);
        margin-inline: 0;
      }

      .select-checkbox:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      th.select-column .select-checkbox {
        vertical-align: middle;
      }
    `;
  }

  /**
   * Add checkbox column to the beginning.
   * @param {import('./brow-table.js').Column[]} columns
   * @param {import('./brow-table.js').RenderContext} _context
   * @returns {import('./brow-table.js').Column[]}
   */
  transformColumns(columns, _context) {
    return [{ field: '__select__', label: '' }, ...columns];
  }

  /**
   * Bind checkbox handlers after table renders.
   * @param {import('./brow-table.js').BrownieTable} table
   * @param {ShadowRoot} shadowRoot
   * @param {import('./brow-table.js').RenderContext} context
   */
  onTableReady(table, shadowRoot, context) {
    // Store tree config for cascade selection
    if (context.shared.tree) {
      this.#treeIdKey = context.shared.tree.idKey;
      this.#treeParentKey = context.shared.tree.parentKey;
    }

    const rows = [...table.querySelectorAll('brow-table-row')];

    // Get header checkbox cell
    const headerRow = shadowRoot.querySelector('thead tr');
    if (headerRow) {
      const headerCell = headerRow.querySelector('th');
      if (headerCell) {
        headerCell.classList.add('select-column');

        if (this.mode === 'multi') {
          // Add select-all checkbox
          const selectAll = document.createElement('input');
          selectAll.type = 'checkbox';
          selectAll.className = 'select-checkbox';
          selectAll.title = 'Select all';

          // Set initial state
          const selectableRows = rows.filter((r) => this.#isRowSelectable(r));
          const selectedRows = rows.filter((r) => r.hasAttribute('selected'));
          if (selectableRows.length > 0 && selectedRows.length === selectableRows.length) {
            selectAll.checked = true;
          } else if (selectedRows.length > 0) {
            selectAll.indeterminate = true;
          }

          selectAll.addEventListener('change', () => {
            if (selectAll.checked) {
              this.selectAll();
            } else {
              this.deselectAll();
            }
            // Re-render will update checkboxes
            table.render();
          });

          headerCell.appendChild(selectAll);
        }
      }
    }

    // Get body rows and add checkboxes (use context.rows for paginated/transformed rows)
    const bodyRows = shadowRoot.querySelectorAll('tbody tr');
    const renderedRows = context.rows;
    bodyRows.forEach((tr, index) => {
      const rowData = renderedRows[index];
      if (!rowData) return;

      const rowElement = rowData.element;
      const cell = tr.querySelector('td');
      if (!cell) return;

      cell.classList.add('select-column');

      // Check if row should have a checkbox
      if (this.#isRowHidden(rowElement)) {
        // No checkbox for no-select rows
        return;
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'select-checkbox';
      checkbox.checked = rowElement.hasAttribute('selected');
      checkbox.disabled = this.#isRowDisabled(rowElement);

      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleRow(rowElement);
        // Re-render to update visual state
        table.render();
      });

      cell.appendChild(checkbox);

      // Make entire cell clickable and mark as interactive for row-click handlers
      if (this.#isRowSelectable(rowElement)) {
        /** @type {HTMLElement} */ (cell).dataset.interactive = '';
        cell.addEventListener('click', (e) => {
          // Skip if clicking the checkbox itself (already handled by change event)
          if (e.target === checkbox) return;
          e.stopPropagation();
          this.toggleRow(rowElement);
          table.render();
        });
      }

      // Add row click handler if enabled
      if (this.rowClick && this.#isRowSelectable(rowElement)) {
        /** @type {HTMLElement} */ (tr).style.cursor = 'pointer';
        tr.addEventListener('click', (e) => {
          // Don't toggle if clicking an interactive element or container
          if (isInteractiveClick(e, tr)) return;
          this.toggleRow(rowElement);
          table.render();
        });
      }

      // Add data attributes for CSS styling
      if (this.#isRowHidden(rowElement)) {
        /** @type {HTMLElement} */ (tr).dataset.noSelect = '';
      }
      if (this.#isRowDisabled(rowElement)) {
        /** @type {HTMLElement} */ (tr).dataset.selectDisabled = '';
      }
    });
  }
}

Brownie.register('brow-table-select', BrownieTableSelect);
