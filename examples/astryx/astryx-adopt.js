/**
 * Spike: can brow-button wear Astryx's component CSS?
 *
 * Two layers, per the browser probes:
 *   - Astryx theme component rules, @scope stripped, adopted INTO the shadow
 *     root, matching Astryx's stable classes (.astryx-button.secondary).
 *   - Brownie's own base styles underneath, since Astryx's base layer is StyleX
 *     atomic classes that only React can apply.
 *
 * The element renders BOTH surfaces: part="base" for Brownie's public theming
 * API, and the Astryx classes for the adopted sheet to match.
 */
import Brownie from '../../src/core.js';

/** Strip the `@scope (...) to (...)` wrapper the theme build emits. */
export function unscope(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('@scope', i);
    if (at === -1) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, at);
    // Walk to the wrapper's opening brace, then to its match.
    const open = css.indexOf('{', at);
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    out += css.slice(open + 1, j - 1);
    i = j;
  }
  return out;
}

/**
 * Collect rules targeting Astryx's stable component classes.
 *
 * The theme build nests them inside `@layer astryx-theme`, so this walks
 * grouping rules rather than only the top level. The layer is dropped on the
 * way out: inside the shadow root the component's own base CSS is unlayered,
 * and unlayered styles beat layered ones, so a preserved layer would lose
 * exactly the override it was meant to apply.
 */
export function componentRulesOnly(css) {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);

  const keep = [];
  const walk = rules => {
    for (const rule of rules) {
      if (rule.selectorText?.includes('.astryx-')) keep.push(rule.cssText);
      else if (rule.cssRules) walk(rule.cssRules);
    }
  };
  walk(sheet.cssRules);
  return keep.join('\n');
}

export async function loadAstryxComponentCSS(url) {
  const raw = await fetch(url).then(r => r.text());
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(componentRulesOnly(unscope(raw)));
  Brownie.injectTheme(sheet);
  return sheet;
}
