import Brownie from '../core.js';

/**
 * TODO: Add component description
 * @element brow-section
 * @csspart base - The main container element
 * @typedef {'muted' | 'surface'} BrownieSectionVariant
 * @typedef {'space-0' | 'space-0_5' | 'space-1' | 'space-1_5' | 'space-2' | 'space-2_5' | 'space-3' | 'space-4' | 'space-5' | 'space-6' | 'space-8' | 'space-10' | 'space-12'} BrownieSectionSpacing
 * @typedef {'all' | 'top' | 'bottom' | 'start' | 'end' | 'inline' | 'block'} BrownieSectionDivider
 */
export class BrownieSection extends HTMLElement {
  static get observedAttributes() {
    return ['padding', 'divider', 'height', 'width'];
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

  /** @returns {BrownieSectionVariant} */
  get variant() {
    return (
      /** @type {BrownieSectionVariant} */ (this.getAttribute('variant')) ||
      'default'
    );
  }

  /** @param {BrownieSectionVariant} value */
  set variant(value) {
    this.setAttribute('variant', value);
  }

  /** @returns {BrownieSectionSpacing} */
  get padding() {
    return (
      /** @type {BrownieSectionSpacing} */ (this.getAttribute('padding')) ||
      'space-3'
    );
  }

  /** @param {BrownieSectionSpacing} value */
  set padding(value) {
    this.setAttribute('padding', value);
  }

  /** @returns {?BrownieSectionDivider} */
  get divider() {
    return (
      /** @type {BrownieSectionDivider} */ (this.getAttribute('divider')) ||
      undefined
    );
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

    const paddingSides = this.getValuesForSides(this.padding);

    shadow.innerHTML = /*html*/ `
      <style>
        :host {
          display: block;
          height: ${this.height};
          width: ${this.width};
        }

        [part="base"] {
          box-sizing: border-box;
          height: 100%;
          width: 100%;
          padding-block-start: var(--${paddingSides.top});
          padding-block-end: var(--${paddingSides.bottom});
          padding-inline-start: var(--${paddingSides.start});
          padding-inline-end: var(--${paddingSides.end});
        }

        :host([variant="muted"]) [part="base"] {
          background-color: var(--color-muted);
        }

        :host([variant="surface"]) [part="base"] {
          background-color: var(--color-card);
        }
      </style>
      <div part="base" class="sized">
        <slot></slot>
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
      top: valueList[0] ?? '0',
      end: valueList[1] ?? valueList[0] ?? '0',
      bottom: valueList[2] ?? valueList[0] ?? '0',
      start: valueList[3] ?? valueList[1] ?? valueList[0] ?? '0',
    };
  }
}

Brownie.register('brow-section', BrownieSection);
