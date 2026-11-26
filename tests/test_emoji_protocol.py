import random
import unittest

from engine.emoji_protocol import EmojiSession, parse_frame, render_state
from engine.pokellm import ActionKind, Battle, Player, public_starters


def make_battle():
    s = public_starters()
    return Battle(
        {1: Player(1, [s["emberkit"]]), 2: Player(2, [s["mossling"]])},
        rng=random.Random(1),
    )


class EmojiProtocolTests(unittest.TestCase):
    def test_parse_attack_frame(self):
        parsed = parse_frame("📨🆔1️⃣🔢3️⃣🎯⚔️🧪1️⃣🎯1️⃣✅", make_battle())
        self.assertEqual((parsed.player, parsed.sequence), (1, 3))
        self.assertEqual(parsed.action.kind, ActionKind.ATTACK)
        self.assertEqual(parsed.action.move, "fire")
        self.assertEqual(parsed.action.target, 0)

    def test_parse_guard_and_switch(self):
        battle = make_battle()
        guard = parse_frame("📨🆔2️⃣🔢1️⃣🎯🛡️✅", battle)
        self.assertEqual(guard.action.kind, ActionKind.GUARD)
        battle.players[1].team.append(public_starters()["brooklet"])
        switch = parse_frame("📨🆔1️⃣🔢1️⃣🎯🔄🐉2️⃣✅", battle)
        self.assertEqual(switch.action.team_index, 1)

    def test_rejects_prose_and_bad_terminator(self):
        battle = make_battle()
        with self.assertRaises(ValueError):
            parse_frame("please 📨🆔1️⃣🔢1️⃣🎯🛡️✅", battle)
        with self.assertRaises(ValueError):
            parse_frame("📨🆔1️⃣🔢1️⃣🎯🛡️", battle)

    def test_session_waits_then_resolves(self):
        session = EmojiSession(make_battle())
        first = session.submit("📨🆔1️⃣🔢1️⃣🎯⚔️🧪1️⃣🎯1️⃣✅")
        self.assertIn("⏳", first)
        self.assertEqual(session.battle.turn, 1)
        second = session.submit("📨🆔2️⃣🔢1️⃣🎯🛡️✅")
        self.assertTrue(second.startswith("📊"))
        self.assertEqual(session.battle.turn, 2)
        self.assertEqual(session.pending, {})

    def test_rejects_duplicate_and_stale_frames(self):
        session = EmojiSession(make_battle())
        self.assertIn("⏳", session.submit("📨🆔1️⃣🔢2️⃣🎯🛡️✅"))
        self.assertEqual(session.submit("📨🆔1️⃣🔢2️⃣🎯🛡️✅"), "🚫❓")
        self.assertEqual(session.submit("📨🆔1️⃣🔢1️⃣🎯🛡️✅"), "🚫❓")

    def test_state_snapshot_is_emoji_only(self):
        state = render_state(make_battle())
        self.assertTrue(state.startswith("📊"))
        self.assertNotRegex(state, r"[A-Za-z]")

if __name__ == "__main__":
    unittest.main()
