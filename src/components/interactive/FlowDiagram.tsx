import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import type { FlowStep } from "@/lib/content/types";
import { FLOW_VARIANT as VARIANT } from "@/lib/ui/tones";

/**
 * Vertical agent-flow diagram, ported from threepointone/codemode-talk's
 * ToolCallingSlide: a stack of colour-coded rounded boxes joined by downward
 * chevron arrows, revealed with a staggered fade + rise. We use this instead of
 * an SVG node-graph for the agent loop — it reads cleanly at any width and has
 * no edge/label collision class of bugs.
 *
 * Role → colour mirrors codemode-talk: user = accent (orange), model = ai
 * (green), tool = compute (blue), result = muted. The class pairs live in
 * lib/ui/tones.ts (FLOW_VARIANT). An optional `loop` wraps a contiguous range of
 * steps in a dashed "repeats" group so the cycle is visible.
 */
function Arrow({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay }}
      className="flex justify-center"
      aria-hidden="true"
    >
      <div className="flex flex-col items-center py-1.5">
        <div className="h-5 w-px bg-border-100" />
        <div className="border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-border-100" />
      </div>
    </motion.div>
  );
}

function Box({ step, i }: { step: FlowStep; i: number }) {
  const v = VARIANT[step.tone ?? "result"] ?? VARIANT.result;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: i * 0.18, ease: "easeOut" }}
      className={`rounded-lg border px-4 py-3 ${v.box}`}
    >
      <p className={`text-center text-[11px] font-semibold uppercase tracking-wider ${v.label}`}>{step.label}</p>
      {step.text && <p className="mt-1 text-center text-sm text-foreground-200">{step.text}</p>}
      {step.code && (
        <pre className="mt-2 overflow-x-auto rounded border border-border-100/60 bg-background-200 px-3 py-2 text-center font-mono text-xs text-foreground-200">
          <code>{step.code}</code>
        </pre>
      )}
    </motion.div>
  );
}

interface Props {
  title?: string;
  caption?: string;
  steps: FlowStep[];
  loop?: { from: number; to: number; label?: string; note?: string };
}

export default function FlowDiagram({ title, caption, steps, loop }: Props) {
  // Validate the loop range; fall back to a plain linear flow if it's invalid.
  const valid =
    loop && loop.from >= 0 && loop.to < steps.length && loop.from <= loop.to && !(loop.from === 0 && loop.to === steps.length - 1);
  const lp = valid ? loop! : undefined;

  const items: ReactNode[] = [];
  for (let i = 0; i < steps.length; i++) {
    if (lp && i === lp.from) {
      if (i > 0) items.push(<Arrow key={`pre-${i}`} delay={i * 0.18 - 0.06} />);
      const inner: ReactNode[] = [];
      for (let j = lp.from; j <= lp.to; j++) {
        if (j > lp.from) inner.push(<Arrow key={`in-${j}`} delay={j * 0.18 - 0.06} />);
        inner.push(<Box key={`box-${j}`} step={steps[j]} i={j} />);
      }
      items.push(
        <motion.div
          key="loop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: lp.from * 0.18 }}
          className="relative mt-1 rounded-xl border border-dashed border-border-200 px-3 pb-7 pt-7"
        >
          <span className="absolute -top-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-border-100 bg-background-content px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
            <ArrowsClockwise size={11} /> {lp.label ?? "repeats until done"}
          </span>
          <div className="flex flex-col">{inner}</div>
          {lp.note && (
            <span className="absolute -bottom-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-border-100 bg-background-content px-2.5 py-0.5 text-[10px] text-text-secondary">
              {lp.note}
            </span>
          )}
        </motion.div>,
      );
      i = lp.to;
      continue;
    }
    if (i > 0) items.push(<Arrow key={`a-${i}`} delay={i * 0.18 - 0.06} />);
    items.push(<Box key={`box-${i}`} step={steps[i]} i={i} />);
  }

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-border-100 bg-background-content">
      {title && <figcaption className="border-b border-border-100 px-4 py-2 text-sm font-medium">{title}</figcaption>}
      <div className="px-5 py-6">
        <div className="mx-auto flex w-full max-w-[440px] flex-col">{items}</div>
        {caption && <p className="mx-auto mt-5 max-w-[460px] text-center text-xs text-text-secondary">{caption}</p>}
      </div>
    </figure>
  );
}
