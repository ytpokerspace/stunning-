# PIC 0.1 — POKÉLLM Image Cartridge

This branch adds the first deterministic PNG-cartridge container prototype.

## Build and inspect

Requires Python 3.10+ and only the standard library:

```bash
python cartridge/pic_cartridge.py build POKELLM-PIC-0.1.png
python cartridge/pic_cartridge.py inspect POKELLM-PIC-0.1.png
```

The PNG contains:
- A visible original pixel-art cover.
- A standard PNG `tEXt` chunk named `POKELLM_CARTRIDGE` containing canonical UTF-8 JSON.
- Cartridge version, unique ID, creator/contributor metadata, public rules, starter definitions, initial save state, and SHA-256 integrity digest.

## Important interoperability boundary

A normal image viewer displays the cover but does not expose the embedded payload. An LLM image-vision input may also discard PNG ancillary metadata during preprocessing. For reliable restore/play/update/export, use the decoder to extract the payload and pass the decoded JSON to the game engine or a compatible LLM workflow. The image is self-contained as a file; it is not self-executing.

## Integrity and attribution

SHA-256 detects payload changes; it does not authenticate the creator or prove ownership. A future signed release can add an Ed25519 signature and published public key. The image records William Gunnell Cox as original creator and Nathaniel Baker Rudd as an emoji-coding contributor, with contributor scope explicitly subject to agreement.

## Licensing status

No license has been assigned. The cartridge records `UNASSIGNED_ALL_RIGHTS_RESERVED`. Do not add an open-source license until the rights holders agree on the exact terms. Public release does not establish patent novelty or freedom from prior art.

## Current scope

PIC 0.1 is the initial container and state-format prototype. It is not yet a complete portable game runtime, a cross-provider LLM execution standard, or a digital signature system. The existing browser game remains a separate playable prototype until a tested import/export bridge is added.
