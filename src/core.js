/**
 * Brownie Core
 * Central registry and initialization for Brownie components.
 */

class BrownieCore {
  /** @type {Map<string, typeof HTMLElement>} */
  #components = new Map();

  /** @type {Set<string>} */
  #pendingComponents = new Set();

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
