(function (root) {
  "use strict";
  const STARTERS = [
    { id: "emberkit", name: "Emberkit", type: "Fire", emoji: "🔥", art: "assets/emberkit.svg", hp: 40, atk: 12, def: 8, speed: 11, power: 18, special: 22 },
    { id: "brooklet", name: "Brooklet", type: "Water", emoji: "💧", art: "assets/brooklet.svg", hp: 44, atk: 9, def: 12, speed: 8, power: 18, special: 20 },
    { id: "mossling", name: "Mossling", type: "Nature", emoji: "🌿", art: "assets/mossling.svg", hp: 46, atk: 10, def: 11, speed: 7, power: 18, special: 20 }
  ];
  const ADVANTAGE = { Fire: "Nature", Nature: "Water", Water: "Fire" };
  const copy = value => JSON.parse(JSON.stringify(value));
  const makeCreature = data => ({ ...copy(data), current: data.hp, guarding: false, fainted: false });

  function createBattle(leadIndex) {
    if (!Number.isInteger(leadIndex) || leadIndex < 0 || leadIndex >= STARTERS.length) throw new RangeError("Choose a valid starter.");
    const playerTeam = STARTERS.map(makeCreature);
    const rivalTeam = STARTERS.map((_, i) => makeCreature(STARTERS[(i + leadIndex + 1) % STARTERS.length]));
    return {
      playerTeam, rivalTeam, playerActive: leadIndex, rivalActive: 0,
      turn: 1, playerSpecial: 3, rivalSpecial: 3, playerHeals: 2,
      done: false, winner: null, log: ["🎮 Your three-creature team is ready."]
    };
  }

  function active(team, index) { return team[index]; }
  function livingIndex(team, preferred) {
    if (team[preferred] && team[preferred].current > 0) return preferred;
    return team.findIndex(c => c.current > 0);
  }
  function teamAlive(team) { return team.some(c => c.current > 0); }

  function hit(attacker, defender, special, rng) {
    let base = (special ? attacker.special : attacker.power) + attacker.atk - Math.floor(defender.def / 2);
    base = Math.max(1, base);
    if (ADVANTAGE[attacker.type] === defender.type) base *= 2;
    else if (ADVANTAGE[defender.type] === attacker.type) base *= 0.5;
    if (attacker.type === defender.type) base *= 1.5;
    const roll = Math.min(1, Math.max(0, Number(rng())));
    const amount = Math.max(1, Math.floor(base * (0.85 + roll * 0.15)));
    const dealt = defender.guarding ? Math.ceil(amount / 2) : amount;
    defender.current = Math.max(0, defender.current - dealt);
    defender.guarding = false;
    defender.fainted = defender.current === 0;
    return dealt;
  }

  function replaceFainted(team, index) {
    if (team[index].current > 0) return { index, changed: false };
    const next = livingIndex(team, -1);
    return { index: next === -1 ? index : next, changed: next !== -1 && next !== index };
  }

  function finish(state) {
    const p = teamAlive(state.playerTeam), r = teamAlive(state.rivalTeam);
    if (!p || !r) {
      state.done = true;
      state.winner = p ? "player" : r ? "rival" : "draw";
    }
  }

  function stepBattle(previous, action, rng = Math.random) {
    const state = copy(previous);
    if (state.done) return state;
    if (!action || !["attack", "special", "guard", "heal", "switch"].includes(action.kind)) throw new TypeError("Unknown action.");
    const player = active(state.playerTeam, state.playerActive);
    if (action.kind === "switch") {
      if (!Number.isInteger(action.index) || action.index < 0 || action.index >= state.playerTeam.length || action.index === state.playerActive || state.playerTeam[action.index].current <= 0) throw new RangeError("That teammate cannot be selected.");
      state.playerActive = action.index;
      state.log.push("🔄 You switched to " + state.playerTeam[action.index].name + ".");
    } else if (action.kind === "guard") {
      player.guarding = true;
      state.log.push("🛡️ " + player.name + " guards.");
    } else if (action.kind === "heal") {
      if (state.playerHeals <= 0 || player.current === player.hp) throw new RangeError("No healing supply available or health is already full.");
      const restored = Math.min(12, player.hp - player.current);
      player.current += restored;
      state.playerHeals--;
      state.log.push("💚 " + player.name + " restores " + restored + " HP.");
    } else {
      const special = action.kind === "special";
      if (special && state.playerSpecial <= 0) throw new RangeError("No special energy remains.");
      if (special) state.playerSpecial--;
      const rival = active(state.rivalTeam, state.rivalActive);
      const dealt = hit(player, rival, special, rng);
      state.log.push((special ? "✨ Special" : "⚔️ Attack") + ": " + player.name + " deals " + dealt + " damage to " + rival.name + ".");
      const replacement = replaceFainted(state.rivalTeam, state.rivalActive);
      if (replacement.changed) {
        state.rivalActive = replacement.index;
        state.log.push("🔁 Rival sends out " + state.rivalTeam[state.rivalActive].name + ".");
      }
    }
    finish(state);
    if (!state.done) {
      const enemy = active(state.rivalTeam, state.rivalActive);
      const target = active(state.playerTeam, state.playerActive);
      if (enemy.current > 0) {
        if (enemy.current <= enemy.hp * 0.25 && state.rivalSpecial > 0) {
          state.rivalSpecial--;
          const dealt = hit(enemy, target, true, rng);
          state.log.push("👾✨ Rival special deals " + dealt + " damage.");
        } else if (rng() < 0.18) {
          enemy.guarding = true;
          state.log.push("👾🛡️ Rival guards.");
        } else {
          const dealt = hit(enemy, target, false, rng);
          state.log.push("👾⚔️ Rival deals " + dealt + " damage.");
        }
        const replacement = replaceFainted(state.playerTeam, state.playerActive);
        if (replacement.changed) {
          state.playerActive = replacement.index;
          state.log.push("🔁 Your next creature is " + state.playerTeam[state.playerActive].name + ".");
        }
      }
      finish(state);
    }
    state.turn++;
    return state;
  }

  const api = { STARTERS: copy(STARTERS), createBattle, stepBattle };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.PokellmGame = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
