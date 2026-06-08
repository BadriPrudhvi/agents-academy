import { motion } from "motion/react";
import type { DiagramEdge, DiagramNode } from "@/lib/content/types";
import { TONE_VAR } from "@/lib/ui/tones";

const TONE: Record<string, string> = {
  user: TONE_VAR.foreground,
  agent: TONE_VAR.accent,
  model: TONE_VAR.ai,
  tool: TONE_VAR.compute,
  state: TONE_VAR.media,
  output: TONE_VAR.muted,
};

const NODE_W = 150;
const NODE_H = 48;
const HALF_W = NODE_W / 2;
const HALF_H = NODE_H / 2;

interface Props {
  title?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/**
 * Point on a node's rectangle border along the ray from the node centre toward
 * (tx, ty). Lets edges connect at the correct side for ANY direction — not just
 * left→right — so diagonal and feedback edges don't shoot out of the wrong face.
 */
function borderPoint(cx: number, cy: number, tx: number, ty: number): [number, number] {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const scale = 1 / Math.max(Math.abs(dx) / HALF_W, Math.abs(dy) / HALF_H);
  return [cx + dx * scale, cy + dy * scale];
}

/**
 * Static, non-editable diagram renderer.
 *
 * We avoid React Flow / xyflow here because its keyboard-editing guidance leaks
 * into crawled/reader text ("press enter or space to select a node"), which is
 * confusing in a learning article. This is visual + readable, supports curved
 * feedback edges (so we can draw an actual loop), and reveals with a calm,
 * one-time stagger.
 */
export default function AgentDiagram({ title, nodes, edges }: Props) {
  const width = Math.max(720, ...nodes.map((n) => n.x + NODE_W + 30));
  const height = Math.max(300, ...nodes.map((n) => n.y + NODE_H + 32));
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

            const fcx = from.x + HALF_W;
            const fcy = from.y + HALF_H;
            const tcx = to.x + HALF_W;
            const tcy = to.y + HALF_H;

            const [x1, y1] = borderPoint(fcx, fcy, tcx, tcy);
            const [x2, y2] = borderPoint(tcx, tcy, fcx, fcy);

            // Unit normal to the edge direction — the axis we offset the label along.
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const lx = mx + nx * -10;
            const ly = my + ny * -10;

            return (
              <motion.g
                key={`${edge.from}-${edge.to}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.15 + i * 0.12 }}
              >
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-node-border)" strokeWidth="2" markerEnd="url(#arrow)" />
                {edge.label && (
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="var(--color-foreground-300)" fontSize="12">
                    {edge.label}
                  </text>
                )}
              </motion.g>
            );
          })}

          {nodes.map((node, i) => (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              <rect
                x={node.x}
                y={node.y}
                width={NODE_W}
                height={NODE_H}
                rx="10"
                fill="var(--color-node-bg)"
                stroke={TONE[node.tone ?? "agent"]}
                strokeWidth="1.5"
              />
              <text
                x={node.x + HALF_W}
                y={node.y + HALF_H + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-foreground-100)"
                fontSize="13"
                fontWeight="600"
              >
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>
    </figure>
  );
}
