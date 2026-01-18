import Brownie from '../core.js';

/**
 * Empty state content displayed when a table has no rows.
 * Content is passed through to the parent brow-table.
 *
 * @element brow-table-empty
 *
 * @example
 * <brow-table-empty>No records found.</brow-table-empty>
 */
export class BrownieTableEmpty extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Returns the empty state content HTML.
   * @returns {string}
   */
  getContent() {
    return this.innerHTML;
  }

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);
    shadow.innerHTML = /*html*/ `
      <style>
        :host {
          display: none;
        }
      </style>
    `;
  }
}

Brownie.register('brow-table-empty', BrownieTableEmpty);
