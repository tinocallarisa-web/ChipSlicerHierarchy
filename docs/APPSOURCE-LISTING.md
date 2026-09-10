# AppSource Listing — Chip Slicer Hierarchy v1.1.0.0

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

Pro adds two things: finding what you need in a large hierarchy, and seeing where the
weight is. The search box filters chips across every level as you type, marking the
matches and counting them. The value heatmap tints each chip by its measure, scaled
level by level so a child is compared with its siblings.

Turn either on without a licence and Power BI shows its own notification with the link
to obtain one. The setting is kept and applies as soon as the licence is active.

Licensing is handled entirely through Microsoft AppSource. There is no external account,
no separate payment system, and no licence server.
```

---

## What's new in this version

```
Version 1.1.0.0

• New in Pro: a value heatmap that colours each chip by its measure, scaled level by level
  so a child is compared with its siblings rather than with the top of the hierarchy.
• Search now marks the matching text inside each chip and shows how many results there are,
  so an empty result reads as "no matches" instead of as a broken visual.
• A Pro setting turned on without a licence now leads somewhere: Power BI shows its own
  notification with the link to obtain one, and the setting is kept for when it arrives.
  The old grey "Search requires Pro" notice had nothing to click.
• Bookmarks restore the selection. Previously a bookmark applied after load left the chips
  showing one selection while the report was filtered by another.
• Cross-highlighting from other visuals now dims the chips that fall outside it.
• Fixed: a licence in its payment grace period was treated as no licence, and in Publish to
  Web, embedded reports and PDF export a paying customer was asked to buy what they own.
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
- [ ] Version 1.1.0.0 is above the published 1.0.0.4
- [ ] Sample .pbix includes the Tips & Hints page, updated for this version
