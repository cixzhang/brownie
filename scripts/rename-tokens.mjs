#!/usr/bin/env node
/**
 * One-shot rename of Brownie's token vocabulary to Astryx's spelling.
 *
 * Kept in-tree as the record of what was renamed to what, since the diff itself
 * cannot say which pairs were judged equivalent.
 *
 * Order matters: longer names are applied first so `--space-1` cannot eat the
 * prefix of `--space-1_5` or `--space-10`. Every replacement is anchored on a
 * trailing non-identifier character for the same reason.
 */
import {readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

/** Brownie name -> Astryx name. */
const RENAMES = {
  // Surfaces
  '--color-page': '--color-background-body',
  '--color-card': '--color-background-card',
  '--color-muted': '--color-background-muted',
  '--color-surface': '--color-background-surface',
  '--color-background': '--color-background-surface',
  // Astryx's `neutral` is the low-emphasis fill its own secondary button uses.
  '--color-secondary': '--color-neutral',
  // Brownie's `highlight` is the hover/selected wash, which Astryx spells as an
  // overlay rather than a surface.
  '--color-highlight': '--color-overlay-hover',

  // Text
  '--color-text-muted': '--color-text-disabled',
  // Only ever used for text on an accent-filled surface.
  '--color-text-inverse': '--color-on-accent',

  // Borders
  '--color-border-strong': '--color-border-emphasized',

  // Status. Astryx has no bg/text/dot triple, so only the saturated "dot"
  // colors -- the ones with a true counterpart -- move.
  '--color-danger': '--color-error',
  '--color-danger-bg': '--color-background-red',

  // Typography
  '--font-body': '--font-family-body',
  '--font-header': '--font-family-heading',
  '--font-code': '--font-family-code',

  // Radius
  '--radius-round': '--radius-full',

  // Elevation
  '--elevation-base': '--shadow-low',

  // Motion. Astryx themes a bare duration and leaves easing to the component,
  // so the easing baked into Brownie's old values moves to the call sites.
  '--transition-fast': '--duration-fast',
  '--transition-base': '--duration-medium',
  '--transition-slow': '--duration-slow',

  // Spacing. Astryx spells fractions with a dash, not an underscore.
  '--space-0_5': '--spacing-0-5',
  '--space-1_5': '--spacing-1-5',
  '--space-2_5': '--spacing-2-5',
  ...Object.fromEntries(
    [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 12].map(n => [`--space-${n}`, `--spacing-${n}`]),
  ),
};

const ordered = Object.entries(RENAMES).sort((a, b) => b[0].length - a[0].length);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|css|html|md|json)$/.test(entry)) out.push(p);
  }
  return out;
}

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error('usage: node scripts/rename-tokens.mjs <dir|file>...');
  process.exit(1);
}

let touched = 0;
const counts = {};
for (const root of roots) {
  const files = statSync(root).isDirectory() ? walk(root) : [root];
  for (const file of files) {
    const before = readFileSync(file, 'utf8');
    let after = before;
    for (const [from, to] of ordered) {
      // Trailing boundary stops --space-1 from matching inside --space-10.
      after = after.replace(new RegExp(`${from}(?![\\w-])`, 'g'), match => {
        counts[from] = (counts[from] ?? 0) + 1;
        return to;
      });
    }
    if (after !== before) {
      writeFileSync(file, after);
      touched++;
    }
  }
}

console.error(`${touched} files changed`);
for (const [from, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.error(`  ${n.toString().padStart(3)}  ${from} -> ${RENAMES[from]}`);
}
