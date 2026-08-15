/**
 * Generate a Brownie theme from a built Astryx theme.
 *
 * Astryx (https://github.com/facebook/astryx) compiles its `defineTheme` IR to a
 * plain CSS file. Both systems express light/dark as a single `light-dark()`
 * value, so its token layer transfers to Brownie by renaming — no build step
 * and no dependency on Astryx itself, only on the CSS it ships.
 *
 * Brownie's own theme.css is the baseline: every declaration Astryx has an
 * equivalent for is overwritten, everything else keeps Brownie's value. An
 * unmapped Astryx theme therefore still produces a complete, working theme,
 * which is what lets the mapping grow one token at a time.
 *
 * Usage:
 *   node scripts/astryx-theme.mjs <astryx-theme.css> [-o out.css] [--report]
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = resolve(HERE, '../src/theme.css');

/**
 * Brownie variable <- Astryx variable, for the pairs that are NOT already
 * identical.
 *
 * Brownie's tokens were renamed to Astryx's spelling wherever a counterpart
 * exists, so most of this map collapsed into identity and is handled by
 * `identityTokens()` below. What is left is where the two vocabularies differ
 * in shape rather than merely in name.
 */
const MAP = {
  // Brownie keeps a bg/text/dot triple per status. Astryx carries the first two
  // on its categorical ramps and the saturated dot on the status token itself.
  '--color-success-bg': '--color-background-green',
  '--color-success-text': '--color-text-green',
  '--color-success-dot': '--color-success',
  '--color-warning-bg': '--color-background-yellow',
  '--color-warning-text': '--color-text-yellow',
  '--color-warning-dot': '--color-warning',
  '--color-error-bg': '--color-background-red',
  '--color-error-text': '--color-text-red',
  '--color-error-dot': '--color-error',
  // Astryx has no info status; its accent is the blue that reads as one.
  '--color-info-bg': '--color-background-blue',
  '--color-info-text': '--color-text-blue',
  '--color-info-dot': '--color-accent',

  // Astryx has no border tier between `border` and `border-emphasized`.
  '--color-border-muted': '--color-neutral',

  // Absent on purpose:
  //   --spacing-*      Same names already, so the identity pass handles them.
  //                    Most themes leave the scale alone and Brownie's values
  //                    stand; y2k rescales it and those values come through.
  //   --ease-standard  Consumed by Astryx components but never themed, so
  //                    Brownie's easing always stands.
};

/**
 * Brownie variables that now share Astryx's spelling, copied straight across.
 *
 * Derived from the baseline rather than hand-listed, so a token added to
 * Brownie's theme.css starts transferring without an edit here.
 */
function identityTokens(baselineCss, astryxTokens) {
  return [...baselineCss.matchAll(/^\s*(--[\w-]+):/gm)]
    .map(m => m[1])
    .filter(name => !(name in MAP) && name in astryxTokens);
}

/**
 * Families that are already on the machine, so a webfont request would be
 * wrong rather than merely wasted.
 */
const SYSTEM_FAMILIES = new Set(
  [
    'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded',
    'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'emoji', 'math',
    '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica',
    'Helvetica Neue', 'Arial', 'Georgia', 'Times New Roman', 'Courier New',
    'SF Mono', 'SF Pro', 'Monaco', 'Consolas', 'Menlo', 'Cascadia Code',
  ].map(f => f.toLowerCase()),
);

/**
 * Build a Google Fonts request for the theme's own families.
 *
 * Astryx names families but never ships them — its docsite loads the webfonts
 * itself. Brownie themes are dropped in as a single stylesheet with no build
 * step or app shell to do that, so the generated theme fetches its own fonts and
 * a themed page looks right from one <link>.
 *
 * A family Google does not host simply 404s and the CSS fallback chain applies,
 * which is the same outcome as not asking.
 */
