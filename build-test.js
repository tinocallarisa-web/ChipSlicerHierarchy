#!/usr/bin/env node
/**
 * build-test.js — ChipSlicer Hierarchy
 * Parcha isPro → true y agrega _test al guid, empaqueta, restaura.
 */

"use strict";
const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT       = __dirname;
const VISUAL_TS  = path.join(ROOT, "src", "visual.ts");
const PBIVIZ_JSON = path.join(ROOT, "pbiviz.json");

// Matches the entire license-check block between the two markers
const MARKER_REGEX = /\/\/ ISPRO_BLOCK_START[\s\S]*?\/\/ ISPRO_BLOCK_END/;
const MARKER_TRUE  = "// ISPRO_BLOCK_START\n        this.isPro = true;\n        // ISPRO_BLOCK_END";

// ── 1. Leer originals ────────────────────────────────────────────────────────
const origVisual = fs.readFileSync(VISUAL_TS,   "utf8");
const origPbiviz = fs.readFileSync(PBIVIZ_JSON, "utf8");

// Verify marker exists
if (!MARKER_REGEX.test(origVisual)) {
    console.error("❌ ERROR: No se encontró ISPRO_MARKER en visual.ts");
    console.error("   Busca el bloque: // ISPRO_BLOCK_START ... // ISPRO_BLOCK_END en _update()");

    process.exit(1);
}

let restored = false;
const restore = () => {
    if (!restored) {
        fs.writeFileSync(VISUAL_TS,   origVisual, "utf8");
        fs.writeFileSync(PBIVIZ_JSON, origPbiviz, "utf8");
        restored = true;
        console.log("✅ Ficheros originales restaurados.");
    }
};

process.on("exit",   restore);
process.on("SIGINT", () => { restore(); process.exit(1); });

try {
    // Modo --free: NO se parchea isPro. El licenseManager no encuentra plan para
    // este guid, asi que resuelve a Free por si mismo. Es la unica forma de ver
    // el camino gratuito: con el guid real, Power BI sirve la version instalada
    // desde AppSource y no la tuya.
    const freeMode = process.argv.includes("--free");

    // ── 2. Parchear visual.ts ─────────────────────────────────────────────────
    if (freeMode) {
        console.log("🔧 isPro → false  (--free: tier Free real, sin forzar)");
    } else {
        const patchedVisual = origVisual.replace(MARKER_REGEX, MARKER_TRUE);
        fs.writeFileSync(VISUAL_TS, patchedVisual, "utf8");
        console.log("🔧 visual.ts parcheado (bloque de licencia → isPro = true)");
    }

    // ── 3. Parchear pbiviz.json ───────────────────────────────────────────────
    const pbivizObj = JSON.parse(origPbiviz);
    const realGuid  = pbivizObj.visual.guid;
    if (realGuid.endsWith("_test")) {
        console.error("❌ ERROR: El guid ya tiene '_test'. Restaura manualmente pbiviz.json.");
        process.exit(1);
    }
    // Guid propio para cada modo. Si compartieran sufijo, Power BI trataria las
    // dos builds como el mismo visual y al importar la segunda seguirias viendo
    // la primera.
    pbivizObj.visual.guid = realGuid + (freeMode ? "_testfree" : "_test");
    fs.writeFileSync(PBIVIZ_JSON, JSON.stringify(pbivizObj, null, 2), "utf8");
    console.log(`🔧 pbiviz.json parcheado (guid: ${pbivizObj.visual.guid})`);

    // ── 4. Build ──────────────────────────────────────────────────────────────
    console.log("📦 Ejecutando pbiviz package …");
    const pbivizJs = path.join(ROOT, "node_modules", "powerbi-visuals-tools", "bin", "pbiviz.js");
    execSync(`node "${pbivizJs}" package`, { cwd: ROOT, stdio: "inherit" });
    console.log("✅ Build de TEST completado. El .pbiviz está en dist/");

} catch (err) {
    console.error("❌ Error durante el build:", err.message || err);
    restore();
    process.exit(1);
}
// restore() se llama al salir vía process.on("exit")
