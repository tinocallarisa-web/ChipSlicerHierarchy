# Chip Slicer Hierarchy — Website Product Page Content (v1.1.0.0)

Content for the four tabs of the TCViz product page.

---

## Tab 1: Overview

**The problem it solves**
Standard Power BI slicers flatten everything into one list. When your data is naturally
hierarchical — category, then subcategory, then product — users lose context and reports
get cluttered with multiple linked slicers just to drill down manually.

**How it works**
Chip Slicer Hierarchy renders your hierarchy as clickable chips. Drop several fields into
a single well and the field order becomes the hierarchy. Click a top-level chip and its
children appear inline — no separate visual, no bookmarks, no extra clicks. Filtering
happens the moment you click; browsing without filtering is one tap away via the expand
icon.

**Who it's for**
Report builders and BI teams working with categorized data — product catalogs, org
structures, geography, any nested dimension — who want a compact, modern filtering UI
instead of a stack of dropdown slicers.

**What makes it different**
- Native drill-down inside a single visual, not multiple linked slicers
- Chip/pill visual language instead of list or dropdown UI
- Independent colour theming per hierarchy level, including the ancestors of whatever
  is selected
- Optional images and value badges directly on each chip

**At a glance**
- Unlimited hierarchy levels and values — the field order is the hierarchy
- Single-select, multi-select and leaf-only selection
- Search box (Pro) — filter across the whole hierarchy, matches marked and counted
- Value heatmap (Pro) — each chip coloured by its measure, scaled per level
- Full colour and style customisation per level
- Demo video: https://www.youtube.com/watch?v=Wt5CktHwN44

---

## Tab 2: Features

### Filtering
- Hierarchical drill-down across as many levels as you put in the Categories well
- Single-select, multi-select and leaf-only selection — restrict clicks to the deepest level
- Auto-collapse siblings — keep the chip list compact while browsing
- Configurable reset button and an 'All' chip to clear selections

### Display
- Optional image per chip, positioned left of or above the label
- Optional value badge per chip (compact / number / currency / percent)
- Optional tooltip fields on hover
- Horizontal or vertical layout
- Configurable chip height, radius, font size, gap and padding

### Search & navigation
- **Search box (Pro)** — filters chips across the whole hierarchy as you type, marking the
  matching text inside each chip and showing the number of results
- **Value heatmap (Pro)** — each chip tinted between two colours by its measure, normalised
  per level so a child is compared with its siblings; the label switches between dark and
  light so it stays readable at both ends of the scale
- Expand icon to browse a level without applying a filter
- Tab to focus a chip, Enter or Space to select
- Right-click context menu on chips and on empty space

### Styling
- Independent colour sets per hierarchy level: inactive, active and parent-of-selection
  states, each with background, border and text colours
- High-contrast themes are honoured — the visual follows the Power BI palette

### Free vs Pro

The visual is complete without a licence. Pro adds two things: finding what you need in a large hierarchy, and seeing where the
weight is. The search box filters chips across every level as you type, marking the
matches and counting them. The value heatmap tints each chip by its measure, scaled
level by level so a child is compared with its siblings.

| Feature | Free | Pro |
|---|---|---|
| Hierarchy levels and values per level | Unlimited | Unlimited |
| Single-select, multi-select, leaf-only | ✓ | ✓ |
| Auto-collapse, reset button, 'All' chip | ✓ | ✓ |
| Custom per-level colours | ✓ | ✓ |
| Image chips, value badges, tooltips | ✓ | ✓ |
| Keyboard activation, context menu, high contrast | ✓ | ✓ |
| **Search box**, with matches marked and counted | ✗ | **✓** |
| **Value heatmap** — chips coloured by their measure | ✗ | **✓** |

Turn either on without a licence and Power BI shows its own notification with the link to
obtain one. The setting is kept and applies as soon as the licence is active.

---

## Tab 3: Technical

**Specs**
- API version: 5.10.0
- Current version: 1.1.0.0
- Platform: Power BI Desktop & Power BI Service

**Field wells**
- **Categories** (required) — grouping fields, in order. The field order defines the
  hierarchy: the first field is the top level, the next sits under it, and so on.
- **Images** (optional) — Base64 data URIs (`data:image/*;base64,...`), matching the
  Categories order. External URLs are rejected; see below.
- **Values** (optional) — one measure, shown as a badge per chip
- **Tooltips** (optional) — additional fields shown on hover

**External file requirements**
None. Images must already be embedded in the data model as Base64 data URIs. The visual
does not fetch anything: external `http(s)://` and `blob:` values are rejected at parse
time and never reach `img.src`. This is deliberate — it guarantees the visual makes no
outbound network requests.

**Performance**
Categorical data view with a 2,000-row reduction algorithm on Categories; rendering events
(`renderingStarted` / `renderingFinished` / `renderingFailed`) reported on every update.

**Power BI integration**
- Filter state synchronisation across slicers (`supportsSynchronizingFilterState`)
- Multi-visual selection and keyboard focus supported
- Landing page shown when no data is bound
- Standard tooltips via the Power BI tooltip service

**Compatibility**
Power BI Desktop and Power BI Service, current and prior major releases supporting custom
visuals API 5.x.

**Licensing**
Managed exclusively through Microsoft's official `IVisualLicenseManager` API — no external
authentication, account or payment system. Licence resolution is asynchronous and never
blocks rendering.

**Privacy**
No data leaves the Power BI environment. The visual makes no network calls and persists
only its own formatting settings inside the `.pbix`.
See the [Privacy Policy](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html).

**Dependencies**
None beyond the Power BI Visuals API and `powerbi-visuals-utils-formattingmodel`.

**Support**
- Docs: https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html
- Issues: https://github.com/tinocallarisa-web/ChipSlicerHierarchy/issues
- Email: support@tcviz.com

---

## Tab 4: Changelog

(Mirror of `CHANGELOG.md` — keep both in sync on every release.)

### 1.1.0.0
- **Added:** value heatmap (Pro) — chips coloured by their measure, scaled per level
- **Added:** search match highlighting and result count (Pro)
- **Changed:** a Pro setting without a licence now raises Power BI's own notification, with
  the link to obtain one; the in-visual "Search requires Pro" notice is gone
- **Added:** bookmarks restore the selection, cross-highlighting dims chips out of scope,
  and `allowInteractions` is honoured
- **Fixed:** a licence in its payment grace period read as absent, and Publish to Web,
  embedding and PDF export asked a paying customer to buy what they already own

### 1.0.0.4
- Fixed the support URL, which pointed to a page that returns 404
- Rewrote the Terms of Use page, which was truncated mid-sentence and described licence
  tiers that were never implemented. The only Pro feature is, and has always been, the
  search box. No functionality changed for any user.
- Rewrote the support page to document field wells, the format pane and the real tiers

### 1.0.0.3
- Images are now restricted to Base64 data URIs; external URLs are rejected at parse time

### 1.0.0.2
- Context menu on empty space, in addition to the existing per-chip context menu

### 1.0.0.1
- Added image chips (optional image per hierarchy level)
- Added value badges (optional measure shown as a badge per chip, with
  compact/number/currency/percent formatting)

### 1.0.0.0
- Initial release: hierarchical chip slicer with drill-down filtering, multi-select and
  leaf-only selection, independent per-level colour theming, search box, auto-collapse and
  configurable reset button
