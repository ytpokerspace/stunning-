# POKÉLLM — Emoji Glyph Engine

An emoji-driven creature battle project with a Python reference engine, strict emoji protocol, and playable browser game modes.

## Public repository boundary

This repository contains the general game engine and public game materials. **The private Founder’s Pack is deliberately excluded.** William Gunnell Cox and Nathaniel Baker Rudd keep their customized founder creatures, crown designs, private movesets, special abilities, and personal roster details private. No founder-only creature data or artwork is stored in this public repository.

## Play the browser prototypes

- [Creature battles](web/index.html): original public starter creatures, large touch controls, and solo battles against a computer opponent.
- [Poker Skill Arena](web/poker.html): a Texas Hold’em-style five-card selection challenge. Choose the best five cards from seven, compare your hand with the computer opponent, and earn non-redeemable skill points.

The poker mode has **no betting, buy-ins, wagering, purchases, transfers, or cash-out**. Skill points cannot be lost and have no cash value. This is a local practice prototype, not remote multiplayer or an account-based leaderboard.

GitHub Pages deployment is configured in `.github/workflows/pages.yml`; publishing requires GitHub Pages to be enabled for the repository.

## LLM / emoji mode

1. Load `GLYPH-SPEC.md`, `PROTOCOL.md`, and `RULES.md` into an LLM conversation.
2. Paste the complete contents of `POKELLM.emoji`.
3. Send the launch sequence: `🎮🧬📜🔣🧭🌍⚔️🐉🧑‍🤝‍🧑🔗🔥💧🌿❤️⚡🛡️🏃🎯🔄💚🔢🔒⏳⚖️🎲📨🔁🚫🗣️🔤📤▶️`.

The emoji block is a trigger, not executable code by itself. An LLM must have the rules in context to interpret the sequence consistently.

## Python reference engine

`engine/pokellm.py` is the authoritative Python battle rules reference. `engine/emoji_protocol.py` parses strict emoji frames, validates submissions, waits for both players, resolves turns, and emits emoji-only state snapshots.

Run Python tests with:

```bash
python -m unittest discover -s tests -v
```

Browser rules are tested with Node's built-in test runner in GitHub Actions.

## Current limits

- Creature battle prototype: local solo play versus a basic opponent.
- Poker Skill Arena: local hand-selection challenge versus a computer opponent; no network play or persistent player accounts.
- Python adapter: local two-player turn collection; no network relay.
- Remote play across devices, persistent accounts, saved teams, creature capture/evolution, and hosted services are not implemented.
- No real-money wagering or redeemable tokens.

## License

No license has been assigned. All rights reserved by default; obtain the authors' permission before reuse or redistribution.
