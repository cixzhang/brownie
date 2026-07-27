import Brownie from '../../core.js';
import { isInteractiveClick } from '../../utils/interactive.js';
import { escapeHtml } from '../../utils/html.js';

/**
 * Sort plugin for brow-table.
 * Enables sortable columns with click-to-sort headers.
 *
 * @element brow-table-sort
 *
 * @example
 * <brow-table>
 *   <brow-table-sort fields="name,age" field="name" direction="asc"></brow-table-sort>
 *   <brow-table-column field="name" sortable></brow-table-column>
 *   <brow-table-column field="age" sortable="numeric"></brow-table-column>
 *   <brow-table-row data-name="Alice" data-age="34"></brow-table-row>
 *   <brow-table-row data-name="Bob" data-age="28"></brow-table-row>
 * </brow-table>
 */
export class BrownieTableSort extends HTMLElement {
  static get observedAttributes() {
    return ['fields', 'field', 'direction'];
  }

  // ============================================================
  // Config: which fields are sortable
  // ============================================================

  /**
   * Get sortable fields (comma-separated or '*' for all).
   * @returns {string}
   */
  get fields() {
    return escapeHtml(this.getAttribute('fields') || '*');
  }

  /**
   * @param {string} value
   */
  set fields(value) {
    this.setAttribute('fields', value);
  }

  /**
   * Get array of sortable field names.
   * @returns {string[]}
   */
  get sortableFields() {
    const fields = this.fields;
    if (fields === '*') return [];
    return fields.split(',').map((f) => f.trim()).filter(Boolean);
  }

  // ============================================================
  // State: current sort field and direction
  // ============================================================

  /**
   * Get currently sorted field.
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
   * Get current sort direction.
   * @returns {'asc' | 'desc'}
   */
  get direction() {
    const dir = this.getAttribute('direction');
    return dir === 'desc' ? 'desc' : 'asc';
  }

  /**
   * @param {'asc' | 'desc'} value
   */
  set direction(value) {
    this.setAttribute('direction', value === 'desc' ? 'desc' : 'asc');
  }

  // ============================================================
  // Plugin Interface
  // ============================================================

  /**
   * Check if a field is sortable.
   * @param {string} field
   * @param {import('./brow-table.js').RenderContext} context
   * @returns {boolean}
   */
  #isFieldSortable(field, context) {
    // Guard against undefined fields
    if (!field) return false;

    // Internal fields (added by plugins) are never sortable
    if (field.startsWith('__')) {
      return false;
    }

    // Check if plugin allows this field
    const allowedFields = this.sortableFields;
    if (allowedFields.length > 0 && !allowedFields.includes(field)) {
      return false;
    }

    // Check for sortable attribute on column
    const table = context.table;
    const column = table.querySelector(`brow-table-column[field="${field}"]`);
    if (column && column.hasAttribute('sortable')) {
      return true;
    }

    // If fields='*' and no column definition, allow sorting
    if (this.fields === '*') {
      return true;
    }

