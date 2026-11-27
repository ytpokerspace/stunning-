import tempfile
import unittest
from pathlib import Path

from cartridge.pic_cartridge import build_cartridge, decode_cartridge


class CartridgeTests(unittest.TestCase):
    def test_build_and_round_trip(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "test.png"
            digest = build_cartridge(path)
            payload = decode_cartridge(path)
            self.assertEqual(len(digest), 64)
            self.assertEqual(payload["version"], "PIC-0.1")
            self.assertEqual(payload["creator"]["name"], "William Gunnell Cox")
            self.assertEqual(payload["save_state"]["status"], "new_game")
            self.assertEqual(len(payload["starters"]), 3)

    def test_corrupt_payload_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "test.png"
            build_cartridge(path)
            data = bytearray(path.read_bytes())
            # Corrupt a byte within the embedded tEXt payload. PNG CRC catches it.
            pos = data.find(b"POKELLM_CARTRIDGE")
            self.assertGreater(pos, 0)
            data[pos + len(b"POKELLM_CARTRIDGE") + 4] ^= 1
            path.write_bytes(data)
            with self.assertRaises(ValueError):
                decode_cartridge(path)


if __name__ == "__main__":
    unittest.main()
