# Certification Notes — Chip Slicer Hierarchy v1.0.0.2

## Short version (paste this into the Partner Center box)

Resubmission fix: added a context menu on empty space (root-container `contextmenu`
handler calling `selectionManager.showContextMenu()`), in addition to the existing
per-chip menu. See `src/visual.ts` constructor.

License: resolved via official `IVisualLicenseManager` API only, async, never blocks
render. No external calls — visual only reads the Power BI dataView (Categories,
Images, Values, Tooltips roles); no fetch, no local file access, no data persisted
outside the .pbix.

Free: 2 levels, up to 20 values/level, single-select, image chips, value badges.
Pro: 3 levels, unlimited values, multi-select, search, per-level colors, auto-collapse,
reset button.

URLs: Privacy https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html —
Terms https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html — Support
https://tcviz.com/support — Video https://www.youtube.com/watch?v=Wt5CktHwN44 —
Repo https://github.com/tinocallarisa-web/ChipSlicerHierarchy/tree/certification

Test: add fields to "Categories" in order (1st=Level 1, 2nd=Level 2, 3rd=Level 3),
optionally matching columns to "Images". Right-click a chip and empty space — both
show the context menu. Free caps at 2 levels/20 values; Pro unlocks the rest.

---

## Full reference (repo copy — not for pasting)

Paste this content into the "Notes for certification" field in Partner Center —
that field is cleared on every resubmission.

## Resubmission note

This version addresses the certification feedback: *"Your visual does not have a
context menu in empty space."* A right-click handler was added on the visual's
root container (in addition to the existing per-chip context menu) so that
right-clicking anywhere in the visual — including empty space — now shows the
standard Power BI context menu via `selectionManager.showContextMenu()`. See
`src/visual.ts`, constructor (around line 297).

## Repository

- Certification branch: `certification` (public, GitHub)
- https://github.com/tinocallarisa-web/ChipSlicerHierarchy/tree/certification

## Public URLs

| Page | URL |
|---|---|
| Privacy Policy | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html |
| Terms of Use | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html |
| Support | https://tcviz.com/support |
| Demo video | https://www.youtube.com/watch?v=Wt5CktHwN44 |

## License Validation

- Uses the official Power BI `IVisualLicenseManager` API exclusively (`host.licenseManager` /
  `getAvailableServicePlans()`), resolved via `powerbi-visuals-api` 5.x.
- No external server, no custom auth, no payment processing performed by the visual itself.
- License resolution is asynchronous and deferred (`setTimeout` + `.then()`), so it never
  blocks the initial render. The visual renders in Free mode first, then re-renders in Pro
  mode once/if the license resolves — see `src/visual.ts` (`isPro`, license resolution block
  around line 282–316).
- Free tier has no watermark and no artificial limitation beyond the documented feature gates.

## Data Access & Privacy

- The visual reads only the data provided by Power BI through the standard categorical
  `dataView` (Categories, Images, Values, Tooltips roles defined in `capabilities.json`).
- No `fetch`/`XMLHttpRequest` calls, no reads from local files outside the Power BI sandbox,
  no data persisted outside the `.pbix` (formatting settings only, via `persistProperties`).
- The optional "Images" data role expects image URLs already present in the user's own data
  model — the visual renders them as `<img src>` but does not fetch, cache, or transmit them
  anywhere itself.

## Feature Summary

### Free
- 2 hierarchy levels (Category → SubCategory), up to 20 values per level
- Single-select filtering
- Image chips, value badges, tooltips
- Chip styling (height, radius, font size, gap, padding)

### Pro
- 3 hierarchy levels (Category → SubCategory → Product), unlimited values per level
- Multi-select and leaf-only selection modes
- Search box
- Custom per-level colors (3 independent color sets: default / active / parent-of-selection)
- Auto-collapse siblings
- Configurable reset button

## Certification Requirements Checklist

- [x] `renderingStarted` / `renderingFinished` / `renderingFailed` called on every `update()` path
- [x] Filter-in / highlight supported (`supportsHighlight`, dimming of non-highlighted chips)
- [x] `supportsSynchronizingFilterState: true`
- [x] `supportsLandingPage`, `supportsKeyboardFocus`, `supportsMultiVisualSelection` set
- [x] `privileges: []` present in `capabilities.json`
- [x] Context menu on empty space — root-container `contextmenu` handler added (see Resubmission note above)
- [x] Context menu on individual chips (null `selectionId`)
- [x] Tooltips on every chip
- [x] Privacy Policy and Terms of Use are separate pages
- [x] Sample `.pbix` includes 13+ unique values and a Tips & Hints page
- [x] Version in `pbiviz.json` matches this submission (`1.0.0.2`)

## Testing Instructions

### Free tier
1. Import the visual into Power BI Desktop with no license/plan assigned.
2. Add fields to the "Categories" well in this order: Category, then optionally SubCategory
   (the field order defines the hierarchy level — 1st = Level 1, 2nd = Level 2, 3rd = Level 3).
3. Confirm only 2 levels are usable and multi-select/search/custom colors are unavailable.
4. Click a chip — confirm it filters the report and other visuals dim/update accordingly.
5. Right-click on a chip and on empty space inside the visual — confirm the standard Power BI
   context menu appears in both cases.

### Pro tier
1. Assign a Power BI Pro/Premium plan with the corresponding service plan entitlement.
2. Add Category, SubCategory, and Product fields to "Categories", in that order (Levels 1–3).
3. Optionally add matching image URL columns to "Images", in the same order, for image chips.
4. Enable Multi-select and Search in the formatting pane; confirm both work.
5. Set custom colors per level; confirm they render for inactive / active / parent-of-selection states.
6. Enable Auto-collapse and the Reset button; confirm behavior.
