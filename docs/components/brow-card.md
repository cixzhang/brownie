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
| `padding` | `'space-0'` `'space-0_5'` `'space-1'` ... `'space-12'` | `space-4` | Sets padding on the card. Up to 4 values can be set for each side using CSS shorthand notation (`<vertical> <horizontal>` or `<top> <right> <bottom> <left>`) |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The main container element |
