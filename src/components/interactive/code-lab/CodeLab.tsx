import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Editor from "@monaco-editor/react";
import { Play, CheckCircle, XCircle, Eye, Spinner, Terminal } from "@phosphor-icons/react";

const MONACO_LANG: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  json: "json",
  jsonc: "json",
  toml: "ini",
};

interface LabFileDTO {
  path: string;
  language: string;
  contents: string;
  readOnly?: boolean;
}

interface CheckDTO {
  id: string;
  describe: string;
}

interface Props {
  lessonSlug: string;
  labId: string;
  runCmd: string;
  prompt: string;
  files: LabFileDTO[];
  checks: CheckDTO[];
  solutionHint: string;
}

interface GradeCheck {
  id: string;
  describe: string;
  passed: boolean;
}

interface RunResponse {
  run: { output: string; engine: "mock" | "sandbox" };
  grade?: { passed: boolean; checks: GradeCheck[] };
  error?: string;
}

export default function CodeLab(props: Props) {
  const [files, setFiles] = useState(() => props.files.map((f) => ({ ...f })));
  const [active, setActive] = useState(0);
  const [output, setOutput] = useState<string>("");
  const [engine, setEngine] = useState<"mock" | "sandbox" | null>(null);
  const [busy, setBusy] = useState<null | "run" | "check">(null);
  const [grade, setGrade] = useState<GradeCheck[] | null>(null);
  const [passed, setPassed] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [theme, setTheme] = useState<"light" | "vs-dark">("light");

  useEffect(() => {
    const sync = () => setTheme(document.documentElement.classList.contains("dark") ? "vs-dark" : "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const file = files[active];
  const editorHeight = Math.min(440, Math.max(160, file.contents.split("\n").length * 19 + 24));

  function update(contents: string) {
    setFiles((fs) => fs.map((f, i) => (i === active ? { ...f, contents } : f)));
  }

  async function send(action: "run" | "check") {
    setBusy(action);
    setGrade(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lessonSlug: props.lessonSlug,
          labId: props.labId,
          action,
          files: files.map((f) => ({ path: f.path, contents: f.contents })),
        }),
      });
      const data = (await res.json()) as RunResponse;
      if (!res.ok) {
        setOutput(`Error: ${data.error ?? res.statusText}`);
        return;
      }
      setOutput(data.run.output);
      setEngine(data.run.engine);
      if (data.grade) {
        setGrade(data.grade.checks);
        setPassed(data.grade.passed);
      }
    } catch (err) {
      setOutput(`Network error: ${String(err)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="my-8 rounded-xl border border-border-100 bg-background-content overflow-hidden">
      {/* Challenge prompt */}
      <div className="border-b border-border-100 bg-ai-200 px-4 py-3">
        <p className="text-sm">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ai-100">Challenge</span>
          <span className="ml-2 text-foreground-100">{props.prompt}</span>
        </p>
      </div>

      {/* Editor */}
      <div className="flex items-center gap-1 border-b border-border-100 px-2 pt-2">
        {files.map((f, i) => (
          <button
            key={f.path}
            onClick={() => setActive(i)}
            className={`rounded-t-md px-3 py-1.5 font-mono text-xs transition-colors ${
              i === active
                ? "bg-background-300 text-foreground-100"
                : "text-text-secondary hover:text-foreground-100"
            }`}
          >
            {f.path}
            {f.readOnly ? " ·ro" : ""}
          </button>
        ))}
      </div>
      <div style={{ height: editorHeight }} className="bg-background-300">
        <Editor
          height={editorHeight}
          language={MONACO_LANG[file.language] ?? "plaintext"}
          path={file.path}
          value={file.contents}
          theme={theme}
          onChange={(v) => update(v ?? "")}
          loading={<div className="p-4 font-mono text-xs text-text-secondary">Loading editor…</div>}
          options={{
            readOnly: file.readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            tabSize: 2,
            padding: { top: 12, bottom: 12 },
            fontFamily: "var(--font-mono)",
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            scrollbar: { vertical: "auto", alwaysConsumeMouseWheel: false },
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border-100 px-3 py-2">
        <button
          onClick={() => send("run")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md bg-foreground-100 px-3 py-1.5 text-sm text-background-100 disabled:opacity-50"
        >
          {busy === "run" ? <Spinner size={14} className="animate-spin" /> : <Play size={14} weight="fill" />}
          Run
        </button>
        <button
          onClick={() => send("check")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent-100 px-3 py-1.5 text-sm text-light-foreground disabled:opacity-50"
        >
          {busy === "check" ? <Spinner size={14} className="animate-spin" /> : <CheckCircle size={14} weight="fill" />}
          Check
        </button>
        <button
          onClick={() => setShowSolution((s) => !s)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border-100 px-3 py-1.5 text-sm text-text-secondary hover:text-foreground-100"
        >
          <Eye size={14} /> {showSolution ? "Hide" : "Show"} solution
        </button>
      </div>

      {/* Terminal output */}
      {output && (
        <div className="border-t border-border-100">
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-wider text-text-secondary">
            <Terminal size={13} /> Output
            {engine === "mock" && <span className="ml-2 rounded bg-background-300 px-1.5 py-0.5 normal-case tracking-normal">simulated</span>}
          </div>
          <pre className="overflow-x-auto bg-[#151414] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-[#f0e3de]">
            {output}
          </pre>
        </div>
      )}

      {/* Grade checklist */}
      {grade && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-border-100 px-4 py-3"
        >
          <p className={`mb-2 text-sm font-medium ${passed ? "text-ai-100" : "text-accent-muted"}`}>
            {passed ? "All checks passed — nice work." : "Not quite — keep going."}
          </p>
          <ul className="space-y-1.5">
            {grade.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                {c.passed ? (
                  <CheckCircle size={16} weight="fill" className="text-ai-100" />
                ) : (
                  <XCircle size={16} weight="fill" className="text-accent-muted" />
                )}
                <span className={c.passed ? "text-foreground-200" : "text-foreground-100"}>{c.describe}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Solution */}
      {showSolution && (
        <div className="border-t border-border-100 px-4 py-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-text-secondary">Reference solution</p>
          <pre className="overflow-x-auto rounded-md bg-background-300 px-4 py-3 font-mono text-[12.5px] leading-relaxed">
            {props.solutionHint}
          </pre>
        </div>
      )}
    </div>
  );
}
