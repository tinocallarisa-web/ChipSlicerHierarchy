# Chip Slicer Hierarchy — Tips & Hints (v1.3.0.0)

Paste into the "Tips & Hints" page of the sample `.pbix`.
See `TIPS-AND-HINTS-PLAIN.txt` for a version safe to paste into a Power BI text box.

## Getting Started

1. Drag a field into the *Categories* well — it becomes Level 1.
2. Add a second and third field to the same well. The field order is the hierarchy:
   1st = Level 1, 2nd = Level 2, 3rd = Level 3. Three levels is the maximum.
3. Click a chip to filter the report. A chip with children opens when you select it.
4. Click the arrow on a chip (▼) to open a level without filtering.
5. Format → **Style template** changes the look of the three levels in one click.

While you edit, a tips bar at the bottom offers the templates and "Try Pro" buttons. Close
it with ✕; it comes back from Format → Style template → Show setup tips.

## Field Wells

| Well | Required | Purpose |
|---|---|---|
| Categories | Yes | Up to 3 fields, in order. The field order *is* the hierarchy. |
| Images | No | One Base64 data URI column per level, same order as Categories |
| Values | No | One measure, shown as a badge and added up per chip |
| Tooltips | No | Extra fields shown on hover (up to 5) |

Up to 2,000 rows of the hierarchy are loaded.

## Selecting and Clearing

All of these are free.

- **Multi-select** (on by default) — each click adds or removes a chip. Off: a click
  replaces the selection; Ctrl+click still adds.
- **Leaf-only selection** — only the last level can be selected; upper levels are for
  navigating.
- **Auto-collapse siblings** — opening a chip closes the others at the same level.
- **Clear button ✕** — next to the search box or the drop-down bar, otherwise top-right.
  Shown only when something is selected.
- **All chip** — clears the selection; its text can be changed.
- **Default selection** — None, First value (the first Level 1 chip) or These values, e.g.
  `Spain, France`, matched at any level. Applied when the slicer opens with nothing
  selected; if the reader clears it, it stays clear until the page is opened again.

**The filter uses the deepest level with a selection.** Select Europe and then Spain, and
the page is filtered by Spain.

The selection is a Power BI filter: sync slicers, bookmarks and edit interactions work as
with any slicer.

## Style Templates

Classic (default, the look of earlier versions) · Outline · Soft · Square · One colour ·
Dark. A template fills in only what you have not changed yourself; picking one replaces
the colours it defines.

## Format Pane

- **Style template** — template, show setup tips
- **Chip Style** — layout, multi-select, leaf-only, hide blanks, default selection and
  values, chip height / radius / font / font size / gap / padding, "All" button
- **Drop-down (Pro)** — drop-down mode, label
- **Search (Pro)** — search box, highlight matches, result count, placeholder, colours
- **Images** — image height, position (left / above), border radius
- **Value Badge** — show, format (Model format / Compact / Number / Currency / Percentage;
  Compact is the default), colours, size, show in tooltip
- **Value Heatmap (Pro)** — colour chips by value, low and high colours
- **Hierarchy** — indent per level, expand icon, auto-collapse siblings, reset button
- **Level 1 / 2 / 3 Colors** — inactive, active and (levels 1 and 2) parent-of-selection colours

With *Format* on, click a chip, a badge, the ✕, the search box or the drop-down bar to
format it in place.

## Free and Pro

The slicer is complete without a licence. Pro adds three features.

| Feature | Free | Pro |
|---|---|---|
| Up to 3 levels, 2,000 rows | Yes | Yes |
| Images, value badges, tooltips | Yes | Yes |
| Multi-select, leaf-only, default selection, ✕ and All | Yes | Yes |
| Six templates, per-level colours, on-object formatting | Yes | Yes |
| Keyboard, 12 languages, sync slicers, bookmarks | Yes | Yes |
| **Search box**, matches marked and counted | No | **Yes** |
| **Colour by value**, scaled per level | No | **Yes** |
| **Drop-down mode** | No | **Yes** |

**Pro preview:** without a licence, while you edit, a Pro feature you turn on is drawn
working under a "Pro preview" watermark, and Power BI shows its licence banner and an
Upgrade bar. Readers see the free chips. Where licences cannot be read (Publish to Web,
embedding, export) the free result is drawn, with no watermark.

## The Pro Features

- **Search box** — type to find chips at every level, not just the one that is open. The
  matching text is marked and the number of results is shown.
- **Colour by value** — with a measure in Values, each chip is tinted between a low and a
  high colour. The scale is worked out **per level**, so a child is compared with its
  siblings, not with the top of the hierarchy. The text switches between dark and light to
  stay readable. It combines with the badge: the badge gives the figure, the colour the ranking.
