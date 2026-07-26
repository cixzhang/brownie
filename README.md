# Brownie

**A VanillaJS UI kit for the modern web**

Brownie is a native web component system for generating polished interfaces in pure HTML/JS/CSS. No dependencies. No build. No packaging. No libraries. Built to be close to the metal and easy to generate from data on your backend or from AI workflows.

Like the helpful household spirits of folklore, Brownie components work quietly in the background — small, unobtrusive, and reliable.

**NOTE:** Brownie is highly experimental and I'm still playing around with it. It is possible to pull a specific
version and just have it copied and stored if something stable is necessary. Before using this library, please carefully
read the Browser Support section.

---

## Why Brownie?

Most UI libraries are built for JavaScript-first, framework-heavy environments. They assume you'll set properties imperatively, manage state in JS, and treat the DOM as an output target rather than a source of truth.

Brownie takes a different approach:

- **Markup-first** — configure components through HTML attributes and child elements
- **Data lives in the DOM** — inspect your UI and see your data, not an empty shell waiting for JS
- **Backend and AI friendly** — generate complete, working interfaces from any language or LLM
- **Zero build step** — drop in a script tag and go

Brownie is built using purely native HTML/CSS/JS and requires no extra packages to function.
It tries to achieve a DOM that can be fully observed to provide dense information
about your application and allow machines to understand everything from structure,
data, appearance, semantics, and capabilities just from reading the DOM and HTML files.

- **Declarative configuration** — no imperative JS required for most UIs
- **Minimal template syntax** — just `{{property}}` bindings and optional formatters
- **Attribute-driven** — all state is visible in the markup
- **Predictable output** — same inputs always produce the same DOM

---

## Core Principles

### Data in the DOM

We lean into HTML's natural model of keeping data in the DOM. This makes it easy to:

- **Generate HTML from data** — your backend or AI outputs markup, not JS
- **Inspect state** — open devtools and see exactly what data exists
- **Understand semantics** — the HTML tells you what's there

```html
<!-- The data is right here, not hidden in JS state -->
<brow-table>
  <brow-table-header name="Name" role="Role" status="Status"/>
  <brow-table-row name="Alice" role="Admin" status="active"/>
  <brow-table-row name="Bob" role="Editor" status="pending"/>
</brow-table>
```

### Full Theming

Brownie components can be fully themed using pure CSS. No special syntax,
no token APIs — just the CSS you already know. Web components have style encapsulation
so Brownie components can also expose a public API for themes using `::part()`.

To create a new theme, start with cloning one of the example themes then modify as
needed. Refer to component documentation for style-able parts.

