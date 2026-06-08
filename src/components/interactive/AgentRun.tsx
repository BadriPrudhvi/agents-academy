import { useState } from "react";
import { motion } from "motion/react";
import { Brain, CheckCircle, Cpu, Flag, Spinner, Wrench } from "@phosphor-icons/react";

interface Tool {
  name: string;
  description: string;
}
interface Props {
  lessonSlug: string;
  runId: string;
  intro: string;
  model: string;
  tools: Tool[];
  examples: string[];
}

type Step =
  | { type: "goal"; text: string }
  | { type: "think"; text: string }
  | { type: "tool"; name: string; args: unknown; result: string }
  | { type: "answer"; text: string };

const STEP_META: Record<Step["type"], { icon: typeof Brain; label: string; tone: string }> = {
  goal: { icon: Flag, label: "Goal", tone: "var(--color-foreground-300)" },
  think: { icon: Brain, label: "The agent decides", tone: "var(--color-media-100)" },
  tool: { icon: Wrench, label: "Calls a tool", tone: "var(--color-compute-100)" },
  answer: { icon: CheckCircle, label: "Answer", tone: "var(--color-ai-100)" },
};

export default function AgentRun(props: Props) {
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState<Step[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAgent(g: string) {
    const text = g.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setTrace(null);
    try {
      const res = await fetch("/api/agent-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug: props.lessonSlug, runId: props.runId, goal: text }),
      });
      const data = (await res.json()) as { trace?: Step[]; error?: string };
      if (data.trace) setTrace(data.trace);
      else setError(data.error ?? "The agent could not run.");
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="my-8 rounded-xl border border-border-100 bg-background-content">
      <div className="border-b border-border-100 px-5 py-4">
        <p className="text-sm text-foreground-200">{props.intro}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5"><Cpu size={13} /> Brain: {props.model}</span>
          <span className="inline-flex items-center gap-1.5">
            <Wrench size={13} /> Tools: {props.tools.map((t) => t.name).join(", ")}
          </span>
        </p>
      </div>

      <div className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAgent(goal);
          }}
          className="flex gap-2"
        >
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Tell the agent a goal, e.g. “which product made the most money?”"
            className="flex-1 rounded-md border border-border-100 bg-background-100 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-100/50"
          />
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-accent-100 px-4 py-2 text-sm text-light-foreground disabled:opacity-50">
            {busy ? <Spinner size={15} className="animate-spin" /> : <Brain size={15} weight="fill" />} Run agent
          </button>
        </form>

        <div className="mt-2 flex flex-wrap gap-2">
          {props.examples.map((ex) => (
            <button
              key={ex}
              onClick={() => { setGoal(ex); runAgent(ex); }}
              disabled={busy}
              className="rounded-full border border-border-100 px-3 py-1 text-xs text-foreground-200 transition-colors hover:border-foreground-300 disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-accent-muted">{error}</p>}

        {busy && !trace && (
          <p className="mt-5 flex items-center gap-2 text-sm text-text-secondary">
            <Spinner size={14} className="animate-spin" /> The agent is thinking and using its tools…
          </p>
        )}

        {trace && (
          <ol className="mt-5 space-y-0">
            {trace.map((step, i) => {
              const meta = STEP_META[step.type];
              const Icon = meta.icon;
              const last = i === trace.length - 1;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.15 }}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {!last && <span className="absolute left-[11px] top-6 h-full w-px bg-border-100" aria-hidden="true" />}
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border-100 bg-background-content" style={{ color: meta.tone }}>
                    <Icon size={14} weight="fill" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: meta.tone }}>
                      {meta.label}
                    </p>
                    {step.type === "tool" ? (
                      <p className="mt-0.5 text-sm text-foreground-200">
                        <code className="rounded bg-background-300 px-1 py-0.5">{step.name}()</code> → {step.result}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-foreground-200">{step.text}</p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
