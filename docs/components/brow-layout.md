# brow-layout

TODO: Add component description.

## Basic Usage

```html example
<brow-layout height="20rem">
  <brow-section padding="space-3" slot="header" divider="bottom">
    Header
  </brow-section>
  <brow-section padding="space-3" slot="start">
    Left panel
  </brow-section>
  <brow-section padding="space-3" slot="content">
    Content
  </brow-section>
  <brow-section padding="space-3" variant="muted" slot="end" divider="start">
    Right panel
  </brow-section>
  <brow-section padding="space-3" slot="footer" divider="top">
    Footer
  </brow-section>
</brow-layout>
```

## Nested layouts

```html example
<brow-section padding="space-2" variant="muted" height="20rem">
  <brow-layout>
    <brow-section padding="space-3" slot="header" height="auto">
      Header
    </brow-section>
    <brow-section padding="space-3" slot="start" width="10rem">
      Left panel
    </brow-section>
    <brow-card slot="content" height="100%">
      <brow-layout>
        <brow-section padding="space-3" slot="header" divider="bottom">
          Header
        </brow-section>
        <brow-section padding="space-3" slot="content">
          Content
        </brow-section>
        <brow-section padding="space-3" slot="footer" divider="top">
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

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The main container element |
