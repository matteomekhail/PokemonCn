#!/usr/bin/env python3
"""Extract HG/SS Apricorn item icons. Same pipeline as the Poké Ball extractor:
each apricorn pairs an NCGR + NCLR from `files/itemtool/itemdata/item_icon`.
Mapping straight from `src/item.c`."""
from __future__ import annotations
import json, struct, zlib
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ICON = REPO / ".refs/pokeheartgold/files/itemtool/itemdata/item_icon"
OUT_TS = REPO / "apps/www/registry/ui/apricorn-data.ts"
OUT_PNG = REPO / "apps/www/public/refs/apricorn"

# from src/item.c: ITEM_<COLOR>_APRICORN → (NCGR member, NCLR member)
APRICORNS: list[tuple[str, int, int]] = [
    ("red",    733, 734),
    ("yellow", 737, 738),
    ("blue",   735, 736),
    ("green",  739, 740),
    ("pink",   741, 742),
    ("white",  743, 744),
    ("black",  745, 746),
]


def parse_ncgr(path: Path) -> tuple[int, int, list[int]]:
    data = path.read_bytes()
    char_off = 0x10
    data_size = struct.unpack_from("<I", data, char_off + 0x18)[0]
    raw = data[char_off + 0x20:char_off + 0x20 + data_size]
    n_tiles = data_size // 32
    if n_tiles == 16: tcols, trows = 4, 4
    elif n_tiles == 64: tcols, trows = 8, 8
    else: tcols = trows = int(n_tiles ** 0.5)
    w, h = tcols * 8, trows * 8
    px = [0] * (w * h)
    for ti in range(n_tiles):
        tx = (ti % tcols) * 8
        ty = (ti // tcols) * 8
        tile = raw[ti * 32:(ti + 1) * 32]
        for py in range(8):
            for px_i in range(0, 8, 2):
                b = tile[py * 4 + px_i // 2]
                px[(ty + py) * w + tx + px_i]     = b & 0xF
                px[(ty + py) * w + tx + px_i + 1] = (b >> 4) & 0xF
    return w, h, px


def parse_nclr(path: Path) -> list[tuple[int, int, int]]:
    data = path.read_bytes()
    pal_off = 0x10
    data_size = struct.unpack_from("<I", data, pal_off + 0x18)[0]
    raw = data[pal_off + 0x18:pal_off + 0x18 + data_size]
    cols = []
    for i in range(min(16, len(raw) // 2)):
        v = struct.unpack_from("<H", raw, i * 2)[0]
        r = ((v >> 0) & 0x1F) << 3
        g = ((v >> 5) & 0x1F) << 3
        b = ((v >> 10) & 0x1F) << 3
        cols.append((r, g, b))
    while len(cols) < 16:
        cols.append((0, 0, 0))
    return cols


def trim(pixels, w, h):
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if pixels[y * w + x] != 0:
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
    if maxx < 0: return [0], 1, 1
    nw, nh = maxx - minx + 1, maxy - miny + 1
    out = [0] * (nw * nh)
    for y in range(nh):
        for x in range(nw):
            out[y * nw + x] = pixels[(miny + y) * w + (minx + x)]
    return out, nw, nh


def rle(pixels, w, h):
    seen = [False] * (w * h)
    rects = []
    for y in range(h):
        for x in range(w):
            if seen[y * w + x]: continue
            c = pixels[y * w + x]
            if c == 0:
                seen[y * w + x] = True; continue
            rw = 1
            while x + rw < w and not seen[y * w + x + rw] and pixels[y * w + x + rw] == c:
                rw += 1
            rh = 1
            while y + rh < h:
                ok = True
                for dx in range(rw):
                    if seen[(y + rh) * w + x + dx] or pixels[(y + rh) * w + x + dx] != c:
                        ok = False; break
                if not ok: break
                rh += 1
            for dy in range(rh):
                for dx in range(rw):
                    seen[(y + dy) * w + x + dx] = True
            rects.append((x, y, rw, rh, c))
    return rects


def hex_color(rgb): return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def write_png(path, pixels, w, h, palette, scale=4):
    sw, sh = w * scale, h * scale
    raw = bytearray()
    for y in range(sh):
        raw.append(0)
        for x in range(sw):
            idx = pixels[(y // scale) * w + (x // scale)]
            if idx == 0: raw += b"\x00\x00\x00\x00"
            else: r, g, b = palette[idx]; raw += bytes([r, g, b, 255])
    def chunk(t, b): return struct.pack(">I", len(b)) + t + b + struct.pack(">I", zlib.crc32(t + b))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", sw, sh, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))


def main():
    OUT_PNG.mkdir(parents=True, exist_ok=True)
    out = {}
    total = 0
    for name, ng, nc in APRICORNS:
        ncgr_path = ICON / f"item_icon_{ng:03d}.NCGR"
        nclr_path = ICON / f"item_icon_{nc:03d}.NCLR"
        w, h, px = parse_ncgr(ncgr_path)
        pal = parse_nclr(nclr_path)
        px_t, tw, th = trim(px, w, h)
        rects = rle(px_t, tw, th)
        used = sorted({r[4] for r in rects})
        idx_map = {old: new + 1 for new, old in enumerate(used)}
        rects_remap = [(x, y, rw, rh, idx_map[c]) for x, y, rw, rh, c in rects]
        slim = [pal[u] for u in used]
        out[name] = {
            "w": tw, "h": th,
            "palette": [hex_color(c) for c in slim],
            "rects": rects_remap,
        }
        write_png(OUT_PNG / f"{name}.png", px_t, tw, th, pal, scale=4)
        total += len(rects)
        print(f"  {name:7s}  {tw}x{th}  rects={len(rects):3d}  palette={len(slim)}")
    print(f"\ntotal rects across {len(out)} apricorns: {total}")

    keys = list(out.keys())
    lines = [
        "/**",
        " * Auto-generated by scripts/extract-apricorn.py",
        " * Source: pret/pokeheartgold files/itemtool/itemdata/item_icon",
        " * 7 Apricorn variants — the HG/SS-only fruit Kurt forges into balls.",
        " * Palette index 0 = transparent (NDS convention).",
        " */",
        "",
        "export type ApricornVariant = " + " | ".join(f'"{k}"' for k in keys) + ";",
        "",
        "export type ApricornEntry = {",
        "  /** native pixel width (after transparent-border crop) */",
        "  w: number;",
        "  /** native pixel height */",
        "  h: number;",
        "  /** colours referenced by `rects` */",
        "  palette: readonly string[];",
        "  /** [x, y, w, h, paletteIndex+1] */",
        "  rects: ReadonlyArray<readonly [number, number, number, number, number]>;",
        "};",
        "",
        "export const APRICORNS: Record<ApricornVariant, ApricornEntry> = {",
    ]
    for k in keys:
        e = out[k]
        rects_str = ",".join(f"[{r[0]},{r[1]},{r[2]},{r[3]},{r[4]}]" for r in e["rects"])
        pal_str = ", ".join(f'"{c}"' for c in e["palette"])
        lines.append(f"  {k}: {{")
        lines.append(f"    w: {e['w']}, h: {e['h']},")
        lines.append(f"    palette: [{pal_str}],")
        lines.append(f"    rects: [{rects_str}],")
        lines.append(f"  }},")
    lines.append("};")
    lines.append("")
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text("\n".join(lines))
    print(f"wrote {OUT_TS}")


if __name__ == "__main__":
    main()
