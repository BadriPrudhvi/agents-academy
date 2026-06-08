# Agents Academy

An interactive course that takes you from zero to shipping **AI agents on Cloudflare**.
Every lesson runs real code in the browser, grades your work, and a grounded tutor is
one question away. Built end-to-end on the Cloudflare developer platform.

Lessons adapt to your background: concept-first framing for analysts and finance folks,
hands-on code for data scientists and engineers — switch roles anytime in the header.

## Curriculum

Eight tracks; **8 lessons are live and interactive** across three of them, the rest are
outlined as "coming soon".

| Track | Status |
| --- | --- |
| Foundations | Live — what an agent is, the Workers model, your first deploy |
| Your first agent | Live — the Agent class, Workers AI, state, streaming |
| Tools | Live — code-mode tools, Sandbox execution, data + finance agents |
| Channels · Memory · Durability · MCP · Production | Planned |

## Stack

Mirrors the official `cloudflare/fe/marketing-site` stack:

- **Astro 5 (SSR) on Cloudflare Workers** (`@astrojs/cloudflare`) + **React 19 islands**
- **Tailwind v4** with `@theme` tokens **vendored verbatim** from marketing-site's `global.css`
- **Monaco** editor, **Shiki** highlighting, **Phosphor** icons, **Motion** animation
- Astro API routes for the runner, tutor, agent loop, and streaming chat

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:4321
```

Start at `/learning/foundations/what-is-an-agent`, or browse `/learning`.
Local `astro dev` is offline (mock runner + grounded offline tutor); live Workers AI
and Sandbox execution run in the deployed environment.

## Quality gate

Content is the product, so the bar is enforced in CI, not by hand. Run before every deploy:

```bash
pnpm test           # Vitest unit + component suite
pnpm typecheck      # tsc --noEmit
pnpm lint:content   # rubric + grading invariant (see docs/lesson-rubric.md)
pnpm build          # production build (Workers)
```

`lint:content` enforces the rubric **and** the grading invariant: each lab's reference
solution must pass all hidden checks and the starter must fail at least one. (It has
already caught a real authoring bug — see git history.)

## How it fits together

```
Astro SSR (Workers)
  Pages    /  ·  /learning  ·  /learning/[track]/[lesson]
  Islands  CodeLab · AgentStudio · AgentRun · StreamingChat · WatchItRun
           FlowDiagram · Quiz · TutorPanel · RolePicker
  API      POST /api/run         runner (mock | sandbox), server-side hidden checks
           POST /api/agent-run   a real model+tools loop (goal → think → tool → observe → answer)
           POST /api/chat-stream token streaming from Workers AI (SSE)
           POST /api/ai-code     natural language → code, denylist-validated
           POST /api/studio-run  runs Agent Studio code for real in the Sandbox
           POST /api/tutor       grounded answers (mock | live Workers AI)
           POST /api/feedback    "was this helpful?" → Analytics Engine
  Lib      content/  typed lessons + rubric model (CMS/D1 is the future swap-point)
           runner/   engine abstraction + shared grading contract
           api/      shared route helpers (json, env, body parsing)
           ui/       shared island primitives (tones, Monaco options, output console)
```

Lessons are typed objects (`src/lib/content/types.ts`) rendered by a single
`BlockRenderer` over a small block vocabulary (prose, code, callout, diagram, quiz,
and the interactive blocks). Reusable UI lives in `src/components/{ui,content,curriculum}`.

## Architecture: two Workers

- **`agents-academy`** — the Astro SSR app + API. Uses the `AI` binding; reaches the
  runner through a `RUNNER` **service binding**.
- **`agents-academy-runner`** — owns the `@cloudflare/sandbox` container; not publicly
  routable. Executes Python/JS and returns real stdout.

```bash
# deploy the runner (prebuilt python sandbox image; no local Docker build needed)
npx wrangler deploy -c runner/wrangler.jsonc
# deploy the app (live tutor + real execution)
pnpm build && npx wrangler deploy --env production
```

See [`docs/DEPLOY.md`](docs/DEPLOY.md) for the full deployment guide.

## What's real vs. mocked (honest status)

Deployed via `--env production` (Workers Paid):

| Piece | Status |
| --- | --- |
| Design tokens / layout | Real (vendored marketing-site `@theme` tokens) |
| Tutor (`/api/tutor`) | **Live** — Workers AI, grounded in lesson content, plain-language + injection guardrails |
| Agent loop (`/api/agent-run`) | **Live** — a real model+tools loop the learner drives in plain English |
| Streaming chat (`/api/chat-stream`) | **Live** — token streaming from Workers AI over SSE |
| Agent Studio + labs | **Real** — build by clicking, ask the AI to write code, run JS/Python in a per-session Sandbox |
| AI codegen (`/api/ai-code`) | **Live** — constrained to the lesson's `codemode.*` tools, output denylist-validated |
| Progress | localStorage (D1 swap-point documented) |

Runner hardening: per-session sandbox IDs, an execution timeout, and a server-side
denylist (no `fetch`/`import`/`require`/`process`/network) applied to all learner and
AI-generated code.

> Design system: the licensed `@cloudflare/kumo` components and Kunst Grotesk / Apercu
> Mono Pro fonts are not reachable from a public repo, so the open `@theme` tokens are
> vendored verbatim and fonts fall back to Inter / system mono. Swap-point is the top of
> `src/global.css` — brand fidelity upgrades with no other code changes.
