import { COLORS, addMemory, moveDuck, publicSnapshot, spawnToy } from "./core.js";

const emptySchema = Object.freeze({ type: "object", properties: {}, additionalProperties: false });

function requireObject(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Input must be an object.");
  return input;
}

function rejectExtra(input, allowed) {
  const extra = Object.keys(input).filter((key) => !allowed.includes(key));
  if (extra.length) throw new TypeError(`Unexpected input: ${extra.join(", ")}`);
}

function enumValue(input, key, values) {
  if (!values.includes(input[key])) throw new TypeError(`${key} must be one of: ${values.join(", ")}`);
  return input[key];
}

function result(game, message, extra = {}) {
  game.noteAgentAction(message);
  return { ok: true, message, state: game.getSnapshot(), ...extra };
}

export function createTools(game) {
  return [
    {
      name: "playground.get_state",
      description: "Inspect the current NottyDuck playground: duck, mission progress, toys, and spark locations. This is read-only and uses no account or network storage.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
      execute: async (raw = {}) => {
        const input = requireObject(raw); rejectExtra(input, []);
        return { ok: true, state: game.getSnapshot() };
      },
    },
    {
      name: "playground.move_duck",
      description: "Move the duck a small number of steps in one cardinal direction. The movement is animated in the same canvas the person sees and may collect nearby sparks.",
      inputSchema: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["up", "down", "left", "right"], description: "Cardinal direction to waddle." },
          steps: { type: "integer", minimum: 1, maximum: 8, description: "Small movement units; use 1-4 for precise play." },
        },
        required: ["direction", "steps"],
        additionalProperties: false,
      },
      execute: async (raw) => {
        const input = requireObject(raw); rejectExtra(input, ["direction", "steps"]);
        const direction = enumValue(input, "direction", ["up", "down", "left", "right"]);
        if (!Number.isInteger(input.steps) || input.steps < 1 || input.steps > 8) throw new TypeError("steps must be an integer from 1 to 8");
        game.move(direction, input.steps, "agent");
        return result(game, `${game.getState().duck.name} waddled ${direction}.`);
      },
    },
    {
      name: "playground.set_target",
      description: "Send the duck toward a normalized point in the playground. Coordinates are between 0 and 1. A person can immediately interrupt the movement with keyboard or pointer input.",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "number", minimum: 0.08, maximum: 0.92, description: "Horizontal target; 0 is left and 1 is right." },
          y: { type: "number", minimum: 0.16, maximum: 0.9, description: "Vertical target; 0 is top and 1 is bottom." },
        },
        required: ["x", "y"],
        additionalProperties: false,
      },
      execute: async (raw) => {
        const input = requireObject(raw); rejectExtra(input, ["x", "y"]);
        if (!Number.isFinite(input.x) || input.x < 0.08 || input.x > 0.92 || !Number.isFinite(input.y) || input.y < 0.16 || input.y > 0.9) throw new TypeError("x or y is outside the playable area");
        game.setTarget(input.x, input.y);
        return result(game, `${game.getState().duck.name} is waddling to the target.`);
      },
    },
    {
      name: "playground.spawn_toy",
      description: "Add one harmless toy to the shared playground. Toys are visual and local to this browser. At most 12 toys are kept.",
      inputSchema: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["ball", "donut", "paper-plane"], description: "Toy to add." },
          x: { type: "number", minimum: 0.08, maximum: 0.92, description: "Horizontal spawn position." },
          y: { type: "number", minimum: 0.16, maximum: 0.9, description: "Vertical spawn position." },
        },
        required: ["kind", "x", "y"],
        additionalProperties: false,
      },
      execute: async (raw) => {
        const input = requireObject(raw); rejectExtra(input, ["kind", "x", "y"]);
        const kind = enumValue(input, "kind", ["ball", "donut", "paper-plane"]);
        if (!Number.isFinite(input.x) || !Number.isFinite(input.y)) throw new TypeError("x and y must be numbers");
        game.spawn(kind, input.x, input.y);
        return result(game, `Added a ${kind.replace("-", " ")} to the playground.`);
      },
    },
    {
      name: "playground.quack",
      description: "Make the duck show a playful text quack in the shared canvas. This does not use audio, a microphone, or an external service.",
      inputSchema: {
        type: "object",
        properties: { style: { type: "string", enum: ["tiny", "loud", "question"], description: "The personality of the quack." } },
        required: ["style"],
        additionalProperties: false,
      },
      execute: async (raw) => {
        const input = requireObject(raw); rejectExtra(input, ["style"]);
        const style = enumValue(input, "style", ["tiny", "loud", "question"]);
        game.quack(style, "agent");
        return result(game, `${game.getState().duck.name} made a ${style} quack.`);
      },
    },
    {
      name: "playground.customize_duck",
      description: "Change the local duck's short display name and color. This updates the visible UI and localStorage only.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 18, description: "A friendly duck name, up to 18 characters." },
          color: { type: "string", enum: ["yellow", "coral", "mint", "purple"], description: "Duck body color." },
        },
        required: ["name", "color"],
        additionalProperties: false,
      },
      execute: async (raw) => {
        const input = requireObject(raw); rejectExtra(input, ["name", "color"]);
        if (typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 18) throw new TypeError("name must be 1 to 18 characters");
        const color = enumValue(input, "color", Object.keys(COLORS));
        game.customize(input.name.trim(), color, "agent");
        return result(game, `Your duck is now ${input.name.trim()} in ${color}.`);
      },
    },
    {
      name: "playground.create_surprise",
      description: "Create one bounded random playground moment: add a toy, make the duck quack, or give it a nearby destination. It never spends money, contacts anyone, or leaves the page.",
      inputSchema: emptySchema,
      execute: async (raw = {}) => {
        const input = requireObject(raw); rejectExtra(input, []);
        const summary = game.surprise("agent");
        return result(game, summary);
      },
    },
    {
      name: "playground.get_local_memory",
      description: "Read the recent playful event log stored on this device. It contains only in-game actions and is read-only.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
      execute: async (raw = {}) => {
        const input = requireObject(raw); rejectExtra(input, []);
        return { ok: true, memory: game.getState().history.map(({ text, at }) => ({ text, at })) };
      },
    },
    {
      name: "playground.reset_local_world",
      description: "Reset the duck, score, toys, and event history in this browser. This is destructive only to this page's local saved game and requires the exact confirmation phrase.",
      inputSchema: {
        type: "object",
        properties: { confirmation: { type: "string", const: "reset tiny playground", description: "Must exactly equal: reset tiny playground" } },
        required: ["confirmation"],
        additionalProperties: false,
      },
      annotations: { destructiveHint: true },
      execute: async (raw) => {
        const input = requireObject(raw); rejectExtra(input, ["confirmation"]);
        if (input.confirmation !== "reset tiny playground") throw new TypeError("Exact confirmation phrase required");
        game.reset("agent");
        return result(game, "The local playground was reset.");
      },
    },
  ];
}

export async function installWebMcp(game, modelContext = document.modelContext) {
  if (!modelContext || typeof modelContext.registerTool !== "function") {
    game.setWebMcpStatus(false, 0);
    return [];
  }

  const tools = createTools(game);
  for (const tool of tools) {
    await modelContext.registerTool(tool);
  }
  game.setWebMcpStatus(true, tools.length);
  return tools;
}

export { publicSnapshot, spawnToy, moveDuck, addMemory };
