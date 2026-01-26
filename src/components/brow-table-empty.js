import Brownie from '../core.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: none;
  }
`);

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
   * Returns the empty state content HTML.
   * @returns {string}
   */
  getContent() {
    return this.innerHTML;
  }
}

Brownie.register('brow-table-empty', BrownieTableEmpty);
