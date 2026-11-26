"""Strict emoji-only command adapter for the POKÉLLM reference engine."""
from __future__ import annotations

from dataclasses import dataclass, field

from .pokellm import Action, ActionKind, Battle


DIGITS = {
    "0️⃣": 0, "1️⃣": 1, "2️⃣": 2, "3️⃣": 3, "4️⃣": 4,
    "5️⃣": 5, "6️⃣": 6, "7️⃣": 7, "8️⃣": 8, "9️⃣": 9,
}
DIGIT_GLYPHS = {value: key for key, value in DIGITS.items()}


class ProtocolError(ValueError):
    """A malformed, stale, or invalid emoji command."""


def _read_number(source: str) -> tuple[int, str]:
    value = 0
    count = 0
    while True:
        token = next((g for g in DIGITS if source.startswith(g)), None)
        if token is None:
            break
        value = value * 10 + DIGITS[token]
        source = source[len(token):]
        count += 1
    if count == 0:
        raise ProtocolError("expected digit glyph")
    return value, source


def encode_number(value: int) -> str:
    if value < 0:
        raise ValueError("negative values are not supported in emoji state")
    return "".join(DIGIT_GLYPHS[int(ch)] for ch in str(value))


@dataclass(frozen=True)
class ParsedFrame:
    player: int
    sequence: int
    action: Action


def parse_frame(message: str, battle: Battle) -> ParsedFrame:
    """Parse one complete emoji frame. No spaces or prose are accepted."""
    if not message.startswith("📨🆔"):
        raise ProtocolError("missing frame header")
    rest = message[len("📨🆔"):]
    player, rest = _read_number(rest)
    if player not in (1, 2) or not rest.startswith("🔢"):
        raise ProtocolError("invalid player or missing sequence marker")
    sequence, rest = _read_number(rest[len("🔢"):])
    if sequence < 1 or not rest.startswith("🎯"):
        raise ProtocolError("invalid sequence or missing action marker")
    rest = rest[len("🎯"):]
    if not rest.endswith("✅"):
        raise ProtocolError("missing frame terminator")
    body = rest[:-len("✅")]
    action: Action

    if body.startswith("⚔️🧪"):
        move_slot, tail = _read_number(body[len("⚔️🧪"):])
        if not tail.startswith("🎯"):
            raise ProtocolError("attack requires a target marker")
        target_slot, tail = _read_number(tail[len("🎯"):])
        if tail or move_slot < 1 or target_slot < 1:
            raise ProtocolError("invalid attack fields")
        moves = list(battle.players[player].creature.moves.items())
        if move_slot > len(moves):
            raise ProtocolError("move slot does not exist")
        move_key, move = moves[move_slot - 1]
        if move.power <= 0:
            raise ProtocolError("selected move is not an attack")
        action = Action(ActionKind.ATTACK, move=move_key, target=target_slot - 1)
    elif body.startswith("🔄🐉"):
        team_slot, tail = _read_number(body[len("🔄🐉"):])
        if tail or team_slot < 1:
            raise ProtocolError("invalid switch fields")
        action = Action(ActionKind.SWITCH, team_index=team_slot - 1)
    elif body == "🛡️":
        action = Action(ActionKind.GUARD)
    elif body == "💚":
        action = Action(ActionKind.HEAL)
    else:
        raise ProtocolError("unknown action glyph sequence")

    return ParsedFrame(player, sequence, action)


def render_state(battle: Battle) -> str:
    """Render a compact, emoji-only authoritative state snapshot."""
    parts = ["📊", "🔢", encode_number(battle.turn)]
    for slot in (1, 2):
        player = battle.players[slot]
        creature = player.creature
        parts.extend([
            "🧑", encode_number(slot),
            "🐉", encode_number(player.active + 1),
            "❤️", encode_number(creature.hp),
            "➗", encode_number(creature.max_hp),
        ])
    if battle.finished:
        if battle.draw:
            parts.append("🤝")
        elif battle.winner is not None:
            parts.extend(["🏆", "🧑", encode_number(battle.winner)])
    return "".join(parts)


@dataclass
class EmojiSession:
    """Collects one action per player and resolves only complete valid turns."""
    battle: Battle
    last_sequence: dict[int, int] = field(default_factory=lambda: {1: 0, 2: 0})
    pending: dict[int, Action] = field(default_factory=dict)

    def submit(self, message: str) -> str:
        try:
            frame = parse_frame(message, self.battle)
            if frame.sequence <= self.last_sequence[frame.player]:
                raise ProtocolError("stale or repeated sequence")
            if frame.player in self.pending:
                raise ProtocolError("player already submitted this turn")
            self.battle._validate(self.battle.players[frame.player], frame.action)
            self.pending[frame.player] = frame.action
            self.last_sequence[frame.player] = frame.sequence
            if len(self.pending) == 1:
                return "📨🆔" + encode_number(frame.player) + "🔢" + encode_number(frame.sequence) + "✅⏳"
            self.battle.resolve_turn(self.pending)
            self.pending.clear()
            return render_state(self.battle)
        except (ProtocolError, ValueError, KeyError):
            return "🚫❓"
