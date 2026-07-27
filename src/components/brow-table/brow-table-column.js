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
 * Defines custom rendering for a table column.
 * Contains a template that gets applied to each row's cell.
 *
 * @element brow-table-column
 * @typedef {'start' | 'center' | 'end'} BrownieTableColumnAlign
 *
 * @example
 * <brow-table-column field="status">
 *   <brow-badge variant="{{statusColor}}">{{status}}</brow-badge>
 * </brow-table-column>
 */
export class BrownieTableColumn extends HTMLElement {
  static get observedAttributes() {
    return ['field', 'align', 'width'];
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

  /** @returns {string} */
  get field() {
    return escapeHtml(this.getAttribute('field') || '');
  }

  /** @param {string} value */
  set field(value) {
    this.setAttribute('field', value);
  }

  /** @returns {BrownieTableColumnAlign} */
  get align() {
    return /** @type {BrownieTableColumnAlign} */ (
      escapeHtml(this.getAttribute('align') || 'start')
    );
  }

  /** @param {BrownieTableColumnAlign} value */
  set align(value) {
    this.setAttribute('align', value);
  }

  /** @returns {string} */
  get width() {
    return escapeHtml(this.getAttribute('width') || 'auto');
  }

  /** @param {string} value */
  set width(value) {
    this.setAttribute('width', value);
  }

  /**
   * Returns the raw template HTML from the light DOM.
   * @returns {string}
   */
  getTemplate() {
    return this.innerHTML;
  }

  /**
   * Renders the template with values from a row's dataset.
   * Uses {{property}} syntax for substitution.
   * HTML-escapes values by default, {{{property}}} for raw HTML.
   * @param {Record<string, string | undefined>} data - Row data from dataset
   * @returns {string}
   */
  renderTemplate(data) {
    let html = this.getTemplate();

    // Triple braces for raw HTML (unescaped)
    html = html.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
      return data[key] ?? '';
    });

    // Double braces for escaped HTML
    html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return escapeHtml(data[key] ?? '');
    });

    return html;
  }
}

Brownie.register('brow-table-column', BrownieTableColumn);

export default BrownieTableColumn;
