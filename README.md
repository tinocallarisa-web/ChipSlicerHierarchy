# ChipSlicer Hierarchy — Power BI Custom Visual

**by [TCViz](https://tcviz.com)**

A hierarchical chip/pill slicer for Power BI with drill-down filtering across up to 3 levels:  
**Category → SubCategory → Product**

[![AppSource](https://img.shields.io/badge/AppSource-Available-0078D4?logo=microsoft)](https://appsource.microsoft.com)
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)](./pbiviz.json)
[![License](https://img.shields.io/badge/license-Commercial-orange)](./docs/terms-of-use.html)

---

## Features

| Feature | Free | Pro |
|---|---|---|
| Hierarchy levels | 2 | **3** |
| Values per level | 20 | **Unlimited** |
| Multi-select | ✗ | **✓** |
| Custom per-level colors | ✗ | **✓** |
| Auto-collapse siblings | ✗ | **✓** |
| Configurable reset button | ✗ | **✓** |

## How It Works

1. Drag a **Category** field into the *Level 1* well  
2. (Optional) Add a **SubCategory** field to *Level 2*  
3. (Optional) Add a **Product** field to *Level 3*  
4. Click a chip to filter — child chips expand automatically  
5. Click the expand icon (▸) to browse without filtering  

## Installation

Install directly from [Microsoft AppSource](https://appsource.microsoft.com).

### Build from Source

```bash
# Prerequisites: Node.js 18+, pbiviz tools
npm install -g powerbi-visuals-tools

# Install dependencies
npm install

# Start development server (live reload in Power BI Desktop)
npm start

# Build .pbiviz package
npm run build
```

The output `.pbiviz` file will be in the `dist/` folder.

## Project Structure

```
ChipSlicerHierarchy/
├── src/
│   ├── visual.ts          # Main visual logic + HierarchyManager
│   └── settings.ts        # Formatting settings model
├── style/
│   └── visual.less        # Visual styles
├── assets/
│   └── icon.svg           # AppSource icon (20×20)
├── stringResources/
│   ├── en-US/resources.resjson
│   └── es-ES/resources.resjson
├── docs/
│   ├── privacy-policy.html   # https://tcviz.com/privacy
│   └── terms-of-use.html     # https://tcviz.com/terms
├── capabilities.json      # Data roles & formatting objects
├── pbiviz.json            # Visual metadata
├── package.json
└── tsconfig.json
```

## AppSource Compliance Checklist

- [x] Context menu on empty space (null selectionId) — req. 1
- [x] Tooltips on all chips (`chip.title = label`) — req. 2
- [x] Terms of Use separate from Privacy Policy — req. 3
- [x] Sample .pbix with 13+ unique values & Hints page — req. 4 & 5
- [x] Privacy policy in English at public URL — req. 6
- [x] Correct version in pbiviz.json — req. 7
- [x] Public GitHub repository — req. 8
- [x] No intrusive watermark in free tier — req. 9
- [x] Official `IVisualLicenseManager` API — req. 10

## License

**Commercial software.** See [Terms of Use](./docs/terms-of-use.html) and [Privacy Policy](./docs/privacy-policy.html).  
Source code published for AppSource review transparency. Redistribution not permitted.

## Support

- 📧 [support@tcviz.com](mailto:support@tcviz.com)  
- 🌐 [tcviz.com/support](https://tcviz.com/support)  
- 🐛 [Open an issue](https://github.com/tcviz/chipslicer-hierarchy/issues)
