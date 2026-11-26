# POKÉLLM Conformance Checklist

This checklist defines expected behavior for an LLM that claims to run the public POKÉLLM protocol. A checked item should be marked complete only after an actual test.

## Required behavior

- [ ] Loads the rulebook and glyph dictionary before interpreting the launch sequence.
- [ ] Uses emoji-only output during gameplay.
- [ ] Assigns unique emoji identifiers to players and creatures.
- [ ] Tracks HP, maximum HP, stats, PP, active creature, turn number, and match result.
- [ ] Collects all player actions before resolving a multiplayer turn.
- [ ] Validates actions against the same pre-turn state.
- [ ] Rejects invalid actions without changing HP, PP, or turn state.
- [ ] Resolves switches before attacks.
- [ ] Uses speed order and the documented tie-break.
- [ ] Applies elemental multipliers and damage in the documented order.
- [ ] Applies guard for the documented duration.
- [ ] Caps healing at maximum HP.
- [ ] Prevents defeated creatures from acting.
- [ ] Checks the win condition after every resolved turn.
- [ ] Publishes a state summary after each turn.
- [ ] Rejects stale, duplicate, and ambiguous message frames.
- [ ] Does not claim remote multiplayer works without an actual shared chat or relay.
- [ ] Does not introduce real-money wagering or redeemable currency.
- [ ] Keeps the private Founder’s Pack and founder-only rosters out of public files.

## Minimum test cases

1. Fire versus Nature applies the ×2 advantage multiplier.
2. Nature versus Water applies the ×2 advantage multiplier.
3. Water versus Fire applies the ×2 advantage multiplier.
4. Reverse matchups apply ×0.5.
5. A matching-element move applies ×1.5.
6. Guard reduces the next incoming hit by 50% and then expires.
7. Healing never exceeds maximum HP.
8. Invalid actions leave the game state unchanged.
9. A switch resolves before attacks.
10. A defeated creature cannot act.
11. Duplicate or stale sequence numbers are rejected.
12. A player loses when no usable creatures remain.

## Reliability boundary

An LLM can drift, misread glyphs, or make arithmetic mistakes. Passing a conversational demonstration is not equivalent to software verification. For competitive or remote multiplayer, use a deterministic software engine for state and rules, with an LLM as the emoji-facing interface.
