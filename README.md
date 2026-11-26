# POKÉLLM — Emoji Glyph Engine

An emoji-driven creature battle project with a Python reference engine, strict emoji protocol, and a playable browser prototype.

## Public repository boundary

This repository contains the general game engine and public game materials. **The private Founder’s Pack is deliberately excluded.** William Gunnell Cox and Nathaniel Baker Rudd keep their customized founder creatures, crown designs, private movesets, special abilities, and personal roster details private. No founder-only creature data or artwork is stored in this public repository.

## Play the browser prototype

Open [web/index.html](web/index.html) in a modern browser. The mobile-friendly prototype includes three original public starter creatures, three-creature teams, large touch controls, health displays, switching, attack, guard, limited special energy, and limited healing supplies. Defeated creatures are automatically replaced when teammates remain.

The browser prototype is local single-player versus a simple computer opponent. It is not yet remote multiplayer, a hosted LLM connector, or a complete collection/adventure game. GitHub Pages deployment is configured in `.github/workflows/pages.yml`; publishing requires GitHub Pages to be enabled for the repository.

## LLM / emoji mode

1. Load `GLYPH-SPEC.md`, `PROTOCOL.md`, and `RULES.md` into an LLM conversation.
2. Paste the complete contents of `POKELLM.emoji`.
3. Send the launch sequence: `🎮🧬📜🔣🧭🌍⚔️🐉🧑‍🤝‍🧑🔗🔥💧🌿❤️⚡🛡️🏃🎯🔄💚🔢🔒⏳⚖️🎲📨🔁🚫🗣️🔤📤▶️`.

The emoji block is a trigger, not executable code by itself. An LLM must have the rules in context to interpret the sequence consistently.

## Python reference engine

`engine/pokellm.py` is the authoritative Python battle rules reference. `engine/emoji_protocol.py` parses strict emoji frames, validates submissions, waits for both players, resolves turns, and emits emoji-only state snapshots.

Run tests with:

```bash
python -m unittest discover -s tests -v
```

GitHub Actions checks the Python suite and validates browser JavaScript syntax and SVG assets.

## Current limits

- Browser prototype: solo three-creature team battle versus a basic local opponent.
- Python adapter: local two-player turn collection; no network relay.
- Remote play across devices: not implemented.
- Persistent accounts, saved teams, creature capture/evolution, items, maps, audio, and hosted services: not implemented.
- Browser rules are a standalone JavaScript implementation with Node unit tests; full automated parity testing against the Python reference remains future work.
- No real-money wagering or redeemable tokens.

## License

No license has been assigned. All rights reserved by default; obtain the authors' permission before reuse or redistribution.
