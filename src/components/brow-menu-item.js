import Brownie from '../core.js';
import { escapeHtml } from '../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: block;
    padding: var(--menu-item-padding, var(--space-2) var(--space-3));
    cursor: pointer;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    white-space: nowrap;
    outline: none;
  }

  :host(:hover),
  :host(:focus) {
    background: var(--color-highlight);
  }

  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :host([disabled]:hover),
  :host([disabled]:focus) {
    background: transparent;
  }

  :host([variant="danger"]) {
    color: var(--color-danger, #dc2626);
  }

  :host([variant="danger"]:hover),
  :host([variant="danger"]:focus) {
    background: var(--color-danger-bg, #fef2f2);
  }
`);

/**
 * A menu item for use within brow-menu.
 *
 * @element brow-menu-item
 * @attr {string} value - Value dispatched in the select event
 * @attr {boolean} disabled - Item cannot be selected
 * @attr {string} variant - Visual variant (e.g., "danger")
 *
 * @example
 * <brow-menu for="my-trigger">
 *   <brow-menu-item value="edit">Edit</brow-menu-item>
 *   <brow-menu-item value="delete" variant="danger">Delete</brow-menu-item>
 * </brow-menu>
 */
export class BrownieMenuItem extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled', 'variant'];
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
    // Set role for accessibility
    this.setAttribute('role', 'menuitem');

    // Set tabindex for keyboard navigation (initially not focusable)
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '-1');
    }

    this.#render();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
      this.#updateAriaDisabled();
    }
  }

  // ============================================================
  // Attributes
  // ============================================================

  /**
   * Get the value.
   * @returns {string | null}
   */
  get value() {
    const val = this.getAttribute('value');
    return val ? escapeHtml(val) : null;
  }

  /**
   * @param {string | null} value
   */
  set value(val) {
    if (val) {
      this.setAttribute('value', val);
    } else {
      this.removeAttribute('value');
    }
  }

  /**
   * Get whether the item is disabled.
   * @returns {boolean}
   */
  get disabled() {
    return this.hasAttribute('disabled');
  }

  /**
   * @param {boolean} value
   */
  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  /**
   * Get the variant.
   * @returns {string | null}
   */
  get variant() {
    const val = this.getAttribute('variant');
    return val ? escapeHtml(val) : null;
  }

  /**
   * @param {string | null} value
   */
  set variant(value) {
    if (value) {
      this.setAttribute('variant', value);
    } else {
      this.removeAttribute('variant');
    }
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Update aria-disabled based on disabled attribute.
   */
  #updateAriaDisabled() {
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
  }

  /**
   * Render the menu item.
   */
  #render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);
    shadow.innerHTML = /*html*/ `<slot></slot>`;
  }
}

Brownie.register('brow-menu-item', BrownieMenuItem);

export default BrownieMenuItem;
