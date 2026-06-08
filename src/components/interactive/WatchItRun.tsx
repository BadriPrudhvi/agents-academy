import { useState } from "react";
import { motion } from "motion/react";
import { Play, Spinner, Sparkle } from "@phosphor-icons/react";
import { OutputConsole } from "@/components/ui/OutputConsole";

/**
 * No-code "see it in action": runs the lesson's reference solution server-side
 * and shows the result. Lets non-technical learners watch the agent work
 * without writing (or reading) any code.
 */
interface Props {
  lessonSlug: string;
  labId: string;
  caption?: string;
}

export default function WatchItRun({ lessonSlug, labId, caption }: Props) {
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setOutput(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug, labId, action: "demo" }),
      });
      const data = (await res.json()) as { run?: { output?: string }; error?: string };
      setOutput(res.ok ? (data.run?.output ?? "(no output)") : `Error: ${data.error ?? res.statusText}`);
    } catch (err) {
      setOutput(`Network error: ${String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="my-8 rounded-xl border border-border-100 bg-background-content p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground-100">
        <Sparkle size={16} weight="fill" className="text-accent-100" /> See it in action
      </p>
      <p className="mt-1 text-sm text-foreground-200">
        {caption ?? "No coding needed — press the button and watch the agent do the work."}
      </p>
      <button
        onClick={run}
        disabled={busy}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-accent-100 px-4 py-2 text-sm text-light-foreground disabled:opacity-50"
      >
        {busy ? <Spinner size={15} className="animate-spin" /> : <Play size={15} weight="fill" />}
        {busy ? "Running…" : "Run the agent"}
      </button>

      {output && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-4">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-text-secondary">What the agent produced</p>
          <OutputConsole>{output}</OutputConsole>
        </motion.div>
      )}
    </div>
  );
}
