export const STORAGE_KEY = "nottyduck-webmcp-playground-v1";
export const COLORS = Object.freeze({
  yellow: "#ffe45e",
  coral: "#ff765d",
  mint: "#72e7bd",
  purple: "#b99cff",
});

export const DIRECTIONS = Object.freeze({
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
});

const SPARK_POSITIONS = Object.freeze([
  [0.16, 0.72], [0.26, 0.4], [0.47, 0.76],
  [0.59, 0.3], [0.75, 0.65], [0.86, 0.36],
]);

const TOY_KINDS = new Set(["ball", "donut", "paper-plane"]);

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createInitialState() {
  return {
    version: 1,
    duck: { name: "Nibbles", color: "yellow", x: 0.5, y: 0.57 },
    score: 0,
    sparks: SPARK_POSITIONS.map(([x, y], id) => ({ id, x, y, collected: false })),
    toys: [
      { id: "starter-ball", kind: "ball", x: 0.73, y: 0.49, vx: 0, vy: 0 },
      { id: "starter-donut", kind: "donut", x: 0.35, y: 0.64, vx: 0, vy: 0 },
    ],
    history: [{ id: "hello", text: "Nibbles arrived in the playground.", at: Date.now() }],
  };
}

function cleanText(value, fallback, maxLength) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

export function normalizeState(value) {
  const initial = createInitialState();
  if (!value || typeof value !== "object" || value.version !== 1) return initial;

  const duck = value.duck && typeof value.duck === "object" ? value.duck : {};
  const color = Object.hasOwn(COLORS, duck.color) ? duck.color : initial.duck.color;
  const sparks = Array.isArray(value.sparks) && value.sparks.length === SPARK_POSITIONS.length
    ? SPARK_POSITIONS.map(([x, y], id) => ({ id, x, y, collected: Boolean(value.sparks[id]?.collected) }))
    : initial.sparks;
  const toys = Array.isArray(value.toys) ? value.toys.slice(-12).flatMap((toy, index) => {
    if (!toy || !TOY_KINDS.has(toy.kind)) return [];
    return [{
      id: cleanText(toy.id, `toy-${index}`, 40),
      kind: toy.kind,
      x: clamp(Number(toy.x) || 0.5, 0.08, 0.92),
      y: clamp(Number(toy.y) || 0.5, 0.16, 0.9),
      vx: 0,
      vy: 0,
    }];
  }) : initial.toys;
  const history = Array.isArray(value.history) ? value.history.slice(-10).flatMap((entry, index) => {
    if (!entry || typeof entry.text !== "string") return [];
    return [{ id: cleanText(entry.id, `memory-${index}`, 50), text: entry.text.slice(0, 90), at: Number(entry.at) || Date.now() }];
  }) : initial.history;

  return {
    version: 1,
    duck: {
      name: cleanText(duck.name, initial.duck.name, 18),
      color,
      x: clamp(Number(duck.x) || initial.duck.x, 0.08, 0.92),
      y: clamp(Number(duck.y) || initial.duck.y, 0.16, 0.9),
    },
    score: sparks.filter((spark) => spark.collected).length,
    sparks,
    toys,
    history: history.length ? history : initial.history,
  };
}

export function addMemory(state, text) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    text: cleanText(text, "A tiny thing happened.", 90),
    at: Date.now(),
  };
  state.history = [...state.history, entry].slice(-10);
  return entry;
}

export function collectNearbySparks(state, radius = 0.065) {
  let collected = 0;
  for (const spark of state.sparks) {
    if (!spark.collected && Math.hypot(state.duck.x - spark.x, state.duck.y - spark.y) < radius) {
      spark.collected = true;
      collected += 1;
    }
  }
  if (collected) {
    state.score = state.sparks.filter((spark) => spark.collected).length;
    addMemory(state, `${state.duck.name} found ${collected === 1 ? "a spark" : `${collected} sparks`}!`);
  }
  return collected;
}

export function moveDuck(state, direction, steps = 1) {
  if (!Object.hasOwn(DIRECTIONS, direction)) throw new TypeError("direction must be up, down, left, or right");
  if (!Number.isInteger(steps) || steps < 1 || steps > 8) throw new TypeError("steps must be an integer from 1 to 8");
  const [dx, dy] = DIRECTIONS[direction];
  state.duck.x = clamp(state.duck.x + dx * steps * 0.035, 0.08, 0.92);
  state.duck.y = clamp(state.duck.y + dy * steps * 0.035, 0.16, 0.9);
  collectNearbySparks(state);
  return state;
}

export function spawnToy(state, kind, x = 0.5, y = 0.45) {
  if (!TOY_KINDS.has(kind)) throw new TypeError("kind must be ball, donut, or paper-plane");
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0.08 || x > 0.92 || y < 0.16 || y > 0.9) {
    throw new TypeError("x and y must be within the playable area");
  }
  const toy = { id: `${kind}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, kind, x, y, vx: 0, vy: 0 };
  state.toys = [...state.toys, toy].slice(-12);
  addMemory(state, `${state.duck.name} got a new ${kind.replace("-", " ")}.`);
  return toy;
}

export function publicSnapshot(state) {
  return {
    duck: { ...state.duck },
    mission: { collected: state.score, total: state.sparks.length, complete: state.score === state.sparks.length },
    toys: state.toys.map(({ id, kind, x, y }) => ({ id, kind, x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) })),
    uncollectedSparks: state.sparks.filter((spark) => !spark.collected).map(({ id, x, y }) => ({ id, x, y })),
  };
}
