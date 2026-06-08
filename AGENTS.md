# Agents Academy — working agreement

## Pre-deploy quality gate (REQUIRED, in order)

Run and pass ALL of these before **every** `wrangler deploy`:

1. `pnpm test` (Vitest unit + component suite)
2. `pnpm typecheck`
3. `pnpm lint:content`
4. `pnpm build`
5. **Critic review** — a deliberate self-critique pass over the changed code and
   logic (use the `review` subagent for non-trivial changes). Check:
   - Correctness of logic: edge cases, off-by-one, geometry/math, async &
     control flow, empty/error states.
   - That the change actually does what was asked (re-read the request).
   - Regressions: does this break other lessons, components, or shared types?
   - Honesty: no mock passed off as real; no dead code or silent failures.
   Surface findings, fix anything material, then re-run steps 1–4.

Only deploy when the critic pass is clean. Never deploy on a hunch.

## Deploy

- App: `npx wrangler deploy --env production` (has AI, RUNNER, FEEDBACK bindings)
- Runner: `npx wrangler deploy -c runner/wrangler.jsonc`

## Notes

- Do **not** commit unless explicitly asked.
- Local `astro dev` is offline/mock; live Workers AI + Sandbox only run in the
  deployed `production` env.
- Diagrams: all diagrams use the `diagram` block (NodeGraph) — a horizontal,
  theme-aware SVG node-graph in the Cloudflare marketing-site style (dotted
  canvas, labels above, icons, corner handles, animated dashed connectors).
  Loops use a curved feedback edge; branches fan up/down. Pure SVG (not React
  Flow), so no keyboard-nav text leaks into crawled/reader output.
