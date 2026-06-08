import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import NodeGraph from "@/components/interactive/NodeGraph";
import type { DiagramEdge, DiagramNode } from "@/lib/content/types";

const nodes: DiagramNode[] = [
  { id: "a", label: "Request", tone: "user", icon: "globe", x: 0, y: 80 },
  { id: "b", label: "Worker", tone: "agent", icon: "code", x: 240, y: 80 },
  { id: "c", label: "Response", tone: "output", icon: "arrowOut", x: 480, y: 0 },
];
const edges: DiagramEdge[] = [
  { from: "a", to: "b" },
  { from: "b", to: "c", label: "return" },
];

describe("NodeGraph", () => {
  it("renders an accessible SVG titled by the diagram title", () => {
    const { container } = render(<NodeGraph title="Request flow" nodes={nodes} edges={edges} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-label")).toBe("Request flow");
    expect(svg?.getAttribute("role")).toBe("img");
  });

  it("renders every node label and the edge label", () => {
    const { container } = render(<NodeGraph title="t" nodes={nodes} edges={edges} />);
    const text = container.textContent ?? "";
    for (const label of ["Request", "Worker", "Response", "return"]) {
      expect(text).toContain(label);
    }
  });

  it("draws a box + inner frame + 4 corner handles per node, and one connector per edge", () => {
    const { container } = render(<NodeGraph title="t" nodes={nodes} edges={edges} />);
    // 1 background dots rect + per node: 1 box + 1 inner dashed + 4 handles = 6
    // (the icons in this fixture use circle/path, not rect, so the count is exact)
    expect(container.querySelectorAll("rect").length).toBe(1 + nodes.length * 6);
    // connectors are the dashed "6 6" paths (icon paths have no dash array)
    expect(container.querySelectorAll('path[stroke-dasharray="6 6"]').length).toBe(edges.length);
  });

  it("renders a caption when provided", () => {
    const { getByText } = render(<NodeGraph title="t" caption="how it flows" nodes={nodes} edges={edges} />);
    expect(getByText("how it flows")).toBeTruthy();
  });
});
