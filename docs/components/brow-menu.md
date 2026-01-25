# brow-menu

A dropdown menu component with keyboard navigation and accessibility support. Uses the Popover API for light dismiss behavior.

## Basic Usage

Use `slot="trigger"` on the element that should open the menu.

```html example
<brow-menu>
  <brow-button slot="trigger" caret>Actions</brow-button>
  <brow-menu-item value="edit">Edit</brow-menu-item>
  <brow-menu-item value="duplicate">Duplicate</brow-menu-item>
  <brow-menu-item value="archive">Archive</brow-menu-item>
</brow-menu>
```

## Placement

Use the `placement` attribute to position the menu. Default is `bottom-end`.

```html example
<brow-menu placement="bottom-start">
  <brow-button slot="trigger" caret>Bottom Start</brow-button>
  <brow-menu-item value="opt1">Option 1</brow-menu-item>
  <brow-menu-item value="opt2">Option 2</brow-menu-item>
</brow-menu>
```

## Item Variants

Menu items support variants for visual distinction.

```html example
<brow-menu>
  <brow-button slot="trigger" caret>Manage Item</brow-button>
  <brow-menu-item value="edit">Edit</brow-menu-item>
  <brow-menu-item value="move">Move</brow-menu-item>
  <brow-menu-item value="delete" variant="danger">Delete</brow-menu-item>
</brow-menu>
```

## Disabled Items

Individual items can be disabled.

```html example
<brow-menu>
  <brow-button slot="trigger" caret>File</brow-button>
  <brow-menu-item value="new">New</brow-menu-item>
  <brow-menu-item value="open">Open</brow-menu-item>
  <brow-menu-item value="save" disabled>Save (disabled)</brow-menu-item>
</brow-menu>
```

## Handling Selection

Listen for the `brow-select` event to handle item selection.

```html example
<brow-menu id="event-menu">
  <brow-button slot="trigger" caret>Choose Action</brow-button>
  <brow-menu-item value="copy">Copy</brow-menu-item>
  <brow-menu-item value="paste">Paste</brow-menu-item>
  <brow-menu-item value="cut">Cut</brow-menu-item>
</brow-menu>
<p id="event-output">Selected: none</p>
<script>
  document.getElementById('event-menu').addEventListener('brow-select', (e) => {
    document.getElementById('event-output').textContent = `Selected: ${e.detail.value}`;
  });
</script>
```

## brow-menu Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `placement` | `string` | `bottom-end` | Position: `bottom-start`, `bottom-end`, `top-start`, `top-end` |

## Slots

| Slot | Description |
|------|-------------|
| `trigger` | The element that opens the menu on click |
| (default) | Menu items |

## brow-menu-item Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `string` | - | Value dispatched in the select event |
| `disabled` | `boolean` | `false` | Item cannot be selected |
| `variant` | `string` | - | Visual variant (e.g., `danger`) |

## CSS Parts

### brow-menu

| Part | Description |
|------|-------------|
| `trigger` | The trigger wrapper |
| `layer` | The popover layer (transparent wrapper for positioning) |
| `menu` | The menu container |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `brow-select` | `{ value, item }` | Fired when a menu item is selected |

## Methods

### brow-menu

| Method | Description |
|--------|-------------|
| `open()` | Programmatically open the menu |
| `close()` | Programmatically close the menu |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Select focused item |
| `ArrowDown` | Focus next item |
| `ArrowUp` | Focus previous item |
| `Home` | Focus first item |
| `End` | Focus last item |
| `Escape` | Close menu |
| `Tab` | Close menu and move focus |

## Accessibility

- Trigger wrapper has `aria-haspopup="menu"` and `aria-expanded`
- Menu has `role="menu"`
- Items have `role="menuitem"`
- Supports full keyboard navigation
- Focus management with roving tabindex
