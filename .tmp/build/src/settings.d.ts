import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
declare class ChipSettingsCard extends FormattingSettingsCard {
    multiSelect: formattingSettings.ToggleSwitch;
    layout: formattingSettings.ItemDropdown;
    chipHeight: formattingSettings.NumUpDown;
    chipRadius: formattingSettings.NumUpDown;
    fontSize: formattingSettings.NumUpDown;
    chipGap: formattingSettings.NumUpDown;
    chipPaddingH: formattingSettings.NumUpDown;
    showSelectAll: formattingSettings.ToggleSwitch;
    selectAllLabel: formattingSettings.TextInput;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class Level1ColorsCard extends FormattingSettingsCard {
    defaultBg: formattingSettings.ColorPicker;
    defaultBorder: formattingSettings.ColorPicker;
    defaultText: formattingSettings.ColorPicker;
    activeBg: formattingSettings.ColorPicker;
    activeBorder: formattingSettings.ColorPicker;
    activeText: formattingSettings.ColorPicker;
    parentBg: formattingSettings.ColorPicker;
    parentBorder: formattingSettings.ColorPicker;
    parentText: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class Level2ColorsCard extends FormattingSettingsCard {
    defaultBg: formattingSettings.ColorPicker;
    defaultBorder: formattingSettings.ColorPicker;
    defaultText: formattingSettings.ColorPicker;
    activeBg: formattingSettings.ColorPicker;
    activeBorder: formattingSettings.ColorPicker;
    activeText: formattingSettings.ColorPicker;
    parentBg: formattingSettings.ColorPicker;
    parentBorder: formattingSettings.ColorPicker;
    parentText: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class Level3ColorsCard extends FormattingSettingsCard {
    defaultBg: formattingSettings.ColorPicker;
    defaultBorder: formattingSettings.ColorPicker;
    defaultText: formattingSettings.ColorPicker;
    activeBg: formattingSettings.ColorPicker;
    activeBorder: formattingSettings.ColorPicker;
    activeText: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class HierarchySettingsCard extends FormattingSettingsCard {
    indentSize: formattingSettings.NumUpDown;
    expandIcon: formattingSettings.ToggleSwitch;
    autoCollapse: formattingSettings.ToggleSwitch;
    showReset: formattingSettings.ToggleSwitch;
    resetLabel: formattingSettings.TextInput;
    resetBg: formattingSettings.ColorPicker;
    resetBorder: formattingSettings.ColorPicker;
    resetText: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
export declare class VisualSettingsModel extends FormattingSettingsModel {
    chipSettingsCard: ChipSettingsCard;
    hierarchySettingsCard: HierarchySettingsCard;
    level1ColorsCard: Level1ColorsCard;
    level2ColorsCard: Level2ColorsCard;
    level3ColorsCard: Level3ColorsCard;
    cards: FormattingSettingsCard[];
}
export {};
