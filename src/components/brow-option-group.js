import Brownie from '../core.js';

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

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
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
    return this.getAttribute('label');
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
    const labelId = `group-label-${Math.random().toString(36).substring(2, 9)}`;

    // Set aria-labelledby on host
    this.setAttribute('aria-labelledby', labelId);

    shadow.innerHTML = /*html*/ `
      <style>
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
      </style>
      ${this.label ? `<div class="label" id="${labelId}">${this.label}</div>` : ''}
      <slot></slot>
    `;
  }
}

Brownie.register('brow-option-group', BrownieOptionGroup);
