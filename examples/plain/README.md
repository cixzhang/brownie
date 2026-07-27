# Brownie — Plain HTML Example

A single HTML file with no server, no build step, no npm install. Uses an import map to load Brownie from a CDN (unpkg).

## Quick Start

Just open `index.html` in a browser. That's it.

Or serve it with any static file server:

```bash
npx serve examples/plain
```

## How It Works

1. An [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) maps `@cixzhang/brownie` to the unpkg CDN
2. ES module imports resolve through the import map
3. Brownie's `exports` field in package.json tells Node/bundlers where files are — the import map does the same thing for browsers
4. CSS is loaded via `<link>` tags pointing to the CDN

No build step. No bundler. No server. Just HTML.
