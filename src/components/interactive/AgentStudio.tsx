import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "motion/react";
import { ArrowCounterClockwise, MagicWand, Play, Plus, Spinner, Table } from "@phosphor-icons/react";
import { useMonacoTheme } from "@/components/ui/useMonacoTheme";
import { MONACO_BASE_OPTIONS, MonacoLoading } from "@/components/ui/monaco";
import { OutputConsole } from "@/components/ui/OutputConsole";

interface Capability {
  id: string;
  label: string;
  plain: string;
  insert: string;
}
interface Goal {
  id: string;
  label: string;
  program: string;
  chatbotGuess?: string;
}
interface Props {
  lessonSlug: string;
  studioId: string;
  title: string;
  intro: string;
  toolName: string;
  toolPreview: { columns: string[]; rows: Array<Array<string | number>> };
  starterProgram: string;
  capabilities: Capability[];
  goals: Goal[];
  aiEnabled?: boolean;
}

function sessionId(): string {
  try {
    let id = localStorage.getItem("aa:session");
    if (!id) {
      id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "").slice(0, 24);
      localStorage.setItem("aa:session", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

const short = (label: string) => label.replace(/^Find the /, "").replace(/^Calculate /, "");

export default function AgentStudio(props: Props) {
  const [code, setCode] = useState(props.starterProgram);
  const theme = useMonacoTheme();
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [engine, setEngine] = useState<"mock" | "sandbox" | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [showData, setShowData] = useState(false);

  const goal = useMemo(() => props.goals.find((g) => g.id === goalId), [goalId, props.goals]);

  function loadGoal(g: Goal) {
    setGoalId(g.id);
    setCode(g.program);
    setOutput(null);
  }
  function addCapability(c: Capability) {
    setCode((prev) => `${prev.trimEnd()}\n${c.insert}\n`);
    setShowSteps(false);
  }
  function reset() {
    setCode(props.starterProgram);
    setGoalId(null);
    setOutput(null);
    setAiError(null);
  }

  async function run() {
    setRunning(true);
    setOutput(null);
    try {
      const res = await fetch("/api/studio-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug: props.lessonSlug, studioId: props.studioId, code, sessionId: sessionId() }),
      });
      const data = (await res.json()) as { output?: string; engine?: "mock" | "sandbox"; error?: string };
      setOutput(data.output ?? data.error ?? "(no output)");
      setEngine(data.engine ?? null);
    } catch (err) {
      setOutput(`Network error: ${String(err)}`);
    } finally {
      setRunning(false);
    }
  }

  async function askAi(e: React.FormEvent) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug: props.lessonSlug, studioId: props.studioId, request: q, currentCode: code }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (data.code) {
        setCode(data.code);
        setPrompt("");
      } else {
        setAiError(data.error ?? "Could not generate code.");
      }
    } catch (err) {
      setAiError(String(err));
    } finally {
      setAiBusy(false);
    }
  }

  const chip = "rounded-full border px-3 py-1 text-xs transition-colors";

  return (
    <section className="my-8 rounded-xl border border-border-100 bg-background-content">
      {/* Toolbar: start-from goals + on-demand controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-100 px-4 py-3">
        <span className="mr-1 font-mono text-[11px] uppercase tracking-wider text-text-secondary">Start from</span>
        {props.goals.map((g) => (
          <button
            key={g.id}
            onClick={() => loadGoal(g)}
            className={`${chip} ${g.id === goalId ? "border-accent-100 bg-accent-100/10 text-accent-muted" : "border-border-100 text-foreground-200 hover:border-foreground-300"}`}
          >
            {short(g.label)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => { setShowSteps((s) => !s); setShowData(false); }}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${showSteps ? "text-accent-muted" : "text-text-secondary hover:text-foreground-100"}`}
          >
            <Plus size={13} weight="bold" /> Add step
          </button>
          <button
            onClick={() => { setShowData((s) => !s); setShowSteps(false); }}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${showData ? "text-accent-muted" : "text-text-secondary hover:text-foreground-100"}`}
          >
            <Table size={13} /> Data
          </button>
        </div>
      </div>

      {/* On-demand: capability chips */}
      {showSteps && (
        <div className="flex flex-wrap gap-2 border-b border-border-100 bg-background-300/50 px-4 py-3">
          {props.capabilities.map((c) => (
            <button key={c.id} onClick={() => addCapability(c)} title={c.plain} className={`${chip} border-border-100 text-foreground-200 hover:border-accent-100`}>
              + {c.label}
            </button>
          ))}
        </div>
      )}

      {/* On-demand: sample data */}
      {showData && (
        <div className="overflow-x-auto border-b border-border-100 bg-background-300/50 px-4 py-3">
          <p className="mb-2 font-mono text-[11px] text-text-secondary">{props.toolName}</p>
          <table className="min-w-full text-left text-xs">
            <thead className="text-text-secondary">
              <tr>{props.toolPreview.columns.map((c) => <th key={c} className="pb-1 pr-6 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody>
              {props.toolPreview.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j} className="py-0.5 pr-6 font-mono">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-3 p-4">
        {/* Ask the AI */}
        {props.aiEnabled && (
          <form onSubmit={askAi} className="flex gap-2">
            <div className="relative flex-1">
              <MagicWand size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-100" />
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Or describe what you want in plain English…"
                className="w-full rounded-md border border-border-100 bg-background-100 py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-accent-100/50"
              />
            </div>
            <button type="submit" disabled={aiBusy} className="inline-flex items-center gap-1.5 rounded-md border border-border-100 px-3 py-2 text-sm text-foreground-100 hover:border-accent-100 disabled:opacity-50">
              {aiBusy ? <Spinner size={14} className="animate-spin" /> : <MagicWand size={14} weight="fill" />} Write it
            </button>
          </form>
        )}
        {aiError && <p className="text-sm text-accent-muted">{aiError}</p>}

        {/* Editor */}
        <div className="overflow-hidden rounded-lg border border-border-100">
          <Editor
            height={280}
            language="javascript"
            value={code}
            theme={theme}
            onChange={(v) => setCode(v ?? "")}
            loading={MonacoLoading}
            options={{
              ...MONACO_BASE_OPTIONS,
              folding: false,
              scrollbar: { alwaysConsumeMouseWheel: false },
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={run} disabled={running} className="inline-flex items-center gap-1.5 rounded-md bg-accent-100 px-4 py-2 text-sm text-light-foreground disabled:opacity-50">
            {running ? <Spinner size={15} className="animate-spin" /> : <Play size={15} weight="fill" />} Run in Sandbox
          </button>
          <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-text-secondary hover:text-foreground-100">
            <ArrowCounterClockwise size={15} /> Reset
          </button>
        </div>

        {/* Output */}
        {(output !== null || running) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <p className="mb-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              Output
              {engine === "sandbox" && <span className="rounded bg-ai-200 px-1.5 py-0.5 normal-case tracking-normal text-ai-100">real · Sandbox</span>}
            </p>
            <OutputConsole>{running ? "Running in the Sandbox…" : output}</OutputConsole>
            {goal?.chatbotGuess && !running && (
              <p className="mt-2 text-xs text-text-secondary">
                A chatbot would have guessed: “{goal.chatbotGuess}” — your agent computed the real answer above.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
