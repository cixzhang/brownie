import Brownie from '../core.js';

/**
 * Selection plugin for brow-table.
 * Enables row selection with checkboxes.
 *
 * @element brow-table-select
 * @attr {string} mode - Selection mode: 'single' or 'multi' (default: 'multi')
 * @attr {string} key - Data attribute key for identifying rows
 * @attr {boolean} row-click - Enable clicking anywhere on a row to toggle selection
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
    return ['mode', 'key', 'row-click'];
  }

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
    return this.getAttribute('key');
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
    return this.getSelectedRows()
      .map((row) => /** @type {HTMLElement} */ (row).dataset[keyField])
      .filter(Boolean);
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
      this.#dispatchSelectEvent();
    }
  }

  /**
   * Deselect a row by element.
   * @param {Element} row
   */
  deselectRow(row) {
    row.removeAttribute('selected');
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

      :host([row-click]) tbody tr {
        cursor: pointer;
      }

      :host([row-click]) tbody tr[data-no-select],
      :host([row-click]) tbody tr[data-select-disabled] {
        cursor: default;
      }
    `;
  }

  /**
   * Add checkbox column to the beginning.
   * @param {import('./brow-table.js').Column[]} columns
   * @param {import('./brow-table.js').RenderContext} context
   * @returns {import('./brow-table.js').Column[]}
   */
  transformColumns(columns, context) {
    return [{ field: '__select__', label: '' }, ...columns];
  }

  /**
   * Bind checkbox handlers after table renders.
   * @param {import('./brow-table.js').BrownieTable} table
   * @param {ShadowRoot} shadowRoot
   * @param {import('./brow-table.js').RenderContext} context
   */
  onTableReady(table, shadowRoot, context) {
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

      // Add row click handler if enabled
      if (this.rowClick && this.#isRowSelectable(rowElement)) {
        tr.addEventListener('click', (e) => {
          // Don't toggle if clicking the checkbox itself
          if (e.target === checkbox) return;
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
