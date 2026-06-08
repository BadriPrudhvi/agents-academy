import { grade, stripComments } from "./grade";
import type { LabContext, Runner, RunRequest, RunnerResponse } from "./types";

/**
 * Local mock runner — Spike B fallback.
 *
 * It does NOT execute code in a container. Instead, per-lab simulators inspect
 * the learner's source and produce a realistic stdout, so the full lesson loop
 * (edit -> run -> grade -> tutor) works with zero cost and no cloud account.
 * The UI labels output as "simulated" so the experience stays honest. Swap in
 * the real Sandbox engine by setting RUNNER_MODE=sandbox once Spike B clears.
 */

type Simulator = (files: { path: string; contents: string }[]) => string;

const SIMULATORS: Record<string, Simulator> = {
  // Lesson: your-first-agent / lab: greeter
  greeter(files) {
    const raw = files.find((f) => f.path === "src/index.ts")?.contents ?? "";
    const src = stripComments(raw); // ignore TODO hints, reflect real code
    const callsAI = src.includes("this.env.AI.run") || src.includes("env.AI.run");
    const updatesState = src.includes("this.setState");

    if (!callsAI && !updatesState) {
      return [
        "$ wrangler dev",
        "⛅️ Ready on http://localhost:8787",
        '> POST / { "name": "Ada" }',
        '< 200 { "reply": "not implemented", "count": 0 }',
        "",
        "Hint: the agent isn't calling the model or updating state yet.",
      ].join("\n");
    }

    const reply = callsAI ? "Hey Ada — great to see you here!" : "(no model call yet)";
    const count = updatesState ? 1 : 0;
    return [
      "$ wrangler dev",
      "⛅️ Ready on http://localhost:8787",
      '> POST / { "name": "Ada" }',
      `< 200 { "reply": "${reply}", "count": ${count} }`,
      "",
      updatesState
        ? "State persisted on the Durable Object — count will keep climbing across requests."
        : "Model called, but state isn't being updated yet (count stays 0).",
    ].join("\n");
  },

  // Lesson: first-worker / lab: hello-worker
  "hello-worker"(files) {
    const src = stripComments(files.find((f) => f.path === "src/index.js")?.contents ?? "");
    const readsQuery = src.includes("searchParams") || src.includes("new URL");
    const body = readsQuery ? "Hello, Ada!" : "Hello World!";
    return [
      "$ wrangler dev",
      "⛅️ Ready on http://localhost:8787",
      "> GET /?name=Ada",
      `< 200 ${body}`,
      "",
      readsQuery
        ? "Reading the query string — greets whoever you pass as ?name=."
        : "Not reading ?name= yet — every request gets the same fixed text.",
    ].join("\n");
  },

  // Lesson: agents-write-code / lab: codemode-sales
  "codemode-sales": codemodeSalesSim,

  // Lesson: finance-reconciliation / lab: reconcile
  reconcile(files) {
    const src = stripComments(files.find((f) => f.path === "task.js")?.contents ?? "");
    const callsBank = src.includes("codemode.bankRows");
    const callsLedger = src.includes("codemode.ledgerRows");

    if (callsBank && callsLedger) {
      return [
        "$ code-mode run task.js",
        "→ codemode.bankRows() → 8 rows",
        "→ codemode.ledgerRows() → 7 rows",
        "Unmatched: 2 (TXN-0042, TXN-0099)",
      ].join("\n");
    }
    return [
      "$ code-mode run task.js",
      !callsBank ? "(bank rows not loaded yet)" : "(ledger rows not loaded yet)",
    ].join("\n");
  },

  // Lesson: first-data-agent / lab: python-summary
  "python-summary"(files) {
    const raw = files.find((f) => f.path === "analyze.py")?.contents ?? "";
    const src = stripComments(raw);
    const hasAvg = src.includes("sum(");
    const hasMax = src.includes("max(");

    if (hasAvg && hasMax) {
      return ["$ python analyze.py", "Average: 135.0", "Top month: Mar"].join("\n");
    }
    return [
      "$ python analyze.py",
      hasAvg ? "Average: 135.0" : "(average not computed yet)",
      hasMax ? "Top month: Mar" : "(top month not computed yet)",
    ].join("\n");
  },
};

function codemodeSalesSim(files: { path: string; contents: string }[]): string {
  const src = stripComments(files.find((f) => f.path === "task.js")?.contents ?? "");
  const callsTool = src.includes("codemode.listSales");
  const aggregates = /(reduce|for ?\()/.test(src);
  if (callsTool && aggregates) {
    return [
      "$ run task.js",
      "→ executing generated code in secure sandbox (no secret access)",
      "→ codemode.listSales() → 4 rows",
      "Top product: Widget A ($42000)",
    ].join("\n");
  }
  return [
    "$ run task.js",
    callsTool ? "(got rows, but nothing aggregated yet)" : "(no codemode.listSales() call yet)",
  ].join("\n");
}

function genericSimulate(files: { path: string; contents: string }[]): string {
  const entry = files[0];
  return [
    "$ run",
    `// simulated output for ${entry?.path ?? "program"}`,
    "(no lab-specific simulator registered)",
  ].join("\n");
}

export const mockRunner: Runner = {
  engine: "mock",
  async run(req: RunRequest, lab: LabContext): Promise<RunnerResponse> {
    const started = Date.now();
    const sim = SIMULATORS[req.labId] ?? genericSimulate;
    const output = sim(req.files);
    // Small simulated latency so the UI's running state is visible.
    await new Promise((r) => setTimeout(r, 250));

    const run = {
      ok: true,
      output,
      durationMs: Date.now() - started,
      engine: "mock" as const,
    };

    if (req.action === "check") {
      return { run, grade: grade(lab.checks, req.files, output) };
    }
    return { run };
  },
};
