/**
 * Brownie Core
 * Central registry and initialization for Brownie components.
 */

class BrownieCore {
  /** @type {Map<string, typeof HTMLElement>} */
  #components = new Map();

  /** @type {Set<string>} */
  #pendingComponents = new Set();

  /** @type {CSSStyleSheet[]} */
  #themes = [];

  /** @type {() => void} */
  #resolveReady = () => {};

  /** @type {Promise<void>} */
  #readyPromise = new Promise((resolve) => {
    this.#resolveReady = resolve;
  });

  /**
   * Register a component with Brownie.
   * @param {string} tagName - The custom element tag name
   * @param {typeof HTMLElement} componentClass - The component class
   */
  register(tagName, componentClass) {
    if (this.#components.has(tagName)) {
      console.warn(`[Brownie] Component "${tagName}" is already registered.`);
      return;
    }

    this.#components.set(tagName, componentClass);
    this.#pendingComponents.delete(tagName);

    if (!customElements.get(tagName)) {
      customElements.define(tagName, componentClass);
    }

    this.#checkReady();
  }

  /**
   * Declare components that will be registered.
   * Used to track when all expected components are ready.
   * @param {string[]} tagNames - Array of tag names to expect
   */
  expect(tagNames) {
    for (const name of tagNames) {
      if (!this.#components.has(name)) {
        this.#pendingComponents.add(name);
      }
    }
  }

  /**
   * Wait for all expected components to be registered.
   * @returns {Promise<void>}
   */
  ready() {
    this.#checkReady();
    return this.#readyPromise;
  }

  /**
   * Check if a component is registered.
   * @param {string} tagName - The custom element tag name
   * @returns {boolean}
   */
  has(tagName) {
    return this.#components.has(tagName);
  }

  /**
   * Get all registered component names.
   * @returns {string[]}
   */
  get componentNames() {
    return Array.from(this.#components.keys());
  }

  /**
   * Get current themes.
   * @returns {CSSStyleSheet[]}
   */
  get themes() {
    return [...this.#themes];
  }

  /**
   * Inject a theme stylesheet into all registered components.
   * @param {CSSStyleSheet} stylesheet - The stylesheet to inject
   */
  injectTheme(stylesheet) {
    this.#themes.push(stylesheet);
    this.#applyThemesToAll();
  }

  /**
   * Remove a theme stylesheet from all components.
   * @param {CSSStyleSheet} stylesheet - The stylesheet to remove
   */
  removeTheme(stylesheet) {
    const index = this.#themes.indexOf(stylesheet);
    if (index > -1) {
      this.#themes.splice(index, 1);
      this.#applyThemesToAll();
    }
  }

  /**
   * Clear all injected themes.
   */
  clearThemes() {
    this.#themes = [];
    this.#applyThemesToAll();
  }

  #applyThemesToAll() {
    for (const tagName of this.#components.keys()) {
      const elements = document.querySelectorAll(tagName);
      for (const el of elements) {
        if (el.shadowRoot) {
          this.#applyThemes(el.shadowRoot);
        }
      }
    }
  }

  /**
   * Apply current themes to a shadow root.
   * Called by components during connectedCallback.
   * @param {ShadowRoot} shadowRoot
   */
  applyThemes(shadowRoot) {
    this.#applyThemes(shadowRoot);
  }

  /**
   * @param {ShadowRoot} shadowRoot
   */
  #applyThemes(shadowRoot) {
    // Get existing adopted sheets that aren't our themes
    const existing = shadowRoot.adoptedStyleSheets.filter(
      (s) => !this.#themes.includes(s)
    );
    shadowRoot.adoptedStyleSheets = [...existing, ...this.#themes];
  }

  #checkReady() {
    if (this.#pendingComponents.size === 0) {
      document.documentElement.classList.add('brownie-ready');
      this.#resolveReady();
    }
  }
}

/** @type {BrownieCore} */
const Brownie = new BrownieCore();

export { Brownie };
export default Brownie;
