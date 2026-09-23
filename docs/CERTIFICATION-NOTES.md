# Certification Notes — Chip Slicer Hierarchy v1.2.0.0

The short version to paste into Partner Center lives in
[`CERTIFICATION-NOTES-SHORT.txt`](./CERTIFICATION-NOTES-SHORT.txt), written to fit the
2,500-character limit of that field, which truncates without warning and mid-word. That
field is cleared on every resubmission.

## What changed in 1.2.0.0

### The purchase path was broken

`notifyLicenseRequired` was raised before `notifyFeatureBlocked`, in the same update. Power
BI shows one notification at a time and the last call replaces the previous one, so the
banner wiped out the persistent Upgrade bar; when the banner faded some ten seconds later, a
free user who had just reached for a Pro feature was left with **no way to buy at all**.

The sequence is now: clear any standing notice, raise the banner naming the feature, and
raise the Upgrade bar 10.5 s later, once the banner has gone. The timer is cancelled in
`destroy()`, because Power BI recreates the visual on every page change and a live timer
would notify on behalf of a slicer that no longer exists.

### Pro preview

Turning on the search box or heat-map colouring without a licence did **nothing at all** —
the setting was accepted and then ignored, which reads as a visual that is broken rather
than as something worth buying. Both are now drawn *working*, under a "Pro preview"
watermark that names them, while the user edits a report without a licence.

The preview is granted **per feature**, never in bulk: inserting the visual hands out
nothing, because nothing has been asked for yet. It requires the licence to have **resolved**
and the environment to support licensing — at start-up `isPro` is false for a paying
customer too, and where the licence cannot be read (Publish to Web, embedding, export) a Pro
customer reads as Free, so the watermark there would land in front of someone who has
already paid.

In reading view the free result renders with no watermark and no prompt, so a published
report never uses a feature nobody paid for.

The watermark is a `div` built with `createElement` and `textContent`. There is no
`innerHTML` anywhere in this visual, which matters more here than elsewhere: it was rejected
for XSS once.

### Format pane in Spanish

Forty keys were already written *and translated* in `stringResources`, and none of them
reached the screen: `settings.ts` never referenced them with `displayNameKey`, and
`FormattingSettingsService` was built without a localization manager. There are now 74 keys
complete in `en-US` and `es-ES`, covering the cards, the settings and the four field wells.

### Toolchain

Tools 7.2.1, API 5.11.1 (the manifest still declared 5.10.0), TypeScript 5.5.4 and the
`qs`/`uuid` overrides. Lint had no configuration in the format `pbiviz` expects, so every
build printed *"Can't run lint validation"* and packaged anyway — and that is where the
certification rules are checked. `npm audit` reports 0 vulnerabilities, lint runs clean, and
`pbiviz package --certification-audit` finds no external requests.

## What changed in 1.1.1.0

A licence fix and nothing else. 1.1.0.0 is published and certified.

| Problem | Consequence | Fix |
|---|---|---|
| The code compared `spIdentifier` with `chip-slicer-hierarchy-tcviz`, which is not a plan of this offer | Pro never unlocked for a buyer | The real Pro Plan ID, `chipslicer-hierarchy-pro` |
| Strict equality, while the Licensing API returns the full Service ID (`publisher.offer.plan`) | Even the right Plan ID would not have matched | `matchesPlan()` accepts the full Service ID or the Plan ID on its own |

No feature, data role, formatting property or UI changed.

## What changed in 1.1.0.0

Two things: the licensing path was wrong in ways that affected paying customers, and the
Pro tier was a single feature that few people ever discovered.

### Licensing corrections

| Problem | Consequence | Fix |
|---|---|---|
| `spIdentifier` was never compared | Any active plan the user held counted as this visual's | The plan identifier is now matched |
| Only `Active` was accepted | A licence in its payment grace period read as absent | `Warning` is accepted alongside `Active` |
| `isLicenseUnsupportedEnv` / `isLicenseInfoAvailable` ignored | In Publish to Web, embedding and PDF export a Pro customer read as Free and was asked to buy what they already own | Both are read; no notification is raised there |
| The Pro feature had no purchase path | The in-visual notice was grey text with nothing to click | Power BI's own `notifyFeatureBlocked` / `notifyLicenseRequired`, which carry the link |

The in-visual "Search requires Pro" notice has been removed. It was licensing UI of our
own, which Microsoft's guidance advises against, and it was a dead end. A Pro setting
turned on without a licence now leaves the free result on screen, keeps the setting, and
raises Power BI's notification.

`notifyLicenseRequired` is raised while any Pro setting is on without a licence, not only
at the moment of the click. This covers the expired trial, where the user changes nothing
and the feature disappears on its own.

The Pro settings default to `false` on purpose. Defaulting to `true` would leave a free
user with no search box, no heatmap and no explanation — the invisible wall this release
exists to remove.

### New Pro features

- **Value heatmap.** With a measure in the Values well, each chip is tinted between two
  colours by its value. The scale is normalised per level, so a child is compared with its
  siblings; normalising globally collapses everything below level one to one colour. Chip
  text switches between dark and light by WCAG relative luminance so the label stays
  readable at both ends.
- **Search highlighting and result count.** Matches are marked inside the label and the
  number of results is shown, so an empty hierarchy reads as "no matches" rather than as a
  broken visual.

### Gaps from 1.0.0.4 now closed

- **Bookmarks.** Restoring from the applied filter ran only on first load, so a bookmark
  applied afterwards restored nothing: the chips kept the previous selection while the
  report was filtered by another, and clearing filters from outside left chips marked with
  nothing behind them. The visual now compares Power BI's filter against what is on screen
  and acts only when they diverge; a flag discards the echo of its own filter, which would
  otherwise undo the user's click.
