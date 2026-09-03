import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, moveDuck, normalizeState, publicSnapshot, spawnToy } from "../public/core.js";

test("initial state is playable and serializable", () => {
  const state = createInitialState();
  assert.equal(state.sparks.length, 6);
  assert.equal(state.score, 0);
  assert.deepEqual(normalizeState(JSON.parse(JSON.stringify(state))).duck, state.duck);
});

test("movement is bounded and rejects unsafe input", () => {
  const state = createInitialState();
  for (let index = 0; index < 30; index += 1) moveDuck(state, "left", 8);
  assert.equal(state.duck.x, 0.08);
  assert.throws(() => moveDuck(state, "diagonal", 1), /direction/);
  assert.throws(() => moveDuck(state, "up", 100), /steps/);
});

test("toys are typed, bounded, and capped", () => {
  const state = createInitialState();
  for (let index = 0; index < 20; index += 1) spawnToy(state, "ball", 0.5, 0.5);
  assert.equal(state.toys.length, 12);
  assert.throws(() => spawnToy(state, "anvil", 0.5, 0.5), /kind/);
  assert.throws(() => spawnToy(state, "ball", 9, 0.5), /playable/);
});

test("public snapshot exposes game state without local history", () => {
  const snapshot = publicSnapshot(createInitialState());
  assert.equal(snapshot.mission.total, 6);
  assert.equal("history" in snapshot, false);
});
