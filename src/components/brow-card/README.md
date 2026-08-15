# brow-card

Container used for segmenting general content into a visible block.

## Basic Usage

```html example
<brow-card>Content</brow-card>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `height` | `string` | `auto` | Set the height of the card |
| `width` | `string` | `auto` | Set the width of the card |
| `padding` | `'spacing-0'` `'spacing-0-5'` `'spacing-1'` ... `'spacing-12'` | `spacing-4` | Sets padding on the card. Up to 4 values can be set for each side using CSS shorthand notation (`<vertical> <horizontal>` or `<top> <right> <bottom> <left>`) |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The main container element |
