/**
 * Brownie SSR — Server-side rendering with Declarative Shadow DOM.
 *
 * Runs Brownie component code in Node.js without a browser by providing
 * minimal polyfills for DOM APIs (CSSStyleSheet, HTMLElement, customElements).
 * Components render their shadow DOM using their real render() methods —
 * no duplicated render logic, no CSS extraction hacks.
 *
 * Usage:
 *   import { createSSR } from '@cixzhang/brownie/ssr';
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
import { parseHtml, serializeHtml } from './parser.js';

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
     * innerHTML (parsed via the HTML parser), and querySelectorAll
     * (finds descendants matching a CSS selector within innerHTML).
     */
    globalThis.HTMLElement = class MockHTMLElement {
      #attrs = new Map();
      #shadowRoot = null;
      #children = [];  // parsed child nodes from innerHTML

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
      get isConnected() { return true; }

      get innerHTML() {
        // Serialize children back to HTML
        return serializeHtml(this.#children);
      }

      set innerHTML(html) {
        // Parse the HTML string into child nodes
        this.#children = parseHtml(String(html));
      }

      get children() {
        // Return only element nodes
        return this.#children.filter(n => n.type === 'element');
      }

      get childNodes() {
        return this.#children;
      }

      querySelector(selector) {
        const results = this.querySelectorAll(selector);
        return results.length > 0 ? results[0] : null;
      }

      querySelectorAll(selector) {
        return querySelectorAll(this.#children, selector);
      }

      // Minimal firstElementChild / lastElementChild
      get firstElementChild() {
        const els = this.children;
        return els.length > 0 ? wrapElement(els[0]) : null;
      }

      // Minimal textContent
      get textContent() {
        return getTextContent(this.#children);
      }

      set textContent(value) {
        this.#children = [{ type: 'text', content: String(value) }];
      }

      // Minimal classList
      get classList() {
        const classes = (this.#attrs.get('class') || '').split(/\s+/).filter(Boolean);
        return {
          add: (...tokens) => {
            classes.push(...tokens);
            this.#attrs.set('class', [...new Set(classes)].join(' '));
          },
          remove: (...tokens) => {
            for (const t of tokens) {
              const idx = classes.indexOf(t);
              if (idx >= 0) classes.splice(idx, 1);
            }
            this.#attrs.set('class', classes.join(' '));
          },
          contains: (token) => classes.includes(token),
          toggle: (token) => {
            if (classes.includes(token)) {
              classes.splice(classes.indexOf(token), 1);
            } else {
              classes.push(token);
            }
            this.#attrs.set('class', classes.join(' '));
          },
        };
      }

      // Minimal style property
      get style() {
        const self = this;
        return {
          setProperty(prop, value) {
            // Store as inline style attribute
            const current = self.#attrs.get('style') || '';
            const re = new RegExp(`${prop}\\s*:[^;]*;?\\s*`, 'gi');
            const updated = current.replace(re, '');
            self.#attrs.set('style', `${updated}${prop}: ${value};`.trim());
          },
          getPropertyValue(prop) {
            const current = self.#attrs.get('style') || '';
            const m = current.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
            return m ? m[1].trim() : '';
          },
          removeProperty(prop) {
            const current = self.#attrs.get('style') || '';
            const re = new RegExp(`${prop}\\s*:[^;]*;?\\s*`, 'gi');
            self.#attrs.set('style', current.replace(re, '').trim());
          },
        };
      }
    };
  }
}

// ─── Polyfill helpers ──────────────────────────────────────────────

/**
 * Query all descendant elements matching a CSS selector.
 * Supports: tag names, `.class`, `[attr]`, `[attr="value"]`,
 * `:not([attr])`, and compound selectors like `brow-menu-item:not([disabled])`.
 * @param {any[]} nodes - Parsed child nodes
 * @param {string} selector - CSS selector
 * @returns {any[]}
 */
function querySelectorAll(nodes, selector) {
  const results = [];
  walk(nodes, (node) => {
    if (node.type === 'element' && matchesSelector(node, selector)) {
      results.push(wrapElement(node));
    }
  });
  return results;
}

/**
 * Walk all descendant nodes depth-first.
 * @param {any[]} nodes
 * @param {(node: any) => void} fn
 */
function walk(nodes, fn) {
  for (const node of nodes) {
    fn(node);
    if (node.children) walk(node.children, fn);
  }
}

/**
 * Check if a parsed element node matches a CSS selector.
 * @param {any} node
 * @param {string} selector
 * @returns {boolean}
 */
function matchesSelector(node, selector) {
  // Split on commas (OR), each part must match
  const parts = selector.split(',').map(s => s.trim());
  return parts.some(part => matchSingle(node, part));
}

/**
 * Match a single compound selector (no commas, no spaces = no descendant combinator).
 * Supports: `tag`, `.class`, `[attr]`, `[attr="val"]`, `:not([attr])`, `:not(.class)`
 * @param {any} node
 * @param {string} selector
 * @returns {boolean}
 */
function matchSingle(node, selector) {
  // Handle :not() pseudo-class
  const notMatch = selector.match(/:not\(([^)]+)\)/);
  let notSelector = null;
  if (notMatch) {
    notSelector = notMatch[1];
    selector = selector.slice(0, notMatch.index) + selector.slice(notMatch.index + notMatch[0].length);
  }

  // Break selector into simple parts
  const tagMatch = selector.match(/^([a-zA-Z][\w-]*)/);
  const tag = tagMatch ? tagMatch[1].toLowerCase() : null;

  if (tag && node.tag !== tag) return false;

  // Class selectors
  const classes = [...selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m => m[1]);
  const nodeClass = (node.attrs?.class || '').split(/\s+/).filter(Boolean);
  for (const cls of classes) {
    if (!nodeClass.includes(cls)) return false;
  }

  // Attribute selectors
  const attrs = [...selector.matchAll(/\[([a-zA-Z_][\w:-]*)(?:([~|^$*]?=)"([^"]*)")?\]/g)];
  for (const [_, name, op, value] of attrs) {
    const attrVal = node.attrs?.[name];
    if (attrVal === undefined) return false;
    if (op === '=' && attrVal !== value) return false;
    // Existence check (no operator) — just need the attr to be present
  }

  // :not() check
  if (notSelector) {
    if (matchSingle(node, notSelector)) return false;
  }

  return true;
}

/**
 * Wrap a parsed element node with a minimal HTMLElement-like interface
 * so component code can access attributes, hasAttribute, etc.
 * @param {any} node
 * @returns {any}
 */
function wrapElement(node) {
  return {
    tagName: (node.tag || '').toUpperCase(),
    getAttribute(name) {
      return node.attrs?.[name] ?? null;
    },
    hasAttribute(name) {
      return (name in (node.attrs || {}));
    },
    setAttribute(name, value) {
      if (!node.attrs) node.attrs = {};
      node.attrs[name] = String(value);
    },
    removeAttribute(name) {
      if (node.attrs) delete node.attrs[name];
    },
    get id() {
      return node.attrs?.id || '';
    },
    get innerHTML() {
      return serializeHtml(node.children || []);
    },
    set innerHTML(html) {
      node.children = parseHtml(String(html));
    },
    get textContent() {
      return getTextContent(node.children || []);
    },
    get children() {
      return (node.children || []).filter(n => n.type === 'element').map(wrapElement);
    },
    get childNodes() {
      return node.children || [];
    },
    get firstElementChild() {
      const els = (node.children || []).filter(n => n.type === 'element');
      return els.length > 0 ? wrapElement(els[0]) : null;
    },
    querySelector(selector) {
      const results = querySelectorAll(node.children || [], selector);
      return results.length > 0 ? results[0] : null;
    },
    querySelectorAll(selector) {
      return querySelectorAll(node.children || [], selector);
    },
    get classList() {
      const classes = (node.attrs?.class || '').split(/\s+/).filter(Boolean);
      return {
        add: (...tokens) => {
          classes.push(...tokens);
          if (!node.attrs) node.attrs = {};
          node.attrs.class = [...new Set(classes)].join(' ');
        },
        remove: (...tokens) => {
          for (const t of tokens) {
            const idx = classes.indexOf(t);
            if (idx >= 0) classes.splice(idx, 1);
          }
          if (!node.attrs) node.attrs = {};
          node.attrs.class = classes.join(' ');
        },
        contains: (token) => classes.includes(token),
        toggle: (token) => {
          if (classes.includes(token)) {
            classes.splice(classes.indexOf(token), 1);
          } else {
            classes.push(token);
          }
          if (!node.attrs) node.attrs = {};
          node.attrs.class = classes.join(' ');
        },
      };
    },
    get style() {
      if (!node.attrs) node.attrs = {};
      return {
        setProperty(prop, value) {
          const current = node.attrs.style || '';
          const re = new RegExp(`${prop}\\s*:[^;]*;?\\s*`, 'gi');
          node.attrs.style = `${current.replace(re, '')}${prop}: ${value};`.trim();
        },
        getPropertyValue(prop) {
          const m = (node.attrs?.style || '').match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
          return m ? m[1].trim() : '';
        },
        removeProperty(prop) {
          if (node.attrs?.style) {
            const re = new RegExp(`${prop}\\s*:[^;]*;?\\s*`, 'gi');
            node.attrs.style = node.attrs.style.replace(re, '').trim();
          }
        },
      };
    },
    get dataset() {
      const ds = {};
      for (const [key, value] of Object.entries(node.attrs || {})) {
        if (key.startsWith('data-')) {
          const field = key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          ds[field] = value;
        }
      }
      return ds;
    },
    // Node identity for MutationObserver compatibility
    _node: node,
  };
}

/**
 * Extract text content from child nodes recursively.
 * @param {any[]} nodes
 * @returns {string}
 */
function getTextContent(nodes) {
  let text = '';
  for (const node of nodes) {
    if (node.type === 'text') text += node.content;
    else if (node.children) text += getTextContent(node.children);
  }
  return text;
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
  const subToParent = new Map();    // sub-component tag → parent tag
  const originalRegister = Brownie.register.bind(Brownie);
  Brownie.register = function (tagName, componentClass) {
    registry.set(tagName, componentClass);
    classRegistry.set(componentClass, tagName);
    return originalRegister(tagName, componentClass);
  };

  // Read registry.json to build sub-component → parent mapping
  // (for generating correct client import paths in page())
  try {
    const registryJson = JSON.parse(
      readFileSync(join(__dirname, 'registry.json'), 'utf-8')
    );
    for (const comp of registryJson.components) {
      if (comp.docs && comp.docs !== comp.name) {
        subToParent.set(comp.name, comp.docs);
      }
    }
  } catch {
    // registry.json not found — page() will import each tag individually
  }

  // Read hydrate script once at init (for inlining in page())
  // Strip comments to avoid </script> in JSDoc breaking the inline script tag
  const hydrateScript = readFileSync(join(__dirname, 'hydrate.js'), 'utf-8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\n/gm, '')
    .trim();

  /**
   * Instantiate a component, set attributes + children, run connectedCallback,
   * and return the element with its shadow DOM populated.
   *
   * @param {string|Function} tagOrClass - Tag name ('brow-button') or class reference (BrownieButton)
   * @param {Record<string, string>} attrs
   * @param {string} [childrenHtml] - Inner HTML (parsed so querySelectorAll works)
   * @returns {{shadowRoot: {innerHTML: string}, constructor: {styles?: {cssText: string}}}}
   */
  function instantiate(tagOrClass, attrs, childrenHtml) {
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

    // Set children BEFORE connectedCallback so components like brow-table
    // can querySelectorAll their children during render.
    if (childrenHtml) {
      el.innerHTML = childrenHtml;
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
   * Inject DSD templates into a parsed HTML tree (bottom-up).
   * For each <brow-*> node in the registry: instantiate the component
   * with its attributes and children, capture the shadow DOM output,
   * and insert a <template shadowrootmode="open"> as the first child.
   *
   * @param {any[]} nodes
   * @param {Set<string>} used - Collects tag names found
   */
  function injectDsd(nodes, used) {
    for (const node of nodes) {
      // Recurse into children first (bottom-up)
      if (node.children) {
        injectDsd(node.children, used);
      }

      if (node.type !== 'element') continue;
      if (!node.tag || !node.tag.startsWith('brow-')) continue;
      if (!registry.has(node.tag)) continue;

      // Check if DSD template already exists (e.g. from dsd() helper)
      const hasDsd = (node.children || []).some(
        (c) => c.type === 'element' && c.tag === 'template' && c.attrs?.shadowrootmode === 'open'
      );
      if (hasDsd) continue;

      used.add(node.tag);

      // Serialize children to HTML for the component to query
      const childrenHtml = serializeHtml(node.children || []);

      // Instantiate: set attrs, set innerHTML, run connectedCallback
      const attrs = { ...(node.attrs || {}) };
      const el = instantiate(node.tag, attrs, childrenHtml);

      // Get shadow DOM output
      const sharedCss = el.constructor.styles?.cssText || '';
      const shadowHtml = el.shadowRoot?.innerHTML || '';

      // Create DSD template node and insert as first child
      const templateContent = `${sharedCss ? `<style>${sharedCss}</style>` : ''}${shadowHtml}`;
      const templateNode = {
        type: 'raw',
        content: `<template shadowrootmode="open">${templateContent}</template>`,
      };
      node.children = [templateNode, ...(node.children || [])];
    }
  }

  /**
   * Generate a complete HTML document with DSD content, hydrate script,
   * component imports, and Brownie.expect/ready wiring.
   *
   * Parses the body HTML into an AST, injects <template shadowrootmode="open">
   * into each <brow-*> element by running the real component code, then
   * serializes back. This means server-side code can use plain HTML:
   *
   *   <brow-select placeholder="Choose...">
   *     <brow-option value="a">A</brow-option>
   *   </brow-select>
   *
   * And page() handles all the DSD injection automatically.
   *
   * @param {Object} options
   * @param {string} [options.title='Brownie'] - <title> text
   * @param {string} [options.body=''] - HTML content for <body> (plain HTML, no dsd() needed)
   * @param {string} [options.brownieBase='/src'] - Base URL path for Brownie client imports
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

    // Parse body HTML into AST, inject DSD templates, serialize back
    const tree = parseHtml(body);
    const used = new Set();
    injectDsd(tree, used);

    // Merge with explicitly declared extra components (for htmx fragments, etc.)
    for (const tag of extraComponents) {
      if (registry.has(tag)) {
        used.add(tag);
      }
    }

    const transformedBody = serializeHtml(tree);
    const tags = [...used].sort();

    // Determine which tags are sub-components (they live inside a parent folder).
    // We only need to import the parent — sub-components are re-exported from
    // the parent's index.js and self-register on import.
    const importedPaths = new Set();
    for (const tag of tags) {
      const parent = subToParent.get(tag) || tag;
      importedPaths.add(`${brownieBase}/components/${parent}/index.js`);
    }

    const importLines = [...importedPaths]
      .sort()
      .map((p) => `    import '${p}';`)
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
  ${transformedBody}
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
