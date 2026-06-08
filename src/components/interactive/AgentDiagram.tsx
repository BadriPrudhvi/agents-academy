import { useMemo } from "react";
import { ReactFlow, Background, BackgroundVariant, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DiagramNode, DiagramEdge } from "@/lib/content/types";

const TONE: Record<string, string> = {
  user: "var(--color-foreground-300)",
  agent: "var(--color-accent-100)",
  model: "var(--color-ai-100)",
  tool: "var(--color-compute-100)",
  state: "var(--color-media-100)",
};

interface Props {
  title?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export default function AgentDiagram({ title, nodes, edges }: Props) {
  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        position: { x: n.x, y: n.y },
        data: { label: n.label },
        draggable: false,
        connectable: false,
        selectable: false,
        style: {
          border: `1.5px solid ${TONE[n.tone ?? "agent"]}`,
          borderRadius: 10,
          background: "var(--color-node-bg)",
          color: "var(--color-foreground-100)",
          fontSize: 12,
          fontWeight: 500,
          padding: "8px 12px",
          width: 150,
          textAlign: "center" as const,
        },
      })),
    [nodes],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e, i) => ({
        id: `e${i}`,
        source: e.from,
        target: e.to,
        label: e.label,
        animated: true,
        style: { stroke: "var(--color-node-border)" },
        labelStyle: { fill: "var(--color-foreground-300)", fontSize: 10 },
      })),
    [edges],
  );

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-border-100 bg-background-content">
      {title && <figcaption className="border-b border-border-100 px-4 py-2 text-sm font-medium">{title}</figcaption>}
      <div style={{ height: 300 }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnScroll={false}
          panOnDrag={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--color-decor-dots-100)" />
        </ReactFlow>
      </div>
    </figure>
  );
}
