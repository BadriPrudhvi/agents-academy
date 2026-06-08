import type { Lesson } from "../types";

/* ============================================================================
 * Track: first-agent · Lesson 2 — put a streaming chat UI on your agent.
 *
 * Grounded in the current Agents docs: @cloudflare/ai-chat's AIChatAgent +
 * onChatMessage + AI SDK streamText (via workers-ai-provider), client useAgent
 * + useAgentChat over a WebSocket, messages persisted in Durable Object SQLite.
 * ========================================================================== */

const wranglerChat = `{
  "name": "streaming-chat",
  "main": "src/index.ts",
  "compatibility_date": "2026-06-08",
  "compatibility_flags": ["nodejs_compat"],
  "ai": { "binding": "AI" },
  "durable_objects": {
    "bindings": [{ "name": "ChatAgent", "class_name": "ChatAgent" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["ChatAgent"] }]
}`;

const serverChat = `import { AIChatAgent } from "@cloudflare/ai-chat";
import { createWorkersAI } from "workers-ai-provider";
import { streamText, convertToModelMessages } from "ai";
import { routeAgentRequest } from "agents";

// AIChatAgent persists messages, owns the WebSocket, and handles resume.
// You override one method and return a streaming Response.
// (Env is generated for you by \`wrangler types\`.)
export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const workersai = createWorkersAI({ binding: this.env.AI });

    const result = streamText({
      model: workersai("@cf/zai-org/glm-4.7-flash"),
      system: "You are a helpful assistant.",
      messages: await convertToModelMessages(this.messages),
    });

    return result.toUIMessageStreamResponse();
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (await routeAgentRequest(request, env)) ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;`;

const clientChat = `import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";

function Chat() {
  const agent = useAgent({ agent: "ChatAgent" });
  const { messages, sendMessage, status } = useAgentChat({ agent });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}: </strong>
          {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem("input") as HTMLInputElement;
          sendMessage({ text: input.value });
          input.value = "";
        }}
      >
        <input name="input" placeholder="Send a message..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}`;

