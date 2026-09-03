# NottyDuck WebMCP Playground

> A tiny local-first playground where a person and an AI agent can make harmless trouble together.

**Live:** [playground.nottyduck.com](https://playground.nottyduck.com)

NottyDuck turns WebMCP into play. Move an original canvas-drawn duck, collect sparks, toss toys, customize its look, and build a tiny memory of what happened. A human can use pointer, keyboard, and buttons. In a WebMCP-capable browser, an agent receives nine typed tools that operate the same visible world.

No account. No database. No cookies. No analytics. The entire save lives in this browser's `localStorage`.

## Why WebMCP fits

Most agent integrations hide behind a separate API and make the page a passive result. Here, the website itself is the tool provider. The agent can understand and operate the exact interactive state that the person sees, while the person can interrupt and continue at any moment. WebMCP makes that collaboration discoverable without duplicating the experience in a private backend.

This is deliberately small and legible: it demonstrates progressive enhancement, shared human/agent actions, real-time visible outcomes, bounded capabilities, strict input schemas, local persistence, and a normal non-agent fallback in one playful page.

## WebMCP tools

| Tool | Effect |
| --- | --- |
| `playground.get_state` | Read the duck, mission, toy, and spark state |
| `playground.move_duck` | Waddle in a cardinal direction |
| `playground.set_target` | Animate toward a bounded point |
| `playground.spawn_toy` | Add a ball, donut, or paper plane |
| `playground.quack` | Show a playful in-world quack |
| `playground.customize_duck` | Change the local name and color |
| `playground.create_surprise` | Trigger one bounded random moment |
| `playground.get_local_memory` | Read recent in-game events |
| `playground.reset_local_world` | Reset only this browser's save, with confirmation |

Registration uses the imperative API from the top-level page:

```js
document.modelContext.registerTool({
  name: "playground.move_duck",
  description: "Move the duck a small number of steps…",
  inputSchema: {
    type: "object",
    properties: {
      direction: { type: "string", enum: ["up", "down", "left", "right"] },
      steps: { type: "integer", minimum: 1, maximum: 8 }
    },
    required: ["direction", "steps"],
    additionalProperties: false
  },
  execute: async (input) => { /* validate, mutate local game, return state */ }
});
```

The complete implementation is in [`public/webmcp.js`](public/webmcp.js). Inputs are validated both by JSON Schema and at execution time. Human keyboard or pointer input immediately preempts an agent destination. The reset tool requires an exact phrase and affects only the local save.

## Run locally

Requirements: Node.js 20+ and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open the URL printed by Wrangler. The game works in every modern browser. To discover and invoke the site tools, use ChatGPT's in-app browser or Chrome with WebMCP enabled.

## Validate

```bash
pnpm check
pnpm exec wrangler deploy --dry-run
```

Tests cover game-state normalization and bounds, tool registration, closed schemas, and defense-in-depth validation.

## Deploy to Cloudflare

1. Authenticate Wrangler: `pnpm exec wrangler login`.
2. Use a Cloudflare zone you control or remove the custom `routes` entry in `wrangler.jsonc`.
3. Run `pnpm deploy`.

The Worker serves the static app and adds a restrictive Content Security Policy, `Permissions-Policy: tools=(self)`, anti-framing, and content-type protections. No secrets are required by the app.

## Project layout

```text
public/            Canvas game, UI, local state, and WebMCP registration
src/worker.js      Static asset handler and production security headers
test/              Node tests for game and tool contracts
SUBMISSION.md      Paste-ready challenge description and demo script
```

All visuals and code are original and dependency-light. NottyDuck is an independent community project and is not affiliated with OpenAI.

## License

[MIT](LICENSE)
