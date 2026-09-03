# OpenAI WebMCP Challenge submission kit

## URLs

- Live app: <https://playground.nottyduck.com>
- Public source: <https://github.com/reachjalil/nottyduck-webmcp-playground>
- Demo video: **add the public YouTube URL here after recording**

## Project name

**NottyDuck: The Tiny WebMCP Playground**

## Tagline

One tiny duck. Two players: you and your agent.

## Paste-ready description

NottyDuck is a local-first WebMCP playground where a person and an AI agent share one playful, visible world. Move an original canvas-drawn duck, collect six sparks, toss in beach balls, donuts, and paper planes, customize the duck, ask it to quack, and build a tiny memory of the adventure—all without an account, backend database, cookies, or analytics.

This is a strong fit for WebMCP because the web page is not merely content for an agent to read: it is the live source of truth and the capability provider. The page registers nine typed tools for inspecting the world, moving to bounded positions, adding harmless toys, customizing the duck, creating a random surprise, reading local game memory, and explicitly resetting the local save. Agent actions use the same game functions as keyboard, pointer, and button actions, so both participants see and change the same state. Human input can immediately interrupt an agent destination.

The result is a better user experience than a separate chatbot or private API. There is no context-switching, setup, API key, or invisible background action. The agent can discover what the page knows and do what the page safely allows; the person stays in control and sees every effect as it happens. Together they can improvise a little story, divide a navigation task, or create a personalized world—collaboration that was previously awkward because the UI and the agent's tools were separate systems.

We implemented WebMCP with the top-level imperative `document.modelContext.registerTool(...)` API. Each tool has a clear effect description, a closed JSON Schema with `additionalProperties: false`, tight enums and numeric bounds, and manual runtime validation. Read-only and destructive hints identify relevant tools, and reset requires an exact confirmation phrase. The site is progressive enhancement: if WebMCP is unavailable, the entire experience still works with normal web controls. Local state is normalized before use and saved only to `localStorage`. A small Cloudflare Worker serves the dependency-light app with a restrictive CSP and `Permissions-Policy: tools=(self)`.

## Suggested judging prompt

> Open the playground. Inspect its state, name my duck Pixel, make it purple, add a ball near the center, make Pixel quack as a question, then create a surprise. Tell me what changed.

## Demo video script — approximately 2 minutes 20 seconds

### 0:00–0:18 — Hook

Screen: Start on the live page with the duck moving.

Voice: “This is NottyDuck, the tiny WebMCP playground. It has no account and no backend database. It is one shared world where I can play normally—and an AI agent can join me through tools exposed directly by the page.”

### 0:18–0:42 — Human play

Screen: Move with WASD, collect a spark, click **Toss a ball**, then **Quack**.

Voice: “Everything works as a regular website. I can waddle with the keyboard or pointer, collect sparks, toss toys, and change my local duck. The timeline and progress are stored only in this browser.”

### 0:42–1:28 — Agent play

Screen: In ChatGPT's in-app browser, ask the suggested judging prompt. Keep the page visible while tools run. Show the duck becoming Pixel and purple, the ball appearing, the speech bubble, and the surprise.

Voice: “With WebMCP, the page registers nine focused tools. ChatGPT first reads the real game state. Then it calls the same customization, toy, quack, and surprise actions my buttons use. Each result appears live in the canvas and local memory—there is no shadow UI and no separate private API.”

### 1:28–1:50 — Collaboration and control

Screen: Ask the agent to move toward a spark, then press an arrow key while it moves.

Voice: “The interesting part is collaboration. The agent can choose a destination using normalized coordinates, but keyboard or pointer input immediately takes control back. The human remains an active participant rather than approving an invisible automation afterward.”

### 1:50–2:15 — Safety and implementation

Screen: Briefly show `public/webmcp.js`, a tool schema, and the live agent-access indicator.

Voice: “The tools are registered from the top-level page with strict closed schemas, small enums, numeric bounds, and runtime validation. Read operations are marked read-only. Reset is local-only and requires an exact confirmation. Without WebMCP, every feature still has a normal UI.”

### 2:15–2:25 — Close

Screen: Return to the canvas and trigger **Surprise me**.

Voice: “NottyDuck is a deliberately tiny glimpse of an open web where people and agents can inhabit and create in the same interfaces. One tiny duck, two players.”

## Recording checklist

- Keep the final video under 3 minutes.
- Record at 1080p with readable browser text.
- Include clear spoken audio; captions are strongly recommended.
- Show the URL bar, a successful WebMCP interaction, and its visible effect.
- Set the uploaded YouTube video to **Public**, not unlisted, if the form requires public visibility.
- Add the final YouTube URL above and to the Devpost submission.

## Final submission checklist

- [x] Live app URL
- [x] Public-ready repository with complete source and setup instructions
- [x] OSI-approved license at repository root
- [x] WebMCP registration visible in source
- [x] Paste-ready description
- [x] Under-3-minute demo script
- [ ] Record and publish the YouTube demo with audio
- [ ] Add the video URL to this file and Devpost
- [ ] Submit the Devpost form before the official deadline
