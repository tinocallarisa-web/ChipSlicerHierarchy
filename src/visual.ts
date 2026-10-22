"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import { FormattingSettingsService, formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import {
    HtmlSubSelectableClass, HtmlSubSelectionHelper, SubSelectableDisplayNameAttribute,
    SubSelectableObjectNameAttribute, SubSelectableTypeAttribute,
} from "powerbi-visuals-utils-onobjectutils";
import { VisualSettingsModel, TEMPLATES } from "./settings";
import { STRINGS } from "./strings";
import { LANDING_ICON } from "./landingIcon";

import LicenseNotificationType = powerbi.LicenseNotificationType;

/** El Service ID del plan en Partner Center. Debe coincidir caracter a caracter. */
// Plan ID tal como aparece en Partner Center (verificado 2026-09-15). Antes ponia
// "chip-slicer-hierarchy-tcviz", que no existe: Pro no se activaba nunca.
const PLAN_ID = "chipslicer-hierarchy-pro";

// spIdentifier = Service ID completo (editor.oferta.plan); se acepta también el Plan ID solo
function matchesPlan(spIdentifier: unknown, planId: string): boolean {
    const sp = String(spIdentifier ?? "");
    return sp === planId || sp.endsWith("." + planId);
}

// Microsoft: "only the active and warning states represent a usable license".
const enum ServicePlanState { Inactive = 0, Active = 1, Warning = 2 }

const URL_GUIDE = "https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html";
const URL_PRODUCT = "https://tcviz.com/product/chip-slicer-hierarchy/?ref=visual-chip-slicer-hierarchy";
const URL_VIDEO = "https://www.youtube.com/watch?v=hgMz9ef160U";

// Las tres funciones Pro: propiedad que las enciende y etiqueta (clave de texto + inglés).
const PRO_SEARCH = "Pro_Search";
const PRO_HEATMAP = "Pro_Heatmap";
const PRO_POPUP = "Pro_Popup";

// ─────────────────────────────────────────────────────────────────────────────
// Security — image URL sanitization (AppSource certification requirement)
// Only data: URIs with an image/* MIME type are allowed.
// External URLs (http://, https://, blob:, etc.) are rejected to prevent
// unauthorized outbound HTTP requests and CSP violations.
// ─────────────────────────────────────────────────────────────────────────────
function isSafeImageUrl(url: string): boolean {
    return /^data:image\/[a-z+.-]+;base64,/i.test(url);
}

/** Clave estable por valor: igual para el valor del dataView y el que vuelve en el filtro guardado. */
function valueKey(v: unknown): string {
    if (v === null || v === undefined) return "\u0000blank";
    if (v instanceof Date) return v.toJSON();
    return String(v);
}

