# Sample .pbix Build Instructions

AppSource requires a sample `.pbix` file with:
- **13+ unique values** across the hierarchy fields
- A **"Hints & Tips"** page explaining how to use the visual

## Steps

### 1 — Import the sample data

1. Open **Power BI Desktop**
2. **Home → Get Data → Text/CSV**
3. Select `assets/sample-data.csv`
4. Click **Load**

### 2 — Add the ChipSlicer Hierarchy visual

1. In the **Visualizations** pane, click **"…" → Import visual from file**
2. Select the built `.pbiviz` from the `dist/` folder
3. Add the visual to the canvas

### 3 — Bind the fields

| Visual field well | Table column |
|---|---|
| Category (Level 1) | `sample-data[Category]` |
| SubCategory (Level 2) | `sample-data[SubCategory]` |
| Product (Level 3) | `sample-data[Product]` |

### 4 — Add a simple companion visual

Add a **Table** or **Card** visual so reviewers can see the filter working:
- Drag `Category`, `SubCategory`, `Product` into it

### 5 — Create the "Hints & Tips" page

1. Add a new page, rename it **"Hints & Tips"**
2. Insert a **Text Box** with this content:

---

**ChipSlicer Hierarchy — Quick Start**

🔹 **Level 1 (Category):** Drag your top-level grouping here (e.g. Category, Region, Year).  
🔹 **Level 2 (SubCategory):** Optional. Drag a sub-grouping field here.  
🔹 **Level 3 (Product):** Optional leaf level (e.g. Product name, SKU).

**Interactions:**  
• Click a chip to filter — child chips expand automatically.  
• Click the **▸** icon to expand without filtering.  
• Click **↺ Reset** (Pro) to clear all filters.  
• **Ctrl+Click** for multi-select (Pro).

**Pro tier unlocks:**  
✅ 3rd hierarchy level  
✅ Unlimited values per level  
✅ Multi-select  
✅ Custom colours per level  
✅ Auto-collapse siblings  
✅ Configurable Reset button  

Get Pro at **tcviz.com/chipslicer-hierarchy**

---

### 6 — Save

Save as `ChipSlicerHierarchy-Sample.pbix` and place it in `assets/`.

## Value count verification

The sample CSV contains:
- **4** unique Categories  
- **12** unique SubCategories  
- **29** unique Products  

Total unique values across all levels: **45** ✅ (well above the 13 minimum)
