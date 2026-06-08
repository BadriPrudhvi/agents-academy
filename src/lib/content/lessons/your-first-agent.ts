import type { Lesson } from "../types";

/* ============================================================================
 * MVP VERTICAL SLICE — authored end-to-end to the lesson rubric.
 * Track: first-agent · Lesson 1
 * ========================================================================== */

const wranglerConfig = `{
  "name": "my-first-agent",
  "main": "src/index.ts",
  "compatibility_date": "2025-05-25",
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
    //   Use this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", { messages: [...] })
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
      "@cf/meta/llama-3.1-8b-instruct",
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
    { kind: "heading", text: "What is an agent, really?", id: "what" },
    {
      kind: "prose",
      text: "An *agent* is software that can **remember**, **decide**, and **act** toward a goal — not just answer one question. A plain chatbot replies and forgets. An agent keeps context, calls models and tools, and can pick up where it left off.",
    },
    {
      kind: "diagram",
      title: "The shape of every agent",
      nodes: [
        { id: "user", label: "You / a system", tone: "user", x: 0, y: 110 },
        { id: "agent", label: "Agent", tone: "agent", x: 230, y: 110 },
        { id: "model", label: "Model (Workers AI)", tone: "model", x: 470, y: 20 },
        { id: "state", label: "Memory (state)", tone: "state", x: 470, y: 200 },
      ],
      edges: [
        { from: "user", to: "agent", label: "request" },
        { from: "agent", to: "model", label: "prompt" },
        { from: "agent", to: "state", label: "remember" },
      ],
    },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "Think of a saved spreadsheet macro that also *remembers* every run and can ask an AI for help mid-way — it keeps its own running totals between uses, without a separate database.",
    },
    {
      kind: "analogy",
      role: "Finance",
      audience: "concept",
      text: "Like a recurring reconciliation that retains its own ledger of what it has processed, can call out for a judgment call, and resumes cleanly next month.",
    },
    {
      kind: "callout",
      tone: "note",
      title: "The one idea to keep",
      text: "One agent = one durable identity with its own private memory. You talk to it by name, and it's still there — with its memory — on the next request. No external database required.",
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
      kind: "prose",
      audience: "concept",
      text: "That's the whole pattern: **input → think (model) → remember (state) → respond**. Switch to **Code** view (top right) anytime to see — and run — the real implementation.",
    },

    // ── Code view ──
    { kind: "heading", text: "The shape in code", id: "shape", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "You extend `Agent<Env, State>` and implement a handler such as `onRequest`. Inside, `this.env` exposes your bindings (like `AI`), and `this.state` / `this.setState` persist data automatically.",
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
      text: "Below is a real agent with three TODOs. Implement them so it greets a person with a model-generated line and counts how many greetings it has produced. Press **Run** to execute, then **Check** to grade against the lesson's hidden tests.",
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
        "Each agent is a Durable Object with its own embedded SQLite. State set via this.setState / this.sql persists with that instance — no external database, and not a Worker global (which is ephemeral and shared).",
    },
  },

  recap: [
    "An agent is a durable identity (a Durable Object), not just a prompt.",
    "this.env exposes bindings; you called the AI binding with this.env.AI.run.",
    "this.setState persisted memory across requests with no external database.",
  ],
  next: { slug: "streaming-chat", label: "Stream responses to a chat UI" },

  status: "published",
};
