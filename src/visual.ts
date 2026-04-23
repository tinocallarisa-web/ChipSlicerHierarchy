"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;
import FilterAction = powerbi.FilterAction;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import { formattingSettings, FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualSettingsModel } from "./settings";

import IVisualLicenseManager = powerbi.extensibility.IVisualLicenseManager;
import ServicePlanState = powerbi.ServicePlanState;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import VisualUpdateType = powerbi.VisualUpdateType;
import IFilter = powerbi.IFilter;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A single node in the hierarchy tree. */
interface HierarchyNode {
    value: string;
    rawValue: powerbi.PrimitiveValue;
    level: number;               // 0 = L1, 1 = L2, 2 = L3
    parentKey: string | null;    // key of the parent node (null for root)
    key: string;                 // unique composite key: "l1val||l2val||l3val"
    children: HierarchyNode[];
    isSelected: boolean;
    isExpanded: boolean;
    isParentOfSelection: boolean; // true when a descendant is selected
    /** Column metadata for this node's level */
    source: powerbi.DataViewMetadataColumn;
}

/** Resolved per-level column references for filter building. */
interface LevelMeta {
    table: string;
    column: string;
    source: powerbi.DataViewMetadataColumn;
}

// ─────────────────────────────────────────────────────────────────────────────
// HierarchyManager  — pure data logic, no DOM
// ─────────────────────────────────────────────────────────────────────────────

class HierarchyManager {
    /** Flat map of key → node for O(1) lookups */
    private nodeMap: Map<string, HierarchyNode> = new Map();
    /** Root-level nodes (level 0) */
    public roots: HierarchyNode[] = [];
    /** All level column metadata */
    public levelMeta: LevelMeta[] = [];

    /**
     * Rebuilds the tree from a categorical DataView.
     * categories[0] = Level1, categories[1] = Level2 (optional), categories[2] = Level3 (optional)
     */
    public buildTree(dataView: DataView): void {
        this.nodeMap.clear();
        this.roots = [];
        this.levelMeta = [];

        const cats = dataView?.categorical?.categories;
        if (!cats || cats.length === 0) return;

        // Build levelMeta for each bound category
        for (let lvl = 0; lvl < cats.length; lvl++) {
            const src = cats[lvl].source;
            const qn = src.queryName || "";
            const dot = qn.indexOf(".");
            this.levelMeta.push({
                table: dot > -1 ? qn.substring(0, dot) : qn,
                column: dot > -1 ? qn.substring(dot + 1) : src.displayName,
                source: src
            });
        }

        const rowCount = cats[0].values.length;

        for (let row = 0; row < rowCount; row++) {
            const l1Raw = cats[0]?.values[row];
            const l2Raw = cats[1]?.values[row];
            const l3Raw = cats[2]?.values[row];

            const l1Val = l1Raw == null ? "(blank)" : String(l1Raw);
            const l2Val = l2Raw == null ? null : String(l2Raw);
            const l3Val = l3Raw == null ? null : String(l3Raw);

            // ── Level 1 ──
            const l1Key = l1Val;
            if (!this.nodeMap.has(l1Key)) {
                const node: HierarchyNode = {
                    value: l1Val,
                    rawValue: l1Raw,
                    level: 0,
                    parentKey: null,
                    key: l1Key,
                    children: [],
                    isSelected: false,
                    isExpanded: false,
                    isParentOfSelection: false,
                    source: cats[0].source
                };
                this.nodeMap.set(l1Key, node);
                this.roots.push(node);
            }

            // ── Level 2 ──
            if (l2Val != null && cats.length > 1) {
                const l2Key = `${l1Key}||${l2Val}`;
                if (!this.nodeMap.has(l2Key)) {
                    const node: HierarchyNode = {
                        value: l2Val,
                        rawValue: l2Raw,
                        level: 1,
                        parentKey: l1Key,
                        key: l2Key,
                        children: [],
                        isSelected: false,
                        isExpanded: false,
                        isParentOfSelection: false,
                        source: cats[1].source
                    };
                    this.nodeMap.set(l2Key, node);
                    const parent = this.nodeMap.get(l1Key)!;
                    parent.children.push(node);
                }

                // ── Level 3 ──
                if (l3Val != null && cats.length > 2) {
                    const l3Key = `${l2Key}||${l3Val}`;
                    if (!this.nodeMap.has(l3Key)) {
                        const node: HierarchyNode = {
                            value: l3Val,
                            rawValue: l3Raw,
                            level: 2,
                            parentKey: l2Key,
                            key: l3Key,
                            children: [],
                            isSelected: false,
                            isExpanded: false,
                            isParentOfSelection: false,
                            source: cats[2].source
                        };
                        this.nodeMap.set(l3Key, node);
                        const parent = this.nodeMap.get(l2Key)!;
                        parent.children.push(node);
                    }
                }
            }
        }
    }