/** Para buscar y comparar sin mayúsculas ni acentos. */
function norm(s: string): string {
    return String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Destino del filtro a partir de la expresión de la columna. Partir queryName por el primer punto falla con tablas
 * cuyo nombre lleva punto y con niveles de jerarquía (mismo arreglo que Chip Slicer 1.4.1).
 */
function filterTarget(source: powerbi.DataViewMetadataColumn): any {
    const expr: any = (source as any).expr;
    if (expr?.ref && expr?.source?.entity) {
        return { table: expr.source.entity, column: expr.ref };
    }
    if (expr?.level && expr?.arg?.hierarchy) {
        const inner = expr.arg.arg;
        const entity = inner?.source?.entity ?? inner?.arg?.source?.entity;
        if (entity) return { table: entity, hierarchy: expr.arg.hierarchy, hierarchyLevel: expr.level };
    }
    const q = source.queryName ?? "";
    const dot = q.indexOf(".");
    return dot > -1 ? { table: q.substring(0, dot), column: q.substring(dot + 1) } : { table: source.displayName, column: source.displayName };
}

function sameTarget(a: any, b: any): boolean {
    return !!a && !!b && a.table === b.table && (a.column ?? null) === (b.column ?? null)
        && (a.hierarchy ?? null) === (b.hierarchy ?? null) && (a.hierarchyLevel ?? null) === (b.hierarchyLevel ?? null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Data model
// ─────────────────────────────────────────────────────────────────────────────
interface HierarchyNode {
    value: string;
    rawValue: powerbi.PrimitiveValue;
    level: number;
    parentKey: string | null;
    key: string;
    children: HierarchyNode[];
    isSelected: boolean;
    isExpanded: boolean;
    isParentOfSelection: boolean;
    isLeaf: boolean;
    /** False solo cuando hay resaltado activo y esta rama queda fuera. */
    inHighlight: boolean;
    imageUrl: string | null;
    source: powerbi.DataViewMetadataColumn;
    measureValue: number | null; // aggregated measure — sum of all rows that belong to this node
    /** Cadena de formato de la medida (dinámica si el DAX la decide), de la primera fila del nodo. */
    formatString: string | undefined;
    tooltipFields: { name: string; value: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// HierarchyManager
// ─────────────────────────────────────────────────────────────────────────────
class HierarchyManager {
    public roots: HierarchyNode[] = [];
    private nodeMap: Map<string, HierarchyNode> = new Map();
    private measureTotal: number = 0;

    getMeasureTotal(): number { return this.measureTotal; }

    buildTree(
        dataView: DataView,
        hideBlank: boolean,
        labelOf: (v: powerbi.PrimitiveValue, src: powerbi.DataViewMetadataColumn) => string,
        measureValues?: powerbi.PrimitiveValue[],
        measureFormats?: (string | undefined)[],
        tooltipMeasureCols?: { name: string; values: powerbi.PrimitiveValue[] }[],
        highlights?: powerbi.PrimitiveValue[]
    ): void {
        // Resaltado cruzado: llega alineado por fila con la medida. Solo existe
        // cuando hay una medida vinculada, que es opcional; sin ella no hay nada
        // que atenuar y todo se pinta normal.
        const hayResaltado = Array.isArray(highlights) &&
            highlights.some(h => h != null);
        // Save expanded AND selected state before clearing
        const expandedKeys = new Set<string>();
        const selectedKeys  = new Set<string>();
        this.nodeMap.forEach((n, k) => {
            if (n.isExpanded) expandedKeys.add(k);
            if (n.isSelected) selectedKeys.add(k);
        });

        this.roots = [];
        this.nodeMap.clear();

        const cats = dataView?.categorical?.categories;
        if (!cats || cats.length === 0) return;

        // Separate category columns (hierarchy levels) from image columns,
        // preserving the order the user added them — 1st = L1, 2nd = L2, etc.
        const catCols: powerbi.DataViewCategoryColumn[] = [];
        const imgCols: powerbi.DataViewCategoryColumn[] = [];
        const tipCols: powerbi.DataViewCategoryColumn[] = [];

        for (const cat of cats) {
            const roles = cat.source.roles as Record<string, boolean>;
            if (roles["categories"]) catCols.push(cat);
            else if (roles["images"]) imgCols.push(cat);
            else if (roles["tooltips"]) tipCols.push(cat);
        }

        if (catCols.length === 0) return;

        const rowCount = catCols[0].values.length;

        for (let i = 0; i < rowCount; i++) {
            let parentKey: string | null = null;
            let parentNode: HierarchyNode | null = null;

            // Measure value for this row — null means no measure or null data
            const filaResaltada = !hayResaltado || (highlights![i] != null);
            const rowMeasure = measureValues != null
                ? (typeof measureValues[i] === "number" && !isNaN(measureValues[i] as number)
                    ? (measureValues[i] as number)
                    : null)
                : null;

            for (let lvl = 0; lvl < catCols.length; lvl++) {
                const col = catCols[lvl];
                const raw = col.values[i];
                const val = raw == null || raw === "" ? "" : labelOf(raw, col.source);
                if (hideBlank && val === "") break; // stop the path at a blank value

                const level  = lvl + 1;
                const vk     = valueKey(raw);
                const key    = parentKey ? `L${level}::${parentKey}::${vk}` : `L${level}::${vk}`;
                const isLast = lvl === catCols.length - 1;

                // Image URL for this level (matched by position in imgCols)
                let imageUrl: string | null = null;
                if (imgCols[lvl]) {
                    const imgVal = imgCols[lvl].values[i];
                    if (imgVal != null && String(imgVal) !== "") {
                        const s = String(imgVal);
                        imageUrl = isSafeImageUrl(s) ? s : null;
                    }
                }

                let node = this.nodeMap.get(key);
                if (!node) {
                    node = {
                        value: val, rawValue: raw, level,
                        parentKey, key, children: [],
                        isSelected: false, isExpanded: false, isParentOfSelection: false,
                        isLeaf: isLast, imageUrl, source: col.source,
                        // Arranca fuera; se enciende abajo si alguna de sus filas
                        // esta resaltada.
                        inHighlight: false,
                        measureValue: null, formatString: measureFormats?.[i], tooltipFields: []
                    };
                    this.nodeMap.set(key, node);
                    if (parentNode) {
                        parentNode.children.push(node);
                        parentNode.isLeaf = false;
                    } else {
                        this.roots.push(node);
                    }
                }
                // Un chip queda dentro del resaltado si lo esta cualquiera de las
                // filas que pasan por el: asi un padre sigue encendido cuando solo
                // uno de sus hijos entra en la seleccion de otro visual.
                if (filaResaltada) node.inHighlight = true;

                // Fill in imageUrl if we now have one and node didn't before
                if (node.imageUrl === null && imageUrl !== null) node.imageUrl = imageUrl;

                // Tooltip extra fields — only captured once per node (first row that reaches it).
                // Text/column tooltip fields arrive in `categories`; measure-typed ones (e.g. a
                // DAX measure or aggregated numeric column) are moved by Power BI into `values`.
                if (node.tooltipFields.length === 0 && (tipCols.length > 0 || (tooltipMeasureCols && tooltipMeasureCols.length > 0))) {
                    const fromCats = tipCols.map(t => ({ name: t.source.displayName, value: t.values[i] }));
                    const fromVals = (tooltipMeasureCols ?? []).map(t => ({ name: t.name, value: t.values[i] }));
                    node.tooltipFields = [...fromCats, ...fromVals]
                        .filter(t => t.value != null && String(t.value) !== "")
                        .map(t => ({ name: t.name, value: String(t.value) }));
                }

                // Accumulate measure: every node along the path (L1, L2, L3) gets this row's value
                if (rowMeasure !== null) {
                    node.measureValue = (node.measureValue ?? 0) + rowMeasure;
                }

                parentKey  = key;
                parentNode = node;
            }
        }

        // Restore state from before the rebuild
        this.nodeMap.forEach((n, k) => {
            if (expandedKeys.has(k)) n.isExpanded = true;
            if (selectedKeys.has(k)) n.isSelected  = true;
        });
        this.markParents();

        // Grand total — used to compute "% of total" for the value badge/tooltip.
        // Roots partition all rows, so summing root measures gives the true total.
        this.measureTotal = this.roots.reduce((sum, r) => sum + (r.measureValue ?? 0), 0);
    }

    // Selection only — does NOT touch isExpanded (except auto-expand for newly selected parent)
    toggleSelect(key: string, multiSelect: boolean, leafOnly: boolean): void {
        const node = this.nodeMap.get(key);
        if (!node) return;

        if (leafOnly && !node.isLeaf) return; // non-selectable in leaf-only mode

        const wasSelected = node.isSelected;
        if (!multiSelect) this.clearAll();
        node.isSelected = !wasSelected;

        // Auto-expand a newly selected non-leaf so children become visible
        if (node.isSelected && !node.isLeaf) {
            node.isExpanded = true;
        }

        this.markParents();
    }

    // Expand/collapse only — never touches isSelected
    toggleExpand(key: string, autoCollapse: boolean): void {
        const node = this.nodeMap.get(key);
        if (!node) return;
        node.isExpanded = !node.isExpanded;
        if (autoCollapse && node.isExpanded) {
            const siblings = node.parentKey
                ? (this.nodeMap.get(node.parentKey)?.children ?? this.roots)
                : this.roots;
            for (const sib of siblings) {
                if (sib.key !== key) {
                    sib.isExpanded = false;
                    this.collapseDescendants(sib);
                }
            }
        }
    }

    clearAll(): void {
        this.nodeMap.forEach(n => { n.isSelected = false; n.isParentOfSelection = false; });
    }

    getSelectedNodes(): HierarchyNode[] {
        const sel: HierarchyNode[] = [];
        this.nodeMap.forEach(n => { if (n.isSelected) sel.push(n); });
        return sel;
    }

    allNodes(): HierarchyNode[] {
        return Array.from(this.nodeMap.values());
    }

    markParents(): void {
        this.nodeMap.forEach(n => { n.isParentOfSelection = false; });
        this.nodeMap.forEach(n => {
            if (n.isSelected && n.parentKey) {
                let pk: string | null = n.parentKey;
                while (pk) {
                    const p = this.nodeMap.get(pk);
                    if (p) { p.isParentOfSelection = true; pk = p.parentKey; }
                    else break;
                }
            }
        });
    }

    // Sets isSelected from filter — intentionally does NOT touch isExpanded.
    // Call expandSelectedAncestors() separately when first loading to show context.
    restoreFromFilter(filterValues: Map<number, Set<string>>): void {
        this.nodeMap.forEach(n => {
            const levelVals = filterValues.get(n.level);
            n.isSelected = levelVals ? levelVals.has(valueKey(n.rawValue)) : false;
        });
        this.markParents();
    }

    // Called once on first load: expands parents of selected nodes so they are visible.
    expandSelectedAncestors(): void {
        this.nodeMap.forEach(n => {
            if (n.isSelected && !n.isLeaf) n.isExpanded = true;
            if (n.isSelected || n.isParentOfSelection) this.expandAncestors(n.key);
        });
    }

    applyDefaultSelection(mode: string): boolean {
        if (this.getSelectedNodes().length > 0) return false;
        if (mode === "first" && this.roots.length > 0) {
            this.roots[0].isSelected = true;
            this.markParents();
            return true;
        }
        return false;
    }

    /** Selección por valores escritos: el primer nodo de cada texto, en cualquier nivel. */
    selectValues(tokens: string[], multi: boolean, leafOnly: boolean): boolean {
        const hits: HierarchyNode[] = [];
        for (const tk of tokens) {
            const n = this.allNodes().find(x => (!leafOnly || x.isLeaf) && (norm(x.value) === tk || norm(String(x.rawValue)) === tk));
            if (n && hits.indexOf(n) < 0) hits.push(n);
        }
        if (!hits.length) return false;
        this.clearAll();
        (multi ? hits : hits.slice(0, 1)).forEach(n => { n.isSelected = true; });
        this.markParents();
        this.expandSelectedAncestors();
        return true;
    }

    getNode(key: string): HierarchyNode | undefined {
        return this.nodeMap.get(key);
    }

    private collapseDescendants(node: HierarchyNode): void {
        node.isExpanded = false;
        for (const c of node.children) this.collapseDescendants(c);
    }

    private expandAncestors(key: string): void {
        const node = this.nodeMap.get(key);
        if (!node || !node.parentKey) return;
        const parent = this.nodeMap.get(node.parentKey);
        if (parent) { parent.isExpanded = true; this.expandAncestors(parent.key); }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual
// ─────────────────────────────────────────────────────────────────────────────
export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private formattingSettingsService: FormattingSettingsService;
    private localization: powerbi.extensibility.ILocalizationManager;
    private settings: VisualSettingsModel;
    private hierarchyManager: HierarchyManager = new HierarchyManager();
    private dataView: DataView | null = null;
    private licenseManager: any;
    private isPro: boolean = false;
    /** False en Publish-to-Web, embebido, nubes nacionales y exportacion a PDF/PPT. */
    private licenseEnvSupported = true;
    /** False cuando la licencia no se pudo leer: sin conexion, o sin sesion iniciada. */
    private licenseInfoAvailable = true;
    /** Ya resuelta? Antes de saberlo no se notifica nada. */
    private licenseResolved = false;
    /** Ultima firma notificada, para no dar la lata. */
    private lastBlockedNotice = "";
    /** El icono persistente es de un solo disparo: queda hasta que se limpia. */
    private licenseIconShown = false;
    /** Temporizador que levanta la barra de Upgrade cuando el banner termina. */
    private temporizadorIcono: number | null = null;
    /** Editando sin licencia y con la licencia resuelta: lo Pro se dibuja con marca. */
    private previaPro = false;
    private editando = false;
    /** Funciones Pro que el usuario ha activado (claves PRO_*), para la marca de agua. */
    private etiquetasPro: string[] = [];
    private searchQuery: string = "";
    private hasInitializedTree: boolean = false;
    /** True mientras esperamos el update que confirma un filtro aplicado por nosotros. */
    private pendingSelfFilter: boolean = false;
    /** Cuándo se aplicó: si el eco no llega (filtro igual al vigente), la marca caduca y no tapa un cambio externo. */
    private pendingSince = 0;
    /** "First value" se aplica una vez al abrir, como "These values": después, limpiar se respeta. */
    private firstDone = false;
    private measureDisplayName: string = "";
    private measureColumnFormat: string | undefined;
    private formatMode = false;
    private lastViewport: powerbi.IViewport = { width: 0, height: 0 };
    /** Desplegable abierto (modo Pro). Es de la sesión: no se guarda. */
    private popupOpen = false;
    /** Clave del chip con tabindex=0 (roving tabindex). */
    private focusKey: string | null = null;
    /** Última plantilla vista: al cambiarla editando se aplica de verdad (aplicarPlantilla). */
    private tplVisto: string | null = null;
    /** Selección por defecto por valores ya resuelta para este texto. */
    private defaultSig: string | null = null;
    private fmtCache = new Map<string, valueFormatter.IValueFormatter>();
    private subSelectionHelper: HtmlSubSelectionHelper;
    public visualOnObjectFormatting: powerbi.extensibility.visual.VisualOnObjectFormatting;

    private static readonly ALL_KEY = "\u0000all";

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        // CON el gestor de localizacion. Sin el, los displayNameKey no se resuelven y el
        // panel sale en ingles aunque las traducciones esten escritas y guardadas.
        this.localization = this.host.createLocalizationManager();
        this.formattingSettingsService = new FormattingSettingsService(this.localization);
        this.settings = new VisualSettingsModel();
        this.licenseManager = (options.host as any).licenseManager;
        this.target.style.overflow = "hidden";
        this.target.style.boxSizing = "border-box";
        this.target.style.position = "relative";
        this.target.classList.add("csh");

        // Empty-space context menu (required by AppSource certification)
        this.target.addEventListener("contextmenu", (e: MouseEvent) => {
            e.preventDefault();
            if (this.formatMode) return;
            this.selectionManager.showContextMenu(null as any, { x: e.clientX, y: e.clientY });
        });
        this.target.addEventListener("keydown", (e: KeyboardEvent) => this.onKeyDown(e));

        // Los marcadores devuelven el filtro en el update; esto solo repinta si la selección llega antes.
        this.selectionManager.registerOnSelectCallback(() => { if (this.dataView) this.renderChipMode(); });

        this.subSelectionHelper = HtmlSubSelectionHelper.createHtmlSubselectionHelper({
            hostElement: options.element,
            subSelectionService: options.host.subSelectionService,
            selectionIdCallback: () => undefined,
        });
        this.visualOnObjectFormatting = {
            getSubSelectionStyles: (subs) => this.getSubSelectionStyles(subs),
            getSubSelectionShortcuts: (subs) => this.getSubSelectionShortcuts(subs),
            getSubSelectables: (filter) => this.subSelectionHelper.getAllSubSelectables(filter),
        };
    }

    async update(options: VisualUpdateOptions): Promise<void> {
        this.host.eventService.renderingStarted(options);
        // viewMode 0 es vista de lectura. La previa es cosa de quien edita: un informe
        // publicado nunca debe usar una funcion que no se ha pagado.
        this.editando = (options as unknown as { viewMode?: number }).viewMode !== 0;
        this.formatMode = !!(options as any).formatMode;
        this.subSelectionHelper.setFormatMode(this.formatMode);
        this.target.classList.toggle("fmt", this.formatMode);
        this.lastViewport = options.viewport ?? this.lastViewport;
        const pal: any = this.host.colorPalette;
        this.target.style.setProperty("--csh-focus", pal?.isHighContrast ? (pal.foregroundSelected?.value || pal.foreground?.value || "#FFFF00") : "#005A9E");
        try {
            await this._update(options);
            this.markSubSelectables();
            if (this.formatMode) this.subSelectionHelper.updateOutlinesFromSubSelections((options as any).subSelections ?? [], true);
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    // ─── Textos ──────────────────────────────────────────────────────────────

    /** Texto por clave: primero la tabla del bundle (Desktop no traduce claves que no estén en capabilities). */
    private t(key: string, fallback: string): string {
        const loc = String(this.host?.locale || "");
        const tabla = STRINGS[loc] || STRINGS[Object.keys(STRINGS).find(l => l.slice(0, 2) === loc.slice(0, 2)) || ""];
        if (tabla && tabla[key]) return tabla[key];
        try {
            const s = this.localization?.getDisplayName(key);
            return s && s !== key ? s : fallback;
        } catch { return fallback; }
    }

    /** Plantillas con "{0}". */
    private tf(key: string, fallback: string, ...args: string[]): string {
        return this.t(key, fallback).replace(/\{(\d+)\}/g, (_m, i) => args[Number(i)] ?? "");
    }

    private proLabel(k: string): string {
        if (k === PRO_SEARCH) return this.t("Pro_Search", "the search box");
        if (k === PRO_HEATMAP) return this.t("Pro_Heatmap", "colouring chips by value");
        return this.t("Pro_Popup", "the drop-down mode");
    }

    private interactionsAllowed(): boolean {
        const h = this.host as any;
        return (h?.hostCapabilities?.allowInteractions ?? h?.allowInteractions) !== false;
    }

    /**
     * Que ajustes de pago ha fijado el usuario.
     *
     * Se lee de metadata.objects, que solo contiene lo que el usuario ha puesto
     * explicitamente. El modelo de ajustes no sirve: cada propiedad tiene un
     * valor por defecto, asi que compararlo avisaria en un informe que nadie ha
     * tocado. Aqui la presencia ES la accion, y por tanto la intencion de compra.
     */
    private attemptedProFeatures(): { labels: string[]; signature: string } {
        const objs = (this.dataView?.metadata?.objects ?? {}) as any;
        const labels: string[] = [];
        const parts: string[] = [];

        const pares: [string, string, string][] = [
            ["searchSettings",  "showSearch",  PRO_SEARCH],
            ["heatmapSettings", "showHeatmap", PRO_HEATMAP],
            ["popup",           "show",        PRO_POPUP],
        ];
        for (const [card, prop, etiqueta] of pares) {
            const v = objs?.[card]?.[prop];
            if (v !== undefined && v !== false) {
                labels.push(etiqueta);
                parts.push(`${card}.${prop}=${JSON.stringify(v)}`);
            }
        }
        return { labels, signature: parts.join("|") };
    }

    /**
     * Vista previa Pro.
     *
     * Solo con la licencia ya resuelta y en un entorno donde se puede leer: al arrancar,
     * isPro es false tambien para quien ya pago, y donde la licencia no se resuelve
     * -Publicar en la web, incrustado, exportacion- un cliente Pro se lee como gratuito.
     * Marcarlo ahi seria ponerle la marca a quien ya compro.
     */
    private calcularPrevia(): boolean {
        return !this.isPro && this.editando && this.licenseResolved
            && this.licenseEnvSupported && this.licenseInfoAvailable;
    }

    /** Si una funcion Pro concreta se dibuja. Por funcion, nunca en bloque. */
    private permitir(etiqueta: string): boolean {
        if (this.isPro) { return true; }
        if (!this.previaPro) { return false; }
        return this.etiquetasPro.indexOf(etiqueta) >= 0;
    }

    /**
     * "Pro preview" sobre los chips, y debajo lo que la ha encendido.
     *
     * Con DOM, como todo el visual, y con textContent: nunca innerHTML. Se retira siempre
     * al principio, asi que apagar la funcion la quita sin dejar rastro.
     */
    private renderMarcaDeAgua(): void {
        const previa = this.target.querySelector(".tcviz-marca");
        if (previa) { previa.remove(); }
        if (!this.previaPro || this.etiquetasPro.length === 0) { return; }

        const capa = document.createElement("div");
        capa.className = "tcviz-marca";
        capa.setAttribute("aria-hidden", "true");
        capa.style.cssText = [
            "position:absolute", "inset:0", "display:flex", "flex-direction:column",
            "align-items:center", "justify-content:center", "gap:4px",
            "pointer-events:none", "z-index:50", "opacity:0.72",
            "transform:rotate(-20deg)", "font-family:'Segoe UI',sans-serif",
        ].join(";");

        const linea = (texto: string, px: number, peso: string) => {
            const el = document.createElement("div");
            el.textContent = texto;
            el.style.cssText = [
                `font-size:${px}px`, `font-weight:${peso}`, "letter-spacing:0.06em",
                "color:#FFFFFF", "text-align:center",
                // El contorno oscuro hace que se lea igual sobre chips claros y oscuros.
                "text-shadow:0 0 3px #1B2A41,0 0 3px #1B2A41,0 0 3px #1B2A41",
            ].join(";");
            capa.appendChild(el);
        };

        const ancho = this.target.clientWidth || 300;
        const alto = this.target.clientHeight || 200;
        const fs = Math.round(Math.max(20, Math.min(72, ancho / 8, alto / 3.5)));

        linea(this.t("UI_ProPreview", "Pro preview"), fs, "700");
        linea(this.etiquetasPro.map(k => this.proLabel(k)).join(" · "), Math.round(fs * 0.34), "600");
        this.target.appendChild(capa);
    }

    /** Retira el aviso: la licencia resolvio, o el usuario quito los ajustes Pro. */
    private clearLicenseNotice(): void {
        this.lastBlockedNotice = "";
        this.cancelarIconoLicencia();
        if (!this.licenseIconShown) return;
        this.licenseIconShown = false;
        try {
            this.licenseManager?.clearLicenseNotification?.();
        } catch { /* best-effort */ }
    }

    /**
     * Las notificaciones de la plataforma, que son las que llevan a la compra.
     */
    private notifyProFeatureBlocked(): void {
        if (this.isPro) { this.clearLicenseNotice(); return; }

        // Antes de saber la respuesta no se dice nada: isPro es false de entrada
        // tambien para un cliente que tiene licencia.
        if (!this.licenseResolved) return;

        const { labels, signature } = this.attemptedProFeatures();
        if (labels.length === 0) { this.clearLicenseNotice(); return; }

        // Entorno sin licencias, o licencia ilegible: un cliente Pro cae aqui.
        if (!this.licenseEnvSupported || !this.licenseInfoAvailable) return;

        // El banner cubre la accion, y solo cuando hay una nueva: update() corre
        // tambien al redimensionar y al refrescar datos.
        if (signature === this.lastBlockedNotice) return;
        this.lastBlockedNotice = signature;

        // Limpiar ANTES. Power BI muestra un aviso cada vez y el ultimo pisa al anterior:
        // hasta 1.1.1.0 se levantaba primero la barra de Upgrade y despues el banner, asi
        // que el banner la borraba y, al desvanecerse, no quedaba ninguna ruta de compra.
        try { this.licenseManager?.clearLicenseNotification?.(); } catch { /* best-effort */ }
        this.licenseIconShown = false;

        try {
            const nombres = labels.map(k => this.proLabel(k));
            const lista = nombres.length === 1
                ? nombres[0]
                : nombres.slice(0, -1).join(", ") + " · " + nombres[nombres.length - 1];
            this.licenseManager?.notifyFeatureBlocked?.(
                this.tf("UI_ProBlocked", "Chip Slicer Hierarchy: {0} — part of the Pro plan. Get a licence to enable it.", lista)
            );
        } catch { /* la notificacion nunca debe romper el render */ }

        // Y la barra de Upgrade DESPUES, cuando el banner ya se ha ido. Cubre el estado
        // -una prueba caducada, donde el usuario no toca nada y la funcion desaparece
        // sola-, que el banner por si solo no cubre porque solo salta al cambiar un ajuste.
        this.cancelarIconoLicencia();
        this.temporizadorIcono = window.setTimeout(() => {
            this.temporizadorIcono = null;
            if (this.isPro) { return; }
            try {
                // const enum: TypeScript lo inlinea a 0. Referenciar el objeto
                // del enum en runtime daria undefined.
                this.licenseManager?.notifyLicenseRequired?.(LicenseNotificationType.General);
                this.licenseIconShown = true;
            } catch { /* best-effort */ }
        }, 10500);
    }

    /** Cancela la barra de Upgrade que estuviera programada. */
    private cancelarIconoLicencia(): void {
        if (this.temporizadorIcono !== null) {
            window.clearTimeout(this.temporizadorIcono);
            this.temporizadorIcono = null;
        }
    }

    /**
     * Power BI recrea el visual al cambiar de pagina: un temporizador vivo levantaria la
     * barra de Upgrade sobre un visual que ya no existe.
     */
    public destroy(): void {
        this.cancelarIconoLicencia();
    }

    private async _update(options: VisualUpdateOptions): Promise<void> {
        // License check // ISPRO_BLOCK_START
        try {
            const licenseResult = await this.licenseManager?.getAvailableServicePlans();

            // spIdentifier: sin esto valia CUALQUIER plan activo del usuario, no el
            // de este visual. Warning es periodo de gracia por un problema de pago:
            // la licencia sigue siendo usable y un cliente que paga no debe perder sus features.
            this.isPro = licenseResult?.plans?.some(
                (p: any) => matchesPlan(p.spIdentifier, PLAN_ID) &&
                    ((p.state as unknown as number) === ServicePlanState.Active ||
                     (p.state as unknown as number) === ServicePlanState.Warning)
            ) ?? false;

            // Un cliente Pro se lee como Free en estos casos, asi que no se le
            // puede pedir que compre lo que ya tiene.
            this.licenseEnvSupported  = !licenseResult?.isLicenseUnsupportedEnv;
            this.licenseInfoAvailable = licenseResult?.isLicenseInfoAvailable !== false;
            this.licenseResolved = true;
        } catch {
            this.isPro = false;
            this.licenseInfoAvailable = false;
            this.licenseResolved = true;
        } // ISPRO_BLOCK_END

        const dv = options.dataViews?.[0];
        this.settings = this.formattingSettingsService.populateFormattingSettingsModel(VisualSettingsModel, dv);
        const hayNiveles = !!dv?.categorical?.categories?.some(c => (c.source.roles as any)?.["categories"]);
        if (!dv || !hayNiveles) { this.dataView = dv ?? null; this.showLanding(); return; }

        this.dataView = dv;
        if (this.lastLocale !== this.host.locale) { this.fmtCache.clear(); this.lastLocale = this.host.locale; }

        // Plantillas: lo que el autor no ha fijado toma el valor de la plantilla; al ELEGIR una, se borra lo que define.
        const objs: any = dv.metadata?.objects ?? {};
        const tpl = String(objs?.style?.template ?? "classic");
        this.applyTemplateDefaults(tpl, objs);
        if (this.editando && this.tplVisto !== null && this.tplVisto !== tpl) this.aplicarPlantilla(tpl);
        this.tplVisto = tpl;

        const s = this.settings.chipSettingsCard;

        // Extract measure column (values role) — bound in categorical.values so
        // Power BI actually aggregates it (SUM/COUNT/etc.) instead of treating it
        // as a dimension. Values are row-aligned with dv.categorical.categories.
        let measureValues: powerbi.PrimitiveValue[] | undefined;
        let measureFormats: (string | undefined)[] | undefined;
        let highlightValues: powerbi.PrimitiveValue[] | undefined;
        this.measureDisplayName = "";
        this.measureColumnFormat = undefined;
        // Tooltip fields that Power BI moved into categorical.values because they're
        // measures (or aggregated numeric columns) rather than plain text/dimension columns.
        const tooltipMeasureCols: { name: string; values: powerbi.PrimitiveValue[] }[] = [];
        const valCols = dv.categorical?.values;
        if (valCols) {
            for (const val of valCols) {
                const roles = val.source.roles as Record<string, boolean>;
                if (roles && roles["values"]) {
                    measureValues = val.values as powerbi.PrimitiveValue[];
                    highlightValues = (val as any).highlights as powerbi.PrimitiveValue[] | undefined;
                    this.measureDisplayName = val.source.displayName;
                    try { this.measureColumnFormat = valueFormatter.getFormatStringByColumn(val.source as any) || val.source.format || undefined; }
                    catch { this.measureColumnFormat = val.source.format ?? undefined; }
                    // Cadena dinámica por fila (general.formatString declarado en capabilities).
                    const objsFila: any[] = (val as any).objects ?? [];
                    measureFormats = measureValues.map((_v, i) => objsFila[i]?.general?.formatString || undefined);
                } else if (roles && roles["tooltips"]) {
                    tooltipMeasureCols.push({ name: val.source.displayName, values: val.values as powerbi.PrimitiveValue[] });
                }
            }
        }

        this.hierarchyManager.buildTree(dv, Boolean(s.hideBlank.value), (v, src) => this.labelOf(v, src),
            measureValues, measureFormats, tooltipMeasureCols, highlightValues);

        // Restore filter state — only on first load (report open / bookmark restore).
        // After that, buildTree already saves/restores selectedKeys from in-memory nodeMap
        // so we don't risk overwriting selections with a mis-parsed filter.
        const existingFilter = (options.jsonFilters?.[0] ?? dv.metadata?.objects?.["general"]?.["filter"]) as any;

        // El eco de nuestro propio filtro no se restaura. Si no llega en 2 s (Power BI no lo manda cuando el filtro es
        // igual al vigente), la marca caduca: si no, el siguiente cambio externo (un marcador) se tomaría por eco.
        if (this.pendingSelfFilter && Date.now() - this.pendingSince > 2000) this.pendingSelfFilter = false;
        if (this.pendingSelfFilter) {
            this.pendingSelfFilter = false;
            this.hasInitializedTree = true;
        } else if (!this.hasInitializedTree) {
            if (existingFilter) {
                try {
                    const filterValues = this.parseFilter(existingFilter);
                    this.hierarchyManager.restoreFromFilter(filterValues);
                    this.hierarchyManager.expandSelectedAncestors();
                } catch { /* ignore */ }
            }
            this.hasInitializedTree = true;
        } else {
            // Marcadores y filtros limpiados desde fuera: se compara lo que Power BI tiene con lo que
            // pintamos, y solo se toca cuando divergen. El eco de nuestro propio filtro ya se ha
            // descartado arriba, asi que una divergencia aqui viene de fuera.
            try {
                const filterValues = existingFilter
                    ? this.parseFilter(existingFilter)
                    : new Map<number, Set<string>>();
                const enFiltro = new Set<string>();
                filterValues.forEach((vals, lvl) => vals.forEach(v => enFiltro.add(lvl + "|" + v)));
                const enPantalla = new Set(
                    this.hierarchyManager.getSelectedNodes().map(n => n.level + "|" + valueKey(n.rawValue))
                );
                const iguales = enFiltro.size === enPantalla.size &&
                    [...enFiltro].every(k => enPantalla.has(k));
                if (!iguales) {
                    this.hierarchyManager.restoreFromFilter(filterValues);
                    this.hierarchyManager.expandSelectedAncestors();
                }
            } catch { /* ante la duda, dejar lo que hay en pantalla */ }
        }

        const defaultSel = (s.defaultSelection?.value as any)?.value ?? "none";
        if (this.interactionsAllowed() && !this.formatMode) {
            if (defaultSel === "first" && !this.firstDone) {
                // Solo al abrir sin filtro: tras limpiar con ✕, Escape o un marcador sin selección, se queda limpio.
                this.firstDone = true;
                if (!existingFilter && this.hierarchyManager.applyDefaultSelection("first")) await this.applyFilter();
            } else if (defaultSel === "values") {
                await this.applyDefaultValues(!!existingFilter);
            }
        }

        // La licencia ya esta resuelta y los ajustes poblados: es el momento de
        // decir algo si el usuario ha pedido una feature de pago.
        // Estado de la previa ANTES de pintar: el render pregunta por el en cada punto
        // de bloqueo. Y las etiquetas se recalculan aqui en cada pasada, nunca se
        // acumulan: lo que se apaga tiene que dejar de aparecer en la marca.
        this.previaPro = this.calcularPrevia();
        this.etiquetasPro = this.isPro ? [] : this.attemptedProFeatures().labels;

        this.notifyProFeatureBlocked();

        this.render();
    }

    /**
     * Selección por defecto por valores: si el visual se abre sin filtro, se aplica una vez. Si luego el usuario
     * limpia, se queda limpio hasta que se vuelve a abrir la página. Editando, cambiar el texto la aplica en el momento.
     */
    private async applyDefaultValues(hayFiltro: boolean): Promise<void> {
        const s = this.settings.chipSettingsCard;
        const txt = String(s.defaultValues.value ?? "").trim();
        if (this.defaultSig === txt) return;
        const cambio = this.defaultSig !== null;
        if (!txt) { this.defaultSig = txt; return; }
        if (hayFiltro && !(cambio && this.editando)) { this.defaultSig = txt; return; }
        const tokens = txt.split(/[,;|]/).map(x => norm(x.trim())).filter(x => x);
        if (!this.hierarchyManager.selectValues(tokens, Boolean(s.multiSelect.value), Boolean(s.leafOnly?.value))) return;
        this.defaultSig = txt;
        await this.applyFilter();
    }

    private lastLocale: string | null = null;

    /** Etiqueta de un valor con el formato de su columna (fechas, números) y el idioma del informe. */
    private labelOf(v: powerbi.PrimitiveValue, src: powerbi.DataViewMetadataColumn): string {
        if (typeof v === "number" || v instanceof Date) {
            let fmt: string | undefined;
            try { fmt = valueFormatter.getFormatStringByColumn(src as any) || src?.format || undefined; } catch { fmt = src?.format; }
            try { return this.formatter(fmt).format(v); } catch { /* cae al texto */ }
            if (v instanceof Date) return v.toLocaleDateString(this.host.locale || undefined);
        }
        return String(v);
    }

    private formatter(fmt: string | undefined): valueFormatter.IValueFormatter {
        const k = fmt ?? "";
        let f = this.fmtCache.get(k);
        if (!f) {
            f = valueFormatter.create({ format: fmt, cultureSelector: this.host.locale });
            this.fmtCache.set(k, f);
        }
        return f;
    }

    // ─── Plantillas ──────────────────────────────────────────────────────────

    private applyTemplateDefaults(tpl: string, objs: any): void {
        const tp = TEMPLATES[tpl];
        if (!tp) return;
        Object.keys(tp).forEach(obj => {
            const card: any = this.settings.cards.find((c: any) => c.name === obj);
            if (!card) return;
            Object.keys(tp[obj]).forEach(prop => {
                if (objs?.[obj]?.[prop] !== undefined) return;
                const sl: any = (card.slices ?? []).find((x: any) => x.name === prop);
                if (!sl) return;
                sl.value = sl instanceof formattingSettings.ColorPicker ? { value: String(tp[obj][prop]) } : tp[obj][prop];
            });
        });
    }

    /** Al ELEGIR una plantilla se borran los ajustes guardados que ella define, para que se vea. */
    private aplicarPlantilla(nombre: string): void {
        const tp = TEMPLATES[nombre] ?? {};
        const remove: any[] = Object.keys(tp).map(obj => ({
            objectName: obj, selector: null,
            properties: Object.keys(tp[obj]).reduce((acc: any, p) => { acc[p] = null; return acc; }, {})
        }));
        if (remove.length) this.host.persistProperties({ remove });
    }

    private persistir(objectName: string, properties: any): void {
        this.host.persistProperties({ merge: [{ objectName, selector: null as any, properties }] });
    }

    // ─── Pantalla de inicio (serie TCViz) ────────────────────────────────────

    /** En tres tamaños. Los enlaces solo se abren con un clic (host.launchUrl). */
    private showLanding(): void {
        this.vaciar(this.target);
        const vp = this.lastViewport;
        const w = vp?.width || 0, h = vp?.height || 0;
        const size = (w >= 560 && h >= 300) ? "l" : (w >= 320 && h >= 200) ? "m" : "s";
        const pal: any = this.host.colorPalette;
        const hc = !!pal?.isHighContrast;
        const fg = hc ? (pal.foreground?.value || "#FFFFFF") : "";
        const el = document.createElement("div");
        el.className = "csh-landing csh-landing-" + size;
        if (hc) el.style.background = pal.background?.value || "#000000";
        const mk = (tag: string, cls?: string, text?: string): HTMLElement => {
            const n = document.createElement(tag);
            if (cls) n.className = cls;
            if (text !== undefined) n.textContent = text;
            if (fg) n.style.color = fg;
            return n;
        };
        const head = mk("div", "cl-head");
        const img = document.createElement("img");
        img.src = LANDING_ICON; img.alt = ""; img.className = "cl-icon";
        head.appendChild(img);
        const titles = mk("div");
        titles.appendChild(mk("div", "cl-title", "Chip Slicer Hierarchy"));
        if (size !== "s") titles.appendChild(mk("div", "cl-tag", this.t("Landing_Tagline", "Filter by levels — country, region, city — with one click.")));
        head.appendChild(titles);
        el.appendChild(head);
        const link = (txt: string, url: string, cls: string, sub?: string): HTMLElement => {
            const a = mk("a", cls) as HTMLAnchorElement;
            a.href = url; a.tabIndex = 0;
            a.appendChild(document.createTextNode(txt));
            if (sub) a.appendChild(mk("span", "cl-sub", sub));
            if (hc) { a.style.background = "transparent"; a.style.borderColor = fg; }
            const open = (e: Event) => { e.preventDefault(); e.stopPropagation(); if (this.interactionsAllowed()) this.host.launchUrl(url); };
            a.addEventListener("click", open);
            a.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") open(e); });
            return a;
        };
        if (size === "s") {
            el.appendChild(mk("p", "cl-do", this.t("Landing_Small", "Add fields to Categories: the first is level 1.")));
            el.appendChild(link(this.t("Landing_Guide", "Guide"), URL_GUIDE, "cl-a"));
            this.target.appendChild(el);
            return;
        }
        const cols = mk("div", "cl-cols");
        const pasos = mk("div");
        pasos.appendChild(mk("div", "cl-lbl", this.t("Landing_Steps", "Get started")));
        const ol = mk("ol", "cl-steps");
        const paso = (n: string, b: string, txt: string) => {
            const li = mk("li");
            const num = mk("span", "cl-n", n);
            if (hc) Object.assign(num.style, { background: "transparent", border: "1px solid " + fg });
            li.appendChild(num);
            const sp = mk("span");
            sp.appendChild(mk("b", "cl-well", b));
            sp.appendChild(document.createTextNode(" — " + txt));
            li.appendChild(sp);
            ol.appendChild(li);
        };
        paso("1", this.t("roleCategories", "Categories"), this.t("Landing_Step1", "up to 3 fields: the first is level 1, the next its children"));
        paso("2", this.t("roleValues", "Values"), this.t("Landing_Step2", "optional: a measure shown on each chip"));
        paso("3", this.t("card_style", "Style template"), this.t("Landing_Step3", "in the Format pane: pick a look in one click"));
        pasos.appendChild(ol);
        if (size === "l") {
            const pro = mk("div", "cl-pro");
            const chip = mk("span", "cl-chip", "Pro");
            if (hc) { chip.style.background = "transparent"; chip.style.border = "1px solid " + fg; }
            pro.appendChild(chip);
            pro.appendChild(mk("span", "", this.t("Landing_Pro", "Search, drop-down mode and colour by value — try them on your data while you edit.")));
            pasos.appendChild(pro);
        }
        cols.appendChild(pasos);
        const links = mk("div");
        links.appendChild(mk("div", "cl-lbl", this.t("Landing_Help", "Help")));
        const ll = mk("div", "cl-links");
        ll.appendChild(link(this.t("Landing_Guide", "Guide"), URL_GUIDE, "cl-card", this.t("Landing_GuideSub", "support page")));
        ll.appendChild(link(this.t("Landing_Product", "Product page"), URL_PRODUCT, "cl-card", "tcviz.com"));
        if (size === "l") ll.appendChild(link(this.t("Landing_Video", "Video"), URL_VIDEO, "cl-card", "YouTube"));
        links.appendChild(ll);
        cols.appendChild(links);
        el.appendChild(cols);
        this.target.appendChild(el);
    }

    /** Vacia un elemento sin pasar por innerHTML. */
    private vaciar(el: HTMLElement): void {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    private render(): void {
        this.renderChipMode();
    }

    // ─── MAIN RENDER ──────────────────────────────────────────────────────────
    /** Rango por nivel, recalculado una vez por render y no por chip. */
    private rangoHeatmap: Map<number, { min: number; max: number }> | null = null;

    /** Modo desplegable activo (Pro o vista previa). */
    private popupOn(): boolean {
        return Boolean(this.settings.popupSettingsCard.show.value) && this.permitir(PRO_POPUP);
    }

    private renderChipMode(): void {
        if (!this.dataView || !this.settings) return;
        const hm = this.settings?.heatmapSettingsCard;
        this.rangoHeatmap = (this.permitir(PRO_HEATMAP) && hm && Boolean(hm.showHeatmap.value))
            ? this.rangoPorNivel()
            : null;
        // Capture focus before any DOM mutation
        const active = document.activeElement as HTMLElement;
        const hadFocus = !!active && this.target.contains(active);
        const searchWasFocused = hadFocus && active.tagName === "INPUT";
        const barWasFocused = hadFocus && active.classList.contains("csh-bar");
        const prevScroll = (this.target.querySelector(".csh-scroll") as HTMLElement)?.scrollTop ?? 0;

        const isHC   = this.host.colorPalette.isHighContrast;
        const s      = this.settings.chipSettingsCard;
        const hs     = this.settings.hierarchySettingsCard;
        const ss     = this.settings.searchSettingsCard;
        const layout = (s.layout?.value as any)?.value ?? "horizontal";
        const popup  = this.popupOn();

        const root = document.createElement("div");
        root.className = "csh-root";
        root.style.fontFamily = isHC ? "system-ui" : String(s.fontFamily?.value || "'Segoe UI', sans-serif");

        // Contenido: buscador, reinicio y chips. En modo desplegable va dentro del panel.
        const body = document.createElement("div");
        body.className = popup ? "csh-panel" : "csh-body";
        // Botón de limpiar (✕), como en Chip Slicer: junto a la barra del desplegable, junto al buscador o, si no hay
        // ninguno, flotando arriba a la derecha. Solo cuando hay algo seleccionado (o en modo formato, para elegirlo).
        const hasSel = this.hierarchyManager.getSelectedNodes().length > 0;
        const showClear = Boolean(hs.showReset.value) && (hasSel || this.formatMode);
        let clearPlaced = false;
        const conBuscador = Boolean(ss.showSearch.value) && this.permitir(PRO_SEARCH);
        if (conBuscador) {
            // Sin licencia y fuera de la vista previa no se dibuja nada: la ruta de compra la pone
            // notifyProFeatureBlocked (UI de licencia propia, no).
            const fila = document.createElement("div");
            fila.className = "csh-row";
            fila.appendChild(this.buildSearchBox(isHC));
            if (showClear) { fila.appendChild(this.buildResetButton(isHC)); clearPlaced = true; }
            body.appendChild(fila);
        }
        const chipContainer = document.createElement("div");
        chipContainer.className = "csh-scroll";
        chipContainer.style.gap = `${s.chipGap.value}px`;
        chipContainer.setAttribute("role", "group");
        chipContainer.setAttribute("aria-label", this.levelNames());
        if (this.searchQuery && this.permitir(PRO_SEARCH)) {
            this.renderSearchResults(chipContainer, isHC, layout);
        } else {
            this.renderNodes(this.hierarchyManager.roots, chipContainer, isHC, layout, 0);
        }
        body.appendChild(chipContainer);

        if (popup) {
            const fila = document.createElement("div");
            fila.className = "csh-row";
            fila.appendChild(this.buildPopupBar(isHC));
            if (showClear && !clearPlaced) { fila.appendChild(this.buildResetButton(isHC)); clearPlaced = true; }
            root.appendChild(fila);
            if (this.popupOpen) {
                if (isHC) {
                    const pal: any = this.host.colorPalette;
                    Object.assign(body.style, { background: pal.background?.value || "#000", borderColor: pal.foreground?.value || "#FFF" });
                }
                root.appendChild(body);
            }
        } else {
            root.appendChild(body);
        }
        if (showClear && !clearPlaced) {
            const b = this.buildResetButton(isHC);
            b.classList.add("csh-clear-float");
            root.appendChild(b);
        }
        // Sin barra ni buscador, se reserva el hueco del botón flotante para que no tape chips.
        if (Boolean(hs.showReset.value) && !popup && !conBuscador) root.classList.add("reserve-clear");

        this.vaciar(this.target);
        this.target.appendChild(root);
        const sc = this.target.querySelector(".csh-scroll") as HTMLElement;
        if (sc) sc.scrollTop = prevScroll;

        // Roving tabindex: una sola parada de Tab para los chips
        const chips = Array.from(this.target.querySelectorAll<HTMLElement>(".csh-chip"));
        const focusChip = chips.find(c => c.dataset.key === this.focusKey)
            ?? chips.find(c => c.getAttribute("aria-pressed") === "true")
            ?? chips[0];
        chips.forEach(c => { c.tabIndex = c === focusChip ? 0 : -1; });
        this.focusKey = focusChip?.dataset.key ?? null;

        if (searchWasFocused) {
            const inp = this.target.querySelector("input") as HTMLInputElement;
            if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        } else if (barWasFocused) {
            (this.target.querySelector(".csh-bar") as HTMLElement)?.focus();
        } else if (hadFocus) {
            focusChip?.focus();
        }

        this.renderGuide(isHC);
        this.renderMarcaDeAgua();
        this.markSubSelectables();
    }

    private levelNames(): string {
        const cats = this.dataView?.categorical?.categories ?? [];
        return cats.filter(c => (c.source.roles as any)?.["categories"]).map(c => c.source.displayName).join(" › ");
    }

    // ─── DESPLEGABLE (Pro) ────────────────────────────────────────────────────
    private buildPopupBar(isHC: boolean): HTMLElement {
        const ps = this.settings.popupSettingsCard;
        const s = this.settings.chipSettingsCard;
        const bar = document.createElement("button");
        bar.type = "button";
        bar.className = "csh-bar" + (this.popupOpen ? " open" : "");
        bar.setAttribute("aria-expanded", String(this.popupOpen));
        bar.setAttribute("data-o", "popup");
        const lbl = document.createElement("span");
        lbl.className = "csh-bar-lbl";
        lbl.textContent = String(ps.label.value || "") || this.levelNames();
        const sel = this.hierarchyManager.getSelectedNodes();
        const sum = document.createElement("span");
        sum.className = "csh-bar-sum";
        sum.textContent = sel.length === 0 ? ((s.selectAllLabel.value as string) || this.t("All", "All"))
            : sel.length <= 2 ? sel.map(n => n.value).join(", ")
            : this.tf("UI_NSelected", "{0} selected", String(sel.length));
        const car = document.createElement("span");
        car.className = "csh-bar-car";
        car.textContent = this.popupOpen ? "▴" : "▾";
        car.setAttribute("aria-hidden", "true");
        bar.appendChild(lbl); bar.appendChild(sum); bar.appendChild(car);
        bar.style.fontSize = `${s.fontSize.value}px`;
        if (isHC) {
            const pal: any = this.host.colorPalette;
            Object.assign(bar.style, { background: pal.background?.value || "#000", color: pal.foreground?.value || "#FFF", borderColor: pal.foreground?.value || "#FFF" });
        }
        bar.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this.formatMode) return;
            this.popupOpen = !this.popupOpen;
            this.renderChipMode();
        });
        return bar;
    }

    // ─── SEARCH BOX ───────────────────────────────────────────────────────────
    private buildSearchBox(isHC: boolean): HTMLElement {
        const ss = this.settings.searchSettingsCard;
        const wrap = document.createElement("div");
        wrap.className = "csh-search";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = (ss.searchPlaceholder.value as string) || this.t("UI_Search", "Search…");
        input.setAttribute("aria-label", input.placeholder);
        input.setAttribute("data-o", "search");
        input.value = this.searchQuery;
        input.style.cssText = `
            width:100%; padding:6px 28px 6px 10px; border-radius:6px; box-sizing:border-box;
            border:1px solid ${isHC ? "ButtonText" : (ss.searchBorder.value?.value ?? "#D1D5DB")};
            background:${isHC ? "ButtonFace" : (ss.searchBg.value?.value ?? "#FFFFFF")};
            color:${isHC ? "ButtonText" : (ss.searchText.value?.value ?? "#374151")};
            font-size:13px;
        `;
        input.addEventListener("input", () => { this.searchQuery = input.value; this.renderChipMode(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === "ArrowDown") { e.preventDefault(); (this.target.querySelector(".csh-chip[tabindex='0']") as HTMLElement)?.focus(); }
            if (e.key === "Escape" && input.value) { e.preventDefault(); this.searchQuery = ""; this.renderChipMode(); }
        });

        const clr = document.createElement("button");
        clr.type = "button";
        clr.className = "csh-search-clr";
        clr.textContent = "×";
        clr.title = this.t("UI_ClearSearch", "Clear search");
        clr.setAttribute("aria-label", clr.title);
        clr.style.display = this.searchQuery ? "block" : "none";
        clr.addEventListener("click", () => { this.searchQuery = ""; this.renderChipMode(); });

        wrap.appendChild(input);
        wrap.appendChild(clr);
        return wrap;
    }

    // ─── SEARCH RESULTS ───────────────────────────────────────────────────────
    private renderSearchResults(container: HTMLElement, isHC: boolean, layout: string): void {
        const q = norm(this.searchQuery);
        const matches: HierarchyNode[] = [];
        const collect = (nodes: HierarchyNode[]) => {
            for (const n of nodes) {
                if (norm(n.value).includes(q)) matches.push(n);
                collect(n.children);
            }
        };
        collect(this.hierarchyManager.roots);

        if (matches.length === 0) {
            const empty = document.createElement("div");
            empty.className = "csh-note";
            empty.textContent = this.tf("UI_NoResults", "No results for \"{0}\"", this.searchQuery);
            container.appendChild(empty);
            return;
        }

        const ss = this.settings.searchSettingsCard;

        // Contador: en una jerarquia grande, saber que hay 47 coincidencias
        // cambia como se lee el resultado.
        if (Boolean(ss.showResultCount?.value)) {
            const cnt = document.createElement("div");
            cnt.className = "csh-note";
            cnt.textContent = matches.length === 1
                ? this.t("UI_OneResult", "1 result")
                : this.tf("UI_NResults", "{0} results", String(matches.length));
            container.appendChild(cnt);
        }

        const resaltar = Boolean(ss.highlightMatches?.value) ? this.searchQuery : undefined;

        const row = document.createElement("div");
        row.style.cssText = `display:flex;flex-wrap:wrap;gap:${this.settings.chipSettingsCard.chipGap.value}px;`;
        for (const n of matches) row.appendChild(this.buildChipElement(n, isHC, layout, resaltar));
        container.appendChild(row);
    }

    // ─── CHIP TREE ────────────────────────────────────────────────────────────
    private renderNodes(
        nodes: HierarchyNode[],
        container: HTMLElement,
        isHC: boolean,
        layout: string,
        depth: number
    ): void {
        const s  = this.settings.chipSettingsCard;
        const hs = this.settings.hierarchySettingsCard;
        const indentSize   = hs.indentSize.value as number;
        const showSelectAll = Boolean(s.showSelectAll.value);

        if (layout === "vertical") {
            if (depth === 0 && showSelectAll) {
                container.appendChild(this.buildAllChip(isHC, "flex"));
            }
            for (const node of nodes) {
                const chip = this.buildChipElement(node, isHC, layout);
                if (depth > 0) {
                    chip.style.marginLeft = `${depth * indentSize}px`;
                    chip.style.width = `calc(100% - ${depth * indentSize}px)`;
                }
                container.appendChild(chip);
                if (node.isExpanded && node.children.length > 0) {
                    this.renderNodes(node.children, container, isHC, layout, depth + 1);
                }
            }
        } else {
            // Horizontal: siblings in one wrapping row, children below
            const row = document.createElement("div");
            row.style.cssText = `
                display:flex; flex-wrap:wrap;
                gap:${s.chipGap.value}px;
                margin-left:${depth * indentSize}px;
            `;
            if (depth === 0 && showSelectAll) {
                row.appendChild(this.buildAllChip(isHC, "inline-flex"));
            }
            for (const node of nodes) row.appendChild(this.buildChipElement(node, isHC, layout));
            container.appendChild(row);
            for (const node of nodes) {
                if (node.isExpanded && node.children.length > 0) {
                    this.renderNodes(node.children, container, isHC, layout, depth + 1);
                }
            }
        }
    }

    private buildAllChip(isHC: boolean, display: string): HTMLElement {
        const s = this.settings.chipSettingsCard;
        const anySelected = this.hierarchyManager.getSelectedNodes().length > 0;
        const allLabel = (s.selectAllLabel.value as string) || this.t("All", "All");

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "csh-chip csh-all";
        btn.dataset.key = Visual.ALL_KEY;
        btn.textContent = allLabel;
        btn.setAttribute("aria-pressed", String(!anySelected));
        btn.setAttribute("data-o", "chips");
        btn.style.cssText = this.buildChipStyle(isHC, !anySelected, false, 1);
        btn.style.display = display;
        if (display === "flex") {
            btn.style.width = "100%";
        }
        btn.addEventListener("click", async () => {
            if (this.formatMode || !this.interactionsAllowed()) return;
            this.focusKey = Visual.ALL_KEY;
            this.hierarchyManager.clearAll();
            await this.applyFilter();
            this.render();
        });
        return btn;
    }

    /**
     * Rango de la medida por nivel, para el mapa de calor.
     *
     * Se normaliza por nivel y no globalmente: un chip de nivel 1 agrega a todos
     * sus hijos, asi que compararlo con uno de nivel 3 pintaria la jerarquia
     * entera de oscuro arriba y claro abajo, que no dice nada.
     */
    private rangoPorNivel(): Map<number, { min: number; max: number }> {
        const out = new Map<number, { min: number; max: number }>();
        const visit = (nodes: HierarchyNode[]) => {
            for (const n of nodes) {
                if (typeof n.measureValue === "number" && !isNaN(n.measureValue)) {
                    const r = out.get(n.level);
                    if (!r) out.set(n.level, { min: n.measureValue, max: n.measureValue });
                    else {
                        if (n.measureValue < r.min) r.min = n.measureValue;
                        if (n.measureValue > r.max) r.max = n.measureValue;
                    }
                }
                visit(n.children);
            }
        };
        visit(this.hierarchyManager.roots);
        return out;
    }

    /** Interpola dos colores hex. t va de 0 a 1. */
    private mezclar(a: string, b: string, t: number): string {
        const hex = (c: string) => {
            const v = c.replace("#", "");
            const f = v.length === 3 ? v.split("").map(x => x + x).join("") : v;
            return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
        };
        const [r1, g1, b1] = hex(a);
        const [r2, g2, b2] = hex(b);
        const m = (x: number, y: number) => Math.round(x + (y - x) * Math.max(0, Math.min(1, t)));
        return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
    }

    /**
     * Texto legible sobre un fondo dado.
     *
     * Sin esto, un chip oscuro del extremo alto del rango se queda con el texto
     * oscuro por defecto y no se lee. Luminancia relativa.
     */
    private textoSobre(rgb: string): string {
        const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(rgb);
        if (!m) return "#1F2937";
        const canal = (v: number) => {
            const x = v / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        };
        const L = 0.2126 * canal(+m[1]) + 0.7152 * canal(+m[2]) + 0.0722 * canal(+m[3]);
        return L > 0.45 ? "#1F2937" : "#FFFFFF";
    }

    /**
     * El texto del chip con la coincidencia resaltada.
     *
     * Se construye con createElement y textContent, nunca con innerHTML: esto es
     * dato del usuario, y un visual hermano fue rechazado por XSS por
     * exactamente ese camino.
     */
    private etiquetaConCoincidencia(texto: string, q: string): DocumentFragment {
        const frag = document.createDocumentFragment();
        const i = q ? norm(texto).indexOf(norm(q)) : -1;
        if (i < 0) {
            frag.appendChild(document.createTextNode(texto));
            return frag;
        }
        if (i > 0) frag.appendChild(document.createTextNode(texto.slice(0, i)));
        const mark = document.createElement("span");
        mark.textContent = texto.slice(i, i + q.length);
        mark.style.cssText = "font-weight:700;text-decoration:underline;";
        frag.appendChild(mark);
        if (i + q.length < texto.length) {
            frag.appendChild(document.createTextNode(texto.slice(i + q.length)));
        }
        return frag;
    }

    private buildChipElement(node: HierarchyNode, isHC: boolean, layout: string, resaltar?: string): HTMLElement {
        const s  = this.settings.chipSettingsCard;
        const is = this.settings.imageSettingsCard;
        const hs = this.settings.hierarchySettingsCard;
        const leafOnly = Boolean(s.leafOnly?.value);

        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "csh-chip";
        chip.dataset.key = node.key;
        chip.setAttribute("aria-pressed", String(node.isSelected));
        chip.setAttribute("data-o", "chips");
        if (!node.isLeaf) chip.setAttribute("aria-expanded", String(node.isExpanded));
        chip.style.cssText = this.buildChipStyle(isHC, node.isSelected, node.isParentOfSelection, node.level);
        // Filter-in: cuando otro visual resalta, los chips que quedan fuera se atenuan.
        if (!node.inHighlight) chip.style.opacity = "0.35";

        // Mapa de calor (Pro): el fondo del chip segun su medida, normalizado
        // dentro de su nivel. No se aplica al chip seleccionado -su color activo
        // es lo que hace visible la seleccion- ni en alto contraste, donde el
        // significado no puede ir codificado en el relleno.
        if (this.rangoHeatmap && !isHC && !node.isSelected &&
            typeof node.measureValue === "number" && !isNaN(node.measureValue)) {
            const r = this.rangoHeatmap.get(node.level);
            if (r) {
                const t = r.max === r.min ? 0.5 : (node.measureValue - r.min) / (r.max - r.min);
                const hmS = this.settings.heatmapSettingsCard;
                const bg = this.mezclar(
                    hmS.colorLow.value?.value ?? "#EDE9DE",
                    hmS.colorHigh.value?.value ?? "#C96442",
                    t
                );
                chip.style.background = bg;
                chip.style.color = this.textoSobre(bg);
            }
        }

        if (layout === "vertical") {
            chip.style.display = "flex";
            chip.style.width = "100%";
        }

        if (leafOnly && !node.isLeaf) {
            chip.style.opacity = "0.7";
            chip.style.cursor = "default";
        }

        // Image — shown for any level that has an imageUrl
        const imgPos = (is?.imagePosition?.value as any)?.value ?? "left";
        const lbl = document.createElement("span");
        lbl.className = "csh-lbl";
        if (resaltar) lbl.appendChild(this.etiquetaConCoincidencia(node.value, resaltar));
        else lbl.textContent = node.value;
        if (node.imageUrl && isSafeImageUrl(node.imageUrl)) {
            const img = document.createElement("img");
            img.src = node.imageUrl; // safe: validated as data:image/* URI
            img.alt = "";
            img.style.cssText = `height:${is.imageHeight.value}px;border-radius:${is.imageRadius.value}px;object-fit:cover;flex-shrink:0;`;
            img.onerror = () => { img.style.display = "none"; };
            if (imgPos === "above") {
                chip.style.flexDirection = "column";
                chip.style.alignItems = "center";
                chip.style.height = "auto";
                chip.style.padding = `4px ${s.chipPaddingH.value}px`;
            } else {
                chip.style.flexDirection = "row";
                chip.style.alignItems = "center";
                chip.style.gap = "6px";
            }
            chip.appendChild(img);
        }
        chip.appendChild(lbl);

        // Value badge — shown between the label and the expand icon
        const vs = this.settings?.valueSettingsCard;
        let badgeText = "";
        if (vs && Boolean(vs.showValue?.value) && node.measureValue !== null && node.measureValue !== undefined) {
            const fmt     = (vs.valueFormat?.value as any)?.value ?? "compact";
            const badgeBg = isHC ? "ButtonFace" : (vs.valueBg.value?.value ?? "#E5E7EB");
            const badgeFg = isHC ? "ButtonText" : (vs.valueText.value?.value ?? "#374151");
            const badge   = document.createElement("span");
            badge.className = "csh-badge";
            badge.setAttribute("data-o", "badge");
            badgeText = this.formatMeasure(node.measureValue, fmt, node.formatString);
            badge.textContent = badgeText;
            badge.style.cssText = `
                background:${badgeBg}; color:${badgeFg};
                font-size:${vs.valueFontSize.value}px;
                border-radius:${vs.valueRadius.value}px;
                padding:0 ${vs.valuePaddingH.value}px;
            `;
            chip.appendChild(badge);
        }
        chip.setAttribute("aria-label", badgeText ? `${node.value}, ${badgeText}` : node.value);

        // Expand icon for non-leaf — click expands/collapses only, does NOT trigger selection
        if (!node.isLeaf && Boolean(hs.expandIcon.value)) {
            const icon = document.createElement("span");
            icon.className = "csh-exp";
            icon.textContent = node.isExpanded ? "▲" : "▼";
            icon.setAttribute("aria-hidden", "true");
            icon.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation(); // prevent chip body click from also firing
                if (this.formatMode) return;
                this.focusKey = node.key;
                this.hierarchyManager.toggleExpand(node.key, Boolean(this.settings.hierarchySettingsCard.autoCollapse.value));
                this.renderChipMode(); // no applyFilter — expand state is not persisted via PBI filter
            });
            chip.appendChild(icon);
        }

        this.attachTooltip(chip, node);

        // Chip body click — selection only; always reads CURRENT settings
        chip.addEventListener("click", async (e: MouseEvent) => {
            // Power BI lo pone a false al exportar y en algunos modos de lectura:
            // seleccionar entonces cambia el informe a espaldas del usuario.
            if (this.formatMode || !this.interactionsAllowed()) return;
            e.stopPropagation();
            this.focusKey = node.key;
            const cs = this.settings.chipSettingsCard;
            const multiSelect = Boolean(cs.multiSelect.value) || e.ctrlKey || e.metaKey;
            this.hierarchyManager.toggleSelect(node.key, multiSelect, Boolean(cs.leafOnly?.value));
            await this.applyFilter();
            // En el desplegable, una selección simple de una hoja lo cierra, como un desplegable nativo.
            if (this.popupOn() && !multiSelect && node.isLeaf) this.popupOpen = false;
            this.renderChipMode();
        });

        chip.addEventListener("contextmenu", (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.formatMode) return;
            this.selectionManager.showContextMenu(null as any, { x: e.clientX, y: e.clientY });
        });

        return chip;
    }

    /**
     * Teclado: una parada de Tab. Flechas Abajo/Arriba y Home/End se mueven entre chips; Derecha abre un chip con hijos
     * (o avanza) e Izquierda lo cierra (o retrocede); Enter/Espacio selecciona (Ctrl añade); Escape limpia o cierra el
     * desplegable; Mayús+F10 abre el menú contextual.
     */
    private onKeyDown(e: KeyboardEvent): void {
        const cur = (e.target as HTMLElement)?.closest?.(".csh-chip") as HTMLElement;
        if (e.key === "Escape") {
            if (this.popupOn() && this.popupOpen) {
                e.preventDefault();
                this.popupOpen = false;
                this.renderChipMode();
                (this.target.querySelector(".csh-bar") as HTMLElement)?.focus();
                return;
            }
            if (cur && this.hierarchyManager.getSelectedNodes().length && this.interactionsAllowed() && !this.formatMode) {
                e.preventDefault();
                this.hierarchyManager.clearAll();
                void this.applyFilter().then(() => this.renderChipMode());
            }
            return;
        }
        if (!cur) return;
        const chips = Array.from(this.target.querySelectorAll<HTMLElement>(".csh-chip"));
        const idx = chips.indexOf(cur);
        const node = this.hierarchyManager.getNode(cur.dataset.key ?? "");
        let next = -1;
        switch (e.key) {
            case "ArrowDown": next = Math.min(idx + 1, chips.length - 1); break;
            case "ArrowUp":
                if (idx === 0) {
                    const inp = this.target.querySelector(".csh-search input") as HTMLElement;
                    if (inp) { e.preventDefault(); inp.focus(); return; }
                }
                next = Math.max(idx - 1, 0);
                break;
            case "ArrowRight":
                if (node && !node.isLeaf && !node.isExpanded) {
                    e.preventDefault();
                    this.focusKey = node.key;
                    this.hierarchyManager.toggleExpand(node.key, Boolean(this.settings.hierarchySettingsCard.autoCollapse.value));
                    this.renderChipMode();
                    return;
                }
                next = Math.min(idx + 1, chips.length - 1);
                break;
            case "ArrowLeft":
                if (node && !node.isLeaf && node.isExpanded) {
                    e.preventDefault();
                    this.focusKey = node.key;
                    this.hierarchyManager.toggleExpand(node.key, false);
                    this.renderChipMode();
                    return;
                }
                next = Math.max(idx - 1, 0);
                break;
            case "Home": next = 0; break;
            case "End": next = chips.length - 1; break;
            case "Enter":
            case " ":
                e.preventDefault();
                cur.dispatchEvent(new MouseEvent("click", { bubbles: true, ctrlKey: e.ctrlKey, metaKey: e.metaKey }));
                return;
            case "ContextMenu":
            case "F10": {
                if (e.key === "F10" && !e.shiftKey) return;
                e.preventDefault();
                const r = cur.getBoundingClientRect();
                this.selectionManager.showContextMenu(null as any, { x: r.left, y: r.bottom });
                return;
            }
            default:
                return;
        }
        e.preventDefault();
        if (next >= 0 && next !== idx) {
            cur.tabIndex = -1;
            chips[next].tabIndex = 0;
            chips[next].focus();
            this.focusKey = chips[next].dataset.key ?? null;
        }
    }

    private buildTooltipItems(node: HierarchyNode): any[] {
        const items: any[] = [];

        // Breadcrumb path
        if (node.parentKey) {
            let pk: string | null = node.parentKey;
            const path: string[] = [];
            while (pk) {
                const p = this.hierarchyManager.getNode(pk);
                if (p) { path.unshift(p.value); pk = p.parentKey; } else break;
            }
            if (path.length > 0) items.push({ displayName: this.t("UI_Path", "Path"), value: path.join(" › ") });
        }

        // Node label
        items.push({ displayName: node.source?.displayName ?? "Value", value: node.value });

        // Measure value — shown when the option is on (badge doesn't need to be visible)
        const vs = this.settings?.valueSettingsCard;
        if (vs && Boolean(vs.showInTooltip?.value) &&
            node.measureValue !== null && node.measureValue !== undefined) {
            const fmt = (vs.valueFormat?.value as any)?.value ?? "compact";
            items.push({ displayName: this.measureDisplayName || "Value",
                         value: this.formatMeasure(node.measureValue, fmt, node.formatString) });
        }

        // Extra tooltip fields (Tooltips bucket)
        for (const tf of node.tooltipFields) {
            items.push({ displayName: tf.name, value: tf.value });
        }

        return items;
    }

    private attachTooltip(el: HTMLElement, node: HierarchyNode): void {
        // mouseenter fires ONCE per chip entry — do the (relatively) expensive item build
        // and the full show() call here only. mousemove just repositions it: calling show()
        // on every mousemove floods the host bridge and can freeze Power BI Desktop.
        el.addEventListener("mouseenter", (event: MouseEvent) => {
            if (this.formatMode) return;
            this.host.tooltipService.show({
                dataItems: this.buildTooltipItems(node), identities: [],
                coordinates: [event.clientX, event.clientY], isTouchEvent: false
            });
        });
        el.addEventListener("mousemove", (event: MouseEvent) => {
            if (this.formatMode) return;
            this.host.tooltipService.move({
                dataItems: [], identities: [],
                coordinates: [event.clientX, event.clientY], isTouchEvent: false
            });
        });
        el.addEventListener("mouseleave", () => {
            this.host.tooltipService.hide({ immediately: false, isTouchEvent: false });
        });
    }

    private buildChipStyle(isHC: boolean, isActive: boolean, isParent: boolean, level: number): string {
        const s  = this.settings.chipSettingsCard;
        const h  = s.chipHeight.value as number;
        const r  = s.chipRadius.value as number;
        const fs = s.fontSize.value as number;
        const ph = s.chipPaddingH.value as number;

        let bg: string, border: string, text: string;

        if (isHC) {
            bg     = isActive ? "Highlight" : "ButtonFace";
            border = "ButtonText";
            text   = isActive ? "HighlightText" : "ButtonText";
        } else {
            const colors = level === 2 ? this.settings.level2ColorsCard
                         : level === 3 ? this.settings.level3ColorsCard
                         : this.settings.level1ColorsCard;
            if (isActive) {
                bg     = colors.activeBg.value?.value     ?? "#378ADD";
                border = colors.activeBorder.value?.value ?? "#378ADD";
                text   = colors.activeText.value?.value   ?? "#FFFFFF";
            } else if (isParent) {
                const cX: any = level === 2 ? this.settings.level2ColorsCard : this.settings.level1ColorsCard;
                bg     = cX.parentBg?.value?.value     ?? "#D6EBFA";
                border = cX.parentBorder?.value?.value  ?? "#378ADD";
                text   = cX.parentText?.value?.value    ?? "#1A5FA8";
            } else {
                bg     = colors.defaultBg.value?.value     ?? "#F3F4F6";
                border = colors.defaultBorder.value?.value ?? "#E5E7EB";
                text   = colors.defaultText.value?.value   ?? "#374151";
            }
        }

        return `
            display:inline-flex; align-items:center; justify-content:flex-start;
            height:${h}px; min-height:${h}px;
            border-radius:${r}px;
            font-size:${fs}px;
            font-family:inherit;
            padding:0 ${ph}px;
            background:${bg};
            border:1.5px solid ${border};
            color:${text};
            cursor:pointer;
            white-space:nowrap;
            box-sizing:border-box;
            max-width:100%;
            box-shadow:${isActive ? `0 0 0 1px ${border}` : "none"};
            transition:opacity 0.1s;
        `;
    }

    // ─── VALUE FORMAT ─────────────────────────────────────────────────────────
    private formatMeasure(value: number, fmt: string, formatString?: string): string {
        const abs = Math.abs(value);
        switch (fmt) {
            case "model": {
                // El formato de la medida en el modelo, dinámico si el DAX lo decide, y el idioma del informe.
                const f = formatString || this.measureColumnFormat;
                try { return this.formatter(f || "#,0.##").format(value); } catch { return String(value); }
            }
            case "number":
                return value.toLocaleString(this.host.locale || undefined);
            case "currency":
                return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            case "percent": {
                const total = this.hierarchyManager.getMeasureTotal();
                if (!total) return "0.0%";
                return (value / total * 100).toFixed(1) + "%";
            }
            case "compact":
            default:
                if (abs >= 1e9) return (value / 1e9).toFixed(1) + "B";
                if (abs >= 1e6) return (value / 1e6).toFixed(1) + "M";
                if (abs >= 1e3) return (value / 1e3).toFixed(1) + "K";
                return value.toFixed(0);
        }
    }

    /** ✕ que limpia la selección (y el buscador). El texto del ajuste "Reset button label" es su nombre accesible. */
    private buildResetButton(isHC: boolean): HTMLElement {
        const hs = this.settings.hierarchySettingsCard;
        const label  = (hs.resetLabel.value as string) || this.t("UI_Clear", "Clear selection");
        const pal: any = this.host.colorPalette;
        const fgHC = pal?.foreground?.value ?? "#FFFFFF";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "csh-clear";
        btn.textContent = "✕";
        btn.title = label;
        btn.setAttribute("aria-label", label);
        btn.setAttribute("data-o", "reset");
        btn.disabled = this.hierarchyManager.getSelectedNodes().length === 0 && !this.searchQuery;
        if (isHC) {
            Object.assign(btn.style, { color: fgHC, borderColor: fgHC, background: "transparent" });
        } else {
            Object.assign(btn.style, {
                color: hs.resetText.value?.value ?? "#605E5C",
                borderColor: hs.resetBorder.value?.value ?? "#C8C6C4",
                background: hs.resetBg.value?.value ?? "transparent"
            });
        }
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (this.formatMode || !this.interactionsAllowed()) return;
            this.searchQuery = "";
            this.hierarchyManager.clearAll();
            await this.applyFilter();
            this.renderChipMode();
        });
        return btn;
    }

    // ─── GUÍA (consejos de configuración, solo editando) ──────────────────────
    /**
     * Barra de consejos abajo, solo editando, con datos y si cabe: plantillas en un clic y las tres funciones Pro para
     * probarlas con tus datos (sin licencia, bajo la marca de agua). persistProperties solo desde un clic. ✕ la cierra
     * (style.guide = false); se reabre en Formato → Plantilla de estilo.
     */
    private renderGuide(isHC: boolean): void {
        if (!this.editando || this.formatMode || !this.settings.styleCard.guide.value || !this.interactionsAllowed()) return;
        const vp = this.lastViewport;
        if (!vp || vp.width < 320 || vp.height < 170) return;
        if (this.popupOn() && !this.popupOpen) return;
        const pal: any = this.host.colorPalette;
        const azul = isHC ? (pal.foregroundSelected?.value || "#FFFF00") : "#2B6CB0";
        const fg = isHC ? (pal.foreground?.value || "#FFF") : "";
        const g = document.createElement("div");
        g.className = "csh-guide";
        g.setAttribute("role", "region");
        g.setAttribute("aria-label", this.t("Guide_Title", "Setup tips"));
        if (isHC) Object.assign(g.style, { background: pal.background?.value || "#000", color: fg, borderColor: azul });
        g.onclick = e => e.stopPropagation();
        g.onkeydown = e => e.stopPropagation();
        const fila = (titulo: string) => {
            const f = document.createElement("div");
            f.className = "csh-g-row";
            const l = document.createElement("span");
            l.className = "csh-g-lbl";
            l.textContent = titulo;
            f.appendChild(l);
            g.appendChild(f);
            return f;
        };
        const boton = (f: HTMLElement, texto: string, on: boolean, accion: () => void) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "csh-g-btn";
            b.textContent = texto;
            b.setAttribute("aria-pressed", String(on));
            b.style.borderColor = azul;
            if (on) { b.style.background = azul; b.style.color = isHC ? (pal.background?.value || "#000") : "#FFFFFF"; } else b.style.color = azul;
            b.addEventListener("click", accion);
            f.appendChild(b);
        };
        const f1 = fila(this.t("Guide_TryStyle", "Try a style:"));
        const actual = String((this.settings.styleCard.template.value as any)?.value ?? "classic");
        ([["classic", "Classic"], ["outline", "Outline"], ["soft", "Soft"], ["square", "Square"], ["mono", "One colour"], ["dark", "Dark"]] as [string, string][])
            .forEach(([v, d]) => boton(f1, this.t("Enum_" + v, d), v === actual, () => this.persistir("style", { template: v })));
        const objs: any = this.dataView?.metadata?.objects ?? {};
        const f2 = fila(this.isPro ? this.t("Guide_ProOn", "Pro:") : this.t("Guide_TryPro", "Try Pro:"));
        const hayMedida = !!this.measureDisplayName;
        const pro: [string, string, string][] = [
            ["searchSettings", "showSearch", this.t("Guide_Search", "Search")],
            ["popup", "show", this.t("Guide_Popup", "Drop-down")],
        ];
        if (hayMedida) pro.push(["heatmapSettings", "showHeatmap", this.t("Guide_Heatmap", "Colour by value")]);
        pro.forEach(([obj, prop, texto]) => {
            const on = objs?.[obj]?.[prop] === true;
            boton(f2, texto, on, () => this.persistir(obj, { [prop]: !on }));
        });
        const x = document.createElement("button");
        x.type = "button";
        x.className = "csh-g-close";
        x.textContent = "✕";
        x.title = this.t("Guide_Close", "Hide tips (Format → Style template)");
        x.setAttribute("aria-label", x.title);
        if (isHC) x.style.color = fg;
        x.addEventListener("click", () => this.persistir("style", { guide: false }));
        g.appendChild(x);
        this.target.appendChild(g);
    }

    // ─── FILTER ───────────────────────────────────────────────────────────────
    private async applyFilter(): Promise<void> {
        // El proximo update trae el filtro que estamos a punto de aplicar. Sin
        // esta marca lo confundiriamos con un cambio externo y restauraríamos
        // la seleccion anterior, deshaciendo el clic del usuario.
        this.pendingSelfFilter = true;
        this.pendingSince = Date.now();
        const selected = this.hierarchyManager.getSelectedNodes();
        if (!this.dataView) return;

        if (selected.length === 0) {
            await this.host.applyJsonFilter(null as any, "general", "filter", powerbi.FilterAction.remove);
            return;
        }

        // Group selected nodes by level; keep the source column reference from the node itself
        const byLevel: Map<number, { values: powerbi.PrimitiveValue[], source: powerbi.DataViewMetadataColumn }> = new Map();
        for (const n of selected) {
            if (!byLevel.has(n.level)) byLevel.set(n.level, { values: [], source: n.source });
            byLevel.get(n.level)!.values.push(n.rawValue);
        }

        // Apply filter for the deepest level with selections
        const primaryLevel = Math.max(...Array.from(byLevel.keys()));
        const entry = byLevel.get(primaryLevel)!;

        /* eslint-disable powerbi-visuals/no-http-string */
        const filter: any = {
            $schema: "http://powerbi.com/product/schema#basic", // required literal value of the IBasicFilter schema identifier, not a network call
            /* eslint-enable powerbi-visuals/no-http-string */
            target: filterTarget(entry.source),
            filterType: 1,
            operator: "In",
            // Valores con su tipo original: "08001" sigue siendo texto y las fechas, fechas.
            values: entry.values.map(v => v instanceof Date ? v.toJSON() : v),
            requireSingleSelection: false
        };

        await this.host.applyJsonFilter(filter, "general", "filter", powerbi.FilterAction.merge);
    }

    private parseFilter(filter: any): Map<number, Set<string>> {
        const result: Map<number, Set<string>> = new Map();
        if (filter?.values && Array.isArray(filter.values)) {
            const cats = this.dataView?.categorical?.categories;
            let level = 1;
            if (cats) {
                let catIndex = 0; // counts only "categories" role columns (not images)
                for (const cat of cats) {
                    const roles = cat.source.roles as Record<string, boolean>;
                    if (!roles["categories"]) continue; // skip image columns
                    catIndex++;
                    if (sameTarget(filterTarget(cat.source), filter.target)) {
                        level = catIndex; // position in categories role = level number
                        break;
                    }
                }
            }
            result.set(level, new Set<string>(filter.values.map((v: any) => valueKey(v))));
        }
        return result;
    }

    // ─── ON-OBJECT ────────────────────────────────────────────────────────────

    /** Pieza → [tarjeta, clave del nombre, nombre en inglés]. */
    private static readonly SUB: Record<string, [string, string, string]> = {
        chips: ["chipSettings", "card_chipSettings", "Chip Style"],
        badge: ["valueSettings", "card_valueSettings", "Value Badge"],
        reset: ["hierarchySettings", "card_hierarchySettings", "Hierarchy"],
        search: ["searchSettings", "card_searchSettings", "Search (Pro)"],
        popup: ["popup", "card_popup", "Drop-down (Pro)"],
    };

    /** Marca lo que se puede elegir en modo formato. Fuera de él, no deja rastro. */
    private markSubSelectables(): void {
        this.target.querySelectorAll("[data-o]").forEach(el => {
            if (!this.formatMode) { el.classList.remove(HtmlSubSelectableClass); return; }
            const o = el.getAttribute("data-o");
            const info = Visual.SUB[o];
            if (!info) return;
            el.classList.add(HtmlSubSelectableClass);
            el.setAttribute(SubSelectableObjectNameAttribute, o);
            el.setAttribute(SubSelectableDisplayNameAttribute, this.t(info[1], info[2]));
            el.setAttribute(SubSelectableTypeAttribute, String(powerbi.visuals.SubSelectionStylesType.Text));
        });
    }

    private getSubSelectionStyles(subs: powerbi.visuals.CustomVisualSubSelection[]): powerbi.visuals.SubSelectionStyles | undefined {
        const o = subs[0]?.customVisualObjects[0]?.objectName;
        const ref = (obj: string, prop: string, key: string, def: string) => ({ reference: { objectName: obj, propertyName: prop }, label: this.t(key, def) });
        const Text = powerbi.visuals.SubSelectionStylesType.Text;
        switch (o) {
            case "chips": return { type: Text, fontSize: ref("chipSettings", "fontSize", "fontSize", "Font size"),
                fontFamily: ref("chipSettings", "fontFamily", "fontFamily", "Font"),
                fontColor: ref("level1Colors", "defaultText", "defaultText", "Inactive text"),
                background: ref("level1Colors", "defaultBg", "defaultBg", "Inactive background") } as any;
            case "badge": return { type: Text, fontSize: ref("valueSettings", "valueFontSize", "badgeFontSize", "Font size (px)"),
                fontColor: ref("valueSettings", "valueText", "badgeText", "Text color"),
                background: ref("valueSettings", "valueBg", "badgeBg", "Background") } as any;
            case "reset": return { type: Text, fontColor: ref("hierarchySettings", "resetText", "resetText", "Reset button text"),
                background: ref("hierarchySettings", "resetBg", "resetBg", "Reset button background") } as any;
            case "search": return { type: Text, fontColor: ref("searchSettings", "searchText", "badgeText", "Text color"),
                background: ref("searchSettings", "searchBg", "badgeBg", "Background") } as any;
            case "popup": return { type: Text } as any;
        }
        return undefined;
    }

    private getSubSelectionShortcuts(subs: powerbi.visuals.CustomVisualSubSelection[]): powerbi.visuals.VisualSubSelectionShortcuts | undefined {
        const o = subs[0]?.customVisualObjects[0]?.objectName;
        const info = Visual.SUB[o];
        if (!info) return undefined;
        const id = (obj: string, prop: string) => ({ objectName: obj, propertyName: prop });
        const toggle = (obj: string, prop: string, key: string, def: string) => ({ type: powerbi.visuals.VisualShortcutType.Toggle, ...id(obj, prop),
            relatedToggledFormattingIds: [id(obj, prop)], disabledLabel: this.t(key, def), enabledLabel: this.t(key, def) });
        const reset = (obj: string, props: string[]) => ({ type: powerbi.visuals.VisualShortcutType.Reset, relatedResetFormattingIds: props.map(p => id(obj, p)) });
        // FormattingSettingsService forma el uid "<objeto>-card" y Power BI lo publica como "Visual-<objeto>-card"
        // (comprobado en KPI Card 2.2): el atajo tiene que usar el segundo.
        const nav = { type: powerbi.visuals.VisualShortcutType.Navigate, destinationInfo: { cardUid: "Visual-" + info[0] + "-card" }, label: this.t(info[1], info[2]) };
        const div = { type: powerbi.visuals.VisualShortcutType.Divider };
        const colores = ["defaultBg", "defaultBorder", "defaultText", "activeBg", "activeBorder", "activeText"];
        switch (o) {
            case "chips":
                return [{ type: powerbi.visuals.VisualShortcutType.Picker, ...id("chipSettings", "layout"), label: this.t("layout", "Layout") },
                    toggle("chipSettings", "multiSelect", "multiSelect", "Multi-select"),
                    toggle("chipSettings", "leafOnly", "leafOnly", "Leaf-only selection"),
                    toggle("chipSettings", "showSelectAll", "showSelectAll", "Show 'All' button"), div,
                    reset("level1Colors", colores), nav] as any;
            case "badge":
                return [{ type: powerbi.visuals.VisualShortcutType.Picker, ...id("valueSettings", "valueFormat"), label: this.t("badgeFormat", "Format") },
                    toggle("valueSettings", "showValue", "showBadge", "Show value badge"), div,
                    reset("valueSettings", ["valueBg", "valueText", "valueFontSize"]), nav] as any;
            case "reset":
                return [toggle("hierarchySettings", "showReset", "showReset", "Show reset button"), div,
                    reset("hierarchySettings", ["resetBg", "resetBorder", "resetText"]), nav] as any;
            case "search":
                return [toggle("searchSettings", "showSearch", "showSearch", "Show search box (Pro)"), div, nav] as any;
            case "popup":
                return [toggle("popup", "show", "popup_show", "Drop-down mode (Pro)"), div, nav] as any;
        }
        return undefined;
    }

    // ─── FORMATTING MODEL ─────────────────────────────────────────────────────
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        const s = this.settings ?? new VisualSettingsModel();
        const ds = (s.chipSettingsCard.defaultSelection.value as any)?.value;
        s.chipSettingsCard.defaultValues.visible = ds === "values";
        s.chipSettingsCard.selectAllLabel.visible = !!s.chipSettingsCard.showSelectAll.value;
        return this.formattingSettingsService.buildFormattingModel(s);
    }
}
