# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

A single-file jQuery library (`real-life-examples.js`) embedded on client
Webflow sites via jsDelivr. It drives a "pick options, see matching example
slides" interaction. There is no build, no bundler, no test runner, and no
package.json in the repo. Client sites load the raw file by git tag.

## Hard rules

- **No hard-coded selection parameters.** The library must not know about
  "coverage-tier", "level-of-care", "company", or any other group name.
  Groups are discovered from `rle-selection-group` attributes in the DOM and
  example links are matched via `rle-<group>` attributes. Any change that
  reintroduces a named parameter is wrong.
- **Keep it a single plain JS file.** Clients include it with one script tag.
  No modules, no transpilation, no dependencies beyond jQuery and Webflow's
  runtime, which the host page already provides.
- **Backwards compatible tagging.** Existing 2-parameter client sites tagged for
  v0.1.0 must keep working without retagging. Do not rename existing
  attributes.
- **Do not commit or tag unless asked.** Releases are pinned by tag on the CDN,
  so a tag is a deployment.

## Conventions

- Wrap everything in `Webflow.push(function () { ... })` so it runs after
  Webflow's runtime initialises.
- Use jQuery for DOM work, matching the existing style.
- Avoid building attribute selectors from user-authored values (option values
  contain `+`, `(`, `<`, `$`, `,`). Filter with `.filter()` comparing
  `.attr()` instead.
- When a Webflow-controlled class matters (`is-disabled`, `is-selected`,
  `w-slide`, `w-condition-invisible`), keep the name exactly as Webflow
  renders it.

## Verifying changes

Syntax check:

```sh
node --check real-life-examples.js
```

Behavioural check: fetch a client page with `curl`, load it into jsdom, inject
jQuery inside the window, stub `gtag`, `alert`, and `Webflow.require`, then
eval the library and trigger clicks on `[rle-selection-option]` elements.
Assert on the `is-disabled` class of `[rle-continue-button]` and on the
matched example. Do this in the scratchpad directory, not the repo.

Known test page with four selection groups:
`https://lsc--mylscbenefits-com.webflow.io/system/rle-test`

## Releasing

Update `CHANGELOG.md`, commit, tag `vX.Y.Z`, push tags, then tell the user to
update client script tags to `@X.Y.Z`. See README for the jsDelivr purge URL.
