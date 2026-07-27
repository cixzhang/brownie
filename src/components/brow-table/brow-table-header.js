import Brownie from '../../core.js';
import { escapeHtml } from '../../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: none;
  }
`);

/**
 * Defines column headers for a table using data-* attributes.
 * Attribute names are field keys, values are display labels.
 *
 * @element brow-table-header
 *
 * @example
 * <brow-table-header data-name="Name" data-id="ID" data-status="Status"/>
 */
export class BrownieTableHeader extends HTMLElement {
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
   * Returns column definitions in order of attribute appearance.
   * @returns {Array<{field: string, label: string}>}
   */
  getColumns() {
    return this.getAttributeNames()
      .filter((name) => name.startsWith('data-'))
      .map((name) => {
        const field = this.dataAttrToField(name);
        const label = escapeHtml(this.getAttribute(name) || field);
        return { field, label };
      });
  }

  /**
   * Converts a data attribute name to its dataset key.
   * e.g., "data-first-name" -> "firstName"
   * @param {string} attrName
   * @returns {string}
   */
  dataAttrToField(attrName) {
    return attrName
      .replace(/^data-/, '')
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
}

Brownie.register('brow-table-header', BrownieTableHeader);

export default BrownieTableHeader;
