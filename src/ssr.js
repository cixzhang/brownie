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
 *
 *   const ssr = await createSSR();
 *
 *   // Import the components you need — they self-register
 *   await import('brownie/components/brow-button.js');
 *   await import('brownie/components/brow-card.js');
 *
 *   // Render a component with DSD
 *   const html = ssr.dsd('brow-button', { variant: 'primary' }, 'Click me');
 *
 *   // Render a complete page (auto-generates imports, hydrate, expect/ready)
 *   const page = ssr.page({
 *     title: 'My App',
 *     body: html,
 *     onReady: 'console.log("hydrated");',
 *   });
 *
 * The server imports only the components it needs. createSSR() intercepts
 * Brownie.register() to build a tag-name → class map. dsd() uses that map
 * to instantiate components and render their shadow DOM.
 *
 * page() scans the body HTML for <brow-*> tags and auto-generates:
 *   - Client-side import statements for each used component
 *   - Brownie.expect() call with all used tag names
 *   - Brownie.ready() callback with your onReady code
 *   - Inlined hydrate.js patch (no extra HTTP request)
 *   - Base CSS and theme CSS
 *
 * This scales to hundreds of components — only imported components are in
 * the registry, and page() only generates imports for components actually
 * present in the body HTML.
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
 * Create an SSR instance. Sets up DOM polyfills and intercepts
 * Brownie.register() to build a tag-name → class map.
 *
 * Does NOT import any components — the server imports the components
 * it needs after this call. Components self-register via Brownie.register().
 *
 * @returns {Promise<{dsd: Function, css: Function, shadow: Function, pageStyles: Function, page: Function, registry: Map}>}
 */
