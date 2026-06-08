import type { Lesson } from "../types";

/* ============================================================================
 * MVP VERTICAL SLICE — authored end-to-end to the lesson rubric.
 * Track: first-agent · Lesson 1
 * ========================================================================== */

const wranglerConfig = `{
  "name": "my-first-agent",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-08",
  "compatibility_flags": ["nodejs_compat"],
  "ai": { "binding": "AI" },
  "durable_objects": {
    "bindings": [{ "name": "GREETER", "class_name": "Greeter" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["Greeter"] }]
}`;

const starterAgent = `import { Agent } from "agents";

interface Env {
  AI: Ai;
  GREETER: DurableObjectNamespace;
}

interface State {
  greetings: number;
}

// An Agent runs on a Durable Object: each instance has a durable
// identity and its own SQL-backed state — no external database.
export class Greeter extends Agent<Env, State> {
  initialState: State = { greetings: 0 };

  async onRequest(request: Request): Promise<Response> {
    const { name } = await request.json<{ name: string }>();

    // TODO 1: call Workers AI to generate a one-line greeting for \`name\`.
    //   Use this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages: [...] })
    //   and read the \`response\` field.

    // TODO 2: increment this.state.greetings using this.setState(...).

    // TODO 3: return Response.json({ reply, count }) where reply is the
    //   model's text and count is the updated greeting total.

    return Response.json({ reply: "not implemented", count: 0 });
  }
}`;

const solutionAgent = `import { Agent } from "agents";

interface Env {
  AI: Ai;
  GREETER: DurableObjectNamespace;
}

interface State {
  greetings: number;
}

export class Greeter extends Agent<Env, State> {
  initialState: State = { greetings: 0 };

  async onRequest(request: Request): Promise<Response> {
    const { name } = await request.json<{ name: string }>();

    const { response } = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "system", content: "You greet people in one short, warm line." },
          { role: "user", content: \`Greet \${name}.\` },
        ],
      },
    );

    this.setState({ greetings: this.state.greetings + 1 });

    return Response.json({ reply: response, count: this.state.greetings });
  }
}`;

