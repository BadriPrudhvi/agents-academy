import { useState } from "react";
import { motion } from "motion/react";
import { Brain, CaretRight, CheckCircle, Code, Cpu, Eye, Flag, Spinner, Wrench } from "@phosphor-icons/react";
import type { AgentStep as Step } from "@/lib/content/agent-trace";
import { TONE_VAR } from "@/lib/ui/tones";

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

const STEP_META: Record<Step["type"], { icon: typeof Brain; label: string; tone: string }> = {
  goal: { icon: Flag, label: "Goal", tone: TONE_VAR.foreground },
  think: { icon: Brain, label: "Decides", tone: TONE_VAR.media },
  tool: { icon: Wrench, label: "Calls a tool", tone: TONE_VAR.compute },
  observe: { icon: Eye, label: "Reads the result", tone: TONE_VAR.ai },
  answer: { icon: CheckCircle, label: "Answers", tone: TONE_VAR.ai },
};

/* The real loop behind the trace above — every beat the learner watched maps to
 * one line here. Kept honest and static: this is the actual agent, not magic. */
// A faithful (simplified) sketch of the real loop in src/pages/api/agent-run.ts.
// Every line here is true — just abbreviated. The model picks the tool + args;
// it never writes this code.
const AGENT_CODE = `// An agent is a model + tools wired into a loop. That's the whole trick.
const tools = [getSales, getSalesByRegion];        // what it CAN do
const messages = [systemPrompt, userGoal];          // GOAL — what you asked

for (let step = 0; step < MAX_STEPS; step++) {       // loop, with a safety cap
  // DECIDES — the model reads the goal + tool list and picks a tool (or answers)
  const reply = await model.run({ messages, tools });

  if (!reply.toolCalls) {
    return reply.content;                            // ANSWERS — grounded in what it read
  }

  for (const call of reply.toolCalls) {
    // CALLS A TOOL — runs for real on your data, with the args the model chose
    const data = runTool(call.name, call.args);
    messages.push({ role: "tool", content: JSON.stringify(data) }); // READS IT, then loops
  }
}`;

/** Render the arguments the model chose, e.g. \`{ region: "EU" }\` or empty. */
function formatArgs(args: unknown): string {
  if (!args || typeof args !== "object" || Array.isArray(args)) return "";
  const entries = Object.entries(args as Record<string, unknown>);
  if (!entries.length) return "";
  return `{ ${entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")} }`;
}

/** Compact table for the rows a tool returned (array of flat objects). */
function DataTable({ data }: { data: unknown }) {
  if (!Array.isArray(data) || !data.length || typeof data[0] !== "object" || data[0] === null) return null;
  const cols = Object.keys(data[0] as Record<string, unknown>);
  return (
    <div className="mt-2 overflow-x-auto rounded-md border border-border-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-background-300 text-left text-text-secondary">
            {cols.map((c) => (
              <th key={c} className="px-2 py-1 font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(data as Record<string, unknown>[]).map((row, i) => (
            <tr key={i} className="border-t border-border-100">
              {cols.map((c) => (
                <td key={c} className="px-2 py-1 text-foreground-200">{String(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AgentRun(props: Props) {
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState<Step[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

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

  const answered = trace?.some((s) => s.type === "answer");
  const toolSteps = (trace ?? []).filter((s): s is Extract<Step, { type: "tool" }> => s.type === "tool");

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
            <Spinner size={14} className="animate-spin" /> The agent is deciding which tool to use…
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
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: meta.tone }}>
                      {meta.label}
                    </p>
                    {step.type === "tool" ? (
                      <p className="mt-0.5 text-sm text-foreground-200">
                        <code className="rounded bg-background-300 px-1 py-0.5">
                          {step.name}({formatArgs(step.args)})
                        </code>
                      </p>
                    ) : step.type === "observe" ? (
                      <>
                        <p className="mt-0.5 text-sm text-foreground-200">{step.text}</p>
                        <DataTable data={step.data} />
                      </>
                    ) : (
                      <p className="mt-0.5 text-sm text-foreground-200">{step.text}</p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}

        {answered && !busy && (
          <p className="mt-1 rounded-md border border-border-100 bg-background-300 px-3 py-2 text-xs text-text-secondary">
            A plain chatbot would answer from memory — and might guess. This agent <strong>chose a tool</strong>, read the
            <strong> real rows</strong>, then answered from them. That decide → act → observe → answer loop is the difference.
          </p>
        )}

        <div className="mt-5 border-t border-border-100 pt-4">
          <button
            onClick={() => setShowCode((v) => !v)}
            aria-expanded={showCode}
            className="inline-flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-foreground-200"
          >
            <Code size={13} />
            {showCode ? "Hide" : "See the loop behind this agent"}
            <CaretRight size={11} weight="bold" className={`transition-transform ${showCode ? "rotate-90" : ""}`} />
          </button>
          {showCode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <p className="mt-3 text-xs text-text-secondary">
                A simplified sketch of the real loop (in <code>agent-run.ts</code>) — every line is true, just abbreviated.
                There's no hidden magic: a model, its tools, and a loop.
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md border border-border-100 bg-background-300 p-3 text-[12px] leading-relaxed">
                <code>{AGENT_CODE}</code>
              </pre>
              {toolSteps.length > 0 && (
                <p className="mt-3 text-xs text-text-secondary">
                  <span className="text-foreground-200">Your run, mapped onto the loop:</span> at the{" "}
                  <code className="rounded bg-background-300 px-1 py-0.5">model.run</code> line the model chose{" "}
                  {toolSteps.map((s, idx) => (
                    <span key={idx}>
                      <code className="rounded bg-background-300 px-1 py-0.5">
                        {s.name}({formatArgs(s.args)})
                      </code>
                      {idx < toolSteps.length - 1 ? ", then " : ""}
                    </span>
                  ))}
                  . It picked the tool and the arguments — it did <strong>not</strong> write this code.
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
