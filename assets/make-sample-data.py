"""
Genera assets/sample-data-hierarchy.csv para ChipSlicer Hierarchy.

Tres niveles de jerarquia (Category > Subcategory > Product), una imagen
Base64 por nivel, y dos medidas (Sales, Target).

Las imagenes son PNG generados aqui mismo: el visual solo acepta data URIs
Base64 (data:image/png;base64,...), nunca URLs externas.

Sin dependencias: PNG escrito a mano con zlib + struct.
Uso:  python assets/make-sample-data.py
"""

import base64
import csv
import io
import math
import os
import struct
import zlib

SS = 4          # supersampling, para bordes suaves
SIZE = 28       # tamano final del icono en px


# ─────────────────────────────────────────────────────────── PNG encoder ────

def write_png(pixels, w, h):
    """pixels: lista de filas, cada una lista de (r,g,b,a). Devuelve bytes PNG."""
    raw = b"".join(
        b"\x00" + b"".join(struct.pack("BBBB", *px) for px in row)
        for row in pixels
    )

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def render(shape, color, size=SIZE):
    """Dibuja shape en color sobre fondo transparente, con supersampling."""
    r, g, b = color
    big = size * SS
    cx = cy = big / 2.0
    rad = big * 0.42

    acc = [[0] * size for _ in range(size)]
    for y in range(big):
        for x in range(big):
            dx, dy = x - cx, y - cy
            if shape == "circle":
                inside = dx * dx + dy * dy <= rad * rad
            elif shape == "square":
                k = rad * 0.88
                inside = abs(dx) <= k and abs(dy) <= k
            elif shape == "diamond":
                inside = abs(dx) + abs(dy) <= rad * 1.15
            elif shape == "triangle":
                # triangulo equilatero apuntando arriba
                inside = (dy <= rad * 0.75) and (dy >= -rad * 0.85) and \
                         (abs(dx) <= (dy + rad * 0.85) * 0.62)
            elif shape == "ring":
                d2 = dx * dx + dy * dy
                inside = (rad * 0.55) ** 2 <= d2 <= rad * rad
            elif shape == "hex":
                q = abs(dx) / (rad * 0.95)
                p = abs(dy) / (rad * 0.95)
                inside = q <= 0.866 and (p + q * 0.577) <= 1.0
            else:
                inside = False
            if inside:
                acc[y // SS][x // SS] += 1

    full = SS * SS
    return [
        [(r, g, b, int(round(255.0 * acc[y][x] / full))) for x in range(size)]
        for y in range(size)
    ]


def data_uri(shape, color):
    px = render(shape, color)
    png = write_png(px, SIZE, SIZE)
    return "data:image/png;base64," + base64.b64encode(png).decode("ascii")


# ─────────────────────────────────────────────────────────────── paleta ────

ACC = (201, 100, 66)     # TCViz naranja
ACC2 = (156, 135, 245)   # TCViz morado
DEEP = (176, 87, 48)
TEAL = (58, 141, 138)
GOLD = (201, 162, 66)
SLATE = (83, 81, 70)
BLUE = (61, 110, 176)
GREEN = (74, 145, 88)


# ────────────────────────────────────────────────────────────── datos ────

# (Category, Subcategory, Product, Sales, Target)
ROWS = [
    ("Bikes", "Road Bikes", "Sprint 200", 184500, 170000),
    ("Bikes", "Road Bikes", "Sprint 400", 142300, 150000),
    ("Bikes", "Road Bikes", "Aero Elite", 98750, 120000),
    ("Bikes", "Mountain Bikes", "Trail 500", 176200, 160000),
    ("Bikes", "Mountain Bikes", "Trail 700", 121400, 130000),
    ("Bikes", "Mountain Bikes", "Summit Pro", 87900, 95000),
    ("Bikes", "Touring Bikes", "Voyager 100", 64300, 80000),
    ("Bikes", "Touring Bikes", "Voyager 300", 52100, 55000),

    ("Components", "Brakes", "Disc Brake Set", 43800, 40000),
    ("Components", "Brakes", "Hydraulic Kit", 31250, 35000),
    ("Components", "Wheels", "Carbon Wheelset", 96400, 85000),
    ("Components", "Wheels", "Alloy Wheelset", 58200, 60000),
    ("Components", "Drivetrain", "11-Speed Groupset", 72900, 70000),
    ("Components", "Drivetrain", "Chain & Cassette", 24600, 28000),

    ("Clothing", "Jerseys", "Team Jersey", 38700, 34000),
    ("Clothing", "Jerseys", "Thermal Jersey", 22400, 26000),
    ("Clothing", "Gloves", "Race Gloves", 15900, 14000),
    ("Clothing", "Gloves", "Winter Gloves", 11200, 13000),
    ("Clothing", "Helmets", "Aero Helmet", 54300, 50000),
    ("Clothing", "Helmets", "Trail Helmet", 33800, 32000),

    ("Accessories", "Lights", "Front Light 800", 19400, 18000),
    ("Accessories", "Lights", "Rear Light Pro", 12700, 12000),
    ("Accessories", "Bottles", "Insulated Bottle", 8600, 9000),
    ("Accessories", "Bottles", "Race Bottle", 6300, 6500),
    ("Accessories", "Bags", "Saddle Bag", 14100, 15000),
]

CAT_ICON = {
    "Bikes": ("circle", ACC),
    "Components": ("hex", SLATE),
    "Clothing": ("square", ACC2),
    "Accessories": ("diamond", TEAL),
}

# Ningun hijo repite la forma de su padre: a tamano de chip, dos circulos de
# tonos parecidos son indistinguibles.
SUB_ICON = {
    # padre Bikes = circle / naranja
    "Road Bikes": ("ring", BLUE),
    "Mountain Bikes": ("triangle", GREEN),
    "Touring Bikes": ("diamond", TEAL),
    # padre Components = hex / gris
    "Brakes": ("square", DEEP),
    "Wheels": ("ring", SLATE),
    "Drivetrain": ("diamond", GOLD),
    # padre Clothing = square / morado
    "Jerseys": ("hex", GOLD),
    "Gloves": ("circle", ACC2),
    "Helmets": ("triangle", BLUE),
    # padre Accessories = diamond / teal
    "Lights": ("triangle", GOLD),
    "Bottles": ("circle", TEAL),
    "Bags": ("square", SLATE),
}

# Los productos alternan forma/color de forma estable, por posicion.
PROD_SHAPES = ["circle", "square", "diamond", "triangle", "hex", "ring"]
PROD_COLORS = [ACC, ACC2, TEAL, GOLD, BLUE, GREEN, DEEP, SLATE]


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "sample-data-hierarchy.csv")

    cache = {}

    def uri(shape, color):
        key = (shape, color)
        if key not in cache:
            cache[key] = data_uri(shape, color)
        return cache[key]

    products = sorted({r[2] for r in ROWS})
    prod_icon = {
        p: (PROD_SHAPES[i % len(PROD_SHAPES)], PROD_COLORS[i % len(PROD_COLORS)])
        for i, p in enumerate(products)
    }

    with io.open(out, "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow([
            "Category", "CategoryImage",
            "Subcategory", "SubcategoryImage",
            "Product", "ProductImage",
            "Sales", "Target",
        ])
        for cat, sub, prod, sales, target in ROWS:
            w.writerow([
                cat, uri(*CAT_ICON[cat]),
                sub, uri(*SUB_ICON[sub]),
                prod, uri(*prod_icon[prod]),
                sales, target,
            ])

    size = os.path.getsize(out)
    print("Escrito: %s" % out)
    print("  filas       : %d" % len(ROWS))
    print("  categorias  : %d" % len({r[0] for r in ROWS}))
    print("  subcategorias: %d" % len({r[1] for r in ROWS}))
    print("  productos   : %d" % len(products))
    print("  iconos unicos: %d" % len(cache))
    print("  tamano      : %.1f KB" % (size / 1024.0))
    sample = next(iter(cache.values()))
    print("  data URI    : %s... (%d chars)" % (sample[:44], len(sample)))


if __name__ == "__main__":
    main()
