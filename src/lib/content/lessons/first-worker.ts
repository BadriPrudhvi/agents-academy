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
      text: "A **Worker** is a small piece of code that runs on Cloudflare's network — at the location nearest each user — without you managing any servers. A request comes in, your **`fetch` handler** runs, and you return a **`Response`**. That's the whole model. An **agent** is just a Worker with durable memory, so this is the shape everything else builds on.",
    },
    {
      kind: "diagram",
      title: "Request → Worker → Response",
      nodes: [
        { id: "user", label: "Request", tone: "user", x: 0, y: 110 },
        { id: "worker", label: "Worker (fetch)", tone: "agent", x: 250, y: 110 },
        { id: "resp", label: "Response", tone: "state", x: 520, y: 30 },
        { id: "binding", label: "Binding (e.g. AI)", tone: "tool", x: 520, y: 190 },
      ],
      edges: [
        { from: "user", to: "worker", label: "HTTP" },
        { from: "worker", to: "resp", label: "return" },
        { from: "worker", to: "binding", label: "env.AI" },
      ],
    },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "Think of a cloud function behind a URL: you don't run a machine, you just write 'when someone asks, do this and reply'. Cloudflare keeps it available everywhere, instantly.",
    },
    {
      kind: "analogy",
      role: "Data engineer",
      audience: "concept",
      text: "Like a stateless HTTP service with zero infra to manage — deploy is a single command, it scales to zero, and 'bindings' replace the usual tangle of connection strings and SDK setup.",
    },
    {
      kind: "callout",
      tone: "note",
      title: "The one idea to keep",
      text: "A Worker = one function (`fetch`) that turns a request into a response, running everywhere with no servers to manage. Bindings on `env` connect it to AI, storage, and other agents.",
    },

    // ── Concept-only summary ──
    {
      kind: "list",
      audience: "concept",
      ordered: true,
      items: [
        "A request arrives (someone opens your URL or your app calls it).",
        "Your `fetch` handler runs at the nearest Cloudflare location.",
        "It can use bindings — like the AI model — to do real work.",
        "It returns a response. Deploy is one command: `wrangler deploy`.",
      ],
    },
    {
      kind: "watch",
      labId: "hello-worker",
      audience: "concept",
      caption: "No code needed — run the finished Worker and see the response it returns.",
    },
    {
      kind: "prose",
      audience: "concept",
      text: "That's the platform your agents live on. Switch to **Code** view to write and run one yourself.",
    },

    // ── Code view ──
    { kind: "heading", text: "The smallest Worker", id: "smallest", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "You scaffold a project with `npm create cloudflare@latest` (the C3 CLI). It gives you a `wrangler.jsonc` config and a `src/index.js` with a default export. The `fetch` handler receives `(request, env, ctx)` and returns a `Response`.",
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
      text: "Bindings are how a Worker reaches platform resources. Declare one in config and it appears on `env`. Add the **AI** binding and your Worker can call a model directly — the seed of an agent.",
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
      text: "Here's a real Worker. Make it greet a person by name from the URL — `/?name=Ada` should return `Hello, Ada!`, and default to `world` when no name is given. Press **Run**, then **Check**.",
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
