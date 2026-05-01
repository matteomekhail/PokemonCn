#!/usr/bin/env python3
"""Dump plist_gra NCGR/NCLR pairs to a PNG strip so we can eyeball where the
status condition icons sit before extracting them."""
from pathlib import Path
import struct, zlib

REPO = Path(__file__).resolve().parents[1]
PG = REPO / ".refs/pokeheartgold/files/graphic/plist_gra"
OUT = REPO / "scripts/_dump_plist_gra"
OUT.mkdir(parents=True, exist_ok=True)


def parse_ncgr_pixels(path: Path):
    data = path.read_bytes()
    assert data[:4] == b"RGCN"
    char_off = 0x10
    assert data[char_off:char_off + 4] == b"RAHC"
    data_size = struct.unpack_from("<I", data, char_off + 0x18)[0]
    raw = data[char_off + 0x20:char_off + 0x20 + data_size]
    n_tiles = data_size // 32
    # default to 32-tile-wide grid for visual inspection
    tcols = 32 if n_tiles % 32 == 0 else 16 if n_tiles % 16 == 0 else 8
    trows = (n_tiles + tcols - 1) // tcols
    w, h = tcols * 8, trows * 8
    pixels = [0] * (w * h)
    for ti in range(n_tiles):
        tx = (ti % tcols) * 8
        ty = (ti // tcols) * 8
        tile = raw[ti * 32:(ti + 1) * 32]
        for py in range(8):
            for px in range(0, 8, 2):
                b = tile[py * 4 + px // 2]
                lo, hi = b & 0xF, (b >> 4) & 0xF
                pixels[(ty + py) * w + tx + px] = lo
                pixels[(ty + py) * w + tx + px + 1] = hi
    return w, h, pixels


def parse_nclr(path: Path):
    data = path.read_bytes()
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
                if idx >= len(palette):
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
    # group 1: ncgr=02 + nclr=04 (the box graphics)
    # group 2: ncgr=07 + nclr=08 (sprite set we care about — likely status icons)
    # group 3: ncgr=11 + nclr=13 (other sprites)
    pairs = [(2, 4, "g1_box"), (7, 8, "g2_likely_status"), (11, 13, "g3_other")]
    for ng, nc, name in pairs:
        ncgr = PG / f"plist_gra_{ng:08d}.NCGR"
        nclr = PG / f"plist_gra_{nc:08d}.NCLR"
        w, h, px = parse_ncgr_pixels(ncgr)
        pal = parse_nclr(nclr)
        # try every sub-palette of 16
        for sp in range(max(1, len(pal) // 16)):
            sub = pal[sp * 16:sp * 16 + 16]
            if len(sub) < 16:
                sub = sub + [(0, 0, 0)] * (16 - len(sub))
            write_png(OUT / f"{name}_pal{sp}.png", px, w, h, sub, scale=3)
            print(f"  wrote {name}_pal{sp}.png  ({w}x{h}, palette {sp})")
    print(f"\noutput in {OUT}")


if __name__ == "__main__":
    main()
