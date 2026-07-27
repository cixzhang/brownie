/**
 * server.js — Node HTTP server demonstrating Brownie SSR with DSD.
 *
 * Run: node examples/ssr/server.js
 * Open: http://localhost:3000
 *
 * Uses Brownie's built-in SSR module (src/ssr.js) which runs the actual
 * component code on the server with minimal DOM polyfills. No duplicated
 * render logic — the real render() methods produce the shadow DOM HTML.
 *
 * page() parses the body HTML into an AST, injects <template shadowrootmode="open">
 * into each <brow-*> element, and generates client imports automatically.
 * Server-side code is just plain HTML — no dsd() calls needed.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { createSSR } from '@cixzhang/brownie/ssr';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const BROWNIE_ROOT = join(__dirname, '..', '..');
const PUBLIC_DIR = join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// ─── SSR setup ─────────────────────────────────────────────────────

const ssr = await createSSR();

// Import components explicitly — they self-register with Brownie.
// Must be dynamic imports (after createSSR) so polyfills are in place.
await import('@cixzhang/brownie/components/brow-button');
await import('@cixzhang/brownie/components/brow-card');
await import('@cixzhang/brownie/components/brow-layout');
await import('@cixzhang/brownie/components/brow-section');
await import('@cixzhang/brownie/components/brow-select');

const { page } = ssr;

// ─── Page rendering ─────────────────────────────────────────────────

function renderPage() {
  const body = `
<brow-layout height="100vh" padding="space-6">
  <brow-section slot="header" padding="space-4">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong style="font-size:1.25rem;">Brownie SSR</strong>
      <div style="display:flex;gap:var(--space-2);align-items:center;">
        <brow-select placeholder="Select theme..." id="theme-select">
          <brow-option value="sage">Sage</brow-option>
          <brow-option value="ocean">Ocean</brow-option>
          <brow-option value="sunset">Sunset</brow-option>
        </brow-select>
        <brow-button disabled>Disabled</brow-button>
      </div>
    </div>
  </brow-section>

  <brow-section slot="content" padding="space-6">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4);max-width:960px;margin:0 auto;">
      <brow-card padding="space-6">
        <h3 style="margin:0 0 var(--space-2) 0;">Declarative Shadow DOM</h3>
        <p style="margin:0;color:var(--color-text-secondary);">This card was rendered on the server with its shadow DOM included in the HTML. No flash of unstyled content.</p>
      </brow-card>
      <brow-card padding="space-6">
        <h3 style="margin:0 0 var(--space-2) 0;">Hydration Ready</h3>
        <p style="margin:0 0 var(--space-4) 0;color:var(--color-text-secondary);">When the component modules load, they adopt the existing shadow root — no re-render flicker.</p>
        <brow-button variant="primary" id="get-started">Get Started</brow-button>
      </brow-card>
      <brow-card padding="space-6">
        <h3 style="margin:0 0 var(--space-2) 0;">No JavaScript Required</h3>
        <p style="margin:0;color:var(--color-text-secondary);">View source — the shadow DOM is in the HTML. Disable JS and reload; it still looks right.</p>
      </brow-card>
    </div>
    <div id="dynamic-content" style="max-width:960px;margin:var(--space-6) auto 0;"></div>
  </brow-section>

  <brow-section slot="footer" padding="space-4" divider="top">
    <p style="margin:0;color:var(--color-text-muted);font-size:0.875rem;text-align:center;">
      Rendered at ${new Date().toISOString()} — Declarative Shadow DOM example
    </p>
  </brow-section>
</brow-layout>`;

  return page({
    title: 'Brownie SSR — Declarative Shadow DOM',
    body,
    onReady: `import('/app.js');`,
  });
}

// ─── HTTP server ────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Main page
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPage());
    return;
  }

  // Fragment endpoint — returns server-rendered HTML fragments
  // (plain Brownie component HTML, no DSD — client-side components
  // are already registered, so they upgrade immediately)
  if (url.pathname === '/fragment/details') {
    const fragment = `
<brow-card padding="space-6">
  <h3 style="margin:0 0 var(--space-2) 0;">Server-Rendered Fragment</h3>
  <p style="margin:0 0 var(--space-4) 0;color:var(--color-text-secondary);">
    This card was rendered on the server in response to clicking "Get Started".
    The HTML includes DSD templates — the shadow DOM is fully formed.
  </p>
  <p style="margin:0;color:var(--color-text-secondary);font-size:0.875rem;">
    Fetched at ${new Date().toISOString()}
  </p>
</brow-card>
<brow-card padding="space-6">
  <h3 style="margin:0 0 var(--space-3) 0;">How This Works</h3>
  <ol style="margin:0;padding-left:var(--space-5);color:var(--color-text-secondary);line-height:1.8;">
    <li>Click "Get Started" triggers a fetch to /fragment/details</li>
    <li>Server renders Brownie components with DSD templates</li>
    <li>Client injects the HTML — browser processes the DSD templates</li>
    <li>Components are already registered, so they upgrade immediately</li>
  </ol>
  <div style="margin-top:var(--space-4);"><brow-button variant="ghost">Dismiss</brow-button></div>
</brow-card>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fragment);
    return;
  }

  // Serve files from public/ (app.js, etc.)
  const publicPath = join(PUBLIC_DIR, url.pathname);
  if (publicPath.startsWith(PUBLIC_DIR)) {
    try {
      const content = await readFile(publicPath);
      const ext = extname(publicPath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(content);
      return;
    } catch {
      // File doesn't exist in public/, fall through
    }
  }

  // Serve Brownie source files (/src/core.js, /src/components/brow-button/, etc.)
  // Resolves directories to index.js (matching the exports map behavior)
  const filePath = join(BROWNIE_ROOT, url.pathname);
  if (!filePath.startsWith(BROWNIE_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    let resolvedPath = filePath;
    const ext = extname(filePath);
    
    // If no extension, try as directory with index.js
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
});

server.listen(PORT, () => {
  console.log(`Brownie SSR example running at http://localhost:${PORT}`);
});