- **`supportsHighlight`** was declared in `capabilities.json` and implemented by nobody.
  Chips outside a cross-highlight are now dimmed to 35%; a parent stays lit while any of
  its children is. It applies only when a measure is bound, which is where highlights come
  from.
- **`allowInteractions`** is checked before selecting. Power BI sets it to false during
  export and in some read modes, where selecting would change the report behind the user's
  back.

### Security

No `innerHTML` anywhere in the visual, and no lint suppression of `no-inner-outer-html`.
Labels, including the search highlighting, are built with `createElement` and text nodes.

## Repository

- Certification branch: `certification` (public, GitHub)
- https://github.com/tinocallarisa-web/ChipSlicerHierarchy/tree/certification

## Public URLs

| Page | URL |
|---|---|
| Privacy Policy | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html |
| Terms of Use | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html |
| Support | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html |
| Demo video | https://www.youtube.com/watch?v=rdZLCxpP6Pk |

## Licence validation

- The official Power BI `IVisualLicenseManager` API exclusively
  (`host.licenseManager` / `getAvailableServicePlans()`), via `powerbi-visuals-api` 5.x.
- No external server, no custom auth, no payment processing performed by the visual.
- Resolution is asynchronous and never blocks the initial render. The visual renders in
  Free mode first and re-renders once the licence resolves. Nothing is notified before it
  resolves, because `isPro` is false at start for a licensed user too.
- No watermark and no artificial limits in the free tier.

## Data access & privacy

- Reads only the standard categorical `dataView` (Categories, Images, Values, Tooltips
  roles defined in `capabilities.json`).
- No `fetch` / `XMLHttpRequest`, no local file access, nothing persisted outside the
  `.pbix` (formatting settings only, via `persistProperties`).
- The "Images" role accepts only Base64 data URIs (`data:image/*;base64,...`), validated
  before assignment to `img.src`. External URLs, `blob:` and every other scheme are
  rejected at parse time — the visual makes no outbound request.

## Feature summary

### Free
- Up to three hierarchy levels — the field order in "Categories" is the hierarchy. The
  limits are identical in both tiers: `categories` is capped at 3 in `capabilities.json`
  and the data reduction at 2,000 rows. Nothing is reduced for a Free user.
- Single-select, multi-select and leaf-only selection
- Expand / collapse, auto-collapse siblings, configurable reset button and 'All' chip
- Per-level colours (inactive / active / parent-of-selection)
- Image chips, value badges, tooltips
- Chip styling: height, radius, font size, gap, padding, horizontal or vertical layout
- Cross-filtering, cross-highlighting, bookmarks
- Keyboard activation, context menu, high-contrast support

### Pro
- **Search (Pro)** — in-visual search across the whole hierarchy, with matches highlighted
  and a result count
- **Value Heatmap (Pro)** — each chip coloured by its measure, normalised per level

## Certification requirements checklist

- [x] `renderingStarted` / `renderingFinished` / `renderingFailed` on every `update()` path
- [x] `supportsSynchronizingFilterState: true` — the visual persists a filter, so this applies
- [x] `supportsLandingPage`, `supportsKeyboardFocus`, `supportsMultiVisualSelection` set
- [x] `supportsHighlight: true` — declared and now implemented
- [x] `privileges: []` present in `capabilities.json`
- [x] Context menu on empty space and on individual chips
- [x] Tooltips on every chip, via `host.tooltipService`
- [x] `host.allowInteractions` checked before selecting
- [x] Bookmarks restore the selection from the applied filter
- [x] Privacy Policy and Terms of Use are separate pages, both reachable
- [x] Support page documents field wells, format pane, tiers and FAQ
- [x] Sample `.pbix` includes 13+ unique values and a Tips & Hints page
- [x] Image sanitization: non-`data:` URIs rejected before `img.src`
- [x] No `innerHTML`, no suppression of `no-inner-outer-html`
- [x] Version in `pbiviz.json` (1.2.0.0) is above the published 1.1.1.0

### Known gaps, declared openly

- Keyboard support covers Tab focus plus Enter / Space activation. Arrow-key navigation
  between chips is not implemented, and the support page states this explicitly.
- No report-tooltip (canvas tooltip page) support; standard tooltips only.

## Testing instructions

### Free tier
1. Import the visual with no licence assigned.
2. Add two or more fields to "Categories". The field order defines the hierarchy: 1st =
   level 1, 2nd = level 2, and so on. Levels are not capped.
3. Click a chip and confirm it filters the report; confirm multi-select, per-level colours,
   auto-collapse and the reset button. All of that is free.
4. Turn on **Search (Pro) → Show search box (Pro)**. The search box does not appear and
   Power BI raises its own licence notification, with the link to obtain one. The setting
   stays on.
5. Bind a measure to "Values" and turn on **Value Heatmap (Pro) → Color chips by value
   (Pro)**. Same behaviour: chips keep their configured colours and the notification is
   raised.
6. Right-click on a chip and on empty space — the context menu appears in both.
7. Tab to a chip and press Enter or Space — it selects.
8. Select something, save a bookmark, change the selection, apply the bookmark — the chips
   return to the saved selection.

### Pro tier
1. Assign a plan with the corresponding service plan entitlement.
2. Repeat step 4 — the search box now renders. Type in it: chips are filtered across the
   whole hierarchy, matches are marked inside the label and the result count is shown.
3. Repeat step 5 — chips are now tinted by their measure, with each level scaled against
   its own siblings.
