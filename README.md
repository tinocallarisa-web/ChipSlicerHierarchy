# Chip Slicer Hierarchy — custom visual de Power BI

**de [TCViz](https://tcviz.com)** · versión **1.3.0.0** · Free + Pro (plan `chipslicer-hierarchy-pro`)

Segmentador de chips con hasta tres niveles. Los campos van en un solo pozo (*Categories*)
y su orden es la jerarquía: clic en un chip para filtrar, flecha para abrir sus hijos.
El filtro se aplica al nivel más profundo con selección.

- Documentación y FAQ: https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html
- Ficha: https://tcviz.com/product/chip-slicer-hierarchy/
- Vídeo: https://www.youtube.com/watch?v=rdZLCxpP6Pk
- Cambios: [CHANGELOG.md](./CHANGELOG.md) · [changelog.html](./changelog.html)

## Free y Pro

- **Free**: 3 niveles y 2.000 filas, imágenes (solo `data:image/…;base64`), insignia de valor
  (Model format / Compact / Number / Currency / Percentage), tooltips, selección múltiple,
  solo hojas, selección por defecto (None / First value / These values), botón ✕, chip
  "All", 6 plantillas de estilo, colores por nivel, on-object, teclado, 12 idiomas.
- **Pro**: buscador, color por valor (normalizado por nivel) y modo desplegable.
- **Vista previa Pro**: sin licencia y solo editando, lo Pro se dibuja con la marca
  "Pro preview" y Power BI muestra su aviso y la barra Upgrade. En lectura, y donde no se
  puede leer la licencia (Publish to Web, embed, export), se ve la versión gratuita sin marca.

## Compilar

```bash
npm install
npm start                  # servidor de desarrollo
npm run build              # paquete .pbiviz en dist/
node build-test.js         # build de prueba con Pro forzado (guid ..._test)
node build-test.js --free  # build de prueba gratuita (guid ..._testfree)
```

## Estructura

- `src/visual.ts`, `src/settings.ts`, `src/strings.ts` — lógica, panel de formato y textos
- `capabilities.json`, `pbiviz.json`, `stringResources/` (12 idiomas)
- `support.html`, `privacy.html`, `terms.html`, `changelog.html` — en la raíz, servidas por GitHub Pages
- `docs/` — entregables (ficha de AppSource, web, YouTube, tips, infografía); no se sirve

## Privacidad

Sin llamadas de red, sin telemetría, sin cookies ni almacenamiento. Los enlaces de la
pantalla de inicio solo se abren al hacer clic, a través de Power BI.
[Política de privacidad](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html).

## Licencia

Software comercial. [Términos de uso](https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html).
El código se publica por transparencia; no se permite redistribuirlo.

Soporte: [support@tcviz.com](mailto:support@tcviz.com) ·
[Issues](https://github.com/tinocallarisa-web/ChipSlicerHierarchy/issues)
