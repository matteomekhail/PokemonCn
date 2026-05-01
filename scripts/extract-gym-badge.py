#!/usr/bin/env python3
"""
Extract HG/SS Gym Badges from pret/pokeheartgold.

Source: NARC `files/a/0/4/9` (the Trainer Card NARC, NARC ID 0x31, confirmed in
asm/overlay_trainer_card_main.s where the OBJ resource table at
ov51_021E7FC4 = [0x2E, 0x1E, 0x3A, 0x3B, …] selects file 0x2E=46 as the badge
char data and 0x1E=30 / 0x1C=28 as palette sources).

  - NCGR file 46  → tile bank for all 16 badges (4bpp, 3072 tiles, 1D OBJ
    layout, 12 frames per badge × 16 tiles per frame × 16 badges = 3072).
  - NCLR file 28  → embossed-cream palette in sub-pal 2 (the dimmed silver-
    cream rendering the trainer card uses to display the badge plate). 16
    colours per sub-palette, NDS BGR555.

For each badge we take frame 0 (the static "held aloft" pose), greedy-RLE
into rectangles, drop palette-0 (NDS transparent), and emit:
  - apps/www/registry/ui/gym-badge-data.ts (palette + rects per variant)
  - apps/www/public/refs/gym-badge/<variant>.png (4× reference PNG)

Order in NCGR 46 (verified by visual shape match to canonical HG/SS badges):
  0 glacier, 1 hive, 2 plain, 3 fog, 4 storm, 5 mineral, 6 zephyr, 7 rising,
  8 boulder, 9 cascade, 10 thunder, 11 rainbow, 12 soul, 13 marsh, 14 volcano,
  15 earth.
"""

from __future__ import annotations
import struct
import zlib
from pathlib import Path

REPO    = Path(__file__).resolve().parents[1]
NARC    = REPO / ".refs/pokeheartgold/files/a/0/4/9"
OUT_TS  = REPO / "apps/www/registry/ui/gym-badge-data.ts"
OUT_PNG = REPO / "apps/www/public/refs/gym-badge"

NCGR_IDX = 46
NCLR_IDX = 28
SUB_PAL  = 2  # cream / silver embossed sub-palette

BADGE_ORDER: list[str] = [
    "glacier", "hive", "plain", "fog",
    "storm",   "mineral", "zephyr", "rising",
    "boulder", "cascade", "thunder", "rainbow",
    "soul",    "marsh",   "volcano", "earth",
]

# Canonical HG/SS hue (0..1) + saturation boost per badge. The dim palette
# from NCLR 28 sub-pal 2 is a near-monochrome silver-cream — we hue-rotate
# every entry to each badge's canonical tone and bump saturation to produce
# a "lit" palette without changing the underlying RLE rect indices.
BADGE_TONE: dict[str, tuple[float, float]] = {
    # variant     hue        sat-boost
    "zephyr":   (0.58, 0.55),  # cool silver-blue
    "hive":     (0.10, 0.55),  # tan/silver
    "plain":    (0.92, 0.65),  # pink
    "fog":      (0.78, 0.55),  # ghost purple
    "storm":    (0.10, 0.85),  # orange-yellow
    "mineral":  (0.50, 0.55),  # silver-teal
    "glacier":  (0.58, 0.70),  # ice blue
    "rising":   (0.13, 0.75),  # gold-silver
    "boulder":  (0.09, 0.50),  # tan grey
    "cascade":  (0.58, 0.95),  # bright water blue
    "thunder":  (0.14, 0.95),  # electric yellow
    "rainbow":  (0.97, 0.65),  # coral pink
    "soul":     (0.92, 0.70),  # heart pink
    "marsh":    (0.13, 0.75),  # marsh yellow-tan
    "volcano":  (0.02, 0.90),  # flame red
    "earth":    (0.30, 0.85),  # leaf green
}

FRAMES_PER_BADGE = 12
TILES_PER_FRAME  = 16  # 4 tile cols × 4 tile rows = 32×32


def parse_narc(path: Path) -> list[bytes]:
    data = path.read_bytes()
    btaf = 0x10
    n = struct.unpack_from("<I", data, btaf + 8)[0]
    btnf = btaf + struct.unpack_from("<I", data, btaf + 4)[0]
    gmif = btnf + struct.unpack_from("<I", data, btnf + 4)[0]
    payload = gmif + 8
    fat = btaf + 12
    return [
        data[payload + s:payload + e]
        for i in range(n)
        for s, e in [struct.unpack_from("<II", data, fat + i * 8)]
    ]


