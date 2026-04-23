import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

// ─────────────────────────────────────────────────────────────────────────────
// Chip Style card — shared defaults (used by Level 1 and as fallback)
// ─────────────────────────────────────────────────────────────────────────────
class ChipSettingsCard extends FormattingSettingsCard {
    public multiSelect = new formattingSettings.ToggleSwitch({
        name: "multiSelect",
        displayName: "Multi-select",
        value: false
    });

    public layout = new formattingSettings.ItemDropdown({
        name: "layout",
        displayName: "Layout",
        items: [
            { value: "horizontal", displayName: "Horizontal" },
            { value: "vertical", displayName: "Vertical" }
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
        this.multiSelect,
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
// Level 1 colours
// ─────────────────────────────────────────────────────────────────────────────
class Level1ColorsCard extends FormattingSettingsCard {
    public defaultBg = new formattingSettings.ColorPicker({
        name: "defaultBg",
        displayName: "Inactive background",
        value: { value: "#F3F4F6" }
    });
    public defaultBorder = new formattingSettings.ColorPicker({
        name: "defaultBorder",
        displayName: "Inactive border",
        value: { value: "#E5E7EB" }
    });
    public defaultText = new formattingSettings.ColorPicker({
        name: "defaultText",
        displayName: "Inactive text",
        value: { value: "#374151" }
    });
    public activeBg = new formattingSettings.ColorPicker({
        name: "activeBg",
        displayName: "Active background",
        value: { value: "#378ADD" }
    });
    public activeBorder = new formattingSettings.ColorPicker({
        name: "activeBorder",
        displayName: "Active border",
        value: { value: "#378ADD" }
    });
    public activeText = new formattingSettings.ColorPicker({
        name: "activeText",
        displayName: "Active text",
        value: { value: "#FFFFFF" }
    });
    public parentBg = new formattingSettings.ColorPicker({
        name: "parentBg",
        displayName: "Parent-of-selection background",
        value: { value: "#D6EBFA" }
    });
    public parentBorder = new formattingSettings.ColorPicker({
        name: "parentBorder",
        displayName: "Parent-of-selection border",
        value: { value: "#378ADD" }
    });
    public parentText = new formattingSettings.ColorPicker({
        name: "parentText",
        displayName: "Parent-of-selection text",
        value: { value: "#1A5FA8" }
    });

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
    public defaultBg = new formattingSettings.ColorPicker({
        name: "defaultBg",
        displayName: "Inactive background",
        value: { value: "#E8F5F4" }
    });
    public defaultBorder = new formattingSettings.ColorPicker({
        name: "defaultBorder",
        displayName: "Inactive border",
        value: { value: "#B2DDD9" }
    });
    public defaultText = new formattingSettings.ColorPicker({
        name: "defaultText",
        displayName: "Inactive text",
        value: { value: "#1B5E59" }
    });
    public activeBg = new formattingSettings.ColorPicker({
        name: "activeBg",
        displayName: "Active background",
        value: { value: "#0F9B8E" }
    });
    public activeBorder = new formattingSettings.ColorPicker({
        name: "activeBorder",
        displayName: "Active border",
        value: { value: "#0F9B8E" }
    });
    public activeText = new formattingSettings.ColorPicker({
        name: "activeText",
        displayName: "Active text",
        value: { value: "#FFFFFF" }
    });
    public parentBg = new formattingSettings.ColorPicker({
        name: "parentBg",
        displayName: "Parent-of-selection background",
        value: { value: "#C5EAE7" }
    });
    public parentBorder = new formattingSettings.ColorPicker({
        name: "parentBorder",
        displayName: "Parent-of-selection border",
        value: { value: "#0F9B8E" }
    });
    public parentText = new formattingSettings.ColorPicker({
        name: "parentText",
        displayName: "Parent-of-selection text",
        value: { value: "#0A6B62" }
    });

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
    public defaultBg = new formattingSettings.ColorPicker({
        name: "defaultBg",
        displayName: "Inactive background",
        value: { value: "#F0EBF8" }
    });
    public defaultBorder = new formattingSettings.ColorPicker({
        name: "defaultBorder",
        displayName: "Inactive border",
        value: { value: "#D4BEF0" }
    });
    public defaultText = new formattingSettings.ColorPicker({
        name: "defaultText",
        displayName: "Inactive text",
        value: { value: "#3D1F7A" }
    });
    public activeBg = new formattingSettings.ColorPicker({
        name: "activeBg",
        displayName: "Active background",
        value: { value: "#7B5EA7" }
    });
    public activeBorder = new formattingSettings.ColorPicker({
        name: "activeBorder",
        displayName: "Active border",
        value: { value: "#7B5EA7" }
    });
    public activeText = new formattingSettings.ColorPicker({
        name: "activeText",
        displayName: "Active text",
        value: { value: "#FFFFFF" }
    });

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
        value: true
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
    public chipSettingsCard    = new ChipSettingsCard();
    public hierarchySettingsCard = new HierarchySettingsCard();
    public level1ColorsCard    = new Level1ColorsCard();
    public level2ColorsCard    = new Level2ColorsCard();
    public level3ColorsCard    = new Level3ColorsCard();

    cards: FormattingSettingsCard[] = [
        this.chipSettingsCard,
        this.hierarchySettingsCard,
        this.level1ColorsCard,
        this.level2ColorsCard,
        this.level3ColorsCard
    ];
}
