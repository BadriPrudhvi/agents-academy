/**
 * Single source for the agent-role colour language used across the diagrams and
 * the live run trace. Two representations live here because they serve two
 * rendering paths:
 *
 *  - TONE_VAR    — CSS custom-property references, used where colour is applied
 *                  as an inline `fill`/`stroke`/`color` (SVG AgentDiagram, the
 *                  AgentRun step trace).
 *  - FLOW_VARIANT — Tailwind utility-class pairs, used by the vertical
 *                  FlowDiagram boxes (border + background, and the label colour).
 *
 * Keeping them together means the palette is defined once and every consumer
 * references it, with no literal `var(--color-…)` strings duplicated per file.
 */

/** Semantic palette as CSS custom-property references. */
export const TONE_VAR = {
  foreground: "var(--color-foreground-300)",
  accent: "var(--color-accent-100)",
  ai: "var(--color-ai-100)",
  compute: "var(--color-compute-100)",
  media: "var(--color-media-100)",
} as const;

/** Tailwind class pairs for the FlowDiagram boxes (border+bg / label colour). */
export const FLOW_VARIANT: Record<string, { box: string; label: string }> = {
  user: { box: "border-accent-100/40 bg-accent-100/5", label: "text-accent-100" },
  model: { box: "border-ai-100/40 bg-ai-100/5", label: "text-ai-100" },
  tool: { box: "border-compute-100/50 bg-compute-100/10", label: "text-compute-100" },
  result: { box: "border-border-100 bg-background-300", label: "text-text-secondary" },
};
