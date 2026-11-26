# Runnable Engine

The public specification now has a deterministic Python reference engine.

## Requirements

- Python 3.10+
- No third-party packages

## Run tests

```bash
python -m unittest discover -s tests -v
```

## Integration boundary

The Python engine owns authoritative game state, validation, turn order, damage, PP, and win conditions. An LLM-facing adapter should translate emoji frames into `Action` values, call `Battle.resolve_turn()`, and translate returned events/state back into emoji. Do not ask the LLM to independently calculate competitive outcomes.

The engine is an initial reference implementation, not a hosted multiplayer server or mobile app. The public baseline roster is included; the private Founder’s Pack is not.
