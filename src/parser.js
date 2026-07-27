/**
 * Minimal HTML parser — tokenizer + tree builder + serializer.
 *
 * Zero dependencies. Not a spec-compliant HTML parser — just enough
 * to walk an HTML string, find <brow-*> tags, and inject DSD templates.
 *
 * Limitations (acceptable for SSR transform):
 *   - No DOCTYPE/entity handling (we operate on body fragments)
 *   - <template> tags treated as opaque (content not parsed)
 *   - <script>/<style> content treated as raw text
 *   - No implicit close-tag inference (all tags must be explicit or self-closing)
 */

/**
 * @typedef {Object} Node
 * @property {'element'|'text'|'comment'|'raw'} type
 * @property {string} [tag] - Tag name (elements only)
 * @property {Record<string, string>} [attrs] - Attributes (elements only)
 * @property {boolean} [selfClosing] - Self-closing tag
 * @property {Node[]} [children] - Child nodes (elements only)
 * @property {string} [content] - Text/comment/raw content
 */

// ─── Tokenizer ─────────────────────────────────────────────────────

const RAW_TAGS = new Set(['script', 'style', 'template']);

/**
 * Parse an HTML string into a tree of nodes.
 * @param {string} html
 * @returns {Node[]}
 */
export function parseHtml(html) {
  const tokens = tokenize(html);
  return buildTree(tokens);
}

/**
 * @typedef {Object} Token
 * @property {'open'|'close'|'self-close'|'text'|'comment'|'raw'} type
 * @property {string} [tag]
 * @property {Record<string, string>} [attrs]
 * @property {string} [content]
 */

/**
 * Tokenize an HTML string.
 * @param {string} html
 * @returns {Token[]}
 */
function tokenize(html) {
  /** @type {Token[]} */
  const tokens = [];
  let i = 0;
  const len = html.length;

  while (i < len) {
    // Comment
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      const stop = end === -1 ? len : end + 3;
      tokens.push({ type: 'comment', content: html.slice(i, stop) });
      i = stop;
      continue;
    }

    // Closing tag
    if (html[i] === '<' && html[i + 1] === '/') {
      const end = html.indexOf('>', i);
      const stop = end === -1 ? len : end + 1;
      const tag = html.slice(i + 2, end === -1 ? len : end).trim().toLowerCase();
      tokens.push({ type: 'close', tag });
      i = stop;
      continue;
    }

    // Opening tag (must start with a letter)
    if (html[i] === '<' && /[a-zA-Z]/.test(html[i + 1] || '')) {
      const result = parseOpenTag(html, i);
      tokens.push(result.token);
      i = result.nextIndex;

      // Raw content tags: consume until matching close tag
      if (result.token.type === 'open' && RAW_TAGS.has(result.token.tag)) {
        const closeTag = `</${result.token.tag}`;
        const closeIdx = findCloseTag(html, closeTag, i);
        if (closeIdx > i) {
          tokens.push({ type: 'raw', content: html.slice(i, closeIdx) });
          // Skip to the close tag
          const end = html.indexOf('>', closeIdx);
          i = end === -1 ? len : end + 1;
          tokens.push({ type: 'close', tag: result.token.tag });
        }
      }
      continue;
    }

    // Text node — accumulate until next <
    let next = html.indexOf('<', i);
    if (next === -1) next = len;
    if (next > i) {
      tokens.push({ type: 'text', content: html.slice(i, next) });
      i = next;
    } else {
      // Stray < — consume as text
      tokens.push({ type: 'text', content: html[i] });
      i++;
    }
  }

  return tokens;
}

/**
 * Find a closing tag, ignoring case.
 * @param {string} html
 * @param {string} closeTag - e.g. "</script"
 * @param {number} from
 * @returns {number}
 */
function findCloseTag(html, closeTag, from) {
  const lower = html.toLowerCase();
  const target = closeTag.toLowerCase();
  let idx = from;
  while (idx < html.length) {
    idx = lower.indexOf(target, idx);
    if (idx === -1) return -1;
    // Next char after the tag name should be > or whitespace
    const after = idx + target.length;
    if (after >= html.length || html[after] === '>' || /\s/.test(html[after])) {
      return idx;
    }
    idx = after;
  }
  return -1;
}

/**
 * Parse an opening tag starting at position i.
 * @param {string} html
 * @param {number} i
 * @returns {{token: Token, nextIndex: number}}
 */
