# Certification Notes — Chip Slicer Hierarchy v1.0.0.1

Paste this content into the "Notes for certification" field in Partner Center —
that field is cleared on every resubmission.

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
- [x] Context menu on empty space (null `selectionId`)
- [x] Tooltips on every chip
- [x] Privacy Policy and Terms of Use are separate pages
- [x] Sample `.pbix` includes 13+ unique values and a Tips & Hints page
- [x] Version in `pbiviz.json` matches this submission (`1.0.0.1`)

## Testing Instructions

### Free tier
1. Import the visual into Power BI Desktop with no license/plan assigned.
2. Add a Category field to Level 1, optionally a SubCategory field to Level 2.
3. Confirm only 2 levels are usable and multi-select/search/custom colors are unavailable.
4. Click a chip — confirm it filters the report and other visuals dim/update accordingly.

### Pro tier
1. Assign a Power BI Pro/Premium plan with the corresponding service plan entitlement.
2. Add Category, SubCategory, and Product fields (Levels 1–3).
3. Enable Multi-select and Search in the formatting pane; confirm both work.
4. Set custom colors per level; confirm they render for inactive / active / parent-of-selection states.
5. Enable Auto-collapse and the Reset button; confirm behavior.
