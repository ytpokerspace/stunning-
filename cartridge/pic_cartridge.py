"""POKÉLLM PIC 0.1: deterministic PNG cartridge container.

The PNG stores a visible pixel-art cover plus a canonical JSON game payload in
a PNG tEXt chunk. The SHA-256 digest detects accidental or malicious payload
changes; it is not a creator signature or proof of ownership.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import struct
import zlib
from pathlib import Path

SIG = b"\x89PNG\r\n\x1a\n"
KEY = b"POKELLM_CARTRIDGE"
VERSION = "PIC-0.1"
STARTERS = [
    {"id":"emberkit","name":"Emberkit","element":"fire","hp":40,"attack":12,"defense":8,"speed":11},
    {"id":"brooklet","name":"Brooklet","element":"water","hp":44,"attack":9,"defense":12,"speed":8},
    {"id":"mossling","name":"Mossling","element":"nature","hp":46,"attack":10,"defense":11,"speed":7},
]

def _chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)

def _png_rgb(width: int, height: int, pixels: bytes) -> bytes:
    rows = b"".join(b"\x00" + pixels[y*width*3:(y+1)*width*3] for y in range(height))
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return SIG + _chunk(b"IHDR", ihdr) + _chunk(b"IDAT", zlib.compress(rows, 9)) + _chunk(b"IEND", b"")

def _cover() -> bytes:
    # Original geometric pixel-art cover; payload is separate from the art.
    w = h = 512
    p = bytearray(w*h*3)
    for y in range(h):
        for x in range(w):
            i = (y*w+x)*3
            if y < 150: c = (19, 31, 59)
            elif y < 350: c = (27, 48, 78)
            else: c = (13, 24, 47)
            # pixel-art creature silhouette / glowing core
            dx, dy = x-256, y-267
            if dx*dx/ (105*105) + dy*dy/(90*90) < 1:
                c = (91, 53, 53)
            if (x//16 + y//16) % 2 == 0 and 220 < y < 315 and 205 < x < 307:
                c = (240, 139, 69)
            if 232 < x < 280 and 240 < y < 290:
                c = (255, 214, 116)
            if y > 380 and 70 < x < 442 and (x//24)%2 == 0:
                c = (35, 73, 105)
            p[i:i+3] = bytes(c)
    return _png_rgb(w, h, bytes(p))

def _canonical_payload() -> dict:
    return {
        "format":"POKELLM-PIC",
        "version":VERSION,
        "cartridge_id":"PIC01-POCKET-WILDS-001",
        "title":"POKÉLLM: Pocket Wilds",
        "creator":{"name":"William Gunnell Cox","role":"Original creator and architecture author"},
        "contributors":[{"name":"Nathaniel Baker Rudd","role":"Emoji coding contributor; contribution scope to be confirmed by contributors"}],
        "license":{"status":"UNASSIGNED_ALL_RIGHTS_RESERVED","software":None,"artwork":None,
                   "note":"No open-source or Creative Commons license is granted by this cartridge."},
        "rules":{
            "element_cycle":{"fire":"nature","nature":"water","water":"fire"},
            "strong_multiplier":2.0,"weak_multiplier":0.5,"same_element_bonus":1.5,
            "damage":"max(1, floor((move_power + attack - floor(defense/2)) * STAB * matchup * random_factor))",
            "random_factor":[0.85,1.0],"turn_order":"descending speed; ties by player slot",
            "actions":["attack","guard","heal","switch"],
            "win":"opponent team has no able creatures"
        },
        "starters":STARTERS,
        "save_state":{
            "status":"new_game","turn":1,"active_player":1,
            "players":[
                {"slot":1,"team":["emberkit"],"active":0,"hp":[40]},
                {"slot":2,"team":["mossling"],"active":0,"hp":[46]}
            ],
            "pending_actions":[],"last_sequence":{"1":0,"2":0},"history":[]
        },
        "integrity":{"algorithm":"sha256","digest":""}
    }

def _seal(payload: dict) -> bytes:
    payload = json.loads(json.dumps(payload, ensure_ascii=False))
    payload["integrity"]["digest"] = ""
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",",":")).encode("utf-8")
    payload["integrity"]["digest"] = hashlib.sha256(raw).hexdigest()
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",",":")).encode("utf-8")

def _png_chunks(png: bytes):
    if not png.startswith(SIG): raise ValueError("not a PNG")
    pos = len(SIG)
    while pos < len(png):
        if pos + 12 > len(png): raise ValueError("truncated PNG chunk")
        n = struct.unpack(">I", png[pos:pos+4])[0]
        kind = png[pos+4:pos+8]
        end = pos + 12 + n
        if end > len(png): raise ValueError("truncated PNG data")
        data = png[pos+8:pos+8+n]
        crc = struct.unpack(">I", png[pos+8+n:end])[0]
        if zlib.crc32(kind+data) & 0xffffffff != crc: raise ValueError("PNG chunk CRC mismatch")
        yield kind, data
        pos = end
        if kind == b"IEND": break

def build_cartridge(path: str | Path) -> str:
    payload = _seal(_canonical_payload())
    png = _cover()
    # Insert a standard PNG tEXt chunk immediately before IEND.
    out = bytearray(SIG)
    for kind, data in _png_chunks(png):
        if kind == b"IEND":
            out.extend(_chunk(b"tEXt", KEY + b"\x00" + payload))
        out.extend(_chunk(kind, data))
    Path(path).write_bytes(out)
    return hashlib.sha256(out).hexdigest()

def decode_cartridge(path: str | Path) -> dict:
    found = []
    for kind, data in _png_chunks(Path(path).read_bytes()):
        if kind == b"tEXt" and data.startswith(KEY+b"\x00"):
            found.append(data[len(KEY)+1:])
    if len(found) != 1: raise ValueError("expected exactly one POKÉLLM cartridge payload")
    payload = json.loads(found[0].decode("utf-8"))
    expected = payload.get("integrity",{}).get("digest")
    payload["integrity"]["digest"] = ""
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",",":")).encode("utf-8")
    actual = hashlib.sha256(raw).hexdigest()
    if not expected or actual != expected: raise ValueError("cartridge payload SHA-256 mismatch")
    payload["integrity"]["digest"] = expected
    if payload.get("version") != VERSION: raise ValueError("unsupported cartridge version")
    return payload

def main():
    ap = argparse.ArgumentParser(description="Build or inspect a POKÉLLM PIC PNG cartridge")
    ap.add_argument("command", choices=("build","inspect"))
    ap.add_argument("path", help="PNG path")
    args = ap.parse_args()
    if args.command == "build":
        digest = build_cartridge(args.path)
        print(json.dumps({"created":args.path,"png_sha256":digest},indent=2))
    else:
        print(json.dumps(decode_cartridge(args.path),ensure_ascii=False,indent=2))

if __name__ == "__main__":
    main()
