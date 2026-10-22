import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard  = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

// Las propiedades publicadas hasta 1.2 no cambian de objeto ni de nombre (informes guardados). La 1.3 añade
// propiedades y tarjetas nuevas, y claves de traducción a las tarjetas y a los valores de las listas.

// ─────────────────────────────────────────────────────────────────────────────
// Chip Style card
// ─────────────────────────────────────────────────────────────────────────────
class ChipSettingsCard extends FormattingSettingsCard {
    public multiSelect = new formattingSettings.ToggleSwitch({
        name: "multiSelect",
        displayName: "Multi-select",
        displayNameKey: "multiSelect",
        value: true
    });

    public leafOnly = new formattingSettings.ToggleSwitch({
        name: "leafOnly",
        displayName: "Leaf-only selection",
        displayNameKey: "leafOnly",
        value: false
    });

    public hideBlank = new formattingSettings.ToggleSwitch({
        name: "hideBlank",
        displayName: "Hide blank values",
        displayNameKey: "hideBlanks",
        value: true
    });

    public defaultSelection = new formattingSettings.ItemDropdown({
        name: "defaultSelection",
        displayName: "Default selection",
        displayNameKey: "defaultSelection",
        items: [
            { value: "none",   displayName: "None",         displayNameKey: "Enum_none" } as any,
            { value: "first",  displayName: "First value",  displayNameKey: "Enum_first" } as any,
            { value: "values", displayName: "These values", displayNameKey: "Enum_values" } as any
        ],
        value: { value: "none", displayName: "None", displayNameKey: "Enum_none" } as any
    });

    public defaultValues = new formattingSettings.TextInput({
        name: "defaultValues",
        displayName: "Default values",
        displayNameKey: "defaultValues",
        placeholder: "e.g. Spain, France",
        value: ""
    });

    public layout = new formattingSettings.ItemDropdown({
        name: "layout",
        displayName: "Layout",
        displayNameKey: "layout",
        items: [
            { value: "horizontal", displayName: "Horizontal", displayNameKey: "Enum_horizontal" } as any,
            { value: "vertical",   displayName: "Vertical",   displayNameKey: "Enum_vertical" } as any
        ],
        value: { value: "horizontal", displayName: "Horizontal", displayNameKey: "Enum_horizontal" } as any
    });

    public chipHeight = new formattingSettings.NumUpDown({
        name: "chipHeight",
        displayName: "Chip height (px)",
        displayNameKey: "chipHeight",
        value: 34
    });

    public chipRadius = new formattingSettings.NumUpDown({
        name: "chipRadius",
        displayName: "Border radius (px)",
        displayNameKey: "chipRadius",
        value: 17
    });

    public fontFamily = new formattingSettings.FontPicker({
        name: "fontFamily",
        displayName: "Font",
        displayNameKey: "fontFamily",
        value: "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif"
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font size",
        displayNameKey: "fontSize",
        value: 12
    });

    public chipGap = new formattingSettings.NumUpDown({
        name: "chipGap",
        displayName: "Gap (px)",
        displayNameKey: "chipGap",
        value: 6
    });

    public chipPaddingH = new formattingSettings.NumUpDown({
        name: "chipPaddingH",
        displayName: "Horizontal padding (px)",
        displayNameKey: "chipPaddingH",
        value: 16
    });

    public showSelectAll = new formattingSettings.ToggleSwitch({
        name: "showSelectAll",
        displayName: "Show 'All' button",
        displayNameKey: "showSelectAll",
        value: true
    });

    public selectAllLabel = new formattingSettings.TextInput({
        name: "selectAllLabel",
        displayName: "'All' button text",
        displayNameKey: "selectAllLabel",
        placeholder: "All",
        value: "All"
    });

