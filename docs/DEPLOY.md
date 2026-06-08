# Deploying to your own Cloudflare account

The app is two Workers:

- **`agents-academy`** — the Astro SSR site + API routes. Needs the **AI** binding
  (tutor, agent loop, code generation) and a **service binding** to the runner.
- **`agents-academy-runner`** — owns the `@cloudflare/sandbox` container that runs
  learner/AI code for real. Not publicly routable.

Live execution and the live tutor need a **Workers Paid** account. Without the
Paid bindings the app still runs: the runner falls back to a mock and the tutor
to a grounded offline answer, so the full edit → run → grade → tutor loop works.

## One-time

```bash
pnpm install
npx wrangler login          # opens browser; authorizes your account
```

## Deploy

Deploy the runner first (the app's service binding targets it), then the app:

```bash
# runner — uses the prebuilt python sandbox image; no local Docker build needed
npx wrangler deploy -c runner/wrangler.jsonc

# app — production flips RUNNER_MODE=sandbox and TUTOR_MODE=live
pnpm build && npx wrangler deploy --env production
```

Wrangler prints a `https://agents-academy.<your-subdomain>.workers.dev` URL —
the whole site: landing, curriculum, and the interactive lessons.

> Environments: omit `--env` (or `--env=""`) for the top-level config
> (`RUNNER_MODE`/`TUTOR_MODE` = mock); `--env staging` / `--env production`
> select those blocks. `production` expects the Paid bindings below.

## Bindings (Workers Paid)

The production block in `wrangler.jsonc` wires:

- **AI** — Workers AI (tutor, agent loop, `/api/ai-code`).
- **RUNNER** — service binding to `agents-academy-runner`.
- **FEEDBACK** — Analytics Engine dataset for lesson feedback (optional; logs if absent).

`RUNNER_MODE=sandbox` and `TUTOR_MODE=live` are environment variables read at
runtime — nothing in the code changes between mock and live.

## Customizing the sandbox container

The runner references the prebuilt `cloudflare/sandbox` python image directly, so
no local Docker build is required. To customize it, build from `runner/Dockerfile`
in an environment where Docker builds are permitted and update `runner/wrangler.jsonc`.

## Custom domain (optional)

Add a `routes` entry under the chosen env in `wrangler.jsonc`, or map a custom
domain in the dashboard under the Worker's Settings → Domains & Routes.
