# Chip Slicer Hierarchy — ficha de AppSource (1.3.0.0, 22-10-2026)

Texto para pegar en Partner Center → oferta Chip Slicer Hierarchy → Offer listing. **Editar este fichero no cambia la
oferta:** cada campo hay que pegarlo a mano en la consola.

---

## Resumen de resultados de búsqueda (≤ 100)

```
Slicer by levels for Power BI: country, region and city as chips, with a drop-down mode and search.
```

## Descripción (≤ 5.000)

```
To let a reader filter by country, then region, then city, a report usually stacks three slicers, or one native
hierarchy slicer that shows a long tree of checkboxes. Either way the reader opens lists to find their way, and
nobody can tell at a glance what is selected.

Chip Slicer Hierarchy puts the whole hierarchy in one visual, as chips. Click a country to filter; open it to see its
regions next to it; the path to whatever is selected stays highlighted, so the reader always knows where they are.
The field order in the Categories well is the hierarchy: adding a level is adding a field.

WHAT YOU GET (FREE)
• Up to three levels, single or multi-select, and leaf-only selection when parent levels are for navigation only
• Expand and collapse, with optional auto-collapse of sibling branches
• Colours per level for inactive, active and the ancestors of the selection
• A measure on each chip, in the model's own format (dynamic format strings included)
• Optional image on each chip, from images embedded in your model
• Clear button (✕) and an "All" chip
• Default selection: the first value, or the values you type ("Spain, France")
• Six style templates — Classic, Outline, Soft, Square, One colour, Dark
• On-object formatting, keyboard navigation (arrows, Right opens a level, Left closes it), screen readers and
  high-contrast themes
• 12 languages: English, Spanish, Portuguese, French, German, Italian, Dutch, Polish, Japanese, Chinese, Korean

PRO
• Drop-down mode: a compact bar with the current selection that opens the hierarchy on click — for headers and
  crowded pages
• Search across every level, with the matches marked and counted
• Colour chips by value, scaled level by level so a child is compared with its siblings

SEE PRO ON YOUR OWN DATA BEFORE YOU BUY
While you edit, the setup tips have a "Try Pro" button for each feature. Without a licence it is drawn working, under
a "Pro preview" watermark that names it: your own hierarchy, not a screenshot of someone else's. Power BI shows its
own notice with the link to get a licence. Reading view shows the free slicer, so a published report never uses a
feature nobody paid for.

WORKS LIKE A NATIVE SLICER
A standard Power BI filter: sync slicers, bookmarks, edit interactions and the filter pane all work. Highlighting
from other visuals dims the chips outside it.

PRIVACY
No network calls, no telemetry, no cookies. Images must be embedded in your model as Base64 — links to images on a
web server are rejected on purpose, which is what makes that claim literally true. Licensing is handled by Microsoft
AppSource: no external account and no licence server.

GETTING STARTED
1. Drag up to three fields into Categories: the first is level 1.
2. Optional: a measure in Values, images in Images, extra fields in Tooltips.
3. Format pane → Style template: pick a look in one click.

Documentation, FAQ and use cases: https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html
Support: support@tcviz.com — a person answers.

WHAT'S NEW IN 1.3
Drop-down mode (Pro), style templates, setup tips with "Try Pro", default selection by values, model format for the
values, on-object formatting, full keyboard navigation, 12 languages and a new clear button. Saved reports look the
same.
```

## Palabras clave (3)

1. `hierarchy slicer` — lo teclea quien ya sabe que necesita filtrar por niveles: problema concreto.
2. `drill down filter` — el problema dicho con otras palabras ("bajar de país a ciudad").
3. `button slicer` — quien quiere botones en vez de listas; compartida con Chip Slicer a propósito, porque desde
   Chip Slicer se remite aquí para los niveles.

## Vídeo

URL canónica `https://www.youtube.com/watch?v=<id>`. Vídeo de la 1.3:
`https://www.youtube.com/watch?v=hgMz9ef160U`.

## Imágenes

- Logo 300×300: `assets/icon_300x300.png` (icono nuevo de la serie)
- Capturas 1366×768: `assets/Screenshot_1.png`, `assets/Screenshot_3.png` y `assets/chip-slicer-hierarchy-infographic.png` (fuente `docs/infographic.html`)

## URLs

| Campo | Valor |
|---|---|
| Soporte | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/support.html |
| Privacidad | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/privacy.html |
| Términos | https://tinocallarisa-web.github.io/ChipSlicerHierarchy/terms.html |
| Repo (rama certification) | https://github.com/tinocallarisa-web/ChipSlicerHierarchy/tree/certification |

`privacyTermsLink` no viaja dentro del `.pbiviz`: la URL de privacidad que ve el usuario sale de Partner Center.

## Notas para la certificación

`docs/CERTIFICATION-NOTES-SHORT.txt` — el campo se vacía en cada reenvío: pegarlo siempre.
