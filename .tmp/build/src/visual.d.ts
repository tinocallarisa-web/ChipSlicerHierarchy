import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
export declare class Visual implements IVisual {
    private target;
    private host;
    private container;
    private localizationManager;
    private licenseManager;
    private formattingSettingsService;
    private formattingSettings;
    private selectionManager;
    private isPro;
    private hierarchyManager;
    private lastOptions;
    private events;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): Promise<void>;
    private _update;
    private render;
    /** Builds the reset button element */
    private buildResetButton;
    /** Builds an indented row wrapper for a given depth level */
    private buildRowElement;
    /**
     * Renders nodes recursively — each node on its own row.
     * Expanded nodes show their children indented immediately below.
     */
    private renderNodes;
    /**
     * Returns hardcoded default colors for free tier (not configurable).
     */
    private defaultLevelColors;
    /**
     * Returns the colour card for the given depth level.
     */
    private levelColors;
    /**
     * Builds a chip element.
     * @param label        Display text
     * @param isActive     Node is directly selected
     * @param isParent     Node is a parent of a selected descendant
     * @param depth        Hierarchy level (0/1/2)
     * @param levelWidth   Fixed width in px for this level (0 = auto)
     */
    private buildChipElement;
    /**
     * Measures the natural pixel width of a text label at the current font size.
     * Uses a temporary off-screen canvas for accuracy.
     */
    private measureText;
    /**
     * Computes the required chip width for a set of labels at a given depth.
     * = max label width + 2 * horizontalPadding + icon space
     */
    private computeLevelWidth;
    private applyFilter;
    getFormattingModel(): powerbi.visuals.FormattingModel;
}
