#!/usr/bin/env python3
"""
Extract HG/SS Poké Ball icons from pret/pokeheartgold.

For each (NCGR, NCLR) pair, decode 32x32 4bpp pixel art against its 16-color
BGR555 palette, run greedy RLE rect compression, and emit:
  - apps/www/registry/ui/poke-ball-data.ts  (palettes + rects per variant)
  - apps/www/public/refs/poke-ball/<variant>.png  (reference PNG x4)

Files are stored uncompressed (raw NCGR/NCLR), so no LZ77 needed.
"""

from __future__ import annotations
import json
import os
import struct
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ICON_DIR = REPO / ".refs/pokeheartgold/files/itemtool/itemdata/item_icon"
OUT_TS  = REPO / "apps/www/registry/ui/poke-ball-data.ts"
OUT_PNG = REPO / "apps/www/public/refs/poke-ball"

# ItemId → (NCGR file index, NCLR file index). Pulled straight from src/item.c.
BALLS: list[tuple[str, int, int]] = [
    # standard balls
    ("master",  2,  3),
    ("ultra",   4,  5),
    ("great",   6,  7),
    ("poke",    8,  9),
    ("safari", 10, 11),
    ("net",    12, 13),
    ("dive",   14, 15),
    ("nest",   16, 17),
    ("repeat", 18, 19),
    ("timer",  20, 19),  # shares palette with repeat
    ("luxury", 21, 22),
    ("premier",23, 22),  # shares palette with luxury
    ("dusk",  663,664),
    ("heal",  665,666),
    ("quick", 667,668),
    ("cherish",669,670),
    # apricorn balls (Johto signature)
    ("lure",  715,716),
    ("level", 717,718),
    ("moon",  719,720),
    ("heavy", 721,722),
    ("fast",  723,724),
    ("friend",725,726),
    ("love",  727,728),
    ("park",  729,730),
    ("sport", 731,732),
]


