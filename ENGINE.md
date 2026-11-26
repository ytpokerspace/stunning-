# Runnable Engine

The public specification includes a deterministic Python rules engine and a strict emoji command adapter.

## Requirements

- Python 3.10+
- No third-party packages

## Run tests

```bash
python -m unittest discover -s tests -v
```

## Emoji adapter

`engine/emoji_protocol.py` accepts complete frames such as:

```text
📨🆔1️⃣🔢1️⃣🎯⚔️🧪1️⃣🎯1️⃣✅
📨🆔2️⃣🔢1️⃣🎯🛡️✅
```

Create an `EmojiSession` with a `Battle`, then pass each player's frame to `session.submit(frame)`. The first valid submission receives an emoji acknowledgement and waiting marker. Once both players have submitted, the session resolves the turn and returns an emoji-only state snapshot. Invalid, stale, duplicate, or malformed frames return `🚫❓`.

## Integration boundary

The Python engine owns authoritative game state, validation, turn order, damage, PP, guard, healing, replacement, and win conditions. The adapter translates emoji frames into engine actions and renders the result. An LLM can serve as a conversational front end, but it should not independently calculate competitive outcomes.

This is a local reference implementation, not a hosted multiplayer server or mobile app. Remote devices still need a shared chat or an external relay. The public baseline roster is included; the private Founder’s Pack is not.
