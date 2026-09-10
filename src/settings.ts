import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard  = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

// ─────────────────────────────────────────────────────────────────────────────
// Chip Style card
// ─────────────────────────────────────────────────────────────────────────────
class ChipSettingsCard extends FormattingSettingsCard {
    public multiSelect = new formattingSettings.ToggleSwitch({
        name: "multiSelect",
        displayName: "Multi-select",
        value: true
    });

    public leafOnly = new formattingSettings.ToggleSwitch({
        name: "leafOnly",
        displayName: "Leaf-only selection",
        value: false
    });

    public hideBlank = new formattingSettings.ToggleSwitch({
        name: "hideBlank",
        displayName: "Hide blank values",
        value: true
    });

    public defaultSelection = new formattingSettings.ItemDropdown({
        name: "defaultSelection",
        displayName: "Default selection",
        items: [
            { value: "none",  displayName: "None" },
            { value: "first", displayName: "First value" }
        ],
        value: { value: "none", displayName: "None" }
    });

    public layout = new formattingSettings.ItemDropdown({
        name: "layout",
        displayName: "Layout",
        items: [
            { value: "horizontal", displayName: "Horizontal" },
            { value: "vertical",   displayName: "Vertical" }
        ],
        value: { value: "horizontal", displayName: "Horizontal" }
    });

    public chipHeight = new formattingSettings.NumUpDown({
        name: "chipHeight",
        displayName: "Chip height (px)",
        value: 34
    });

    public chipRadius = new formattingSettings.NumUpDown({
        name: "chipRadius",
        displayName: "Border radius (px)",
        value: 17
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font size",
        value: 12
    });

    public chipGap = new formattingSettings.NumUpDown({
        name: "chipGap",
        displayName: "Gap (px)",
        value: 6
    });

    public chipPaddingH = new formattingSettings.NumUpDown({
        name: "chipPaddingH",
        displayName: "Horizontal padding (px)",
        value: 16
    });

    public showSelectAll = new formattingSettings.ToggleSwitch({
        name: "showSelectAll",
        displayName: "Show 'All' button",
        value: true
    });

    public selectAllLabel = new formattingSettings.TextInput({
        name: "selectAllLabel",
        displayName: "'All' button text",
        placeholder: "All",
        value: "All"
    });

