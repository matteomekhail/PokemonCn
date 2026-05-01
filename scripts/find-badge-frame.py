#!/usr/bin/env python3
"""Find the densest 32×32 region in each badge NCGR — that's almost certainly
the static "badge held up" frame, with the sparkle/rotation frames being more
sparse."""
from pathlib import Path
import struct, zlib

REPO = Path(__file__).resolve().parents[1]
NARC = REPO / ".refs/pokeheartgold/files/a/0/4/9"
OUT = REPO / "scripts/_badge_frames"
OUT.mkdir(parents=True, exist_ok=True)


def parse_narc(path):
    data = path.read_bytes()
    btaf = 0x10
    n = struct.unpack_from("<I", data, btaf + 8)[0]
    btnf = btaf + struct.unpack_from("<I", data, btaf + 4)[0]
    gmif = btnf + struct.unpack_from("<I", data, btnf + 4)[0]
    payload = gmif + 8
    fat = btaf + 12
    return [data[payload + s:payload + e] for i in range(n) for s, e in [struct.unpack_from("<II", data, fat + i * 8)]]


def ncgr_pixels(blob, tile_cols=4):
    char_off = 0x10
    data_size = struct.unpack_from("<I", blob, char_off + 0x18)[0]
    raw = blob[char_off + 0x20:char_off + 0x20 + data_size]
    n_tiles = data_size // 32
    trows = (n_tiles + tile_cols - 1) // tile_cols
    w, h = tile_cols * 8, trows * 8
    px = [0] * (w * h)
    for ti in range(n_tiles):
        tx = (ti % tile_cols) * 8
        ty = (ti // tile_cols) * 8
        tile = raw[ti * 32:(ti + 1) * 32]
        for py in range(8):
            for px_i in range(0, 8, 2):
                b = tile[py * 4 + px_i // 2]
                px[(ty + py) * w + tx + px_i] = b & 0xF
                px[(ty + py) * w + tx + px_i + 1] = (b >> 4) & 0xF
    return w, h, px


def parse_nclr(blob):
    pal_off = 0x10
    data_size = struct.unpack_from("<I", blob, pal_off + 0x18)[0]
    raw = blob[pal_off + 0x18:pal_off + 0x18 + data_size]
    cols = []
    for i in range(len(raw) // 2):
        v = struct.unpack_from("<H", raw, i * 2)[0]
        cols.append((((v >> 0) & 0x1F) << 3, ((v >> 5) & 0x1F) << 3, ((v >> 10) & 0x1F) << 3))
    return cols


def write_png(path, pixels, w, h, palette, scale=4):
    sw, sh = w * scale, h * scale
    raw = bytearray()
    for y in range(sh):
        raw.append(0)
        for x in range(sw):
            idx = pixels[(y // scale) * w + (x // scale)]
            if idx == 0: raw += b"\x00\x00\x00\x00"
            elif idx >= len(palette): raw += b"\xFF\x00\xFF\xFF"
            else: r, g, b = palette[idx]; raw += bytes([r, g, b, 255])
    def chunk(t, b): return struct.pack(">I", len(b)) + t + b + struct.pack(">I", zlib.crc32(t + b))
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", sw, sh, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b""))


files = parse_narc(NARC)
for n in range(62, 78):
    w, h, px = ncgr_pixels(files[n])
    # Find the 32-pixel-tall band (sliding window) with the highest density
    densities = []
    for y0 in range(0, h - 32 + 1, 4):
        cnt = sum(1 for y in range(y0, y0 + 32) for x in range(w) if px[y * w + x] != 0)
        densities.append((cnt, y0))
    densities.sort(reverse=True)
    # Top 3 densest 32×32 windows
    for rank, (cnt, y0) in enumerate(densities[:3]):
        crop = [px[(y0 + y) * w + x] for y in range(32) for x in range(32)]
        # try every palette
        for p in range(16):
            pal = parse_nclr(files[p])
            if len(pal) < 16: pal = pal + [(0, 0, 0)] * (16 - len(pal))
            write_png(OUT / f"ncgr{n:02d}_y{y0:03d}_pal{p:02d}.png", crop, 32, 32, pal[:16], scale=4)
    print(f"ncgr{n}: top density y={densities[0][1]} (px={densities[0][0]})")
EOF
