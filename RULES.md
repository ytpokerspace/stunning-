# POKÉLLM Battle Rules

This document consolidates the public battle mechanics. It does not contain the private Founder’s Pack or any founder-exclusive creatures, movesets, stats, or abilities.

## Match setup

- Two player slots: 1️⃣ and 2️⃣.
- Each team may contain up to three creatures.
- Initial level: 5.
- Each move has 10 uses per battle.
- Players submit one action per turn.
- Both actions must be collected and validated before the turn changes state.

## Public starters

| Creature | Element | HP | Attack | Defense | Speed |
|---|---:|---:|---:|---:|---:|
| Emberkit 🐉🔥 | 🔥 | 40 | 12 | 8 | 11 |
| Brooklet 🐉💧 | 💧 | 44 | 9 | 12 | 8 |
| Mossling 🐉🌿 | 🌿 | 46 | 10 | 11 | 7 |

These are public baseline starters only. Founder-exclusive creatures remain private and are not described in this repository.

## Element cycle

- 🔥 Fire deals ×2 damage to 🌿 Nature and ×0.5 to 💧 Water.
- 🌿 Nature deals ×2 damage to 💧 Water and ×0.5 to 🔥 Fire.
- 💧 Water deals ×2 damage to 🔥 Fire and ×0.5 to 🌿 Nature.
- All other matchups are ×1.
- A move matching the attacker's element receives a ×1.5 same-element bonus.

## Public move parameters

- Standard elemental attack: power 18, accuracy 95%, 10 PP.
- Emberkit burst: power 22, accuracy 85%, 10 PP.
- Heal: restores 25% maximum HP, accuracy 100%, 10 PP.
- Guard 🛡️: reduces the next incoming damaging hit by 50%, then expires.
- Switch 🔄: changes the active creature to an available teammate.

## Damage calculation

`base = max(1, move_power + attacker_attack - floor(target_defense / 2))`

Apply the same-element bonus, elemental matchup multiplier, guard reduction, and a damage variation from 85% through 100%. Round down and enforce minimum damage of 1.

The engine must record the selected variation. Model-generated random choices are not cryptographically random or independently verifiable.

## Turn resolution

1. Publish current state and turn number.
2. Collect one action from each player.
3. Validate both actions against the same pre-turn state.
4. If an action is invalid, reject it without partially applying the turn.
5. Resolve valid switches first.
6. Activate guard actions before speed-ordered actions, so a slower defender can guard against a faster attacker.
7. Resolve remaining attacks and healing by descending active-creature speed.
8. Resolve ties by ascending player slot, then creature slot.
9. Check accuracy and available PP, then apply damage or healing.
10. When a creature faints, immediately promote the first able teammate if one exists.
11. Check whether either team has no usable creatures.
12. Publish the updated state in emoji-only form.

## State integrity

The authoritative state includes player slots, teams, active creatures, HP, stats, move PP, guard status, turn number, pending actions, accepted sequence numbers, and match result. Never silently alter these values.

## Safety and economy

No real-money wagering, cash-out, gambling mechanics, or redeemable prizes. 🪙 is a virtual game counter only.
