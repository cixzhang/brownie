#!/bin/bash

# Create a new Brownie component
# Usage: ./scripts/create-component.sh component-name

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <component-name>"
  echo "Example: $0 brow-card"
  exit 1
fi

NAME="$1"

# Validate name starts with brow-
if [[ ! "$NAME" =~ ^brow- ]]; then
  echo "Error: Component name must start with 'brow-'"
  exit 1
fi

# Convert to PascalCase for class name (e.g., brow-card -> BrownieCard)
CLASS_NAME=$(echo "brow-foo" | sed -E 's/(^|-)([a-z])/\U\2/g;s/-//g')

COMPONENT_FILE="src/components/${NAME}.js"
DOC_FILE="docs/components/${NAME}.md"

if [ -f "$COMPONENT_FILE" ]; then
  echo "Error: Component $NAME already exists at $COMPONENT_FILE"
  exit 1
fi

# Create component file
cat > "$COMPONENT_FILE" << EOF
import Brownie from '../core.js';

/**
 * TODO: Add component description
 * @element ${NAME}
 * @csspart base - The main container element
 */
export class ${CLASS_NAME} extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const shadow = /** @type {ShadowRoot} */ (this.shadowRoot);

    shadow.innerHTML = \`
      <style>
        :host {
          display: block;
        }

        [part="base"] {
          /* Component styles */
        }
      </style>
      <div part="base">
        <slot></slot>
      </div>
    \`;
  }
}

Brownie.register('${NAME}', ${CLASS_NAME});
EOF

# Create documentation file
cat > "$DOC_FILE" << EOF
# ${NAME}

TODO: Add component description.

## Basic Usage

\`\`\`html example
<${NAME}>Content</${NAME}>
\`\`\`

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|

## CSS Parts

| Part | Description |
|------|-------------|
| \`base\` | The main container element |
EOF

# Add to index.js
echo "export * from './components/${NAME}.js';" >> src/index.js

# Update registry.json
# Using node for JSON manipulation
node -e "
const fs = require('fs');
const registry = JSON.parse(fs.readFileSync('src/registry.json', 'utf8'));
registry.components.push({
  name: '${NAME}',
  path: './components/${NAME}.js',
  description: 'TODO: Add description'
});
fs.writeFileSync('src/registry.json', JSON.stringify(registry, null, 2) + '\n');
"

echo "Created component: ${NAME}"
echo "  - Component: ${COMPONENT_FILE}"
echo "  - Documentation: ${DOC_FILE}"
echo "  - Added to src/index.js"
echo "  - Added to src/registry.json"
echo ""
echo "Next steps:"
echo "  1. Edit ${COMPONENT_FILE} to implement the component"
echo "  2. Edit ${DOC_FILE} to document usage"
echo "  3. View at docs/component.html?component=${NAME}"
