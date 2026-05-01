#!/usr/bin/env python3
"""
Extract HG/SS battle status condition chips (PRZ, FRZ, SLP, PSN, BRN).

Sources:
  • Pixel data: hard-coded in src/battle/battle_hp_bar_data.h, tiles 0x29..0x37
    (5 chips × 3 tiles each, 24×8 px per chip).
  • Palette:   NARC files/a/0/0/8, member 71 (0x47) — same NCLR HpBar uses.

Renders each chip into its own RLE rect list + slim palette, emits a TS
data file ready to drop into the StatusBadge component, and writes 4× PNG
references for the docs page.
"""

from __future__ import annotations
import re
import struct
import zlib
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
HP_BAR_H = REPO / ".refs/pokeheartgold/src/battle/battle_hp_bar_data.h"
NARC = REPO / ".refs/pokeheartgold/files/a/0/0/8"
OUT_TS = REPO / "apps/www/registry/ui/status-badge-data.ts"
OUT_PNG = REPO / "apps/www/public/refs/status-badge"

# Tile groups: [start_tile, glyph palette idx, body palette idx].
# Source palette indices (file/a/0/0/8 member 71):
#    1=#707070  2=#B8B8B8  3=#989898  4=#F8F8F8
#    7=#B06808  8=#F8B000  9=#A83038  10=#F85828
#   11=#3060D8 12=#4890F8 13=#D858D0 15=#E0E0E0
# Per chip we know which source-palette index draws the GLYPH (3-letter text)
# and which draws the BODY fill. We repaint glyph pixels → body before RLE so
# the silhouette is letter-free; the component then renders the label as a
# real React text node on top (selectable, just like AreaBanner / TypeBadge).
# Each letter sits on top of an inner highlight halo of a different palette
# index from the glyph itself; both must be repainted to body for the SVG to
# end up letterless. Halo is white (#F8F8F8 = 4) for the bright chips and
# mid-gray (#989898 = 3) for SLP (which has white as its body, so the halo
# uses a darker tone to stay visible).
CHIPS: list[tuple[str, int, int, int, int]] = [
    # name,   tile_start, glyph_src_idx, halo_src_idx, body_src_idx
    ("PAR",   0x29,        7,             4,            8),
    ("FRZ",   0x2C,       11,             4,           12),
    ("SLP",   0x2F,        1,             3,            4),
    ("PSN",   0x32,        9,             4,           13),
    ("BRN",   0x35,        9,             4,           10),
]


def parse_battle_hp_bar_data(path: Path) -> list[bytes]:
    """Extract the gBattleHpBar_RawGraphicComponents byte array — one bytes() per 32-byte tile."""
    text = path.read_text()
    m = re.search(r"gBattleHpBar_RawGraphicComponents\[\]\s*=\s*\{(.+?)\};", text, re.S)
    if not m:
        raise RuntimeError("byte array not found")
    body = m.group(1)
    body = re.sub(r"//[^\n]*", "", body)
    nums = re.findall(r"0x([0-9A-Fa-f]{2})", body)
    raw = bytes(int(n, 16) for n in nums)
    return [raw[i:i + 32] for i in range(0, len(raw), 32)]


def lz77_decompress(data: bytes) -> bytes:
    assert data[0] == 0x10, "expected LZ77 mode 0x10"
    decompressed_size = data[1] | (data[2] << 8) | (data[3] << 16)
    src = 4
    out = bytearray()
    while len(out) < decompressed_size:
        flags = data[src]; src += 1
        for bit in range(8):
            if len(out) >= decompressed_size:
                break
            if flags & (0x80 >> bit):
                lo = data[src]; hi = data[src + 1]; src += 2
                length = (lo >> 4) + 3
                offset = ((lo & 0x0F) << 8 | hi) + 1
                start = len(out) - offset
                for k in range(length):
                    out.append(out[start + k])
            else:
                out.append(data[src]); src += 1
    return bytes(out[:decompressed_size])


