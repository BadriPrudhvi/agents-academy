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

const topRegionProgram = `export default async function () {
  const rows = await codemode.listSales();
  const totals = {};
  for (const r of rows) {
    totals[r.region] = (totals[r.region] ?? 0) + r.revenue;
  }
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  console.log(\`Top region: \${top[0]} ($\${top[1]})\`);
}`;

const totalRevenueProgram = `export default async function () {
  const rows = await codemode.listSales();
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);
  console.log(\`Total revenue: $\${total}\`);
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

    { kind: "heading", text: "Build the agent piece by piece", id: "builder", audience: "concept" },
    {
      kind: "prose",
      audience: "concept",
      text: "Instead of starting with code, let's assemble the agent like a checklist. Each button adds one capability. Press **Run current agent** after each step to see what the agent can do now.",
    },
    { kind: "agentBuilder", builderId: "sales-agent", audience: "concept" },

    { kind: "heading", text: "Drive an agent yourself", id: "see", audience: "concept" },
    {
      kind: "prose",
      audience: "concept",
      text: "Now you choose the goal. The agent will read real data, decide what to compute, and show the answer. You don't write code — you steer the task and watch the loop.",
    },
    {
      kind: "agentSim",
      audience: "concept",
      simId: "sales",
    },

    { kind: "heading", text: "Try it yourself", id: "try", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Same task, in code. One tool is provided — `codemode.listSales()`. Total revenue per product and print the top one. Press **Run**, then **Check**.",
    },
    { kind: "codelab", labId: "agent-demo", audience: "code" },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "agent-first-step" },
    { kind: "quiz", quizId: "do-i-need-code" },
    { kind: "quiz", quizId: "agent-vs-chatbot" },
  ],

  builders: {
    "sales-agent": {
      id: "sales-agent",
      title: "Build a tiny sales agent",
      intro: "Click each capability to see how a goal becomes an agent. The code appears in parallel, but you don't need to write it.",
      steps: [
        {
          id: "goal",
          label: "Add a goal",
          plain: "Tell the agent what outcome you want.",
          code: `const goal = "Find the top product by revenue";`,
          output: "Goal saved: Find the top product by revenue.\n\nThe agent knows what you want, but it cannot answer yet because it has no data.",
        },
        {
          id: "tool",
          label: "Add a data tool",
          plain: "Give the agent a safe way to read the sales table.",
          code: `const rows = await codemode.listSales();`,
          output: "Tool connected: sales data loaded.\n\nRows available:\n- Widget A / NA / 25000\n- Widget A / EU / 17000\n- Gadget B / NA / 30000\n- Sprocket C / EU / 12000",
        },
        {
          id: "decision",
          label: "Add a decision step",
          plain: "Decide how to turn rows into an answer.",
          code: `const totals = {};
for (const row of rows) {
  totals[row.product] = (totals[row.product] ?? 0) + row.revenue;
}`,
          output: "Decision complete: group by product and add revenue.\n\nIntermediate totals:\n- Widget A: 42000\n- Gadget B: 30000\n- Sprocket C: 12000",
        },
        {
          id: "action",
          label: "Add an action",
          plain: "Return the answer in a form someone can use.",
          code: `const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
return ` + "`Top product: ${top[0]} ($${top[1]})`;",
          output: "Top product: Widget A ($42000)\n\nNow the agent can complete the task end to end.",
        },
        {
          id: "memory",
          label: "Add memory",
          plain: "Remember what was asked and how it was answered.",
          code: `memory.push({
  goal,
  answer: "Top product: Widget A ($42000)",
  usedTool: "codemode.listSales()",
});`,
          output: "Memory saved.\n\nThe next time someone asks about this sales table, the agent can explain what it did and what data it used.",
        },
      ],
    },
  },

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

  sims: {
    sales: {
      id: "sales",
      toolName: "codemode.listSales()",
      predict: true,
      toolPreview: {
        columns: ["product", "region", "revenue"],
        rows: [
          ["Widget A", "NA", 25000],
          ["Widget A", "EU", 17000],
          ["Gadget B", "NA", 30000],
          ["Sprocket C", "EU", 12000],
        ],
      },
      goals: [
        {
          id: "top-product",
          label: "Find the top product by revenue",
          toolName: "codemode.listSales()",
          program: solution,
          steps: [
            "Read the goal: find the product with the most revenue.",
            "Decide the needed tool: sales rows.",
            "Call codemode.listSales() to get the table.",
            "Add revenue for each product.",
            "Return the highest product and its total.",
          ],
          chatbotGuess: "Widget A is probably popular, so it might be the top product.",
          expectedAnswer: "Top product: Widget A ($42000)",
        },
        {
          id: "top-region",
          label: "Find the top region by revenue",
          toolName: "codemode.listSales()",
          program: topRegionProgram,
          steps: [
            "Read the goal: find which region sold the most.",
            "Decide the needed tool: sales rows grouped by region.",
            "Call codemode.listSales() to get the table.",
            "Add revenue for each region.",
            "Return the highest region and its total.",
          ],
          chatbotGuess: "EU is a large market, so it may be the top region.",
          expectedAnswer: "Top region: NA ($55000)",
        },
        {
          id: "total-revenue",
          label: "Calculate total revenue",
          toolName: "codemode.listSales()",
          program: totalRevenueProgram,
          steps: [
            "Read the goal: calculate total revenue.",
            "Decide the needed tool: all sales rows.",
            "Call codemode.listSales() to get the table.",
            "Add every revenue value together.",
            "Return the final total.",
          ],
          chatbotGuess: "The total is likely around $75,000 based on the table size.",
          expectedAnswer: "Total revenue: $84000",
        },
      ],
    },
  },

  quizzes: {
    "agent-first-step": {
      id: "agent-first-step",
      question: "For a data question, what should the agent usually do before answering?",
      options: [
        "Guess from common business patterns",
        "Fetch or inspect the relevant data",
        "Ask for a larger model",
        "Skip the data if the question sounds simple",
      ],
      answerIndex: 1,
      explanation:
        "For data work, the agent should ground the answer in the actual data before computing or responding. Guessing is what we are trying to avoid.",
    },
    "do-i-need-code": {
      id: "do-i-need-code",
      question: "Do you need to write code to understand what this agent is doing?",
      options: [
        "No. You can understand the goal, tool, decision, and answer first; code view is optional.",
        "Yes. Agents only make sense if you can write TypeScript.",
        "Yes. Agents cannot work with business data.",
        "No, because agents do not use tools.",
      ],
      answerIndex: 0,
      explanation:
        "For analysts and finance users, the concept view is enough to understand the workflow. Code view exists for people who want to inspect or build the implementation.",
    },
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
