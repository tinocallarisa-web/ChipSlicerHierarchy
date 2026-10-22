# Chip Slicer Hierarchy — Website Product Page Content (v1.3.0.0)

Content for the four tabs of the TCViz product page
(https://tcviz.com/product/chip-slicer-hierarchy/).

---

## Tab 1: Overview

**The problem it solves**
When data is nested — category, subcategory, product; country, region, city — the usual
answer is a stack of linked slicers, one per level. They take space, and readers lose the
context of where a value sits.

**How it works**
Chip Slicer Hierarchy draws the hierarchy as clickable chips in one visual. Put up to three
fields in one well and the field order becomes the hierarchy. Click a chip to filter; it
opens to show the level below. The arrow on a chip opens it without filtering. The filter
applies to the deepest level you selected.

**Who it's for**
Report builders working with nested dimensions — product catalogues, org structures,
geography, cost centres — who want one compact slicer instead of three.

**What makes it different**
- Up to three levels inside a single slicer, not linked slicers
- Six style templates that colour the three levels at once, plus colours per level
- Images and value badges on the chips, with the measure's own format
- A default selection by values, so the page opens where you want it
- Pro: search, colour by value and a drop-down mode for small spaces

**At a glance**
- Up to three levels and 2,000 rows — the field order is the hierarchy
- Multi-select, leaf-only selection, default selection, round ✕ to clear
- Search box (Pro) — finds chips at every level, matches marked and counted
- Colour by value (Pro) — each chip tinted by its measure, scaled per level
- Drop-down mode (Pro) — a bar with the selection that opens the tree
- 12 languages, keyboard, on-object formatting
- Demo video: https://www.youtube.com/watch?v=rdZLCxpP6Pk

---

## Tab 2: Features

### Filtering
- Up to three nested levels from one well
- Multi-select (on by default), leaf-only selection, auto-collapse siblings
- The filter applies to the deepest level with a selection
- Default selection: None, First value, or These values (e.g. `Spain, France`), matched at
  any level; applied when the slicer opens with nothing selected
- Round ✕ clear button (only when something is selected) and an 'All' chip
- A standard Power BI filter: sync slicers, bookmarks, edit interactions
- Chips outside a highlight from another visual are dimmed (with a measure in Values)

### Display
- Six style templates: Classic, Outline, Soft, Square, One colour, Dark
- Colours per level: inactive, active and parent-of-selection
- Optional image per chip (Base64 data URI), left of or above the label
- Optional value badge: Model format, Compact (default), Number, Currency, Percentage
- Up to five tooltip fields
- Horizontal or vertical layout; chip height, radius, font, gap and padding
- On-object formatting: chips, badges, the ✕, the search box and the drop-down bar
- Setup tips while editing: templates in one click and "Try Pro" buttons

### Pro
- **Search box** — finds chips at every level as you type, marking the matching text and
  showing the number of results
- **Colour by value** — each chip tinted between two colours by its measure, scaled per
  level so a child is compared with its siblings; the text switches between dark and light
- **Drop-down mode** — a bar shows the selection ("All", "Spain, France" or "3 selected");
  one click opens the tree below it, with the search box when it is on. Escape closes it.
  The list opens inside the visual's own area, so the visual is sized for the open list.

### Accessibility and languages
- One Tab stop; arrow keys, Home and End; Right opens a level, Left closes it; Enter or
  Space selects (Ctrl adds); Escape clears or closes; Shift+F10 opens the context menu
- High-contrast themes are honoured
- English, Spanish, Portuguese (Brazil, Portugal), French, German, Italian, Dutch, Polish,
  Japanese, Chinese (Simplified), Korean

### Free and Pro

The slicer is complete without a licence. Pro adds three features.

| Feature | Free | Pro |
|---|---|---|
| Up to 3 levels, 2,000 rows | ✓ | ✓ |
| Images, value badges, tooltips | ✓ | ✓ |
| Multi-select, leaf-only, default selection, ✕ and All | ✓ | ✓ |
| Six templates, per-level colours, on-object formatting | ✓ | ✓ |
| Keyboard, 12 languages, sync slicers, bookmarks | ✓ | ✓ |
| **Search box**, matches marked and counted | ✗ | **✓** |
| **Colour by value**, scaled per level | ✗ | **✓** |
| **Drop-down mode** | ✗ | **✓** |

**Pro preview:** without a licence, while you edit, a Pro feature you turn on is drawn
working under a "Pro preview" watermark, and Power BI shows its licence banner and an
Upgrade bar. Readers see the free chips; where licences cannot be read (Publish to Web,
embedding, export), the free result is drawn with no watermark.

---

## Tab 3: Technical

**Specs**
- Current version: 1.3.0.0
- API version: 5.11.1
- Platform: Power BI Desktop and Power BI service

**Field wells**
- **Categories** (required) — up to 3 fields, in order; the order is the hierarchy
- **Images** (optional) — up to 3 columns of Base64 data URIs (`data:image/*;base64,...`),
  one per level, in the order of Categories. Web addresses are not loaded.
- **Values** (optional) — one measure, shown as a badge and added up per chip
- **Tooltips** (optional) — up to 5 fields

**External file requirements**
None. Images must already be in the data model as Base64 data URIs.

**Data**
Categorical data view, up to 2,000 rows. The filter is a basic `In` filter on the deepest
level with a selection, with values in their original type (a code such as `08001` keeps
its leading zero).

**Power BI integration**
- Filter state synchronisation across slicers
- Bookmarks, edit interactions, cross-highlighting
- Keyboard focus, context menu, on-object formatting
- Start screen when no data is bound
- Interactions are blocked where Power BI disallows them

**Licensing**
Microsoft's official Power BI licensing API, plan `chipslicer-hierarchy-pro`. No external
account, licence server or payment system.

**Privacy**
No network calls, no telemetry, no cookies or browser storage. The start-screen links open
only on click, through Power BI.
[Privacy Policy](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html).

**Support**
- Docs and FAQ: https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html
- Issues: https://github.com/tinocallarisa-web/ChipSlicerHierarchy/issues
- Email: support@tcviz.com

---

## Tab 4: Changelog

(Mirror of `CHANGELOG.md` — keep both in sync on every release.)

### 1.3.0.0 — 22 Oct 2026

**Added**
- Drop-down mode (Pro): a bar with the current selection that opens the hierarchy below it
- Six style templates: Classic (the earlier look, and the default), Outline, Soft, Square,
  One colour, Dark
- Setup tips while editing: templates in one click and the three Pro features to try
- Default selection by values ("These values" plus a list, matched at any level)
- Model format for the value badge and tooltip, dynamic format strings included
- On-object formatting for chips, badges, the clear button, the search box and the drop-down bar
- Keyboard: one Tab stop, arrow keys, Right/Left to open and close a level, Escape, Shift+F10
- 12 languages, a start screen, a font setting and a new icon

**Changed**
- The reset button is now a round ✕, shown only when something is selected, on by default
  for new slicers

**Fixed**
- Filtering tables with a dot in their name
- Codes and dates filter with their original type; chips use the column's format
- Interactions blocked where Power BI disallows them

### 1.2.0.0
- Pro preview: Pro features drawn working under a watermark while you edit without a licence
- Format pane in Spanish
- Fixed: the Upgrade option could disappear before you could use it

### 1.1.0.0
- Value heatmap (Pro), search match highlighting and result count (Pro)
- Bookmarks restore the selection, cross-highlighting dims chips, `allowInteractions` honoured

### 1.0.0.x
- Images restricted to Base64 data URIs; context menu on empty space; image chips and value
  badges; support and terms pages rewritten

### 1.0.0.0
- Initial release
