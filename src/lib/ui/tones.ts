/**
 * Single source for the agent-role colour language, as CSS custom-property
 * references, used where colour is applied inline (SVG fill/stroke/`color`).
 *
 *  - TONE_VAR   — the AgentRun step-trace palette.
 *  - NODE_TONE  — the node-graph (NodeGraph) palette, keyed by DiagramNode tone.
 *
 * Defining them here means the palette lives in one place, with no literal
 * `var(--color-…)` strings duplicated across components.
 */

/** Palette for the AgentRun live step trace. */
export const TONE_VAR = {
  foreground: "var(--color-foreground-300)",
  ai: "var(--color-ai-100)",
  compute: "var(--color-compute-100)",
  media: "var(--color-media-100)",
} as const;

/**
 * Node-graph palette (DiagramNode.tone → token). Mirrors the Cloudflare
 * marketing-site look: human/input = accent, the agent/worker = compute,
 * model = ai, tools/state = media, terminal output = neutral foreground.
 */
export const NODE_TONE: Record<string, string> = {
  user: "var(--color-accent-100)",
  agent: "var(--color-compute-100)",
  model: "var(--color-ai-100)",
  tool: "var(--color-media-100)",
  state: "var(--color-media-100)",
  output: "var(--color-foreground-300)",
};
