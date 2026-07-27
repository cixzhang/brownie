/**
 * server.js — htmx + Brownie SSR example: a task list app.
 *
 * Run: node examples/htmx/server.js
 * Open: http://localhost:3001
 *
 * Initial page: rendered with DSD via brownie/ssr (no FOUC).
 * page() parses the body HTML, injects DSD templates by running the
 * real component code, and auto-generates client imports.
 *
 * htmx interactions: server returns plain Brownie component HTML fragments.
 *   Components are already registered client-side, so they upgrade
 *   immediately after htmx swaps the content — no DSD needed for fragments.
 *
 * htmx attributes live on light DOM elements (slotted into Brownie components),
 * so htmx can see them. After hydration, htmx.process(document.body) picks
 * up htmx attributes on elements that were inside DSD templates.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { createSSR } from '@cixzhang/brownie/ssr';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const BROWNIE_ROOT = join(__dirname, '..', '..');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

// ─── SSR setup ─────────────────────────────────────────────────────

const ssr = await createSSR();

// Import components explicitly — they self-register with Brownie.
// Must be dynamic imports (after createSSR) so polyfills are in place.
await import('@cixzhang/brownie/components/brow-button');
await import('@cixzhang/brownie/components/brow-card');
await import('@cixzhang/brownie/components/brow-layout');
await import('@cixzhang/brownie/components/brow-section');

const { page } = ssr;

// ─── In-memory task store ───────────────────────────────────────────

let nextId = 4;
const tasks = [
  { id: 1, title: 'Learn Brownie SSR', done: true },
  { id: 2, title: 'Try htmx with web components', done: false },
  { id: 3, title: 'Ship the demo', done: false },
];

// ─── Fragment renderers ─────────────────────────────────────────────
// For htmx fragments: plain Brownie component HTML, no DSD.
// Components are already registered client-side, so they upgrade
// and render their own shadow DOM via connectedCallback.

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function taskCard(task) {
  const checkText = task.done ? '✓ Done' : 'Mark done';
  return `<brow-card padding="space-4" id="task-${task.id}" style="margin-bottom:var(--space-3);">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:var(--space-3);">
      <span style="flex:1;${task.done ? 'text-decoration:line-through;color:var(--color-text-muted);' : ''}">${escapeHtml(task.title)}</span>
      <div style="display:flex;gap:var(--space-1);flex-shrink:0;">
        <brow-button variant="ghost" hx-post="/tasks/${task.id}/toggle" hx-target="closest brow-card" hx-swap="outerHTML" style="font-size:0.875rem;">${checkText}</brow-button>
        <brow-button variant="ghost" hx-delete="/tasks/${task.id}" hx-target="closest brow-card" hx-swap="outerHTML" style="font-size:0.875rem;color:var(--color-error-text);">Delete</brow-button>
      </div>
    </div>
  </brow-card>`;
}

// ─── Page rendering (with DSD via page()) ──────────────────────────

function renderPage() {
  const initialTasks = tasks.map((t) => taskCard(t)).join('\n');

  const body = `
<brow-layout height="100vh" padding="space-6">
  <brow-section slot="header" padding="space-4">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong style="font-size:1.25rem;">Tasks</strong>
      <span style="color:var(--color-text-secondary);font-size:0.875rem;">${tasks.filter((t) => !t.done).length} remaining</span>
    </div>
  </brow-section>

  <brow-section slot="content" padding="space-6">
    <div style="max-width:600px;margin:0 auto;">
      <brow-card padding="space-4" style="margin-bottom:var(--space-6);">
        <form hx-post="/tasks" hx-target="#task-list" hx-swap="beforeend" hx-on::after-request="this.reset()">
          <div style="display:flex;gap:var(--space-2);">
            <input type="text" name="title" placeholder="Add a task..." required
              style="flex:1;padding:var(--space-2) var(--space-3);border:1px solid var(--color-border);border-radius:var(--radius-element);font:inherit;background:var(--color-card);color:var(--color-text-primary);" />
            <button type="submit"
              style="background:var(--color-accent);color:var(--color-text-inverse);border:none;border-radius:var(--radius-element);padding-inline:var(--space-3);height:var(--space-9);font:inherit;cursor:pointer;box-shadow:inset 0 3px 0 var(--color-accent-highlight),inset 0 -3px 0 var(--color-accent-shadow);">Add</button>
          </div>
        </form>
      </brow-card>
      <div id="task-list">
        ${initialTasks}
      </div>
    </div>
  </brow-section>

  <brow-section slot="footer" padding="space-4" divider="top">
    <p style="margin:0;color:var(--color-text-muted);font-size:0.875rem;text-align:center;">
      Brownie + htmx — server-rendered DSD with client-side htmx interactions
    </p>
  </brow-section>
</brow-layout>`;

  // page() auto-generates hydrate, imports, expect/ready.
  // onReady re-processes htmx attributes on elements that were
  // inside DSD templates or slotted into Brownie components.
  return page({
    title: 'Brownie + htmx — Task List',
    body,
    head: '<script src="https://unpkg.com/htmx.org@2.0.4"></script>',
    onReady: `console.log('[Brownie] Components hydrated — htmx ready');\n      htmx.process(document.body);`,
  });
}

// ─── HTTP server ────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  // Serve Brownie source files (/src/core.js, /src/components/brow-button/, etc.)
  // Resolves directories to index.js (matching the exports map behavior)
  if (url.pathname.startsWith('/src/')) {
    const filePath = join(BROWNIE_ROOT, url.pathname);
    try {
      let resolvedPath = filePath;
      const ext = extname(filePath);

      if (!ext) {
        const indexPath = join(filePath, 'index.js');
        try {
          await readFile(indexPath);
          resolvedPath = indexPath;
        } catch {
          // Not a directory, try as-is
        }
      }

      const content = await readFile(resolvedPath);
      const finalExt = extname(resolvedPath);
      res.writeHead(200, { 'Content-Type': mimeTypes[finalExt] || 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  // Main page
  if (url.pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPage());
    return;
  }

  // ─── htmx API endpoints ────────────────────────────────────────
  // All return HTML fragments (Brownie components without DSD).
  // Components are already registered client-side, so they upgrade
  // immediately after htmx swaps the content.

  // Add a task
  if (url.pathname === '/tasks' && method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const params = new URLSearchParams(body);
    const title = params.get('title')?.trim();
    if (!title) {
      res.writeHead(422, { 'Content-Type': 'text/html' });
      res.end('');
      return;
    }
    const task = { id: nextId++, title, done: false };
    tasks.push(task);
    res.writeHead(201, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(taskCard(task));
    return;
  }

  // Delete a task
  const deleteMatch = url.pathname.match(/^\/tasks\/(\d+)$/);
  if (deleteMatch && method === 'DELETE') {
    const id = parseInt(deleteMatch[1]);
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx >= 0) tasks.splice(idx, 1);
    // Return empty — htmx swaps outerHTML with nothing, removing the card
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('');
    return;
  }

  // Toggle a task
  const toggleMatch = url.pathname.match(/^\/tasks\/(\d+)\/toggle$/);
  if (toggleMatch && method === 'POST') {
    const id = parseInt(toggleMatch[1]);
    const task = tasks.find((t) => t.id === id);
    if (task) task.done = !task.done;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(taskCard(task));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Brownie + htmx example running at http://localhost:${PORT}`);
});
