import Brownie from '../core.js';

/**
 * A composable layout with header, footer, start, end panels and content slots.
 * @element brow-layout
 */
export class BrownieLayout extends HTMLElement {
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
    return /** @type {string} */ (this.getAttribute('height')) || '100%';
  }

  /** @param {string} value */
  set height(value) {
    this.setAttribute('height', value);
  }

  /** @returns {string} */
  get width() {
    return /** @type {string} */ (this.getAttribute('width')) || '100%';
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
          display: flex;
          height: ${this.height};
          width: ${this.width};
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

        .fill {
          height: 100%;
        }
        .fill .content {
          overflow: auto;
        }
      </style>
      <div class="vertical">
        <slot name="header"></slot>
        <div class="horizontal">
          <slot name="start"></slot>
          <div class="content">
            <slot name="content"></slot>
          </div>
          <slot name="end"></slot>
        </div>
        <slot name="footer"></slot>
      </div>
    `;
  }
}

Brownie.register('brow-layout', BrownieLayout);
