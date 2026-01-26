import Brownie from '../core.js';
import { escapeHtml } from '../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: block;
  }

  [part="base"] {
    box-sizing: border-box;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-container);
    box-shadow: var(--elevation-base);
    width: 100%;
    height: 100%;
    overflow: clip;
  }

  .inner {
    width: 100%;
    height: 100%;
  }
`);

/**
 * Container used for segmenting general content into a visible block.
 * @element brow-card
 * @csspart base - The main container element
 * @typedef {'space-0' | 'space-0_5' | 'space-1' | 'space-1_5' | 'space-2' | 'space-2_5' | 'space-3' | 'space-4' | 'space-5' | 'space-6' | 'space-8' | 'space-10' | 'space-12'} BrownieCardSpacing
 */
export class BrownieCard extends HTMLElement {
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
    return escapeHtml(this.getAttribute('height') || 'auto');
  }

  /** @param {string} value */
  set height(value) {
    this.setAttribute('height', value);
  }

  /** @returns {string} */
  get width() {
    return escapeHtml(this.getAttribute('width') || 'auto');
  }

  /** @param {string} value */
  set width(value) {
    this.setAttribute('width', value);
  }

  /** @returns {BrownieCardSpacing} */
  get padding() {
    return /** @type {BrownieCardSpacing} */ (
      escapeHtml(this.getAttribute('padding') || 'space-4')
    );
  }

  /** @param {BrownieCardSpacing} value */
  set padding(value) {
    this.setAttribute('padding', value);
  }

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    const paddingSides = this.getValuesForSides(this.padding);

    shadow.innerHTML = /*html*/`
      <style>
        :host {
          height: ${this.height};
          width: ${this.width};
        }
        [part="base"] {
          padding-block-start: var(--${paddingSides.top}, var(--space-3));
          padding-block-end: var(--${paddingSides.bottom}, var(--space-3));
          padding-inline-start: var(--${paddingSides.start}, var(--space-3));
          padding-inline-end: var(--${paddingSides.end}, var(--space-3));
        }
        .inner {
          overflow: ${this.height === 'auto' ? 'clip' : 'auto'};
        }
      </style>
      <div part="base">
        <div class="inner">
          <slot></slot>
        </div>
      </div>
    `;
  }

  /**
   * Margins an paddings can use the CSS notation for 1-4 values
   * describing multiple sides.
   *
   * 1: value will apply to all sides
   * 2: first value will apply to top and bottom, second applies to left and right
   * 3: first applies to top, second to left and right, third to bottom
   * 4: first to top, then applied clockwise.
   * @param {string} value
   * @returns {{top: string, end: string, bottom: string, start: string}}
   */
  getValuesForSides(value) {
    const valueList = value.split(' ');
    return {
      top: valueList[0] ?? 'space-4',
      end: valueList[1] ?? valueList[0] ?? 'space-4',
      bottom: valueList[2] ?? valueList[0] ?? 'space-4',
      start: valueList[3] ?? valueList[1] ?? valueList[0] ?? 'space-4',
    };
  }
}

Brownie.register('brow-card', BrownieCard);
