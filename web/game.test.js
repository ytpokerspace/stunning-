"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattle, stepBattle } = require("./game.js");

test("creates full three-creature teams and chosen lead", () => {
  const s = createBattle(1);
  assert.equal(s.playerTeam.length, 3);
  assert.equal(s.rivalTeam.length, 3);
  assert.equal(s.playerActive, 1);
  assert.equal(s.playerHeals, 2);
  assert.equal(s.playerSpecial, 3);
});
test("rejects an invalid starter", () => assert.throws(() => createBattle(8), RangeError));
test("switches to a living teammate and rejects current/fainted slots", () => {
  const s = createBattle(0);
  const next = stepBattle(s, {kind:"switch", index:1}, () => 0.99);
  assert.equal(next.playerActive, 1);
  assert.throws(() => stepBattle(s, {kind:"switch", index:0}), RangeError);
});
test("special attacks consume one charge", () => {
  const s = stepBattle(createBattle(0), {kind:"special"}, () => 0.99);
  assert.equal(s.playerSpecial, 2);
});
test("special attacks cannot be used after charges run out", () => {
  const s = createBattle(0); s.playerSpecial = 0;
  assert.throws(() => stepBattle(s, {kind:"special"}), RangeError);
});
test("healing consumes a supply and restores at most twelve HP", () => {
  const s = createBattle(0); s.playerTeam[0].current = 20;
  const next = stepBattle(s, {kind:"heal"}, () => 0.99);
  assert.equal(next.playerTeam[0].current, 32);
  assert.equal(next.playerHeals, 1);
});
test("healing is rejected when supplies are empty", () => {
  const s = createBattle(0); s.playerHeals = 0; s.playerTeam[0].current = 10;
  assert.throws(() => stepBattle(s, {kind:"heal"}), RangeError);
});
test("guard reduces the rival's next attack", () => {
  const s = createBattle(0);
  const next = stepBattle(s, {kind:"guard"}, () => 0.99);
  assert.ok(next.playerTeam[0].current > 0);
  assert.equal(next.playerTeam[0].guarding, false);
});
test("state is not mutated when a step is resolved", () => {
  const s = createBattle(0); const before = s.playerTeam[0].current;
  stepBattle(s, {kind:"attack"}, () => 0.99);
  assert.equal(s.playerTeam[0].current, before);
});
test("completed battles ignore later actions", () => {
  const s = createBattle(0); s.done = true; s.winner = "player";
  assert.equal(stepBattle(s, {kind:"attack"}).winner, "player");
});

test("automatically brings in the next rival after a knockout", () => {
  const s = createBattle(0); s.rivalTeam[0].current = 1;
  const next = stepBattle(s, {kind:"attack"}, () => 0.99);
  assert.equal(next.rivalActive, 1);
  assert.equal(next.rivalTeam[0].current, 0);
});
test("automatically brings in the next teammate after a knockout", () => {
  const s = createBattle(0); s.playerTeam[0].current = 1;
  const next = stepBattle(s, {kind:"guard"}, () => 0.99);
  assert.equal(next.playerActive, 1);
  assert.equal(next.playerTeam[0].current, 0);
});
test("rejects switching to a fainted teammate", () => {
  const s = createBattle(0); s.playerTeam[2].current = 0;
  assert.throws(() => stepBattle(s, {kind:"switch", index:2}), RangeError);
});
