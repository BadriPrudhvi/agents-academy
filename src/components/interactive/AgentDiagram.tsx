import type { DiagramEdge, DiagramNode } from "@/lib/content/types";

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

/**
 * Static, non-editable diagram renderer.
 *
 * We intentionally avoid React Flow here because its keyboard-editing guidance
 * leaks into crawled/reader text ("press enter or space to select a node"),
 * which is confusing in a learning article. This component is visual + readable.
 */
export default function AgentDiagram({ title, nodes, edges }: Props) {
  const width = Math.max(720, ...nodes.map((n) => n.x + 180));
  const height = Math.max(300, ...nodes.map((n) => n.y + 80));
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-border-100 bg-background-content">
      {title && <figcaption className="border-b border-border-100 px-4 py-2 text-sm font-medium">{title}</figcaption>}
      <div className="overflow-x-auto bg-background-300 p-4" aria-label={title ?? "Agent diagram"}>
        <svg viewBox={`0 0 ${width} ${height}`} className="min-h-[260px] w-full min-w-[520px]" role="img">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="var(--color-node-border)" />
            </marker>
          </defs>

          {edges.map((edge, i) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            const x1 = from.x + 150;
            const y1 = from.y + 24;
            const x2 = to.x;
            const y2 = to.y + 24;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            return (
              <g key={`${edge.from}-${edge.to}-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-node-border)" strokeWidth="2" markerEnd="url(#arrow)" />
                {edge.label && (
                  <text x={midX} y={midY - 7} textAnchor="middle" fill="var(--color-foreground-300)" fontSize="12">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width="150"
                height="48"
                rx="10"
                fill="var(--color-node-bg)"
                stroke={TONE[node.tone ?? "agent"]}
                strokeWidth="1.5"
              />
              <text x={node.x + 75} y={node.y + 29} textAnchor="middle" fill="var(--color-foreground-100)" fontSize="13" fontWeight="600">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}
