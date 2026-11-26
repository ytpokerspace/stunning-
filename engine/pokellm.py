"""Deterministic POKÉLLM battle rules engine (Python standard library only).

This module is the authoritative state/rules layer. LLMs may translate emoji
frames into Action objects, but must not independently invent game outcomes.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
import random
from typing import Mapping


class Element(str, Enum):
    FIRE = "fire"
    WATER = "water"
    NATURE = "nature"


class ActionKind(str, Enum):
    ATTACK = "attack"
    HEAL = "heal"
    GUARD = "guard"
    SWITCH = "switch"


@dataclass(frozen=True)
class Move:
    name: str
    element: Element
    power: int
    accuracy: int = 95
    pp: int = 10

    def __post_init__(self) -> None:
        if self.power < 0 or not 0 <= self.accuracy <= 100 or self.pp < 0:
            raise ValueError("invalid move parameters")


@dataclass
class Creature:
    name: str
    element: Element
    max_hp: int
    attack: int
    defense: int
    speed: int
    moves: dict[str, Move]
    hp: int | None = None
    pp_left: dict[str, int] = field(default_factory=dict)
    guarding: bool = False
    fainted: bool = False

    def __post_init__(self) -> None:
        if min(self.max_hp, self.attack, self.defense, self.speed) < 0 or self.max_hp == 0:
            raise ValueError("creature stats must be non-negative and max_hp positive")
        self.hp = self.max_hp if self.hp is None else self.hp
        if not 0 <= self.hp <= self.max_hp:
            raise ValueError("hp must be between zero and max_hp")
        if not self.pp_left:
            self.pp_left = {key: move.pp for key, move in self.moves.items()}
        if set(self.pp_left) != set(self.moves):
            raise ValueError("pp_left must have exactly the creature's move keys")
        self.fainted = self.hp == 0

    @property
    def able(self) -> bool:
        return self.hp > 0


@dataclass
class Player:
    slot: int
    team: list[Creature]
    active: int = 0

    def __post_init__(self) -> None:
        if self.slot not in (1, 2):
            raise ValueError("player slot must be 1 or 2")
        if not self.team or len(self.team) > 3:
            raise ValueError("team must contain one to three creatures")
        if not 0 <= self.active < len(self.team):
            raise ValueError("active creature index out of range")

    @property
    def creature(self) -> Creature:
        return self.team[self.active]

    @property
    def has_able_creature(self) -> bool:
        return any(c.able for c in self.team)


@dataclass(frozen=True)
class Action:
    kind: ActionKind
    move: str | None = None
    target: int | None = None  # opponent team index; defaults to active
    team_index: int | None = None  # for switch


@dataclass(frozen=True)
class TurnEvent:
    code: str
    player: int
    detail: str = ""
    amount: int = 0


@dataclass
class Battle:
    players: dict[int, Player]
    rng: random.Random = field(default_factory=random.Random)
    turn: int = 1
    finished: bool = False
    winner: int | None = None
    draw: bool = False

    def __post_init__(self) -> None:
        if set(self.players) != {1, 2}:
            raise ValueError("battle requires player slots 1 and 2")
        if self.players[1].slot != 1 or self.players[2].slot != 2:
            raise ValueError("player dictionary keys must match player slots")

    @staticmethod
    def _multiplier(attacker: Element, defender: Element) -> float:
        strong = {
            Element.FIRE: Element.NATURE,
            Element.NATURE: Element.WATER,
            Element.WATER: Element.FIRE,
        }
        if strong[attacker] == defender:
            return 2.0
        if strong[defender] == attacker:
            return 0.5
        return 1.0

    def _validate(self, player: Player, action: Action) -> None:
        if not player.creature.able:
            raise ValueError(f"player {player.slot} active creature has fainted")
        if action.kind == ActionKind.SWITCH:
            if action.team_index is None or not 0 <= action.team_index < len(player.team):
                raise ValueError("switch target is out of range")
            if action.team_index == player.active or not player.team[action.team_index].able:
                raise ValueError("switch target must be another able creature")
        elif action.kind == ActionKind.ATTACK:
            if action.move not in player.creature.moves:
                raise ValueError("unknown move")
            if player.creature.pp_left[action.move] <= 0:
                raise ValueError("move has no PP")
            if action.target is not None and not 0 <= action.target < len(self.players[3 - player.slot].team):
                raise ValueError("attack target is out of range")
        elif action.kind == ActionKind.HEAL:
            move_key = action.move or "heal"
            if move_key not in player.creature.moves:
                raise ValueError("unknown healing move")
            if player.creature.pp_left[move_key] <= 0:
                raise ValueError("healing move has no PP")
            if player.creature.hp >= player.creature.max_hp:
                raise ValueError("cannot heal at full HP")
        elif action.kind != ActionKind.GUARD:
            raise ValueError("unsupported action")

    def resolve_turn(self, actions: Mapping[int, Action]) -> list[TurnEvent]:
        """Validate both actions first, then resolve one complete turn atomically."""
        if self.finished:
            raise ValueError("battle is already finished")
        if set(actions) != {1, 2}:
            raise ValueError("exactly one action from each player is required")

        # Validate against the pre-turn state before changing anything.
        self._validate(self.players[1], actions[1])
        self._validate(self.players[2], actions[2])

        events: list[TurnEvent] = []

        # Switches happen before all other actions.
        for slot in (1, 2):
            action = actions[slot]
            if action.kind == ActionKind.SWITCH:
                self.players[slot].active = action.team_index  # type: ignore[assignment]
                events.append(TurnEvent("switch", slot, str(action.team_index)))

        # Remaining actions resolve by current active creature speed, then player slot.
        # Guard is a defensive stance and is established before either attack,
        # independent of speed, so a slower defender can still block this turn.
        for slot in (1, 2):
            if actions[slot].kind == ActionKind.GUARD:
                self.players[slot].creature.guarding = True
                events.append(TurnEvent("guard", slot))

        order = sorted(
            (slot for slot in (1, 2)
             if actions[slot].kind not in (ActionKind.SWITCH, ActionKind.GUARD)),
            key=lambda slot: (-self.players[slot].creature.speed, slot),
        )
        for slot in order:
            player = self.players[slot]
            actor = player.creature
            action = actions[slot]
            opponent = self.players[3 - slot]

            # An actor fainted earlier in this same resolution cycle cannot act.
            if not actor.able:
                events.append(TurnEvent("cancelled_fainted", slot))
                continue

            if action.kind == ActionKind.HEAL:
                move_key = action.move or "heal"
                actor.pp_left[move_key] -= 1
                amount = min((actor.max_hp + 3) // 4, actor.max_hp - actor.hp)
                actor.hp += amount
                events.append(TurnEvent("heal", slot, actor.name, amount))
            elif action.kind == ActionKind.ATTACK:
                move = actor.moves[action.move]  # type: ignore[index]
                actor.pp_left[action.move] -= 1  # type: ignore[index]
                roll = self.rng.randint(1, 100)
                if roll > move.accuracy:
                    events.append(TurnEvent("miss", slot, move.name, roll))
                    continue
                target_index = opponent.active if action.target is None else action.target
                if not 0 <= target_index < len(opponent.team):
                    # Targets are validated here before damage; an invalid target
                    # is a rules error, not a silent retarget.
                    raise ValueError("attack target is out of range")
                target = opponent.team[target_index]
                if not target.able:
                    events.append(TurnEvent("target_fainted", slot, target.name))
                    continue
                base = max(1, move.power + actor.attack - target.defense // 2)
                same_type = 1.5 if move.element == actor.element else 1.0
                matchup = self._multiplier(move.element, target.element)
                variation = self.rng.randint(85, 100) / 100
                damage = max(1, int(base * same_type * matchup * variation))
                if target.guarding:
                    damage = max(1, damage // 2)
                    target.guarding = False
                target.hp = max(0, target.hp - damage)
                target.fainted = target.hp == 0
                events.append(TurnEvent("damage", slot, target.name, damage))
                if target.fainted:
                    events.append(TurnEvent("faint", 3 - slot, target.name))

        for slot in (1, 2):
            player = self.players[slot]
            if not player.has_able_creature:
                self.finished = True
        if self.finished:
            p1_alive = self.players[1].has_able_creature
            p2_alive = self.players[2].has_able_creature
            if p1_alive == p2_alive:
                self.draw = True
            else:
                self.winner = 1 if p1_alive else 2
        else:
            # Unused guard expires at the end of this resolution cycle.
            for player in self.players.values():
                if player.creature.guarding:
                    player.creature.guarding = False

        self.turn += 1
        return events


def public_starters() -> dict[str, Creature]:
    """Return fresh instances of the three public baseline starters."""
    return {
        "emberkit": Creature(
            "Emberkit", Element.FIRE, 40, 12, 8, 11,
            {"fire": Move("Fire", Element.FIRE, 18, 95, 10),
             "burst": Move("Burst", Element.FIRE, 22, 85, 10)},
        ),
        "brooklet": Creature(
            "Brooklet", Element.WATER, 44, 9, 12, 8,
            {"water": Move("Water", Element.WATER, 18, 95, 10),
             "heal": Move("Heal", Element.WATER, 0, 100, 10)},
        ),
        "mossling": Creature(
            "Mossling", Element.NATURE, 46, 10, 11, 7,
            {"nature": Move("Nature", Element.NATURE, 18, 95, 10),
             "heal": Move("Heal", Element.NATURE, 0, 100, 10)},
        ),
    }
