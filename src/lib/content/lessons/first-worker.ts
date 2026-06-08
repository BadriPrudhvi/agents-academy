import type { Lesson } from "../types";

/* ============================================================================
 * Track: foundations · Lesson 2 — the platform your agent runs on.
 *
 * Bridges "what is an agent" to "your first agent": a Worker is the unit of
 * compute every agent runs on. Concept-first for analysts; a real, runnable
 * fetch handler for engineers. Grounded in the current Workers getting-started
 * guide (C3, wrangler.jsonc, fetch handler, wrangler deploy).
 * ========================================================================== */

const wranglerBasic = `{
  "name": "my-first-worker",
  "main": "src/index.js",
  "compatibility_date": "2026-06-08"
}`;

const helloWorld = `export default {
  // Runs on every HTTP request, at the Cloudflare location nearest the user.
  async fetch(request, env, ctx) {
    return new Response("Hello World!");
  },
};`;

const helloStarter = `export default {
  async fetch(request, env, ctx) {
    // TODO: read the \`name\` query parameter from the URL and greet them,
    //   e.g. /?name=Ada -> "Hello, Ada!". Default to "world" when it's missing.
    //   Hint: const url = new URL(request.url);
    //         const name = url.searchParams.get("name");
    return new Response("Hello World!");
  },
};`;

const helloSolution = `export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const name = url.searchParams.get("name") ?? "world";
    return new Response(\`Hello, \${name}!\`);
  },
};`;

const wranglerAI = `{
  "name": "my-first-worker",
  "main": "src/index.js",
  "compatibility_date": "2026-06-08",
  "ai": { "binding": "AI" }
}`;

const aiWorker = `export default {
  async fetch(request, env, ctx) {
    // \`env\` exposes your bindings. The "ai" binding above becomes env.AI.
    const { response } = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      { messages: [{ role: "user", content: "Say hello in one short line." }] },
    );
    return new Response(response);
  },
};`;

