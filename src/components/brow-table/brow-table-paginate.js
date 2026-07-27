import Brownie from '../../core.js';

/**
 * Pagination plugin for brow-table.
 * Enables client-side pagination with navigation controls.
 *
 * @element brow-table-paginate
 *
 * @example
 * <brow-table>
 *   <brow-table-paginate page-size="10" page="1"></brow-table-paginate>
 *   <brow-table-row data-name="Alice"></brow-table-row>
 *   <!-- more rows... -->
 * </brow-table>
 */
export class BrownieTablePaginate extends HTMLElement {
  static get observedAttributes() {
    return ['page-size', 'page'];
  }

  /**
   * Plugin priority (lower = runs first).
   * Paginate runs after tree so it can access tree info.
   * @type {number}
   */
  priority = 100;

  /** @type {number} */
  #totalRows = 0;

  /** @type {number} */
  #totalRootRows = 0;

  /** @type {boolean} */
  #hasTree = false;

  // ============================================================
  // Config: page size
  // ============================================================

  /**
   * Get rows per page.
   * @returns {number}
   */
  get pageSize() {
    const size = parseInt(this.getAttribute('page-size') || '10', 10);
    return size > 0 ? size : 10;
  }

  /**
   * @param {number} value
   */
  set pageSize(value) {
    this.setAttribute('page-size', String(Math.max(1, value)));
  }

  // ============================================================
  // State: current page
  // ============================================================

  /**
   * Get current page (1-indexed).
   * @returns {number}
   */
  get page() {
    const page = parseInt(this.getAttribute('page') || '1', 10);
    return page > 0 ? page : 1;
  }

  /**
   * @param {number} value
   */
  set page(value) {
    const newPage = Math.max(1, Math.min(value, this.totalPages));
    this.setAttribute('page', String(newPage));
  }

  // ============================================================
  // Computed values
  // ============================================================

  /**
   * Get total number of pages.
   * @returns {number}
   */
  get totalPages() {
    const count = this.#hasTree ? this.#totalRootRows : this.#totalRows;
    return Math.max(1, Math.ceil(count / this.pageSize));
  }

  /**
   * Get total number of rows.
   * @returns {number}
   */
  get totalRows() {
    return this.#totalRows;
  }

  // ============================================================
  // Navigation methods
  // ============================================================

  /**
   * Go to the next page.
   */
  nextPage() {
    if (this.page < this.totalPages) {
      this.page = this.page + 1;
      this.#dispatchPageEvent();
    }
  }

  /**
   * Go to the previous page.
   */
  prevPage() {
    if (this.page > 1) {
      this.page = this.page - 1;
      this.#dispatchPageEvent();
    }
  }

  /**
   * Go to a specific page.
   * @param {number} pageNum
   */
  goToPage(pageNum) {
    const newPage = Math.max(1, Math.min(pageNum, this.totalPages));
    if (newPage !== this.page) {
      this.page = newPage;
      this.#dispatchPageEvent();
    }
  }

  /**
   * Go to the first page.
   */
  firstPage() {
    this.goToPage(1);
  }

  /**
   * Go to the last page.
   */
  lastPage() {
    this.goToPage(this.totalPages);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Dispatch page change event on table.
   */
  #dispatchPageEvent() {
    const table = this.closest('brow-table');
    if (!table) return;

    const event = new CustomEvent('brow-page', {
      bubbles: true,
      detail: {
        page: this.page,
        pageSize: this.pageSize,
        totalPages: this.totalPages,
        totalRows: this.#totalRows,
        totalRootRows: this.#hasTree ? this.#totalRootRows : null,
        hasTree: this.#hasTree,
        plugin: this,
      },
    });
    table.dispatchEvent(event);
  }

  // ============================================================
  // Plugin Interface
  // ============================================================

  /**
   * Return CSS styles for pagination controls.
   * @returns {string}
   */
  getStyles() {
    return /*css*/ `
      .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3) var(--table-padding-x);
        border-top: 1px solid var(--table-border-color);
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }

      .pagination-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }

      .pagination-btn {
        width: var(--space-9);
      }

      .pagination-pages {
        display: flex;
        align-items: center;
        gap: var(--space-0_5);
      }

      .pagination-page {
        min-width: 2rem;
        height: 2rem;
        padding: 0 var(--space-1);
        border: 1px solid transparent;
        border-radius: var(--radius-element, 0.25rem);
        background: transparent;
        color: var(--color-text-primary);
        cursor: pointer;
        transition: all var(--transition-fast, 150ms);
      }

      .pagination-page:hover {
        background: var(--color-highlight);
      }

      .pagination-page.active {
        background: var(--color-accent);
        color: var(--color-text-inverse, #fff);
        font-weight: 600;
      }

      .pagination-ellipsis {
        padding: 0 var(--space-1);
        color: var(--color-text-muted);
      }
    `;
  }

