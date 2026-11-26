# POKÉLLM — Emoji Glyph Engine

An LLM-native, turn-based creature-battling game controlled and communicated through emoji glyphs.

## Public repository boundary

This repository contains the **general game engine and public game materials**: launch block, glyph dictionary, rules, message protocol, examples, and conformance checks.

**The private Founder’s Pack is deliberately excluded.** William Gunnell Cox and Nathaniel Baker Rudd keep their customized founder creatures, private movesets, special abilities, and personal roster details for their own use. No founder-only creature data is stored here, and public examples use only the standard starter roster.

## Start

1. Load `GLYPH-SPEC.md`, `PROTOCOL.md`, and `RULES.md` into an LLM conversation.
2. Paste the complete contents of `POKELLM.emoji`.
3. Send the launch sequence: `🎮🧬📜🔣🧭🌍⚔️🐉🧑‍🤝‍🧑🔗🔥💧🌿❤️⚡🛡️🏃🎯🔄💚🔢🔒⏳⚖️🎲📨🔁🚫🗣️🔤📤▶️`.
4. Follow the emoji-only starter selection prompt.

The emoji block is a compact trigger, not compiled executable code. An LLM must have the rules in its context to interpret the sequence consistently.

## Modes

- Solo: one player versus the LLM.
- Pass-and-play: multiple players share one conversation and take turns.
- Remote: separate devices require a shared chat or an external message relay. This repository specifies the protocol but does not host a relay server.

## Gameplay contract

- Player commands, player-to-player messages, and gameplay output use emoji glyphs only.
- Both players' actions are collected before a turn resolves.
- Invalid actions do not partially change game state.
- The game publishes the updated state after each turn.
- No real-money wagering or redeemable tokens. Virtual counters have no monetary value.
- Public documentation does not disclose founder-exclusive content.

## Repository map

- `POKELLM.emoji` — compact emoji-only launch block.
- `GLYPH-SPEC.md` — glyph vocabulary, public starters, and battle math.
- `PROTOCOL.md` — message framing, validation, and multiplayer constraints.
- `RULES.md` — consolidated battle rules and turn resolution.
- `EXAMPLES.md` — public emoji-only interaction examples.
- `CONFORMANCE.md` — compatibility checklist and test cases.

## Status

Specification-first prototype. LLM interpretation can vary; conformance checks are provided to expose inconsistencies. No hosted multiplayer backend is included.

## License

No license has been assigned. All rights reserved by default; obtain the authors' permission before reuse or redistribution.
