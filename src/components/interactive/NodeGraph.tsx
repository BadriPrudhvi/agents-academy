import { useId, type ReactElement } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { DiagramEdge, DiagramNode } from "@/lib/content/types";
import { NODE_TONE } from "@/lib/ui/tones";

/**
 * Horizontal node-graph diagram in the Cloudflare marketing-site style: a dotted
 * canvas, positioned colour-coded nodes with the label above the box, an icon
 * inside a dashed inner frame, corner "selection handle" squares, and dashed
 * connectors (straight or curved for feedback/loop edges).
 *
 * Rendered as pure SVG (not React Flow): it scales with one viewBox, and we own
 * every bit of text — so none of React Flow's keyboard-nav guidance leaks into
 * crawled/reader output, which is why we moved off xyflow originally.
 */

const NODE_W = 150;
const NODE_H = 92;
const HALF_W = NODE_W / 2;
const HALF_H = NODE_H / 2;
const PAD_X = 28;
const PAD_TOP = 34; // room for the label sitting above the first row of boxes
const PAD_BOTTOM = 24;

/** 24×24 stroke icons (fill:none, stroke:currentColor) keyed by name. */
const ICONS: Record<string, ReactElement> = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  agent: (
    <>
      <rect x="5" y="7" width="14" height="11" rx="2" />
      <path d="M12 7V4M9 12h.01M15 12h.01M3 13h2M19 13h2" />
    </>
  ),
  code: <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />,
  sparkle: <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15l-1.8-4.2L5.5 9l4.7-1.3z" />,
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.7 3 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3 3 7 3s7-1.3 7-3" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9l3 3-3 3M13 15h4" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 10h18M9 10v9" />
    </>
  ),
  arrowOut: <path d="M3 5v14M7 12h11M14 7l5 5-5 5" />,
  brain: <path d="M9 6a3 3 0 0 0-3 3 3 3 0 0 0-1 5.8A3 3 0 0 0 9 18m0-12a3 3 0 0 1 6 0 3 3 0 0 1 1 5.8A3 3 0 0 1 15 18M9 6v12m6-12v12" />,
  wrench: <path d="M14.5 5.5a3.5 3.5 0 0 0-4.6 4.2l-5.6 5.6 2.4 2.4 5.6-5.6a3.5 3.5 0 0 0 4.2-4.6l-2 2-2-2z" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  shield: <path d="M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />,
  message: <path d="M4 5h16v10H8l-4 4z" />,
};

function Icon({ name }: { name?: string }) {
  const glyph = name ? ICONS[name] : undefined;
  if (!glyph) return null;
  return (
    <g fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      {glyph}
    </g>
  );
}

/** Point where the ray from a node centre toward (tx,ty) crosses its border. */
function borderPoint(cx: number, cy: number, tx: number, ty: number): [number, number] {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const scale = 1 / Math.max(Math.abs(dx) / HALF_W, Math.abs(dy) / HALF_H);
  return [cx + dx * scale, cy + dy * scale];
}

