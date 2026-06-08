import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FlowDiagram from "@/components/interactive/FlowDiagram";
import type { FlowStep } from "@/lib/content/types";

const steps: FlowStep[] = [
  { label: "Goal", tone: "user", text: "what you ask" },
  { label: "Model decides", tone: "model", text: "picks a tool" },
  { label: "Tool call", tone: "tool", code: "tool(args)" },
  { label: "Reads result", tone: "result", text: "data back" },
  { label: "Answers", tone: "model", text: "final reply" },
];

describe("FlowDiagram", () => {
  it("renders every step label and code", () => {
    render(<FlowDiagram title="The loop" steps={steps} />);
    for (const s of steps) expect(screen.getByText(s.label)).toBeInTheDocument();
    expect(screen.getByText("tool(args)")).toBeInTheDocument();
  });

  it("renders the loop chip + note for a valid loop range", () => {
    render(<FlowDiagram steps={steps} loop={{ from: 1, to: 3, label: "repeats until done", note: "↑ loop back" }} />);
    expect(screen.getByText("repeats until done")).toBeInTheDocument();
    expect(screen.getByText("↑ loop back")).toBeInTheDocument();
  });

  it("degrades to linear (no loop chip) for an invalid full-range loop", () => {
    render(<FlowDiagram steps={steps} loop={{ from: 0, to: 4, label: "should-not-render" }} />);
    expect(screen.queryByText("should-not-render")).not.toBeInTheDocument();
  });
});
