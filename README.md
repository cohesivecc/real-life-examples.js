# Real Life Examples (RLE)

A small jQuery library for Webflow sites that lets a visitor pick from a set of
options (for example a coverage tier and a level of care) and then see a slider
of "real life example" content matching that combination. The content itself
lives on other Webflow pages and is fetched on demand.

The library knows nothing about *what* the options are. Every selection
parameter, and every example link, is described entirely with attributes in the
Webflow DOM. Adding a new parameter for a client is a tagging task, not a code
change.

## Installation

Include jQuery (Webflow already does) and load the library from jsDelivr,
pinned to a release tag, in the page's custom code before `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/cohesivecc/real-life-examples.js@0.3.0/real-life-examples.js"></script>
```

Include it once per page. A second copy will double-bind the click handlers.

## Tagging convention

All hooks are custom attributes set in the Webflow Designer. Attribute values
that are just `true` are placeholders; only the attribute name matters.

### Structure

| Attribute | On | Purpose |
|---|---|---|
| `rle-container` | Wrapper div | Root of the component. Optionally add `rle-language="en"` to filter fetched slides by language. |
| `rle-menu` | Div | The selection screen. Hidden once an example is shown. |
| `rle-slider` | Webflow Slider | Receives the fetched slides. |
| `rle-continue-button` | Button | Shows the example. The library adds/removes the `is-disabled` class. |
| `rle-restart` | Button | Returns to the menu. |
| `rle-preloader` | Div | Shown while content is fetched. |

### Selection options

Each clickable choice is a div with three attributes:

```html
<div rle-selection-option="true"
     rle-selection-group="coverage-tier"
     rle-selection-value="Employee Only">...</div>
```

- `rle-selection-group` names the parameter. Every distinct group found in the
  container becomes a required selection.
- `rle-selection-value` is the value that choice sets.
- The library toggles `is-selected` on the option and on any child tagged
  `rle-selection-icon`.

### Showing selected values

Two optional attributes reflect selections elsewhere in the UI. Both take a
group name as their value, and both work anywhere on the page, including
outside `rle-container`.

| Attribute | Effect |
|---|---|
| `rle-selection-text="<group>"` | The element's text is replaced with the selected value for that group. The text authored in Webflow is kept as the placeholder until a value is chosen. |
| `rle-selection-state="<group>"` | The element gets the `is-selected` class once that group has a value. |

For a Webflow dropdown, put `rle-selection-state` on the dropdown (or its
toggle) and `rle-selection-text` on the toggle's label:

```html
<div class="dropdown_component w-dropdown" rle-selection-state="company">
  <div class="w-dropdown-toggle">
    <div class="button_text" rle-selection-text="company">Company</div>
  </div>
  <nav class="w-dropdown-list">
    <div rle-selection-option="true" rle-selection-group="company"
         rle-selection-value="Herff Jones">...</div>
  </nav>
</div>
```

The same group can be bound to as many elements as you like, for example a
summary line above the slider. Put `rle-selection-text` on an element with no
children, since its contents are replaced with plain text.

### Example links

Each example is a (hidden) link, usually rendered from a CMS collection list,
whose `href` points at the page holding the slides. It carries one attribute
per selection group, named `rle-<group>`:

```html
<a rle-example="true"
   rle-coverage-tier="Employee Only"
   rle-level-of-care="Fewer Medical Expenses"
   href="/examples/employee-only-fewer">
</a>
```

A link matches when every group on the page has an equal attribute on the
link. Links missing a group's attribute never match.

### Example content pages

The fetched page must contain a list tagged `rle-slides="list"` (optionally
with `rle-language="..."`) whose children are tagged `rle-slide`. Slides with
Webflow's `w-condition-invisible` class are skipped.

## Behaviour

1. On load, the library discovers the selection groups and disables the
   continue button.
2. Each click records the selection for its group and re-evaluates the button.
   It enables only when every group has a value.
3. Continue finds the matching example link, fetches its `href`, extracts the
   slides, injects them into the slider, and redraws it.
4. Each slide viewed fires a `gtag` event named `real_life_examples_<language>`
   with the selected values joined by ` > ` as the category.

## Releasing

1. Update `CHANGELOG.md` and move Unreleased items under a new version.
2. Commit, then tag: `git tag vX.Y.Z && git push --tags`.
3. Update each client's script tag to the new `@X.Y.Z`. jsDelivr may cache a
   tag for up to 24 hours on first request; purge at
   `https://purge.jsdelivr.net/gh/cohesivecc/real-life-examples.js@X.Y.Z/real-life-examples.js`
   if needed.

## Development

There is no build step. The file is loaded as-is. A quick syntax check:

```sh
node --check real-life-examples.js
```

For behavioural testing, load a client page's HTML into jsdom with jQuery and
exercise the clicks. See `CLAUDE.md` for the harness pattern.
