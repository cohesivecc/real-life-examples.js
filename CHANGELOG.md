# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-09-25

### Added

- `rle-selection-text="<group>"` replaces an element's text with the selected
  value for that group, restoring its authored text as a placeholder when
  empty. Useful for dropdown toggle labels and summary lines.
- `rle-selection-state="<group>"` adds `is-selected` to an element once that
  group has a value.
- Both bindings are resolved page-wide, so they can sit outside
  `rle-container`.

## [0.2.0] - 2026-09-15

### Changed

- Selection parameters are now discovered from the DOM instead of being
  hard-coded. Every distinct `rle-selection-group` value in the container
  becomes a required selection, and example links are matched on one
  `rle-<group>` attribute per group. Sites can use any number of parameters.
- The continue button is disabled on load and only enabled once every
  discovered group has a selection.
- The analytics `event_category` is now all selected values joined with ` > `
  in group order, rather than a fixed coverage tier and level of care pair.
- Selection highlighting filters on attribute values in JavaScript rather than
  building attribute selectors, so values containing quotes no longer break
  matching.
- The "no example" alert now distinguishes missing selections from a
  combination with no tagged link.

### Compatibility

- Existing two-parameter sites tagged for 0.1.0 work without retagging,
  provided the button groups are named exactly `coverage-tier` and
  `level-of-care`. In 0.1.0 any group other than `coverage-tier` was treated
  as the level of care; now the group name must match the link attribute
  (`rle-<group>`) exactly.
- Analytics category order now follows the DOM order of the option groups.
- The continue button is forced to `is-disabled` on load by the library.

## [0.1.0] - 2025-08-25

### Added

- Initial release. Two fixed selection parameters (coverage tier and level of
  care), hidden example links tagged with `rle-coverage-tier` and
  `rle-level-of-care`, on-demand fetching of slide content into a Webflow
  slider, optional language filtering, and per-slide `gtag` tracking.

[Unreleased]: https://github.com/cohesivecc/real-life-examples.js/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/cohesivecc/real-life-examples.js/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cohesivecc/real-life-examples.js/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cohesivecc/real-life-examples.js/releases/tag/v0.1.0
