# brow-table

A data table that renders rows from child elements. Supports headers, custom column templates, footers, and empty states.

## Basic Usage

Columns are inferred from the first row's data attributes.

```html example
<brow-table>
  <brow-table-row data-name="Alice" data-role="Admin"></brow-table-row>
  <brow-table-row data-name="Bob" data-role="Editor"></brow-table-row>
  <brow-table-row data-name="Carol" data-role="Viewer"></brow-table-row>
</brow-table>
```

## With Header

Use `brow-table-header` for explicit column labels and ordering.

```html example
<brow-table>
  <brow-table-header data-name="Full Name" data-role="Role" data-status="Status"></brow-table-header>
  <brow-table-row data-name="Alice" data-role="Admin" data-status="Active"></brow-table-row>
  <brow-table-row data-name="Bob" data-role="Editor" data-status="Active"></brow-table-row>
  <brow-table-row data-name="Carol" data-role="Viewer" data-status="Pending"></brow-table-row>
</brow-table>
```

## Striped Rows

```html example
<brow-table striped>
  <brow-table-header data-id="ID" data-name="Name" data-email="Email"></brow-table-header>
  <brow-table-row data-id="1" data-name="Alice" data-email="alice@example.com"></brow-table-row>
  <brow-table-row data-id="2" data-name="Bob" data-email="bob@example.com"></brow-table-row>
  <brow-table-row data-id="3" data-name="Carol" data-email="carol@example.com"></brow-table-row>
  <brow-table-row data-id="4" data-name="Dan" data-email="dan@example.com"></brow-table-row>
</brow-table>
```

## Bordered

```html example
<brow-table bordered>
  <brow-table-header data-item="Item" data-qty="Qty" data-price="Price"></brow-table-header>
  <brow-table-row data-item="Widget" data-qty="10" data-price="$5.00"></brow-table-row>
  <brow-table-row data-item="Gadget" data-qty="5" data-price="$12.00"></brow-table-row>
</brow-table>
```

## Compact

```html example
<brow-table compact>
  <brow-table-header data-code="Code" data-description="Description"></brow-table-header>
  <brow-table-row data-code="A1" data-description="First item"></brow-table-row>
  <brow-table-row data-code="A2" data-description="Second item"></brow-table-row>
  <brow-table-row data-code="A3" data-description="Third item"></brow-table-row>
</brow-table>
```

## With Footer

Use `brow-table-footer` for totals or summaries.

```html example
<brow-table>
  <brow-table-header data-item="Item" data-price="Price"></brow-table-header>
  <brow-table-row data-item="Widget" data-price="$10.00"></brow-table-row>
  <brow-table-row data-item="Gadget" data-price="$25.00"></brow-table-row>
  <brow-table-row data-item="Gizmo" data-price="$15.00"></brow-table-row>
  <brow-table-footer data-item="Total" data-price="$50.00"></brow-table-footer>
</brow-table>
```

## Empty State

Use `brow-table-empty` to show a message when there are no rows.

```html example
<brow-table>
  <brow-table-header data-name="Name" data-status="Status"></brow-table-header>
  <brow-table-empty>No records found.</brow-table-empty>
</brow-table>
```

## Custom Column Templates

Use `brow-table-column` with template syntax for custom cell rendering. The `field` attribute specifies which column to customize.

```html example
<brow-table>
  <brow-table-header data-name="Name" data-status="Status"></brow-table-header>
  <brow-table-column field="status">
    <brow-button disabled>{{status}}</brow-button>
  </brow-table-column>
  <brow-table-row data-name="Alice" data-status="Active"></brow-table-row>
  <brow-table-row data-name="Bob" data-status="Pending"></brow-table-row>
</brow-table>
```

### Template Syntax

| Syntax | Description |
|--------|-------------|
| `{{property}}` | Inserts the value with HTML escaped (safe for user content) |
| `{{{property}}}` | Inserts the value as raw HTML (use for trusted content only) |

Any `data-*` attribute from the row can be referenced by its camelCase name. For example, `data-first-name` becomes `{{firstName}}`.

## Column Options

Use `brow-table-column` to set alignment and width for specific columns.

```html example
<brow-table>
  <brow-table-header data-item="Item" data-qty="Quantity" data-price="Price"></brow-table-header>
  <brow-table-column field="qty" align="center" width="100px"></brow-table-column>
  <brow-table-column field="price" align="end" width="100px"></brow-table-column>
  <brow-table-row data-item="Widget" data-qty="10" data-price="$5.00"></brow-table-row>
  <brow-table-row data-item="Gadget" data-qty="5" data-price="$12.00"></brow-table-row>
  <brow-table-row data-item="Gizmo" data-qty="3" data-price="$8.00"></brow-table-row>
  <brow-table-footer data-item="Total" data-qty="18" data-price="$134.00"></brow-table-footer>
</brow-table>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `field` | `string` | required | Which column to configure |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Text alignment |
| `width` | `string` | `'auto'` | Column width (any CSS value) |

## Plugins

Plugins extend the table with additional functionality. Import the plugins you need and add them as child elements.

### Sorting

Click column headers to sort. Add `sortable` to `brow-table-column` to enable. Use `sortable="numeric"` or `sortable="date"` for type-aware sorting.

```html example
<brow-table>
  <brow-table-sort field="name" direction="asc"></brow-table-sort>
  <brow-table-header data-name="Name" data-age="Age" data-joined="Joined"></brow-table-header>
  <brow-table-column field="name" sortable></brow-table-column>
  <brow-table-column field="age" sortable="numeric" align="end" width="80px"></brow-table-column>
  <brow-table-column field="joined" sortable="date" width="120px"></brow-table-column>
  <brow-table-row data-name="Alice" data-age="34" data-joined="2023-01-15"></brow-table-row>
  <brow-table-row data-name="Bob" data-age="28" data-joined="2023-03-22"></brow-table-row>
  <brow-table-row data-name="Carol" data-age="42" data-joined="2022-11-08"></brow-table-row>
