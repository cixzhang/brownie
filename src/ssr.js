/**
 * Brownie SSR — Server-side rendering with Declarative Shadow DOM.
 *
 * Runs Brownie component code in Node.js without a browser by providing
 * minimal polyfills for DOM APIs (CSSStyleSheet, HTMLElement, customElements).
 * Components render their shadow DOM using their real render() methods —
 * no duplicated render logic, no CSS extraction hacks.
 *
 * Usage:
 *   import { createSSR } from 'brownie/ssr';
 *   const ssr = await createSSR();
 *   const html = ssr.dsd('brow-button', { variant: 'primary' }, 'Click me');
 *
 * The dsd() output wraps the component's shadow DOM in a
 * <template shadowrootmode="open"> for Declarative Shadow DOM.
 * The browser creates shadow roots during HTML parsing — before JS loads.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Polyfills ─────────────────────────────────────────────────────
// Minimal mocks that let component modules load and render in Node.
// Only applied if the real APIs don't exist (i.e., not in a browser).

function setupPolyfills() {
  if (typeof globalThis.CSSStyleSheet === 'undefined') {
    /** Stores CSS from replaceSync() for server-side extraction. */
    class MockCSSStyleSheet {
      #css = '';
      replaceSync(css) { this.#css = css; }
      get cssText() { return this.#css; }
    }
    globalThis.CSSStyleSheet = MockCSSStyleSheet;
  }

  if (typeof globalThis.customElements === 'undefined') {
    globalThis.customElements = { define: () => {}, get: () => undefined };
  }

  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
      documentElement: { classList: { add: () => {}, remove: () => {} } },
      querySelectorAll: () => [],
      querySelector: () => null,
    };
  }

  if (typeof globalThis.HTMLElement === 'undefined') {
    /**
     * Minimal HTMLElement mock. Supports attribute access, attachShadow,
     * and querySelector/querySelectorAll (returning null/empty) — enough
     * for component constructors and connectedCallback to run and produce
     * shadowRoot.innerHTML.
     */
    globalThis.HTMLElement = class MockHTMLElement {
      #attrs = new Map();
      #shadowRoot = null;

      attachShadow() {
        this.#shadowRoot = {
          innerHTML: '',
          adoptedStyleSheets: [],
          querySelector: () => null,
          querySelectorAll: () => [],
        };
        return this.#shadowRoot;
      }

      get shadowRoot() { return this.#shadowRoot; }
      getAttribute(name) { return this.#attrs.has(name) ? this.#attrs.get(name) : null; }
      hasAttribute(name) { return this.#attrs.has(name); }
      setAttribute(name, value) { this.#attrs.set(name, String(value)); }
      removeAttribute(name) { this.#attrs.delete(name); }
      querySelector() { return null; }
      querySelectorAll() { return []; }
      get isConnected() { return true; }
    };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attrsToString(attrs) {
  return Object.entries(attrs)
    .map(([k, v]) => (v === '' || v === undefined ? k : `${k}="${escapeHtml(String(v))}"`))
    .join(' ');
}

// ─── SSR instance ──────────────────────────────────────────────────

let instance = null;

/**
 * Create an SSR instance. Imports all Brownie component modules with
 * DOM polyfills in place, so their real render() methods are available.
 * Returns a singleton — safe to call multiple times.
 *
 * @returns {Promise<{dsd: Function, css: Function, shadow: Function, pageStyles: Function}>}
 */
export async function createSSR() {
  if (instance) return instance;

  setupPolyfills();

  // Import core first — creates the Brownie singleton
  const { default: Brownie } = await import('./core.js');

  // Intercept register() to build a tag-name → class map.
  // This lets us instantiate components by tag name without modifying core.
  const registry = new Map();
  const originalRegister = Brownie.register.bind(Brownie);
  Brownie.register = function (tagName, componentClass) {
    registry.set(tagName, componentClass);
    return originalRegister(tagName, componentClass);
  };

  // Import all component modules — they call Brownie.register() on load.
  // Dynamic import ensures polyfills are in place before evaluation.
  await Promise.all([
    import('./components/brow-button.js'),
    import('./components/brow-card.js'),
    import('./components/brow-layout.js'),
    import('./components/brow-section.js'),
    import('./components/brow-select.js'),
    import('./components/brow-option.js'),
    import('./components/brow-menu.js'),
    import('./components/brow-menu-item.js'),
    import('./components/brow-tooltip.js'),
    import('./components/brow-hovercard.js'),
    import('./components/brow-table.js'),
    import('./components/brow-table-header.js'),
    import('./components/brow-table-row.js'),
    import('./components/brow-table-column.js'),
    import('./components/brow-table-footer.js'),
    import('./components/brow-table-empty.js'),
    import('./components/brow-table-sort.js'),
    import('./components/brow-table-select.js'),
    import('./components/brow-table-paginate.js'),
    import('./components/brow-table-tree.js'),
  ]);

  /**
   * Instantiate a component, set attributes, run connectedCallback,
   * and return the element with its shadow DOM populated.
   */
  function instantiate(tagName, attrs) {
    const ComponentClass = registry.get(tagName);
    if (!ComponentClass) {
      throw new Error(`[Brownie SSR] Unknown component: ${tagName}. Is it registered?`);
    }

    const el = new ComponentClass();

    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }

    // connectedCallback calls render(), which sets shadowRoot.innerHTML.
    // Other calls (bindEvents, updateDisplayValue, etc.) are no-ops on
    // the mock — querySelector returns null, querySelectorAll returns [].
    if (el.connectedCallback) {
      el.connectedCallback();
    }

    return el;
  }

  /**
   * Render a component with Declarative Shadow DOM.
   *
   * @param {string} tagName - Custom element tag name (e.g. 'brow-button')
   * @param {Record<string, string>} attrs - HTML attributes
   * @param {string} [lightHtml=''] - Light DOM content (children)
   * @returns {string} HTML with <template shadowrootmode="open">
   */
  function dsd(tagName, attrs = {}, lightHtml = '') {
    const el = instantiate(tagName, attrs);

    // Shared CSS from the component's static CSSStyleSheet
    const sharedCss = el.constructor.styles?.cssText || '';

    // Shadow DOM innerHTML from the component's real render() method
    const shadowHtml = el.shadowRoot?.innerHTML || '';

    const attrStr = attrsToString(attrs);

    return `<${tagName}${attrStr ? ' ' + attrStr : ''}><template shadowrootmode="open">${sharedCss ? `<style>${sharedCss}</style>` : ''}${shadowHtml}</template>${lightHtml}</${tagName}>`;
  }

  /**
   * Get just the CSS for a component (from its static stylesheet).
   * @param {string} tagName
   * @returns {string}
   */
  function css(tagName) {
    const ComponentClass = registry.get(tagName);
    if (!ComponentClass) {
      throw new Error(`[Brownie SSR] Unknown component: ${tagName}`);
    }
    return ComponentClass.styles?.cssText || '';
  }

  /**
   * Get just the shadow DOM innerHTML for a component (no CSS, no DSD wrapper).
   * @param {string} tagName
   * @param {Record<string, string>} attrs
   * @returns {string}
   */
  function shadow(tagName, attrs = {}) {
    const el = instantiate(tagName, attrs);
    return el.shadowRoot?.innerHTML || '';
  }

  /**
   * Read base.css and theme.css for page-level styling.
   * @returns {{base: string, theme: string}}
   */
  function pageStyles() {
    return {
      base: readFileSync(join(__dirname, 'base.css'), 'utf-8'),
      theme: readFileSync(join(__dirname, 'theme.css'), 'utf-8'),
    };
  }

  instance = { dsd, css, shadow, pageStyles, registry };
  return instance;
}
