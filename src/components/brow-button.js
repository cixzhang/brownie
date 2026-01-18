import Brownie from '../core.js';

/**
 * A button component that renders as <button> or <a> depending on href attribute.
 * @element brow-button
 * @csspart base - The underlying button or anchor element
 * @typedef {'primary' | 'secondary' | 'ghost'} BrownieButtonVariant
 */
export class BrownieButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'disabled', 'href'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
  }

  attributeChangedCallback() {
    this.render();
  }

  /** @returns {BrownieButtonVariant} */
  get variant() {
    return /** @type {BrownieButtonVariant} */ (this.getAttribute('variant')) || 'secondary';
  }

  /** @param {BrownieButtonVariant} value */
  set variant(value) {
    this.setAttribute('variant', value);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get href() {
    return this.getAttribute('href');
  }

  set href(value) {
    if (value) {
      this.setAttribute('href', value);
    } else {
      this.removeAttribute('href');
    }
  }

  render() {
    const isLink = !!this.href;
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    shadow.innerHTML = /*html*/ `
      <style>
        :host {
          display: inline-block;
          user-select: none;
        }

        [part="base"] {
          display: inline-block;
          font: inherit;
          text-decoration: none;
          margin: 0;
          cursor: pointer;
          box-sizing: border-box;
          background-color: var(--color-secondary);
          color: var(--color-text-primary);
          border: none;
          border-radius: var(--radius-element);
          padding: var(--space-2) var(--space-4);
          transition: box-shadow var(--transition-fast);
          user-select: none;
        }

        [part="base"]:hover {
          background-color: color-mix(in srgb, var(--color-secondary), light-dark(black, white) 5%);
        }

        [part="base"]:active {
          background-color: color-mix(in srgb, var(--color-secondary), light-dark(black, white) 10%);
        }

        [part="base"]:disabled,
        [part="base"][aria-disabled="true"] {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
          box-shadow: none;
        }

        :host([variant="primary"]) [part="base"] {
          background-color: var(--color-accent);
          color: var(--color-text-inverse);
          box-shadow: inset 0 3px 0 var(--color-accent-highlight),
            inset 0 -3px 0 var(--color-accent-shadow);
        }

        :host([variant="primary"]) [part="base"]:hover {
          background-color: color-mix(in srgb, var(--color-accent), light-dark(black, white) 5%);
        }

        :host([variant="primary"]) [part="base"]:active {
          background-color: color-mix(in srgb, var(--color-accent), light-dark(black, white) 10%);
        }

        :host([variant="ghost"]) [part="base"] {
          background-color: transparent;
          color: var(--color-text-primary);
        }

        :host([variant="ghost"]) [part="base"]:hover {
          background-color: color-mix(in srgb, var(--color-secondary), transparent 50%);
        }

        :host([variant="ghost"]) [part="base"]:active {
          background-color: color-mix(in srgb, var(--color-secondary), transparent 20%);
        }
      </style>
      ${
        isLink
          ? /*html*/ `<a part="base" href="${this.href}"${this.disabled ? ' aria-disabled="true"' : ''}><slot></slot></a>`
          : /*html*/ `<button part="base"${this.disabled ? ' disabled' : ''}><slot></slot></button>`
      }
    `;
  }
}

Brownie.register('brow-button', BrownieButton);
