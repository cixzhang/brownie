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

Configure margin and padding using spacing units. Adherance to spacing
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
| `height` | `string` | `auto` | Set the height of the section |
| `width` | `string` | `auto` | Set the width of the section |
| `padding` | `'space-0' 'space-0_5' 'space-1' 'space-1_5' 'space-2' 'space-2_5' 'space-3' 'space-4' 'space-5' 'space-6' 'space-8' 'space-10' 'space-12'` | `layout-padding` or `space-3` | Sets padding on the section. If the section is inside a `brow-layout`, it will adopt the padding applied to the layout by default. Up to 4 paddings can be set for each side of the section using the same notation as the padding option in CSS (`<vertical> <horizontal>` `<top> <right> <bottom> <left>`)|
