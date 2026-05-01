#!/usr/bin/env python3
"""
Dump every NCGR member in `files/a/0/4/9` (the Trainer Card NARC) to a PNG
strip so we can eyeball where the 16 gym badges live. Each NCGR is paired
with each NCLR in the same NARC and rendered at multiple sub-palettes; we
pick the most plausible-looking one by hand later.
"""

from __future__ import annotations
import struct
import zlib
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
NARC = REPO / ".refs/pokeheartgold/files/a/0/4/9"
OUT = REPO / "scripts/_dump_a049"
OUT.mkdir(parents=True, exist_ok=True)


def lz77(data: bytes) -> bytes:
    if data[0] != 0x10:
        return data
    n = data[1] | (data[2] << 8) | (data[3] << 16)
    src = 4
    out = bytearray()
    while len(out) < n:
        flags = data[src]; src += 1
        for bit in range(8):
            if len(out) >= n: break
            if flags & (0x80 >> bit):
                lo = data[src]; hi = data[src + 1]; src += 2
                length = (lo >> 4) + 3
                offset = ((lo & 0x0F) << 8 | hi) + 1
                start = len(out) - offset
                for k in range(length):
                    out.append(out[start + k])
            else:
                out.append(data[src]); src += 1
    return bytes(out[:n])


def parse_narc(path: Path) -> list[bytes]:
    data = path.read_bytes()
    btaf_off = 0x10
    n_files = struct.unpack_from("<I", data, btaf_off + 8)[0]
    btnf_off = btaf_off + struct.unpack_from("<I", data, btaf_off + 4)[0]
    gmif_off = btnf_off + struct.unpack_from("<I", data, btnf_off + 4)[0]
    payload_start = gmif_off + 8
    fat_start = btaf_off + 12
    files = []
    for i in range(n_files):
        s, e = struct.unpack_from("<II", data, fat_start + i * 8)
        files.append(data[payload_start + s:payload_start + e])
    return files


def parse_ncgr(blob: bytes) -> tuple[int, int, list[int]] | None:
    if blob[:4] != b"RGCN": return None
    char_off = 0x10
    if blob[char_off:char_off + 4] != b"RAHC": return None
    data_size = struct.unpack_from("<I", blob, char_off + 0x18)[0]
    raw = blob[char_off + 0x20:char_off + 0x20 + data_size]
    n_tiles = data_size // 32
    # Try common shapes: 4×4 tiles, 8×8, 16×16, etc. Default to 8 tiles wide.
    tcols = 8 if n_tiles % 8 == 0 else 4
    trows = (n_tiles + tcols - 1) // tcols
    w, h = tcols * 8, trows * 8
    px = [0] * (w * h)
    for ti in range(n_tiles):
        tx = (ti % tcols) * 8
        ty = (ti // tcols) * 8
        tile = raw[ti * 32:(ti + 1) * 32]
        for py in range(8):
            for px_i in range(0, 8, 2):
                b = tile[py * 4 + px_i // 2]
                px[(ty + py) * w + tx + px_i] = b & 0xF
                px[(ty + py) * w + tx + px_i + 1] = (b >> 4) & 0xF
    return (w, h, px)


def parse_nclr(blob: bytes) -> list[tuple[int, int, int]] | None:
    if blob[:4] != b"RLCN": return None
    pal_off = 0x10
    if blob[pal_off:pal_off + 4] != b"TTLP": return None
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


def write_png(path: Path, pixels, w, h, palette, scale=3):
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


def main():
    files = parse_narc(NARC)
    print(f"NARC has {len(files)} files")
    # decompress + classify
    parsed = []
    for i, blob in enumerate(files):
        b = lz77(blob)
        if b[:4] == b"RGCN":
            r = parse_ncgr(b)
            if r:
                parsed.append((i, "NCGR", r, len(b)))
        elif b[:4] == b"RLCN":
            r = parse_nclr(b)
            if r:
                parsed.append((i, "NCLR", r, len(b)))
        else:
            parsed.append((i, b[:4].decode(errors="replace"), None, len(b)))
    for i, kind, r, sz in parsed:
        if kind == "NCGR" and r:
            print(f"  {i:3d} NCGR {r[0]}x{r[1]} ({sz}b)")
        elif kind == "NCLR" and r:
            print(f"  {i:3d} NCLR {len(r)}-colour ({sz}b)")
        else:
            print(f"  {i:3d} {kind} ({sz}b)")

    # Find palettes; pair every NCGR with the first 1-2 NCLRs
    palettes = [(i, r) for i, k, r, _ in parsed if k == "NCLR" and r]
    ncgrs = [(i, r) for i, k, r, _ in parsed if k == "NCGR" and r]
    print(f"\n{len(palettes)} palettes, {len(ncgrs)} NCGRs")

    for ncgr_i, (w, h, px) in ncgrs:
        for pal_i, pal in palettes[:3]:
            for sub in range(min(4, max(1, len(pal) // 16))):
                spal = pal[sub * 16:sub * 16 + 16]
                if len(spal) < 16:
                    spal = spal + [(0, 0, 0)] * (16 - len(spal))
                name = f"ncgr{ncgr_i:03d}_pal{pal_i:03d}_sub{sub}.png"
                write_png(OUT / name, px, w, h, spal, scale=3)
    print(f"\nwrote PNGs to {OUT}")


if __name__ == "__main__":
    main()