function fontImport(tokens) {
  const families = [];
  for (const key of ['--font-family-body', '--font-family-heading', '--font-family-code']) {
    const first = tokens[key]?.split(',')[0]?.trim().replace(/^["']|["']$/g, '');
    if (!first) continue;
    if (SYSTEM_FAMILIES.has(first.toLowerCase())) continue;
    if (!families.includes(first)) families.push(first);
  }
  if (families.length === 0) return null;

  // Ask for the weight range Brownie's components use rather than one weight.
  const spec = families
    .map(f => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&');
  return {
    families,
    css: `@import url('https://fonts.googleapis.com/css2?${spec}&display=swap');`,
  };
}

/**
 * Collect custom-property declarations from an Astryx built theme.
 *
 * The token layer lives in a `@scope` block on `:scope`; the file also carries
 * a reset layer and per-component rules, whose declarations are not tokens.
 */
function parseAstryxTokens(css) {
  const start = css.indexOf(':scope {');
  if (start === -1) {
    throw new Error('No `:scope` token block found — is this an Astryx built theme.css?');
  }
  const end = css.indexOf('\n  }', start);
  const block = css.slice(start, end === -1 ? undefined : end);

  const tokens = {};
  for (const [, name, value] of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return resolveRefs(tokens);
}

/**
 * Inline `var(--x)` references so the output stands alone without the Astryx
 * stylesheet loaded alongside it.
 */
function resolveRefs(tokens) {
  const out = {};
  const seen = new Set();
  const resolve1 = name => {
    if (name in out) return out[name];
    if (seen.has(name)) return tokens[name];
    seen.add(name);
    const raw = tokens[name];
    if (raw === undefined) return undefined;
    out[name] = raw.replace(/var\((--[\w-]+)\)/g, (whole, ref) =>
      ref in tokens ? resolve1(ref) : whole,
    );
    return out[name];
  };
  for (const name of Object.keys(tokens)) resolve1(name);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const report = args.includes('--report');
  const outIdx = args.findIndex(a => a === '-o' || a === '--out');
  const outPath = outIdx === -1 ? null : args[outIdx + 1];
  const input = args.find((a, i) => !a.startsWith('-') && i !== outIdx + 1);

  if (!input) {
    console.error('usage: node scripts/astryx-theme.mjs <astryx-theme.css> [-o out.css] [--report]');
    process.exit(1);
  }

  const tokens = parseAstryxTokens(readFileSync(input, 'utf8'));
  const themeName = /\[data-astryx-theme="([^"]+)"\]/.exec(readFileSync(input, 'utf8'))?.[1] ?? 'astryx';

  let css = readFileSync(BASELINE, 'utf8');

  // Shared spellings first, then the handful that need translating.
  const sources = new Map(identityTokens(css, tokens).map(name => [name, name]));
  for (const [brownieVar, astryxVar] of Object.entries(MAP)) {
    sources.set(brownieVar, astryxVar);
  }

  const applied = [];
  const missing = [];
  for (const [brownieVar, astryxVar] of sources) {
    const value = tokens[astryxVar];
    if (value === undefined) {
      missing.push(brownieVar);
      continue;
    }

    // Rewrite the declaration in place so comments and grouping survive.
    const decl = new RegExp(`^(\\s*)${brownieVar}:[^;]*;`, 'm');
    if (!decl.test(css)) {
      missing.push(brownieVar);
      continue;
    }
    css = css.replace(decl, `$1${brownieVar}: ${value};`);
    applied.push(brownieVar);
  }

  const unmappedBrownie = [...css.matchAll(/^\s*(--[\w-]+):/gm)]
    .map(m => m[1])
    .filter(v => !sources.has(v));

  const fonts = fontImport(tokens);

  css = css.replace(
    /^\/\*\*[\s\S]*?\*\//,
    `/**
 * Brownie theme generated from the Astryx "${themeName}" theme.
 *
 * @generated by scripts/astryx-theme.mjs — do not edit manually.
 * Source: ${input}
 *
 * ${applied.length} of ${sources.size} tokens came from Astryx.
 * ${unmappedBrownie.length} Brownie variables have no Astryx counterpart and keep
 * their built-in values.
 */${fonts ? `\n\n${fonts.css}` : ''}`,
  );

  if (outPath) {
    writeFileSync(outPath, css);
    console.error(`wrote ${outPath}`);
  } else if (!report) {
    process.stdout.write(css);
  }

  if (report) {
    console.error(`\ntheme: ${themeName}`);
    console.error(`astryx tokens parsed: ${Object.keys(tokens).length}`);
    console.error(`from astryx: ${applied.length}/${sources.size} (${sources.size - Object.keys(MAP).length} shared names, ${Object.keys(MAP).length} translated)`);
    console.error(`webfonts: ${fonts ? fonts.families.join(', ') : 'none'}`);
    if (missing.length) console.error(`MISSING:  ${missing.join(', ')}`);
    console.error(`untouched Brownie vars (${unmappedBrownie.length}): ${unmappedBrownie.join(', ')}`);
  }
}

main();