function parseOpenTag(html, i) {
  // Find end of tag
  let j = i + 1;
  // Skip until > (respecting quoted attribute values)
  let inQuote = '';
  while (j < html.length) {
    const ch = html[j];
    if (inQuote) {
      if (ch === inQuote) inQuote = '';
      j++;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
      j++;
    } else if (ch === '>') {
      break;
    } else {
      j++;
    }
  }

  const tagContent = html.slice(i + 1, j);
  const nextIndex = j + 1;

  // Check for self-closing
  const selfClosing = tagContent.endsWith('/');
  const cleaned = selfClosing ? tagContent.slice(0, -1) : tagContent;

  // Parse tag name and attributes
  const { tag, attrs } = parseTagContent(cleaned);

  return {
    token: selfClosing
      ? { type: 'self-close', tag, attrs }
      : { type: 'open', tag, attrs },
    nextIndex,
  };
}

/**
 * Parse tag name and attributes from the content inside <...>.
 * @param {string} content
 * @returns {{tag: string, attrs: Record<string, string>}}
 */
function parseTagContent(content) {
  // Tag name is the first word
  const tagMatch = content.match(/^([a-zA-Z][\w-]*)/);
  const tag = tagMatch ? tagMatch[1].toLowerCase() : '';
  const rest = content.slice(tag.length);

  /** @type {Record<string, string>} */
  const attrs = {};
  const attrRegex = /([a-zA-Z_][\w:@.-]*)(?:\s*=\s*"([^"]*)"|\s*=\s*'([^']*)'|\s*=\s*([^\s>]+))?/g;
  let m;
  while ((m = attrRegex.exec(rest)) !== null) {
    const name = m[1];
    const value = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[name] = value;
  }

  return { tag, attrs };
}

// ─── Tree Builder ──────────────────────────────────────────────────

/**
 * Build a tree from tokens.
 * @param {Token[]} tokens
 * @returns {Node[]}
 */
function buildTree(tokens) {
  /** @type {Node} */
  const root = { type: 'element', tag: '#root', children: [] };
  /** @type {Node[]} */
  const stack = [root];

  for (const token of tokens) {
    const current = stack[stack.length - 1];

    switch (token.type) {
      case 'open': {
        const node = { type: 'element', tag: token.tag, attrs: token.attrs || {}, children: [] };
        current.children.push(node);
        stack.push(node);
        break;
      }
      case 'self-close': {
        const node = { type: 'element', tag: token.tag, attrs: token.attrs || {}, children: [], selfClosing: true };
        current.children.push(node);
        break;
      }
      case 'close': {
        // Pop until we find the matching tag
        for (let k = stack.length - 1; k > 0; k--) {
          if (stack[k].tag === token.tag) {
            stack.length = k;
            break;
          }
        }
        break;
      }
      case 'text': {
        current.children.push({ type: 'text', content: token.content });
        break;
      }
      case 'comment': {
        current.children.push({ type: 'comment', content: token.content });
        break;
      }
      case 'raw': {
        current.children.push({ type: 'raw', content: token.content });
        break;
      }
    }
  }

  return root.children;
}

// ─── Serializer ────────────────────────────────────────────────────

/**
 * Serialize a tree of nodes back to HTML.
 * @param {Node[]} nodes
 * @returns {string}
 */
export function serializeHtml(nodes) {
  return nodes.map(serializeNode).join('');
}

/**
 * @param {Node} node
 * @returns {string}
 */
function serializeNode(node) {
  switch (node.type) {
    case 'text':
      return node.content;
    case 'comment':
      return node.content;
    case 'raw':
      return node.content;
    case 'element':
      return serializeElement(node);
    default:
      return '';
  }
}

/**
 * @param {Node} node
 * @returns {string}
 */
function serializeElement(node) {
  const attrStr = attrsToHtml(node.attrs || {});
  const open = `<${node.tag}${attrStr ? ' ' + attrStr : ''}>`;

  // Void elements that don't have closing tags
  if (VOID_TAGS.has(node.tag)) {
    return open;
  }

  if (node.selfClosing && node.children.length === 0) {
    return `<${node.tag}${attrStr ? ' ' + attrStr : ''}/>`;
  }

  const children = (node.children || []).map(serializeNode).join('');
  return `${open}${children}</${node.tag}>`;
}

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * @param {Record<string, string>} attrs
 * @returns {string}
 */
function attrsToHtml(attrs) {
  return Object.entries(attrs)
    .map(([k, v]) => (v === '' ? k : `${k}="${v}"`))
    .join(' ');
}
