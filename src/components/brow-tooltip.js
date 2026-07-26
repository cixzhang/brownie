import Brownie from '../core.js';
import { escapeHtml } from '../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: contents;
  }

  /* Style non-interactive text triggers */
  ::slotted(span) {
    text-decoration-line: underline;
    text-decoration-style: dotted;
    text-decoration-color: currentColor;
    text-decoration-thickness: 1px;
    text-underline-offset: 2px;
    cursor: help;
  }

  :host([plain]) ::slotted(span) {
    text-decoration: none;
  }

  ::slotted(span:focus-visible) {
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
    pointer-events: none;
  }

  [data-placement="top"] {
    position-area: top;
    position-try-fallbacks: flip-block;
    padding-block: var(--space-1);
  }
  [data-placement="bottom"] {
    position-area: bottom;
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

  [part="tooltip"] {
    max-width: 250px;
    padding: var(--space-1) var(--space-2);
    background: var(--color-text-primary);
    color: var(--color-page);
    font-size: 0.875rem;
    line-height: 1.4;
    border-radius: var(--radius-element);
    white-space: normal;
    word-wrap: break-word;
  }
`);

/**
 * Tooltip component that shows text hints on hover/focus.
 * Wraps the trigger element to enable CSS anchor positioning.
 *
 * @element brow-tooltip
 * @attr {string} text - Tooltip text content
 * @attr {string} placement - Where to position (top, bottom, left, right)
 * @attr {number} delay - Show delay in milliseconds
 *
 * @csspart trigger - The trigger wrapper
 * @csspart layer - The tooltip layer (transparent wrapper)
 * @csspart tooltip - The tooltip container
 *
 * @example
 * <brow-tooltip text="Save your changes (Ctrl+S)">
 *   <brow-button>Save</brow-button>
 * </brow-tooltip>
 */
export class BrownieTooltip extends HTMLElement {
  static get observedAttributes() {
    return ['text', 'placement', 'delay'];
  }

  /** @type {CSSStyleSheet} */
  static styles = styles;

  /** @type {number | null} */
  #showTimeout = null;

  /** @type {string} */
  #anchorName = '';

  /** @type {string} */
  #tooltipId = '';

  // Bound event handlers
  #boundShow = this.#scheduleShow.bind(this);
  #boundHide = this.#hide.bind(this);
  #boundHideImmediate = this.#hideImmediate.bind(this);

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);
    shadow.adoptedStyleSheets = [styles];
    this.#anchorName = `--tooltip-anchor-${Brownie.generateId()}`;
    this.#tooltipId = `tooltip-${Brownie.generateId()}`;
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
    this.#clearTimeout();
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

  get text() {
    return escapeHtml(this.getAttribute('text') || '');
  }

  set text(value) {
    if (value) {
      this.setAttribute('text', value);
    } else {
      this.removeAttribute('text');
    }
  }

  get placement() {
    return escapeHtml(this.getAttribute('placement') || 'top');
  }

  set placement(value) {
    this.setAttribute('placement', value);
  }

  get delay() {
    const delay = parseInt(this.getAttribute('delay') || '200', 10);
    return delay >= 0 ? delay : 200;
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
    if (!trigger) return;

    trigger.addEventListener('mouseenter', this.#boundShow);
    trigger.addEventListener('mouseleave', this.#boundHide);
    trigger.addEventListener('focusin', this.#boundShow);
    trigger.addEventListener('focusout', this.#boundHideImmediate);
  }

  #unbindEvents() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    if (!trigger) return;

    trigger.removeEventListener('mouseenter', this.#boundShow);
    trigger.removeEventListener('mouseleave', this.#boundHide);
    trigger.removeEventListener('focusin', this.#boundShow);
    trigger.removeEventListener('focusout', this.#boundHideImmediate);
  }

  #scheduleShow() {
    this.#clearTimeout();
    this.#showTimeout = window.setTimeout(() => {
      this.show();
    }, this.delay);
  }

  #hide() {
    this.#clearTimeout();
    this.#showTimeout = window.setTimeout(() => {
      this.#hideImmediate();
    }, 100);
  }

  #hideImmediate() {
    this.#clearTimeout();
    const popover = this.shadowRoot?.querySelector('[part="layer"]');
    if (popover instanceof HTMLElement) {
      try {
        popover.hidePopover();
      } catch {
        // Ignore if already hidden
      }
    }
  }

  #clearTimeout() {
    if (this.#showTimeout !== null) {
      window.clearTimeout(this.#showTimeout);
      this.#showTimeout = null;
    }
  }

  #updateTriggerDisplay() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const slotted = this.firstElementChild;
    if (!trigger || !slotted) return;

    const style = getComputedStyle(slotted);
    const isBlock = style.display === 'block' || style.display === 'flex' || style.display === 'grid';
    /** @type {HTMLElement} */ (trigger).style.display = isBlock ? 'flex' : 'inline-flex';
  }

  #makeSpansFocusable() {
    const spans = this.querySelectorAll(':scope > span');
    spans.forEach((span) => {
      if (!span.hasAttribute('tabindex')) {
        span.setAttribute('tabindex', '0');
      }
    });
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
      <span part="trigger" aria-describedby="${this.#tooltipId}">
        <slot></slot>
      </span>
      <div part="layer" popover="manual" data-placement="${this.placement}">
        <div part="tooltip" role="tooltip" id="${this.#tooltipId}">${this.text}</div>
      </div>
    `;
  }
}

Brownie.register('brow-tooltip', BrownieTooltip);

export default BrownieTooltip;
