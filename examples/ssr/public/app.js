/**
 * app.js — SSR example app logic.
 *
 * Loaded after Brownie hydration via dynamic import in onReady.
 * Components are already hydrated — no need for Brownie.ready() here.
 */

// ─── Fragment fetching ─────────────────────────────────────────────

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

// ─── Theme swapping ────────────────────────────────────────────────

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
  // Collect all overridden properties across all themes
  var overridden = Object.keys(themes).flatMap(function (key) {
    return themes[key] ? Object.keys(themes[key]) : [];
  });
  // Reset each one
  overridden.forEach(function (prop) {
    root.style.removeProperty(prop);
  });
  // Apply the new theme
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

console.log('[Brownie] App logic loaded — hydration complete');
