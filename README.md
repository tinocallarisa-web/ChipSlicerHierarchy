# ChipSlicer Hierarchy — Power BI Custom Visual

**by [TCViz](https://tcviz.com)**

A hierarchical chip/pill slicer for Power BI. Drop several fields into one well and the
field order becomes the hierarchy — click a chip to filter, expand it to drill down.

[![AppSource](https://img.shields.io/badge/AppSource-Available-0078D4?logo=microsoft)](https://appsource.microsoft.com)
[![Version](https://img.shields.io/badge/version-1.1.0.0-brightgreen)](./pbiviz.json)
[![License](https://img.shields.io/badge/license-Commercial-orange)](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html)

📖 **[Documentation & Support](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html)** ·
🎬 **[Video walkthrough](https://www.youtube.com/watch?v=rdZLCxpP6Pk)** ·
📝 **[Changelog](./CHANGELOG.md)**

---

## Features

The slicer is complete without a licence. Pro adds two things: finding what you need in a
large hierarchy, and seeing where the weight is.

| Feature | Free | Pro |
|---|---|---|
| Hierarchy levels | Up to 3 | Up to 3 |
| Values in the hierarchy | Up to 2,000 | Up to 2,000 |
| Single-select, multi-select, leaf-only selection | ✓ | ✓ |
| Expand / collapse, auto-collapse siblings | ✓ | ✓ |
| Custom per-level colours | ✓ | ✓ |
| Image chips, value badges, tooltips | ✓ | ✓ |
| Configurable reset button and 'All' chip | ✓ | ✓ |
| Keyboard activation, context menu, high contrast | ✓ | ✓ |
| **Search box** — filter across the whole hierarchy, with matches highlighted and a result count | ✗ | **✓** |
| **Value heatmap** — colour each chip by its measure | ✗ | **✓** |

Without a licence these are simply not applied, and Power BI shows its own notification
with a link to obtain one — the setting you changed is kept and takes effect as soon as
the licence is active. Licence status is resolved through the official Power BI licensing
API; TCViz runs no licence server and receives no data from your report.

## How it works

1. Drag one or more fields into the **Categories** well. **The field order is the
   hierarchy**: the first field is the top level, the second sits under it, and so on.
   There is no separate well per level.
2. Click a chip to filter the report. Click it again to clear.
3. Click the expand icon (▸) on a parent chip to browse its children without filtering.

Optional wells: **Images** (Base64 data URIs only), **Values** (a measure shown as a
badge) and **Tooltips**.

## Installation

Install directly from [Microsoft AppSource](https://appsource.microsoft.com).

### Build from source

```bash
# Prerequisites: Node.js 18+, pbiviz tools
npm install -g powerbi-visuals-tools
npm install

npm start          # dev server, live reload in Power BI Desktop
npm run build      # .pbiviz package, output in dist/
node build-test.js         # test build, isPro forced, guid ..._test
node build-test.js --free  # test build, real Free tier, guid ..._testfree
```

## Project structure

```
ChipSlicerHierarchy/
├── src/
│   ├── visual.ts          # Main visual logic + HierarchyManager
│   └── settings.ts        # Formatting settings model
├── style/visual.less
├── assets/icon.svg
├── stringResources/       # en-US, es-ES
├── privacy.html           # served at /ChipSlicerHierarchy/privacy.html
├── support.html           # served at /ChipSlicerHierarchy/support.html
├── terms.html             # served at /ChipSlicerHierarchy/terms.html
├── docs/                  # release deliverables (not served)
├── capabilities.json      # Data roles & formatting objects
├── pbiviz.json            # Visual metadata
└── tsconfig.json
```

The three public pages live in the repository root and are served by GitHub Pages.

## AppSource compliance

- [x] Context menu on empty space and on individual chips
- [x] Tooltips on all chips via `host.tooltipService`
- [x] Terms of Use separate from Privacy Policy, both at public URLs
- [x] Sample .pbix with 13+ unique values and a Tips & Hints page
- [x] Rendering events on every `update()` path
- [x] Official `IVisualLicenseManager` API, resolved asynchronously
- [x] No watermark and no artificial limits in the free tier
- [x] Images restricted to Base64 data URIs — the visual makes no outbound requests

- [x] Bookmarks restore the selection from the applied filter
- [x] `allowInteractions` checked before selecting
- [x] `supportsHighlight` implemented: chips outside a cross-highlight are dimmed
- [x] No `innerHTML` anywhere, and no suppression of `no-inner-outer-html`

Known gaps: arrow-key navigation between chips and report-tooltip pages. See
[docs/CERTIFICATION-NOTES.md](./docs/CERTIFICATION-NOTES.md).

## Privacy

All processing happens inside Power BI. The visual makes no network requests, collects
nothing, and persists only its own formatting settings inside the `.pbix`.
See the [Privacy Policy](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html).

## License

**Commercial software.** See the
[Terms of Use](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html).
Source code is published for AppSource review transparency. Redistribution is not permitted.

## Support

- 📖 [Documentation](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html)
- 🐛 [Report a bug](https://github.com/tinocallarisa-web/ChipSlicerHierarchy/issues)
- 💬 [Discussions](https://github.com/tinocallarisa-web/ChipSlicerHierarchy/discussions)
- 📧 [support@tcviz.com](mailto:support@tcviz.com)