export const yourFirstAgent: Lesson = {
  slug: "your-first-agent",
  trackId: "first-agent",
  order: 1,
  title: "Your first agent",
  summary:
    "Build a stateful agent that calls a model and remembers how many times it has run — using the Agents SDK on a Durable Object.",
  bigIdea: "An agent is a **durable** identity that calls a model and remembers — across requests.",

  outcomes: [
    "Explain how an Agent differs from a plain Worker and a chatbot.",
    "Call a Workers AI model from inside an Agent.",
    "Persist and update agent state without an external database.",
  ],
  prerequisites: ["A Cloudflare account (free tier is fine to read along)", "Basic TypeScript"],
  whyItMatters:
    "Every agent you build — chat, voice, research, coding — starts from this shape: a durable identity that can call a model and keep state across requests. Get this right and the rest of the course is composition.",
  timeEstimateMin: 12,
  competencies: ["agent-class", "workers-ai-inference", "agent-state"],
  misconceptions: [
    {
      belief: "An agent is just a chatbot with a nicer prompt.",
      correction:
        "A chatbot answers one message at a time. An agent has durable state, can run on a schedule, call tools, and continue work across many turns — the Agent class gives it identity and memory.",
    },
    {
      belief: "I need a database (D1/Postgres) to remember anything.",
      correction:
        "Each Agent instance is a Durable Object with its own embedded SQLite. `this.state` / `this.sql` persist automatically — no external database to provision for per-agent memory.",
    },
  ],

  blocks: [
    { kind: "heading", text: "Worker vs. agent", id: "what" },
    {
      kind: "prose",
      text: "A plain Worker forgets between requests. An agent keeps its own memory — and can call models and tools toward a goal.",
    },
    {
      kind: "compare",
      left: {
        title: "Plain Worker",
        items: ["Stateless — forgets each request", "Just request → response"],
      },
      right: {
        title: "Agent",
        items: ["Durable identity + memory", "Calls models and tools", "Resumes across requests", "Can run on a schedule"],
      },
    },
    { kind: "statement", text: "Every agent: **input → think → remember → respond**.", sub: "a model for thinking, durable state for memory" },
    {
      kind: "diagram",
      title: "The shape of every agent",
      nodes: [
        { id: "you", label: "You / system", tone: "user", icon: "person", x: 0, y: 80 },
        { id: "agent", label: "Agent", tone: "agent", icon: "agent", x: 240, y: 80 },
        { id: "model", label: "Model (AI)", tone: "model", icon: "sparkle", x: 480, y: 0 },
        { id: "mem", label: "Memory", tone: "state", icon: "database", x: 480, y: 160 },
      ],
      edges: [
        { from: "you", to: "agent" },
        { from: "agent", to: "model", label: "prompt" },
        { from: "agent", to: "mem", label: "remember" },
      ],
    },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "Like a saved spreadsheet macro that remembers every run and can ask an AI for help mid-way — keeping its own running totals, no separate database.",
    },

    // ── Concept-only walkthrough (no code) ──
    { kind: "heading", text: "What this agent does", id: "does", audience: "concept" },
    {
      kind: "list",
      audience: "concept",
      items: [
        "Receives a name to greet.",
        "Asks an AI model to write a short, warm greeting.",
        "Adds one to its own running count of greetings (its memory).",
        "Replies with the greeting and the new total.",
      ],
    },
    {
      kind: "watch",
      labId: "greeter",
      audience: "concept",
      caption: "No code needed — run the finished agent and watch it greet someone (and count it).",
    },
    {
      kind: "prose",
      audience: "concept",
      text: "Switch to **Code** to see — and build — the real implementation.",
    },

    // ── Code view ──
    { kind: "heading", text: "The shape in code", id: "shape", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Extend `Agent<Env, State>` and implement `onRequest`. `this.env` holds your bindings (like `AI`); `this.state` / `this.setState` persist automatically.",
    },
    {
      kind: "callout",
      tone: "note",
      audience: "code",
      title: "New words, in plain English",
      text: "**Durable Object** — a single always-there copy of your agent with its own tiny built-in database (that's what makes memory durable). **Binding** — a ready-to-use connection to a resource (like the AI model) on `this.env`. No need to memorize — these click after a lesson or two.",
    },
    {
      kind: "code",
      audience: "code",
      lang: "jsonc",
      caption: "wrangler.jsonc — binds Workers AI and registers the agent's Durable Object",
      code: wranglerConfig,
    },
    { kind: "heading", text: "Build it", id: "build", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "This agent has three TODOs. Make it greet a name with a model-generated line and count its greetings. Press **Run**, then **Check**.",
    },
    { kind: "codelab", labId: "greeter", audience: "code" },
    {
      kind: "callout",
      tone: "tip",
      title: "Stuck?",
      audience: "code",
      text: "The Workers AI call returns an object — destructure `{ response }` from it. State updates go through `this.setState(...)`, never by mutating `this.state` directly.",
    },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "how-agent-calls-model" },
    { kind: "quiz", quizId: "where-state-lives" },
  ],

  labs: {
    greeter: {
      id: "greeter",
      language: "typescript",
      runCmd: "wrangler dev",
      files: [
        { path: "src/index.ts", language: "typescript", contents: starterAgent },
        { path: "wrangler.jsonc", language: "jsonc", contents: wranglerConfig, readOnly: true },
      ],
      challenge: {
        prompt:
          "Make the agent return JSON { reply, count } where reply is a model-generated greeting for the posted name and count increments on every request.",
        checks: [
          {
            id: "calls-ai",
            describe: "Calls Workers AI with this.env.AI.run(...)",
            expectSource: { file: "src/index.ts", pattern: "this.env.AI.run" },
          },
          {
            id: "updates-state",
            describe: "Updates state via this.setState(...)",
            expectSource: { file: "src/index.ts", pattern: "this.setState" },
          },
          {
            id: "returns-reply",
            describe: "Run output includes a greeting and a count",
            expectStdout: "count",
          },
        ],
        solutionHint: solutionAgent,
      },
    },
  },

  quizzes: {
    "how-agent-calls-model": {
      id: "how-agent-calls-model",
      question: "How does the agent produce its greeting text?",
      options: [
        "It picks from a fixed list of canned greetings",
        "It calls a model via the AI binding (this.env.AI.run) and uses the response",
        "It queries an external database",
        "It asks the user to type the greeting",
      ],
      answerIndex: 1,
      explanation:
        "The agent calls Workers AI through its AI binding — this.env.AI.run(model, { messages }) — and uses the returned `response` text. There's no canned list, external database, or user input involved.",
    },
    "where-state-lives": {
      id: "where-state-lives",
      question: "Where does an Agent's state physically live?",
      options: [
        "In a global variable in the Worker",
        "In the Durable Object instance backing that agent (embedded SQLite)",
        "In a separate D1 database you must create",
        "In the browser's localStorage",
      ],
      answerIndex: 1,
      explanation:
        "Each agent runs as a Durable Object — think of it as a single, always-there instance with its own small built-in database. State you save sticks with that instance, so there's no separate database to set up (and it's not a shared global variable, which would be wiped between requests).",
    },
  },

  recap: [
    "An agent is a long-lived helper with its own memory — not just a one-off prompt.",
    "It calls the AI model through a binding: a ready-made connection to Workers AI.",
    "Its memory is saved automatically between requests — no separate database to set up.",
  ],
  next: { slug: "streaming-chat", label: "Stream responses to a chat UI" },

  status: "published",
};
