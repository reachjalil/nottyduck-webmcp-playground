import {
  COLORS,
  STORAGE_KEY,
  addMemory,
  clamp,
  collectNearbySparks,
  createInitialState,
  moveDuck,
  normalizeState,
  publicSnapshot,
  spawnToy,
} from "./core.js";
import { installWebMcp } from "./webmcp.js";

const canvas = document.querySelector("#stage");
const ctx = canvas.getContext("2d");
const elements = {
  boot: document.querySelector("#boot"), score: document.querySelector("#score"),
  mission: document.querySelector("#mission-status"), progress: document.querySelector("#progress"),
  memory: document.querySelector("#memory"), name: document.querySelector("#duck-name"),
  swatches: document.querySelector("#swatches"), toast: document.querySelector("#toast"),
  mcpLabel: document.querySelector("#mcp-label"), mcpCopy: document.querySelector("#mcp-copy"),
  mcpDot: document.querySelector("#mcp-dot"), toolCount: document.querySelector("#tool-count"),
};

let state = loadState();
let agentTarget = null;
let quack = null;
let lastTime = performance.now();
let toastTimer;
let dpr = 1;

function loadState() {
  try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
  catch { return createInitialState(); }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderUi();
}

function renderUi() {
  elements.score.textContent = state.score;
  elements.mission.textContent = `${state.score} / ${state.sparks.length}`;
  elements.progress.style.width = `${(state.score / state.sparks.length) * 100}%`;
  if (document.activeElement !== elements.name) elements.name.value = state.duck.name;
  for (const swatch of elements.swatches.querySelectorAll("button")) swatch.classList.toggle("selected", swatch.dataset.color === state.duck.color);
  elements.memory.replaceChildren(...state.history.slice(-4).reverse().map((entry) => {
    const li = document.createElement("li");
    const dot = document.createElement("i");
    const text = document.createElement("span");
    text.textContent = entry.text;
    li.append(dot, text);
    return li;
  }));
}

