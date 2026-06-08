import { describe, it, expect } from "vitest";
import { TONE_VAR, FLOW_VARIANT } from "@/lib/ui/tones";

describe("TONE_VAR palette", () => {
  it("maps each semantic tone to its exact CSS variable (locks diagram/run colours)", () => {
    expect(TONE_VAR).toEqual({
      foreground: "var(--color-foreground-300)",
      ai: "var(--color-ai-100)",
      compute: "var(--color-compute-100)",
      media: "var(--color-media-100)",
    });
  });
});

describe("FLOW_VARIANT classes", () => {
  it("preserves the codemode-style box/label class pairs", () => {
    expect(FLOW_VARIANT).toEqual({
      user: { box: "border-accent-100/40 bg-accent-100/5", label: "text-accent-100" },
      model: { box: "border-ai-100/40 bg-ai-100/5", label: "text-ai-100" },
      tool: { box: "border-compute-100/50 bg-compute-100/10", label: "text-compute-100" },
      result: { box: "border-border-100 bg-background-300", label: "text-text-secondary" },
    });
  });
});
