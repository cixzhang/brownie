import Brownie from '../core.js';

/**
 * A composable layout with header, footer, left, right panels and content slots.
 * @element brow-layout
 * @typedef {'primary' | 'secondary' | 'ghost'} ButtonVariant
 */
export class BrownieLayout extends HTMLElement {
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
          /* Component styles */
        }
      </style>
      <div part="base">
        <slot></slot>
      </div>
    `;
  }
}

Brownie.register('brow-layout', BrownieLayout);
