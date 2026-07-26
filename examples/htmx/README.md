# Brownie + htmx — Task List Example

A task list app combining Brownie's SSR with Declarative Shadow DOM and htmx for
client-side interactivity without writing JavaScript.

## How it works

**Initial page load:** The server renders Brownie components with DSD templates
using `brownie/ssr`. Shadow roots are created by the HTML parser — no FOUC.

**htmx interactions:** htmx attributes (`hx-post`, `hx-delete`, `hx-target`,
`hx-swap`) live on light DOM elements slotted into Brownie components. The server
returns HTML fragments containing Brownie components. Since components are already
registered client-side, they upgrade immediately after htmx swaps the content —
no DSD needed for fragments.

**The `htmx.process()` call:** After Brownie hydrates, we call
`htmx.process(document.body)` to ensure htmx picks up attributes on elements that
were inside DSD templates or slotted into components.

## Key integration points

1. **htmx attributes on light DOM** — htmx can't see inside shadow DOM. Place
   `hx-*` attributes on slotted content (light DOM children of custom elements),
   not inside shadow roots.

2. **Native `<button type="submit">` for forms** — brow-button renders a `<button>`
   inside shadow DOM, which doesn't trigger form submission. Use a native button
   styled with Brownie CSS variables for form submit buttons.

3. **DSD for initial page, plain HTML for fragments** — The initial page uses
   `ssr.dsd()` to prevent FOUC. htmx fragments use plain component HTML —
   components are already registered, so they render their own shadow DOM via
   `connectedCallback`.

4. **`htmx.process()` after hydration** — Ensures htmx discovers htmx attributes
   on elements that were in DSD templates or slotted content.

## Running

```bash
node examples/htmx/server.js
```

Open http://localhost:3001

- Add tasks via the form
- Click "Mark done" / "✓ Done" to toggle
- Click "Delete" to remove
- All interactions use htmx — no client-side JS written

## File structure

```
examples/htmx/
├── server.js           # Node HTTP server: SSR page + htmx fragment endpoints
├── public/
│   └── hydrate.js      # DSD-aware attachShadow patch
└── README.md
```