export async function createSSR() {
  if (instance) return instance;

  setupPolyfills();

  // Import core first — creates the Brownie singleton
  const { default: Brownie } = await import('./core.js');

  // Intercept register() to build bidirectional maps:
  //   tag → class (for dsd('brow-button', ...))
  //   class → tag (for dsd(Button, ...))
  const registry = new Map();       // tag → class
  const classRegistry = new Map();  // class → tag
  const originalRegister = Brownie.register.bind(Brownie);
  Brownie.register = function (tagName, componentClass) {
    registry.set(tagName, componentClass);
    classRegistry.set(componentClass, tagName);
    return originalRegister(tagName, componentClass);
  };

  // Read hydrate script once at init (for inlining in page())
  const hydrateScript = readFileSync(join(__dirname, 'hydrate.js'), 'utf-8');

  /**
   * Instantiate a component, set attributes, run connectedCallback,
   * and return the element with its shadow DOM populated.
   *
   * @param {string|Function} tagOrClass - Tag name ('brow-button') or class reference (BrownieButton)
   * @param {Record<string, string>} attrs
   * @returns {{shadowRoot: {innerHTML: string}, constructor: {styles?: {cssText: string}}}}
   */
  function instantiate(tagOrClass, attrs) {
    let tagName, ComponentClass;

    if (typeof tagOrClass === 'string') {
      tagName = tagOrClass;
      ComponentClass = registry.get(tagName);
      if (!ComponentClass) {
        throw new Error(
          `[Brownie SSR] Unknown component: ${tagName}.\n` +
          `Make sure you've imported the component module after createSSR().\n` +
          `Registered: ${[...registry.keys()].join(', ') || '(none)'}`
        );
      }
    } else if (typeof tagOrClass === 'function') {
      ComponentClass = tagOrClass;
      tagName = classRegistry.get(ComponentClass);
      if (!tagName) {
        throw new Error(
          `[Brownie SSR] Component class not registered.\n` +
          `Make sure you've imported the component module after createSSR().\n` +
          `Registered: ${[...registry.keys()].join(', ') || '(none)'}`
        );
      }
    } else {
      throw new Error(`[Brownie SSR] Expected tag name string or component class, got: ${typeof tagOrClass}`);
    }

    const el = new ComponentClass();

    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }

    // connectedCallback calls render(), which sets shadowRoot.innerHTML.
    if (el.connectedCallback) {
      el.connectedCallback();
    }

    return el;
  }

  /**
   * Resolve a tag name from a string or class reference.
   * @param {string|Function} tagOrClass
   * @returns {string}
   */
  function resolveTagName(tagOrClass) {
    if (typeof tagOrClass === 'string') return tagOrClass;
    const tagName = classRegistry.get(tagOrClass);
    if (!tagName) {
      throw new Error(
        `[Brownie SSR] Component class not registered.\n` +
        `Make sure you've imported the component module after createSSR().\n` +
        `Registered: ${[...registry.keys()].join(', ') || '(none)'}`
      );
    }
    return tagName;
  }

  /**
   * Render a component with Declarative Shadow DOM.
   *
   * @param {string|Function} tagOrClass - Tag name ('brow-button') or class reference (BrownieButton)
   * @param {Record<string, string>} attrs - HTML attributes
   * @param {string} [lightHtml=''] - Light DOM content (children)
   * @returns {string} HTML with <template shadowrootmode="open">
   */
  function dsd(tagOrClass, attrs = {}, lightHtml = '') {
    const el = instantiate(tagOrClass, attrs);
    const tagName = resolveTagName(tagOrClass);

    // Shared CSS from the component's static CSSStyleSheet
    const sharedCss = el.constructor.styles?.cssText || '';

    // Shadow DOM innerHTML from the component's real render() method
    const shadowHtml = el.shadowRoot?.innerHTML || '';

    const attrStr = attrsToString(attrs);

    return `<${tagName}${attrStr ? ' ' + attrStr : ''}><template shadowrootmode="open">${sharedCss ? `<style>${sharedCss}</style>` : ''}${shadowHtml}</template>${lightHtml}</${tagName}>`;
  }

  /**
   * Get just the CSS for a component (from its static stylesheet).
   * @param {string|Function} tagOrClass
   * @returns {string}
   */
  function css(tagOrClass) {
    const ComponentClass = typeof tagOrClass === 'string'
      ? registry.get(tagOrClass)
      : tagOrClass;
    if (!ComponentClass || !classRegistry.has(ComponentClass)) {
      throw new Error(`[Brownie SSR] Unknown component: ${tagOrClass}`);
    }
    return ComponentClass.styles?.cssText || '';
  }

  /**
   * Get just the shadow DOM innerHTML for a component (no CSS, no DSD wrapper).
   * @param {string|Function} tagOrClass
   * @param {Record<string, string>} attrs
   * @returns {string}
   */
  function shadow(tagOrClass, attrs = {}) {
    const el = instantiate(tagOrClass, attrs);
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

  const styles = pageStyles();

  /**
   * Generate a complete HTML document with DSD content, hydrate script,
   * component imports, and Brownie.expect/ready wiring.
   *
   * Scans body HTML for <brow-*> tags and auto-generates client-side
   * import statements for each registered component found. Only components
   * in the SSR registry are included — unregistered tags are ignored.
   *
   * @param {Object} options
   * @param {string} [options.title='Brownie'] - <title> text
   * @param {string} [options.body=''] - HTML content for <body>
   * @param {string} [options.brownieBase='/src'] - Base URL for Brownie client imports
   * @param {string[]} [options.extraComponents=[]] - Additional tag names to import (not found in body scan)
   * @param {string} [options.head=''] - Extra <head> content (scripts, meta tags, etc.)
   * @param {string} [options.onReady=''] - JS code to run inside Brownie.ready().then(() => { ... })
   * @returns {string} Complete HTML document
   */
  function page(options = {}) {
    const {
      title = 'Brownie',
      body = '',
      brownieBase = '/src',
      extraComponents = [],
      head = '',
      onReady = '',
    } = options;

    // Scan body for <brow-*> tags — only include registered components
    const used = new Set();
    const tagRegex = /<brow-[a-z][\w-]*/g;
    let match;
    while ((match = tagRegex.exec(body)) !== null) {
      const tag = match[0].slice(1); // remove leading <
      if (registry.has(tag)) {
        used.add(tag);
      }
    }
    // Merge with explicitly declared extra components (for htmx fragments, etc.)
    for (const tag of extraComponents) {
      if (registry.has(tag)) {
        used.add(tag);
      }
    }

    const tags = [...used].sort();
    const importLines = tags
      .map((t) => `    import '${brownieBase}/components/${t}.js';`)
      .join('\n');
    const expectList = tags.map((t) => `'${t}'`).join(', ');
    const readyBody = onReady ? `\n      ${onReady}` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${styles.base}</style>
  <style>${styles.theme}</style>
  <script>${hydrateScript}</script>
  ${head}
</head>
<body>
  ${body}
  <script type="module">
    import Brownie from '${brownieBase}/core.js';
${importLines}
    Brownie.expect([${expectList}]);
    Brownie.ready().then(() => {${readyBody}
    });
  </script>
</body>
</html>`;
  }

  instance = { dsd, css, shadow, pageStyles, page, registry };
  return instance;
}
