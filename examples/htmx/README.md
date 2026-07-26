# Brownie + htmx — Task List

Server-rendered DSD with client-side htmx interactions. Zero client-side JS for CRUD operations.

## Quick Start

```bash
node examples/htmx/server.js
# Open http://localhost:3001
```

## How It Works

### Initial Page Load

The page is rendered with DSD via `ssr.page()` — shadow DOM is in the HTML, no FOUC. `page()` auto-generates the hydrate script, component imports, and `Brownie.expect/ready` wiring by scanning the body for `<brow-*>` tags.

### htmx Interactions

- **Add task**: `hx-post="/tasks"` → server returns a `<brow-card>` fragment (no DSD needed — component is already registered, upgrades via `connectedCallback`)
- **Toggle**: `hx-post="/tasks/:id/toggle"` → returns updated card HTML
- **Delete**: `hx-delete="/tasks/:id"` → returns empty, htmx removes the element

htmx attributes live on light DOM elements slotted into Brownie components. htmx can see them without `htmx.process()`. After hydration, `htmx.process(document.body)` picks up htmx attributes on elements that were inside DSD templates.

### Key Integration Points

1. **htmx attributes go on light DOM** — htmx can't see through shadow boundaries
2. **`htmx.process(document.body)` after hydration** — components upgrade after DSD, htmx needs to re-scan
3. **Native `<button type="submit">` for forms** — brow-button's inner button is in shadow DOM and doesn't trigger form submission. Use a native button styled with Brownie's CSS variables.
4. **Fragments don't need DSD** — components are already registered client-side, so they upgrade immediately after htmx swaps content
