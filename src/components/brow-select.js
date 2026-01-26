import Brownie from '../core.js';
import { escapeHtml } from '../utils/html.js';

// Shared stylesheet for all instances
const styles = new CSSStyleSheet();
styles.replaceSync(/*css*/ `
  :host {
    display: inline-flex;
    position: relative;
  }

  [part="trigger"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-width: 10rem;
    padding-inline: var(--space-3);
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-element);
    box-sizing: border-box;
    font-family: inherit;
    font-size: inherit;
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    height: var(--space-9);
  }

  [part="trigger"]:hover {
    border-color: var(--color-border-hover, var(--color-border));
  }

  [part="trigger"]:focus {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  [part="trigger"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .display-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .display-value.placeholder {
    color: var(--color-text-muted);
  }

  .chevron {
    flex-shrink: 0;
    color: var(--color-text-muted);
  }

  [part="layer"] {
    position: fixed;
    position-area: bottom span-right;
    position-try-fallbacks: flip-block;
    padding: 0;
    background: transparent;
    border: none;
    overflow: clip;
    overflow-clip-margin: 10px;
    padding-block: var(--space-1);
    min-width: anchor-size(width);
  }

  [part="layer"]:popover-open {
    opacity: 1;
    transform: translateY(var(--select-offset-y, 0px)) scale(1);
    transition: opacity 150ms ease, scale 150ms ease;
  }

  @starting-style {
    [part="layer"]:popover-open {
      opacity: 0;
      scale: 0.95;
    }
  }

  [part="listbox"] {
    min-width: 100%;
    max-height: var(--select-max-height, 20rem);
    overflow-y: auto;
    padding: var(--space-1) 0;
    margin: 0;
    background: var(--color-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-container);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    list-style: none;
    transform-origin: top center;
  }

  [part="listbox"]:focus {
    outline: none;
  }

  .search-wrapper {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border-muted);
  }

  .search-input {
    width: 100%;
    padding: var(--space-1_5) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-element);
    font-family: inherit;
    font-size: 0.875rem;
    background: var(--color-background);
    color: var(--color-text-primary);
  }

  .search-input:focus {
    outline: 2px solid var(--color-focus);
    outline-offset: -1px;
  }
`);

/**
 * Custom select dropdown component.
 * Uses the Popover API for light dismiss and CSS anchor positioning.
 *
 * @element brow-select
 * @attr {string} name - Form field name
 * @attr {string} value - Currently selected value
 * @attr {string} placeholder - Placeholder text when no selection
 * @attr {boolean} disabled - Disable the select
 * @attr {boolean} required - Required for form validation
 * @attr {boolean} searchable - Enable type-to-filter
 *
 * @csspart trigger - The select trigger button
 * @csspart layer - The layer (transparent wrapper for positioning)
 * @csspart listbox - The dropdown listbox
 *
 * @fires change - Fired when selection changes
 *
 * @example
 * <brow-select name="country" value="us">
 *   <brow-option value="us">United States</brow-option>
 *   <brow-option value="uk">United Kingdom</brow-option>
 * </brow-select>
 */
