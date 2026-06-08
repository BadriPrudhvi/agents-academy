import { describe, it, expect } from "vitest";
import { TONE_VAR, NODE_TONE } from "@/lib/ui/tones";

describe("TONE_VAR palette (AgentRun trace)", () => {
  it("maps each tone to its exact CSS variable", () => {
    expect(TONE_VAR).toEqual({
      foreground: "var(--color-foreground-300)",
      ai: "var(--color-ai-100)",
      compute: "var(--color-compute-100)",
      media: "var(--color-media-100)",
    });
  });
});

describe("NODE_TONE palette (node-graph)", () => {
  it("maps each node tone to its token (marketing-site palette)", () => {
    expect(NODE_TONE).toEqual({
      user: "var(--color-accent-100)",
      agent: "var(--color-compute-100)",
      model: "var(--color-ai-100)",
      tool: "var(--color-media-100)",
      state: "var(--color-media-100)",
      output: "var(--color-foreground-300)",
    });
  });
});