  /**
   * Store total row count and slice rows for current page.
   * When tree plugin is present, paginates by root rows and includes all descendants.
   * @param {import('./brow-table.js').Row[]} rows
   * @param {import('./brow-table.js').RenderContext} context
   * @returns {import('./brow-table.js').Row[]}
   */
  transformRows(rows, context) {
    // Store total for pagination info
    this.#totalRows = rows.length;

    // Check if tree plugin is present
    const tree = context.shared.tree;
    this.#hasTree = !!tree;

    if (tree) {
      return this.#paginateWithTree(rows, tree);
    }

    // Simple pagination for non-tree tables
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;

    return rows.slice(start, end);
  }

  /**
   * Paginate by root rows, keeping children grouped with parents.
   * @param {import('./brow-table.js').Row[]} rows
   * @param {{ idKey: string, parentKey: string }} tree
   * @returns {import('./brow-table.js').Row[]}
   */
  #paginateWithTree(rows, tree) {
    const { parentKey } = tree;

    // Find root rows (rows without a parent)
    /** @type {number[]} */
    const rootIndices = [];
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].data[parentKey]) {
        rootIndices.push(i);
      }
    }

    this.#totalRootRows = rootIndices.length;

    // Calculate which root rows to include on this page
    const startRootIndex = (this.page - 1) * this.pageSize;
    const endRootIndex = Math.min(startRootIndex + this.pageSize, rootIndices.length);

    if (startRootIndex >= rootIndices.length) {
      return [];
    }

    // Get the row indices to include (from first root on page to just before next page's first root)
    const startRowIndex = rootIndices[startRootIndex];
    const endRowIndex = endRootIndex < rootIndices.length
      ? rootIndices[endRootIndex]
      : rows.length;

    return rows.slice(startRowIndex, endRowIndex);
  }

  /**
   * Render pagination controls after table.
   * @param {import('./brow-table.js').BrownieTable} table
   * @param {ShadowRoot} shadowRoot
   * @param {import('./brow-table.js').RenderContext} _context
   */
  onTableReady(table, shadowRoot, _context) {
    // Don't show pagination if only one page
    if (this.totalPages <= 1) return;

    // Create pagination container
    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    // Info section
    const info = document.createElement('div');
    info.className = 'pagination-info';

    if (this.#hasTree) {
      // For tree mode, show root row range
      const start = (this.page - 1) * this.pageSize + 1;
      const end = Math.min(this.page * this.pageSize, this.#totalRootRows);
      info.textContent = `${start}–${end} of ${this.#totalRootRows} items`;
    } else {
      const start = (this.page - 1) * this.pageSize + 1;
      const end = Math.min(this.page * this.pageSize, this.#totalRows);
      info.textContent = `${start}–${end} of ${this.#totalRows}`;
    }

    // Controls section
    const controls = document.createElement('div');
    controls.className = 'pagination-controls';

    // Previous button
    const prevBtn = document.createElement('brow-button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '‹';
    prevBtn.title = 'Previous page';
    if (this.page <= 1) prevBtn.setAttribute('disabled', '');
    prevBtn.addEventListener('click', () => {
      this.prevPage();
      table.render();
    });

    // Page buttons
    const pages = document.createElement('div');
    pages.className = 'pagination-pages';
    this.#renderPageButtons(pages, table);

    // Next button
    const nextBtn = document.createElement('brow-button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '›';
    nextBtn.title = 'Next page';
    if (this.page >= this.totalPages) nextBtn.setAttribute('disabled', '');
    nextBtn.addEventListener('click', () => {
      this.nextPage();
      table.render();
    });

    controls.appendChild(prevBtn);
    controls.appendChild(pages);
    controls.appendChild(nextBtn);

    pagination.appendChild(info);
    pagination.appendChild(controls);

    shadowRoot.appendChild(pagination);
  }

  /**
   * Render page number buttons with ellipsis for large page counts.
   * @param {HTMLElement} container
   * @param {import('./brow-table.js').BrownieTable} table
   */
  #renderPageButtons(container, table) {
    const total = this.totalPages;
    const current = this.page;
    const maxVisible = 7;

    /**
     * @param {number} num
     */
    const addPageButton = (num) => {
      const btn = document.createElement('button');
      btn.className = 'pagination-page' + (num === current ? ' active' : '');
      btn.textContent = String(num);
      btn.addEventListener('click', () => {
        this.goToPage(num);
        table.render();
      });
      container.appendChild(btn);
    };

    const addEllipsis = () => {
      const span = document.createElement('span');
      span.className = 'pagination-ellipsis';
      span.textContent = '…';
      container.appendChild(span);
    };

    if (total <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= total; i++) {
        addPageButton(i);
      }
    } else {
      // Always show first page
      addPageButton(1);

      if (current > 3) {
        addEllipsis();
      }

      // Show pages around current
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        addPageButton(i);
      }

      if (current < total - 2) {
        addEllipsis();
      }

      // Always show last page
      addPageButton(total);
    }
  }
}

Brownie.register('brow-table-paginate', BrownieTablePaginate);

export default BrownieTablePaginate;
