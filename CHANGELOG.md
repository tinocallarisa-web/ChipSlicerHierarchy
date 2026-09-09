# Changelog

All notable changes to Chip Slicer Hierarchy are documented here.

## [1.0.0.4] - 2026-09-09

### Fixed

- Support URL: `supportUrl` pointed to `https://tcviz.com/support`, which returns 404.
  It now points to the GitHub Pages support page, which is the one actually served.
- Terms of Use: the published page was truncated mid-sentence and had no closing tags.
  Rewritten in full.

### Changed

- Terms of Use now describe the tiers as they are actually implemented. The previous
  text claimed the Free tier was limited to 2 hierarchy levels and 20 values per level,
  with multi-select and custom colours disabled, and listed those as Pro features. None
  of that was enforced in the code. The only Pro-gated feature is, and has always been,
  the in-visual **search box** — which the previous text did not mention at all.
  **No functionality changes for any user:** this corrects the description, not the product.

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
