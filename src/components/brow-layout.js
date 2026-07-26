import Brownie from '../core.js';
import { escapeHtml } from '../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: flex;
  }
  .vertical {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  .horizontal {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    width: 100%;
    flex-grow: 1;
    flex-shrink: 1;
  }
  .content {
    display: flex;
    width: 100%;
    height: 100%;
    flex-grow: 1;
    flex-shrink: 1;
    flex-direction: column;
  }
`);

/**
 * A composable layout with header, footer, start, end panels and content slots.
 * @element brow-layout
 * @typedef {'space-0' | 'space-0_5' | 'space-1' | 'space-1_5' | 'space-2' | 'space-2_5' | 'space-3' | 'space-4' | 'space-5' | 'space-6' | 'space-8' | 'space-10' | 'space-12'} BrownieLayoutSpacing
 */
export class BrownieLayout extends HTMLElement {
  static get observedAttributes() {
    return ['height', 'width', 'padding'];
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
    this.render();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
  }

  attributeChangedCallback() {
    this.render();
  }

  /** @returns {string} */
  get height() {
    return escapeHtml(this.getAttribute('height') || '100%');
  }

  /** @param {string} value */
  set height(value) {
    this.setAttribute('height', value);
  }

  /** @returns {string} */
  get width() {
    return escapeHtml(this.getAttribute('width') || '100%');
  }

  /** @param {string} value */
  set width(value) {
    this.setAttribute('width', value);
  }

  /** @returns {BrownieLayoutSpacing} */
  get padding() {
    return /** @type {BrownieLayoutSpacing} */ (
      escapeHtml(this.getAttribute('padding') || 'space-3')
    );
  }

  /** @param {BrownieLayoutSpacing} value */
  set padding(value) {
    this.setAttribute('padding', value);
  }

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    shadow.innerHTML = /*html*/`
      <style>
        :host {
          height: ${this.height};
          width: ${this.width};
          --layout-padding: var(--${this.padding});
        }
      </style>
      <div class="vertical">
        <div class="header">
          <slot name="header"></slot>
        </div>
        <div class="horizontal">
          <div class="start">
            <slot name="start"></slot>
          </div>
          <div class="content">
            <slot name="content"></slot>
          </div>
          <div class="end">
            <slot name="end"></slot>
          </div>
        </div>
        <div class="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }
}

Brownie.register('brow-layout', BrownieLayout);

export default BrownieLayout;
