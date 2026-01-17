import Brownie from '../core.js';

/**
 * Container used for segmenting general content into a visible block.
 * @element brow-card
 * @csspart base - The main container element
 */
export class BrownieCard extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    shadow.innerHTML = `
      <style>
        :host {
          display: block;
        }

        [part="base"] {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-container);
          padding: var(--space-4);
          box-shadow: var(--elevation-base);
        }
      </style>
      <div part="base">
        <slot></slot>
      </div>
    `;
  }
}

Brownie.register('brow-card', BrownieCard);