def parse_ncgr_4bpp(blob: bytes) -> tuple[int, int, list[int]]:
    """Decode a 4bpp tiled NCGR as a 4-tile-wide raster (32 px wide)."""
    assert blob[:4] == b"RGCN", "not NCGR"
    data_size = struct.unpack_from("<I", blob, 0x28)[0]
    raw = blob[0x30:0x30 + data_size]
    n_tiles = data_size // 32
    tcols = 4
    trows = n_tiles // tcols
    w, h = tcols * 8, trows * 8
    px = [0] * (w * h)
    for ti in range(n_tiles):
        tx = (ti % tcols) * 8
        ty = (ti // tcols) * 8
        tile = raw[ti * 32:(ti + 1) * 32]
        for py in range(8):
            for pi in range(0, 8, 2):
                b = tile[py * 4 + pi // 2]
                px[(ty + py) * w + tx + pi]     = b & 0xF
                px[(ty + py) * w + tx + pi + 1] = (b >> 4) & 0xF
    return w, h, px


def parse_nclr(blob: bytes) -> list[tuple[int, int, int]]:
    """Return all colours stored in the NCLR (BGR555 → RGB888)."""
    assert blob[:4] == b"RLCN", "not NCLR"
    data_size = struct.unpack_from("<I", blob, 0x20)[0]
    data_off  = struct.unpack_from("<I", blob, 0x24)[0]
    raw = blob[0x18 + data_off:0x18 + data_off + data_size]
    cols: list[tuple[int, int, int]] = []
    for i in range(len(raw) // 2):
        v = struct.unpack_from("<H", raw, i * 2)[0]
        r = ((v >> 0) & 0x1F) << 3
        g = ((v >> 5) & 0x1F) << 3
        b = ((v >> 10) & 0x1F) << 3
        cols.append((r, g, b))
    return cols


def crop_frame(px: list[int], w: int, badge_idx: int, frame_idx: int) -> tuple[list[int], int, int]:
    """Pull a 32×32 crop for a given badge + frame from the 4-tile-wide bank."""
    # Each badge owns 192 tiles (12 frames × 16 tiles). With 4 cols, that's
    # 48 tile-rows = 384 px tall per badge. Within a badge, frame f starts at
    # row f*4 (= y = f*32).
    y0 = badge_idx * FRAMES_PER_BADGE * 32 + frame_idx * 32
    out = [px[(y0 + dy) * w + dx] for dy in range(32) for dx in range(32)]
    return out, 32, 32


def trim(pixels: list[int], w: int, h: int) -> tuple[list[int], int, int, int, int]:
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
    nw, nh = maxx - minx + 1, maxy - miny + 1
    out = [0] * (nw * nh)
    for y in range(nh):
        for x in range(nw):
            out[y * nw + x] = pixels[(miny + y) * w + (minx + x)]
    return out, nw, nh, minx, miny


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


def rgb_to_hsv(r: int, g: int, b: int) -> tuple[float, float, float]:
    rf, gf, bf = r / 255.0, g / 255.0, b / 255.0
    mx, mn = max(rf, gf, bf), min(rf, gf, bf)
    v = mx
    d = mx - mn
    s = 0.0 if mx == 0 else d / mx
    if d == 0:
        h = 0.0
    elif mx == rf:
        h = ((gf - bf) / d) % 6
    elif mx == gf:
        h = (bf - rf) / d + 2
    else:
        h = (rf - gf) / d + 4
    return (h / 6.0) % 1.0, s, v


def hsv_to_rgb(h: float, s: float, v: float) -> tuple[int, int, int]:
    i = int(h * 6) % 6
    f = h * 6 - int(h * 6)
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)
    if i == 0: rf, gf, bf = v, t, p
    elif i == 1: rf, gf, bf = q, v, p
    elif i == 2: rf, gf, bf = p, v, t
    elif i == 3: rf, gf, bf = p, q, v
    elif i == 4: rf, gf, bf = t, p, v
    else: rf, gf, bf = v, p, q
    return (round(rf * 255), round(gf * 255), round(bf * 255))


def tint(rgb: tuple[int, int, int], hue: float, sat_boost: float) -> tuple[int, int, int]:
    """Hue-rotate a colour to `hue` and lift saturation by `sat_boost` (clamped to 1)."""
    _h, s, v = rgb_to_hsv(*rgb)
    new_s = min(1.0, max(s, sat_boost))
    return hsv_to_rgb(hue, new_s, v)


def write_png(path: Path, pixels: list[int], w: int, h: int, palette: list[tuple[int, int, int]], scale: int = 4) -> None:
    sw, sh = w * scale, h * scale
    raw = bytearray()
    for y in range(sh):
        raw.append(0)
        for x in range(sw):
            idx = pixels[(y // scale) * w + (x // scale)]
            if idx == 0:
                raw += b"\x00\x00\x00\x00"
            else:
                r, g, b = palette[idx]
                raw += bytes([r, g, b, 255])
    def chunk(tag: bytes, body: bytes) -> bytes:
        return struct.pack(">I", len(body)) + tag + body + struct.pack(">I", zlib.crc32(tag + body))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", sw, sh, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    iend = chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(sig + ihdr + idat + iend)


def main() -> None:
    files = parse_narc(NARC)
    w, h, pixels = parse_ncgr_4bpp(files[NCGR_IDX])
    nclr = parse_nclr(files[NCLR_IDX])
    palette = nclr[SUB_PAL * 16:(SUB_PAL + 1) * 16]
    if len(palette) < 16:
        palette += [(0, 0, 0)] * (16 - len(palette))

    OUT_PNG.mkdir(parents=True, exist_ok=True)
    out: dict[str, dict] = {}
    total_rects = 0
    for badge_idx, name in enumerate(BADGE_ORDER):
        crop, cw, ch = crop_frame(pixels, w, badge_idx, frame_idx=0)
        crop_t, tw, th, _, _ = trim(crop, cw, ch)
        rects = rle_rects(crop_t, tw, th)
        total_rects += len(rects)
        used = sorted({r[4] for r in rects})
        idx_map = {old: new + 1 for new, old in enumerate(used)}
        rects_remapped = [(x, y, rw, rh, idx_map[c]) for x, y, rw, rh, c in rects]
        slim_palette = [palette[u] for u in used]
        hue, sat_boost = BADGE_TONE[name]
        lit_palette = [tint(c, hue, sat_boost) for c in slim_palette]
        out[name] = {
            "w": tw, "h": th,
            "palette":    [hex_color(c) for c in slim_palette],
            "litPalette": [hex_color(c) for c in lit_palette],
            "rects": rects_remapped,
        }
        write_png(OUT_PNG / f"{name}.png",     crop_t, tw, th, palette,     scale=4)
        write_png(OUT_PNG / f"{name}-lit.png", crop_t, tw, th,
                  [tint(c, hue, sat_boost) for c in palette], scale=4)
        print(f"  {name:8s}  {tw}x{th}  rects={len(rects):3d}  palette={len(slim_palette)}")
    print(f"\ntotal rects across {len(out)} badges: {total_rects}")

    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    keys = list(out.keys())
    lines = [
        "/**",
        " * Auto-generated by scripts/extract-gym-badge.py",
        " * Source: pret/pokeheartgold files/a/0/4/9 (Trainer Card NARC).",
        " * NCGR 46 frame 0 + NCLR 28 sub-pal 2 (the embossed silver-cream the",
        " * trainer card actually paints the badge plates with).",
        " * Palette index 0 = transparent (NDS convention).",
        " */",
        "",
        "export type GymBadgeVariant = " + " | ".join(f'"{k}"' for k in keys) + ";",
        "",
        "export type GymBadgeEntry = {",
        "  /** native pixel width (after transparent-border crop) */",
        "  w: number;",
        "  /** native pixel height */",
        "  h: number;",
        "  /** unlit palette — silver-cream embossed silhouette (NCLR 28 sub-pal 2) */",
        "  palette: readonly string[];",
        "  /** lit palette — same shading hue-rotated to the badge's canonical tone */",
        "  litPalette: readonly string[];",
        "  /** [x, y, w, h, paletteIndex+1] tuples; palette-0 (transparent) is dropped */",
        "  rects: ReadonlyArray<readonly [number, number, number, number, number]>;",
        "};",
        "",
        "export const GYM_BADGES: Record<GymBadgeVariant, GymBadgeEntry> = {",
    ]
    for k in keys:
        e = out[k]
        rects_str = ",".join(f"[{r[0]},{r[1]},{r[2]},{r[3]},{r[4]}]" for r in e["rects"])
        pal_str  = ", ".join(f'"{c}"' for c in e["palette"])
        lit_str  = ", ".join(f'"{c}"' for c in e["litPalette"])
        lines.append(f"  {k}: {{")
        lines.append(f"    w: {e['w']}, h: {e['h']},")
        lines.append(f"    palette:    [{pal_str}],")
        lines.append(f"    litPalette: [{lit_str}],")
        lines.append(f"    rects: [{rects_str}],")
        lines.append(f"  }},")
    lines.append("};")
    lines.append("")
    OUT_TS.write_text("\n".join(lines))
    print(f"\nwrote {OUT_TS}")


if __name__ == "__main__":
    main()
