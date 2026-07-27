# brow-layout

A composable layout with header, footer, start, end panels and content slots.

## Basic Usage

```html example
<brow-layout height="20rem">
  <brow-section slot="header" divider="bottom">
    Header
  </brow-section>
  <brow-section slot="start" divider="end">
    Left panel
  </brow-section>
  <brow-section slot="content">
    Content
  </brow-section>
  <brow-section slot="end" divider="start">
    Right panel
  </brow-section>
  <brow-section slot="footer" divider="top">
    Footer
  </brow-section>
</brow-layout>
```

## Adjusted Padding

```html example
<brow-layout height="20rem" padding="space-6">
  <brow-section slot="header" divider="bottom">
    Header
  </brow-section>
  <brow-section slot="start" divider="end">
    Left panel
  </brow-section>
  <brow-section slot="content">
    Content
  </brow-section>
  <brow-section slot="end" divider="start">
    Right panel
  </brow-section>
  <brow-section slot="footer" divider="top">
    Footer
  </brow-section>
</brow-layout>
```

## Nested layouts

```html example
<brow-section padding="space-2" variant="muted" height="20rem">
  <brow-layout>
    <brow-section slot="header" height="auto">
      Header
    </brow-section>
    <brow-section slot="start" width="10rem">
      Left panel
    </brow-section>
    <brow-card slot="content" height="100%" padding="space-0">
      <brow-layout>
        <brow-section slot="header" divider="bottom">
          Header
        </brow-section>
        <brow-section slot="content">
          Content
        </brow-section>
        <brow-section slot="footer" divider="top">
          Footer
        </brow-section>
      </brow-layout>
    </brow-card>
  </brow-layout>
</brow-section>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `height` | `string` | `100%` | Set the height of the layout to either fill the container or size relative to its children. If a non-`auto` height is provided, the layout will automatically include overflow handling in the content and panel slots |
| `width` | `string` | `100%` | Set the width of the layout |
| `padding` | `'space-0'` `'space-0_5'` `'space-1'` ... `'space-12'` | `space-3` | Sets the `--layout-padding` CSS variable, which child `brow-section` elements use as their default padding |

## Slots

| Slot | Recommended Content | Description |
|------|---------------------|-------------|
| `content` | `brow-section` | Main content in the layout. The `brow-layout` can accept a variety of content here but work best with `brow-section` |
| `header` | `brow-section` | Header. Appears on top of content and panels |
| `start` | `brow-section` | Left panel |
| `end` | `brow-section` | Right panel |
| `footer` | `brow-section` | Footer. Appears underneath content and panels |
