import Brownie from '../core.js';

/**
 * Container used for segmenting general content into a visible block.
 * @element brow-card
 * @csspart base - The main container element
 */
export class BrownieCard extends HTMLElement {
  static get observedAttributes() {
    return ['height', 'width'];
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

  /** @returns {string} */
  get height() {
    return /** @type {string} */ (this.getAttribute('height')) || 'auto';
  }

  /** @param {string} value */
  set height(value) {
    this.setAttribute('height', value);
  }

  /** @returns {string} */
  get width() {
    return /** @type {string} */ (this.getAttribute('width')) || 'auto';
  }

  /** @param {string} value */
  set width(value) {
    this.setAttribute('width', value);
  }

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    shadow.innerHTML = /*html*/ `
      <style>
        :host {
          display: block;
          height: ${this.height};
          width: ${this.width};
        }

        [part="base"] {
          box-sizing: border-box;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-container);
          padding: var(--space-4);
          box-shadow: var(--elevation-base);
          width: 100%;
          height: 100%;
        }

        :has(::slotted(brow-layout)) [part="base"] {
          padding: 0;
        }
      </style>
      <div part="base">
        <slot></slot>
      </div>
    `;
  }
}

Brownie.register('brow-card', BrownieCard);
