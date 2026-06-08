import type { Lesson } from "../types";

/* ============================================================================
 * Track: foundations · Lesson 1 — the no-code-first starting point.
 * Designed so a non-technical learner (analyst/finance) finishes with real
 * understanding and a live demo, without writing or reading code.
 * ========================================================================== */

const starter = `// One tool is available: codemode.listSales() -> [{ product, region, revenue }]
export default async function () {
  // TODO 1: get the sales rows with await codemode.listSales()
  // TODO 2: add up revenue per product and pick the highest
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

export const whatIsAnAgent: Lesson = {
  slug: "what-is-an-agent",
  trackId: "foundations",
  order: 1,
  title: "What is an AI agent?",
  summary:
    "Start here. Understand what makes software an 'agent' — in plain language — and watch one do real work, no coding required.",

  outcomes: [
    "Say what an AI agent is in one sentence.",
    "Tell an agent apart from a chatbot or a simple automation.",
    "Watch an agent complete a real task end to end.",
  ],
  prerequisites: ["None — this is the starting point."],
  whyItMatters:
    "Before building anything, it helps to know what you're building. Agents are showing up in analytics, finance, and operations work — this lesson gives you the mental model the rest of the course builds on.",
  timeEstimateMin: 8,
  competencies: ["agent-concept"],
  misconceptions: [
    {
      belief: "An agent is just a chatbot.",
      correction:
        "A chatbot answers one message and forgets. An agent has memory, can decide what to do next, use tools, and keep working toward a goal across many steps.",
    },
    {
      belief: "Using agents means I have to be a programmer.",
      correction:
        "Not to understand or direct them. You describe the goal; the agent figures out the steps and can even write the code. This course shows both the no-code view and the code view — your choice.",
    },
  ],

  blocks: [
    { kind: "heading", text: "What makes something an agent?", id: "what" },
    {
      kind: "prose",
      text: "An **AI agent** is software that can pursue a goal: it can **remember** what's happened, **decide** what to do next, **use tools** (like looking up data or calling a service), and **act** — repeating until the job is done. A plain chatbot just replies to one message; an agent gets things done.",
    },
    {
      kind: "diagram",
      title: "How an agent works",
      nodes: [
        { id: "goal", label: "Your goal", tone: "user", x: 0, y: 110 },
        { id: "agent", label: "Agent: remember · decide · act", tone: "agent", x: 240, y: 110 },
        { id: "tools", label: "Tools & data", tone: "tool", x: 510, y: 30 },
        { id: "result", label: "Result", tone: "state", x: 510, y: 190 },
      ],
      edges: [
        { from: "goal", to: "agent" },
        { from: "agent", to: "tools", label: "look things up" },
        { from: "agent", to: "result", label: "deliver" },
      ],
    },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "Think of a very capable junior analyst: you say 'find the top-selling product this quarter', and they pull the data, do the math, and hand you the answer — instead of you writing the query yourself.",
    },
    {
      kind: "analogy",
      role: "Finance",
      audience: "concept",
      text: "Like an assistant who knows where every figure lives: ask 'which invoices didn't reconcile?' and they fetch both ledgers, compare them, and return just the exceptions.",
    },
    {
      kind: "callout",
      tone: "note",
      title: "The one-sentence version",
      text: "An agent is software that remembers, decides, and acts toward a goal — using tools and data along the way.",
    },

    { kind: "heading", text: "See one work", id: "see", audience: "concept" },
    {
      kind: "prose",
      audience: "concept",
      text: "Here's a tiny agent task: read a small sales table and report the top product by revenue. You don't write anything — press the button and watch it run.",
    },
    {
      kind: "watch",
      audience: "concept",
      labId: "agent-demo",
      caption: "The agent reads the sales data, adds up revenue per product, and reports the winner.",
    },

    { kind: "heading", text: "Try it yourself", id: "try", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Same task, in code. One tool is provided — `codemode.listSales()`. Total revenue per product and print the top one. Press **Run**, then **Check**.",
    },
    { kind: "codelab", labId: "agent-demo", audience: "code" },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "agent-vs-chatbot" },
  ],

  labs: {
    "agent-demo": {
      id: "agent-demo",
      language: "javascript",
      runCmd: "node task.js",
      files: [{ path: "task.js", language: "javascript", contents: starter }],
      challenge: {
        prompt: "Using codemode.listSales(), print: Top product: <name> ($<total revenue>).",
        checks: [
          { id: "calls-tool", describe: "Calls codemode.listSales()", expectSource: { file: "task.js", pattern: "codemode.listSales" } },
          { id: "aggregates", describe: "Adds up the rows (a loop or reduce)", expectSource: { file: "task.js", pattern: "/(reduce|for ?\\()/" } },
          { id: "prints-top", describe: "Prints the top product", expectStdout: "Top product" },
        ],
        solutionHint: solution,
      },
    },
  },

  quizzes: {
    "agent-vs-chatbot": {
      id: "agent-vs-chatbot",
      question: "What best separates an agent from a chatbot?",
      options: [
        "An agent uses a bigger model",
        "An agent can remember, decide, use tools, and act toward a goal — not just reply once",
        "An agent only works with text",
        "An agent never needs a model",
      ],
      answerIndex: 1,
      explanation:
        "The defining trait is goal-directed action over time: memory, decisions, tool use, and acting — not the model size. A chatbot simply responds to a single message.",
    },
  },

  recap: [
    "An agent remembers, decides, uses tools, and acts toward a goal.",
    "That's different from a chatbot, which just replies once and forgets.",
    "You watched a real agent read data and report an answer — no code required.",
  ],
  next: { slug: "your-first-agent", label: "Build your first agent" },

  status: "published",
};
