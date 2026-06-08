import type { Lesson } from "../types";

/* ============================================================================
 * Track: foundations · Lesson 1 — the no-code-first starting point.
 *
 * Centerpiece is the Agent Studio: learners assemble an agent with buttons,
 * ask the AI to write code in plain English, edit it, and RUN it for real in
 * the Sandbox — no pass/fail challenge.
 * ========================================================================== */

const starterProgram = `export default async function () {
  // Build your agent: pick a goal or add capabilities on the left,
  // or ask the AI in plain English. Then press "Run in Sandbox".
  const rows = await codemode.listSales();
  console.log("Loaded " + rows.length + " sales rows");
}`;

const topProductProgram = `export default async function () {
  const rows = await codemode.listSales();
  const totals = {};
  for (const r of rows) {
    totals[r.product] = (totals[r.product] ?? 0) + r.revenue;
  }
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  console.log("Top product: " + top[0] + " ($" + top[1] + ")");
}`;

const topRegionProgram = `export default async function () {
  const rows = await codemode.listSales();
  const totals = {};
  for (const r of rows) {
    totals[r.region] = (totals[r.region] ?? 0) + r.revenue;
  }
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  console.log("Top region: " + top[0] + " ($" + top[1] + ")");
}`;

const totalRevenueProgram = `export default async function () {
  const rows = await codemode.listSales();
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);
  console.log("Total revenue: $" + total);
}`;

export const whatIsAnAgent: Lesson = {
  slug: "what-is-an-agent",
  trackId: "foundations",
  order: 1,
  title: "What is an AI agent?",
  summary:
    "Start here. Understand what makes software an 'agent' — in plain language — then build one and run it for real, with or without code.",

  outcomes: [
    "Say what an AI agent is in one sentence.",
    "Tell an agent apart from a chatbot or a simple automation.",
    "Assemble and run a working agent — by clicking, by asking in English, or by editing code.",
  ],
  prerequisites: ["None — this is the starting point."],
  whyItMatters:
    "Before building anything, it helps to know what you're building. Agents are showing up in analytics, finance, and operations work — this lesson gives you the mental model the rest of the course builds on.",
  timeEstimateMin: 10,
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
        "Not to understand or direct them. You describe the goal; the agent figures out the steps and can even write the code. This lesson lets you click, ask in English, or edit code — your choice.",
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

    { kind: "heading", text: "Build and run your own agent", id: "studio" },
    {
      kind: "prose",
      text: "Now make one. Pick a goal, add capabilities, or just **ask in plain English** and let the AI write the code. Then press **Run in Sandbox** to execute it for real and see the answer. No coding required — but the editor is yours if you want it.",
    },
    { kind: "agentStudio", studioId: "sales" },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "agent-vs-chatbot" },
    { kind: "quiz", quizId: "agent-first-step" },
  ],

  labs: {},
  studios: {
    sales: {
      id: "sales",
      title: "Agent Studio: a tiny sales agent",
      intro: "Pick a goal, add capabilities, or ask the AI in plain English. Edit the code if you like, then run it for real in the Sandbox.",
      toolName: "codemode.listSales()",
      toolCatalog: "codemode.listSales() -> Promise<Array<{ product: string, region: string, revenue: number }>>",
      aiEnabled: true,
      toolPreview: {
        columns: ["product", "region", "revenue"],
        rows: [
          ["Widget A", "NA", 25000],
          ["Widget A", "EU", 17000],
          ["Gadget B", "NA", 30000],
          ["Sprocket C", "EU", 12000],
        ],
      },
      starterProgram,
      capabilities: [
        { id: "load", label: "Load the sales data", plain: "Call the tool to read the rows.", insert: "  const rows = await codemode.listSales();" },
        { id: "group", label: "Total revenue per product", plain: "Add up revenue grouped by product.", insert: "  const totals = {};\n  for (const r of rows) totals[r.product] = (totals[r.product] ?? 0) + r.revenue;" },
        { id: "top", label: "Find the highest", plain: "Sort and take the top entry.", insert: "  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];" },
        { id: "print", label: "Show the answer", plain: "Print the result.", insert: '  console.log("Top product: " + top[0] + " ($" + top[1] + ")");' },
      ],
      goals: [
        { id: "top-product", label: "Find the top product by revenue", program: topProductProgram, chatbotGuess: "Widget A is probably popular, so maybe that one." },
        { id: "top-region", label: "Find the top region by revenue", program: topRegionProgram, chatbotGuess: "EU is a big market, so likely EU." },
        { id: "total-revenue", label: "Calculate total revenue", program: totalRevenueProgram, chatbotGuess: "Around $75,000 based on the table size." },
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
        "No. You can pick a goal, add steps, or ask in English; editing code is optional.",
        "Yes. Agents only make sense if you can write TypeScript.",
        "Yes. Agents cannot work with business data.",
        "No, because agents do not use tools.",
      ],
      answerIndex: 0,
      explanation:
        "For analysts and finance users, clicking goals/steps or asking the AI in plain English is enough to build and run an agent. The editor is there for people who want it.",
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
    "You built and ran a real agent — by clicking, by asking in English, or by editing code.",
  ],
  next: { slug: "your-first-agent", label: "Build your first agent" },

  status: "published",
};