    name: string = "chipSettings";
    displayName: string = "Chip Style";
    displayNameKey: string = "card_chipSettings";
    slices: FormattingSettingsSlice[] = [
        this.layout,
        this.multiSelect,
        this.leafOnly,
        this.hideBlank,
        this.defaultSelection,
        this.defaultValues,
        this.chipHeight,
        this.chipRadius,
        this.fontFamily,
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
        displayNameKey: "showSearch",
        value: false
    });

    public highlightMatches = new formattingSettings.ToggleSwitch({
        name: "highlightMatches",
        displayName: "Highlight matches (Pro)",
        displayNameKey: "highlightMatches",
        value: true
    });

    public showResultCount = new formattingSettings.ToggleSwitch({
        name: "showResultCount",
        displayName: "Show result count (Pro)",
        displayNameKey: "showResultCount",
        value: true
    });

    public searchPlaceholder = new formattingSettings.TextInput({
        name: "searchPlaceholder",
        displayName: "Placeholder text",
        displayNameKey: "searchPlaceholder",
        placeholder: "Search…",
        value: "Search…"
    });

    public searchBg = new formattingSettings.ColorPicker({
        name: "searchBg",
        displayName: "Background",
        displayNameKey: "badgeBg",
        value: { value: "#FFFFFF" }
    });

    public searchBorder = new formattingSettings.ColorPicker({
        name: "searchBorder",
        displayName: "Border color",
        displayNameKey: "badgeBorder",
        value: { value: "#D1D5DB" }
    });

    public searchText = new formattingSettings.ColorPicker({
        name: "searchText",
        displayName: "Text color",
        displayNameKey: "badgeText",
        value: { value: "#374151" }
    });

    name: string = "searchSettings";
    displayName: string = "Search (Pro)";
    displayNameKey: string = "card_searchSettings";
    slices: FormattingSettingsSlice[] = [
        this.showSearch,
        this.highlightMatches,
        this.showResultCount,
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
        displayNameKey: "imgHeight",
        value: 24
    });

    public imagePosition = new formattingSettings.ItemDropdown({
        name: "imagePosition",
        displayName: "Image position",
        displayNameKey: "imgPosition",
        items: [
            { value: "left",  displayName: "Left of label", displayNameKey: "Enum_left" } as any,
            { value: "above", displayName: "Above label",   displayNameKey: "Enum_above" } as any
        ],
        value: { value: "left", displayName: "Left of label", displayNameKey: "Enum_left" } as any
    });

    public imageRadius = new formattingSettings.NumUpDown({
        name: "imageRadius",
        displayName: "Image border radius (px)",
        displayNameKey: "imgRadius",
        value: 4
    });

    name: string = "imageSettings";
    displayName: string = "Images";
    displayNameKey: string = "card_imageSettings";
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
        displayNameKey: "showBadge",
        value: false
    });

    public valueFormat = new formattingSettings.ItemDropdown({
        name: "valueFormat",
        displayName: "Format",
        displayNameKey: "badgeFormat",
        items: [
            { value: "model",    displayName: "Model format",        displayNameKey: "Enum_model" } as any,
            { value: "compact",  displayName: "Compact (K / M / B)", displayNameKey: "Enum_compact" } as any,
            { value: "number",   displayName: "Number",              displayNameKey: "Enum_number" } as any,
            { value: "currency", displayName: "Currency ($)",        displayNameKey: "Enum_currency" } as any,
            { value: "percent",  displayName: "Percentage (%)",      displayNameKey: "Enum_percent" } as any
        ],
        // "compact" sigue siendo el valor por defecto: los informes guardados sin este ajuste se ven igual.
        value: { value: "compact", displayName: "Compact (K / M / B)", displayNameKey: "Enum_compact" } as any
    });

    public valueBg = new formattingSettings.ColorPicker({
        name: "valueBg",
        displayName: "Background",
        displayNameKey: "badgeBg",
        value: { value: "#E5E7EB" }
    });

    public valueText = new formattingSettings.ColorPicker({
        name: "valueText",
        displayName: "Text color",
        displayNameKey: "badgeText",
        value: { value: "#374151" }
    });

    public valueFontSize = new formattingSettings.NumUpDown({
        name: "valueFontSize",
        displayName: "Font size (px)",
        displayNameKey: "badgeFontSize",
        value: 11
    });

    public valueRadius = new formattingSettings.NumUpDown({
        name: "valueRadius",
        displayName: "Border radius (px)",
        displayNameKey: "chipRadius",
        value: 10
    });

    public valuePaddingH = new formattingSettings.NumUpDown({
        name: "valuePaddingH",
        displayName: "Horizontal padding (px)",
        displayNameKey: "chipPaddingH",
        value: 6
    });

    public showInTooltip = new formattingSettings.ToggleSwitch({
        name: "showInTooltip",
        displayName: "Show in tooltip",
        displayNameKey: "showInTooltip",
        value: true
    });

    name: string = "valueSettings";
    displayName: string = "Value Badge";
    displayNameKey: string = "card_valueSettings";
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
// Level colours
// ─────────────────────────────────────────────────────────────────────────────
const color = (name: string, displayName: string, value: string) =>
    new formattingSettings.ColorPicker({ name, displayName, displayNameKey: name, value: { value } });

