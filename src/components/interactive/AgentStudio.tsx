import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "motion/react";
import { ArrowCounterClockwise, MagicWand, Play, PlusCircle, Spinner, Terminal, Target } from "@phosphor-icons/react";

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

export default function AgentStudio(props: Props) {
  const [code, setCode] = useState(props.starterProgram);
  const [theme, setTheme] = useState<"light" | "vs-dark">("light");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [engine, setEngine] = useState<"mock" | "sandbox" | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setTheme(document.documentElement.classList.contains("dark") ? "vs-dark" : "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const goal = useMemo(() => props.goals.find((g) => g.id === goalId), [goalId, props.goals]);

  function addCapability(c: Capability) {
    setCode((prev) => `${prev.trimEnd()}\n${c.insert}\n`);
  }

  function loadGoal(g: Goal) {
    setGoalId(g.id);
    setCode(g.program);
    setOutput(null);
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

  return (
    <section className="my-8 overflow-hidden rounded-xl border border-border-100 bg-background-content">
      <div className="border-b border-border-100 bg-ai-200/60 px-5 py-4">
        <p className="text-sm font-medium text-foreground-100">{props.title}</p>
        <p className="mt-1 text-sm text-foreground-200">{props.intro}</p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[300px_1fr]">
        {/* Controls */}
        <div className="space-y-5">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              <Target size={13} /> Pick a goal
            </p>
            <div className="mt-2 grid gap-2">
              {props.goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => loadGoal(g)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    g.id === goalId ? "border-accent-100 bg-accent-100/10" : "border-border-100 hover:border-foreground-300"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              <PlusCircle size={13} /> Add a capability
            </p>
            <div className="mt-2 grid gap-2">
              {props.capabilities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addCapability(c)}
                  className="rounded-lg border border-border-100 px-3 py-2 text-left text-sm transition-colors hover:border-accent-100"
                  title={c.plain}
                >
                  <span className="block font-medium text-foreground-100">{c.label}</span>
                  <span className="mt-0.5 block text-xs text-foreground-200">{c.plain}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border-100 bg-background-300 p-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">Tool data — {props.toolName}</p>
            <div className="mt-2 overflow-x-auto rounded-md border border-border-100 bg-background-content">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-border-100 text-text-secondary">
                  <tr>{props.toolPreview.columns.map((c) => <th key={c} className="px-2 py-1.5 font-medium">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {props.toolPreview.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border-100 last:border-b-0">
                      {row.map((cell, j) => <td key={j} className="px-2 py-1.5 font-mono">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Editor + AI + run */}
        <div className="min-w-0 space-y-3">
          {props.aiEnabled && (
            <form onSubmit={askAi} className="flex flex-wrap gap-2">
              <div className="relative flex-1">
                <MagicWand size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-100" />
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask in plain English, e.g. “show revenue per region”"
                  className="w-full rounded-md border border-border-100 bg-background-100 py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-accent-100/50"
                />
              </div>
              <button type="submit" disabled={aiBusy} className="inline-flex items-center gap-1.5 rounded-md bg-foreground-100 px-3 py-2 text-sm text-background-100 disabled:opacity-50">
                {aiBusy ? <Spinner size={14} className="animate-spin" /> : <MagicWand size={14} weight="fill" />} Write it for me
              </button>
            </form>
          )}
          {aiError && <p className="rounded-md border border-security-100 bg-security-100/5 px-3 py-2 text-sm text-foreground-200">{aiError}</p>}

          <div className="overflow-hidden rounded-lg border border-border-100">
            <Editor
              height={300}
              language="javascript"
              value={code}
              theme={theme}
              onChange={(v) => setCode(v ?? "")}
              loading={<div className="p-4 font-mono text-xs text-text-secondary">Loading editor…</div>}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                tabSize: 2,
                padding: { top: 12, bottom: 12 },
                fontFamily: "var(--font-mono)",
                renderLineHighlight: "none",
                overviewRulerLanes: 0,
                scrollbar: { alwaysConsumeMouseWheel: false },
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={run} disabled={running} className="inline-flex items-center gap-1.5 rounded-md bg-accent-100 px-4 py-2 text-sm text-light-foreground disabled:opacity-50">
              {running ? <Spinner size={15} className="animate-spin" /> : <Play size={15} weight="fill" />} Run in Sandbox
            </button>
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md border border-border-100 px-3 py-2 text-sm text-foreground-200 hover:border-foreground-300">
              <ArrowCounterClockwise size={15} /> Reset
            </button>
          </div>

          {(output !== null || running) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <p className="flex items-center gap-2 px-1 py-1 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
                <Terminal size={13} /> Output
                {engine === "sandbox" && <span className="rounded bg-ai-200 px-1.5 py-0.5 normal-case tracking-normal text-ai-100">real · Sandbox</span>}
                {engine === "mock" && <span className="rounded bg-background-300 px-1.5 py-0.5 normal-case tracking-normal">deployed only</span>}
              </p>
              <pre className="overflow-x-auto rounded-lg bg-[#151414] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-[#f0e3de]">
                {running ? "Running in the Sandbox…" : output}
              </pre>
            </motion.div>
          )}

          {goal?.chatbotGuess && output && (
            <div className="rounded-lg border border-border-100 px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-text-secondary">A chatbot would guess</p>
              <p className="mt-1 text-sm text-foreground-200">{goal.chatbotGuess}</p>
              <p className="mt-1 text-xs text-text-secondary">Your agent computed the real answer above from the data.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
