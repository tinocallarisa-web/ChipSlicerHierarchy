# Changelog

All notable changes to Chip Slicer Hierarchy are documented here.

## [1.0.0.3] - 2026-08-26

### Security

- Image URL sanitization: the Images data role now only accepts Base64 data URIs
  (`data:image/*;base64,...`). External URLs (`http://`, `https://`, `blob:`, etc.)
  are silently rejected at parse time and never reach `img.src`. This eliminates
  unauthorized outbound HTTP requests and satisfies the AppSource CSP/sanitization
  requirement raised in certification review.

### Documentation

- Tips & Hints: new section "Images — Format Required & How to Generate Them" with
  four methods (Power Query, Python script, DAX/Power Query SVG, quick rules table).
- Troubleshooting: corrected the "Images not showing" entry, which previously
  stated that externally reachable URLs were required (the opposite of the current behavior).

## [1.0.0.2] - 2026-08-22

### Fixed

- Context menu added on empty space (root-container `contextmenu` handler) in
  addition to the existing per-chip menu, as required by certification feedback.

## [1.0.0.1] - 2026-08-17

### Added
- Image chips: optional image per hierarchy level (Images data role)
- Value badges: optional measure shown as a badge on each chip, with
  compact/number/currency/percent formatting

### Documentation
- Full certification, tips & hints, website product page, and YouTube
  material published, including the demo video
- Demo video: https://www.youtube.com/watch?v=Wt5CktHwN44

## [1.0.0.0] - 2026-08-17

### Added
- Initial release: hierarchical chip/pill slicer with drill-down filtering across
  Category → SubCategory → Product (up to 3 levels)
- Multi-select and leaf-only selection modes (Pro)
- Independent per-level color theming (inactive / active / parent-of-selection)
- Search box (Pro), auto-collapse siblings (Pro), configurable reset button (Pro)
- Free tier: 2 hierarchy levels, up to 20 values per level, single-select

### Documentation
- Privacy policy, terms of use, and README published
