import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Brain, CheckCircle, Database, Play, Robot, Spinner, Sparkle, WarningCircle } from "@phosphor-icons/react";

interface AgentSimGoal {
  id: string;
  label: string;
  toolName: string;
  steps: string[];
  chatbotGuess: string;
  expectedAnswer: string;
}

interface AgentSimProps {
  lessonSlug: string;
  simId: string;
  toolName: string;
  toolPreview: { columns: string[]; rows: Array<Array<string | number>> };
  goals: AgentSimGoal[];
  predict?: boolean;
}

const predictionOptions = [
  "Guess from general knowledge",
  "Call the data tool first",
  "Ask for a larger model",
];

export default function AgentSim({ lessonSlug, simId, toolName, toolPreview, goals, predict = true }: AgentSimProps) {
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [engine, setEngine] = useState<"mock" | "sandbox" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goal = useMemo(() => goals.find((g) => g.id === goalId) ?? goals[0], [goalId, goals]);
  const canRun = !predict || prediction !== null;

  async function runGoal() {
    if (!goal || !canRun || busy) return;
    setBusy(true);
    setError(null);
    setAnswer(null);
    setEngine(null);
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug, simId, goalId: goal.id }),
      });
      const data = (await res.json()) as { answer?: string; engine?: "mock" | "sandbox"; error?: string };
      if (!res.ok) {
        setError(data.error ?? res.statusText);
      } else {
        setAnswer(data.answer ?? goal.expectedAnswer);
        setEngine(data.engine ?? "mock");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!goal) return null;

  return (
    <section className="my-8 overflow-hidden rounded-xl border border-border-100 bg-background-content">
      <div className="border-b border-border-100 bg-ai-200/60 px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground-100">
          <Sparkle size={17} weight="fill" className="text-accent-100" /> Agent Playground
        </p>
        <p className="mt-1 text-sm text-foreground-200">
          Pick a goal, make a prediction, then watch the agent call a tool, inspect data, compute, and answer.
        </p>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">1. Pick the goal</p>
          <div className="mt-2 grid gap-2">
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGoalId(g.id);
                  setPrediction(null);
                  setAnswer(null);
                  setError(null);
                  setEngine(null);
                }}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  g.id === goal.id ? "border-accent-100 bg-accent-100/10" : "border-border-100 hover:border-foreground-300"
                }`}
                aria-pressed={g.id === goal.id}
              >
                {g.label}
              </button>
            ))}
          </div>

          {predict && (
            <div className="mt-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">2. Predict first</p>
              <p className="mt-1 text-sm text-foreground-200">What should the agent do before answering?</p>
              <div className="mt-2 grid gap-2">
                {predictionOptions.map((option) => {
                  const correct = option === "Call the data tool first";
                  const chosen = prediction === option;
                  return (
                    <button
                      key={option}
                      onClick={() => setPrediction(option)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        chosen && correct
                          ? "border-ai-100 bg-ai-200 text-foreground-100"
                          : chosen
                            ? "border-accent-100 bg-accent-100/10"
                            : "border-border-100 hover:border-foreground-300"
                      }`}
                    >
                      {chosen && correct ? <CheckCircle size={15} weight="fill" className="text-ai-100" /> : null}
                      {chosen && !correct ? <WarningCircle size={15} weight="fill" className="text-accent-100" /> : null}
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
              {prediction && (
                <p className="mt-2 text-sm text-foreground-200">
                  {prediction === "Call the data tool first"
                    ? "Exactly. An agent should ground the answer in data before it computes."
                    : "Close, but for data questions the first move should be to fetch the data — not guess."}
                </p>
              )}
            </div>
          )}

          <button
            onClick={runGoal}
            disabled={!canRun || busy}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-accent-100 px-4 py-2 text-sm text-light-foreground disabled:opacity-50"
          >
            {busy ? <Spinner size={15} className="animate-spin" /> : <Play size={15} weight="fill" />}
            {busy ? "Running…" : "Run the agent"}
          </button>
        </div>

        <div className="rounded-xl border border-border-100 bg-background-300 p-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">What the agent can read</p>
          <p className="mt-1 text-sm text-foreground-200">
            Tool: <code className="rounded bg-background-content px-1 py-0.5">{toolName}</code>
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border-100 bg-background-content">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-border-100 text-text-secondary">
                <tr>{toolPreview.columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}</tr>
              </thead>
              <tbody>
                {toolPreview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border-100 last:border-b-0">
                    {row.map((cell, j) => <td key={j} className="px-3 py-2 font-mono">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(answer || error || busy) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="border-t border-border-100 p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">3. Watch the loop</p>
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            {goal.steps.map((step, i) => (
              <div key={step} className="rounded-lg border border-border-100 bg-background-content p-3">
                <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
                  {i === 0 ? <Brain size={13} /> : i === 2 ? <Database size={13} /> : <Robot size={13} />}
                  Step {i + 1}
                </p>
                <p className="mt-1 text-sm text-foreground-200">{step}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            The step narration is illustrative. The data and final answer are computed for real.
          </p>

          {busy && <p className="mt-4 text-sm text-text-secondary">Calling the tool and computing…</p>}
          {error && <p className="mt-4 rounded-lg border border-security-100 bg-security-100/5 px-3 py-2 text-sm text-foreground-200">{error}</p>}
          {answer && (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-border-100 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">Chatbot-style guess</p>
                <p className="mt-2 text-sm text-foreground-200">{goal.chatbotGuess}</p>
              </div>
              <div className="rounded-xl border border-ai-100 bg-ai-200 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ai-100">
                  Agent answer {engine === "sandbox" ? "· computed in Sandbox" : "· expected answer"}
                </p>
                <p className="mt-2 text-base font-medium text-foreground-100">{answer}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}
