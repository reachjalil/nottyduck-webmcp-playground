import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, publicSnapshot } from "../public/core.js";
import { createTools, installWebMcp } from "../public/webmcp.js";

function fakeGame() {
  const state = createInitialState();
  return {
    getState: () => state,
    getSnapshot: () => publicSnapshot(state),
    move: () => {}, setTarget: () => {}, spawn: () => {}, quack: () => {}, customize: () => {}, reset: () => {},
    surprise: () => "A safe surprise.", noteAgentAction: () => {}, setWebMcpStatus: () => {},
  };
}

test("every WebMCP tool has a closed object schema and unique name", () => {
  const tools = createTools(fakeGame());
  assert.equal(tools.length, 9);
  assert.equal(new Set(tools.map((tool) => tool.name)).size, tools.length);
  for (const tool of tools) {
    assert.match(tool.name, /^playground\./);
    assert.equal(tool.inputSchema.type, "object");
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(typeof tool.execute, "function");
  }
});

test("registers tools through the top-level model context", async () => {
  const registered = [];
  const tools = await installWebMcp(fakeGame(), { registerTool: async (tool) => registered.push(tool.name) });
  assert.deepEqual(registered, tools.map((tool) => tool.name));
});

test("executor rejects additional input even if a host skips schema validation", async () => {
  const stateTool = createTools(fakeGame()).find((tool) => tool.name === "playground.get_state");
  await assert.rejects(() => stateTool.execute({ secret: true }), /Unexpected input/);
});
