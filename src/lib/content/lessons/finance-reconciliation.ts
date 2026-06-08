import type { Lesson } from "../types";

/* ============================================================================
 * Track: tools · Applied use-case for finance/analyst roles.
 * Concept-first (the agent writes the code) with a runnable Code Mode lab.
 * ========================================================================== */

const starter = `// Reconcile bank transactions against the ledger.
// Two tools are available:
//   codemode.bankRows()   -> [{ id, amount }]
//   codemode.ledgerRows() -> [{ id, amount }]
export default async function () {
  // TODO 1: load both bankRows() and ledgerRows()
  // TODO 2: a bank row is "matched" if the ledger has the same id AND amount
  // TODO 3: console.log(\`Unmatched: \${count} (\${ids.join(", ")})\`)
}`;

const solution = `export default async function () {
  const bank = await codemode.bankRows();
  const ledger = await codemode.ledgerRows();
  const seen = new Set(ledger.map((r) => \`\${r.id}:\${r.amount}\`));
  const unmatched = bank.filter((r) => !seen.has(\`\${r.id}:\${r.amount}\`));
  console.log(\`Unmatched: \${unmatched.length} (\${unmatched.map((r) => r.id).join(", ")})\`);
}`;

export const financeReconciliation: Lesson = {
  slug: "reconcile-transactions",
  trackId: "tools",
  order: 4,
  title: "Reconcile transactions with an agent",
  summary:
    "A finance use-case: the agent pulls two sources, matches them, and flags what doesn't reconcile — no manual cross-checking.",

  outcomes: [
    "Describe how an agent reconciles two data sources.",
    "Explain why matching belongs in code, not a model's guess.",
    "Complete a reconciliation that flags unmatched transactions.",
  ],
  prerequisites: ["agents-write-code"],
  whyItMatters:
    "Reconciliation is repetitive, high-stakes, and rule-based — a perfect agent task. The agent fetches both ledgers, applies your exact matching rule in code, and surfaces only the exceptions a human needs to review.",
  timeEstimateMin: 12,
  competencies: ["code-mode", "reconciliation", "exception-handling"],
  misconceptions: [
    {
      belief: "The AI can eyeball the two lists and tell me what doesn't match.",
      correction:
        "Matching must be exact and auditable. The agent writes deterministic code (compare id + amount) so every result is reproducible — not an approximate read of two tables.",
    },
    {
      belief: "Reconciliation needs a big data pipeline.",
      correction:
        "For most cases the agent just calls two tools and compares in code. You only reach for pipelines/Workflows when volume or scheduling demands it.",
    },
  ],

  blocks: [
    { kind: "heading", text: "The reconciliation problem", id: "problem" },
    {
      kind: "prose",
      text: "You have two records of the same money — say **bank transactions** and your **ledger**. Reconciliation means: which entries match, and which don't? Agents are great at this because the rule is exact and the boring part (comparing every row) is just code.",
    },
    {
      kind: "diagram",
      title: "Reconcile two sources",
      nodes: [
        { id: "bank", label: "Bank rows (tool)", tone: "model", x: 0, y: 30 },
        { id: "ledger", label: "Ledger rows (tool)", tone: "model", x: 0, y: 190 },
        { id: "agent", label: "Agent writes match code", tone: "agent", x: 250, y: 110 },
        { id: "out", label: "Unmatched → review", tone: "state", x: 500, y: 110 },
      ],
      edges: [
        { from: "bank", to: "agent" },
        { from: "ledger", to: "agent" },
        { from: "agent", to: "out", label: "exceptions only" },
      ],
    },
    {
      kind: "analogy",
      role: "Finance",
      audience: "concept",
      text: "It's your month-end tie-out: match each bank line to a ledger entry by reference and amount, then chase only the handful that don't agree. The agent does the matching and hands you the exceptions.",
    },
    {
      kind: "callout",
      tone: "warning",
      title: "Exact, not approximate",
      text: "Never let a model 'judge' whether numbers match. The agent compares id + amount in code, so the result is exact, the same every time, and easy to audit.",
    },

    { kind: "heading", text: "What the agent does", id: "does", audience: "concept" },
    {
      kind: "list",
      audience: "concept",
      items: [
        "Pulls the bank rows and the ledger rows.",
        "Treats a bank row as matched only if the ledger has the same id and amount.",
        "Reports the count and ids of anything that didn't match.",
      ],
    },
    {
      kind: "prose",
      audience: "concept",
      text: "Switch to **Code** view to complete it — the matching rule is two lines.",
    },

    { kind: "heading", text: "Complete the reconciliation", id: "build", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Use `codemode.bankRows()` and `codemode.ledgerRows()`. Match on id + amount and print the unmatched bank rows. Press **Run**, then **Check**.",
    },
    { kind: "codelab", labId: "reconcile", audience: "code" },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "why-code-match" },
  ],

  labs: {
    reconcile: {
      id: "reconcile",
      language: "javascript",
      runCmd: "code-mode run task.js",
      files: [{ path: "task.js", language: "javascript", contents: starter }],
      challenge: {
        prompt: "Match bank rows to ledger rows on id + amount; print 'Unmatched: <n> (<ids>)'.",
        checks: [
          {
            id: "loads-bank",
            describe: "Loads bank rows via codemode.bankRows()",
            expectSource: { file: "task.js", pattern: "codemode.bankRows" },
          },
          {
            id: "loads-ledger",
            describe: "Loads ledger rows via codemode.ledgerRows()",
            expectSource: { file: "task.js", pattern: "codemode.ledgerRows" },
          },
          {
            id: "prints-unmatched",
            describe: "Prints the unmatched transactions",
            expectStdout: "Unmatched",
          },
        ],
        solutionHint: solution,
      },
    },
  },

  quizzes: {
    "why-code-match": {
      id: "why-code-match",
      question: "Why should the matching rule run as code rather than as a model judgment?",
      options: [
        "Code is always faster than a model",
        "Matching must be exact, reproducible, and auditable — properties a deterministic comparison gives you and an LLM guess does not",
        "Models cannot read numbers",
        "It avoids needing the two source tools",
      ],
      answerIndex: 1,
      explanation:
        "Reconciliation is high-stakes and rule-based. Comparing id + amount in code yields the same answer every time and can be audited; asking a model to 'judge' matches is neither reliable nor reproducible.",
    },
  },

  recap: [
    "Reconciliation = match two sources on an exact key, then surface the exceptions.",
    "The agent writes exact match code (the same answer every time); the model never guesses the numbers.",
    "You flagged unmatched transactions from two tools in a few lines.",
  ],

  status: "published",
};
