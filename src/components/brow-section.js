import Brownie from '../core.js';

/**
 * A section used with `brow-layout` providing spacing around content and optional background.
 * @element brow-section
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
      'layout-padding'
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

    shadow.innerHTML = /*html*/`
      <style>
        :host {
          display: block;
          height: ${this.height};
          width: ${this.width};
          padding-block-start: var(--${paddingSides.top}, var(--space-3));
          padding-block-end: var(--${paddingSides.bottom}, var(--space-3));
          padding-inline-start: var(--${paddingSides.start}, var(--space-3));
          padding-inline-end: var(--${paddingSides.end}, var(--space-3));
          ${this.divider === 'all' ? 'border: 1px solid var(--color-border)' : ''}
          ${this.divider === 'top' ? 'border-block-start: 1px solid var(--color-border)' : ''}
          ${this.divider === 'bottom' ? 'border-block-end: 1px solid var(--color-border)' : ''}
          ${this.divider === 'start' ? 'border-inline-start: 1px solid var(--color-border)' : ''}
          ${this.divider === 'end' ? 'border-inline-end: 1px solid var(--color-border)' : ''}
          ${this.divider === 'inline' ? 'border-inline: 1px solid var(--color-border)' : ''}
          ${this.divider === 'block' ? 'border-block: 1px solid var(--color-border)' : ''}
        }

        :host([variant="muted"]) {
          background-color: var(--color-muted);
        }

        :host([variant="surface"]) {
          background-color: var(--color-card);
        }
      </style>
      <slot></slot>
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
      top: valueList[0] ?? 'layout-padding',
      end: valueList[1] ?? valueList[0] ?? 'layout-padding',
      bottom: valueList[2] ?? valueList[0] ?? 'layout-padding',
      start: valueList[3] ?? valueList[1] ?? valueList[0] ?? 'layout-padding',
    };
  }
}

Brownie.register('brow-section', BrownieSection);
