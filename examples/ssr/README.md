# Brownie SSR with Declarative Shadow DOM

Server-render Brownie web components with their shadow DOM included inline in the
HTML, eliminating the flash of unstyled content (FOUC) that occurs when web
components attach their shadow roots client-side.

## How it works

### The problem

Brownie components call `attachShadow({ mode: 'open' })` in their constructors, then
populate the shadow root in `connectedCallback`. Between HTML parsing and JS module
loading, components are unstyled or invisible — a FOUC.

### The solution: DSD + real component code on the server

**Declarative Shadow DOM (DSD)** lets the server include shadow DOM content directly
in the HTML via `<template shadowrootmode="open">`. The browser's HTML parser creates
shadow roots during parsing — before any JavaScript runs.

Brownie's SSR module (`src/ssr.js`) runs the **actual component code** on the server
using minimal DOM polyfills (CSSStyleSheet, HTMLElement, customElements). Components
render their shadow DOM using their real `render()` methods — no duplicated render
logic, no CSS extraction hacks.

### Usage from any Node.js server

```js
import { createSSR } from 'brownie/ssr';

const ssr = await createSSR();

// Render a component with DSD — returns HTML string
const html = ssr.dsd('brow-button', { variant: 'primary' }, 'Click me');
// → <brow-button variant="primary"><template shadowrootmode="open">...</template>Click me</brow-button>

// Get just the CSS for a component
const css = ssr.css('brow-button');

// Get just the shadow DOM innerHTML (no DSD wrapper)
const shadow = ssr.shadow('brow-card', { padding: 'space-4' });

// Get base.css and theme.css for page-level styling
const { base, theme } = ssr.pageStyles();
```

### File structure

```
src/
├── ssr.js              # SSR module — runs real component code with DOM polyfills
├── core.js             # Brownie core (shared between browser and server)
├── components/          # Component source (shared between browser and server)
├── base.css            # Base styles
└── theme.css           # Theme CSS variables

examples/ssr/
├── server.js           # Example Node HTTP server using brownie/ssr
├── public/
│   └── hydrate.js      # Client patch: makes attachShadow() DSD-aware
└── README.md
```

### src/ssr.js

The SSR module provides:

- **`createSSR()`** — async singleton initializer. Sets up DOM polyfills, imports all
  component modules, returns an SSR instance.
- **`dsd(tagName, attrs, lightHtml)`** — renders a component with DSD. Instantiates the
  real component class, sets attributes, calls `connectedCallback()` (which calls
  `render()`), and wraps the shadow DOM in `<template shadowrootmode="open">`.
- **`css(tagName)`** — extracts the CSS from a component's static CSSStyleSheet.
- **`shadow(tagName, attrs)`** — returns just the shadow DOM innerHTML.
- **`pageStyles()`** — returns `{ base, theme }` CSS strings.

The DOM polyfills are minimal: `CSSStyleSheet` stores CSS from `replaceSync()`,
`HTMLElement` supports attribute access and `attachShadow()`, `customElements.define`
is a no-op. This is enough for component constructors and `connectedCallback` to run
and produce `shadowRoot.innerHTML`.

### public/hydrate.js

A tiny script loaded before component modules. Patches
`HTMLElement.prototype.attachShadow` to return the existing DSD shadow root when one
already exists, instead of throwing. In Chrome 124+ this is built-in; the patch is a
safety net for broader compatibility.

### What changed from the old approach

Previously, `render.js` in the example duplicated each component's render logic and
extracted CSS via regex from source files. Now, `src/ssr.js` runs the real component
code — if a component's `render()` method changes, the SSR output updates automatically.
No maintenance burden, no drift.

## Running the example

```bash
node examples/ssr/server.js
```

Open http://localhost:3000

- View source to see `<template shadowrootmode="open">` blocks in the HTML
- Disable JavaScript and reload — the page still renders (DSD is parser-level)
- Click "Get Started" to fetch a server-rendered DSD fragment
- Use the theme select to swap CSS variables (cascades through shadow DOM)

## References

- [Declarative Shadow DOM — web.dev](https://web.dev/articles/declarative-shadow-dom)
- Browser support: Chrome 111+, Edge 111+, Firefox 123+, Safari 16.4+