def parse_narc(path: Path) -> list[bytes]:
    data = path.read_bytes()
    assert data[:4] == b"NARC"
    btaf_off = 0x10
    assert data[btaf_off:btaf_off + 4] == b"BTAF"
    n_files = struct.unpack_from("<I", data, btaf_off + 8)[0]
    fat_start = btaf_off + 12
    files: list[bytes] = []
    # locate GMIF (image): scan past BTAF + BTNF
    btnf_off = btaf_off + struct.unpack_from("<I", data, btaf_off + 4)[0]
    assert data[btnf_off:btnf_off + 4] == b"BTNF"
    gmif_off = btnf_off + struct.unpack_from("<I", data, btnf_off + 4)[0]
    assert data[gmif_off:gmif_off + 4] == b"GMIF"
    payload_start = gmif_off + 8
    for i in range(n_files):
        s, e = struct.unpack_from("<II", data, fat_start + i * 8)
        files.append(data[payload_start + s:payload_start + e])
    return files


def parse_nclr_bytes(data: bytes) -> list[tuple[int, int, int]]:
    assert data[:4] == b"RLCN"
    pal_off = 0x10
    assert data[pal_off:pal_off + 4] == b"TTLP"
    data_size = struct.unpack_from("<I", data, pal_off + 0x18)[0]
    raw = data[pal_off + 0x18:pal_off + 0x18 + data_size]
    cols = []
    for i in range(len(raw) // 2):
        v = struct.unpack_from("<H", raw, i * 2)[0]
        r = ((v >> 0) & 0x1F) << 3
        g = ((v >> 5) & 0x1F) << 3
        b = ((v >> 10) & 0x1F) << 3
        cols.append((r, g, b))
    return cols


def tile_to_pixels(tile: bytes) -> list[int]:
    px = [0] * 64
    for py in range(8):
        for px_i in range(0, 8, 2):
            b = tile[py * 4 + px_i // 2]
            px[py * 8 + px_i] = b & 0x0F
            px[py * 8 + px_i + 1] = (b >> 4) & 0x0F
    return px


def chip_pixels(tiles: list[bytes], start: int) -> tuple[list[int], int, int]:
    """Compose 3 horizontal 8x8 tiles → 24x8 pixel buffer."""
    w, h = 24, 8
    px = [0] * (w * h)
    for ti in range(3):
        tpx = tile_to_pixels(tiles[start + ti])
        ox = ti * 8
        for y in range(8):
            for x in range(8):
                px[y * w + ox + x] = tpx[y * 8 + x]
    return px, w, h


def trim(pixels: list[int], w: int, h: int) -> tuple[list[int], int, int]:
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if pixels[y * w + x] != 0:
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
    if maxx < 0:
        return [0], 1, 1
    nw = maxx - minx + 1
    nh = maxy - miny + 1
    out = [0] * (nw * nh)
    for y in range(nh):
        for x in range(nw):
            out[y * nw + x] = pixels[(miny + y) * w + (minx + x)]
    return out, nw, nh


def rle_rects(pixels, w, h):
    seen = [False] * (w * h)
    rects = []
    for y in range(h):
        for x in range(w):
            if seen[y * w + x]:
                continue
            c = pixels[y * w + x]
            if c == 0:
                seen[y * w + x] = True
                continue
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


def write_png(path: Path, pixels, w, h, palette, scale=4):
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
    def chunk(tag, body):
        return struct.pack(">I", len(body)) + tag + body + struct.pack(">I", zlib.crc32(tag + body))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", sw, sh, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    iend = chunk(b"IEND", b"")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(sig + ihdr + idat + iend)


def main():
    OUT_PNG.mkdir(parents=True, exist_ok=True)
    tiles = parse_battle_hp_bar_data(HP_BAR_H)
    print(f"parsed {len(tiles)} tiles from battle_hp_bar_data.h")

    files = parse_narc(NARC)
    print(f"NARC has {len(files)} files; member 71 size = {len(files[71])}")
    blob = files[71]
    if blob[0] == 0x10:
        blob = lz77_decompress(blob)
    palette = parse_nclr_bytes(blob)
    # NDS: first sub-palette is the live one — show 16 colours so we can see
    print("palette[0..15]:", [hex_color(c) for c in palette[:16]])

    out: dict[str, dict] = {}
    for name, start, glyph_idx, halo_idx, body_idx in CHIPS:
        px_full, w, h = chip_pixels(tiles, start)
        # write the reference PNG from the FULL pixel data (with the glyph),
        # so the docs page shows the chip exactly as the game draws it
        ptrim, ptw, pth = trim(px_full, w, h)
        write_png(OUT_PNG / f"{name.lower()}.png", ptrim, ptw, pth, palette, scale=4)
        # repaint glyph + halo pixels to body so the runtime SVG is a clean
        # letterless silhouette — the user-facing label sits on top as a real
        # React text node (selectable, copyable)
        px = [body_idx if (v == glyph_idx or v == halo_idx) else v for v in px_full]
        px_t, tw, th = trim(px, w, h)
        rects = rle_rects(px_t, tw, th)
        used = sorted({r[4] for r in rects})
        idx_map = {old: new + 1 for new, old in enumerate(used)}
        rects_remapped = [(x, y, rw, rh, idx_map[c]) for x, y, rw, rh, c in rects]
        slim = [palette[u] for u in used]
        out[name] = {
            "w": tw, "h": th,
            "palette": [hex_color(c) for c in slim],
            "rects": rects_remapped,
            "glyph": hex_color(palette[glyph_idx]),
            "body":  hex_color(palette[body_idx]),
        }
        print(f"  {name}  {tw}x{th}  rects={len(rects):3d}  glyph={hex_color(palette[glyph_idx])}  body={hex_color(palette[body_idx])}")

    # Emit TS data
    keys = list(out.keys())
    lines = [
        "/**",
        " * Auto-generated by scripts/extract-status-badge.py",
        " * Source: pret/pokeheartgold src/battle/battle_hp_bar_data.h tiles 0x29..0x37",
        " * Palette: files/a/0/0/8 NARC member 71 (0x47).",
        " * 5 battle status chips — pixel data is the same chip silhouette per status,",
        " * only the colour pair differs (chip body + 3-letter glyph).",
        " */",
        "",
        "export type StatusKind = " + " | ".join(f'"{k.lower()}"' for k in keys) + ";",
        "",
        "export type StatusEntry = {",
        "  /** native pixel width */",
        "  w: number;",
        "  /** native pixel height */",
        "  h: number;",
        "  /** colours — palette[0] of the source NCLR is omitted (NDS transparent) */",
        "  palette: readonly string[];",
        "  /** [x, y, w, h, paletteIndex+1]; chip silhouette only — the 3-letter glyph is NOT here */",
        "  rects: ReadonlyArray<readonly [number, number, number, number, number]>;",
        "  /** suggested colour for the overlaid label text (the in-game glyph colour) */",
        "  glyph: string;",
        "  /** body fill colour, if you want to colour-key extras to this chip */",
        "  body: string;",
        "};",
        "",
        "export const STATUS_CHIPS: Record<StatusKind, StatusEntry> = {",
    ]
    for k in keys:
        e = out[k]
        rects_str = ",".join(f"[{r[0]},{r[1]},{r[2]},{r[3]},{r[4]}]" for r in e["rects"])
        pal_str = ", ".join(f'"{c}"' for c in e["palette"])
        lines.append(f'  {k.lower()}: {{')
        lines.append(f'    w: {e["w"]}, h: {e["h"]},')
        lines.append(f'    palette: [{pal_str}],')
        lines.append(f'    rects: [{rects_str}],')
        lines.append(f'    glyph: "{e["glyph"]}",')
        lines.append(f'    body: "{e["body"]}",')
        lines.append(f'  }},')
    lines.append("};")
    lines.append("")
    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text("\n".join(lines))
    print(f"\nwrote {OUT_TS}")


if __name__ == "__main__":
    main()
