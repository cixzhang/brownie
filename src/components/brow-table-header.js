import Brownie from '../core.js';

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
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
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
        const label = this.getAttribute(name) || field;
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

Brownie.register('brow-table-header', BrownieTableHeader);