export const firstWorker: Lesson = {
  slug: "first-worker",
  trackId: "foundations",
  order: 2,
  title: "Your first Worker",
  summary:
    "Meet the unit of compute every agent runs on: a Worker. Write a fetch handler, add a binding, and deploy it live — with Wrangler.",
  bigIdea: "A Worker is one function that turns a request into a response — with **no servers** to manage.",

  outcomes: [
    "Explain what a Worker is and where it runs.",
    "Write a fetch handler that reads a request and returns a Response.",
    "Add a binding and deploy a Worker with Wrangler.",
  ],
  prerequisites: ["what-is-an-agent", "Node.js installed (to follow along in code)"],
  whyItMatters:
    "Every agent in this course runs on a Worker — the Agent class is a Worker with durable state. Understanding the request → handler → response shape, bindings, and `wrangler deploy` is the ground floor everything else builds on.",
  timeEstimateMin: 10,
  competencies: ["workers-runtime", "wrangler-deploy", "bindings"],
  misconceptions: [
    {
      belief: "I need to provision a server or container to run my code.",
      correction:
        "A Worker is serverless: you write a function, and Cloudflare runs it on demand at the location nearest each user. There's no VM to size, patch, or keep warm.",
    },
    {
      belief: "Bindings are just environment-variable strings.",
      correction:
        "A binding is a typed, ready-to-use connection to a platform resource — Workers AI, KV, R2, a Durable Object — exposed on `env` (e.g. `env.AI`). It's a live client, not a string you parse.",
    },
  ],

  blocks: [
    { kind: "heading", text: "What is a Worker?", id: "what" },
    {
      kind: "prose",
      text: "Code that runs on Cloudflare's network, near each user — no servers to manage. A request comes in, your `fetch` handler runs, and you return a `Response`.",
    },
    {
      kind: "diagram",
      title: "Request → Worker → Response",
      nodes: [
        { id: "req", label: "Request", tone: "user", icon: "globe", x: 0, y: 80 },
        { id: "worker", label: "Worker (fetch)", tone: "agent", icon: "code", x: 240, y: 80 },
        { id: "resp", label: "Response", tone: "output", icon: "arrowOut", x: 480, y: 0 },
        { id: "binding", label: "Binding (AI)", tone: "tool", icon: "sparkle", x: 480, y: 160 },
      ],
      edges: [
        { from: "req", to: "worker" },
        { from: "worker", to: "resp", label: "return" },
        { from: "worker", to: "binding", label: "env.AI" },
      ],
    },
    { kind: "statement", text: "An agent is just a Worker with **memory**.", sub: "Same request → handler → response — plus durable state." },
    {
      kind: "pills",
      label: "On env, a Worker reaches:",
      items: ["Workers AI", "KV", "R2", "Durable Objects", "Queues"],
    },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "Like a cloud function behind a URL: no machine to run — you just say “when someone asks, do this and reply,” and it's available everywhere.",
    },
    {
      kind: "watch",
      labId: "hello-worker",
      audience: "concept",
      caption: "No code needed — run the finished Worker and see what it returns.",
    },
    {
      kind: "prose",
      audience: "concept",
      text: "That's the platform your agents live on. Switch to **Code** to write one yourself.",
    },

    // ── Code view ──
    { kind: "heading", text: "The smallest Worker", id: "smallest", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Scaffold with `npm create cloudflare@latest`. You get a `wrangler.jsonc` and a `fetch` handler that takes `(request, env, ctx)` and returns a `Response`.",
    },
    {
      kind: "code",
      audience: "code",
      lang: "jsonc",
      caption: "wrangler.jsonc — names the Worker and points at your entry file",
      code: wranglerBasic,
    },
    {
      kind: "code",
      audience: "code",
      lang: "javascript",
      caption: "src/index.js — return a Response. Run it with `npx wrangler dev`.",
      code: helloWorld,
    },

    { kind: "heading", text: "Add a binding", id: "binding", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Declare a binding in config and it appears on `env`. Add the **AI** binding and your Worker can call a model — the seed of an agent.",
    },
    {
      kind: "code",
      audience: "code",
      lang: "jsonc",
      caption: "wrangler.jsonc — add the Workers AI binding",
      code: wranglerAI,
    },
    {
      kind: "code",
      audience: "code",
      lang: "javascript",
      caption: "src/index.js — call the model through env.AI",
      code: aiWorker,
    },

    { kind: "heading", text: "Build it", id: "build", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Make this Worker greet by name: `/?name=Ada` → `Hello, Ada!`, default to `world`. Press **Run**, then **Check**.",
    },
    { kind: "codelab", labId: "hello-worker", audience: "code" },
    {
      kind: "callout",
      tone: "tip",
      audience: "code",
      title: "Stuck?",
      text: "Build a `new URL(request.url)` and read `url.searchParams.get(\"name\")`. Use `?? \"world\"` so a missing name falls back cleanly.",
    },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "where-workers-run" },
    { kind: "quiz", quizId: "what-is-a-binding" },
  ],

  labs: {
    "hello-worker": {
      id: "hello-worker",
      language: "javascript",
      runCmd: "wrangler dev",
      files: [
        { path: "src/index.js", language: "javascript", contents: helloStarter },
        { path: "wrangler.jsonc", language: "jsonc", contents: wranglerBasic, readOnly: true },
      ],
      challenge: {
        prompt:
          "Read the `name` query parameter and return `Hello, <name>!`, defaulting to `world` when it's missing.",
        checks: [
          {
            id: "reads-query",
            describe: "Reads the query string (new URL / searchParams)",
            expectSource: { file: "src/index.js", pattern: "searchParams" },
          },
          {
            id: "greets-by-name",
            describe: "Run output greets the requested name",
            expectStdout: "Hello, Ada",
          },
        ],
        solutionHint: helloSolution,
      },
    },
  },

  quizzes: {
    "where-workers-run": {
      id: "where-workers-run",
      question: "Where does a Worker's code run?",
      options: [
        "On a server you provision and keep running",
        "On Cloudflare's network, on demand, near each user",
        "Only in the user's browser",
        "On a single machine in one region",
      ],
      answerIndex: 1,
      explanation:
        "Workers are serverless and run across Cloudflare's global network, close to each user — there's no machine for you to size, patch, or keep warm. It's not browser-only, and it's not pinned to one region.",
    },
    "what-is-a-binding": {
      id: "what-is-a-binding",
      question: "What is a binding in a Worker?",
      options: [
        "A string environment variable you parse yourself",
        "A typed, ready-to-use connection to a resource, exposed on `env`",
        "A separate microservice you deploy",
        "A frontend component",
      ],
      answerIndex: 1,
      explanation:
        "A binding is a live, typed handle to a platform resource — Workers AI, KV, R2, a Durable Object — available on `env` (e.g. `env.AI.run(...)`). It's configured in `wrangler.jsonc`, not parsed from a string.",
    },
  },

  recap: [
    "A Worker turns a request into a response, running everywhere with no servers to manage.",
    "The `fetch(request, env, ctx)` handler is the core; `env` carries your bindings.",
    "Add a binding (like AI) in `wrangler.jsonc`, then ship with one `wrangler deploy`.",
  ],
  next: { slug: "your-first-agent", label: "Build your first agent" },

  status: "published",
};