    return false;
  }

  /**
   * Get the sort type for a field.
   * @param {string} field
   * @param {import('./brow-table.js').RenderContext} context
   * @returns {'string' | 'numeric' | 'date'}
   */
  #getSortType(field, context) {
    const table = context.table;
    const column = table.querySelector(`brow-table-column[field="${field}"]`);
    if (column) {
      const sortable = column.getAttribute('sortable');
      if (sortable === 'numeric') return 'numeric';
      if (sortable === 'date') return 'date';
    }
    return 'string';
  }

  /**
   * Return CSS styles for sort indicators.
   * @returns {string}
   */
  getStyles() {
    return /*css*/ `
      th[data-sortable] {
        cursor: pointer;
        user-select: none;
      }

      th[data-sortable]:hover {
        background: var(--table-row-bg-hover);
      }

      .sort-indicator {
        display: none;
        width: 1em;
        text-align: center;
        flex-shrink: 0;
      }

      .sort-indicator:not(:empty) {
        display: inline-block;
      }

      th[data-sortable]:hover .sort-indicator {
        display: inline-block;
        opacity: 0.5;
      }

      th[data-sortable]:hover .sort-indicator:empty::after {
        content: '▲';
      }

      th[data-sortable][data-sort="asc"] .sort-indicator,
      th[data-sortable][data-sort="desc"] .sort-indicator {
        display: inline-block;
        opacity: 1;
      }
    `;
  }

  /**
   * Compare two values for sorting.
   * @param {string} aVal
   * @param {string} bVal
   * @param {'string' | 'numeric' | 'date'} sortType
   * @param {number} multiplier
   * @returns {number}
   */
  #compareValues(aVal, bVal, sortType, multiplier) {
    let comparison = 0;

    if (sortType === 'numeric') {
      const aNum = parseFloat(aVal) || 0;
      const bNum = parseFloat(bVal) || 0;
      comparison = aNum - bNum;
    } else if (sortType === 'date') {
      const aDate = new Date(aVal).getTime() || 0;
      const bDate = new Date(bVal).getTime() || 0;
      comparison = aDate - bDate;
    } else {
      // String comparison (case-insensitive)
      comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
    }

    return comparison * multiplier;
  }

  /**
   * Transform rows by sorting them.
   * When tree plugin is present, only sorts root rows while keeping children grouped.
   * @param {import('./brow-table.js').Row[]} rows
   * @param {import('./brow-table.js').RenderContext} context
   * @returns {import('./brow-table.js').Row[]}
   */
  transformRows(rows, context) {
    const sortField = this.field;
    if (!sortField) return rows;

    const sortType = this.#getSortType(sortField, context);
    const direction = this.direction;
    const multiplier = direction === 'desc' ? -1 : 1;

    // Check if tree plugin is present
    const tree = context.shared.tree;
    if (tree) {
      return this.#sortWithTree(rows, sortField, sortType, multiplier, tree);
    }

    // Simple sort for non-tree tables
    return [...rows].sort((a, b) => {
      const aVal = a.data[sortField] ?? '';
      const bVal = b.data[sortField] ?? '';
      return this.#compareValues(aVal, bVal, sortType, multiplier);
    });
  }

  /**
   * Sort rows while preserving tree structure.
   * Only root rows are sorted; children stay grouped under their parents.
   * @param {import('./brow-table.js').Row[]} rows
   * @param {string} sortField
   * @param {'string' | 'numeric' | 'date'} sortType
   * @param {number} multiplier
   * @param {{ idKey: string, parentKey: string }} tree
   * @returns {import('./brow-table.js').Row[]}
   */
  #sortWithTree(rows, sortField, sortType, multiplier, tree) {
    const { idKey, parentKey } = tree;

    // Build parent -> children map
    /** @type {Map<string, import('./brow-table.js').Row[]>} */
    const childrenMap = new Map();
    /** @type {import('./brow-table.js').Row[]} */
    const rootRows = [];

    for (const row of rows) {
      const parentId = row.data[parentKey];
      if (parentId) {
        const children = childrenMap.get(parentId);
        if (children) {
          children.push(row);
        } else {
          childrenMap.set(parentId, [row]);
        }
      } else {
        rootRows.push(row);
      }
    }

    // Sort root rows
    rootRows.sort((a, b) => {
      const aVal = a.data[sortField] ?? '';
      const bVal = b.data[sortField] ?? '';
      return this.#compareValues(aVal, bVal, sortType, multiplier);
    });

    // Recursively sort children at each level and rebuild tree order
    /** @type {import('./brow-table.js').Row[]} */
    const result = [];

    /**
     * @param {import('./brow-table.js').Row} row
     */
    const addWithChildren = (row) => {
      result.push(row);
      const rowId = row.data[idKey];
      if (rowId) {
        const children = childrenMap.get(rowId);
        if (children) {
          // Sort children at this level too
          children.sort((a, b) => {
            const aVal = a.data[sortField] ?? '';
            const bVal = b.data[sortField] ?? '';
            return this.#compareValues(aVal, bVal, sortType, multiplier);
          });
          for (const child of children) {
            addWithChildren(child);
          }
        }
      }
    };

    for (const root of rootRows) {
      addWithChildren(root);
    }

    return result;
  }

  /**
   * Bind click handlers to sortable header cells.
   * @param {import('./brow-table.js').BrownieTable} table
   * @param {ShadowRoot} shadowRoot
   * @param {import('./brow-table.js').RenderContext} context
   */
  onTableReady(table, shadowRoot, context) {
    const columns = context.columns;

    // Mark sortable headers and bind click events
    const headerCells = shadowRoot.querySelectorAll('th');
    headerCells.forEach((th, index) => {
      const column = columns[index];
      if (!column) return;

      const field = column.field;
      if (!this.#isFieldSortable(field, context)) return;

      // Mark as sortable
      th.setAttribute('data-sortable', '');
      th.setAttribute('data-field', field);

      // Mark current sort state
      if (this.field === field) {
        th.setAttribute('data-sort', this.direction);
      }

      // Check column alignment - put indicator in th-start for right-aligned columns
      const columnEl = table.querySelector(`brow-table-column[field="${field}"]`);
      const isEndAligned = columnEl?.getAttribute('align') === 'end';
      const slot = th.querySelector(isEndAligned ? '.th-start' : '.th-end');

      if (slot) {
        const indicator = document.createElement('span');
        indicator.className = 'sort-indicator';
        if (this.field === field) {
          indicator.textContent = this.direction === 'asc' ? '▲' : '▼';
        }
        slot.appendChild(indicator);
      }

      // Bind click handler
      th.addEventListener('click', (e) => {
        // Don't sort if clicking an interactive element (like tree expand toggle)
        if (isInteractiveClick(e, th)) return;
        this.#handleHeaderClick(field, table);
      });
    });
  }

  /**
   * Handle click on a sortable header.
   * @param {string} field
   * @param {import('./brow-table.js').BrownieTable} table
   */
  #handleHeaderClick(field, table) {
    // Toggle direction if same field, otherwise set to asc
    if (this.field === field) {
      this.direction = this.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.field = field;
      this.direction = 'asc';
    }

    // Dispatch event on the table
    const event = new CustomEvent('brow-sort', {
      bubbles: true,
      detail: {
        field: this.field,
        direction: this.direction,
        plugin: this,
      },
    });
    table.dispatchEvent(event);
  }
}

Brownie.register('brow-table-sort', BrownieTableSort);

export default BrownieTableSort;