class Level1ColorsCard extends FormattingSettingsCard {
    public defaultBg     = color("defaultBg",     "Inactive background", "#F3F4F6");
    public defaultBorder = color("defaultBorder", "Inactive border", "#E5E7EB");
    public defaultText   = color("defaultText",   "Inactive text", "#374151");
    public activeBg      = color("activeBg",      "Active background", "#378ADD");
    public activeBorder  = color("activeBorder",  "Active border", "#378ADD");
    public activeText    = color("activeText",    "Active text", "#FFFFFF");
    public parentBg      = color("parentBg",      "Parent-of-selection background", "#D6EBFA");
    public parentBorder  = color("parentBorder",  "Parent-of-selection border", "#378ADD");
    public parentText    = color("parentText",    "Parent-of-selection text", "#1A5FA8");

    name: string = "level1Colors";
    displayName: string = "Level 1 Colors";
    displayNameKey: string = "card_level1Colors";
    slices: FormattingSettingsSlice[] = [
        this.defaultBg, this.defaultBorder, this.defaultText,
        this.activeBg, this.activeBorder, this.activeText,
        this.parentBg, this.parentBorder, this.parentText
    ];
}

class Level2ColorsCard extends FormattingSettingsCard {
    public defaultBg     = color("defaultBg",     "Inactive background", "#E8F5F4");
    public defaultBorder = color("defaultBorder", "Inactive border", "#B2DDD9");
    public defaultText   = color("defaultText",   "Inactive text", "#1B5E59");
    public activeBg      = color("activeBg",      "Active background", "#0F9B8E");
    public activeBorder  = color("activeBorder",  "Active border", "#0F9B8E");
    public activeText    = color("activeText",    "Active text", "#FFFFFF");
    public parentBg      = color("parentBg",      "Parent-of-selection background", "#C5EAE7");
    public parentBorder  = color("parentBorder",  "Parent-of-selection border", "#0F9B8E");
    public parentText    = color("parentText",    "Parent-of-selection text", "#0A6B62");

    name: string = "level2Colors";
    displayName: string = "Level 2 Colors";
    displayNameKey: string = "card_level2Colors";
    slices: FormattingSettingsSlice[] = [
        this.defaultBg, this.defaultBorder, this.defaultText,
        this.activeBg, this.activeBorder, this.activeText,
        this.parentBg, this.parentBorder, this.parentText
    ];
}

class Level3ColorsCard extends FormattingSettingsCard {
    public defaultBg     = color("defaultBg",     "Inactive background", "#F0EBF8");
    public defaultBorder = color("defaultBorder", "Inactive border", "#D4BEF0");
    public defaultText   = color("defaultText",   "Inactive text", "#3D1F7A");
    public activeBg      = color("activeBg",      "Active background", "#7B5EA7");
    public activeBorder  = color("activeBorder",  "Active border", "#7B5EA7");
    public activeText    = color("activeText",    "Active text", "#FFFFFF");

    name: string = "level3Colors";
    displayName: string = "Level 3 Colors";
    displayNameKey: string = "card_level3Colors";
    slices: FormattingSettingsSlice[] = [
        this.defaultBg, this.defaultBorder, this.defaultText,
        this.activeBg, this.activeBorder, this.activeText
    ];
}

// ─── Value Heatmap (Pro) ─────────────────────────────────────────────────────
class HeatmapSettingsCard extends FormattingSettingsCard {
    public showHeatmap = new formattingSettings.ToggleSwitch({
        name: "showHeatmap",
        displayName: "Color chips by value (Pro)",
        displayNameKey: "showHeatmap",
        value: false
    });

    public colorLow = new formattingSettings.ColorPicker({
        name: "colorLow",
        displayName: "Low value",
        displayNameKey: "heatLow",
        value: { value: "#EDE9DE" }
    });

    public colorHigh = new formattingSettings.ColorPicker({
        name: "colorHigh",
        displayName: "High value",
        displayNameKey: "heatHigh",
        value: { value: "#C96442" }
    });

