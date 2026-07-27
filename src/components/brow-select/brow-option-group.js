import Brownie from '../../core.js';
import { escapeHtml } from '../../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: block;
  }

  :host(:not(:first-child)) {
    border-top: 1px solid var(--color-border-muted);
    margin-top: var(--space-1);
    padding-top: var(--space-1);
  }

  .label {
    padding: var(--space-2) var(--space-3);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`);

/**
 * A group of options within brow-select.
 *
 * @element brow-option-group
 * @attr {string} label - Group label displayed above options
 *
 * @example
 * <brow-select name="timezone">
 *   <brow-option-group label="Americas">
 *     <brow-option value="est">Eastern Time</brow-option>
 *     <brow-option value="pst">Pacific Time</brow-option>
 *   </brow-option-group>
 *   <brow-option-group label="Europe">
 *     <brow-option value="gmt">GMT</brow-option>
 *     <brow-option value="cet">Central European</brow-option>
 *   </brow-option-group>
 * </brow-select>
 */
export class BrownieOptionGroup extends HTMLElement {
  static get observedAttributes() {
    return ['label'];
  }

  /** @type {CSSStyleSheet} */
  static styles = styles;

  /** @type {string} */
  #labelId = '';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);
    shadow.adoptedStyleSheets = [styles];
    this.#labelId = `group-label-${Brownie.generateId()}`;
  }

  connectedCallback() {
    // Set role for accessibility
    this.setAttribute('role', 'group');

    this.#render();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
    }
  }

  // ============================================================
  // Attributes
  // ============================================================

  /**
   * Get the group label.
   * @returns {string | null}
   */
  get label() {
    const val = this.getAttribute('label');
    return val ? escapeHtml(val) : null;
  }

  /**
   * @param {string | null} value
   */
  set label(value) {
    if (value) {
      this.setAttribute('label', value);
    } else {
      this.removeAttribute('label');
    }
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Render the option group.
   */
  #render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    // Set aria-labelledby on host
    this.setAttribute('aria-labelledby', this.#labelId);

    shadow.innerHTML = /*html*/ `
      ${this.label ? `<div class="label" id="${this.#labelId}">${this.label}</div>` : ''}
      <slot></slot>
    `;
  }
}

Brownie.register('brow-option-group', BrownieOptionGroup);

export default BrownieOptionGroup;
