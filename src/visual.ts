"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualSettingsModel } from "./settings";

import LicenseNotificationType = powerbi.LicenseNotificationType;

/** El Service ID del plan en Partner Center. Debe coincidir caracter a caracter. */
const PLAN_ID = "chip-slicer-hierarchy-tcviz";

// Microsoft: "only the active and warning states represent a usable license".
const enum ServicePlanState { Inactive = 0, Active = 1, Warning = 2 }

// ─────────────────────────────────────────────────────────────────────────────
// Security — image URL sanitization (AppSource certification requirement)
// Only data: URIs with an image/* MIME type are allowed.
// External URLs (http://, https://, blob:, etc.) are rejected to prevent
// unauthorized outbound HTTP requests and CSP violations.
// ─────────────────────────────────────────────────────────────────────────────
function isSafeImageUrl(url: string): boolean {
    return /^data:image\/[a-z+.-]+;base64,/i.test(url);
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
        measureValues?: powerbi.PrimitiveValue[],
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
                const val = raw == null ? "" : String(raw);
                if (hideBlank && val === "") break; // stop the path at a blank value

                const level  = lvl + 1;
                const key    = parentKey ? `L${level}::${parentKey}::${val}` : `L${level}::${val}`;
                const isLast = lvl === catCols.length - 1;

                // Image URL for this level (matched by position in imgCols)
                let imageUrl: string | null = null;
                if (imgCols[lvl]) {
                    const imgVal = imgCols[lvl].values[i];
                    if (imgVal != null && String(imgVal) !== "") {
                        const raw = String(imgVal);
                        imageUrl = isSafeImageUrl(raw) ? raw : null;
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
                        measureValue: null, tooltipFields: []
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
            n.isSelected = levelVals ? levelVals.has(String(n.rawValue)) : false;
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
    private searchQuery: string = "";
    private hasInitializedTree: boolean = false;
    /** True mientras esperamos el update que confirma un filtro aplicado por nosotros. */
    private pendingSelfFilter: boolean = false;
    private measureDisplayName: string = "";

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();
        this.settings = new VisualSettingsModel();
        this.licenseManager = (options.host as any).licenseManager;
        this.target.style.overflow = "auto";
        this.target.style.boxSizing = "border-box";

        // Empty-space context menu (required by AppSource certification)
        this.target.addEventListener("contextmenu", (e: MouseEvent) => {
            e.preventDefault();
            this.selectionManager.showContextMenu(null as any, { x: e.clientX, y: e.clientY });
        });
    }

    async update(options: VisualUpdateOptions): Promise<void> {
        this.host.eventService.renderingStarted(options);
        try {
            await this._update(options);
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
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
            ["searchSettings",  "showSearch",  "the search box"],
            ["heatmapSettings", "showHeatmap", "colouring chips by value"],
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

    /** Retira el aviso: la licencia resolvio, o el usuario quito los ajustes Pro. */
    private clearLicenseNotice(): void {
        this.lastBlockedNotice = "";
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

        // El icono cubre el estado -una prueba caducada, donde el usuario no
        // toca nada y la busqueda desaparece sola-. Power BI solo lo aplica en
        // modo edicion, asi que quien lee el informe no ve nada.
        if (!this.licenseIconShown) {
            this.licenseIconShown = true;
            try {
                // const enum: TypeScript lo inlinea a 0. Referenciar el objeto
                // del enum en runtime daria undefined.
                this.licenseManager?.notifyLicenseRequired?.(LicenseNotificationType.General);
            } catch { /* best-effort */ }
        }

        // El banner cubre la accion, y solo cuando hay una nueva: update() corre
        // tambien al redimensionar y al refrescar datos.
        if (signature === this.lastBlockedNotice) return;
        this.lastBlockedNotice = signature;

        try {
            const lista = labels.length === 1
                ? labels[0]
                : labels.slice(0, -1).join(", ") + " and " + labels[labels.length - 1];
            this.licenseManager?.notifyFeatureBlocked?.(
                `ChipSlicer Hierarchy: ${lista} ${labels.length === 1 ? "is" : "are"} part of ` +
                `the Pro plan. Get a licence to enable ${labels.length === 1 ? "it" : "them"}.`
            );
        } catch { /* la notificacion nunca debe romper el render */ }
    }

    private async _update(options: VisualUpdateOptions): Promise<void> {
        // License check // ISPRO_BLOCK_START
        try {
            const licenseResult = await this.licenseManager?.getAvailableServicePlans();

            // spIdentifier: sin esto valia CUALQUIER plan activo del usuario, no el
            // de este visual. Hoy no hace dano porque la oferta tiene un solo plan,
            // pero deja de ser cierto en cuanto se anada un segundo.
            //
            // Warning es periodo de gracia por un problema de pago: la licencia
            // sigue siendo usable y un cliente que paga no debe perder sus features.
            this.isPro = licenseResult?.plans?.some(
                (p: any) => p.spIdentifier === PLAN_ID &&
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
        if (!dv) { this.showLanding(); return; }

        this.dataView = dv;
        this.settings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualSettingsModel, dv
        );

        const s = this.settings.chipSettingsCard;

        // Extract measure column (values role) — bound in categorical.values so
        // Power BI actually aggregates it (SUM/COUNT/etc.) instead of treating it
        // as a dimension. Values are row-aligned with dv.categorical.categories.
        let measureValues: powerbi.PrimitiveValue[] | undefined;
        let highlightValues: powerbi.PrimitiveValue[] | undefined;
        this.measureDisplayName = "";
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
                } else if (roles && roles["tooltips"]) {
                    tooltipMeasureCols.push({ name: val.source.displayName, values: val.values as powerbi.PrimitiveValue[] });
                }
            }
        }

        this.hierarchyManager.buildTree(dv, Boolean(s.hideBlank.value), measureValues, tooltipMeasureCols, highlightValues);

        // Restore filter state — only on first load (report open / bookmark restore).
        // After that, buildTree already saves/restores selectedKeys from in-memory nodeMap
        // so we don't risk overwriting selections with a mis-parsed filter.
        const existingFilter = dv.metadata?.objects?.["general"]?.["filter"] as any;

        if (this.pendingSelfFilter) {
            // Es el eco de nuestro propio filtro: no hay nada que restaurar.
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
            // Bookmarks.
            //
            // Antes esto solo corria en la primera carga, asi que aplicar un
            // bookmark despues no restauraba nada: los chips seguian mostrando la
            // seleccion anterior mientras el informe estaba filtrado por otra. Y
            // limpiar los filtros desde fuera dejaba chips marcados sin filtro
            // detras.
            //
            // Se compara lo que Power BI tiene con lo que pintamos, y solo se
            // toca cuando divergen. El eco de nuestro propio filtro ya se ha
            // descartado arriba, asi que una divergencia aqui viene de fuera.
            try {
                const filterValues = existingFilter
                    ? this.parseFilter(existingFilter)
                    : new Map<number, Set<string>>();
                const enFiltro = new Set<string>();
                filterValues.forEach((vals, lvl) => vals.forEach(v => enFiltro.add(lvl + "|" + v)));
                const enPantalla = new Set(
                    this.hierarchyManager.getSelectedNodes().map(n => n.level + "|" + String(n.rawValue))
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
        if (this.hierarchyManager.applyDefaultSelection(defaultSel)) {
            await this.applyFilter();
            return;
        }

        // La licencia ya esta resuelta y los ajustes poblados: es el momento de
        // decir algo si el usuario ha pedido una feature de pago.
        this.notifyProFeatureBlocked();

        this.render();
    }

    private showLanding(): void {
        // Con DOM y no con innerHTML. El contenido es estatico, asi que era
        // inofensivo, pero obligaba a suprimir powerbi-visuals/no-inner-outer-html
        // — y una supresion de esa regla es una senal de alarma para quien revisa,
        // mas aun en un visual que ya fue rechazado por XSS una vez.
        this.vaciar(this.target);
        const box = document.createElement("div");
        box.style.cssText = "display:flex;align-items:center;justify-content:center;" +
            "height:100%;color:#9CA3AF;font-family:sans-serif;font-size:13px;" +
            "text-align:center;padding:12px;";
        box.textContent = "Add data fields to Level 1 to start filtering.";
        this.target.appendChild(box);
    }

    /** Vacia un elemento sin pasar por innerHTML. */
    private vaciar(el: HTMLElement): void {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    private render(): void { this.renderChipMode(); }

    // ─── MAIN RENDER ──────────────────────────────────────────────────────────
    /** Rango por nivel, recalculado una vez por render y no por chip. */
    private rangoHeatmap: Map<number, { min: number; max: number }> | null = null;

    private renderChipMode(): void {
        const hm = this.settings?.heatmapSettingsCard;
        this.rangoHeatmap = (this.isPro && hm && Boolean(hm.showHeatmap.value))
            ? this.rangoPorNivel()
            : null;
        // Capture focus before any DOM mutation
        const searchWasFocused = !!(document.activeElement &&
            this.target.contains(document.activeElement) &&
            (document.activeElement as HTMLElement).tagName === "INPUT");

        const scrollTop = this.target.scrollTop;
        const isHC   = this.host.colorPalette.isHighContrast;
        const s      = this.settings.chipSettingsCard;
        const hs     = this.settings.hierarchySettingsCard;
        const ss     = this.settings.searchSettingsCard;
        const layout = (s.layout?.value as any)?.value ?? "horizontal";

        this.target.style.overflow = "auto";

        const wrapper = document.createElement("div");
        wrapper.style.cssText = `
            display:flex; flex-direction:column; gap:6px; width:100%; height:100%;
            overflow:auto; box-sizing:border-box; padding:4px;
            font-family:${isHC ? "system-ui" : "sans-serif"};
        `;

        if (Boolean(ss.showSearch.value)) {
            if (this.isPro) {
                wrapper.appendChild(this.buildSearchBox(isHC));
            }
            // Sin licencia no se dibuja nada aqui. Antes habia un "Search requires
            // Pro" en gris: UI de licencia propia, que la guia de Microsoft
            // desaconseja, y ademas un callejon sin salida sin nada que pulsar.
            // Ahora lo cubre notifyProFeatureBlocked, que si lleva a la compra.
        }

        if (Boolean(hs.showReset.value)) {
            wrapper.appendChild(this.buildResetButton(isHC));
        }

        const chipContainer = document.createElement("div");
        chipContainer.style.cssText = `display:flex;flex-direction:column;gap:${s.chipGap.value}px;`;
        if (this.searchQuery && this.isPro) {
            this.renderSearchResults(chipContainer, isHC, layout);
        } else {
            this.renderNodes(this.hierarchyManager.roots, chipContainer, isHC, layout, 0);
        }
        wrapper.appendChild(chipContainer);

        this.vaciar(this.target);
        this.target.appendChild(wrapper);
        this.target.scrollTop = scrollTop;

        if (searchWasFocused) {
            const inp = this.target.querySelector("input") as HTMLInputElement;
            if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        }
    }

    // ─── SEARCH BOX ───────────────────────────────────────────────────────────
    private buildSearchBox(isHC: boolean): HTMLElement {
        const ss = this.settings.searchSettingsCard;
        const wrap = document.createElement("div");
        wrap.style.cssText = "position:relative;display:flex;align-items:center;margin-bottom:4px;";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = (ss.searchPlaceholder.value as string) || "Search…";
        input.value = this.searchQuery;
        input.style.cssText = `
            width:100%; padding:6px 28px 6px 10px; border-radius:6px; box-sizing:border-box;
            border:1px solid ${isHC ? "ButtonText" : (ss.searchBorder.value?.value ?? "#D1D5DB")};
            background:${isHC ? "ButtonFace" : (ss.searchBg.value?.value ?? "#FFFFFF")};
            color:${isHC ? "ButtonText" : (ss.searchText.value?.value ?? "#374151")};
            font-size:13px; outline:none;
        `;
        input.addEventListener("input", () => { this.searchQuery = input.value; this.renderChipMode(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => e.stopPropagation());

        const clr = document.createElement("span");
        clr.textContent = "×";
        clr.style.cssText = `
            position:absolute; right:8px; cursor:pointer; color:#9CA3AF;
            font-size:16px; line-height:1; display:${this.searchQuery ? "block" : "none"};
        `;
        clr.addEventListener("click", () => { this.searchQuery = ""; this.renderChipMode(); });

        wrap.appendChild(input);
        wrap.appendChild(clr);
        return wrap;
    }

    // ─── SEARCH RESULTS ───────────────────────────────────────────────────────
    private renderSearchResults(container: HTMLElement, isHC: boolean, layout: string): void {
        const q = this.searchQuery.toLowerCase();
        const matches: HierarchyNode[] = [];
        const collect = (nodes: HierarchyNode[]) => {
            for (const n of nodes) {
                if (n.value.toLowerCase().includes(q)) matches.push(n);
                collect(n.children);
            }
        };
        collect(this.hierarchyManager.roots);

        if (matches.length === 0) {
            const empty = document.createElement("div");
            empty.style.cssText = "color:#9CA3AF;font-size:12px;padding:4px;";
            empty.textContent = `No results for "${this.searchQuery}"`;
            container.appendChild(empty);
            return;
        }

        const ss = this.settings.searchSettingsCard;

        // Contador: en una jerarquia grande, saber que hay 47 coincidencias
        // cambia como se lee el resultado. Antes solo salian los chips.
        if (Boolean(ss.showResultCount?.value)) {
            const cnt = document.createElement("div");
            cnt.style.cssText = "color:#6B7280;font-size:11px;padding:2px 4px 6px;";
            cnt.textContent = matches.length === 1
                ? "1 result"
                : `${matches.length} results`;
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
                container.appendChild(this.buildAllChip(isHC, "block"));
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
        const allLabel = (s.selectAllLabel.value as string) || "All";

        const btn = document.createElement("button");
        btn.textContent = allLabel;
        btn.setAttribute("role", "button");
        btn.setAttribute("aria-pressed", String(!anySelected));
        btn.setAttribute("aria-label", allLabel);
        btn.style.cssText = this.buildChipStyle(isHC, !anySelected, false, 1);
        btn.style.display = display;
        if (display === "block") {
            btn.style.width = "100%";
            btn.style.boxSizing = "border-box";
        }
        btn.addEventListener("click", async () => {
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
     * oscuro por defecto y no se lee. Luminancia relativa segun WCAG.
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
        const i = q ? texto.toLowerCase().indexOf(q.toLowerCase()) : -1;
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
        chip.setAttribute("role", "button");
        chip.setAttribute("aria-pressed", String(node.isSelected));
        chip.setAttribute("aria-label", node.value);
        chip.setAttribute("tabindex", "0");
        chip.style.cssText = this.buildChipStyle(isHC, node.isSelected, node.isParentOfSelection, node.level);
        // Filter-in: cuando otro visual resalta, los chips que quedan fuera se
        // atenuan en lugar de ignorarlo. supportsHighlight estaba declarado en
        // capabilities y no lo implementaba nadie.
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
            chip.style.boxSizing = "border-box";
        }

        if (leafOnly && !node.isLeaf) {
            chip.style.opacity = "0.7";
            chip.style.cursor = "default";
        }

        // Image — shown for any level that has an imageUrl
        const imgPos = (is?.imagePosition?.value as any)?.value ?? "left";
        if (node.imageUrl && isSafeImageUrl(node.imageUrl)) {
            const img = document.createElement("img");
            img.src = node.imageUrl; // safe: validated as data:image/* URI
            img.style.cssText = `height:${is.imageHeight.value}px;border-radius:${is.imageRadius.value}px;object-fit:cover;flex-shrink:0;`;
            img.onerror = () => { img.style.display = "none"; };
            const lbl = document.createElement("span");
            if (resaltar) lbl.appendChild(this.etiquetaConCoincidencia(node.value, resaltar));
            else lbl.textContent = node.value;
            if (imgPos === "above") {
                chip.style.flexDirection = "column";
                chip.style.alignItems = "center";
            } else {
                chip.style.flexDirection = "row";
                chip.style.alignItems = "center";
                chip.style.gap = "6px";
            }
            chip.appendChild(img);
            chip.appendChild(lbl);
        } else if (resaltar) {
            chip.appendChild(this.etiquetaConCoincidencia(node.value, resaltar));
        } else {
            chip.textContent = node.value;
        }

        // Value badge — shown between the label and the expand icon
        const vs = this.settings?.valueSettingsCard;
        if (vs && Boolean(vs.showValue?.value) && node.measureValue !== null && node.measureValue !== undefined) {
            const fmt     = (vs.valueFormat?.value as any)?.value ?? "compact";
            const badgeBg = isHC ? "ButtonFace" : (vs.valueBg.value?.value ?? "#E5E7EB");
            const badgeFg = isHC ? "ButtonText" : (vs.valueText.value?.value ?? "#374151");
            const badge   = document.createElement("span");
            badge.textContent = this.formatMeasure(node.measureValue, fmt);
            badge.style.cssText = `
                display:inline-flex; align-items:center; justify-content:center;
                background:${badgeBg}; color:${badgeFg};
                font-size:${vs.valueFontSize.value}px;
                border-radius:${vs.valueRadius.value}px;
                padding:0 ${vs.valuePaddingH.value}px;
                margin-left:auto; white-space:nowrap; flex-shrink:0;
                line-height:1.4;
            `;
            chip.appendChild(badge);
        }

        // Expand icon for non-leaf — click expands/collapses only, does NOT trigger selection
        if (!node.isLeaf && Boolean(hs.expandIcon.value)) {
            const icon = document.createElement("span");
            icon.textContent = node.isExpanded ? " ▲" : " ▼";
            icon.style.cssText = "font-size:9px;margin-left:3px;opacity:0.6;cursor:pointer;";
            icon.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation(); // prevent chip body click from also firing
                const hsCurrent = this.settings.hierarchySettingsCard;
                const autoCollapse = Boolean(hsCurrent.autoCollapse.value);
                this.hierarchyManager.toggleExpand(node.key, autoCollapse);
                this.renderChipMode(); // no applyFilter — expand state is not persisted via PBI filter
            });
            chip.appendChild(icon);
        }

        this.attachTooltip(chip, node);

        // Chip body click — selection only; always reads CURRENT settings
        chip.addEventListener("click", async (e: MouseEvent) => {
            // Power BI lo pone a false al exportar y en algunos modos de lectura:
            // seleccionar entonces cambia el informe a espaldas del usuario.
            if ((this.host as any).allowInteractions === false) return;
            e.stopPropagation();
            const cs = this.settings.chipSettingsCard;
            const multiSelect = Boolean(cs.multiSelect.value) || e.ctrlKey || e.metaKey;
            const leafOnly2   = Boolean(cs.leafOnly?.value);
            this.hierarchyManager.toggleSelect(node.key, multiSelect, leafOnly2);
            await this.applyFilter();
            this.renderChipMode();
        });

        chip.addEventListener("contextmenu", (e: MouseEvent) => {
            e.preventDefault();
            this.selectionManager.showContextMenu(null as any, { x: e.clientX, y: e.clientY });
        });

        chip.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chip.click(); }
        });

        return chip;
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
            if (path.length > 0) items.push({ displayName: "Path", value: path.join(" › ") });
        }

        // Node label
        items.push({ displayName: node.source?.displayName ?? "Value", value: node.value });

        // Measure value — shown when the option is on (badge doesn't need to be visible)
        // Use optional chaining throughout: valueSettingsCard may not exist in older builds
        const vs = this.settings?.valueSettingsCard;
        if (vs && Boolean(vs.showInTooltip?.value) &&
            node.measureValue !== null && node.measureValue !== undefined) {
            const fmt = (vs.valueFormat?.value as any)?.value ?? "compact";
            items.push({ displayName: this.measureDisplayName || "Value",
                         value: this.formatMeasure(node.measureValue, fmt) });
        }

        // Extra tooltip fields (Tooltips bucket)
        for (const tf of node.tooltipFields) {
            items.push({ displayName: tf.name, value: tf.value });
        }

        return items;
    }

    private attachTooltip(el: HTMLElement, node: HierarchyNode): void {
        // mouseenter fires ONCE per chip entry — do the (relatively) expensive item build
        // and the full show() call here only.
        // mousemove then just repositions the already-shown tooltip via move(), which is
        // cheap — calling show() on every mousemove floods the host IPC bridge and can
        // freeze Power BI Desktop when the user sweeps the cursor across several chips.
        el.addEventListener("mouseenter", (event: MouseEvent) => {
            this.host.tooltipService.show({
                dataItems: this.buildTooltipItems(node), identities: [],
                coordinates: [event.clientX, event.clientY], isTouchEvent: false
            });
        });
        el.addEventListener("mousemove", (event: MouseEvent) => {
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
            padding:0 ${ph}px;
            background:${bg};
            border:1.5px solid ${border};
            color:${text};
            cursor:pointer;
            white-space:nowrap;
            box-sizing:border-box;
            outline:${isActive ? `2px solid ${border}` : "none"};
            outline-offset:1px;
            transition:opacity 0.1s;
        `;
    }

    // ─── VALUE FORMAT ─────────────────────────────────────────────────────────
    private formatMeasure(value: number, fmt: string): string {
        const abs = Math.abs(value);
        switch (fmt) {
            case "number":
                return value.toLocaleString();
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

    private buildResetButton(isHC: boolean): HTMLElement {
        const hs = this.settings.hierarchySettingsCard;
        const label  = (hs.resetLabel.value as string) || "↺ Reset";
        const bg     = isHC ? "ButtonFace" : (hs.resetBg.value?.value     ?? "#F3F4F6");
        const border = isHC ? "ButtonText" : (hs.resetBorder.value?.value ?? "#D1D5DB");
        const color  = isHC ? "ButtonText" : (hs.resetText.value?.value   ?? "#6B7280");

        const btn = document.createElement("button");
        btn.textContent = label;
        btn.setAttribute("aria-label", label);
        btn.style.cssText = `
            align-self:flex-end; padding:4px 10px; border-radius:6px;
            border:1px solid ${border}; background:${bg}; color:${color};
            font-size:11px; cursor:pointer;
        `;
        btn.addEventListener("click", async () => {
            this.searchQuery = "";
            this.hierarchyManager.clearAll();
            await this.applyFilter();
            this.renderChipMode();
        });
        return btn;
    }

    // ─── FILTER ───────────────────────────────────────────────────────────────
    private async applyFilter(): Promise<void> {
        // El proximo update trae el filtro que estamos a punto de aplicar. Sin
        // esta marca lo confundiriamos con un cambio externo y restauraríamos
        // la seleccion anterior, deshaciendo el clic del usuario.
        this.pendingSelfFilter = true;
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
        const qParts = (entry.source.queryName ?? "").split(".");

        /* eslint-disable powerbi-visuals/no-http-string */
        const filter: any = {
            $schema: "http://powerbi.com/product/schema#basic", // required literal value of the IBasicFilter schema identifier, not a network call
            /* eslint-enable powerbi-visuals/no-http-string */
            target: {
                table:  qParts[0] ?? entry.source.displayName,
                column: qParts.slice(1).join(".") || entry.source.displayName
            },
            filterType: 1,
            operator: "In",
            values: entry.values,
            requireSingleSelection: false
        };

        await this.host.applyJsonFilter(filter, "general", "filter", powerbi.FilterAction.merge);
    }

    private parseFilter(filter: any): Map<number, Set<string>> {
        const result: Map<number, Set<string>> = new Map();
        if (filter?.values && Array.isArray(filter.values)) {
            const targetTable:  string = filter.target?.table  ?? "";
            const targetColumn: string = filter.target?.column ?? "";
            const cats = this.dataView?.categorical?.categories;
            let level = 1;
            if (cats) {
                let catIndex = 0; // counts only "categories" role columns (not images)
                for (const cat of cats) {
                    const roles = cat.source.roles as Record<string, boolean>;
                    if (!roles["categories"]) continue; // skip image columns
                    catIndex++;
                    const qParts = (cat.source.queryName ?? "").split(".");
                    const catTable  = qParts[0] ?? "";
                    const catColumn = qParts.slice(1).join(".") || cat.source.displayName;
                    if (catTable === targetTable && catColumn === targetColumn) {
                        level = catIndex; // position in categories role = level number
                        break;
                    }
                }
            }
            const vals = new Set<string>(filter.values.map((v: any) => String(v)));
            result.set(level, vals);
        }
        return result;
    }

    // ─── FORMATTING MODEL ─────────────────────────────────────────────────────
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }
}
