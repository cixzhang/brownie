import Brownie from '../core.js';

/**
 * A footer row for a table using data-* attributes for field values.
 * Typically used for totals or summaries.
 *
 * @element brow-table-footer
 *
 * @example
 * <brow-table-footer data-item="Total" data-price="$35"/>
 */
export class BrownieTableFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Returns all data attribute values as an object.
   * Keys are camelCase (matching dataset API).
   * @returns {Record<string, string | undefined>}
   */
  getData() {
    return { ...this.dataset };
  }

  /**
   * Gets the value for a specific field.
   * @param {string} field - The field name (camelCase)
   * @returns {string | undefined}
   */
  getValue(field) {
    return this.dataset[field];
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

Brownie.register('brow-table-footer', BrownieTableFooter);