function notify(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

function cancelAgentTarget() { agentTarget = null; }

function move(direction, steps = 1, actor = "human") {
  if (actor === "human") cancelAgentTarget();
  moveDuck(state, direction, steps);
  bumpToys();
  save();
}

function setTarget(x, y) {
  agentTarget = { x, y };
}

function spawn(kind, x = 0.5, y = 0.48) {
  spawnToy(state, kind, clamp(x, 0.08, 0.92), clamp(y, 0.16, 0.9));
  save();
  notify(`${kind.replace("-", " ")} incoming!`);
}

function quackDuck(style = "tiny", actor = "human") {
  if (actor === "human") cancelAgentTarget();
  const text = style === "loud" ? "QUAAACK!" : style === "question" ? "quack?" : "quack!";
  quack = { text, until: performance.now() + 1550 };
  addMemory(state, `${state.duck.name} said “${text}”`);
  save();
}

function customize(name, color) {
  state.duck.name = name.slice(0, 18);
  state.duck.color = color;
  addMemory(state, `Meet ${state.duck.name}, now dressed in ${color}.`);
  save();
}

function surprise(actor = "human") {
  if (actor === "human") cancelAgentTarget();
  const choice = Math.floor(Math.random() * 3);
  if (choice === 0) {
    const kinds = ["ball", "donut", "paper-plane"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    spawn(kind, 0.2 + Math.random() * 0.6, 0.3 + Math.random() * 0.45);
    return `Surprise: a ${kind.replace("-", " ")} appeared.`;
  }
  if (choice === 1) {
    quackDuck(["tiny", "loud", "question"][Math.floor(Math.random() * 3)], actor);
    return `Surprise: ${state.duck.name} had something to say.`;
  }
  setTarget(0.16 + Math.random() * 0.68, 0.25 + Math.random() * 0.55);
  addMemory(state, `${state.duck.name} chose a mysterious destination.`);
  save();
  return `Surprise: ${state.duck.name} is exploring.`;
}

function reset() {
  state = createInitialState();
  cancelAgentTarget();
  save();
  notify("Fresh trouble, ready to go.");
}

function noteAgentAction(message) {
  notify(`Agent: ${message}`);
}

function setWebMcpStatus(available, count) {
  elements.toolCount.textContent = count;
  elements.mcpDot.classList.toggle("ready", available);
  elements.mcpLabel.textContent = available ? "Ready for an agent" : "Play manually here";
  elements.mcpCopy.textContent = available
    ? "This page has shared its safe game controls with your agent. Every action appears here, live."
    : "WebMCP is not available in this browser yet. The full playground still works with pointer, buttons, and keyboard.";
}

const game = {
  getState: () => state,
  getSnapshot: () => publicSnapshot(state),
  move, setTarget, spawn, quack: quackDuck, customize, surprise, reset,
  noteAgentAction, setWebMcpStatus,
};

function resize() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function roundRect(x, y, w, h, r, fill) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
}

function drawSpark(x, y, pulse) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(pulse * 0.4);
  ctx.shadowColor = "#fff3a2"; ctx.shadowBlur = 14 + pulse * 5;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const radius = i % 2 ? 4.5 : 10;
    const angle = -Math.PI / 2 + (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath(); ctx.fillStyle = "#fff49b"; ctx.fill(); ctx.restore();
}

function drawToy(toy, width, height) {
  const x = toy.x * width; const y = toy.y * height;
  ctx.save(); ctx.translate(x, y);
  if (toy.kind === "ball") {
    const gradient = ctx.createRadialGradient(-6, -8, 2, 0, 0, 19);
    gradient.addColorStop(0, "#fff"); gradient.addColorStop(0.12, "#ff7a59"); gradient.addColorStop(0.55, "#ff7a59"); gradient.addColorStop(0.56, "#49b8eb"); gradient.addColorStop(1, "#2679b8");
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();
  } else if (toy.kind === "donut") {
    ctx.lineWidth = 11; ctx.strokeStyle = "#ef9da4"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = "#fff3c4"; for (let i = 0; i < 7; i += 1) { ctx.rotate(0.8); ctx.beginPath(); ctx.moveTo(8, -2); ctx.lineTo(14, 2); ctx.stroke(); }
  } else {
    ctx.rotate(-0.2); ctx.fillStyle = "#eef6ff"; ctx.strokeStyle = "#91a7b9"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-20, 8); ctx.lineTo(20, -10); ctx.lineTo(7, 15); ctx.lineTo(1, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawDuck(width, height, time) {
  const x = state.duck.x * width; const y = state.duck.y * height;
  const bob = Math.sin(time * 0.009) * 2;
  ctx.save(); ctx.translate(x, y + bob);
  ctx.fillStyle = "rgba(20, 25, 28, .18)"; ctx.beginPath(); ctx.ellipse(0, 25, 35, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS[state.duck.color]; ctx.strokeStyle = "#242729"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(-2, 5, 28, 25, -0.08, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(4, -22, 21, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-1, -27, 6, 0, Math.PI * 2); ctx.arc(10, -27, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#202528"; ctx.beginPath(); ctx.arc(0, -27, 2.5, 0, Math.PI * 2); ctx.arc(11, -27, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ff7b45"; ctx.beginPath(); ctx.moveTo(20, -20); ctx.lineTo(39, -14); ctx.lineTo(20, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineCap = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#ff8b48";
  ctx.beginPath(); ctx.moveTo(-11, 27); ctx.lineTo(-14, 34); ctx.moveTo(8, 27); ctx.lineTo(11, 34); ctx.stroke();
  if (quack && quack.until > time) {
    ctx.font = "700 15px ui-rounded, system-ui"; const measured = ctx.measureText(quack.text).width;
    roundRect(29, -56, measured + 22, 32, 15, "#fff");
    ctx.fillStyle = "#171a1c"; ctx.fillText(quack.text, 40, -35);
  }
  ctx.restore();
}

function draw(time) {
  const width = canvas.clientWidth; const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#b8e8ec"); sky.addColorStop(0.46, "#d9f2d2"); sky.addColorStop(0.47, "#84d183"); sky.addColorStop(1, "#5fbd72");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath(); ctx.arc(width * 0.82, height * 0.12, 42, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#80c6e6"; ctx.beginPath(); ctx.ellipse(width * 0.79, height * 0.49, width * 0.27, height * 0.11, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.48)"; ctx.lineWidth = 2; for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(width * (0.7 + i * 0.045), height * 0.48, 18 + i * 8, 0.1, 2.4); ctx.stroke(); }
  ctx.fillStyle = "#387e53";
  for (let i = 0; i < 12; i += 1) { const x = (i / 11) * width; const h = 20 + ((i * 17) % 45); ctx.beginPath(); ctx.moveTo(x - 25, height * 0.45); ctx.lineTo(x, height * 0.45 - h); ctx.lineTo(x + 25, height * 0.45); ctx.fill(); }
  ctx.strokeStyle = "rgba(30,75,48,.18)"; ctx.lineWidth = 1;
  for (let x = -height; x < width + height; x += 42) { ctx.beginPath(); ctx.moveTo(x, height * 0.47); ctx.lineTo(x + height, height); ctx.stroke(); }
  for (let x = 0; x < width + height; x += 42) { ctx.beginPath(); ctx.moveTo(x, height * 0.47); ctx.lineTo(x - height, height); ctx.stroke(); }
  for (const spark of state.sparks) if (!spark.collected) drawSpark(spark.x * width, spark.y * height, Math.sin(time * 0.004 + spark.id) * 0.5 + 0.5);
  [...state.toys].sort((a, b) => a.y - b.y).forEach((toy) => drawToy(toy, width, height));
  drawDuck(width, height, time);
}

function bumpToys() {
  for (const toy of state.toys) {
    const dx = toy.x - state.duck.x; const dy = toy.y - state.duck.y; const distance = Math.hypot(dx, dy);
    if (distance < 0.075 && distance > 0) { toy.vx += (dx / distance) * 0.012; toy.vy += (dy / distance) * 0.012; }
  }
}

function update(time) {
  const dt = Math.min((time - lastTime) / 16.67, 3); lastTime = time;
  let changed = false;
  if (agentTarget) {
    const dx = agentTarget.x - state.duck.x; const dy = agentTarget.y - state.duck.y; const distance = Math.hypot(dx, dy);
    if (distance < 0.012) agentTarget = null;
    else { const speed = Math.min(0.0055 * dt, distance); state.duck.x += (dx / distance) * speed; state.duck.y += (dy / distance) * speed; changed = true; }
  }
  for (const toy of state.toys) {
    if (Math.abs(toy.vx) + Math.abs(toy.vy) > 0.0002) { toy.x = clamp(toy.x + toy.vx * dt, 0.06, 0.94); toy.y = clamp(toy.y + toy.vy * dt, 0.16, 0.92); toy.vx *= 0.94; toy.vy *= 0.94; changed = true; }
  }
  if (changed) { bumpToys(); if (collectNearbySparks(state)) notify("Spark collected ✦"); save(); }
  draw(time); requestAnimationFrame(update);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  const direction = { ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" }[event.key];
  if (direction) { event.preventDefault(); move(direction, 1, "human"); }
});
canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect(); cancelAgentTarget();
  agentTarget = { x: clamp((event.clientX - rect.left) / rect.width, 0.08, 0.92), y: clamp((event.clientY - rect.top) / rect.height, 0.16, 0.9) };
  canvas.focus();
});

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "surprise") surprise();
  if (action === "ball") spawn("ball", 0.3 + Math.random() * 0.4, 0.3);
  if (action === "quack") quackDuck("tiny");
  if (action === "reset" && window.confirm("Reset this browser's tiny playground?")) reset();
  const color = event.target.closest("[data-color]")?.dataset.color;
  if (color) customize(state.duck.name, color);
});
elements.name.addEventListener("change", () => customize(elements.name.value.trim() || "Nibbles", state.duck.color));

document.querySelector("#copy-prompt").addEventListener("click", async () => {
  await navigator.clipboard.writeText("Name my duck Pixel, make it purple, then create a surprise in the playground.");
  notify("Prompt copied.");
});
const dialog = document.querySelector("#about-dialog");
document.querySelector("#how-it-works").addEventListener("click", () => dialog.showModal());
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());

renderUi(); resize(); requestAnimationFrame(update);
installWebMcp(game).catch((error) => {
  console.error("WebMCP registration failed", error);
  setWebMcpStatus(false, 0);
});

window.setTimeout(() => elements.boot.classList.add("done"), 520);
