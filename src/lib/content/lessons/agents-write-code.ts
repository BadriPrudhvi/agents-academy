import type { Lesson } from "../types";

/* ============================================================================
 * Track: tools · Code Mode
 * Inspired by threepointone/codemode-talk — "every API is a tool you call
 * from code." Great fit for data roles who already think in queries/scripts.
 * ========================================================================== */

const starter = `// Code Mode gives the agent ONE tool: write code that calls typed
// codemode.* methods. Available tool:
//   codemode.listSales() -> [{ product, region, revenue }]
export default async function () {
  // TODO 1: call await codemode.listSales() to get the rows
  // TODO 2: total revenue per product and find the highest
  // TODO 3: console.log(\`Top product: \${name} ($\${total})\`)
}`;

const solution = `export default async function () {
  const rows = await codemode.listSales();
  const totals = {};
  for (const r of rows) {
    totals[r.product] = (totals[r.product] ?? 0) + r.revenue;
  }
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  console.log(\`Top product: \${top[0]} ($\${top[1]})\`);
}`;

export const agentsWriteCode: Lesson = {
  slug: "agents-write-code",
  trackId: "tools",
  order: 1,
  title: "Agents that write code (Code Mode)",
  summary:
    "Instead of wiring dozens of tools into a prompt, give the agent one tool: write code that calls your APIs as typed methods.",

  outcomes: [
    "Explain Code Mode and why it scales better than many separate tools.",
    "Read code that composes several API calls to answer a question.",
    "Write a small Code Mode task that aggregates data from a tool.",
  ],
  prerequisites: ["your-first-agent"],
  whyItMatters:
    "Real questions need many API calls combined — filter, join, total, rank. Describing 50 tools to a model is brittle and expensive. Code Mode lets the agent express the whole plan as code, which is exactly how data people already work.",
  timeEstimateMin: 14,
  competencies: ["code-mode", "tool-composition"],
  misconceptions: [
    {
      belief: "More tools = a more capable agent.",
      correction:
        "Past a handful, listing every tool bloats the prompt and confuses the model. Code Mode collapses them into one 'write code' tool, so capability scales without context bloat.",
    },
    {
      belief: "Letting the model write code is unsafe.",
      correction:
        "The generated code runs in an isolated Dynamic Worker / V8 isolate with no access to your secrets — it can only call the typed codemode.* methods you exposed.",
    },
  ],

  blocks: [
    { kind: "heading", text: "One tool to rule them all", id: "idea" },
    {
      kind: "prose",
      text: "Most agents get a list of tools and call them one at a time. **Code Mode** flips this: the agent gets a single tool — *write code* — and each of your APIs appears as a typed `codemode.*` method it can call, loop over, and combine.",
    },
    {
      kind: "diagram",
      title: "Many tools vs. Code Mode",
      caption: "One block of code calls many tools — instead of one tool call per turn.",
      nodes: [
        { id: "agent", label: "Agent", tone: "agent", icon: "agent", x: 0, y: 80 },
        { id: "code", label: "code (sandbox)", tone: "tool", icon: "code", x: 240, y: 80 },
        { id: "a", label: "listSales()", tone: "model", icon: "table", x: 480, y: 0 },
        { id: "b", label: "getCosts()", tone: "model", icon: "table", x: 480, y: 160 },
      ],
      edges: [
        { from: "agent", to: "code", label: "writes code" },
        { from: "code", to: "a" },
        { from: "code", to: "b" },
      ],
    },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "It's the difference between clicking one menu item at a time vs. writing a single formula that pulls, filters, and totals across sheets in one go. The agent writes that formula for you.",
    },
    {
      kind: "analogy",
      role: "Data scientist",
      audience: "concept",
      text: "Like handing the model a notebook with your data SDK pre-imported: it writes a cell that chains calls and returns the answer, instead of you exposing every endpoint as a separate function.",
    },
    {
      kind: "callout",
      tone: "note",
      title: "Why this matters for scale",
      text: "The model writes a few lines of code instead of reading dozens of separate tool descriptions — so it stays fast and focused no matter how many APIs you add.",
    },

    { kind: "heading", text: "What the code does", id: "does", audience: "concept" },
    {
      kind: "list",
      audience: "concept",
      items: [
        "Calls the sales tool to get every row.",
        "Adds up revenue per product.",
        "Picks the product with the highest total and reports it.",
      ],
    },
    {
      kind: "watch",
      labId: "codemode-sales",
      audience: "concept",
      caption: "No code needed — run the finished Code Mode task and see the top product it computes.",
    },
    {
      kind: "prose",
      audience: "concept",
      text: "Switch to **Code** view to write it yourself — it's about six lines.",
    },

    { kind: "heading", text: "Write a Code Mode task", id: "build", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "You're given one tool: `codemode.listSales()`. Compose the answer in code — total revenue per product and print the top one. Press **Run**, then **Check**.",
    },
    { kind: "codelab", labId: "codemode-sales", audience: "code" },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "why-code-mode" },
    { kind: "quiz", quizId: "code-mode-safe" },
  ],

  labs: {
    "codemode-sales": {
      id: "codemode-sales",
      language: "javascript",
      runCmd: "code-mode run task.js",
      files: [{ path: "task.js", language: "javascript", contents: starter }],
      challenge: {
        prompt: "Using only codemode.listSales(), print: Top product: <name> ($<total revenue>).",
        checks: [
          {
            id: "calls-tool",
            describe: "Actually calls codemode.listSales()",
            expectSource: { file: "task.js", pattern: "codemode.listSales" },
          },
          {
            id: "aggregates",
            describe: "Aggregates the rows (a loop or reduce)",
            expectSource: { file: "task.js", pattern: "/(reduce|for ?\\()/" },
          },
          {
            id: "prints-top",
            describe: "Prints the top product",
            expectStdout: "Top product",
          },
        ],
        solutionHint: solution,
      },
    },
  },

  quizzes: {
    "why-code-mode": {
      id: "why-code-mode",
      question: "Why does Code Mode scale better than exposing many separate tools?",
      options: [
        "It runs faster on the GPU",
        "It keeps prompt/context size fixed by replacing many tool definitions with one 'write code' tool",
        "It removes the need for any model",
        "It caches every API response forever",
      ],
      answerIndex: 1,
      explanation:
        "Each extra tool definition costs context and adds ambiguity. Code Mode exposes one code tool with typed codemode.* methods, so context stays constant no matter how many APIs are available.",
    },
    "code-mode-safe": {
      id: "code-mode-safe",
      question: "How is it safe to let the model write and run code?",
      options: [
        "It isn't — Code Mode is only for trusted models",
        "The code runs in an isolated V8 isolate with no secret access; it can only call the typed codemode.* methods you exposed",
        "The code is reviewed by a human before every run",
        "It runs directly on your laptop with full permissions",
      ],
      answerIndex: 1,
      explanation:
        "Generated code executes in an isolated Dynamic Worker / V8 isolate with no network or secret access — its only capabilities are the typed codemode.* methods you chose to expose, so a bad or buggy program can't reach anything sensitive.",
    },
  },

  recap: [
    "Code Mode = one 'write code' tool; each API is a typed codemode.* method.",
    "The agent composes calls (filter/join/total) in code, like an analyst would.",
    "Generated code runs isolated, with no access to your secrets.",
  ],
  next: { slug: "first-data-agent", label: "Build a data agent that runs Python" },

  status: "published",
};
