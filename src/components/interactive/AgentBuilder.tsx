import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowCounterClockwise, CheckCircle, Code, Play, PlusCircle } from "@phosphor-icons/react";

interface Step {
  id: string;
  label: string;
  plain: string;
  code: string;
  output: string;
}

interface Props {
  title: string;
  intro: string;
  steps: Step[];
}

/**
 * No-code-to-code bridge. Learners add agent capabilities one by one. Each
 * button unlocks a plain-language part, a code snippet, and a runnable outcome.
 */
export default function AgentBuilder({ title, intro, steps }: Props) {
  const [count, setCount] = useState(0);
  const [ran, setRan] = useState(false);
  const active = useMemo(() => steps.slice(0, count), [steps, count]);
  const latest = active[active.length - 1];

  function add(index: number) {
    setCount(Math.max(count, index + 1));
    setRan(false);
  }

  function reset() {
    setCount(0);
    setRan(false);
  }

  return (
    <section className="my-8 overflow-hidden rounded-xl border border-border-100 bg-background-content">
      <div className="border-b border-border-100 bg-ai-200/60 px-5 py-4">
        <p className="text-sm font-medium text-foreground-100">{title}</p>
        <p className="mt-1 text-sm text-foreground-200">{intro}</p>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">Add capabilities</p>
          <div className="mt-3 space-y-2">
            {steps.map((step, i) => {
              const unlocked = i < count;
              const available = i <= count;
              return (
                <button
                  key={step.id}
                  onClick={() => available && add(i)}
                  disabled={!available}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                    unlocked
                      ? "border-ai-100 bg-ai-200/70"
                      : available
                        ? "border-border-100 hover:border-accent-100"
                        : "border-border-100 opacity-45"
                  }`}
                >
                  {unlocked ? <CheckCircle size={18} weight="fill" className="mt-0.5 text-ai-100" /> : <PlusCircle size={18} className="mt-0.5 text-accent-100" />}
                  <span>
                    <span className="block text-sm font-medium text-foreground-100">{step.label}</span>
                    <span className="mt-0.5 block text-sm text-foreground-200">{step.plain}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setRan(true)}
              disabled={count === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent-100 px-4 py-2 text-sm text-light-foreground disabled:opacity-50"
            >
              <Play size={15} weight="fill" /> Run current agent
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-100 px-4 py-2 text-sm text-foreground-200 hover:border-foreground-300"
            >
              <ArrowCounterClockwise size={15} /> Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border-100 bg-background-300 p-4">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              <Code size={13} /> Code built so far
            </p>
            {active.length === 0 ? (
              <p className="mt-3 text-sm text-text-secondary">Click the first button to start building the agent.</p>
            ) : (
              <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-[#151414] px-4 py-3 font-mono text-[12px] leading-relaxed text-[#f0e3de]">
                {active.map((s) => s.code).join("\n\n")}
              </pre>
            )}
          </div>

          {ran && latest && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-xl border border-ai-100 bg-ai-200 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ai-100">What this agent can do now</p>
              <p className="mt-2 whitespace-pre-line text-sm font-medium text-foreground-100">{latest.output}</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