    name: string = "chipSettings";
    displayName: string = "Chip Style";
    slices: FormattingSettingsSlice[] = [
        this.layout,
        this.multiSelect,
        this.leafOnly,
        this.hideBlank,
        this.defaultSelection,
        this.chipHeight,
        this.chipRadius,
        this.fontSize,
        this.chipGap,
        this.chipPaddingH,
        this.showSelectAll,
        this.selectAllLabel
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Search settings card
// ─────────────────────────────────────────────────────────────────────────────
class SearchSettingsCard extends FormattingSettingsCard {
    public showSearch = new formattingSettings.ToggleSwitch({
        name: "showSearch",
        displayName: "Show search box (Pro)",
        value: false
    });

    public highlightMatches = new formattingSettings.ToggleSwitch({
        name: "highlightMatches",
        displayName: "Highlight matches (Pro)",
        value: true
    });

    public showResultCount = new formattingSettings.ToggleSwitch({
        name: "showResultCount",
        displayName: "Show result count (Pro)",
        value: true
    });

    public searchPlaceholder = new formattingSettings.TextInput({
        name: "searchPlaceholder",
        displayName: "Placeholder text",
        placeholder: "Search…",
        value: "Search…"
    });

    public searchBg = new formattingSettings.ColorPicker({
        name: "searchBg",
        displayName: "Background",
        value: { value: "#FFFFFF" }
    });

    public searchBorder = new formattingSettings.ColorPicker({
        name: "searchBorder",
        displayName: "Border color",
        value: { value: "#D1D5DB" }
    });

    public searchText = new formattingSettings.ColorPicker({
        name: "searchText",
        displayName: "Text color",
        value: { value: "#374151" }
    });

    name: string = "searchSettings";
    displayName: string = "Search (Pro)";
    slices: FormattingSettingsSlice[] = [
        this.showSearch,
        this.searchPlaceholder,
        this.searchBg,
        this.searchBorder,
        this.searchText
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Image settings card
// ─────────────────────────────────────────────────────────────────────────────
class ImageSettingsCard extends FormattingSettingsCard {
    public imageHeight = new formattingSettings.NumUpDown({
        name: "imageHeight",
        displayName: "Image height (px)",
        value: 24
    });

    public imagePosition = new formattingSettings.ItemDropdown({
        name: "imagePosition",
        displayName: "Image position",
        items: [
            { value: "left",  displayName: "Left of label" },
            { value: "above", displayName: "Above label" }
        ],
        value: { value: "left", displayName: "Left of label" }
    });

    public imageRadius = new formattingSettings.NumUpDown({
        name: "imageRadius",
        displayName: "Image border radius (px)",
        value: 4
    });

    name: string = "imageSettings";
    displayName: string = "Images";
    slices: FormattingSettingsSlice[] = [
        this.imageHeight,
        this.imagePosition,
        this.imageRadius
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Value Badge card
// ─────────────────────────────────────────────────────────────────────────────
class ValueSettingsCard extends FormattingSettingsCard {
    public showValue = new formattingSettings.ToggleSwitch({
        name: "showValue",
        displayName: "Show value badge",
        value: false
    });

    public valueFormat = new formattingSettings.ItemDropdown({
        name: "valueFormat",
        displayName: "Format",
        items: [
            { value: "compact",  displayName: "Compact (K / M / B)" },
            { value: "number",   displayName: "Number" },
            { value: "currency", displayName: "Currency ($)" },
            { value: "percent",  displayName: "Percentage (%)" }
        ],
        value: { value: "compact", displayName: "Compact (K / M / B)" }
    });

    public valueBg = new formattingSettings.ColorPicker({
        name: "valueBg",
        displayName: "Background",
        value: { value: "#E5E7EB" }
    });

    public valueText = new formattingSettings.ColorPicker({
        name: "valueText",
        displayName: "Text color",
        value: { value: "#374151" }
    });

    public valueFontSize = new formattingSettings.NumUpDown({
        name: "valueFontSize",
        displayName: "Font size (px)",
        value: 11
    });

    public valueRadius = new formattingSettings.NumUpDown({
        name: "valueRadius",
        displayName: "Border radius (px)",
        value: 10
    });

    public valuePaddingH = new formattingSettings.NumUpDown({
        name: "valuePaddingH",
        displayName: "Horizontal padding (px)",
        value: 6
    });

    public showInTooltip = new formattingSettings.ToggleSwitch({
        name: "showInTooltip",
        displayName: "Show in tooltip",
        value: true
    });

    name: string = "valueSettings";
    displayName: string = "Value Badge";
    slices: FormattingSettingsSlice[] = [
        this.showValue,
        this.valueFormat,
        this.valueBg,
        this.valueText,
        this.valueFontSize,
        this.valueRadius,
        this.valuePaddingH,
        this.showInTooltip
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Level 1 colours
// ─────────────────────────────────────────────────────────────────────────────
class Level1ColorsCard extends FormattingSettingsCard {
    public defaultBg     = new formattingSettings.ColorPicker({ name: "defaultBg",     displayName: "Inactive background",           value: { value: "#F3F4F6" } });
    public defaultBorder = new formattingSettings.ColorPicker({ name: "defaultBorder", displayName: "Inactive border",               value: { value: "#E5E7EB" } });
    public defaultText   = new formattingSettings.ColorPicker({ name: "defaultText",   displayName: "Inactive text",                 value: { value: "#374151" } });
    public activeBg      = new formattingSettings.ColorPicker({ name: "activeBg",      displayName: "Active background",             value: { value: "#378ADD" } });
    public activeBorder  = new formattingSettings.ColorPicker({ name: "activeBorder",  displayName: "Active border",                 value: { value: "#378ADD" } });
    public activeText    = new formattingSettings.ColorPicker({ name: "activeText",    displayName: "Active text",                   value: { value: "#FFFFFF" } });
    public parentBg      = new formattingSettings.ColorPicker({ name: "parentBg",      displayName: "Parent-of-selection background",value: { value: "#D6EBFA" } });
    public parentBorder  = new formattingSettings.ColorPicker({ name: "parentBorder",  displayName: "Parent-of-selection border",    value: { value: "#378ADD" } });
    public parentText    = new formattingSettings.ColorPicker({ name: "parentText",    displayName: "Parent-of-selection text",      value: { value: "#1A5FA8" } });

    name: string = "level1Colors";
    displayName: string = "Level 1 Colors";
    slices: FormattingSettingsSlice[] = [
        this.defaultBg, this.defaultBorder, this.defaultText,
        this.activeBg, this.activeBorder, this.activeText,
        this.parentBg, this.parentBorder, this.parentText
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Level 2 colours
// ─────────────────────────────────────────────────────────────────────────────
class Level2ColorsCard extends FormattingSettingsCard {
    public defaultBg     = new formattingSettings.ColorPicker({ name: "defaultBg",     displayName: "Inactive background",           value: { value: "#E8F5F4" } });
    public defaultBorder = new formattingSettings.ColorPicker({ name: "defaultBorder", displayName: "Inactive border",               value: { value: "#B2DDD9" } });
    public defaultText   = new formattingSettings.ColorPicker({ name: "defaultText",   displayName: "Inactive text",                 value: { value: "#1B5E59" } });
    public activeBg      = new formattingSettings.ColorPicker({ name: "activeBg",      displayName: "Active background",             value: { value: "#0F9B8E" } });
    public activeBorder  = new formattingSettings.ColorPicker({ name: "activeBorder",  displayName: "Active border",                 value: { value: "#0F9B8E" } });
    public activeText    = new formattingSettings.ColorPicker({ name: "activeText",    displayName: "Active text",                   value: { value: "#FFFFFF" } });
    public parentBg      = new formattingSettings.ColorPicker({ name: "parentBg",      displayName: "Parent-of-selection background",value: { value: "#C5EAE7" } });
    public parentBorder  = new formattingSettings.ColorPicker({ name: "parentBorder",  displayName: "Parent-of-selection border",    value: { value: "#0F9B8E" } });
    public parentText    = new formattingSettings.ColorPicker({ name: "parentText",    displayName: "Parent-of-selection text",      value: { value: "#0A6B62" } });

    name: string = "level2Colors";
    displayName: string = "Level 2 Colors";
    slices: FormattingSettingsSlice[] = [
        this.defaultBg, this.defaultBorder, this.defaultText,
        this.activeBg, this.activeBorder, this.activeText,
        this.parentBg, this.parentBorder, this.parentText
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Level 3 colours
// ─────────────────────────────────────────────────────────────────────────────
class Level3ColorsCard extends FormattingSettingsCard {
    public defaultBg     = new formattingSettings.ColorPicker({ name: "defaultBg",     displayName: "Inactive background",value: { value: "#F0EBF8" } });
    public defaultBorder = new formattingSettings.ColorPicker({ name: "defaultBorder", displayName: "Inactive border",    value: { value: "#D4BEF0" } });
    public defaultText   = new formattingSettings.ColorPicker({ name: "defaultText",   displayName: "Inactive text",      value: { value: "#3D1F7A" } });
    public activeBg      = new formattingSettings.ColorPicker({ name: "activeBg",      displayName: "Active background",  value: { value: "#7B5EA7" } });
    public activeBorder  = new formattingSettings.ColorPicker({ name: "activeBorder",  displayName: "Active border",      value: { value: "#7B5EA7" } });
    public activeText    = new formattingSettings.ColorPicker({ name: "activeText",    displayName: "Active text",        value: { value: "#FFFFFF" } });

    name: string = "level3Colors";
    displayName: string = "Level 3 Colors";
    slices: FormattingSettingsSlice[] = [
        this.defaultBg, this.defaultBorder, this.defaultText,
        this.activeBg, this.activeBorder, this.activeText
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hierarchy behaviour card
// ─────────────────────────────────────────────────────────────────────────────
// ─── Value Heatmap (Pro) ─────────────────────────────────────────────────────

class HeatmapSettingsCard extends FormattingSettingsCard {
    public showHeatmap = new formattingSettings.ToggleSwitch({
        name: "showHeatmap",
        displayName: "Color chips by value (Pro)",
        value: false
    });

    public colorLow = new formattingSettings.ColorPicker({
        name: "colorLow",
        displayName: "Low value",
        value: { value: "#EDE9DE" }
    });

    public colorHigh = new formattingSettings.ColorPicker({
        name: "colorHigh",
        displayName: "High value",
        value: { value: "#C96442" }
    });

    name: string = "heatmapSettings";
    displayName: string = "Value Heatmap (Pro)";
    slices: FormattingSettingsSlice[] = [
        this.showHeatmap,
        this.colorLow,
        this.colorHigh
    ];
}

class HierarchySettingsCard extends FormattingSettingsCard {
    public indentSize = new formattingSettings.NumUpDown({
        name: "indentSize",
        displayName: "Indent per level (px)",
        value: 20
    });

    public expandIcon = new formattingSettings.ToggleSwitch({
        name: "expandIcon",
        displayName: "Show expand icon",
        value: true
    });

    public autoCollapse = new formattingSettings.ToggleSwitch({
        name: "autoCollapse",
        displayName: "Auto-collapse siblings",
        value: false
    });

    public showReset = new formattingSettings.ToggleSwitch({
        name: "showReset",
        displayName: "Show reset button",
        value: false
    });

    public resetLabel = new formattingSettings.TextInput({
        name: "resetLabel",
        displayName: "Reset button label",
        placeholder: "↺ Reset",
        value: "↺ Reset"
    });

    public resetBg = new formattingSettings.ColorPicker({
        name: "resetBg",
        displayName: "Reset button background",
        value: { value: "#F3F4F6" }
    });

    public resetBorder = new formattingSettings.ColorPicker({
        name: "resetBorder",
        displayName: "Reset button border",
        value: { value: "#D1D5DB" }
    });

    public resetText = new formattingSettings.ColorPicker({
        name: "resetText",
        displayName: "Reset button text",
        value: { value: "#6B7280" }
    });

    name: string = "hierarchySettings";
    displayName: string = "Hierarchy";
    slices: FormattingSettingsSlice[] = [
        this.indentSize,
        this.expandIcon,
        this.autoCollapse,
        this.showReset,
        this.resetLabel,
        this.resetBg,
        this.resetBorder,
        this.resetText
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Root model
// ─────────────────────────────────────────────────────────────────────────────
export class VisualSettingsModel extends FormattingSettingsModel {
    public chipSettingsCard      = new ChipSettingsCard();
    public searchSettingsCard    = new SearchSettingsCard();
    public imageSettingsCard     = new ImageSettingsCard();
    public valueSettingsCard     = new ValueSettingsCard();
    public heatmapSettingsCard   = new HeatmapSettingsCard();
    public hierarchySettingsCard = new HierarchySettingsCard();
    public level1ColorsCard      = new Level1ColorsCard();
    public level2ColorsCard      = new Level2ColorsCard();
    public level3ColorsCard      = new Level3ColorsCard();

    cards: FormattingSettingsCard[] = [
        this.chipSettingsCard,
        this.searchSettingsCard,
        this.imageSettingsCard,
        this.valueSettingsCard,
        this.heatmapSettingsCard,
        this.hierarchySettingsCard,
        this.level1ColorsCard,
        this.level2ColorsCard,
        this.level3ColorsCard
    ];
}
