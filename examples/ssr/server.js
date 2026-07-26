/**
 * server.js — Node HTTP server demonstrating Brownie SSR with DSD.
 *
 * Run: node examples/ssr/server.js
 * Open: http://localhost:3000
 *
 * Uses Brownie's built-in SSR module (src/ssr.js) which runs the actual
 * component code on the server with minimal DOM polyfills. No duplicated
 * render logic — the real render() methods produce the shadow DOM HTML.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { createSSR } from '../../src/ssr.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const BROWNIE_ROOT = join(__dirname, '..', '..');

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

const ssr = await createSSR();
const { dsd } = ssr;
const { base: baseCss, theme: themeCss } = ssr.pageStyles();

// ─── Page rendering ─────────────────────────────────────────────────

function renderPage() {
  const buttonPrimary = dsd('brow-button', { variant: 'primary', id: 'get-started' }, 'Get Started');

  const themeSelect = dsd(
    'brow-select',
    { placeholder: 'Select theme...' },
    '<brow-option value="sage">Sage</brow-option>' +
    '<brow-option value="ocean">Ocean</brow-option>' +
    '<brow-option value="sunset">Sunset</brow-option>'
  );
  const buttonDisabled = dsd('brow-button', { disabled: '' }, 'Disabled');

  const card1 = dsd('brow-card', { padding: 'space-6' }, `
    <h3 style="margin:0 0 var(--space-2) 0;">Declarative Shadow DOM</h3>
    <p style="margin:0;color:var(--color-text-secondary);">This card was rendered on the server with its shadow DOM included in the HTML. No flash of unstyled content.</p>
  `);

  const card2 = dsd('brow-card', { padding: 'space-6' }, `
    <h3 style="margin:0 0 var(--space-2) 0;">Hydration Ready</h3>
    <p style="margin:0 0 var(--space-4) 0;color:var(--color-text-secondary);">When the component modules load, they adopt the existing shadow root — no re-render flicker.</p>
    ${buttonPrimary}
  `);

  const card3 = dsd('brow-card', { padding: 'space-6' }, `
    <h3 style="margin:0 0 var(--space-2) 0;">No JavaScript Required</h3>
    <p style="margin:0;color:var(--color-text-secondary);">View source — the shadow DOM is in the HTML. Disable JS and reload; it still looks right.</p>
  `);

  const sectionHeader = dsd(
    'brow-section',
    { slot: 'header', padding: 'space-4' },
    `<div style="display:flex;justify-content:space-between;align-items:center;">
      <strong style="font-size:1.25rem;">Brownie SSR</strong>
      <div style="display:flex;gap:var(--space-2);align-items:center;">${themeSelect}${buttonDisabled}</div>
    </div>`
  );

  const sectionContent = dsd(
    'brow-section',
    { slot: 'content', padding: 'space-6' },
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-4);max-width:960px;margin:0 auto;">
      ${card1}${card2}${card3}
    </div>
    <div id="dynamic-content" style="max-width:960px;margin:var(--space-6) auto 0;"></div>`
  );

  const sectionFooter = dsd(
    'brow-section',
    { slot: 'footer', padding: 'space-4', divider: 'top' },
    `<p style="margin:0;color:var(--color-text-muted);font-size:0.875rem;text-align:center;">
      Rendered at ${new Date().toISOString()} — Declarative Shadow DOM example
    </p>`
  );

  const fullLayout = dsd(
    'brow-layout',
    { height: '100vh', padding: 'space-6' },
    sectionHeader + sectionContent + sectionFooter
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Brownie SSR — Declarative Shadow DOM</title>
  <style>${baseCss}</style>
  <style>${themeCss}</style>
  <script src="/hydrate.js"></script>
</head>
<body>
  ${fullLayout}
  <script type="module">
    import Brownie from '/src/core.js';
    import '/src/components/brow-button.js';
    import '/src/components/brow-card.js';
    import '/src/components/brow-layout.js';
    import '/src/components/brow-section.js';
    import '/src/components/brow-select.js';
    import '/src/components/brow-option.js';

    Brownie.expect(['brow-button', 'brow-card', 'brow-layout', 'brow-section', 'brow-select', 'brow-option']);
    Brownie.ready().then(() => {
      console.log('[Brownie] All components hydrated with DSD shadow roots');

      var getStarted = document.getElementById('get-started');
      if (getStarted) {
        getStarted.addEventListener('click', function () {
          fetch('/fragment/details')
            .then(function (r) { return r.text(); })
            .then(function (html) {
              var container = document.getElementById('dynamic-content');
              if (container) {
                container.innerHTML = html;
                console.log('[Brownie] Server-rendered fragment injected');
              }
            })
            .catch(function (err) { console.error('[Brownie] Fragment fetch failed:', err); });
        });
      }

      var themes = {
        sage: null,
        ocean: {
          '--color-accent': 'light-dark(#3b7dd8, #5a9aea)',
          '--color-accent-highlight': 'light-dark(#5a9bd8, #7ab0f0)',
          '--color-accent-shadow': 'light-dark(#2a5da8, #3a6ab0)',
          '--color-page': 'light-dark(#f0f4f8, #0e1419)',
          '--color-card': 'light-dark(#ffffff, #1a1f26)',
          '--color-highlight': 'light-dark(#e8f0f8, #1a2430)',
          '--color-muted': 'light-dark(#eaeef2, #181e25)',
          '--color-text-accent': 'light-dark(#2a6ab8, #7ab0f0)',
        },
        sunset: {
          '--color-accent': 'light-dark(#d4724a, #e8915a)',
          '--color-accent-highlight': 'light-dark(#e4885a, #f0a070)',
          '--color-accent-shadow': 'light-dark(#b45a3a, #c06840)',
          '--color-page': 'light-dark(#f8f4f0, #1a1410)',
          '--color-card': 'light-dark(#ffffff, #261e1a)',
          '--color-highlight': 'light-dark(#f8ede4, #2a1e16)',
          '--color-muted': 'light-dark(#f2ece6, #221a16)',
          '--color-text-accent': 'light-dark(#b85a30, #e8915a)',
        },
      };

      function applyTheme(name) {
        var root = document.documentElement;
        var overridden = Object.keys(themes).flatMap(function (key) {
          return themes[key] ? Object.keys(themes[key]) : [];
        });
        overridden.forEach(function (prop) {
          root.style.removeProperty(prop);
        });
        var vars = themes[name];
        if (!vars) return;
        Object.keys(vars).forEach(function (key) {
          root.style.setProperty(key, vars[key]);
        });
      }

      var themeSelect = document.querySelector('brow-select');
      if (themeSelect) {
        themeSelect.addEventListener('change', function (e) {
          applyTheme(e.detail.value);
          console.log('[Brownie] Theme changed to:', e.detail.value);
        });
      }
    });
  </script>
</body>
</html>`;
}

// ─── HTTP server ────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderPage());
    return;
  }

  if (url.pathname === '/fragment/details') {
    const detailCard = dsd('brow-card', { padding: 'space-6' }, `
      <h3 style="margin:0 0 var(--space-2) 0;">Server-Rendered Fragment</h3>
      <p style="margin:0 0 var(--space-4) 0;color:var(--color-text-secondary);">
        This card was rendered on the server in response to clicking "Get Started".
        The HTML includes DSD templates — the shadow DOM is fully formed.
      </p>
      <p style="margin:0;color:var(--color-text-secondary);font-size:0.875rem;">
        Fetched at ${new Date().toISOString()}
      </p>
    `);

    const detailButton = dsd('brow-button', { variant: 'ghost' }, 'Dismiss');

    const wrapper = dsd('brow-card', { padding: 'space-6' }, `
      <h3 style="margin:0 0 var(--space-3) 0;">How This Works</h3>
      <ol style="margin:0;padding-left:var(--space-5);color:var(--color-text-secondary);line-height:1.8;">
        <li>Click "Get Started" triggers a fetch to /fragment/details</li>
        <li>Server renders Brownie components with DSD templates</li>
        <li>Client injects the HTML — browser processes the DSD templates</li>
        <li>Components are already registered, so they upgrade immediately</li>
      </ol>
      <div style="margin-top:var(--space-4);">${detailButton}</div>
    `);

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(detailCard + wrapper);
    return;
  }

  if (url.pathname === '/hydrate.js') {
    try {
      const content = await readFile(join(__dirname, 'public', 'hydrate.js'), 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  const filePath = join(BROWNIE_ROOT, url.pathname);
  if (!filePath.startsWith(BROWNIE_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Brownie SSR example running at http://localhost:${PORT}`);
});
