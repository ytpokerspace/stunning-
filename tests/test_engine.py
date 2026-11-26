import random
import unittest

from engine.pokellm import (
    Action, ActionKind, Battle, Creature, Element, Move, Player, public_starters
)


def make_battle(p1=None, p2=None, seed=7):
    starters = public_starters()
    p1 = p1 or [starters["emberkit"]]
    p2 = p2 or [starters["mossling"]]
    return Battle({1: Player(1, p1), 2: Player(2, p2)}, rng=random.Random(seed))


class BattleTests(unittest.TestCase):
    def test_starter_stats(self):
        s = public_starters()
        self.assertEqual((s["emberkit"].hp, s["brooklet"].hp, s["mossling"].hp), (40, 44, 46))

    def test_element_cycle(self):
        self.assertEqual(Battle._multiplier(Element.FIRE, Element.NATURE), 2.0)
        self.assertEqual(Battle._multiplier(Element.NATURE, Element.WATER), 2.0)
        self.assertEqual(Battle._multiplier(Element.WATER, Element.FIRE), 2.0)
        self.assertEqual(Battle._multiplier(Element.FIRE, Element.WATER), 0.5)

    def test_invalid_action_is_atomic(self):
        b = make_battle()
        before = (b.players[1].creature.hp, b.players[2].creature.hp,
                  dict(b.players[1].creature.pp_left), b.turn)
        with self.assertRaises(ValueError):
            b.resolve_turn({
                1: Action(ActionKind.ATTACK, move="not-a-move"),
                2: Action(ActionKind.GUARD),
            })
        after = (b.players[1].creature.hp, b.players[2].creature.hp,
                 dict(b.players[1].creature.pp_left), b.turn)
        self.assertEqual(before, after)

    def test_requires_both_players(self):
        b = make_battle()
        with self.assertRaises(ValueError):
            b.resolve_turn({1: Action(ActionKind.GUARD)})

    def test_switches_before_attacks(self):
        s = public_starters()
        reserve = Creature("Reserve", Element.WATER, 30, 8, 8, 20,
                           {"water": Move("Water", Element.WATER, 10, 100, 2)})
        b = make_battle(p1=[s["emberkit"], reserve])
        events = b.resolve_turn({
            1: Action(ActionKind.SWITCH, team_index=1),
            2: Action(ActionKind.GUARD),
        })
        self.assertEqual(b.players[1].active, 1)
        self.assertTrue(any(e.code == "switch" for e in events))

    def test_guard_reduces_next_hit(self):
        s = public_starters()
        # Player 1 is faster and attacks after player 2's guard has been set.
        b = make_battle(p1=[s["emberkit"]], p2=[s["mossling"]], seed=1)
        events = b.resolve_turn({
            1: Action(ActionKind.ATTACK, move="fire"),
            2: Action(ActionKind.GUARD),
        })
        self.assertTrue(any(e.code == "guard" for e in events))
        self.assertLess(b.players[2].creature.hp, 46)

    def test_heal_is_capped(self):
        s = public_starters()
        s["brooklet"].hp = 40
        b = make_battle(p1=[s["brooklet"]])
        b.resolve_turn({
            1: Action(ActionKind.HEAL),
            2: Action(ActionKind.GUARD),
        })
        self.assertEqual(b.players[1].creature.hp, 44)

    def test_fainting_ends_match(self):
        s = public_starters()
        s["mossling"].hp = 1
        b = make_battle(p1=[s["emberkit"]], p2=[s["mossling"]], seed=4)
        b.resolve_turn({
            1: Action(ActionKind.ATTACK, move="burst"),
            2: Action(ActionKind.GUARD),
        })
        self.assertTrue(b.finished)
        self.assertEqual(b.winner, 1)

    def test_pp_consumed_on_attempt(self):
        b = make_battle()
        before = b.players[1].creature.pp_left["fire"]
        b.resolve_turn({
            1: Action(ActionKind.ATTACK, move="fire"),
            2: Action(ActionKind.GUARD),
        })
        self.assertEqual(b.players[1].creature.pp_left["fire"], before - 1)


if __name__ == "__main__":
    unittest.main()
