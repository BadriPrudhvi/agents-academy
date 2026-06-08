# Agents Academy

An interactive course that takes you from zero to shipping **AI agents on Cloudflare**.
Every lesson runs real code, grades your work, and a grounded tutor is one question away.
Built end-to-end on the Cloudflare developer platform.

This repo is the **MVP vertical slice** from the project plan: one lesson, authored and
working end-to-end (edit → run → grade → tutor), on the real design system, behind a
tested content-quality gate. Breadth (more lessons/tracks) is intentionally deferred.

## Stack

Mirrors the official `cloudflare/fe/marketing-site` stack:

- **Astro (SSR) on Cloudflare Workers** (`@astrojs/cloudflare`) + **React 19 islands**
- **Tailwind v4** with `@theme` tokens **vendored verbatim** from marketing-site's `global.css`
- **Phosphor icons**, **Shiki** highlighting
- Astro API routes for the runner + tutor

> Production target upgrades Astro 5 → 6 to match marketing-site exactly; the
> component/design-system code is identical.

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:4321
```

Try the live lesson: `/learning/first-agent/your-first-agent`.

```bash
pnpm build          # production build (Workers)
pnpm lint:content   # content-quality gate (rubric + grading invariant)
```

## Spike results (recorded)

- **Spike A — design system.** Real `@cloudflare/kumo` + the licensed Kunst Grotesk /
  Apercu Mono Pro fonts are not reachable from a public repo, so we ship the **fallback
  path**: the open `@theme` tokens are vendored verbatim and fonts fall back to Inter /
  system mono. **Swap-point:** `src/global.css` (top comment) — add the Kumo `@import`
  and real fonts when the internal registry is available; brand fidelity upgrades with
  no other code changes.
- **Spike B — runner.** No Workers Paid account in this environment, so live container
  execution is **flagged off** (`RUNNER_MODE=mock`). The **mock runner** (`src/lib/runner/mock.ts`)
  simulates execution from the learner's source so the full loop works at zero cost.
  **Swap-point:** `src/lib/runner/index.ts` → `createSandboxRunner` sketch; flip
  `RUNNER_MODE=sandbox` once the container image + quotas/egress are provisioned. The
  grading contract (`grade.ts`) is reused verbatim against real stdout.

## How it fits together

```
Astro SSR (Workers) ── React islands: CodeLab · Quiz · TutorPanel · ThemeToggle
  Pages:  /  ·  /learning  ·  /learning/[track]/[lesson]
  API:    POST /api/run     -> runner (mock | sandbox), server-side hidden checks
          POST /api/tutor    -> grounded answers (mock | live Workers AI + AutoRAG)
  Content: src/lib/content/* (typed seed layer; CMS/D1+KV is the future swap-point)
  Runner:  src/lib/runner/*  (engine abstraction + shared grading contract)
```

## Content model & quality

Lessons are typed objects (`src/lib/content/types.ts`) authored to a rubric
(`docs/lesson-rubric.md`). `pnpm lint:content` enforces the rubric **and** the grading
invariant: the reference solution must pass all checks and the starter must fail at
least one. (It already caught one real authoring bug — see git history.)

## What's mocked vs. real (honest status)

| Piece | MVP status | Swap-point |
| --- | --- | --- |
| Design tokens / layout | Real (vendored) | Add Kumo + fonts in `global.css` |
| Lesson loop (edit/run/grade) | Real logic, **simulated** stdout | `RUNNER_MODE=sandbox` |
| Tutor | Real grounding from lesson content | `TUTOR_MODE=live` (Workers AI + AutoRAG) |
| Progress | localStorage | D1-backed `/api/progress` |

## Provision checklist (to go live)

Workers Paid account; then enable & bind: Containers/Sandbox, Durable Objects, D1, KV,
R2, Vectorize/AI Search, AI Gateway. Uncomment the bindings in `wrangler.jsonc`, set
`account_id`, and flip `RUNNER_MODE`/`TUTOR_MODE` in `env.production`.