    /** Toggle selection on a node; handles multi-select and select-all */
    public toggleNode(key: string, multiSelect: boolean, autoCollapse: boolean): void {
        const node = this.nodeMap.get(key);
        if (!node) return;

        if (!multiSelect) {
            // Single-select: deselect everything first
            this.nodeMap.forEach(n => n.isSelected = false);
        }

        node.isSelected = !node.isSelected;

        // Expand/collapse children when selecting/deselecting a parent
        if (node.children.length > 0) {
            if (node.isSelected) {
                node.isExpanded = true;
            } else {
                // Deselecting parent: collapse and deselect all descendants
                this.collapseDescendants(node);
            }
        }

        // Auto-collapse siblings at the same level
        if (autoCollapse && node.isSelected && node.parentKey) {
            const parent = this.nodeMap.get(node.parentKey);
            if (parent) {
                parent.children.forEach(sibling => {
                    if (sibling.key !== key) {
                        sibling.isExpanded = false;
                        this.collapseDescendants(sibling);
                    }
                });
            }
        }
    }

    /** Toggle expand/collapse without changing selection */
    public toggleExpand(key: string): void {
        const node = this.nodeMap.get(key);
        if (!node) return;
        node.isExpanded = !node.isExpanded;
    }

    /** Clear all selections and collapse the tree */
    public clearAll(): void {
        this.nodeMap.forEach(n => {
            n.isSelected = false;
            n.isExpanded = false;
        });
    }

    /** Returns nodes that are currently selected */
    public getSelectedNodes(): HierarchyNode[] {
        const result: HierarchyNode[] = [];
        this.nodeMap.forEach(n => { if (n.isSelected) result.push(n); });
        return result;
    }

    /**
     * Recomputes isParentOfSelection for every node.
     * A node is a "parent of selection" when it has at least one
     * selected descendant but is not selected itself.
     * Call this after any selection change, before rendering.
     */
    public markParents(): void {
        // Reset all
        this.nodeMap.forEach(n => n.isParentOfSelection = false);
        // Walk up from each selected node
        this.nodeMap.forEach(n => {
            if (!n.isSelected) return;
            let key = n.parentKey;
            while (key) {
                const parent = this.nodeMap.get(key);
                if (!parent) break;
                if (!parent.isSelected) parent.isParentOfSelection = true;
                key = parent.parentKey;
            }
        });
    }

