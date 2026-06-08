import type { Lesson } from "../types";

/* ============================================================================
 * Track: tools · Python data agent (Sandbox)
 * Serves Python-fluent roles (data scientist / ML engineer) in their language,
 * and analysts/finance via the concept view ("the agent writes the Python").
 * ========================================================================== */

const starter = `# An agent can run Python in a Sandbox to analyze data.
# Here is a small monthly revenue dataset:
data = [
    {"month": "Jan", "revenue": 120},
    {"month": "Feb", "revenue": 150},
    {"month": "Mar", "revenue": 180},
    {"month": "Apr", "revenue": 90},
]

# TODO 1: compute the average revenue across all months
# TODO 2: find the month with the highest revenue
# TODO 3: print "Average: <avg>" and "Top month: <month>"
`;

const solution = `data = [
    {"month": "Jan", "revenue": 120},
    {"month": "Feb", "revenue": 150},
    {"month": "Mar", "revenue": 180},
    {"month": "Apr", "revenue": 90},
]

avg = sum(r["revenue"] for r in data) / len(data)
top = max(data, key=lambda r: r["revenue"])

print(f"Average: {avg}")
print(f"Top month: {top['month']}")
`;

export const firstDataAgent: Lesson = {
  slug: "first-data-agent",
  trackId: "tools",
  order: 2,
  title: "Build a data agent that runs Python",
  summary:
    "Give an agent a Sandbox and it can run real Python to analyze data — averages, ranking, forecasts — then report back.",

  outcomes: [
    "Explain how an agent runs Python safely in a Sandbox.",
    "Write Python that summarizes a small dataset.",
    "See how the agent turns a question into runnable analysis.",
  ],
  prerequisites: ["your-first-agent"],
  whyItMatters:
    "The biggest unlock for data work is letting the agent compute, not guess. With a Sandbox it runs actual Python — pandas, numpy, your own code — so the numbers are real and reproducible, not hallucinated.",
  timeEstimateMin: 13,
  competencies: ["sandbox", "python-analysis"],
  misconceptions: [
    {
      belief: "The model can just do the math in its head.",
      correction:
        "LLMs approximate arithmetic and hallucinate totals. Running Python in a Sandbox produces exact, reproducible results — the agent reports computed numbers, not guesses.",
    },
    {
      belief: "Running model-written Python is dangerous on my machine.",
      correction:
        "It runs in an isolated Sandbox container, not your laptop or the Worker — with resource limits and no access to your secrets.",
    },
  ],

  blocks: [
    { kind: "heading", text: "Let the agent compute", id: "idea" },
    {
      kind: "prose",
      text: "Language models are great at *planning* and terrible at *arithmetic*. The fix: give the agent a **Sandbox** — an isolated container — and let it run real **Python**. It writes code, the Sandbox runs it, and the agent reports the actual result.",
    },
    {
      kind: "diagram",
      title: "Agent + Sandbox",
      nodes: [
        { id: "q", label: "Question about data", tone: "user", x: 0, y: 110 },
        { id: "agent", label: "Agent", tone: "agent", x: 220, y: 110 },
        { id: "box", label: "Sandbox (Python)", tone: "tool", x: 450, y: 30 },
        { id: "out", label: "Computed result", tone: "state", x: 450, y: 190 },
      ],
      edges: [
        { from: "q", to: "agent" },
        { from: "agent", to: "box", label: "writes + runs Python" },
        { from: "box", to: "out", label: "real numbers" },
      ],
    },
    {
      kind: "analogy",
      role: "Finance",
      audience: "concept",
      text: "Instead of trusting a 'best guess' total, the agent opens a calculator that shows its work — every figure is computed from the source rows and you can re-run it.",
    },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "Like asking a colleague who actually opens the data and runs the numbers, then hands you the answer — rather than estimating from memory.",
    },
    {
      kind: "callout",
      tone: "warning",
      title: "Real numbers, not vibes",
      text: "If an agent reports a total without running code, treat it with suspicion. Computation belongs in the Sandbox.",
    },

    { kind: "heading", text: "What the analysis does", id: "does", audience: "concept" },
    {
      kind: "list",
      audience: "concept",
      items: [
        "Reads a small table of monthly revenue.",
        "Computes the average across all months.",
        "Finds the month with the highest revenue.",
        "Prints both results.",
      ],
    },
    {
      kind: "watch",
      labId: "python-summary",
      audience: "concept",
      caption: "No code needed — run the finished analysis and see the real numbers the Sandbox computes.",
    },
    {
      kind: "prose",
      audience: "concept",
      text: "Switch to **Code** view to write the Python — or just read it; it's four lines of analysis.",
    },

    { kind: "heading", text: "Write the analysis", id: "build", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Complete the three TODOs so the script prints the average revenue and the top month. Press **Run** to execute it in the Sandbox, then **Check**.",
    },
    { kind: "codelab", labId: "python-summary", audience: "code" },
    {
      kind: "callout",
      tone: "tip",
      audience: "code",
      title: "Pythonic hints",
      text: "`sum(r[\"revenue\"] for r in data)` totals a column; `max(data, key=lambda r: r[\"revenue\"])` returns the whole row with the largest revenue.",
    },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "why-sandbox" },
    { kind: "quiz", quizId: "where-python-runs" },
  ],

  labs: {
    "python-summary": {
      id: "python-summary",
      language: "python",
      runCmd: "python analyze.py",
      files: [{ path: "analyze.py", language: "python", contents: starter }],
      challenge: {
        prompt: "Print 'Average: <avg>' and 'Top month: <month>' computed from the data.",
        checks: [
          {
            id: "computes-avg",
            describe: "Computes the average with sum(...)",
            expectSource: { file: "analyze.py", pattern: "sum(" },
          },
          {
            id: "finds-max",
            describe: "Finds the top month with max(...)",
            expectSource: { file: "analyze.py", pattern: "max(" },
          },
          {
            id: "prints",
            describe: "Prints the average",
            expectStdout: "Average:",
          },
        ],
        solutionHint: solution,
      },
    },
  },

  quizzes: {
    "why-sandbox": {
      id: "why-sandbox",
      question: "Why run the analysis in a Sandbox instead of asking the model for the totals?",
      options: [
        "Sandboxes are cheaper than any model call",
        "Running real Python gives exact, reproducible results instead of approximated/hallucinated numbers",
        "Models cannot read data at all",
        "It avoids needing an agent",
      ],
      answerIndex: 1,
      explanation:
        "Models approximate arithmetic. A Sandbox runs actual Python so the figures are computed from the source data and can be reproduced — essential for analysis and finance.",
    },
    "where-python-runs": {
      id: "where-python-runs",
      question: "Where does the agent's Python actually run?",
      options: [
        "On your laptop, with access to your files",
        "Inside the language model itself",
        "In an isolated Sandbox container — not your machine or the Worker — with limits and no secret access",
        "On the user's phone",
      ],
      answerIndex: 2,
      explanation:
        "The code runs in an isolated Sandbox container with resource limits and no access to your secrets — so model-written Python can compute on data without touching your machine, the Worker, or anything sensitive.",
    },
  },

  recap: [
    "Agents plan well but shouldn't do arithmetic — give them a Sandbox.",
    "The Sandbox runs real Python in isolation; results are exact and reproducible.",
    "You computed an average and a top month from a dataset the agent could analyze.",
  ],
  next: { slug: "reconcile-transactions", label: "Reconcile transactions with an agent" },

  status: "published",
};
