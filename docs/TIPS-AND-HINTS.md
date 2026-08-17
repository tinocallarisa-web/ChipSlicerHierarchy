# Chip Slicer Hierarchy — Tips & Hints (v1.0.0.1)

Paste into the "Tips & Hints" page of the sample `.pbix`.
See `TIPS-AND-HINTS-PLAIN.txt` for a version safe to paste into a Power BI text box.

## Getting Started

1. Drag a **Category** field into the *Categories* well (Level 1).
2. Optionally add a second and third field to the same well for SubCategory and Product —
   field order determines hierarchy depth (1st = Level 1, 2nd = Level 2, 3rd = Level 3).
3. Click a chip to filter the report. Child chips for the next level appear automatically.
4. Click the expand icon (▸) to browse a level without filtering.

## Field Wells

| Well | Required | Purpose |
|---|---|---|
| Categories | Yes | Hierarchy fields, in order (up to 3 levels) |
| Images | No | Image URL per level, same order as Categories |
| Values | No | Measure shown as a badge on each chip |
| Tooltips | No | Extra fields shown on hover (up to 5) |

## Format Pane

- **Chip Style** — layout (horizontal/vertical), multi-select, leaf-only selection, hide blanks, default selection, chip size/radius/font/gap/padding, "All" button
- **Search** — show/hide search box, placeholder, colors
- **Images** — image height, position (left/above), border radius
- **Value Badge** — show/hide, format (compact/number/currency/percent), colors, size
- **Hierarchy** — indent per level, expand icon, auto-collapse siblings, reset button
- **Level 1/2/3 Colors** — independent inactive / active / parent-of-selection color sets per level

## Free vs Pro

| Feature | Free | Pro |
|---|---|---|
| Hierarchy levels | 2 | 3 |
| Values per level | 20 | Unlimited |
| Multi-select | No | Yes |
| Leaf-only selection | No | Yes |
| Search box | No | Yes |
| Custom per-level colors | No | Yes |
| Auto-collapse siblings | No | Yes |
| Configurable reset button | No | Yes |

## Tips & Best Practices

- Keep Level 1 categories short — long labels wrap chip layout on narrow visuals.
- Use vertical layout for tall/narrow report canvases with many values.
- Enable "Hide blank values" if your source data has nulls in hierarchy fields.
- Use the Value Badge with a compact format for large numbers (K/M/B) to keep chips narrow.
- Image chips work best with square, small (under ~64px) images for fast rendering.

## Pro Features in Detail

- **Multi-select** — hold no modifier key; clicking additional chips adds to the selection.
- **Leaf-only selection** — restricts clicking to the deepest available level; useful when
  parent levels should only ever be used for navigation, not filtering.
- **Auto-collapse siblings** — collapses other expanded branches automatically when a new
  one is expanded, keeping the chip list compact.

## Example Configurations

- **Simple category filter**: 1 field in Categories, no other wells — behaves like a
  standard single-level slicer with chip styling.
- **Product catalog browser**: Category, SubCategory, Product in Categories; Images well
  populated with product thumbnail URLs; Values well with a Sales measure.
- **Compact sidebar slicer**: Vertical layout, small chip height, search enabled (Pro).

## Troubleshooting

- **Chips not filtering other visuals** — confirm the field used is also present (directly
  or via relationship) in the visuals you expect to be filtered.
- **Images not showing** — the Images field must contain a full, publicly reachable image
  URL per row; the visual does not fetch or proxy images itself.
- **Third level not appearing** — you're on the Free tier (2-level limit) or only 2 fields
  are present in the Categories well.
- **Colors not applying** — confirm you're editing the correct Level (1/2/3) color card;
  each level has an independent color set.
