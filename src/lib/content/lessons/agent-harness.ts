import type { Lesson } from "../types";

/* ============================================================================
 * Track: first-agent · Lesson 3 — opinionated harness vs. your own loop.
 *
 * Grounded in the current Agents docs: @cloudflare/think (the "Think" harness)
 * vs. @cloudflare/ai-chat's AIChatAgent where you own the streamText loop. The
 * docs' own "Think vs AIChatAgent" comparison drives this lesson.
 * ========================================================================== */

const thinkServer = `import { Think } from "@cloudflare/think";
import { createWorkersAI } from "workers-ai-provider";
import { routeAgentRequest } from "agents";

// Think is opinionated: give it a model and the agentic loop, memory,
// streaming, persistence, and tool-calling are wired up for you.
export class MyAgent extends Think<Env> {
  getModel() {
    return createWorkersAI({ binding: this.env.AI })("@cf/zai-org/glm-4.7-flash");
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (await routeAgentRequest(request, env)) ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;`;

const ownLoop = `import { AIChatAgent } from "@cloudflare/ai-chat";
import { createWorkersAI } from "workers-ai-provider";
import { streamText, convertToModelMessages, stepCountIs, tool } from "ai";
import { z } from "zod";

// You own the loop: you choose the model, the tools, and when to stop.
export class MyAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const workersai = createWorkersAI({ binding: this.env.AI });

    const result = streamText({
      model: workersai("@cf/zai-org/glm-4.7-flash"),
      system: "You are a helpful assistant.",
      messages: await convertToModelMessages(this.messages),
      tools: {
        getWeather: tool({
          description: "Get the weather for a city.",
          inputSchema: z.object({ city: z.string() }),
          execute: async ({ city }) => ({ city, tempC: 18, sky: "cloudy" }),
        }),
      },
      // The loop: let the model call tools and keep going, up to 5 rounds.
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  }
}`;