- **Drop-down mode** — a bar shows the selection ("All", "Spain, France" or "3 selected");
  one click opens the tree below it. Escape closes it, and with multi-select off a click on
  a last-level chip closes it too. **The list opens inside the visual's own area**, so make
  the visual as tall as the open list should be.

## Keyboard

One Tab stop for the whole slicer. Arrow keys, Home and End move between chips. Right opens
a chip with children, Left closes it. Enter or Space selects (Ctrl adds). Escape clears or
closes the drop-down. Shift+F10 opens the context menu.

## Languages and Number Formats

English, Spanish, Portuguese (Brazil, Portugal), French, German, Italian, Dutch, Polish,
Japanese, Chinese (Simplified) and Korean, following Power BI. Dates and numbers on chips
use the column's format; the badge with *Model format* uses the measure's format string,
dynamic format strings included.

## Images — Format Required & How to Generate Them

> **Important:** the visual only accepts images embedded as **Base64 data URIs**.
> Web addresses (`http://`, `https://`, `blob:`) are not loaded — the visual makes no
> network requests.
>
> The accepted format is: `data:image/<type>;base64,<encoded data>`
> Examples: `data:image/png;base64,iVBOR…` · `data:image/svg+xml;base64,PHN2…`

### Option 1 — Power Query (recommended)

Add a custom column in Power Query:

```
"data:image/png;base64," &
Binary.ToText(
    Web.Contents("https://your-storage.com/image.png"),
    BinaryEncoding.Base64
)
```

> The image is fetched once at refresh time and stored in the model.
> Nothing is requested when the report is open.

### Option 2 — Python script (batch conversion)

Convert a folder of PNG/JPG/SVG files into a CSV ready to merge with your data:

```python
import base64, csv, os

folder = r"C:\my-images"   # change to your folder
rows = []
for fname in os.listdir(folder):
    if fname.lower().endswith((".png", ".jpg", ".jpeg", ".svg")):
        ext = fname.rsplit(".", 1)[1].lower()
        mime = "svg+xml" if ext == "svg" else ("jpeg" if ext == "jpg" else ext)
        with open(os.path.join(folder, fname), "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        rows.append({"name": fname, "imageUrl": f"data:image/{mime};base64,{b64}"})

with open("images.csv", "w", newline="") as f:
    w = csv.DictWriter(f, ["name", "imageUrl"])
    w.writeheader(); w.writerows(rows)
```

Import `images.csv` into Power BI and join it to your data by file name.

### Option 3 — SVG built in Power Query

For simple icons, build an SVG string in Power Query and encode it with
`Binary.ToText(Text.ToBinary(svg), BinaryEncoding.Base64)`. DAX alone cannot do HTTP
requests or Base64 encoding.

### Quick rules

- ✅ `data:image/png;base64,…`
- ✅ `data:image/jpeg;base64,…`
- ✅ `data:image/svg+xml;base64,…`
- ❌ `https://example.com/image.png` — not loaded
- ❌ `blob:…` — not loaded
- ❌ Empty or null — ignored (no image, no error)

---

## Tips & Best Practices

- Keep Level 1 labels short — long labels make the chips wrap on narrow visuals.
- Use the vertical layout for tall, narrow sidebars.
- Turn on "Hide blank values" if your hierarchy has blanks.
- Use the Compact badge format (K / M / B) for large numbers, or Model format to match the measure.
- Use small, square images for the chips.
- In drop-down mode, size the visual for the open list and keep the space below the bar free.

## Example Configurations

- **Simple category filter**: 1 field in Categories — a flat chip slicer.
- **Product catalogue**: Category, Subcategory, Product in Categories; Base64 thumbnails
  in Images; a Sales measure in Values with the badge on.
- **Geography with a default**: Country → Region → City, Default selection = These values,
  `Spain`.
- **Compact header slicer (Pro)**: drop-down mode plus the search box.

## Troubleshooting

- **Chips do not filter other visuals** — check Format → Edit interactions, and that the
  fields are related to the tables of the other visuals.
- **Only the child filters** — by design: the deepest level with a selection is the filter.
- **A level does not appear** — at most three fields; open the parent chip; with "Hide
  blank values" on, a path stops at a blank.
- **Images do not show** — the column must hold a `data:image/…;base64,…` value.
- **The drop-down list is cut off** — it opens inside the visual; make the visual taller.
- **"Pro preview" watermark** — a Pro feature is on without a licence. Only you see it while
  editing; readers see the free chips.
- **Colours do not change with a template** — use *Reset to default* on a colour to let the
  template decide it.
