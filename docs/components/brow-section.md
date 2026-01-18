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
<brow-section variant="muted" padding="space-0">0 unit padding</brow-section>
<brow-section variant="muted" padding="space-2">2 unit padding</brow-section>
<brow-section variant="muted" padding="space-4">4 unit padding</brow-section>
<brow-section variant="muted" padding="space-8">8 unit padding</brow-section>
<brow-section variant="muted" padding="space-3 space-4">3 unit vertical, 4 unit horizontal</brow-section>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|

## Slots

| Slot | Description | Example Content |
|----- |-------------|-----------------|

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The main container element |