export const agentHarness: Lesson = {
  slug: "agent-harness",
  trackId: "first-agent",
  order: 3,
  title: "Project Think vs. your own loop",
  summary:
    "Two ways to build a chat agent: the opinionated Think harness (a few lines) or your own streamText loop for full control. Learn when to pick which.",
  bigIdea: "You don't hand-write the agent loop — you **adopt** one, or **wire** one.",

  outcomes: [
    "Describe what an agent harness does that a raw model call doesn't.",
    "Stand up a chat agent with Think in a few lines.",
    "Decide when to drop down to your own loop with AIChatAgent.",
  ],
  prerequisites: ["streaming-chat"],
  whyItMatters:
    "You rarely hand-write the decide → act → observe loop in production — you either adopt a harness that runs it for you or wire the AI SDK's loop yourself. Knowing the trade-off saves you from both reinventing plumbing and from fighting an opinionated framework when you needed control.",
  timeEstimateMin: 11,
  competencies: ["agent-harness", "agentic-loop", "architecture-tradeoffs"],
  misconceptions: [
    {
      belief: "A harness like Think is a toy — real agents are hand-built.",
      correction:
        "It's the opposite: Think ships with persistent memory, long-conversation handling, search, and helper sub-agents built in. You drop to your own loop for control over the model call (custom retrieval, multiple models), not for more power.",
    },
    {
      belief: "Building an agent means writing the tool-calling loop yourself.",
      correction:
        "With Think the loop is built in — you implement `getModel()`. Even with AIChatAgent you configure the AI SDK's multi-step loop via `stopWhen`; you tune it, you don't hand-roll the iteration.",
    },
  ],

  blocks: [
    { kind: "heading", text: "Harness or hand-built?", id: "what" },
    {
      kind: "prose",
      text: "You've seen the agent loop. In real apps you don't write it by hand — you adopt a harness that runs it, or wire the AI SDK's loop yourself. Cloudflare gives you both.",
    },
    {
      kind: "diagram",
      title: "The loop a harness runs for you",
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
        { from: "observe", to: "decide", label: "more tool calls? loop", curve: 110 },
      ],
    },

    { kind: "heading", text: "Run the loop", id: "run", audience: "concept" },
    {
      kind: "prose",
      audience: "concept",
      text: "Here's that loop, **live**. Give it a goal; watch it pick a tool, read real data, and answer.",
    },
    { kind: "agentRun", runId: "loop", audience: "concept" },

    { kind: "statement", text: "Two ways to build it: **adopt** or **wire**.", sub: "Think runs the loop for you · AIChatAgent hands you the model call" },
    {
      kind: "compare",
      left: {
        title: "Think (opinionated)",
        items: ["~3-line subclass — getModel()", "Loop, memory, streaming built in", "Search + helper sub-agents free", "Ship fast"],
      },
      right: {
        title: "Your own loop (AIChatAgent)",
        items: ["You own the model call", "Custom RAG, multiple models", "You set the stop limit (stopWhen)", "Full control"],
      },
    },
    {
      kind: "analogy",
      role: "Data engineer",
      audience: "concept",
      text: "Like choosing a managed service over standing up infra yourself: persistence, scaling, and recovery come built in, and you customize by configuration — not by rebuilding the pipeline.",
    },

    { kind: "heading", text: "Option A — Think (opinionated)", id: "think" },
    {
      kind: "prose",
      text: "**Think** (`@cloudflare/think`) wires the loop, persistence, streaming, tools, memory, and sub-agents. You implement `getModel()` — about three lines.",
    },
    {
      kind: "code",
      audience: "code",
      lang: "typescript",
      caption: "A complete Think agent — getModel() is the only required piece",
      code: thinkServer,
    },
    {
      kind: "pills",
      label: "Think ships with:",
      items: ["memory", "streaming", "persistence", "tool-calling", "search", "sub-agents"],
    },

    { kind: "heading", text: "Option B — your own loop (AIChatAgent)", id: "own" },
    {
      kind: "prose",
      text: "**AIChatAgent** handles the WebSocket, persistence, and resume — the model call is yours. Override `onChatMessage`, call `streamText` with your tools, and set `stopWhen`.",
    },
    {
      kind: "code",
      audience: "code",
      lang: "typescript",
      caption: "Your own loop: streamText with tools + a stop condition",
      code: ownLoop,
    },
    {
      kind: "callout",
      tone: "tip",
      audience: "code",
      title: "What's stopWhen?",
      text: "`stopWhen: stepCountIs(5)` means: let the model call tools for up to 5 rounds, then it must give a final answer. It's the safety limit on the loop.",
    },

    { kind: "heading", text: "Which should you pick?", id: "choose" },
    {
      kind: "prose",
      text: "Both extend `Agent` and share one Durable Object base, so you can switch later. **Rule of thumb:** start with Think; drop to AIChatAgent the moment you need to own the model call.",
    },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "harness-least-code" },
    { kind: "quiz", quizId: "when-own-loop" },
  ],

  labs: {},

  agentRuns: {
    loop: {
      id: "loop",
      intro: "",
      model: "GLM-4.7-Flash (Workers AI)",
      tools: [
        { name: "getSales", description: "Returns every sales record." },
        { name: "getSalesByRegion", description: "Returns sales for one region." },
      ],
      examples: [
        "Which product made the most money?",
        "How did the EU region do?",
        "What's our total revenue?",
      ],
    },
  },

  quizzes: {
    "harness-least-code": {
      id: "harness-least-code",
      question: "Which option gives you the full agentic loop with the least code?",
      options: [
        "AIChatAgent — you write onChatMessage and streamText",
        "Think — you implement getModel() and the loop is built in",
        "A plain Worker fetch handler",
        "Neither; you must hand-write the loop",
      ],
      answerIndex: 1,
      explanation:
        "Think is the opinionated harness: a ~3-line subclass with getModel() gets you the agentic loop, persistence, streaming, and tools. AIChatAgent is more code because you own the model call; a plain Worker has no loop at all.",
    },
    "when-own-loop": {
      id: "when-own-loop",
      question: "When is your own loop (AIChatAgent) the better choice over Think?",
      options: [
        "When you want the most features with the least setup",
        "When you need full control of the LLM call — RAG, multiple models, custom streaming",
        "When you don't want to use a model",
        "When you need built-in conversation search and memory",
      ],
      answerIndex: 1,
      explanation:
        "AIChatAgent hands you the LLM call so you can do custom RAG, swap models, or shape streaming yourself — and returns a plain Response for middleware/testing. If you mainly want features-with-less-setup (memory, search, compaction), that's Think's territory.",
    },
  },

  recap: [
    "Production agents use a harness or the AI SDK's loop — you rarely hand-write the iteration.",
    "Think is opinionated: getModel() and the loop, memory, and streaming are wired for you.",
    "AIChatAgent hands you the model call (streamText + stopWhen) for full control; both share one Durable Object base.",
  ],

  status: "published",
};
