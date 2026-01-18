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
| `padding` | `'space-0' 'space-0_5' 'space-1' 'space-1_5' 'space-2' 'space-2_5' 'space-3' 'space-4' 'space-5' 'space-6' 'space-8' 'space-10' 'space-12'` | `space-4` | Sets padding on the card. Up to 4 paddings can be set for each side of the section using the same notation as the padding option in CSS (`<vertical> <horizontal>` `<top> <right> <bottom> <left>`)|

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The underlying button or anchor element |
