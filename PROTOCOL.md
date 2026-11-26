> **Privacy boundary:** This protocol describes public multiplayer framing only. Do not add founder-exclusive creature identities, moves, stats, or roster details here; the Founder’s Pack remains private to its owners.

# POKÉLLM Message Protocol

## 1. Message frame

A player message is a sequence of glyph fields in this order:

`📨 🆔 [player-slot] 🔢 [sequence] 🎯 [action] ✅`

The spaces are explanatory separators only and are not required. The transmitted message must contain emoji glyphs and digit glyphs only.

- 📨 begins a message.
- 🆔 introduces the player slot: 1️⃣ or 2️⃣.
- 🔢 introduces the monotonically increasing sequence number.
- 🎯 introduces the action.
- ✅ closes a submitted frame.

The receiver must reject missing fields, duplicate fields, unknown glyphs, invalid values, or stale sequence numbers. A rejected message must not mutate game state.

## 2. Action forms

- Attack: `⚔️🧪[move-slot]🎯[target-slot]`
- Switch: `🔄🐉[team-slot]`
- Heal self: `💚`
- Guard: `🛡️`
- Status, pause, and resume glyphs are reserved for a future control layer; the current Python adapter accepts attack, switch, heal, and guard frames only.

A complete example for player 1, sequence 3, move 1 targeting opponent creature 1:

`📨🆔1️⃣🔢3️⃣🎯⚔️🧪1️⃣🎯1️⃣✅`

## 3. Engine response forms

- Accepted: `📨🆔[player-slot]🔢[sequence]✅`
- Rejected: `📨🆔[player-slot]🔢[sequence]🚫❓`
- Waiting for other player: `⏳🧑`
- Turn resolved: `⚖️📊[state-fields]✅`
- Player victory: `🏆🧑[player-slot]`
- Player defeat: `💀🧑[player-slot]`

State fields must use the same glyph dictionary and digit glyphs. The engine must not insert prose into a gameplay response.

## 4. Two-player session

A true two-player match requires both players' frames to reach the same authoritative conversation or an external relay that forwards the exact emoji sequence. The LLM must not invent a message from an absent player.

For a shared chat:
1. Assign player slots 1️⃣ and 2️⃣.
2. Require increasing sequence numbers independently for each player.
3. Wait until both valid actions for the current turn are received.
4. Resolve the turn once.
5. Broadcast the same result to both players.

Separate devices cannot communicate merely because both users paste the launch sequence into separate LLM sessions. That requires a network transport, server, or shared chat.

## 5. State and replay safety

The authoritative state includes:
- Match identifier and phase.
- Player slots and team rosters.
- Active creature per player.
- HP, maximum HP, level, stats, move uses, guard status.
- Current turn number.
- Last accepted sequence number per player.
- Pending actions.
- Random roll record.

A repeated or older sequence number is rejected. A state snapshot can be copied using 💾, but 💾 does not itself save data to a server or device. The host conversation must retain the state or the user must copy the snapshot.

## 6. LLM reliability boundary

This is a conversational protocol, not a transport security protocol. Emoji frames are not authenticated, encrypted, or tamper-proof. A model may misread glyphs or drift from the rules. For reliable competitive multiplayer, implement the protocol in software and use the LLM only as a presentation layer.
