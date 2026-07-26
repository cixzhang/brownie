import Brownie from '../core.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: none;
  }
`);

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
  /** @type {CSSStyleSheet} */
  static styles = styles;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);
    shadow.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    // No render needed - styles are in adoptedStyleSheets
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
}

Brownie.register('brow-table-footer', BrownieTableFooter);

export default BrownieTableFooter;
