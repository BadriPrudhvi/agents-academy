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
  bigIdea: "An agent is a model in a **loop** with tools — it decides, acts, and repeats until it can answer.",

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
    { kind: "heading", text: "Agent vs. chatbot", id: "what" },
    {
      kind: "prose",
      text: "A chatbot replies once from memory. An agent keeps going — using tools and real data to reach a goal.",
    },
    {
      kind: "compare",
      left: {
        title: "Chatbot",
        items: ["Replies from memory", "One shot, then forgets", "Guesses when it's unsure"],
      },
      right: {
        title: "Agent",
        items: ["Uses tools and real data", "Remembers across steps", "Decides what to do next", "Works toward a goal"],
      },
    },

    { kind: "statement", text: "Every agent runs the same **loop**.", sub: "decide → act → observe → answer" },
    {
      kind: "diagram",
      title: "The agent loop",
      nodes: [
        { id: "goal", label: "Goal", tone: "user", icon: "flag", x: 0, y: 80 },
        { id: "decide", label: "Decides", tone: "model", icon: "brain", x: 230, y: 80 },
        { id: "tool", label: "Tool call", tone: "tool", icon: "wrench", x: 460, y: 80 },
        { id: "observe", label: "Reads result", tone: "output", icon: "eye", x: 690, y: 80 },
        { id: "answer", label: "Answers", tone: "model", icon: "message", x: 920, y: 80 },
      ],
      edges: [
        { from: "goal", to: "decide" },
        { from: "decide", to: "tool" },
        { from: "tool", to: "observe" },
        { from: "observe", to: "answer" },
        { from: "observe", to: "decide", label: "not done? repeat", curve: 110 },
      ],
    },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "Like a capable junior analyst: you say “find the top product this quarter,” and they pull the data, do the math, and hand you the answer.",
    },

    { kind: "heading", text: "Watch a real agent work", id: "agent" },
    {
      kind: "prose",
      audience: "concept",
      text: "Give it a goal and watch the loop run — it picks a tool, reads the real rows, and answers from them.",
    },
    { kind: "agentRun", runId: "sales", audience: "concept" },
    {
      kind: "prose",
      audience: "code",
      text: "Prefer code? Here's the same agent as an editable program. Extend it, ask the AI, then **Run in Sandbox** for real.",
    },
    { kind: "agentStudio", studioId: "sales", audience: "code" },

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

  agentRuns: {
    sales: {
      id: "sales",
      intro: "",
      model: "GLM-4.7-Flash (Workers AI)",
      tools: [
        { name: "getSales", description: "Returns every sales record (product, region, revenue)." },
        { name: "getSalesByRegion", description: "Returns sales records for one region (NA or EU)." },
      ],
      examples: [
        "Which product made the most money?",
        "How did the EU region do?",
        "What's our total revenue?",
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
  next: { slug: "first-worker", label: "Your first Worker" },

  status: "published",
};
