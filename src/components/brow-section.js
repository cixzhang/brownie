import Brownie from '../core.js';
import { escapeHtml } from '../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: block;
  }

  :host([variant="muted"]) {
    background-color: var(--color-muted);
  }

  :host([variant="surface"]) {
    background-color: var(--color-card);
  }
`);

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

  /** @returns {BrownieSectionVariant} */
  get variant() {
    return /** @type {BrownieSectionVariant} */ (
      escapeHtml(this.getAttribute('variant') || 'default')
    );
  }

  /** @param {BrownieSectionVariant} value */
  set variant(value) {
    this.setAttribute('variant', value);
  }

  /** @returns {BrownieSectionSpacing} */
  get padding() {
    return /** @type {BrownieSectionSpacing} */ (
      escapeHtml(this.getAttribute('padding') || 'layout-padding')
    );
  }

  /** @param {BrownieSectionSpacing} value */
  set padding(value) {
    this.setAttribute('padding', value);
  }

  /** @returns {?BrownieSectionDivider} */
  get divider() {
    const val = this.getAttribute('divider');
    return val ? /** @type {BrownieSectionDivider} */ (escapeHtml(val)) : undefined;
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

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    const paddingSides = this.getValuesForSides(this.padding);

    // Build dynamic styles
    const dynamicStyles = [];
    dynamicStyles.push(`height: ${this.height}`);
    dynamicStyles.push(`width: ${this.width}`);
    dynamicStyles.push(`padding-block-start: var(--${paddingSides.top}, var(--space-3))`);
    dynamicStyles.push(`padding-block-end: var(--${paddingSides.bottom}, var(--space-3))`);
    dynamicStyles.push(`padding-inline-start: var(--${paddingSides.start}, var(--space-3))`);
    dynamicStyles.push(`padding-inline-end: var(--${paddingSides.end}, var(--space-3))`);

    if (this.divider === 'all') dynamicStyles.push('border: 1px solid var(--color-border)');
    if (this.divider === 'top') dynamicStyles.push('border-block-start: 1px solid var(--color-border)');
    if (this.divider === 'bottom') dynamicStyles.push('border-block-end: 1px solid var(--color-border)');
    if (this.divider === 'start') dynamicStyles.push('border-inline-start: 1px solid var(--color-border)');
    if (this.divider === 'end') dynamicStyles.push('border-inline-end: 1px solid var(--color-border)');
    if (this.divider === 'inline') dynamicStyles.push('border-inline: 1px solid var(--color-border)');
    if (this.divider === 'block') dynamicStyles.push('border-block: 1px solid var(--color-border)');

    shadow.innerHTML = /*html*/`
      <style>
        :host {
          ${dynamicStyles.join('; ')};
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
