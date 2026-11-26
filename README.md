# POKÉLLM — Emoji Glyph Engine

A chat-native creature-battle game protocol designed for large language models. The game state, player commands, player-to-player messages, and gameplay output use emoji glyphs only.

## Start

1. Load the rules in `GLYPH-SPEC.md` and `PROTOCOL.md` into the LLM conversation (or use an LLM configured with this protocol).
2. Paste the complete contents of `POKELLM.emoji`.
3. The engine should answer with the emoji-only starter selection prompt.
4. During play, send only valid emoji command frames. The engine must also answer only with emoji.

**Important:** `POKELLM.emoji` is a compact protocol trigger, not a compiled executable. An arbitrary LLM cannot be guaranteed to understand a private emoji language from an unexplained sequence alone. The rules must be in its context, supplied by a compatible system prompt, or built into the model. Separate-device multiplayer also needs a shared chat or an external message relay; emojis alone do not create a network connection.

## Game

- Turn-based creature battles; solo or pass-and-play in one shared conversation.
- Fire / Water / Nature elemental cycle.
- Teams of up to three creatures.
- Emoji-only gameplay and player communication.
- Virtual, non-redeemable game tokens only. No wagering or real-money mechanics.

## Repository map

- `POKELLM.emoji` — compact emoji-only launch sequence.
- `GLYPH-SPEC.md` — glyph vocabulary, game rules, and deterministic state model.
- `PROTOCOL.md` — player message framing, validation, turn order, and multiplayer limits.
- `EXAMPLES.md` — sample emoji-only interaction.

## Status

Protocol/specification prototype. It is not a hosted multiplayer service, a compiled game binary, or a guarantee that every LLM will follow the rules identically. Compatibility should be tested against each target model.

## License

No license has been assigned yet. All rights reserved by default; obtain the author's permission before reuse or redistribution.
