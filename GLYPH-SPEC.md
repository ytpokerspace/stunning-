> **Public-content boundary:** This specification covers public game mechanics only. The private Founder’s Pack, including William Gunnell Cox and Nathaniel Baker Rudd’s customized creatures, movesets, stats, and abilities, is intentionally excluded.

# POKÉLLM Glyph Specification

## 1. Operating contract

The engine maintains one authoritative game state. It accepts emoji command frames, validates the complete frame before applying it, updates the state deterministically, and emits emoji-only gameplay output.

During gameplay:
- Players send emoji only.
- The engine sends emoji only.
- No natural-language narration, labels, numbers written as text, or alphabetic identifiers.
- Numeric values are represented with digit glyphs: 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣.
- If a message is invalid, return the error glyph sequence defined in PROTOCOL.md; do not silently guess.

This specification is the meaning assigned to the launch sequence. The launch sequence alone is not executable machine code and is not guaranteed to initialize an arbitrary LLM unless these rules are present in its context.

## 2. Core glyph dictionary

| Glyph | Meaning |
|---|---|
| 🎮 | Game engine |
| 🧬 | Initialize |
| 📜 | Load protocol |
| 🔣 | Emoji grammar / glyph mode |
| 🧭 | Rules and turn controller |
| 🌍 | World / match |
| ⚔️ | Battle |
| 🧑 | Player |
| 🤖 | LLM-controlled opponent |
| 🧑‍🤝‍🧑 | Two-player match |
| 🔗 | Shared-session link / paired players |
| 🐉 | Creature |
| 🔥 | Fire element |
| 💧 | Water element |
| 🌿 | Nature element |
| ❤️ | Health |
| ⚡ | Attack |
| 🛡️ | Defense |
| 🏃 | Speed |
| 🎯 | Selected target |
| ➗ | Current value divided by maximum value in a state display |
| 🔄 | Switch active creature |
| 💚 | Heal |
| 🧪 | Move / ability |
| 🎲 | Random roll |
| 🔢 | Numeric field |
| 🔒 | Validate / lock submitted action |
| ⏳ | Turn phase |
| ⚖️ | Resolve actions |
| 📨 | Send message |
| 🔁 | Repeat / next turn |
| ✅ | Valid / accepted |
| 🚫 | Invalid / rejected |
| 🗣️ | Speech prohibited |
| 🔤 | Alphabetic text prohibited |
| 📤 | Emit output |
| ▶️ | Start / execute |
| ⏸️ | Pause |
| 🏆 | Victory |
| 💀 | Defeat |
| 📊 | Status |
| 🪙 | Virtual token (non-redeemable) |
| ⭐ | Experience |
| 💾 | Save-state marker (copyable state, not persistent storage) |

## 3. Element relationship

- 🔥 deals 2× damage to 🌿 and 0.5× to 💧.
- 🌿 deals 2× damage to 💧 and 0.5× to 🔥.
- 💧 deals 2× damage to 🔥 and 0.5× to 🌿.
- Matching the attacker's element gives a 1.5× same-element bonus.
- All other matchups are neutral.

## 4. Starter creatures

At match start, each player chooses one starter. A team may contain up to three creatures.

| Creature | Element | HP | Attack | Defense | Speed | Starting moves |
|---|---:|---:|---:|---:|---:|---|
| Emberkit 🐉🔥 | 🔥 | 40 | 12 | 8 | 11 | 🔥 attack, 🔥 burst |
| Brooklet 🐉💧 | 💧 | 44 | 9 | 12 | 8 | 💧 attack, 💚 heal |
| Mossling 🐉🌿 | 🌿 | 46 | 10 | 11 | 7 | 🌿 attack, 💚 heal |

Starting move parameters:
- Basic elemental attack: power 18, accuracy 95%, 10 uses per battle.
- Emberkit burst: power 22, accuracy 85%, 10 uses per battle.
- Heal: restore 25% of maximum HP, accuracy 100%, 10 uses per battle.
- Healing cannot exceed maximum HP.

## 5. Battle math

For a successful damaging move:

1. Base damage = max(1, move power + attacker attack − floor(target defense / 2)).
2. Apply same-element bonus (×1.5) if applicable.
3. Apply elemental relationship multiplier (×2, ×0.5, or ×1).
4. Apply a uniformly selected variation from 85% through 100%.
5. Round down; minimum final damage is 1.

To avoid ambiguity, the engine must record the random roll and all intermediate values in its internal state. It must not claim cryptographic randomness. In a model-only session, rolls are pseudo-random choices made by the model and are not independently verifiable.

## 6. Turn resolution

- Each player submits exactly one action per turn.
- Collect all active players' actions before resolving any.
- Validate every action against the same pre-turn state.
- If any action is invalid, reject it and request a corrected emoji frame; do not partially resolve the turn.
- Valid switches resolve first.
- Guard actions activate before speed-ordered attacks and healing, so a slower defender can guard in the same turn.
- Remaining attacks and healing resolve by descending speed. Ties resolve by ascending player slot, then ascending creature slot.
- Check accuracy and PP before applying a move.
- When a creature faints, immediately promote the first able teammate if one exists.
- If a player's team has no able creatures, that player loses.
- A draw occurs if all remaining teams are unable to continue after the same resolution cycle.

## 7. Defense action

🛡️ is a valid defensive action. It reduces the next damaging hit received before that player's next turn by 50%, rounded down, then the guard is consumed. Guard does not stack. A guard expires after the next turn-resolution cycle if unused.

## 8. Match limits

- Maximum team size: 3.
- Initial level: 5.
- Move uses: 10 per move per battle.
- No real-money wagers, cash-out, or redeemable prizes.
- 🪙 is a purely virtual counter with no monetary value.
