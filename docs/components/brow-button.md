# brow-button

A button component that renders as `<button>` or `<a>` depending on the `href` attribute.

## Basic Usage

```html example
<brow-button>Default Button</brow-button>
```

## Variants

Use the `variant` attribute to change the button style.

```html example
<brow-button variant="secondary">Secondary</brow-button>
<brow-button variant="primary">Primary</brow-button>
<brow-button variant="ghost">Ghost</brow-button>
```

## Disabled State

```html example
<brow-button disabled>Disabled</brow-button>
<brow-button variant="primary" disabled>Disabled Primary</brow-button>
```

## As Link

When `href` is provided, the button renders as an anchor element.

```html example
<brow-button href="/docs/index.html">Link Button</brow-button>
<brow-button href="/docs/index.html" variant="primary">Primary Link</brow-button>
```

## Dropdown Caret

Use the `caret` attribute to show a dropdown indicator. This is useful when using the button as a menu trigger.

```html example
<brow-button caret>Dropdown</brow-button>
<brow-button variant="primary" caret>Actions</brow-button>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `'primary' 'secondary' 'ghost'` | `'secondary'` | Visual style variant |
| `disabled` | `boolean` | `false` | Disables the button |
| `href` | `string` | - | When set, renders as an anchor element |
| `caret` | `boolean` | `false` | Shows a dropdown caret indicator |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The underlying button or anchor element |

## Styling

```css
/* Custom button styling */
brow-button::part(base) {
  border-radius: var(--radius-round);
  text-transform: uppercase;
}
```
