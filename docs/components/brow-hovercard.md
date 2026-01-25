# brow-hovercard

A hovercard component that shows rich content on hover. Unlike tooltips, hovercards are interactive and can contain links, buttons, and other content.

## Basic Usage

Use the `slot="trigger"` attribute on the element that should trigger the hovercard.

```html example
<brow-hovercard>
  <a slot="trigger" href="/user/alice">Alice Chen</a>
  <h4>Alice Chen</h4>
  <p>Software Engineer at Acme Corp</p>
  <brow-button size="sm">View Profile</brow-button>
</brow-hovercard>
```

## Placement

Use the `placement` attribute to position the hovercard. Default is `bottom`.

```html example
<brow-hovercard placement="bottom">
  <brow-button slot="trigger">Bottom</brow-button>
  <p>This hovercard appears below the trigger.</p>
</brow-hovercard>
<brow-hovercard placement="right">
  <brow-button slot="trigger">Right</brow-button>
  <p>This hovercard appears to the right.</p>
</brow-hovercard>
```

## Inline Text

For inline text within a paragraph, the hovercard renders inline. Span triggers automatically get a dotted underline, pointer cursor, and `tabindex="0"` for keyboard accessibility.

```html example
<p>
  Our team uses <brow-hovercard>
    <span slot="trigger">React</span>
    A JavaScript library for building user interfaces.
    <a href="https://react.dev">Learn more</a>
  </brow-hovercard> for the frontend.
</p>
```

## Plain Style

Use the `plain` attribute to remove the dotted underline from span triggers.

```html example
<brow-hovercard plain>
  <span slot="trigger">Hover for details</span>
  <p>Content without underline indicator.</p>
</brow-hovercard>
```

## Delay

Control how long before the hovercard appears with the `delay` attribute (in milliseconds). Default is 300ms.

```html example
<brow-hovercard delay="100">
  <brow-button slot="trigger">Quick Show</brow-button>
  <p>This hovercard appears after only 100ms.</p>
</brow-hovercard>
```

## Interactive Content

Hovercards stay open while you interact with their content, including when keyboard focus moves into the card.

```html example
<brow-hovercard>
  <span slot="trigger">Hover for options</span>
  <h4>Quick Actions</h4>
  <brow-button size="sm">Edit</brow-button>
  <brow-button size="sm" variant="ghost">Delete</brow-button>
</brow-hovercard>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `placement` | `string` | `bottom` | Position: `top`, `bottom`, `left`, `right` |
| `delay` | `number` | `300` | Show delay in milliseconds |
| `plain` | `boolean` | `false` | Remove dotted underline from span triggers |

## Slots

| Slot | Description |
|------|-------------|
| `trigger` | The element that triggers the hovercard on hover/focus |
| (default) | The hovercard content |

## CSS Parts

| Part | Description |
|------|-------------|
| `trigger` | The trigger wrapper |
| `layer` | The popover layer (transparent wrapper for positioning) |
| `card` | The hovercard container |

## Styling

```css
/* Custom hovercard styling */
brow-hovercard::part(card) {
  max-width: 400px;
  background: var(--color-surface);
}
```

## Methods

| Method | Description |
|--------|-------------|
| `show()` | Programmatically show the hovercard |
| `hide()` | Programmatically hide the hovercard |

## Accessibility

- Sets `aria-haspopup="dialog"` on the trigger wrapper
- Press Escape to close the hovercard
- Supports both mouse hover and keyboard focus
- Focus is tracked when tabbing into the hovercard content
