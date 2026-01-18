# brow-section

Section is a borderless container intended to fit within `<brow-layout>` slots.

## Basic Usage

```html example
<brow-section>Content</brow-section>
```

## Variants

Use the `variant` attribute to change background of the section.

```html example
<brow-section>Default</brow-section>
<brow-section variant="muted">Muted</brow-section>
```

## Paddings

Configure margin and padding using spacing units. Adherence to spacing
units over arbitrary values helps your app feel consistent and cohesive,
maintaining a consistent rhythm.

```html example
<brow-section variant="muted" padding="space-2">2 unit padding</brow-section>
<brow-section variant="muted" padding="space-4">4 unit padding</brow-section>
<brow-section variant="muted" padding="space-8">8 unit padding</brow-section>
<brow-section variant="muted" padding="space-3 space-4">
  3 unit vertical, 4 unit horizontal
</brow-section>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `'muted' 'surface'` | -- | Visual style for the background. By default, sections are transparent |
| `divider` | `'all' 'top' 'bottom' 'start' 'end' 'inline' 'block'` | -- | Applies dividers to the section |
| `height` | `string` | `100%` | Set the height of the section |
| `width` | `string` | `100%` | Set the width of the section |
| `padding` | `'space-0'` `'space-0_5'` `'space-1'` ... `'space-12'` | `layout-padding` | Sets padding on the section. Defaults to the parent `brow-layout`'s padding if present. Up to 4 values can be set for each side using CSS shorthand notation (`<vertical> <horizontal>` or `<top> <right> <bottom> <left>`) |
