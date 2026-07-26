import Brownie from '../core.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: none;
  }
`);

/**
 * A data row for a table using data-* attributes for field values.
 *
 * @element brow-table-row
 *
 * @example
 * <brow-table-row data-name="Alice" data-id="123" data-status="active"/>
 */
export class BrownieTableRow extends HTMLElement {
  static get observedAttributes() {
    return ['selected'];
  }

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

  attributeChangedCallback() {
    // No render needed
  }

  /** @returns {boolean} */
  get selected() {
    return this.hasAttribute('selected');
  }

  /** @param {boolean} value */
  set selected(value) {
    if (value) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
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

Brownie.register('brow-table-row', BrownieTableRow);

export default BrownieTableRow;
