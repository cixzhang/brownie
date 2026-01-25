# brow-tooltip

A tooltip component that shows text hints on hover or focus. Useful for providing additional context without cluttering the UI.

## Basic Usage

Wrap the trigger element with `brow-tooltip` and use the `text` attribute for the tooltip content.

```html example
<brow-tooltip text="Save your changes (Ctrl+S)">
  <brow-button>Save</brow-button>
</brow-tooltip>
```

## Placement

Use the `placement` attribute to position the tooltip. Default is `top`.

```html example
<brow-tooltip text="Top tooltip" placement="top">
  <brow-button>Top</brow-button>
</brow-tooltip>
<brow-tooltip text="Bottom tooltip" placement="bottom">
  <brow-button>Bottom</brow-button>
</brow-tooltip>
<brow-tooltip text="Left tooltip" placement="left">
  <brow-button>Left</brow-button>
</brow-tooltip>
<brow-tooltip text="Right tooltip" placement="right">
  <brow-button>Right</brow-button>
</brow-tooltip>
```

## Inline Text

For inline text within a paragraph, the tooltip renders inline. Span triggers automatically get a dotted underline, help cursor, and `tabindex="0"` for keyboard accessibility.

```html example
<p>
  The <brow-tooltip text="Application Programming Interface">
    <span>API</span>
  </brow-tooltip> allows you to integrate with our service.
</p>
```

## Plain Style

Use the `plain` attribute to remove the dotted underline from span triggers. Useful for truncated text tooltips where the underline would be distracting.

```html example
<brow-tooltip text="This is the full text that was truncated" plain>
  <span>This is the full...</span>
</brow-tooltip>
```

## Delay

Control how long before the tooltip appears with the `delay` attribute (in milliseconds). Default is 200ms.

```html example
<brow-tooltip text="This tooltip has a 500ms delay" delay="500">
  <brow-button>Hover for tooltip</brow-button>
</brow-tooltip>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | - | The tooltip text content |
| `placement` | `string` | `top` | Position: `top`, `bottom`, `left`, `right` |
| `delay` | `number` | `200` | Show delay in milliseconds |
| `plain` | `boolean` | `false` | Remove dotted underline from span triggers |

## CSS Parts

| Part | Description |
|------|-------------|
| `trigger` | The trigger wrapper |
| `layer` | The popover layer (transparent wrapper for positioning) |
| `tooltip` | The tooltip container |

## Styling

```css
/* Custom tooltip styling */
brow-tooltip::part(tooltip) {
  background: var(--color-accent);
  font-size: 0.75rem;
}
```

## Methods

| Method | Description |
|--------|-------------|
| `show()` | Programmatically show the tooltip |
| `hide()` | Programmatically hide the tooltip |

## Accessibility

- Sets `aria-describedby` on the trigger wrapper linking to the tooltip
- Tooltip has `role="tooltip"`
- Supports both mouse hover and keyboard focus