    name: string = "heatmapSettings";
    displayName: string = "Value Heatmap (Pro)";
    displayNameKey: string = "card_heatmapSettings";
    slices: FormattingSettingsSlice[] = [
        this.showHeatmap,
        this.colorLow,
        this.colorHigh
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hierarchy behaviour card
// ─────────────────────────────────────────────────────────────────────────────
class HierarchySettingsCard extends FormattingSettingsCard {
    public indentSize = new formattingSettings.NumUpDown({
        name: "indentSize",
        displayName: "Indent per level (px)",
        displayNameKey: "indentSize",
        value: 20
    });

    public expandIcon = new formattingSettings.ToggleSwitch({
        name: "expandIcon",
        displayName: "Show expand icon",
        displayNameKey: "expandIcon",
        value: true
    });

    public autoCollapse = new formattingSettings.ToggleSwitch({
        name: "autoCollapse",
        displayName: "Auto-collapse siblings",
        displayNameKey: "autoCollapse",
        value: false
    });

    public showReset = new formattingSettings.ToggleSwitch({
        name: "showReset",
        displayName: "Show reset button",
        displayNameKey: "showReset",
        value: false
    });

    public resetLabel = new formattingSettings.TextInput({
        name: "resetLabel",
        displayName: "Reset button label",
        displayNameKey: "resetLabel",
        placeholder: "↺ Reset",
        value: "↺ Reset"
    });

    public resetBg = color("resetBg", "Reset button background", "#F3F4F6");
    public resetBorder = color("resetBorder", "Reset button border", "#D1D5DB");
    public resetText = color("resetText", "Reset button text", "#6B7280");

    name: string = "hierarchySettings";
    displayName: string = "Hierarchy";
    displayNameKey: string = "card_hierarchySettings";
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

// ─── Desplegable (Pro, 1.3) ──────────────────────────────────────────────────
class PopupSettingsCard extends FormattingSettingsCard {
    public show = new formattingSettings.ToggleSwitch({
        name: "show", displayName: "Drop-down mode (Pro)", displayNameKey: "popup_show", value: false
    });
    public label = new formattingSettings.TextInput({
        name: "label", displayName: "Label", displayNameKey: "popup_label", placeholder: "Field name", value: ""
    });
    topLevelSlice = this.show;
    name: string = "popup";
    displayName: string = "Drop-down (Pro)";
    displayNameKey: string = "card_popup";
    slices: FormattingSettingsSlice[] = [this.label];
}

// ─── Plantilla de estilo y consejos (1.3) ────────────────────────────────────
class StyleCard extends FormattingSettingsCard {
    public template = new formattingSettings.ItemDropdown({
        name: "template", displayName: "Template", displayNameKey: "style_template",
        items: [
            { value: "classic", displayName: "Classic",    displayNameKey: "Enum_classic" } as any,
            { value: "outline", displayName: "Outline",    displayNameKey: "Enum_outline" } as any,
            { value: "soft",    displayName: "Soft",       displayNameKey: "Enum_soft" } as any,
            { value: "square",  displayName: "Square",     displayNameKey: "Enum_square" } as any,
            { value: "mono",    displayName: "One colour", displayNameKey: "Enum_mono" } as any,
            { value: "dark",    displayName: "Dark",       displayNameKey: "Enum_dark" } as any
        ],
        value: { value: "classic", displayName: "Classic", displayNameKey: "Enum_classic" } as any
    });
    public guide = new formattingSettings.ToggleSwitch({
        name: "guide", displayName: "Show setup tips", displayNameKey: "style_guide", value: true
    });
    name: string = "style";
    displayName: string = "Style template";
    displayNameKey: string = "card_style";
    slices: FormattingSettingsSlice[] = [this.template, this.guide];
}

// ─────────────────────────────────────────────────────────────────────────────
// Root model
// ─────────────────────────────────────────────────────────────────────────────
export class VisualSettingsModel extends FormattingSettingsModel {
    public styleCard             = new StyleCard();
    public chipSettingsCard      = new ChipSettingsCard();
    public popupSettingsCard     = new PopupSettingsCard();
    public searchSettingsCard    = new SearchSettingsCard();
    public imageSettingsCard     = new ImageSettingsCard();
    public valueSettingsCard     = new ValueSettingsCard();
    public heatmapSettingsCard   = new HeatmapSettingsCard();
    public hierarchySettingsCard = new HierarchySettingsCard();
    public level1ColorsCard      = new Level1ColorsCard();
    public level2ColorsCard      = new Level2ColorsCard();
    public level3ColorsCard      = new Level3ColorsCard();

    cards: FormattingSettingsCard[] = [
        this.styleCard,
        this.chipSettingsCard,
        this.popupSettingsCard,
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

/**
 * Plantillas: valores que la plantilla pone donde el autor no ha fijado nada, por objeto. "classic" es el aspecto de
 * 1.2 (los informes guardados sin plantilla se ven igual). Al ELEGIR una, el visual borra esas propiedades guardadas
 * para que se vea (aplicarPlantilla). El nivel 3 no tiene colores de "padre de la selección".
 */
interface Paleta { db: string; dbo: string; dt: string; ab: string; abo: string; at: string; pb?: string; pbo?: string; pt?: string }
function niveles(l1: Paleta, l2: Paleta, l3: Paleta): Record<string, Record<string, string>> {
    const obj = (p: Paleta) => {
        const o: Record<string, string> = { defaultBg: p.db, defaultBorder: p.dbo, defaultText: p.dt, activeBg: p.ab, activeBorder: p.abo, activeText: p.at };
        if (p.pb) { o.parentBg = p.pb; o.parentBorder = p.pbo; o.parentText = p.pt; }
        return o;
    };
    return { level1Colors: obj(l1), level2Colors: obj(l2), level3Colors: obj(l3) };
}

export const TEMPLATES: Record<string, Record<string, Record<string, string | number>>> = {
    classic: {},
    outline: niveles(
        { db: "#FFFFFF", dbo: "#C8C6C4", dt: "#323130", ab: "#FFFFFF", abo: "#2B6CB0", at: "#2B6CB0", pb: "#FFFFFF", pbo: "#2B6CB0", pt: "#2B6CB0" },
        { db: "#FFFFFF", dbo: "#C8C6C4", dt: "#323130", ab: "#FFFFFF", abo: "#2F7A47", at: "#2F7A47", pb: "#FFFFFF", pbo: "#2F7A47", pt: "#2F7A47" },
        { db: "#FFFFFF", dbo: "#C8C6C4", dt: "#323130", ab: "#FFFFFF", abo: "#6B4FA0", at: "#6B4FA0" }),
    soft: niveles(
        { db: "#EEF3F9", dbo: "#EEF3F9", dt: "#1F4E80", ab: "#2B6CB0", abo: "#2B6CB0", at: "#FFFFFF", pb: "#D6E4F3", pbo: "#2B6CB0", pt: "#1F4E80" },
        { db: "#EAF4EE", dbo: "#EAF4EE", dt: "#1E4D2B", ab: "#2F7A47", abo: "#2F7A47", at: "#FFFFFF", pb: "#D3EADB", pbo: "#2F7A47", pt: "#1E4D2B" },
        { db: "#F1ECF8", dbo: "#F1ECF8", dt: "#3D1F7A", ab: "#6B4FA0", abo: "#6B4FA0", at: "#FFFFFF" }),
    square: Object.assign({ chipSettings: { chipRadius: 4 } }, niveles(
        { db: "#FFFFFF", dbo: "#D2D0CE", dt: "#252423", ab: "#252423", abo: "#252423", at: "#FFFFFF", pb: "#EDEBE9", pbo: "#252423", pt: "#252423" },
        { db: "#FFFFFF", dbo: "#D2D0CE", dt: "#252423", ab: "#484644", abo: "#484644", at: "#FFFFFF", pb: "#EDEBE9", pbo: "#484644", pt: "#252423" },
        { db: "#FFFFFF", dbo: "#D2D0CE", dt: "#252423", ab: "#605E5C", abo: "#605E5C", at: "#FFFFFF" })),
    mono: niveles(
        { db: "#F3F6FA", dbo: "#D6E0EC", dt: "#1F4E80", ab: "#2B6CB0", abo: "#2B6CB0", at: "#FFFFFF", pb: "#DCE7F3", pbo: "#2B6CB0", pt: "#1F4E80" },
        { db: "#F3F6FA", dbo: "#D6E0EC", dt: "#1F4E80", ab: "#2B6CB0", abo: "#2B6CB0", at: "#FFFFFF", pb: "#DCE7F3", pbo: "#2B6CB0", pt: "#1F4E80" },
        { db: "#F3F6FA", dbo: "#D6E0EC", dt: "#1F4E80", ab: "#2B6CB0", abo: "#2B6CB0", at: "#FFFFFF" }),
    dark: niveles(
        { db: "#2B2B2B", dbo: "#3B3A39", dt: "#E1DFDD", ab: "#9DC3E6", abo: "#9DC3E6", at: "#10263F", pb: "#3A4A5C", pbo: "#9DC3E6", pt: "#E1DFDD" },
        { db: "#2B2B2B", dbo: "#3B3A39", dt: "#E1DFDD", ab: "#A3D9B1", abo: "#A3D9B1", at: "#10301A", pb: "#33493A", pbo: "#A3D9B1", pt: "#E1DFDD" },
        { db: "#2B2B2B", dbo: "#3B3A39", dt: "#E1DFDD", ab: "#C9B8E8", abo: "#C9B8E8", at: "#2A1A4A" })
};
