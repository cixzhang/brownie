import Brownie from '../core.js';

/**
 * Menu component that shows a dropdown list of items.
 * Uses the Popover API for light dismiss and CSS anchor positioning.
 *
 * @element brow-menu
 * @attr {string} placement - Where to position (default: bottom-end)
 *
 * @slot trigger - The element that triggers the menu
 * @slot - Default slot for menu items
 *
 * @csspart trigger - The trigger wrapper
 * @csspart layer - The menu layer (transparent wrapper)
 * @csspart menu - The menu container
 *
 * @fires brow-select - Fired when a menu item is selected
 *
 * @example
 * <brow-menu>
 *   <brow-button slot="trigger">Actions</brow-button>
 *   <brow-menu-item value="edit">Edit</brow-menu-item>
 *   <brow-menu-item value="delete" variant="danger">Delete</brow-menu-item>
 * </brow-menu>
 */
export class BrownieMenu extends HTMLElement {
  static get observedAttributes() {
    return ['placement'];
  }

  /** @type {string} */
  #anchorName = '';

  /** @type {string} */
  #menuId = '';

  /** @type {number} */
  #focusedIndex = -1;

  // Bound event handlers
  #boundOnToggle = this.#onToggle.bind(this);
  #boundOnKeydown = this.#onKeydown.bind(this);
  #boundOnItemClick = this.#onItemClick.bind(this);
  #boundOnTriggerClick = this.#onTriggerClick.bind(this);
  #boundOnTriggerKeydown = this.#onTriggerKeydown.bind(this);

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.#anchorName = `--menu-anchor-${Brownie.generateId()}`;
    this.#menuId = `menu-${Brownie.generateId()}`;
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
    this.#updateTriggerDisplay();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
  }

  disconnectedCallback() {
    this.#unbindEvents();
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
    return this.getAttribute('placement') || 'bottom-end';
  }

  set placement(value) {
    this.setAttribute('placement', value);
  }

  // ============================================================
  // Public Methods
  // ============================================================

  open() {
    const layer = this.shadowRoot?.querySelector('[part="layer"]');
    if (layer instanceof HTMLElement) {
      layer.togglePopover(true);
    }
  }

  close() {
    const layer = this.shadowRoot?.querySelector('[part="layer"]');
    if (layer instanceof HTMLElement) {
      layer.togglePopover(false);
    }
  }

  toggle() {
    const layer = this.shadowRoot?.querySelector('[part="layer"]');
    if (layer instanceof HTMLElement) {
      layer.togglePopover();
    }
  }

  // ============================================================
  // Private Methods
  // ============================================================

  #bindEvents() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const layer = this.shadowRoot?.querySelector('[part="layer"]');

    if (trigger) {
      trigger.addEventListener('click', this.#boundOnTriggerClick);
      trigger.addEventListener('keydown', this.#boundOnTriggerKeydown);
    }

    if (layer) {
      layer.addEventListener('toggle', this.#boundOnToggle);
      layer.addEventListener('keydown', this.#boundOnKeydown);
      layer.addEventListener('click', this.#boundOnItemClick);
    }
  }

  #unbindEvents() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const layer = this.shadowRoot?.querySelector('[part="layer"]');

    if (trigger) {
      trigger.removeEventListener('click', this.#boundOnTriggerClick);
      trigger.removeEventListener('keydown', this.#boundOnTriggerKeydown);
    }

    if (layer) {
      layer.removeEventListener('toggle', this.#boundOnToggle);
      layer.removeEventListener('keydown', this.#boundOnKeydown);
      layer.removeEventListener('click', this.#boundOnItemClick);
    }
  }

  #onTriggerClick() {
    this.toggle();
  }

  /**
   * @param {KeyboardEvent} e
   */
  #onTriggerKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.open();
    }
  }

  /**
   * @param {ToggleEvent} e
   */
  #onToggle(e) {
    console.log(e);
    const isOpen = e.newState === 'open';

    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    if (trigger) {
      trigger.setAttribute('aria-expanded', String(isOpen));
    }

    if (isOpen) {
      this.#focusedIndex = -1;
      this.#focusItem(0);
    }
  }

  /**
   * @param {KeyboardEvent} e
   */
  #onKeydown(e) {
    const items = this.#getItems();
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.#focusItem(this.#focusedIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.#focusItem(this.#focusedIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        this.#focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        this.#focusItem(items.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (this.#focusedIndex >= 0 && this.#focusedIndex < items.length) {
          this.#selectItem(items[this.#focusedIndex]);
        }
        break;
      case 'Escape':
      case 'Tab':
        this.close();
        this.shadowRoot
          ?.querySelector('[part="trigger"]')
          ?.querySelector('*')
          ?.focus();
        break;
    }
  }

  #onItemClick(e) {
    const target = /** @type {HTMLElement} */ (e.target);
    const item = target.closest('brow-menu-item');
    if (item && !item.hasAttribute('disabled')) {
      this.#selectItem(item);
    }
  }

  #getItems() {
    return [...this.querySelectorAll('brow-menu-item:not([disabled])')].map(
      (el) => /** @type {HTMLElement} */ (el),
    );
  }

  /**
   * @param {number} index
   */
  #focusItem(index) {
    const items = this.#getItems();
    if (items.length === 0) return;

    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;

    items.forEach((item, i) => {
      if (i === index) {
        item.setAttribute('tabindex', '0');
        item.focus();
      } else {
        item.setAttribute('tabindex', '-1');
      }
    });

    this.#focusedIndex = index;
  }

  /**
   * @param {{ getAttribute: (arg0: string) => string; }} item
   */
  #selectItem(item) {
    const value = item.getAttribute('value') || '';

    const event = new CustomEvent('brow-select', {
      bubbles: true,
      detail: { value, item },
    });
    this.dispatchEvent(event);

    this.close();
    this.shadowRoot
      ?.querySelector('[part="trigger"]')
      ?.querySelector('*')
      ?.focus();
  }

  #updateTriggerDisplay() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const slotted = this.querySelector('[slot="trigger"]');
    if (!trigger || !slotted) return;

    const style = getComputedStyle(slotted);
    const isBlock =
      style.display === 'block' ||
      style.display === 'flex' ||
      style.display === 'grid';
    /** @type {HTMLElement} */ (trigger).style.display = isBlock
      ? 'flex'
      : 'inline-flex';
  }

  #render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    shadow.innerHTML = /*html*/ `
      <style>
        :host {
          display: contents;
        }

        [part="trigger"] {
          anchor-name: ${this.#anchorName};
        }

        [part="layer"] {
          position: fixed;
          position-anchor: ${this.#anchorName};
          padding: 0;
          background: transparent;
          border: none;
          overflow: clip;
          overflow-clip-margin: 10px;
        }

        [data-placement="bottom-start"] {
          position-area: bottom span-x-start;
          position-try-fallbacks: flip-block;
          padding-block: var(--space-1);
        }
        [data-placement="bottom-end"] {
          position-area: bottom span-x-end;
          position-try-fallbacks: flip-block;
          padding-block: var(--space-1);
        }
        [data-placement="top-start"] {
          position-area: top span-x-start;
          position-try-fallbacks: flip-block;
          padding-block: var(--space-1);
        }
        [data-placement="top-end"] {
          position-area: top span-x-end;
          position-try-fallbacks: flip-block;
          padding-block: var(--space-1);
        }

        [part="layer"]:popover-open {
          opacity: 1;
          transform: scale(1);
          transition: opacity 150ms ease, transform 150ms ease;
        }

        @starting-style {
          [part="layer"]:popover-open {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        [part="menu"] {
          min-width: var(--menu-min-width, 12rem);
          max-height: var(--menu-max-height, 20rem);
          overflow-y: auto;
          padding: var(--space-1) 0;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-container);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          list-style: none;
          transform-origin: top center;
        }

        [part="menu"]:focus {
          outline: none;
        }
      </style>
      <span
        part="trigger"
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="${this.#menuId}"
      >
        <slot name="trigger"></slot>
      </span>
      <div part="layer" popover="auto" data-placement="${this.placement}">
        <div part="menu" id="${this.#menuId}" role="menu">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

Brownie.register('brow-menu', BrownieMenu);
