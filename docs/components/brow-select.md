# brow-select

A custom select dropdown component with keyboard navigation, search, and accessibility support. Works with forms and supports option groups.

## Basic Usage

```html example
<brow-select name="country" value="us">
  <brow-option value="us">United States</brow-option>
  <brow-option value="uk">United Kingdom</brow-option>
  <brow-option value="ca">Canada</brow-option>
  <brow-option value="au">Australia</brow-option>
</brow-select>
```

## Placeholder

Customize the placeholder text shown when no option is selected.

```html example
<brow-select placeholder="Choose a color...">
  <brow-option value="red">Red</brow-option>
  <brow-option value="green">Green</brow-option>
  <brow-option value="blue">Blue</brow-option>
</brow-select>
```

## Option Groups

Organize options into labeled groups.

```html example
<brow-select name="timezone" placeholder="Select timezone...">
  <brow-option-group label="Americas">
    <brow-option value="est">Eastern Time</brow-option>
    <brow-option value="cst">Central Time</brow-option>
    <brow-option value="pst">Pacific Time</brow-option>
  </brow-option-group>
  <brow-option-group label="Europe">
    <brow-option value="gmt">GMT</brow-option>
    <brow-option value="cet">Central European</brow-option>
  </brow-option-group>
</brow-select>
```

## Searchable

Enable type-to-filter for long option lists.

```html example
<brow-select name="language" searchable placeholder="Search languages...">
  <brow-option value="en">English</brow-option>
  <brow-option value="es">Spanish</brow-option>
  <brow-option value="fr">French</brow-option>
  <brow-option value="de">German</brow-option>
  <brow-option value="it">Italian</brow-option>
  <brow-option value="pt">Portuguese</brow-option>
  <brow-option value="zh">Chinese</brow-option>
  <brow-option value="ja">Japanese</brow-option>
</brow-select>
```

## Disabled Options

Individual options can be disabled.

```html example
<brow-select name="plan">
  <brow-option value="free">Free</brow-option>
  <brow-option value="pro">Pro</brow-option>
  <brow-option value="enterprise" disabled>Enterprise (Contact Sales)</brow-option>
</brow-select>
```

## Disabled Select

The entire select can be disabled.

```html example
<brow-select name="locked" value="fixed" disabled>
  <brow-option value="fixed">This cannot be changed</brow-option>
</brow-select>
```

## Handling Changes

Listen for the `change` event to react to selection changes.

```html example
<brow-select name="size" id="size-select">
  <brow-option value="sm">Small</brow-option>
  <brow-option value="md">Medium</brow-option>
  <brow-option value="lg">Large</brow-option>
</brow-select>
<p id="size-output">Selected: none</p>
<script>
  document.getElementById('size-select').addEventListener('change', (e) => {
    document.getElementById('size-output').textContent = `Selected: ${e.detail.value}`;
  });
</script>
```

## Form Integration

The select creates a hidden input for form submission.

```html example
<form id="demo-form" onsubmit="event.preventDefault(); alert('Submitted: ' + new FormData(this).get('fruit'));">
  <brow-select name="fruit" value="apple">
    <brow-option value="apple">Apple</brow-option>
    <brow-option value="banana">Banana</brow-option>
    <brow-option value="orange">Orange</brow-option>
  </brow-select>
  <brow-button type="submit">Submit</brow-button>
</form>
```

## brow-select Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | - | Form field name |
| `value` | `string` | - | Currently selected value |
| `placeholder` | `string` | `Select...` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Required for form validation |
| `searchable` | `boolean` | `false` | Enable type-to-filter |

## brow-option Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `string` | - | Option value |
| `disabled` | `boolean` | `false` | Option cannot be selected |
| `selected` | `boolean` | `false` | Option is selected |

## brow-option-group Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | - | Group label text |

## CSS Parts

### brow-select

| Part | Description |
|------|-------------|
| `trigger` | The select trigger button |
| `layer` | The popover layer (transparent wrapper for positioning) |
| `listbox` | The dropdown listbox |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `change` | `{ value }` | Fired when selection changes |

## Methods

### brow-select

| Method | Description |
|--------|-------------|
| `open()` | Programmatically open the dropdown |
| `close()` | Programmatically close the dropdown |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open dropdown or select focused option |
| `ArrowDown` | Open dropdown or focus next option |
| `ArrowUp` | Focus previous option |
| `Home` | Focus first option |
| `End` | Focus last option |
| `Escape` | Close dropdown |
| `Tab` | Close dropdown and move focus |
| Type characters | Type-ahead to jump to matching option |

## Accessibility

- Trigger has `role="combobox"` with `aria-haspopup="listbox"`
- Dropdown has `role="listbox"`
- Options have `role="option"` with `aria-selected`
- Option groups have `role="group"` with `aria-labelledby`
- `aria-expanded` updates when opening/closing
- Full keyboard navigation support