* [base.css](https://github.com/cixzhang/brownie/blob/main/src/base.css): Minimal base theme
* [brownie.css](https://github.com/cixzhang/brownie/blob/main/docs/brownie.css): Brownie documentation theme with 3D buttons
* [technical.css](https://github.com/cixzhang/brownie/blob/main/docs/technical.css): Serious technical theme with monospace fonts
* [vibes.css](https://github.com/cixzhang/brownie/blob/main/docs/vibes.css): Fun vibes theme with rainbow gradients

Themes use CSS `light-dark` to set colors that switch between light and dark mode.
The theme control is handled by `base.css` by applying `color-scheme` to `:root`.
Brownie sets `color-scheme: light dark` to enable OS preference for light and dark modes,
then the `data-theme` attribute on the `<html>` can be used to control for specific modes.

```html
<!-- Use OS preference by default -->
<html>

<!-- Explicitly set dark theme -->
<html data-theme="dark">

<!-- Explicitly set light theme -->
<html data-theme="light">
```

### Progressive Complexity

Simple things stay simple. Complex things are possible.

```html
<!-- Zero config: columns inferred from first row -->
<brow-table>
  <brow-table-row name="Alice" age="34"/>
  <brow-table-row name="Bob" age="28"/>
</brow-table>

<!-- Add a header for explicit column control -->
<brow-table>
  <brow-table-header name="Name" age="Age" status="Status"/>
  <brow-table-row name="Alice" age="34" status="active"/>
  <brow-table-row name="Bob" status="pending"/>  <!-- sparse rows are fine -->
</brow-table>

<!-- Add column elements only where you need custom rendering -->
<brow-table>
  <brow-table-header name="Name" status="Status"/>
  
  <brow-table-column field="status">
    <brow-badge variant="{{statusColor}}">{{status}}</brow-badge>
  </brow-table-column>
  
  <brow-table-row name="Alice" status="active" statusColor="success"/>
</brow-table>
```

---

## Installation

```bash
npm install @cixzhang/brownie
```

Or use directly in HTML without a package manager — Brownie is zero-build, so you can import from a CDN or serve the files yourself:

```html
<link rel="stylesheet" href="/src/base.css">
<link rel="stylesheet" href="/src/theme.css">
<script type="module">
  import Brownie from '/src/core.js';
  import '/src/components/brow-button.js';
  import '/src/components/brow-card.js';
  Brownie.expect(['brow-button', 'brow-card']);
  Brownie.ready().then(() => {
    // components hydrated
  });
</script>
```

---

## Getting Started

### Client-Side

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Base reset and functional styles for Brownie -->
  <link rel="stylesheet" href="/src/base.css">
  <!-- Base theme - replace this with your custom theme! -->
  <link rel="stylesheet" href="/src/theme.css">
  <!-- Brownie core + components -->
  <script type="module">
    import Brownie from '/src/core.js';
    import '/src/components/brow-button.js';
    import '/src/components/brow-card.js';
    Brownie.expect(['brow-button', 'brow-card']);
    Brownie.ready().then(() => {
      // components hydrated
    });
  </script>
</head>
<body>
  <brow-card>
    <h2>Welcome</h2>
    <p>Your first Brownie interface.</p>
    <brow-button variant="primary">Get Started</brow-button>
  </brow-card>
</body>
</html>
```

### Server-Side Rendering (SSR)

Brownie includes a built-in SSR module that renders components on the server using Declarative Shadow DOM (DSD). The browser creates shadow roots during HTML parsing — before any JS loads — so there's no flash of unstyled content (FOUC).

The SSR module runs the actual component code in Node.js using minimal DOM polyfills. Components execute their real `render()` methods — no duplicated render logic.

```js
import { createSSR } from '@cixzhang/brownie/ssr';

// 1. Create SSR instance (sets up DOM polyfills, intercepts registration)
const ssr = await createSSR();

// 2. Import components — they self-register with Brownie
const Button = (await import('@cixzhang/brownie/components/brow-button.js')).default;
const Card = (await import('@cixzhang/brownie/components/brow-card.js')).default;

// 3. Render components with DSD
const buttonHtml = ssr.dsd(Button, { variant: 'primary' }, 'Click me');
const cardHtml = ssr.dsd(Card, { padding: 'space-6' }, buttonHtml);

// 4. Generate a complete HTML page
//    page() auto-generates everything:
//      - Inlined hydrate script (DSD-aware attachShadow patch)
//      - Base CSS + theme CSS (inlined)
//      - Client import statements (by scanning body for <brow-*> tags)
//      - Brownie.expect() + Brownie.ready() wiring
const html = ssr.page({
  title: 'My App',
  body: cardHtml,
  onReady: `console.log('hydrated');`,
});
```

You can also use class references or tag strings interchangeably:

```js
ssr.dsd(Button, { variant: 'primary' }, 'Click me');    // class reference
ssr.dsd('brow-button', { variant: 'primary' }, 'Click me'); // tag string
```

**How it works:**

1. `createSSR()` polyfills `CSSStyleSheet`, `HTMLElement`, `customElements` in Node
2. Component modules are imported — they call `Brownie.register()` which builds the registry
3. `dsd()` instantiates the component, sets attributes, calls `connectedCallback()`
4. The real `render()` method produces shadow DOM HTML
5. Output wraps shadow DOM in `<template shadowrootmode="open">` with CSS inline
6. Browser parses the DSD template, creating the shadow root before JS loads
7. When component modules load client-side, `attachShadow()` returns the existing DSD root
8. `connectedCallback()` calls `render()` — same content, no flicker

The hydrate patch is inlined automatically by `page()`. For manual use, it's available at `@cixzhang/brownie/ssr/hydrate` — load it as a regular script before component modules.

See the [SSR example](examples/ssr) and [htmx + SSR example](examples/htmx) for working servers.

## Local Development

Brownie has no build step, so any static file server with live reload works.

**VS Code**

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, then right-click your HTML file and select "Open with Live Server".

**Command line**

```bash
# Using npx (no install required)
npx live-server

# Or browser-sync for more options
npx browser-sync start --server --files "**/*.html, **/*.css, **/*.js"
```

**Python**

```bash
pip install livereload
livereload .
```

---

## Browser Support

Brownie is experimental and leverages the latest browser technologies to achieve a zero build, zero
library core. The basis for it's functionality is Shadow DOM. It also relies on other newer browser
features to avoid pulling in specialized libraries. Brownie will likely stay on the edge of browser
features in order to continue to avoid complex JS and pulling in libraries.

* Shadow DOM is baseline
* `light-dark` is baseline 2024
* CSS Anchor Positioning is baseline 2026

---

## License

MIT

---

*Named for the helpful household spirits of Scottish folklore who quietly do good work while no one is watching.*