interface Props {
  title?: string;
  caption?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export default function NodeGraph({ title, caption, nodes, edges }: Props) {
  const uid = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const at = new Map(nodes.map((n) => [n.id, n]));

  // Shift the whole drawing right/down so labels + handles never clip the edges.
  const ox = PAD_X;
  const oy = PAD_TOP;

  // Feedback/loop edges (curve set) are routed as a downward arc *below* the
  // boxes — labels live above the boxes, so this avoids collisions. Reserve
  // headroom for that arc when any edge is curved.
  const LOOP_DROP = 46;
  const maxBottom = Math.max(...nodes.map((n) => n.y + NODE_H));
  const hasCurve = edges.some((e) => e.curve);
  const width = Math.max(...nodes.map((n) => n.x + NODE_W)) + PAD_X * 2;
  const height = maxBottom + PAD_TOP + PAD_BOTTOM + (hasCurve ? LOOP_DROP + 18 : 0);
  const loopY = maxBottom + oy + LOOP_DROP; // y of the feedback-arc control point

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-border-100 bg-background-content">
      {title && <figcaption className="border-b border-border-100 px-4 py-2 text-sm font-medium">{title}</figcaption>}
      <div className="overflow-x-auto px-2 py-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[640px]"
          role="img"
          aria-label={title ?? "Architecture diagram"}
        >
          <defs>
            <pattern id={`dots-${uid}`} width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="var(--color-decor-dots-100)" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={width} height={height} fill={`url(#dots-${uid})`} />

          {/* edges (dashed connectors) */}
          {edges.map((e, i) => {
            const from = at.get(e.from);
            const to = at.get(e.to);
            if (!from || !to) return null;
            const fcx = from.x + HALF_W + ox;
            const fcy = from.y + HALF_H + oy;
            const tcx = to.x + HALF_W + ox;
            const tcy = to.y + HALF_H + oy;
            const [x1, y1] = borderPoint(fcx - ox, fcy - oy, tcx - ox, tcy - oy);
            const [x2, y2] = borderPoint(tcx - ox, tcy - oy, fcx - ox, fcy - oy);
            const sx = x1 + ox;
            const sy = y1 + oy;
            const ex = x2 + ox;
            const ey = y2 + oy;
            const mx = (sx + ex) / 2;
            const my = (sy + ey) / 2;
            // Curved edges (feedback/loop) bow downward below the boxes; straight
            // otherwise. Connect from the bottom of each box for a clean loop.
            const curved = !!e.curve;
            const d = curved
              ? `M ${fcx} ${from.y + NODE_H + oy} Q ${mx} ${loopY} ${tcx} ${to.y + NODE_H + oy}`
              : `M ${sx} ${sy} L ${ex} ${ey}`;
            const labelX = curved ? mx : mx;
            const labelY = curved ? loopY + 13 : my - 6;
            return (
              <motion.g
                key={`e-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
              >
                {/* Continuous "marching ants" flow toward the target, like the
                    MVP's animated React Flow edges. */}
                <motion.path
                  d={d}
                  fill="none"
                  stroke="var(--color-text-secondary)"
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                  initial={{ strokeDashoffset: 0 }}
                  animate={reduceMotion ? { strokeDashoffset: 0 } : { strokeDashoffset: -12 }}
                  transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, ease: "linear", duration: 0.9 }}
                />
                {e.label && (
                  <text x={labelX} y={labelY} textAnchor="middle" fill="var(--color-text-secondary)" fontSize="11">
                    {e.label}
                  </text>
                )}
              </motion.g>
            );
          })}

          {/* nodes */}
          {nodes.map((n, i) => {
            const x = n.x + ox;
            const y = n.y + oy;
            const tone = NODE_TONE[n.tone ?? "agent"] ?? NODE_TONE.agent;
            const cx = x + HALF_W;
            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
              >
                {/* label above */}
                <text x={cx} y={y - 10} textAnchor="middle" fill={tone} fontSize="13" fontWeight="600" fontFamily="var(--font-mono)">
                  {n.label}
                </text>
                {/* box */}
                <rect x={x} y={y} width={NODE_W} height={NODE_H} rx="12" fill="var(--color-node-bg)" stroke={tone} strokeWidth="1.5" />
                {/* inner dashed frame */}
                <rect
                  x={x + 12}
                  y={y + 12}
                  width={NODE_W - 24}
                  height={NODE_H - 24}
                  rx="8"
                  fill="none"
                  stroke={tone}
                  strokeOpacity={0.45}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                {/* icon */}
                <g transform={`translate(${cx - 16}, ${y + HALF_H - 16}) scale(1.33)`} style={{ color: tone }}>
                  <Icon name={n.icon} />
                </g>
                {/* corner selection handles */}
                {[
                  [x, y],
                  [x + NODE_W, y],
                  [x, y + NODE_H],
                  [x + NODE_W, y + NODE_H],
                ].map(([hx, hy], hi) => (
                  <rect key={hi} x={hx - 4} y={hy - 4} width="8" height="8" fill="var(--color-node-bg)" stroke={tone} strokeWidth="1.5" />
                ))}
              </motion.g>
            );
          })}
        </svg>
      </div>
      {caption && <p className="border-t border-border-100 px-4 py-2 text-center text-xs text-text-secondary">{caption}</p>}
    </figure>
  );
}
