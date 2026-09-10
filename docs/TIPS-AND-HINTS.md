# Chip Slicer Hierarchy — Tips & Hints (v1.1.0.0)

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
| Categories | Yes | Hierarchy fields, in order. The field order *is* the hierarchy. No level limit. |
| Images | No | Image URL per level, same order as Categories |
| Values | No | Measure shown as a badge on each chip |
| Tooltips | No | Extra fields shown on hover (up to 5) |

## Format Pane

- **Chip Style** — layout (horizontal/vertical), multi-select, leaf-only selection, hide blanks, default selection, chip size/radius/font/gap/padding, "All" button
- **Search (Pro)** — show/hide search box, placeholder, colors
- **Value Heatmap (Pro)** — colour chips by value, low and high colours
- **Images** — image height, position (left/above), border radius
- **Value Badge** — show/hide, format (compact/number/currency/percent), colors, size
- **Hierarchy** — indent per level, expand icon, auto-collapse siblings, reset button
- **Level 1/2/3 Colors** — independent inactive / active / parent-of-selection color sets per level

## Free vs Pro

The slicer is complete without a licence. Pro adds two things: finding what you need in a
large hierarchy, and seeing where the weight is.

| Feature | Free | Pro |
|---|---|---|
| Hierarchy levels | Up to 3 | Up to 3 |
| Values in the hierarchy | Up to 2,000 | Up to 2,000 |
| Multi-select and leaf-only selection | Yes | Yes |
| Custom per-level colors | Yes | Yes |
| Auto-collapse siblings | Yes | Yes |
| Configurable reset button and 'All' chip | Yes | Yes |
| Image chips, value badges, tooltips | Yes | Yes |
| **Search box**, with matches marked and counted | No | **Yes** |
| **Value heatmap** — chips coloured by their measure | No | **Yes** |

Turn either on without a licence and Power BI shows its own notification with the link to
obtain one. The setting is kept and applies as soon as the licence is active.

## Images — Format Required & How to Generate Them

> **Important:** For security and AppSource certification compliance, the visual only
> accepts images embedded as **Base64 data URIs**. External URLs (`http://`, `https://`,
> `blob:`, etc.) are blocked and will not render.
>
> The accepted format is: `data:image/<type>;base64,<encoded data>`  
> Examples: `data:image/png;base64,iVBOR…` · `data:image/svg+xml;base64,PHN2…`

### Option 1 — Power Query (recommended for most users)

Add a custom column in Power Query that reads an image file from a URL and converts
it to Base64. Paste this M code as a new custom column:

```
"data:image/png;base64," &
Binary.ToText(
    Web.Contents("https://your-storage.com/image.png"),
    BinaryEncoding.Base64
)
```

> This fetches the image once at refresh time and embeds it permanently in the model.
> No outbound requests are made when the report is open.

### Option 2 — Python script (batch conversion)

Use this script to convert a folder of PNG/JPG files into a CSV ready to merge with
your data:

```python
import base64, csv, os

folder = r"C:\my-images"   # change to your folder
rows = []
for fname in os.listdir(folder):
    if fname.lower().endswith((".png", ".jpg", ".jpeg", ".svg")):
        ext = fname.rsplit(".", 1)[1].lower()
        mime = "svg+xml" if ext == "svg" else ext
        with open(os.path.join(folder, fname), "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        rows.append({"name": fname, "imageUrl": f"data:image/{mime};base64,{b64}"})

with open("images.csv", "w", newline="") as f:
    w = csv.DictWriter(f, ["name", "imageUrl"])
    w.writeheader(); w.writerows(rows)
```

Then import `images.csv` into Power BI and join it to your data by file name.

### Option 3 — DAX calculated column

If images are already in a column as URLs, fetch and encode them with Power Query
first (Option 1), then store the result as a text column. DAX alone cannot perform
HTTP requests or Base64 encoding.

### Option 4 — SVG generated in DAX

For simple shapes or icons generated on the fly, build an SVG string in DAX:

```
ImageUrl =
"data:image/svg+xml;base64," &
Base64.Encode(
    "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>"
    & "<circle cx='24' cy='24' r='24' fill='" & [Color] & "'/>"
    & "<text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' "
    & "font-size='20' fill='#fff'>" & LEFT([Name],1) & "</text></svg>"
)
```

> Note: `Base64.Encode` is available in Power Query M, not in DAX. Use a calculated
> column in Power Query or a Python/R script step to do the encoding.

### Quick rules

- ✅ `data:image/png;base64,…`
- ✅ `data:image/jpeg;base64,…`
- ✅ `data:image/svg+xml;base64,…`
- ❌ `https://example.com/image.png` — blocked
- ❌ `blob:…` — blocked
- ❌ Empty or null — ignored (no image shown, no error)

---

## Tips & Best Practices

- Keep Level 1 categories short — long labels wrap chip layout on narrow visuals.
- Use vertical layout for tall/narrow report canvases with many values.
- Enable "Hide blank values" if your source data has nulls in hierarchy fields.
- Use the Value Badge with a compact format for large numbers (K/M/B) to keep chips narrow.
- Image chips work best with square, small (under ~64px) images for fast rendering.

## Selection Modes in Detail

All of these are available without a licence.

- **Multi-select** — clicking additional chips adds to the selection.
- **Leaf-only selection** — restricts clicking to the deepest available level; useful when
  parent levels should only ever be used for navigation, not filtering.
- **Auto-collapse siblings** — collapses other expanded branches automatically when a new
  one is expanded, keeping the chip list compact.

## The Pro Features

- **Search box** — type to filter chips across the whole hierarchy, not just the level
  currently visible. The matching text is marked inside each chip and the number of results
  is shown, so an empty hierarchy reads as "no matches" rather than as a broken visual.
  Enable it under *Search (Pro)*.
- **Value heatmap** — with a measure in the Values well, each chip is tinted between a low
  and a high colour by its value. The scale is worked out **per level**, so a child is
  compared against its siblings and not against the top of the hierarchy — otherwise
  everything below level one comes out the same colour. The label switches between dark and
  light text so it stays readable at both ends of the scale. Enable it under
  *Value Heatmap (Pro)*.

  It combines with the value badge rather than replacing it: the badge gives the figure,
  the colour gives the ranking at a glance.

## Example Configurations

- **Simple category filter**: 1 field in Categories, no other wells — behaves like a
  standard single-level slicer with chip styling.
- **Product catalog browser**: Category, SubCategory, Product in Categories; Images well
  populated with Base64 thumbnails; Values well with a Sales measure.
- **Compact sidebar slicer**: Vertical layout, small chip height, search enabled (Pro).

## Troubleshooting

- **Chips not filtering other visuals** — confirm the field used is also present (directly
  or via relationship) in the visuals you expect to be filtered.
- **Images not showing** — the Images field must contain a Base64 data URI
  (`data:image/...;base64,...`). External URLs (`http://`, `https://`) are blocked for
  security. See the *Images — Format Required & How to Generate Them* section above.
- **A level is not appearing** — check the number of fields in the Categories well: the
  field order is the hierarchy, and the well takes at most three fields. A fourth is
  refused by Power BI rather than shown as a fourth level. Also check "Hide blank values"
  if the level has nulls.
- **Colors not applying** — confirm you're editing the correct Level (1/2/3) color card;
  each level has an independent color set.
