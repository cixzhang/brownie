# Brownie SSR — Declarative Shadow DOM

Server-side rendering with Declarative Shadow DOM (DSD) for zero-FOUC page loads.

## The Problem

When web components render client-side, the browser shows raw HTML until JS loads and components call `render()` — a flash of unstyled content (FOUC). This is especially bad on slow networks.

## The Solution

Brownie's SSR module runs the actual component code in Node.js using minimal DOM polyfills. Components execute their real `render()` methods, and the output is wrapped in `<template shadowrootmode="open">` — the browser creates shadow roots during HTML parsing, before any JS loads.

## Quick Start

```bash
node examples/ssr/server.js
# Open http://localhost:3000
```

## Usage

### Server Side

```js
import { createSSR } from 'brownie/ssr';
import Button from 'brownie/components/brow-button';
import Card from 'brownie/components/brow-card';

// 1. Create SSR instance (sets up polyfills, intercepts registration)
const ssr = await createSSR();

// 2. Import components — they self-register with Brownie
//    (must be dynamic imports so polyfills are in place first)
const Button = (await import('brownie/components/brow-button.js')).default;
const Card = (await import('brownie/components/brow-card.js')).default;

// 3. Render components with DSD
const buttonHtml = ssr.dsd(Button, { variant: 'primary' }, 'Click me');
const cardHtml = ssd(Card, { padding: 'space-6' }, buttonHtml);

// 4. Generate a complete HTML page
//    page() scans body HTML for <brow-*> tags and auto-generates:
//      - Inlined hydrate script
//      - Base CSS + theme CSS
//      - Client import statements for each used component
//      - Brownie.expect() + Brownie.ready() wiring
const html = ssr.page({
  title: 'My App',
  body: cardHtml,
  onReady: `console.log('hydrated');`,
});
```

### Client Side

The hydrate script is automatically inlined by `page()` — no additional setup needed. It patches `attachShadow()` to return existing DSD shadow roots instead of throwing, enabling seamless hydration when component modules load.

## API

### `createSSR()`

Returns a singleton SSR instance. Sets up DOM polyfills (CSSStyleSheet, HTMLElement, customElements) and intercepts `Brownie.register()` to build a component registry.

### `ssr.dsd(tagOrClass, attrs, lightHtml)`

Render a component with Declarative Shadow DOM.

- `tagOrClass` — Component class reference (`Button`) or tag name string (`'brow-button'`)
- `attrs` — HTML attributes object
- `lightHtml` — Light DOM content (children)

### `ssr.page(options)`

Generate a complete HTML document with auto-wired hydration.

- `title` — Page title
- `body` — HTML content
- `head` — Extra `<head>` content
- `onReady` — JS to run inside `Brownie.ready().then(() => { ... })`
- `extraComponents` — Additional tag names to import (not found in body scan)

### `ssr.css(tagOrClass)`

Get component CSS only (no DSD wrapper).

### `ssr.shadow(tagOrClass, attrs)`

Get component shadow DOM innerHTML only (no CSS, no DSD wrapper).

## How It Works

1. `createSSR()` polyfills `CSSStyleSheet`, `HTMLElement`, `customElements` in Node
2. Component modules are imported — they call `Brownie.register()` which builds the registry
3. `dsd()` instantiates a component by its class reference, sets attributes, calls `connectedCallback()`
4. The real `render()` method produces shadow DOM HTML
5. Output wraps shadow DOM in `<template shadowrootmode="open">` with CSS inline
6. Browser parses the DSD template, creating the shadow root before JS loads
7. When component modules load client-side, `attachShadow()` returns the existing DSD root
8. `connectedCallback()` calls `render()` — same content, no flicker

## Why Class References?

```js
// ✅ Explicit, tree-shakeable, IDE autocomplete
import Button from 'brownie/components/brow-button';
dsd(Button, { variant: 'primary' }, 'Click me');

// ✅ Also works — string tag name
dsd('brow-button', { variant: 'primary' }, 'Click me');
```

Class references prevent silent failures — if you forgot to import a component, you get an immediate error, not a runtime lookup miss.

## Packaging

No filesystem scanning. Components self-register when imported. The server imports only what it needs. Scales to hundreds of components — the registry is a Map with O(1) lookup.