</brow-table>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `field` | `string` | - | Currently sorted field |
| `direction` | `'asc' \| 'desc'` | `'asc'` | Sort direction |

### Selection

Add checkboxes for row selection. Use `row-click` to allow clicking anywhere on a row to toggle.

```html example
<brow-table>
  <brow-table-select mode="multi" key="id" row-click></brow-table-select>
  <brow-table-header data-name="Name" data-role="Role"></brow-table-header>
  <brow-table-row data-id="1" data-name="Alice" data-role="Admin" selected></brow-table-row>
  <brow-table-row data-id="2" data-name="Bob" data-role="Editor"></brow-table-row>
  <brow-table-row data-id="3" data-name="Carol" data-role="Viewer"></brow-table-row>
  <brow-table-row data-id="4" data-name="System" data-role="Internal" no-select></brow-table-row>
</brow-table>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `'single' \| 'multi'` | `'multi'` | Selection mode |
| `key` | `string` | - | Data attribute for row identifier |
| `row-click` | `boolean` | `false` | Click anywhere on row to toggle |
| `cascade` | `boolean` | `false` | With tree, selecting parent selects children |

Row attributes: `selected` (state), `no-select` (hide checkbox), `select-disabled` (disable checkbox).

### Pagination

Client-side pagination with navigation controls.

```html example
<brow-table>
  <brow-table-paginate page-size="3" page="1"></brow-table-paginate>
  <brow-table-header data-name="Name" data-email="Email"></brow-table-header>
  <brow-table-row data-name="Alice" data-email="alice@example.com"></brow-table-row>
  <brow-table-row data-name="Bob" data-email="bob@example.com"></brow-table-row>
  <brow-table-row data-name="Carol" data-email="carol@example.com"></brow-table-row>
  <brow-table-row data-name="Dan" data-email="dan@example.com"></brow-table-row>
  <brow-table-row data-name="Eve" data-email="eve@example.com"></brow-table-row>
  <brow-table-row data-name="Frank" data-email="frank@example.com"></brow-table-row>
  <brow-table-row data-name="Grace" data-email="grace@example.com"></brow-table-row>
</brow-table>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `page-size` | `number` | `10` | Rows per page |
| `page` | `number` | `1` | Current page (1-indexed) |

### Tree

Hierarchical rows with expand/collapse. Rows reference their parent via a data attribute. Tree controls (toggle + indentation) are injected into the specified column. Use `row-click` to allow clicking anywhere on a parent row to toggle.

```html example
<brow-table>
  <brow-table-tree id-key="id" parent-key="parent" field="name" row-click></brow-table-tree>
  <brow-table-header data-name="Name" data-size="Size"></brow-table-header>
  <brow-table-row data-id="1" data-name="Documents" data-size="--" expanded></brow-table-row>
  <brow-table-row data-id="2" data-parent="1" data-name="Report.pdf" data-size="2.4 MB"></brow-table-row>
  <brow-table-row data-id="3" data-parent="1" data-name="Notes.txt" data-size="12 KB"></brow-table-row>
  <brow-table-row data-id="4" data-name="Images" data-size="--" expanded></brow-table-row>
  <brow-table-row data-id="5" data-parent="4" data-name="Photo.jpg" data-size="3.1 MB"></brow-table-row>
  <brow-table-row data-id="6" data-parent="4" data-name="Logo.png" data-size="156 KB"></brow-table-row>
</brow-table>
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `id-key` | `string` | `'id'` | Data attribute for row identity |
| `parent-key` | `string` | `'parent'` | Data attribute for parent reference |
| `field` | `string` | first column | Column to inject tree controls into |
| `row-click` | `boolean` | `false` | Click anywhere on parent row to toggle |

Row attributes: `expanded` (state) to show/hide children.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `striped` | `boolean` | `false` | Alternate row backgrounds |
| `bordered` | `boolean` | `false` | Add borders between cells |
| `compact` | `boolean` | `false` | Reduce cell padding |

## Child Elements

| Element | Description |
|---------|-------------|
| `brow-table-header` | Defines column headers via `data-*` attributes |
| `brow-table-row` | A data row with `data-*` attributes for values |
| `brow-table-column` | Custom cell template for a field |
| `brow-table-footer` | Footer row for totals/summaries |
| `brow-table-empty` | Content shown when no rows exist |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The `<table>` element |
| `head` | The `<thead>` element |
| `body` | The `<tbody>` element |
| `foot` | The `<tfoot>` element |
| `empty` | The empty state container |
