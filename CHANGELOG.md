# Changelog

All notable changes to Chip Slicer Hierarchy are documented here.

## [1.1.0.0] - 2026-09-10

### Added

- **Value heatmap (Pro).** With a measure in the Values well, each chip is tinted
  between two colours according to its value. The scale is normalised **per level**,
  so a child is compared against its siblings and not against the top of the
  hierarchy — otherwise every chip below the first level collapses to the same
  colour. Chip text switches between dark and light by WCAG relative luminance, so
  the label stays readable at both ends of the scale.
- **Search highlighting and result count (Pro).** Matches are marked inside the chip
  label and the number of results is shown, so an empty hierarchy reads as "no
  matches" rather than as a broken visual.
- `--free` mode in `build-test.js`, which builds with the real Free tier under a
  separate guid. Without it the licensing path cannot be tested at all: with the
  real guid Power BI serves the version installed from AppSource.

### Changed

- **A Pro setting now leads somewhere.** Turning on a Pro feature without a licence
  raises Power BI's own notification, which carries the link to obtain one. The
  setting is kept and applies as soon as the licence is active.
- Removed the in-visual "Search requires Pro" notice. It was licensing UI of our own,
  which Microsoft's guidance advises against, and it was a dead end: grey text with
  nothing to click.
- The setting and its card are now named **Search (Pro)**. The default stays `false`
  on purpose — defaulting to `true` would leave a free user with no search box and no
  explanation.
- `notifyLicenseRequired` is raised while any Pro setting is on without a licence.
  This covers the expired trial, where the user changes nothing and the feature
  disappears on its own.

### Fixed

- **Licence check accepted any plan.** `spIdentifier` was never compared, so any
  active plan the user held counted as this visual's. Harmless while the offer has a
  single plan, and wrong the moment it has two.
- **A licence in its payment grace period was treated as absent.** `Warning` is now
  accepted alongside `Active`: a paying customer must not lose features while a
  billing problem is resolved.
- **Publish to Web, embedding and PDF export asked a paying customer to buy.** In
  those environments a licence cannot be resolved, so a Pro user read as Free.
  `isLicenseUnsupportedEnv` and `isLicenseInfoAvailable` are now read and no
  notification is raised.
- **Bookmarks did not restore the selection.** The restore ran only on first load, so
  a bookmark applied later left the chips showing the previous selection while the
  report was filtered by another — and clearing filters from outside left chips marked
  with nothing behind them.
- **`supportsHighlight` was declared and not implemented.** Chips outside a
  cross-highlight are now dimmed; a parent stays lit while any of its children is.
- **`allowInteractions` was not checked** before selecting. Power BI sets it to false
  during export and in some read modes, where selecting would change the report behind
  the user's back.

### Security

- No `innerHTML` anywhere in the visual, and no lint suppression of
  `no-inner-outer-html`. Labels, including search highlighting, are built with
  `createElement` and text nodes.

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
