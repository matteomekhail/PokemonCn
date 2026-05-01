#!/usr/bin/env python3
"""Render NCGRs 62..77 of files/a/0/4/9 as 32×32 sprites against every NCLR
palette (0..15). The 16 NCGRs are clearly the 8 Johto + 8 Kanto badges; we
just need to find the right palette pairing for each."""
from __future__ import annotations
import struct, zlib
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
NARC = REPO / ".refs/pokeheartgold/files/a/0/4/9"
OUT = REPO / "scripts/_dump_badges"
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


def parse_ncgr_first_32x32(blob):
    char_off = 0x10
    raw = blob[char_off + 0x20:char_off + 0x20 + 32 * 16]  # first 16 tiles = 32x32
    px = [0] * (32 * 32)
    for ti in range(16):
        tx = (ti % 4) * 8
        ty = (ti // 4) * 8
        tile = raw[ti * 32:(ti + 1) * 32]
        for py in range(8):
            for px_i in range(0, 8, 2):
                b = tile[py * 4 + px_i // 2]
                px[(ty + py) * 32 + tx + px_i] = b & 0xF
                px[(ty + py) * 32 + tx + px_i + 1] = (b >> 4) & 0xF
    return px


def parse_nclr(blob):
    pal_off = 0x10
    data_size = struct.unpack_from("<I", blob, pal_off + 0x18)[0]
    raw = blob[pal_off + 0x18:pal_off + 0x18 + data_size]
    cols = []
    for i in range(len(raw) // 2):
        v = struct.unpack_from("<H", raw, i * 2)[0]
        r = ((v >> 0) & 0x1F) << 3
        g = ((v >> 5) & 0x1F) << 3
        b = ((v >> 10) & 0x1F) << 3
        cols.append((r, g, b))
    return cols


def write_png(path, pixels, w, h, palette, scale=4):
    sw, sh = w * scale, h * scale
    raw = bytearray()
    for y in range(sh):
        raw.append(0)
        for x in range(sw):
            idx = pixels[(y // scale) * w + (x // scale)]
            if idx == 0:
                raw += b"\x00\x00\x00\x00"
            elif idx >= len(palette):
                raw += b"\xFF\x00\xFF\xFF"
            else:
                r, g, b = palette[idx]
                raw += bytes([r, g, b, 255])
    def chunk(tag, body):
        return struct.pack(">I", len(body)) + tag + body + struct.pack(">I", zlib.crc32(tag + body))
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", sw, sh, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    iend = chunk(b"IEND", b"")
    path.write_bytes(sig + ihdr + idat + iend)


files = parse_narc(NARC)
# Pair each NCGR 62..77 with each palette 0..15 (16x16 = 256 PNGs)
for ncgr_idx in range(62, 78):
    px = parse_ncgr_first_32x32(files[ncgr_idx])
    for pal_idx in range(16):
        pal_blob = files[pal_idx]
        if pal_blob[:4] != b"RLCN":
            continue
        pal = parse_nclr(pal_blob)
        if len(pal) < 16:
            pal = pal + [(0, 0, 0)] * (16 - len(pal))
        write_png(OUT / f"badge_ncgr{ncgr_idx:02d}_pal{pal_idx:02d}.png", px, 32, 32, pal[:16], scale=4)
print(f"wrote {16 * 16} candidate PNGs to {OUT}")