def parse_ncgr(path: Path) -> tuple[int, int, list[int]]:
    """Return (width, height, pixels) where pixels is a list of palette indices."""
    data = path.read_bytes()
    assert data[:4] == b"RGCN", f"not NCGR: {path}"
    # CHAR section starts at 0x10
    char_off = 0x10
    assert data[char_off:char_off + 4] == b"RAHC"
    # pixel data block: at char_off + 0x20
    data_size = struct.unpack_from("<I", data, char_off + 0x18)[0]
    pixel_off = char_off + 0x20
    raw = data[pixel_off:pixel_off + data_size]
    # 4bpp, tile-major: each 32 bytes = one 8x8 tile
    n_tiles = data_size // 32
    # icon convention is 4x4 tiles (32x32 px)
    if n_tiles == 16:
        tcols, trows = 4, 4
    elif n_tiles == 64:
        tcols, trows = 8, 8
    else:
        # fall back to square-ish
        tcols = trows = int(n_tiles ** 0.5)
    width  = tcols * 8
    height = trows * 8
    pixels = [0] * (width * height)
    for ti in range(n_tiles):
        tx = (ti % tcols) * 8
        ty = (ti // tcols) * 8
        tile = raw[ti * 32:(ti + 1) * 32]
        for py in range(8):
            for px in range(0, 8, 2):
                b = tile[py * 4 + px // 2]
                lo = b & 0x0F
                hi = (b >> 4) & 0x0F
                pixels[(ty + py) * width + (tx + px)]     = lo
                pixels[(ty + py) * width + (tx + px + 1)] = hi
    return width, height, pixels


def parse_nclr(path: Path) -> list[tuple[int, int, int]]:
    """Return 16 RGB888 colours (palette index 0 = transparent by NDS convention)."""
    data = path.read_bytes()
    assert data[:4] == b"RLCN", f"not NCLR: {path}"
    pal_off = 0x10
    assert data[pal_off:pal_off + 4] == b"TTLP"
    data_size  = struct.unpack_from("<I", data, pal_off + 0x18)[0]
    data_start = pal_off + 0x18 + 8 + struct.unpack_from("<I", data, pal_off + 0x1C)[0] - 0x10
    # The palette block is right after the 24-byte TTLP header
    raw = data[pal_off + 0x18:pal_off + 0x18 + data_size]
    colours: list[tuple[int, int, int]] = []
    for i in range(min(16, len(raw) // 2)):
        v = struct.unpack_from("<H", raw, i * 2)[0]
        r = ((v >>  0) & 0x1F) << 3
        g = ((v >>  5) & 0x1F) << 3
        b = ((v >> 10) & 0x1F) << 3
        colours.append((r, g, b))
    while len(colours) < 16:
        colours.append((0, 0, 0))
    return colours


def trim(pixels: list[int], w: int, h: int) -> tuple[list[int], int, int, int, int]:
    """Crop transparent border. Returns (new_pixels, new_w, new_h, ox, oy)."""
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if pixels[y * w + x] != 0:
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
    if maxx < 0:
        return [0], 1, 1, 0, 0
    nw = maxx - minx + 1
    nh = maxy - miny + 1
    np_ = [0] * (nw * nh)
    for y in range(nh):
        for x in range(nw):
            np_[y * nw + x] = pixels[(miny + y) * w + (minx + x)]
    return np_, nw, nh, minx, miny


def rle_rects(pixels: list[int], w: int, h: int) -> list[tuple[int, int, int, int, int]]:
    """Greedy: extend right while colour matches, then extend down while every column matches."""
    visited = [False] * (w * h)
    rects: list[tuple[int, int, int, int, int]] = []
    for y in range(h):
        for x in range(w):
            if visited[y * w + x]:
                continue
            c = pixels[y * w + x]
            if c == 0:
                visited[y * w + x] = True
                continue
            rw = 1
            while x + rw < w and not visited[y * w + x + rw] and pixels[y * w + x + rw] == c:
                rw += 1
            rh = 1
            while y + rh < h:
                ok = True
                for dx in range(rw):
                    if visited[(y + rh) * w + x + dx] or pixels[(y + rh) * w + x + dx] != c:
                        ok = False
                        break
                if not ok:
                    break
                rh += 1
            for dy in range(rh):
                for dx in range(rw):
                    visited[(y + dy) * w + x + dx] = True
            rects.append((x, y, rw, rh, c))
    return rects


def hex_color(rgb: tuple[int, int, int]) -> str:
    return f"#{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"


def write_png(path: Path, pixels: list[int], w: int, h: int, palette: list[tuple[int, int, int]], scale: int = 4) -> None:
    """Tiny PNG writer — hand-rolled to avoid Pillow dependency."""
    import zlib
    sw, sh = w * scale, h * scale
    raw = bytearray()
    for y in range(sh):
        raw.append(0)  # filter byte
        for x in range(sw):
            idx = pixels[(y // scale) * w + (x // scale)]
            if idx == 0:
                raw += b"\x00\x00\x00\x00"
            else:
                r, g, b = palette[idx]
                raw += bytes([r, g, b, 255])
    def chunk(tag: bytes, body: bytes) -> bytes:
        import struct as _s, zlib as _z
        return _s.pack(">I", len(body)) + tag + body + _s.pack(">I", _z.crc32(tag + body))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", sw, sh, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    iend = chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(sig + ihdr + idat + iend)


def main() -> None:
    OUT_PNG.mkdir(parents=True, exist_ok=True)
    out: dict[str, dict] = {}
    total_rects = 0
    for name, ng_idx, nc_idx in BALLS:
        ncgr_path = ICON_DIR / f"item_icon_{ng_idx:03d}.NCGR"
        nclr_path = ICON_DIR / f"item_icon_{nc_idx:03d}.NCLR"
        if not ncgr_path.exists() or not nclr_path.exists():
            print(f"!! missing: {name} ({ncgr_path.name}, {nclr_path.name})")
            continue
        w, h, pixels = parse_ncgr(ncgr_path)
        palette = parse_nclr(nclr_path)
        pixels_t, tw, th, ox, oy = trim(pixels, w, h)
        rects = rle_rects(pixels_t, tw, th)
        total_rects += len(rects)
        # collect just the indices we actually used so we can emit a tight palette
        used = sorted({r[4] for r in rects})
        idx_map = {old: new + 1 for new, old in enumerate(used)}  # 0 stays transparent
        rects_remapped = [(x, y, rw, rh, idx_map[c]) for x, y, rw, rh, c in rects]
        slim_palette = [palette[u] for u in used]
        out[name] = {
            "w": tw,
            "h": th,
            "palette": [hex_color(c) for c in slim_palette],
            "rects": rects_remapped,
        }
        # write the reference PNG (4× pixelated)
        write_png(OUT_PNG / f"{name}.png", pixels_t, tw, th, palette, scale=4)
        print(f"  {name:8s}  {tw}x{th}  rects={len(rects):3d}  palette={len(slim_palette)}")
    print(f"\ntotal rects across {len(out)} variants: {total_rects}")

    # Emit a TS data file
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "/**",
        " * Auto-generated by scripts/extract-pokeball.py",
        " * Source: pret/pokeheartgold files/itemtool/itemdata/item_icon",
        " * 25 Poké Ball variants — RLE rect data + per-variant palette.",
        " */",
        "",
        "export type BallVariant =",
    ]
    keys = list(out.keys())
    for i, k in enumerate(keys):
        sep = " |" if i < len(keys) - 1 else ""
        lines.append(f'  | "{k}"' if i > 0 else f'    "{k}"')
    # Fix join: simple form
    lines = [
        "/**",
        " * Auto-generated by scripts/extract-pokeball.py",
        " * Source: pret/pokeheartgold files/itemtool/itemdata/item_icon",
        " * 25 Poké Ball variants — RLE rect data + per-variant palette.",
        " * Palette index 0 = transparent (NDS convention).",
        " */",
        "",
        "export type BallVariant = " + " | ".join(f'"{k}"' for k in keys) + ";",
        "",
        "export type BallEntry = {",
        "  /** native pixel width (after transparent-border crop) */",
        "  w: number;",
        "  /** native pixel height */",
        "  h: number;",
        "  /** colours referenced by `rects` — index 0 here = palette entry 1 in the source */",
        "  palette: readonly string[];",
        "  /** [x, y, w, h, paletteIndex+1] tuples; entries with palIdx=0 are transparent and never emitted */",
        "  rects: ReadonlyArray<readonly [number, number, number, number, number]>;",
        "};",
        "",
        "export const BALLS: Record<BallVariant, BallEntry> = {",
    ]
    for k in keys:
        e = out[k]
        rects_str = ",".join(f"[{r[0]},{r[1]},{r[2]},{r[3]},{r[4]}]" for r in e["rects"])
        pal_str = ", ".join(f'"{c}"' for c in e["palette"])
        lines.append(f'  {k}: {{')
        lines.append(f'    w: {e["w"]}, h: {e["h"]},')
        lines.append(f'    palette: [{pal_str}],')
        lines.append(f'    rects: [{rects_str}],')
        lines.append(f'  }},')
    lines.append("};")
    lines.append("")
    OUT_TS.write_text("\n".join(lines))
    print(f"\nwrote {OUT_TS}")


if __name__ == "__main__":
    main()
