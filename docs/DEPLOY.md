# Deploying to your personal Cloudflare account

The MVP runs in **mock mode** (no AI/containers), so it deploys on the **free
Workers plan** — just Workers + static assets. Live code execution and the live
tutor need a **Workers Paid** account (see bottom).

## One-time

```bash
pnpm install
npx wrangler login          # opens browser; authorizes your personal account
```

## Deploy (mock mode — free)

```bash
pnpm build                  # emits dist/ + dist/.assetsignore
npx wrangler deploy --env=""   # top-level env (RUNNER_MODE/TUTOR_MODE = mock)
```

Wrangler prints a `https://agents-academy.<your-subdomain>.workers.dev` URL.
That's the whole site: landing, curriculum, and the live "Your first agent"
lesson (edit → run (simulated) → grade → tutor).

> `--env=""` targets the top-level config. `--env staging` / `--env production`
> select those blocks; `production` flips the flags to `sandbox`/`live` and
> expects the Paid bindings below to exist.

## Going live (Workers Paid — real execution + tutor)

1. In the dashboard, create: a D1 db, a KV namespace, an R2 bucket, a Vectorize
   index, and enable Workers AI + AI Gateway.
2. Uncomment the bindings block in `wrangler.jsonc` and paste the IDs.
3. Provision the Sandbox container image (`container/Dockerfile`, to be added).
4. `npx wrangler deploy --env production` (flags are already `sandbox`/`live`).

Nothing else in the code changes — the runner/tutor read these flags at runtime.

## Custom domain (optional)

Add a `routes` entry under the chosen env in `wrangler.jsonc`, or map a custom
domain in the dashboard under the Worker's Settings → Domains & Routes.
