import Brownie from '../core.js';

/**
 * An option for use within brow-select.
 *
 * @element brow-option
 * @attr {string} value - Option value
 * @attr {boolean} disabled - Option cannot be selected
 * @attr {boolean} selected - Option is currently selected
 *
 * @example
 * <brow-select name="country">
 *   <brow-option value="us">United States</brow-option>
 *   <brow-option value="uk">United Kingdom</brow-option>
 *   <brow-option value="ca" disabled>Canada (unavailable)</brow-option>
 * </brow-select>
 */
export class BrownieOption extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled', 'selected'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Set role for accessibility
    this.setAttribute('role', 'option');

    this.#render();
    this.#updateAriaSelected();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#updateAriaSelected();
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
    return this.getAttribute('value');
  }

  /**
   * @param {string | null} value
   */
  set value(value) {
    if (value) {
      this.setAttribute('value', value);
    } else {
      this.removeAttribute('value');
    }
  }

  /**
   * Get whether the option is disabled.
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
   * Get whether the option is selected.
   * @returns {boolean}
   */
  get selected() {
    return this.hasAttribute('selected');
  }

  /**
   * @param {boolean} value
   */
  set selected(value) {
    if (value) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Update aria-selected based on selected attribute.
   */
  #updateAriaSelected() {
    this.setAttribute('aria-selected', String(this.selected));
  }

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
   * Render the option.
   */
  #render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    shadow.innerHTML = /*html*/ `
      <style>
        :host {
          display: block;
          padding: var(--space-2) var(--space-3);
          cursor: pointer;
          color: var(--color-text-primary);
          font-size: 0.875rem;
          white-space: nowrap;
        }

        :host(:hover),
        :host([data-focused]) {
          background: var(--color-highlight);
        }

        :host([selected]) {
          font-weight: 500;
        }

        :host([selected])::before {
          content: '\\2713';
          display: inline-block;
          width: 1.25rem;
          margin-left: calc(-1 * var(--space-1));
          color: var(--color-accent);
        }

        :host([disabled]) {
          opacity: 0.5;
          cursor: not-allowed;
        }

        :host([disabled]:hover) {
          background: transparent;
        }
      </style>
      <slot></slot>
    `;
  }
}

Brownie.register('brow-option', BrownieOption);
