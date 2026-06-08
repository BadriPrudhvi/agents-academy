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
      text: "You already saw the agent loop — **decide → act → observe → answer**, repeating until done. In real apps you don't write that loop by hand. You either adopt an **opinionated harness** that runs it for you, or wire up the **AI SDK's loop yourself** when you need control. Cloudflare gives you both: **Think** and **AIChatAgent**.",
    },
    {
      kind: "diagram",
      title: "The loop a harness runs for you",
      caption:
        "Think runs this whole loop from a 3-line subclass. With AIChatAgent you wire the same loop yourself via streamText + stopWhen.",
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
      text: "Here's that loop, **live** — the exact decide → act → observe → answer cycle a harness runs for you. Give it a goal and watch it pick a tool, read real data, and answer. Think runs this from a 3-line class; with your own loop you wire the same cycle yourself.",
    },
    { kind: "agentRun", runId: "loop", audience: "concept" },

    { kind: "heading", text: "Option A — Think (opinionated)", id: "think" },
    {
      kind: "prose",
      text: "**Think** (`@cloudflare/think`) is a full chat-agent framework. You provide a model with `getModel()`; it wires the agentic loop, message persistence, streaming, tools, stream resumption, memory, and sub-agents. The minimal agent is about three lines.",
    },
    {
      kind: "code",
      audience: "code",
      lang: "typescript",
      caption: "A complete Think agent — getModel() is the only required piece",
      code: thinkServer,
    },
    {
      kind: "analogy",
      role: "Data engineer",
      audience: "concept",
      text: "Like choosing a managed service over standing up the infra yourself: you get persistence, scaling, and recovery out of the box, and you customize via configuration, not by rebuilding the pipeline.",
    },
    {
      kind: "analogy",
      role: "ML engineer",
      audience: "concept",
      text: "Think is the high-level trainer API; the own-loop path is writing your custom training loop. Reach for the framework first, drop down only where you need bespoke control.",
    },

    { kind: "heading", text: "Option B — your own loop (AIChatAgent)", id: "own" },
    {
      kind: "prose",
      text: "**AIChatAgent** is a protocol adapter: it handles the WebSocket, persistence, and resume, but the model call is yours. You override `onChatMessage`, call `streamText` with your tools, and set `stopWhen` — that's the loop, under your control.",
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
      text: "`stopWhen: stepCountIs(5)` just means: let the model call tools and keep going for up to 5 rounds, then it must give a final answer. It's the safety limit on the loop — exactly the cap you saw earlier.",
    },

    { kind: "heading", text: "Which should you pick?", id: "choose" },
    {
      kind: "prose",
      text: "Both extend `Agent` and speak the same chat protocol, so you can start with one and move later. The split is about how much you want decided for you.",
    },
    {
      kind: "list",
      ordered: false,
      items: [
        "**Reach for Think** when you want to ship fast and get memory, long-conversation handling, search, and helper sub-agents out of the box.",
        "**Reach for your own loop (AIChatAgent)** when you need full control of the model call — your own retrieval, multiple models, or custom streaming.",
        "**Either way, you're not hand-writing the loop:** Think runs it for you; AIChatAgent lets the AI SDK run it via `stopWhen`.",
      ],
    },
    {
      kind: "callout",
      tone: "tip",
      title: "Rule of thumb",
      text: "Start with Think. Drop to AIChatAgent the moment you need to own the model call. Both share the same Durable Object foundation, so switching is cheap.",
    },
    {
      kind: "callout",
      tone: "note",
      title: "Going deeper (later)",
      text: "Think also has features you'll meet once you need them: memory the model can edit, automatic trimming of very long chats, search across past conversations, and spawning helper sub-agents. Don't worry about these yet — `getModel()` is all you need to start.",
    },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "harness-least-code" },
    { kind: "quiz", quizId: "when-own-loop" },
  ],

  labs: {},

  agentRuns: {
    loop: {
      id: "loop",
      intro: "The agentic loop, live: a model with two tools. Think runs this for you; with your own loop you wire it via streamText + stopWhen.",
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
