# Chip Slicer Hierarchy — Website Product Page Content (v1.0.0.1)

Content for the four tabs of the TCViz product page.

---

## Tab 1: Overview

**The problem it solves**
Standard Power BI slicers flatten everything into one list. When your data is naturally
hierarchical — Category → SubCategory → Product — users lose context and reports get
cluttered with multiple linked slicers just to drill down manually.

**How it works**
Chip Slicer Hierarchy renders your hierarchy as clickable chips/pills. Click a top-level
chip and its children appear inline — no separate visual, no bookmarks, no extra clicks.
Filtering happens the moment you click; browsing without filtering is a tap away via the
expand icon.

**Who it's for**
Report builders and BI teams working with categorized data — product catalogs, org
structures, geography, or any Category → SubCategory → Product-shaped dimension — who want
a compact, modern filtering UI instead of a stack of dropdown slicers.

**What makes it different**
- Native drill-down inside a single visual, not multiple linked slicers
- Chip/pill visual language instead of list or dropdown UI
- Independent color theming per hierarchy level
- Optional image and value badges directly on each chip

**At a glance**
- Up to 3 hierarchy levels (Free: 2, Pro: 3)
- Multi-select and leaf-only selection modes (Pro)
- Search box (Pro)
- Full color/style customization per level
- Demo video: https://www.youtube.com/watch?v=Wt5CktHwN44

---

## Tab 2: Features

### Filtering
- Hierarchical drill-down across Category → SubCategory → Product
- Single-select (Free) and multi-select (**Pro**)
- Leaf-only selection mode (**Pro**) — restrict clicks to the deepest level
- Auto-collapse siblings (**Pro**) — keep the chip list compact while browsing

### Display
- Optional image per chip, positioned left of or above the label
- Optional value badge per chip (compact / number / currency / percent)
- Optional tooltip fields on hover
- Horizontal or vertical layout
- Configurable chip height, radius, font size, gap, and padding

### Search & Navigation
- Search box to filter visible chips (**Pro**)
- Expand icon to browse a level without applying a filter
- Configurable reset button (**Pro**)

### Styling
- Independent color sets per hierarchy level (**Pro**): inactive, active, and
  parent-of-selection states, each with background/border/text colors

### Free vs Pro

| Feature | Free | Pro |
|---|---|---|
| Hierarchy levels | 2 | 3 |
| Values per level | 20 | Unlimited |
| Multi-select | ✗ | ✓ |
| Leaf-only selection | ✗ | ✓ |
| Search box | ✗ | ✓ |
| Custom per-level colors | ✗ | ✓ |
| Auto-collapse siblings | ✗ | ✓ |
| Configurable reset button | ✗ | ✓ |

---

## Tab 3: Technical

**Specs**
- API version: 5.10.0
- Current version: 1.0.0.1
- Platform: Power BI Desktop & Power BI Service

**Field wells**
- Categories (required) — 1–3 grouping fields, in order
- Images (optional) — up to 3 image URL fields, matching Categories order
- Values (optional) — 1 measure, aggregated per level
- Tooltips (optional) — up to 5 fields

**External file requirements**
None. Image chips render from image URLs already present in the user's own data model;
the visual does not require or fetch any external file.

**Performance**
Categorical data view with a 2,000-row reduction algorithm on Categories; rendering events
(`renderingStarted`/`renderingFinished`/`renderingFailed`) reported on every update.

**Power BI integration**
- Filter-in / cross-highlighting supported (dims non-highlighted chips)
- Filter state synchronization across slicers (`supportsSynchronizingFilterState`)
- Keyboard focus and multi-visual selection supported
- Landing page shown when no data is bound

**Compatibility**
Power BI Desktop and Power BI Service, current and prior major releases supporting
custom visuals API 5.x.

**Licensing**
Managed exclusively through Microsoft's official `IVisualLicenseManager` API — no external
authentication, account, or payment system.

**Privacy**
No data leaves the Power BI environment. No network calls made by the visual itself.
See the [Privacy Policy] for full detail.

**Dependencies**
None beyond the Power BI Visuals API and `powerbi-visuals-utils-formattingmodel`.

**Support**
- Email: support@tcviz.com
- Docs: https://tcviz.com/support
- Issues: GitHub repository issue tracker

---

## Tab 4: Changelog

(Mirror of `CHANGELOG.md` — keep both in sync on every release.)

### 1.0.0.1
- Added image chips (optional image per hierarchy level)
- Added value badges (optional measure shown as a badge per chip, with
  compact/number/currency/percent formatting)

### 1.0.0.0
- Initial release: hierarchical chip/pill slicer with drill-down filtering across
  Category → SubCategory → Product
- Multi-select and leaf-only selection modes
- Independent per-level color theming
- Search box, auto-collapse, configurable reset button
