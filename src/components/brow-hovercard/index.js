import Brownie from '../../core.js';
import { escapeHtml } from '../../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: contents;
  }

  /* Style non-interactive text triggers */
  slot[name="trigger"]::slotted(span) {
    text-decoration-line: underline;
    text-decoration-style: dotted;
    text-decoration-color: currentColor;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  :host([plain]) slot[name="trigger"]::slotted(span) {
    text-decoration: none;
  }

  slot[name="trigger"]::slotted(span:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 2px;
  }

  [part="layer"] {
    position: fixed;
    padding: var(--space-2);
    background: transparent;
    border: none;
    overflow: clip;
    overflow-clip-margin: 10px;
  }

  [data-placement="bottom"] {
    position-area: bottom;
    position-try-fallbacks: flip-block;
    padding-block: var(--space-1);
  }
  [data-placement="top"] {
    position-area: top;
    position-try-fallbacks: flip-block;
    padding-block: var(--space-1);
  }
  [data-placement="left"] {
    position-area: left;
    position-try-fallbacks: flip-inline;
    padding-inline: var(--space-1);
  }
  [data-placement="right"] {
    position-area: right;
    position-try-fallbacks: flip-inline;
    padding-inline: var(--space-1);
  }

  [part="layer"]:popover-open {
    opacity: 1;
    transition: opacity 150ms ease;
  }

  @starting-style {
    [part="layer"]:popover-open {
      opacity: 0;
    }
  }

  [part="card"] {
    min-width: 200px;
    max-width: 320px;
    padding: var(--space-4);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-container);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  ::slotted(*:nth-child(1 of :not([slot="trigger"]))) {
    margin-top: 0;
  }

  ::slotted(*:nth-last-child(1 of :not([slot="trigger"]))) {
    margin-bottom: 0;
  }
`);

/**
 * Hovercard component that shows rich content on hover.
 * Unlike tooltips, hovercards are interactive and can be hovered into.
 *
 * @element brow-hovercard
 * @attr {string} placement - Where to position (top, bottom, left, right)
 * @attr {number} delay - Show delay in milliseconds
 *
 * @slot trigger - The element that triggers the hovercard
 * @slot - Default slot for hovercard content
 *
 * @csspart trigger - The trigger wrapper
 * @csspart card - The hovercard container
 *
 * @example
 * <brow-hovercard>
 *   <a href="/user/alice" slot="trigger">Alice Chen</a>
 *   <h4>Alice Chen</h4>
 *   <p>Software Engineer at Acme Corp</p>
 * </brow-hovercard>
 */
export class BrownieHovercard extends HTMLElement {
  static get observedAttributes() {
    return ['placement', 'delay'];
  }

  /** @type {CSSStyleSheet} */
  static styles = styles;

  /** @type {number | null} */
  #showTimeout = null;

  /** @type {number | null} */
  #hideTimeout = null;

  /** @type {boolean} */
  #isHoveringTrigger = false;

  /** @type {boolean} */
  #isHoveringLayer = false;

  /** @type {boolean} */
  #isFocusedInCard = false;

  /** @type {string} */
  #anchorName = '';

  // Bound event handlers
  #boundTriggerEnter = this.#onTriggerEnter.bind(this);
  #boundTriggerLeave = this.#onTriggerLeave.bind(this);
  #boundTriggerFocus = this.#onTriggerFocus.bind(this);
  #boundTriggerBlur = this.#onTriggerBlur.bind(this);
  #boundLayerEnter = this.#onLayerEnter.bind(this);
  #boundLayerLeave = this.#onLayerLeave.bind(this);
  #boundLayerFocusIn = this.#onLayerFocusIn.bind(this);
  #boundLayerFocusOut = this.#onLayerFocusOut.bind(this);
  #boundKeydown = this.#onKeydown.bind(this);

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);
    shadow.adoptedStyleSheets = [styles];
    this.#anchorName = `--hovercard-anchor-${Brownie.generateId()}`;
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
    this.#updateTriggerDisplay();
    this.#makeSpansFocusable();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
  }

  disconnectedCallback() {
    this.#unbindEvents();
    this.#clearTimeouts();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this.#render();
      this.#bindEvents();
    }
  }

  // ============================================================
  // Attributes
  // ============================================================

  get placement() {
    return escapeHtml(this.getAttribute('placement') || 'bottom');
  }

  set placement(value) {
    this.setAttribute('placement', value);
  }

  get delay() {
    const delay = parseInt(this.getAttribute('delay') || '300', 10);
    return delay >= 0 ? delay : 300;
  }

  set delay(value) {
    this.setAttribute('delay', String(value));
  }

  // ============================================================
  // Public Methods
  // ============================================================

  show() {
    const popover = this.shadowRoot?.querySelector('[part="layer"]');
    if (popover instanceof HTMLElement) {
      popover.showPopover();
    }
  }

  hide() {
    this.#hideImmediate();
  }

  // ============================================================
  // Private Methods
  // ============================================================

  #bindEvents() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const layer = this.shadowRoot?.querySelector('[part="layer"]');

    if (trigger) {
      trigger.addEventListener('mouseenter', this.#boundTriggerEnter);
      trigger.addEventListener('mouseleave', this.#boundTriggerLeave);
      trigger.addEventListener('focusin', this.#boundTriggerFocus);
      trigger.addEventListener('focusout', this.#boundTriggerBlur);
    }

    if (layer) {
      layer.addEventListener('mouseenter', this.#boundLayerEnter);
      layer.addEventListener('mouseleave', this.#boundLayerLeave);
      layer.addEventListener('focusin', this.#boundLayerFocusIn);
      layer.addEventListener('focusout', this.#boundLayerFocusOut);
    }

    document.addEventListener('keydown', this.#boundKeydown);
  }

  #unbindEvents() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const layer = this.shadowRoot?.querySelector('[part="layer"]');

    if (trigger) {
      trigger.removeEventListener('mouseenter', this.#boundTriggerEnter);
      trigger.removeEventListener('mouseleave', this.#boundTriggerLeave);
      trigger.removeEventListener('focusin', this.#boundTriggerFocus);
      trigger.removeEventListener('focusout', this.#boundTriggerBlur);
    }

    if (layer) {
      layer.removeEventListener('mouseenter', this.#boundLayerEnter);
      layer.removeEventListener('mouseleave', this.#boundLayerLeave);
      layer.removeEventListener('focusin', this.#boundLayerFocusIn);
      layer.removeEventListener('focusout', this.#boundLayerFocusOut);
    }

    document.removeEventListener('keydown', this.#boundKeydown);
  }

  #onTriggerEnter() {
    this.#isHoveringTrigger = true;
    this.#scheduleShow();
  }

  #onTriggerLeave() {
    this.#isHoveringTrigger = false;
    this.#scheduleHide();
  }

  #onTriggerFocus() {
    this.#clearTimeouts();
    this.show();
  }

  #onTriggerBlur() {
    // Delay check to allow focus to move to card
    setTimeout(() => {
      if (!this.#isFocusedInCard) {
        this.#scheduleHide();
      }
    }, 0);
  }

  #onLayerEnter() {
    this.#isHoveringLayer = true;
    this.#clearTimeouts();
  }

  #onLayerLeave() {
    this.#isHoveringLayer = false;
    this.#scheduleHide();
  }

  #onLayerFocusIn() {
    this.#isFocusedInCard = true;
    this.#clearTimeouts();
  }

  #onLayerFocusOut() {
    this.#isFocusedInCard = false;
    // Delay check to allow focus to move within card
    setTimeout(() => {
      if (!this.#isFocusedInCard && !this.#isHoveringLayer) {
        this.#hideImmediate();
      }
    }, 0);
  }

  /**
   * @param {{ key: string; }} e
   */
  #onKeydown(e) {
    if (e.key === 'Escape') {
      this.#hideImmediate();
    }
  }

  #scheduleShow() {
    this.#clearTimeouts();
    this.#showTimeout = window.setTimeout(() => {
      this.show();
    }, this.delay);
  }

  #scheduleHide() {
    this.#clearTimeouts();
    this.#hideTimeout = window.setTimeout(() => {
      if (!this.#isHoveringTrigger && !this.#isHoveringLayer && !this.#isFocusedInCard) {
        this.#hideImmediate();
      }
    }, 150);
  }

  #hideImmediate() {
    this.#clearTimeouts();
    const popover = this.shadowRoot?.querySelector('[part="layer"]');
    if (popover instanceof HTMLElement) {
      try {
        popover.hidePopover();
      } catch {
        // Ignore if already hidden
      }
    }
  }

  #clearTimeouts() {
    if (this.#showTimeout !== null) {
      window.clearTimeout(this.#showTimeout);
      this.#showTimeout = null;
    }
    if (this.#hideTimeout !== null) {
      window.clearTimeout(this.#hideTimeout);
      this.#hideTimeout = null;
    }
  }

  #updateTriggerDisplay() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const slotted = this.querySelector('[slot="trigger"]');
    if (!trigger || !slotted) return;

    const style = getComputedStyle(slotted);
    const isBlock = style.display === 'block' || style.display === 'flex' || style.display === 'grid';
    /** @type {HTMLElement} */ (trigger).style.display = isBlock ? 'flex' : 'inline-flex';
  }

  #makeSpansFocusable() {
    const span = this.querySelector('span[slot="trigger"]');
    if (span && !span.hasAttribute('tabindex')) {
      span.setAttribute('tabindex', '0');
    }
  }

  #render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    shadow.innerHTML = /*html*/ `
      <style>
        [part="trigger"] {
          anchor-name: ${this.#anchorName};
        }
        [part="layer"] {
          position-anchor: ${this.#anchorName};
        }
      </style>
      <span part="trigger" aria-haspopup="dialog">
        <slot name="trigger"></slot>
      </span>
      <div part="layer" popover="manual" data-placement="${this.placement}">
        <div part="card">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

Brownie.register('brow-hovercard', BrownieHovercard);

export default BrownieHovercard;