    /** Restore selection from persisted filter values */
    public restoreFromFilter(jsonFilters: powerbi.IFilter[]): void {
        if (!jsonFilters || jsonFilters.length === 0) return;

        // We persist a BasicFilter on the deepest selected level.
        // Re-select matching nodes, then expand their ancestors.
        for (const filter of jsonFilters) {
            const basic = filter as any;
            if (!basic.values) continue;
            for (const v of basic.values) {
                const strV = String(v);
                // Find node whose value matches and whose column matches filter column
                this.nodeMap.forEach(node => {
                    if (node.value === strV) {
                        node.isSelected = true;
                        this.expandAncestors(node);
                    }
                });
            }
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private collapseDescendants(node: HierarchyNode): void {
        node.isExpanded = false;
        node.children.forEach(child => {
            child.isSelected = false;
            this.collapseDescendants(child);
        });
    }

    private expandAncestors(node: HierarchyNode): void {
        if (!node.parentKey) return;
        const parent = this.nodeMap.get(node.parentKey);
        if (!parent) return;
        parent.isExpanded = true;
        this.expandAncestors(parent);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual
// ─────────────────────────────────────────────────────────────────────────────

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private container: HTMLElement;
    private localizationManager: ILocalizationManager;
    private licenseManager: IVisualLicenseManager;
    private formattingSettingsService: FormattingSettingsService;
    private formattingSettings: VisualSettingsModel;
    private selectionManager: ISelectionManager;

    private isPro: boolean = false;
    private hierarchyManager: HierarchyManager = new HierarchyManager();
    private lastOptions: VisualUpdateOptions | null = null;
    private events: IVisualEventService;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.target = options.element;
        this.localizationManager = options.host.createLocalizationManager();
        this.licenseManager = options.host.licenseManager;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = options.host.createSelectionManager();

        this.events = options.host.eventService;

        this.container = document.createElement("div");
        this.container.className = "chip-slicer-container";
        this.target.appendChild(this.container);

        // High Contrast: listen for theme changes and re-render
        options.host.colorPalette.isHighContrast &&
            this.target.classList.add("high-contrast");

        // ── AppSource req #1: context menu on empty space with null selectionId ──
        this.target.addEventListener("contextmenu", (e: MouseEvent) => {
            e.preventDefault();
            this.selectionManager.showContextMenu(null, {
                x: e.clientX,
                y: e.clientY
            });
        });
    }

    public async update(options: VisualUpdateOptions): Promise<void> {
        this.events.renderingStarted(options);
        try {
            await this._update(options);
            this.events.renderingFinished(options);
        } catch (e) {
            this.events.renderingFailed(options, e as string);
        }
    }

    private async _update(options: VisualUpdateOptions): Promise<void> {
        // ── License check ────────────────────────────────────────────────────
        try {
            const licenseResult = await this.licenseManager.getAvailableServicePlans();
            this.isPro = licenseResult.plans?.some(p => p.state === ServicePlanState.Active) ?? false;
        } catch {
            this.isPro = false;
        }
        // isPro is set from the license check above — do NOT force true here

        const dv = options.dataViews?.[0];
        if (!dv?.categorical?.categories) {
            this.container.replaceChildren();
            return;
        }

        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualSettingsModel,
            dv
        );

        // ── Bookmark restore ─────────────────────────────────────────────────
        // Power BI passes jsonFilters when restoring a bookmark — we rely on
        // restoreFromFilter() below which already handles this correctly.

        // ── (Re)build the hierarchy tree ─────────────────────────────────────
        // Keep selection state across non-data updates (e.g. resize)
        const prevSelected = new Set(
            this.hierarchyManager.getSelectedNodes().map(n => n.key)
        );
        const prevExpanded = new Set<string>();
        // We need to preserve expanded state too — access via roots
        const storeExpanded = (nodes: HierarchyNode[]) => {
            nodes.forEach(n => {
                if (n.isExpanded) prevExpanded.add(n.key);
                storeExpanded(n.children);
            });
        };
        storeExpanded(this.hierarchyManager.roots);

        this.hierarchyManager.buildTree(dv);

        // Restore from persisted JSON filters (initial load)
        if (prevSelected.size === 0 && (options.jsonFilters?.length ?? 0) > 0) {
            this.hierarchyManager.restoreFromFilter(options.jsonFilters);
        } else {
            // Restore in-memory selection after re-render
            const roots = this.hierarchyManager.roots;
            const restoreState = (nodes: HierarchyNode[]) => {
                nodes.forEach(n => {
                    if (prevSelected.has(n.key)) n.isSelected = true;
                    if (prevExpanded.has(n.key)) n.isExpanded = true;
                    restoreState(n.children);
                });
            };
            restoreState(roots);
        }

        this.lastOptions = options;
        this.render();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render — always vertical: one chip per row, children indented below
    // ─────────────────────────────────────────────────────────────────────────

    private render(): void {
        this.container.replaceChildren();

        const chip = this.formattingSettings.chipSettingsCard;
        const hier = this.formattingSettings.hierarchySettingsCard;
        const hasSelection = this.hierarchyManager.getSelectedNodes().length > 0;

        // Container: vertical column, chips stack top-to-bottom
        Object.assign(this.container.style, {
            display: "flex",
            flexDirection: "column",
            flexWrap: "nowrap",
            gap: `${chip.chipGap.value}px`,
            padding: "8px",
            overflowY: "auto",
            overflowX: "hidden",
            height: "100%",
            width: "100%",
            boxSizing: "border-box",
            position: "relative"
        });

        // ── Select All chip ──────────────────────────────────────────────────
        if (chip.showSelectAll.value) {
            const isAll = !hasSelection;
            const label = chip.selectAllLabel.value || "All";
            const allRow = this.buildRowElement(0);
            const allChip = this.buildChipElement(label, isAll, false, 0, 0);
            allChip.onclick = () => {
                this.hierarchyManager.clearAll();
                this.hierarchyManager.markParents();
                this.applyFilter();
                this.render();
            };
            allRow.appendChild(allChip);
            this.container.appendChild(allRow);
        }

        // ── Freemium gates ───────────────────────────────────────────────────
        const maxLevels   = this.isPro ? 3 : 2;          // Free: 2 levels max
        const maxValues   = this.isPro ? Infinity : 20;  // Free: 20 values per level
        const canMultiSel = this.isPro ? chip.multiSelect.value : false;
        const canCustomColors = this.isPro;               // Free: fixed default colors
        const canReset    = this.isPro;                   // Free: no reset button

        // ── Pre-compute equal chip width per level ───────────────────────────
        const levelWidths: number[] = [];
        const collectLabels = (nodes: HierarchyNode[], depth: number) => {
            if (depth >= maxLevels) return;
            const labels = nodes.map(n => n.value);
            const w = this.computeLevelWidth(labels, depth);
            if (!levelWidths[depth] || w > levelWidths[depth]) levelWidths[depth] = w;
            nodes.forEach(n => collectLabels(n.children, depth + 1));
        };
        collectLabels(this.hierarchyManager.roots, 0);

        // ── Reset button (after gates so canReset is declared) ──────────────
        if (canReset && hier.showReset.value) {
            this.container.appendChild(this.buildResetButton());
        } else if (!canReset && hasSelection) {
            // Free tier: minimal non-configurable reset icon
            const freeReset = document.createElement("div");
            freeReset.style.cssText = "display:flex;justify-content:flex-end;width:100%;flex-shrink:0";
            const btn = document.createElement("button");
            btn.innerText = "↺";
            btn.title = "Reset selection";
            Object.assign(btn.style, {
                height: "20px", padding: "0 8px", fontSize: "12px",
                borderRadius: "6px", border: "1px solid #D1D5DB",
                backgroundColor: "#F3F4F6", color: "#6B7280",
                cursor: "pointer", outline: "none", opacity: "0.85"
            });
            btn.onclick = () => {
                this.hierarchyManager.clearAll();
                this.hierarchyManager.markParents();
                this.applyFilter();
                this.render();
            };
            freeReset.appendChild(btn);
            this.container.appendChild(freeReset);
        }

        // ── Mark parents before rendering ────────────────────────────────────
        this.hierarchyManager.markParents();

        // ── Render each node as its own row, children indented below ─────────
        this.renderNodes(this.hierarchyManager.roots, 0, maxLevels, levelWidths, maxValues, canMultiSel, canCustomColors);

        // ── Upgrade hint (free tier) ─────────────────────────────────────────
        if (!this.isPro) {
            const hint = document.createElement("div");
            hint.style.cssText = [
                "font-size:10px", "color:#FF4081", "font-weight:bold",
                "margin-top:6px", "opacity:0.8", "padding-left:4px",
                "cursor:pointer"
            ].join(";");
            const missing: string[] = [];
            if (this.hierarchyManager.levelMeta.length > 2) missing.push("Level 3");
            missing.push("multi-select", "custom colors", "reset button");
            hint.innerText = `⭐ Pro unlocks: ${missing.join(", ")} · tcviz.com`;
            this.container.appendChild(hint);
        }
    }

    /** Builds the reset button element */
    private buildResetButton(): HTMLElement {
        const hier = this.formattingSettings.hierarchySettingsCard;
        const chip = this.formattingSettings.chipSettingsCard;

        const wrapper = document.createElement("div");
        wrapper.style.cssText = [
            "display:flex",
            "justify-content:flex-end",
            "width:100%",
            "flex-shrink:0"
        ].join(";");

        const btn = document.createElement("button");
        btn.innerText = hier.resetLabel.value || "↺ Reset";

        Object.assign(btn.style, {
            height:          `${Math.max(20, chip.chipHeight.value - 10)}px`,
            padding:         "0 10px",
            fontSize:        `${Math.max(10, chip.fontSize.value - 1)}px`,
            borderRadius:    "6px",
            border:          `1px solid ${hier.resetBorder.value.value}`,
            backgroundColor: hier.resetBg.value.value,
            color:           hier.resetText.value.value,
            cursor:          "pointer",
            fontWeight:      "normal",
            outline:         "none",
            transition:      "opacity 0.15s ease",
            opacity:         "0.85",
            lineHeight:      "1"
        });

        btn.onmouseenter = () => { btn.style.opacity = "1"; };
        btn.onmouseleave = () => { btn.style.opacity = "0.85"; };

        btn.onclick = () => {
            this.hierarchyManager.clearAll();
            this.hierarchyManager.markParents();
            this.applyFilter();
            this.render();
        };

        wrapper.appendChild(btn);
        return wrapper;
    }

    /** Builds an indented row wrapper for a given depth level */
    private buildRowElement(depth: number): HTMLElement {
        const hier = this.formattingSettings.hierarchySettingsCard;
        const row = document.createElement("div");
        row.style.cssText = [
            "display:flex",
            "flex-direction:row",
            "align-items:center",
            "flex-shrink:0",
            `padding-left:${depth * hier.indentSize.value}px`
        ].join(";");
        return row;
    }

    /**
     * Renders nodes recursively — each node on its own row.
     * Expanded nodes show their children indented immediately below.
     */
    private renderNodes(
        nodes: HierarchyNode[],
        depth: number,
        maxLevels: number,
        levelWidths: number[],
        maxValues: number,
        canMultiSel: boolean,
        canCustomColors: boolean
    ): void {
        if (nodes.length === 0 || depth >= maxLevels) return;

        const chip = this.formattingSettings.chipSettingsCard;
        const hier = this.formattingSettings.hierarchySettingsCard;
        const lw   = levelWidths[depth] ?? 0;

        // Free tier: cap the number of visible values per level
        const visibleNodes = isFinite(maxValues) ? nodes.slice(0, maxValues) : nodes;
        const isLimited = nodes.length > visibleNodes.length;

        visibleNodes.forEach(node => {
            const row = this.buildRowElement(depth);

            // ── Expand/collapse icon ─────────────────────────────────────────
            const iconSpan = document.createElement("span");
            iconSpan.style.cssText = "width:18px;min-width:18px;text-align:center;font-size:10px;user-select:none;flex-shrink:0";

            if (node.children.length > 0 && hier.expandIcon.value) {
                iconSpan.innerText = node.isExpanded ? "▾" : "▸";
                iconSpan.style.cursor = "pointer";
                iconSpan.style.opacity = "0.6";
                iconSpan.onclick = (e) => {
                    e.stopPropagation();
                    this.hierarchyManager.toggleExpand(node.key);
                    this.render();
                };
            }
            row.appendChild(iconSpan);

            // ── Chip ─────────────────────────────────────────────────────────
            const el = this.buildChipElement(node.value, node.isSelected, node.isParentOfSelection, depth, lw, canCustomColors);
            el.onclick = () => {
                this.hierarchyManager.toggleNode(
                    node.key,
                    canMultiSel,
                    this.isPro ? hier.autoCollapse.value : false
                );
                this.hierarchyManager.markParents();
                this.applyFilter();
                this.render();
            };
            row.appendChild(el);

            this.container.appendChild(row);

            // ── Children rendered immediately below when expanded ────────────
            if (node.isExpanded && node.children.length > 0) {
                this.renderNodes(node.children, depth + 1, maxLevels, levelWidths, maxValues, canMultiSel, canCustomColors);
            }
        });

        // Free tier: show upgrade hint when values are capped
        if (isLimited) {
            const row = this.buildRowElement(depth);
            const hint = document.createElement("span");
            hint.style.cssText = [
                `padding-left:${(depth * this.formattingSettings.hierarchySettingsCard.indentSize.value) + 20}px`,
                "font-size:10px",
                "color:#FF4081",
                "font-weight:bold",
                "opacity:0.8",
                "cursor:pointer"
            ].join(";");
            hint.innerText = `+${nodes.length - visibleNodes.length} more — Upgrade to Pro`;
            hint.title = "Unlock unlimited values with ChipSlicer Hierarchy Pro";
            row.appendChild(hint);
            this.container.appendChild(row);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chip DOM element factory
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns hardcoded default colors for free tier (not configurable).
     */
    private defaultLevelColors(depth: number): any {
        const defaults = [
            // Level 1 — blue
            {
                activeBg:     { value: { value: "#378ADD" } },
                activeBorder: { value: { value: "#378ADD" } },
                activeText:   { value: { value: "#FFFFFF" } },
                defaultBg:    { value: { value: "#F3F4F6" } },
                defaultBorder:{ value: { value: "#E5E7EB" } },
                defaultText:  { value: { value: "#374151" } },
                parentBg:     { value: { value: "#D6EBFA" } },
                parentBorder: { value: { value: "#378ADD" } },
                parentText:   { value: { value: "#1A5FA8" } }
            },
            // Level 2 — teal
            {
                activeBg:     { value: { value: "#0F9B8E" } },
                activeBorder: { value: { value: "#0F9B8E" } },
                activeText:   { value: { value: "#FFFFFF" } },
                defaultBg:    { value: { value: "#E8F5F4" } },
                defaultBorder:{ value: { value: "#B2DDD9" } },
                defaultText:  { value: { value: "#1B5E59" } },
                parentBg:     { value: { value: "#C5EAE7" } },
                parentBorder: { value: { value: "#0F9B8E" } },
                parentText:   { value: { value: "#0A6B62" } }
            },
            // Level 3 — purple
            {
                activeBg:     { value: { value: "#7B5EA7" } },
                activeBorder: { value: { value: "#7B5EA7" } },
                activeText:   { value: { value: "#FFFFFF" } },
                defaultBg:    { value: { value: "#F0EBF8" } },
                defaultBorder:{ value: { value: "#D4BEF0" } },
                defaultText:  { value: { value: "#3D1F7A" } },
                parentBg:     { value: { value: "#E0D5F5" } },
                parentBorder: { value: { value: "#7B5EA7" } },
                parentText:   { value: { value: "#3D1F7A" } }
            }
        ];
        return defaults[Math.min(depth, 2)];
    }

    /**
     * Returns the colour card for the given depth level.
     */
    private levelColors(depth: number): any {
        if (depth === 1) return this.formattingSettings.level2ColorsCard;
        if (depth >= 2) return this.formattingSettings.level3ColorsCard;
        return this.formattingSettings.level1ColorsCard;
    }

    /**
     * Builds a chip element.
     * @param label        Display text
     * @param isActive     Node is directly selected
     * @param isParent     Node is a parent of a selected descendant
     * @param depth        Hierarchy level (0/1/2)
     * @param levelWidth   Fixed width in px for this level (0 = auto)
     */
    private buildChipElement(
        label: string,
        isActive: boolean,
        isParent: boolean,
        depth: number,
        levelWidth: number,
        canCustomColors: boolean = true
    ): HTMLElement {
        const s = this.formattingSettings.chipSettingsCard;
        // Free tier: always use default neutral colors regardless of format settings
        const lc = canCustomColors ? this.levelColors(depth) : this.defaultLevelColors(depth);

        let bg: string, border: string, text: string, fw: string;

        if (isActive) {
            bg     = lc.activeBg.value.value;
            border = lc.activeBorder.value.value;
            text   = lc.activeText.value.value;
            fw     = "bold";
        } else if (isParent && depth < 2) {
            // parent-of-selection state (L3 has no children so skip)
            bg     = lc.parentBg.value.value;
            border = lc.parentBorder.value.value;
            text   = lc.parentText.value.value;
            fw     = "600";
        } else {
            bg     = lc.defaultBg.value.value;
            border = lc.defaultBorder.value.value;
            text   = lc.defaultText.value.value;
            fw     = "normal";
        }

        const el = document.createElement("div");
        el.className = "chip-item";
        el.innerText = label;

        // High Contrast override: use system colors
        const isHC = this.target.classList.contains("high-contrast");
        if (isHC) {
            bg     = isActive ? "ButtonText"   : "Canvas";
            border = isActive ? "ButtonText"   : "ButtonText";
            text   = isActive ? "Canvas"       : "ButtonText";
            fw     = isActive ? "bold"         : "normal";
        }

        Object.assign(el.style, {
            height:          `${s.chipHeight.value}px`,
            borderRadius:    `${s.chipRadius.value}px`,
            padding:         `0 ${s.chipPaddingH.value}px`,
            fontSize:        `${s.fontSize.value}px`,
            display:         "inline-flex",
            alignItems:      "center",
            justifyContent:  "flex-start",
            cursor:          "pointer",
            userSelect:      "none",
            transition:      "all 0.15s ease",
            border:          "1.5px solid",
            backgroundColor: bg,
            borderColor:     border,
            color:           text,
            fontWeight:      fw,
            whiteSpace:      "nowrap",
            overflow:        "hidden",
            textOverflow:    "ellipsis",
            flexShrink:      "0"
        });

        // Equal width per level: if a fixed width is provided, apply it
        if (levelWidth > 0) {
            el.style.width    = `${levelWidth}px`;
            el.style.minWidth = `${levelWidth}px`;
        }

        // ── AppSource req #2: tooltip on every chip ──
        el.title = label;

        return el;
    }

    /**
     * Measures the natural pixel width of a text label at the current font size.
     * Uses a temporary off-screen canvas for accuracy.
     */
    private measureText(text: string, fontSize: number): number {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return text.length * (fontSize * 0.6);
        ctx.font = `${fontSize}px sans-serif`;
        return ctx.measureText(text).width;
    }

    /**
     * Computes the required chip width for a set of labels at a given depth.
     * = max label width + 2 * horizontalPadding + icon space
     */
    private computeLevelWidth(labels: string[], depth: number): number {
        const s = this.formattingSettings.chipSettingsCard;
        if (labels.length === 0) return 0;
        const maxLabelPx = Math.max(...labels.map(l => this.measureText(l, s.fontSize.value)));
        return Math.ceil(maxLabelPx + 2 * s.chipPaddingH.value + 8);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Filter application — builds a TupleFilter or BasicFilter
    // ─────────────────────────────────────────────────────────────────────────

    private applyFilter(): void {
        const selected = this.hierarchyManager.getSelectedNodes();

        if (selected.length === 0) {
            this.host.applyJsonFilter(null, "general", "filter", FilterAction.merge);
            return;
        }

        const meta = this.hierarchyManager.levelMeta;

        // Strategy: always filter using the DEEPEST selected level only,
        // using a BasicFilter on that level's column.
        //
        // Why: Power BI BasicFilter on a child column already implies the
        // parent — no need for TupleFilter. Filtering on L2="Cervezas"
        // automatically restricts L1 and L3 in all related visuals.
        // Mixing levels in one filter causes Power BI to ignore constraints.
        //
        // If the user has selected nodes at different levels (e.g. one L1
        // and one L2), we apply only the deepest level's filter values.
        // This matches the UX: the deepest selection is always the most specific.

        // Find the deepest level that has selections
        let deepestLevel = 0;
        selected.forEach(n => {
            if (n.level > deepestLevel) deepestLevel = n.level;
        });

        // Collect all selected nodes at that deepest level
        const deepSelected = selected.filter(n => n.level === deepestLevel);
        const m = meta[deepestLevel];
        if (!m) return;

        const toFilterValue = (raw: powerbi.PrimitiveValue): powerbi.PrimitiveValue => {
            if (raw == null) return null;
            const s = String(raw);
            if (s === "true") return true;
            if (s === "false") return false;
            const num = Number(s);
            return (!isNaN(num) && s !== "") ? num : s;
        };

        const values = deepSelected.map(n => toFilterValue(n.rawValue)) as (string | number | boolean)[];

const filter = {
    $schema: "http://powerbi.com/product/schema#basic",
    target: { table: m.table, column: m.column },
    operator: "In",
    values: values,
    filterType: 1
};

        this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Formatting model
    // ─────────────────────────────────────────────────────────────────────────

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