export const streamingChat: Lesson = {
  slug: "streaming-chat",
  trackId: "first-agent",
  order: 2,
  title: "Stream responses to a chat UI",
  summary:
    "Put a live chat UI on your agent: tokens stream in as they're generated, messages persist, and the connection resumes if it drops.",
  bigIdea: "Stream tokens as they're generated — chat should feel **alive**, not frozen.",

  outcomes: [
    "Explain why agents stream tokens instead of waiting for the full reply.",
    "Stream a model response from an AIChatAgent with streamText.",
    "Connect a React chat UI to the agent with useAgentChat.",
  ],
  prerequisites: ["your-first-agent"],
  whyItMatters:
    "Chat is how most people first meet an agent, and waiting ten seconds for a wall of text feels broken. Streaming makes the agent feel alive — and the Agents SDK gives you persistence, multi-client sync, and resume-on-reconnect for free, so you focus on the conversation, not the plumbing.",
  timeEstimateMin: 12,
  competencies: ["streaming", "ai-chat-agent", "websocket-ui"],
  misconceptions: [
    {
      belief: "Streaming needs special server infrastructure (SSE servers, queues).",
      correction:
        "`AIChatAgent` runs on a Durable Object and streams over a WebSocket out of the box. You return a streaming `Response` from `streamText`; the SDK handles transport, buffering, and resume.",
    },
    {
      belief: "I need a database to keep the chat history.",
      correction:
        "Each agent instance has embedded SQLite. `AIChatAgent` persists every message automatically and even buffers the in-flight stream, so a reconnecting client resumes mid-answer.",
    },
  ],

  blocks: [
    { kind: "heading", text: "Why stream?", id: "why" },
    {
      kind: "prose",
      text: "Models generate one token at a time. Wait for the whole answer and a long reply feels frozen; stream each piece and words appear as the model types.",
    },
    {
      kind: "compare",
      left: {
        title: "Wait for the full reply",
        items: ["Long pause — looks frozen", "User stares at a spinner"],
      },
      right: {
        title: "Stream token by token",
        items: ["Words appear as generated", "Feels alive — read as it comes"],
      },
    },
    {
      kind: "diagram",
      title: "How a streamed chat turn flows",
      nodes: [
        { id: "send", label: "You send", tone: "user", icon: "message", x: 0, y: 80 },
        { id: "agent", label: "AIChatAgent", tone: "model", icon: "agent", x: 230, y: 80 },
        { id: "stream", label: "streamText", tone: "tool", icon: "code", x: 460, y: 80 },
        { id: "chunks", label: "Chunks back", tone: "output", icon: "sparkle", x: 690, y: 80 },
        { id: "done", label: "Done", tone: "model", icon: "chat", x: 920, y: 80 },
      ],
      edges: [
        { from: "send", to: "agent" },
        { from: "agent", to: "stream" },
        { from: "stream", to: "chunks" },
        { from: "chunks", to: "done" },
        { from: "chunks", to: "stream", label: "more tokens? stream on", curve: 110 },
      ],
    },
    { kind: "statement", text: "AIChatAgent gives you the hard parts **for free**.", sub: "WebSocket · persistence · resume · multi-client — you write one method" },
    {
      kind: "analogy",
      role: "Data analyst",
      audience: "concept",
      text: "Like a live cell that fills in as the calculation runs, instead of a report that pops up all at once after a long wait — you start reading immediately.",
    },

    { kind: "heading", text: "Try it: watch tokens stream", id: "try", audience: "concept" },
    {
      kind: "prose",
      audience: "concept",
      text: "Send a message and watch the reply appear **word by word** — each token the moment the model produces it.",
    },
    { kind: "streamChat", chatId: "chat", audience: "concept" },
    {
      kind: "prose",
      audience: "concept",
      text: "Switch to **Code** to see the (surprisingly small) server and client.",
    },

    // ── Code view ──
    { kind: "heading", text: "The server: one method", id: "server", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "Extend `AIChatAgent` and override `onChatMessage`. It looks like a lot of imports, but each one does just one job:",
    },
    {
      kind: "list",
      audience: "code",
      items: [
        "**AIChatAgent** — the base class that owns the WebSocket, saves messages, and resumes streams for you.",
        "**createWorkersAI** — points the AI SDK at your Workers AI binding.",
        "**streamText** — calls the model and hands back a stream of tokens.",
        "**routeAgentRequest** — sends each incoming request to the right agent instance.",
      ],
    },
    {
      kind: "prose",
      audience: "code",
      text: "Build a model, call `streamText`, return `result.toUIMessageStreamResponse()`. `this.messages` is the persisted history — already there.",
    },
    {
      kind: "code",
      audience: "code",
      lang: "typescript",
      caption: "src/index.ts — a streaming chat agent + the routeAgentRequest entry",
      code: serverChat,
    },
    {
      kind: "code",
      audience: "code",
      lang: "jsonc",
      caption: "wrangler.jsonc — AI binding + the agent's Durable Object",
      code: wranglerChat,
    },

    { kind: "heading", text: "The client: one hook", id: "client", audience: "code" },
    {
      kind: "prose",
      audience: "code",
      text: "On the frontend, `useAgent` opens the WebSocket and `useAgentChat` gives you `messages` and `sendMessage`. Render `message.parts` and you have a live, streaming chat — no transport code to write.",
    },
    {
      kind: "code",
      audience: "code",
      lang: "typescript",
      caption: "Chat.tsx — a minimal streaming chat UI",
      code: clientChat,
    },
    {
      kind: "callout",
      tone: "tip",
      audience: "code",
      title: "Install",
      text: "npm install @cloudflare/ai-chat agents ai workers-ai-provider — the chat agent, the Agents runtime, the AI SDK, and the Workers AI model provider.",
    },

    { kind: "heading", text: "Check your understanding", id: "check" },
    { kind: "quiz", quizId: "why-stream" },
    { kind: "quiz", quizId: "who-handles-transport" },
  ],

  labs: {},

  streamChats: {
    chat: {
      id: "chat",
      intro: "",
      model: "Llama 3.3 70B (Workers AI)",
      modelId: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      system: "You are a friendly, concise assistant for a course on building AI agents. Reply in 2–4 short sentences.",
      examples: [
        "Explain token streaming like I'm five.",
        "Write a haiku about the edge.",
        "Why use a WebSocket for chat?",
      ],
    },
  },

  quizzes: {
    "why-stream": {
      id: "why-stream",
      question: "Why stream a model's response instead of returning it all at once?",
      options: [
        "It makes the model generate text faster",
        "Tokens appear as they're generated, so the reply feels responsive",
        "It avoids needing a model at all",
        "It's the only way to call Workers AI",
      ],
      answerIndex: 1,
      explanation:
        "Streaming doesn't speed up generation — it surfaces each token as it's produced, so the user sees progress immediately instead of waiting for the whole reply. The model and total time are the same; the experience is far better.",
    },
    "who-handles-transport": {
      id: "who-handles-transport",
      question: "With AIChatAgent, who handles the WebSocket, persistence, and resume?",
      options: [
        "You wire up an SSE server and a database yourself",
        "AIChatAgent does — you just override onChatMessage",
        "The browser handles all of it",
        "A separate queue service you must deploy",
      ],
      answerIndex: 1,
      explanation:
        "AIChatAgent runs on a Durable Object: it owns the WebSocket, persists messages to embedded SQLite, buffers the in-flight stream for resume, and broadcasts to other clients. You only write the model call inside onChatMessage.",
    },
  },

  recap: [
    "Streaming sends tokens as they're generated, so chat feels alive.",
    "An AIChatAgent streams from `onChatMessage` with `streamText` — persistence and resume are built in.",
    "`useAgent` + `useAgentChat` connect a React UI over a WebSocket with no transport code.",
  ],
  next: { slug: "agent-harness", label: "Project Think vs. your own loop" },

  status: "published",
};
