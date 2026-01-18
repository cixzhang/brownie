# Brownie

**A VanillaJS UI kit for the modern web**

Brownie is a native web component system for generating polished interfaces in pure HTML/JS/CSS. No dependencies. No build. No packaging. No libraries. Built to be close to the metal and easy to generate from data on your backend or from AI workflows.

Like the helpful household spirits of folklore, Brownie components work quietly in the background — small, unobtrusive, and reliable.

---

## Why Brownie?

Most UI libraries are built for JavaScript-first, framework-heavy environments. They assume you'll set properties imperatively, manage state in JS, and treat the DOM as an output target rather than a source of truth.

Brownie takes a different approach:

- **Markup-first** — configure components through HTML attributes and child elements
- **Data lives in the DOM** — inspect your UI and see your data, not an empty shell waiting for JS
- **Backend and AI friendly** — generate complete, working interfaces from any language or LLM
- **Zero build step** — drop in a script tag and go

---

## Core Principles

### Full Theming

Brownie components can be fully themed using pure CSS. A central registry injects stylesheets into each component's shadow DOM, giving you complete control over appearance while maintaining encapsulation.

```javascript
const brownie = new Brownie();
brownie.injectTheme(myTheme);

// All components automatically receive the theme
```

Themes are just CSS files. No special syntax, no token APIs — just the CSS you already know.

We recommend sticking to changing only the CSS variables and component `::part()` to maintain
compatibility in future versions.

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

## Getting Started (TODO)

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Base reset and functional styles for Brownie -->
  <link rel="stylesheet" href="https://cdn.example.com/brownie@1.0.0/brownie-base.css">
  <!-- Base theme - replace this with your custom theme! -->
  <link rel="stylesheet" href="https://cdn.example.com/brownie@1.0.0/brownie-theme.css">
  <!-- Brownie index includes all components and core -->
  <script src="https://cdn.example.com/brownie@1.0.0/brownie.js"></script>
</head>
<body>
  <script>
    // Wait for the ready method to clear for component registration and theme injection
    // before showing the page to avoid the flash of unstyled content.
    await Brownie.ready();
  </script>

  <brow-card>
    <h2>Welcome</h2>
    <p>Your first Brownie interface.</p>
    <brow-button variant="primary">Get Started</brow-button>
  </brow-card>
</body>
</html>
```
---

## Imports and Plugins

After `brownie/core`, import what you need. We use ES6 modules to pull in dependencies.
We can also progressively load behaviors through plugins.

```html
<script src="brownie/core.js"></script>
<script src="brownie/table.js"></script>
<script src="brownie/table-sort.js"></script>
<script src="brownie/table-select.js"></script>
```

Plugins register themselves with the core and enable new attributes on existing components:

```html
<brow-table>
  <brow-table-header name="Name" age="Age"/>
  <brow-table-column field="name" sortable/>
  <brow-table-column field="age" sortable/>
  
  <brow-table-row name="Alice" age="34" selected/>
  <brow-table-row name="Bob" age="28"/>
</brow-table>
```

---

## Theming

Themes are pure CSS stylesheets that get injected into every component's shadow DOM.
To create a new theme, clone the `theme.css` file then make adjustments as necessary.
Brownie's base theme is kept simple and lightweight since it's intended to be used as
a starting point to clone and develop your custom theme.

For more advanced theming, each component's shadow root can also be styled and 
any named `:part` can be styled as well. Parts are documented for each component.

Here are a few example themes from our documentation:

* `docs/brownie.css`: A more 3-dimensional version of the base theme with additional fonts loaded.
* `docs/technical.css`: A technical, blueprint-like theme using monospace fonts, high contrast, sharp corners.
* `docs/vibes.css`: A colorful, friendly theme with additional gradient effects.

### Light/Dark Mode

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

---

## Designed for Generation

Brownie is built with backend rendering and AI generation in mind:

- **Declarative configuration** — no imperative JS required for most UIs
- **Minimal template syntax** — just `{{property}}` bindings and optional formatters
- **Attribute-driven** — all state is visible in the markup
- **Predictable output** — same inputs always produce the same DOM

Whether you're rendering from Rails, Django, PHP, or an LLM — if you can output HTML, you can build with Brownie.

---

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

Brownie is brand new in 2026 and leverages the latest browser technologies to achieve
a zero build, zero library core. It has limited browser support.

For example, Brownie uses CSS Anchor Positioning for menus and hovercards which are yet to be baseline.
You may need additional polyfills for the latest browser features if you want to support older browsers.

---

## License

MIT

---

*Named for the helpful household spirits of Scottish folklore who quietly do good work while no one is watching.*