export class BrownieSelect extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'value', 'placeholder', 'disabled', 'required', 'searchable'];
  }

  /** @type {CSSStyleSheet} */
  static styles = styles;

  /** @type {string} */
  #anchorName = '';

  /** @type {string} */
  #listboxId = '';

  /** @type {number} */
  #focusedIndex = -1;

  /** @type {string} */
  #searchBuffer = '';

  /** @type {number | null} */
  #searchTimeout = null;

  // Bound event handlers
  #boundOnToggle = this.#onToggle.bind(this);
  #boundOnKeydown = this.#onKeydown.bind(this);
  #boundOnOptionClick = this.#onOptionClick.bind(this);
  #boundOnTriggerKeydown = this.#onTriggerKeydown.bind(this);
  #boundOnSearchInput = this.#onSearchInput.bind(this);

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);
    shadow.adoptedStyleSheets = [styles];
    this.#anchorName = `--select-anchor-${Brownie.generateId()}`;
    this.#listboxId = `listbox-${Brownie.generateId()}`;
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
    this.#updateDisplayValue();
    this.#updateOptionSelection();
    Brownie.applyThemes(/** @type {ShadowRoot} */ (this.shadowRoot));
  }

  disconnectedCallback() {
    this.#unbindEvents();
    if (this.#searchTimeout) {
      window.clearTimeout(this.#searchTimeout);
    }
  }

  /**
   * @param {string} name
   */
  attributeChangedCallback(name) {
    if (this.isConnected) {
      if (name === 'value') {
        this.#updateDisplayValue();
        this.#updateOptionSelection();
        this.#updateHiddenInput();
      } else if (name === 'disabled') {
        this.#updateDisabledState();
      } else if (name === 'name') {
        this.#updateHiddenInput();
      } else {
        this.#render();
        this.#bindEvents();
        this.#updateDisplayValue();
      }
    }
  }

  // ============================================================
  // Attributes
  // ============================================================

  get name() {
    const val = this.getAttribute('name');
    return val ? escapeHtml(val) : null;
  }

  set name(value) {
    if (value) {
      this.setAttribute('name', value);
    } else {
      this.removeAttribute('name');
    }
  }

  get value() {
    const val = this.getAttribute('value');
    return val ? escapeHtml(val) : null;
  }

  set value(val) {
    if (val) {
      this.setAttribute('value', val);
    } else {
      this.removeAttribute('value');
    }
  }

  get placeholder() {
    return escapeHtml(this.getAttribute('placeholder') || 'Select...');
  }

  set placeholder(value) {
    this.setAttribute('placeholder', value);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  get required() {
    return this.hasAttribute('required');
  }

  set required(value) {
    if (value) {
      this.setAttribute('required', '');
    } else {
      this.removeAttribute('required');
    }
  }

  get searchable() {
    return this.hasAttribute('searchable');
  }

  set searchable(value) {
    if (value) {
      this.setAttribute('searchable', '');
    } else {
      this.removeAttribute('searchable');
    }
  }

  // ============================================================
  // Public Methods
  // ============================================================

  open() {
    if (this.disabled) return;
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
    const searchInput = this.shadowRoot?.querySelector('.search-input');

    if (trigger) {
      trigger.addEventListener('keydown', /** @type {EventListener} */ (this.#boundOnTriggerKeydown));
    }

    if (layer) {
      layer.addEventListener('toggle', /** @type {EventListener} */ (this.#boundOnToggle));
      layer.addEventListener('keydown', /** @type {EventListener} */ (this.#boundOnKeydown));
      layer.addEventListener('click', /** @type {EventListener} */ (this.#boundOnOptionClick));
    }

    if (searchInput) {
      searchInput.addEventListener('input', this.#boundOnSearchInput);
    }
  }

  #unbindEvents() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const layer = this.shadowRoot?.querySelector('[part="layer"]');
    const searchInput = this.shadowRoot?.querySelector('.search-input');

    if (trigger) {
      trigger.removeEventListener('keydown', /** @type {EventListener} */ (this.#boundOnTriggerKeydown));
    }

    if (layer) {
      layer.removeEventListener('toggle', /** @type {EventListener} */ (this.#boundOnToggle));
      layer.removeEventListener('keydown', /** @type {EventListener} */ (this.#boundOnKeydown));
      layer.removeEventListener('click', /** @type {EventListener} */ (this.#boundOnOptionClick));
    }

    if (searchInput) {
      searchInput.removeEventListener('input', this.#boundOnSearchInput);
    }
  }

  /**
   * @param {ToggleEvent} e
   */
  #onToggle(e) {
    const isOpen = e.newState === 'open';

    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    if (trigger) {
      trigger.setAttribute('aria-expanded', String(isOpen));
    }

    if (isOpen) {
      const options = this.#getOptions();
      const selectedIndex = options.findIndex((opt) => opt.getAttribute('value') === this.value);
      this.#focusedIndex = selectedIndex >= 0 ? selectedIndex : 0;

      // Position dropdown so selected item aligns with trigger
      this.#positionDropdown(selectedIndex);

      this.#focusOption(this.#focusedIndex);

      if (this.searchable) {
        const searchInput = this.shadowRoot?.querySelector('.search-input');
        if (searchInput instanceof HTMLElement) {
          searchInput.focus();
        }
      }
    } else {
      this.#searchBuffer = '';
      const searchInput = this.shadowRoot?.querySelector('.search-input');
      if (searchInput instanceof HTMLInputElement) {
        searchInput.value = '';
      }
      this.#filterOptions('');
    }
  }

  /**
   * Position dropdown so selected item aligns with trigger
   * @param {number} selectedIndex
   */
  #positionDropdown(selectedIndex) {
    const layer = this.shadowRoot?.querySelector('[part="layer"]');
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    const listbox = this.shadowRoot?.querySelector('[part="listbox"]');
    if (!layer || !trigger || !listbox || selectedIndex < 0) {
      /** @type {HTMLElement} */ (layer)?.style.setProperty('--select-offset-y', '0px');
      return;
    }

    const options = this.#getOptions();
    const selectedOption = options[selectedIndex];
    if (!selectedOption) {
      /** @type {HTMLElement} */ (layer).style.setProperty('--select-offset-y', '0px');
      return;
    }

    // Calculate offset to align selected item with trigger
    // Move up by: trigger height + listbox padding + (selected index * option height)
    const triggerRect = trigger.getBoundingClientRect();
    const optionHeight = /** @type {HTMLElement} */ (selectedOption).offsetHeight;
    const listboxHeight = /** @type {HTMLElement} */ (listbox).offsetHeight;
    const listboxPadding = 4; // approximate --space-1
    const layerPadding = 4; // padding-block on layer
    const viewportPadding = 8; // keep some space from viewport edges

    let offset = -(triggerRect.height + listboxPadding + layerPadding + (selectedIndex * optionHeight));

    // Calculate where the dropdown would appear with this offset
    const dropdownTop = triggerRect.bottom + offset;
    const dropdownBottom = dropdownTop + listboxHeight + (layerPadding * 2);

    // Clamp to keep in viewport
    if (dropdownTop < viewportPadding) {
      offset += viewportPadding - dropdownTop;
    } else if (dropdownBottom > window.innerHeight - viewportPadding) {
      offset -= dropdownBottom - (window.innerHeight - viewportPadding);
    }

    /** @type {HTMLElement} */ (layer).style.setProperty('--select-offset-y', `${offset}px`);

    // Scroll the selected item into view if needed
    requestAnimationFrame(() => {
      selectedOption.scrollIntoView({ block: 'nearest' });
    });
  }

  /**
   * @param {KeyboardEvent} e
   */
  #onTriggerKeydown(e) {
    if (this.disabled) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.open();
        break;
    }
  }

  /**
   * @param {KeyboardEvent} e
   */
  #onKeydown(e) {
    const options = this.#getVisibleOptions();
    if (options.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.#focusOption(this.#focusedIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.#focusOption(this.#focusedIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        this.#focusOption(0);
        break;
      case 'End':
        e.preventDefault();
        this.#focusOption(options.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.#focusedIndex >= 0 && this.#focusedIndex < options.length) {
          this.#selectOption(options[this.#focusedIndex]);
        }
        break;
      case 'Escape':
        this.close();
        /** @type {HTMLElement | null} */ (this.shadowRoot?.querySelector('[part="trigger"]'))?.focus();
        break;
      case 'Tab':
        this.close();
        break;
      default:
        if (!this.searchable && e.key.length === 1) {
          this.#handleTypeAhead(e.key);
        }
    }
  }

  /**
   * @param {Event} e
   */
  #onSearchInput(e) {
    const input = /** @type {HTMLInputElement} */ (e.target);
    this.#filterOptions(input.value);
  }

  /**
   * @param {string} text
   */
  #filterOptions(text) {
    const options = this.#getOptions();
    const searchLower = text.toLowerCase();

    options.forEach((option) => {
      const label = option.textContent?.toLowerCase() || '';
      const matches = !text || label.includes(searchLower);
      /** @type {HTMLElement} */ (option).style.display = matches ? '' : 'none';
    });

    const visible = this.#getVisibleOptions();
    if (visible.length > 0) {
      this.#focusedIndex = 0;
      this.#focusOption(0);
    }
  }

  /**
   * @param {string} char
   */
  #handleTypeAhead(char) {
    this.#searchBuffer += char.toLowerCase();

    if (this.#searchTimeout) {
      window.clearTimeout(this.#searchTimeout);
    }
    this.#searchTimeout = window.setTimeout(() => {
      this.#searchBuffer = '';
    }, 500);

    const options = this.#getOptions();
    const matchIndex = options.findIndex((opt) => {
      const label = opt.textContent?.toLowerCase() || '';
      return label.startsWith(this.#searchBuffer);
    });

    if (matchIndex >= 0) {
      this.#focusOption(matchIndex);
    }
  }

  /**
   * @param {MouseEvent} e
   */
  #onOptionClick(e) {
    const target = /** @type {HTMLElement} */ (e.target);
    const option = target.closest('brow-option');
    if (option && !option.hasAttribute('disabled')) {
      this.#selectOption(option);
    }
  }

  #getOptions() {
    return [...this.querySelectorAll('brow-option')];
  }

  #getVisibleOptions() {
    return this.#getOptions().filter((opt) => {
      const style = /** @type {HTMLElement} */ (opt).style;
      return style.display !== 'none' && !opt.hasAttribute('disabled');
    });
  }

  /**
   * @param {number} index
   */
  #focusOption(index) {
    const options = this.#getVisibleOptions();
    if (options.length === 0) return;

    if (index < 0) index = options.length - 1;
    if (index >= options.length) index = 0;

    this.#getOptions().forEach((opt) => {
      opt.removeAttribute('data-focused');
    });
    options[index]?.setAttribute('data-focused', '');
    options[index]?.scrollIntoView({ block: 'nearest' });

    this.#focusedIndex = index;
  }

  /**
   * @param {Element} option
   */
  #selectOption(option) {
    const value = option.getAttribute('value') || '';
    const oldValue = this.value;

    this.value = value;

    if (value !== oldValue) {
      const event = new CustomEvent('change', {
        bubbles: true,
        detail: { value },
      });
      this.dispatchEvent(event);
    }

    this.close();
    /** @type {HTMLElement | null} */ (this.shadowRoot?.querySelector('[part="trigger"]'))?.focus();
  }

  #updateDisplayValue() {
    const display = this.shadowRoot?.querySelector('.display-value');
    if (!display) return;

    const selectedOption = this.querySelector(`brow-option[value="${this.value}"]`);
    if (selectedOption) {
      display.textContent = selectedOption.textContent || '';
      display.classList.remove('placeholder');
    } else {
      display.textContent = this.placeholder;
      display.classList.add('placeholder');
    }
  }

  #updateOptionSelection() {
    const options = this.#getOptions();
    options.forEach((opt) => {
      if (opt.getAttribute('value') === this.value) {
        opt.setAttribute('selected', '');
      } else {
        opt.removeAttribute('selected');
      }
    });
  }

  #updateHiddenInput() {
    const hidden = this.shadowRoot?.querySelector('input[type="hidden"]');
    if (hidden instanceof HTMLInputElement) {
      hidden.value = this.value || '';
      if (this.name) {
        hidden.name = this.name;
      }
    }
  }

  #updateDisabledState() {
    const trigger = this.shadowRoot?.querySelector('[part="trigger"]');
    if (trigger instanceof HTMLButtonElement) {
      trigger.disabled = this.disabled;
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
      <button
        part="trigger"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-controls="${this.#listboxId}"
        popovertarget="${this.#listboxId}"
        ${this.disabled ? 'disabled' : ''}
      >
        <span class="display-value placeholder">${this.placeholder}</span>
        <span class="chevron">&#9662;</span>
      </button>
      <div part="layer" id="${this.#listboxId}" popover="auto">
        <div
          part="listbox"
          role="listbox"
          tabindex="-1"
        >
          ${
            this.searchable
              ? `
            <div class="search-wrapper">
              <input type="text" class="search-input" placeholder="Search..." autocomplete="off">
            </div>
          `
              : ''
          }
          <slot></slot>
        </div>
      </div>
      <input type="hidden" name="${this.name || ''}" value="${this.value || ''}">
    `;
  }
}

Brownie.register('brow-select', BrownieSelect);
