import Brownie from '../../src/core.js';
import {escapeHtml} from '../../src/utils/html.js';

/**
 * brow-astryx-button — a Brownie button that wears Astryx's theme CSS.
 *
 * Spike for reusing Astryx themes wholesale. Two things make it work:
 *
 * 1. The base styles below are a hand-port of Astryx core's Button, written in
 *    plain CSS against the SAME token names. Astryx's own compiled core CSS is
 *    StyleX atomic classes that React assembles at render time, so it cannot be
 *    reused directly — but the tokens it reads can be, and that is what makes a
 *    theme land the same way on both.
 *
 * 2. The inner element renders Astryx's stable class contract
 *    (`astryx-button secondary md` plus `data-variant`/`data-size`), so a theme's
 *    component overrides match it once that sheet is adopted into the shadow
 *    root. `part="base"` stays alongside, so Brownie's own ::part() surface
 *    still overrides everything — verified: an outer ::part() rule wins over an
 *    adopted inner rule.
 */
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host { display: inline-flex; }

  .astryx-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    padding-block: var(--spacing-2);
    padding-inline: var(--spacing-3);
    border-width: 0;
    border-style: none;
    border-radius: var(--_button-radius, var(--radius-element));
    font-family: inherit;
    font-size: var(--text-label-size);
    line-height: var(--text-label-leading);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    cursor: pointer;
    transition-property: background-image, background-color, color, opacity, transform;
    transition-duration: var(--duration-fast);
    transition-timing-function: var(--ease-standard);
  }

  .astryx-button.sm { height: var(--size-element-sm); }
  .astryx-button.md { height: var(--size-element-md); }
  .astryx-button.lg { height: var(--size-element-lg); }

  .astryx-button:active { transform: scale(0.98); }

  /* Astryx layers its hover/press states as a gradient over the variant color
     so one rule serves every variant. */
  .astryx-button:hover {
    background-image: linear-gradient(var(--color-overlay-hover), var(--color-overlay-hover));
  }
  .astryx-button:active {
    background-image: linear-gradient(var(--color-overlay-pressed), var(--color-overlay-pressed));
  }

  .astryx-button.primary {
    background-color: var(--color-accent);
    color: var(--color-on-accent);
  }
  .astryx-button.secondary {
    background-color: var(--color-neutral);
    color: var(--color-text-primary);
  }
  .astryx-button.ghost {
    background-color: transparent;
    color: var(--color-text-primary);
  }
  .astryx-button.destructive {
    background-color: var(--color-error);
    color: var(--color-on-error);
  }

  .astryx-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    background-image: none;
    transform: none;
  }
`);

/**
 * @element brow-astryx-button
 * @csspart base - The underlying button element
 * @attr {'primary'|'secondary'|'ghost'|'destructive'} variant
 * @attr {'sm'|'md'|'lg'} size
 * @attr {boolean} disabled
 */
export class BrownieAstryxButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled'];
  }

  static styles = styles;

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.adoptedStyleSheets = [styles];
  }

  connectedCallback() {
    this.render();
    Brownie.applyThemes(this.shadowRoot);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get variant() {
    return escapeHtml(this.getAttribute('variant') || 'secondary');
  }

  get size() {
    return escapeHtml(this.getAttribute('size') || 'md');
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  render() {
    const {variant, size} = this;
    this.shadowRoot.innerHTML = /*html*/ `
      <button
        part="base"
        class="astryx-button ${variant} ${size}"
        data-variant="${variant}"
        data-size="${size}"
        ${this.disabled ? 'disabled' : ''}
      ><slot></slot></button>`;
  }
}

Brownie.register('brow-astryx-button', BrownieAstryxButton);

export default BrownieAstryxButton;
