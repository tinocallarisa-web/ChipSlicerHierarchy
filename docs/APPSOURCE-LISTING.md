# AppSource Listing — Chip Slicer Hierarchy v1.0.0.4

Copy ready to paste into Partner Center. **The marketplace description is the
documentation most people read and the one that goes stale fastest** — update it on every
release, not only when the code changes.

---

## Short description (max 100 characters)

```
Hierarchical chip slicer with one-click drill-down, images and value badges.
```

*(75 characters)*

---

## Long description

```
Chip Slicer Hierarchy turns filtering into a compact, modern experience. Instead of
stacking three linked slicers to let users drill from category to subcategory to product,
you drop your fields into a single well — and the field order becomes the hierarchy.

Click a chip to filter the report. Click the expand icon to browse a level without
filtering. Child chips appear inline, in the same visual, with no bookmarks and no extra
slicers.

WHAT YOU GET

• Unlimited hierarchy levels — the order of the fields in the Categories well is the
  hierarchy, so adding a level is just adding a field
• Single-select, multi-select and leaf-only selection, so parent levels can be used for
  navigation only
• Expand and collapse, with optional auto-collapse of sibling branches
• Independent colour sets per level: inactive, active, and the ancestors of whatever is
  selected — so users always see where they are
• Optional image on each chip, and an optional measure shown as a badge
• Configurable reset button and an 'All' chip
• Horizontal or vertical layout, with full control over chip height, radius, spacing,
  padding and font size

BUILT FOR REAL REPORTS

The visual honours high-contrast themes, supports keyboard activation and the standard
Power BI context menu, and synchronises filter state with other slicers.

PRIVACY

All processing happens inside Power BI. The visual makes no network requests of any kind.
Images must be embedded in your model as Base64 data URIs — external URLs are rejected
before they are ever loaded, which guarantees the visual cannot call out to anywhere.

FREE VS PRO

The slicer is complete without a licence: unlimited levels and values, multi-select,
per-level colours, auto-collapse, images, value badges and the reset button are all
included.

A Pro subscription adds one feature: the search box, which filters chips across the whole
hierarchy as you type. Without a licence, a "Search requires Pro" notice appears in its
place.

Licensing is handled entirely through Microsoft AppSource. There is no external account,
no separate payment system, and no licence server.
```

---

## What's new in this version

```
Version 1.0.0.4

• Fixed the support URL, which pointed to a page that no longer exists
• Rewrote the Terms of Use page, which was truncated and described licence tiers that were
  never enforced in the product. The only Pro feature is, and has always been, the search
  box. No functionality has changed for any user — the description was wrong, not the
  visual.
• Rewrote the support documentation: field wells, format pane reference, accessibility
  notes and FAQ
```

---

## URLs to keep in sync

| Field | Value |
|---|---|
| Support / documentation | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html |
| Privacy policy | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html |
| Terms of use | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html |
| Repository (certification branch) | https://github.com/tinocallarisa-web/ChipSlicerHierarchy/tree/certification |
| Demo video | https://www.youtube.com/watch?v=Wt5CktHwN44 |

**`privacyTermsLink` does not travel inside the `.pbiviz`.** Verified by unpacking the
package: the `visual` block contains only `description`, `displayName`, `gitHubUrl`,
`guid`, `name`, `supportUrl`, `version` and `visualClassName`. The privacy URL shown to
users comes from Partner Center, so fixing it in `pbiviz.json` alone changes nothing.

**The publisher name shown as "by X" comes from Partner Center**, not from `author.name`
in the package, and each offer freezes it at its last publication.

---

## Listing images

- `docs/infographic.png` — full render, produced from `docs/infographic.html`
- `assets/infographic.png` — the same render, resized to fit Partner Center's upload limit

Both must be regenerated together whenever the infographic changes. Reload the HTML with a
forced refresh (Ctrl+F5) before downloading, or the browser will serve a cached page and
the PNG will silently carry the old text.

---

## Before submitting

- [ ] Long description above pasted into the offer, replacing the previous tier claims
- [ ] "What's new" pasted
- [ ] Support, privacy and terms URLs checked with a real request, not assumed
- [ ] Certification notes pasted from `docs/CERTIFICATION-NOTES.md` (Partner Center clears
      that field on every resubmission)
- [ ] Version 1.0.0.4 is above the published version
- [ ] Sample .pbix includes the Tips & Hints page, updated for this version
