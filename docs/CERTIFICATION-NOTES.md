# Certification Notes — Chip Slicer Hierarchy v1.0.0.4

## Short version (paste this into the Partner Center box)

Metadata-only fix. No code changes in this version.

1. `supportUrl` pointed to `https://tcviz.com/support`, which returns 404. It now points
   to `https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html`, the page
   actually served.
2. The published Terms of Use page was truncated mid-sentence and described licence tiers
   that were never implemented. It has been rewritten to match the code, and the support
   page has been rewritten to document the visual properly.

Licence: resolved via the official `IVisualLicenseManager` API only, async, never blocks
render. No external calls — the visual only reads the Power BI dataView (Categories,
Images, Values, Tooltips roles); no fetch, no local file access, no data persisted outside
the .pbix.

Free: the complete slicer — unlimited hierarchy levels and values, single and multi-select,
drill-down, auto-collapse, per-level colours, image chips, value badges, reset button,
keyboard activation, high contrast.
Pro: adds the in-visual search box. That is the only licence-gated feature.

URLs: Privacy https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html —
Terms https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html — Support
https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html — Video
https://www.youtube.com/watch?v=Wt5CktHwN44 —
Repo https://github.com/tinocallarisa-web/ChipSlicerHierarchy/tree/certification

Test: add fields to "Categories" in order — the field order is the hierarchy. Right-click
a chip and empty space; both show the context menu. Without a licence everything works
except the search box, which is replaced by a "Search requires Pro" notice.

---

## Full reference (repo copy — not for pasting)

Paste the short version into the "Notes for certification" field in Partner Center —
that field is cleared on every resubmission.

## What changed in 1.0.0.4

No source code changed. `pbiviz.json` (`supportUrl`, version), `package.json` (version,
which was also out of sync at 1.0.2), `terms.html`, `support.html` and `CHANGELOG.md`.

The previous Terms and support pages described a Free tier limited to 2 hierarchy levels
and 20 values per level, with multi-select and custom colours presented as paid features.
None of those limits existed in the code — `isPro` has only ever gated the search box,
which in turn was not mentioned. **The documentation was wrong, not the product**: no user
gains or loses functionality in this version.

The previous certification notes carried the same error, including testing steps that asked
the reviewer to confirm limits that do not exist. The testing instructions below have been
corrected accordingly.

## Repository

- Certification branch: `certification` (public, GitHub)
- https://github.com/tinocallarisa-web/ChipSlicerHierarchy/tree/certification

## Public URLs

| Page | URL |
|---|---|
| Privacy Policy | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html |
| Terms of Use | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html |
| Support | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html |
| Demo video | https://www.youtube.com/watch?v=Wt5CktHwN44 |

## Licence validation

- Uses the official Power BI `IVisualLicenseManager` API exclusively
  (`host.licenseManager` / `getAvailableServicePlans()`), via `powerbi-visuals-api` 5.x.
- No external server, no custom auth, no payment processing performed by the visual.
- Resolution is asynchronous and deferred (`setTimeout` + `.then()`), so it never blocks
  the initial render. The visual renders in Free mode first, then re-renders in Pro mode
  once/if the licence resolves — see `src/visual.ts`, `isPro` and the licence resolution
  block around lines 328–336.
- The Free tier has no watermark. The only gated feature is the search box; where it would
  appear, Free users see a "Search requires Pro" notice.

## Data access & privacy

- Reads only the data provided by Power BI through the standard categorical `dataView`
  (Categories, Images, Values, Tooltips roles defined in `capabilities.json`).
- No `fetch` / `XMLHttpRequest`, no reads from local files outside the Power BI sandbox,
  no data persisted outside the `.pbix` (formatting settings only, via `persistProperties`).
- The optional "Images" role accepts only Base64 data URIs (`data:image/*;base64,...`),
  validated by `isSafeImageUrl()` in `src/visual.ts` before assignment to `img.src`.
  External URLs, `blob:` URIs and any other scheme are rejected silently at parse time —
  the visual never makes an outbound HTTP request.

## Feature summary

### Free
- Unlimited hierarchy levels and values — the field order in "Categories" is the hierarchy
- Single-select, multi-select and leaf-only selection
- Expand / collapse, auto-collapse siblings, configurable reset button
- Per-level colours (inactive / active / parent-of-selection)
- Image chips, value badges, tooltips
- Chip styling: height, radius, font size, gap, padding, horizontal or vertical layout
- Keyboard activation, context menu, high-contrast support

### Pro
- In-visual search box, filtering chips across the whole hierarchy as you type

## Certification requirements checklist

- [x] `renderingStarted` / `renderingFinished` / `renderingFailed` called on every `update()` path
- [x] `supportsSynchronizingFilterState: true`
- [x] `supportsLandingPage`, `supportsKeyboardFocus`, `supportsMultiVisualSelection` set
- [x] `privileges: []` present in `capabilities.json`
- [x] Context menu on empty space — root-container `contextmenu` handler
- [x] Context menu on individual chips
- [x] Tooltips on every chip, via `host.tooltipService`
- [x] Privacy Policy and Terms of Use are separate pages, both reachable
- [x] Support page documents field wells, format pane, tiers and FAQ
- [x] Sample `.pbix` includes 13+ unique values and a Tips & Hints page
- [x] Image URL sanitization: `isSafeImageUrl()` rejects non-`data:` URIs before `img.src`
- [x] Version in `pbiviz.json` (1.0.0.4) matches this submission and is above the published 1.0.0.3

### Known gaps, declared openly

These are not claimed as implemented, and are scheduled for 1.1.0.0:

- `supportsHighlight: true` is declared in `capabilities.json`, but the visual does not
  currently dim chips in response to highlights from other visuals. As a slicer it drives
  filtering rather than receiving it, so this has no user-visible effect today.
- `host.allowInteractions` is not checked before selection.
- Keyboard support covers Tab focus plus Enter / Space activation. Arrow-key navigation
  between chips is not implemented, and the support page states this explicitly.
- Bookmarks: `registerOnSelectCallback` is not registered, so selection is not restored
  when a bookmark is applied from outside the visual.
- No report-tooltip (canvas tooltip page) support; standard tooltips only.

## Testing instructions

### Free tier
1. Import the visual into Power BI Desktop with no licence/plan assigned.
2. Add two or more fields to the "Categories" well. The field order defines the hierarchy:
   1st = level 1, 2nd = level 2, and so on. Levels are not capped.
3. Click a chip — confirm it filters the rest of the report.
4. Confirm multi-select, per-level colours, auto-collapse and the reset button all work.
   These are available without a licence.
5. Enable "Show search box" under Search — confirm a "Search requires Pro" notice appears
   in place of the search field. **This is the only difference between the tiers.**
6. Right-click on a chip and on empty space inside the visual — confirm the standard
   Power BI context menu appears in both cases.
7. Tab to a chip and press Enter or Space — confirm it selects.

### Pro tier
1. Assign a plan with the corresponding service plan entitlement.
2. Repeat the steps above and confirm the search box now renders instead of the notice.
3. Type in the search box — confirm chips are filtered across the whole hierarchy.
