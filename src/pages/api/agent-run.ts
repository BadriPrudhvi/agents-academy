import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1),
  runId: z.string().min(1),
  goal: z.string().min(1).max(400),
});

// GLM-4.7-Flash: OpenAI-compatible function calling, supports tool_choice
// "required" (so the agent reliably calls a tool) — used in Cloudflare's own
// Agents examples. Swap here to change the agent's "brain".
const MODEL = "@cf/zai-org/glm-4.7-flash";
const MAX_STEPS = 4;

// The agent's tools (server-executed on real data — no network access).
const SALES = [
  { product: "Widget A", region: "NA", revenue: 25000 },
  { product: "Widget A", region: "EU", revenue: 17000 },
  { product: "Gadget B", region: "NA", revenue: 30000 },
  { product: "Sprocket C", region: "EU", revenue: 12000 },
];

// OpenAI-style tool definitions.
const TOOLS = [
  {
    type: "function",
    function: {
      name: "getSales",
      description:
        "Returns every sales record. Each record has product (string), region (string), and revenue (number, USD). Call this to get real figures before answering.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

function runTool(name: string): unknown {
  if (name === "getSales") return SALES;
  return { error: `unknown tool: ${name}` };
}

function safeParse(s: unknown): unknown {
  if (typeof s !== "string") return s ?? {};
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

type Step =
  | { type: "goal"; text: string }
  | { type: "think"; text: string }
  | { type: "tool"; name: string; args: unknown; result: string }
  | { type: "answer"; text: string };

export const POST: APIRoute = async ({ request, locals }) => {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    return json({ error: "Invalid request", detail: String(err) }, 400);
  }

  const lesson = getLesson(parsed.lessonSlug);
  const run = lesson?.agentRuns?.[parsed.runId];
  if (!lesson || !run) return json({ error: "Unknown agent run" }, 404);

  const env = (locals as any)?.runtime?.env;
  if (!env?.AI) return json({ error: "The live agent runs in the deployed environment." }, 503);

  const messages: any[] = [
    {
      role: "system",
      content:
        "You are a data agent. Always call the getSales tool to fetch real figures before answering — never guess numbers. Once you have the data, compute the result and reply in one short sentence with the exact figure.",
    },
    { role: "user", content: parsed.goal },
  ];

  const trace: Step[] = [{ type: "goal", text: parsed.goal }];
  let answer = "";

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const res = (await env.AI.run(MODEL, {
        messages,
        tools: TOOLS,
        // Force a tool call on the first turn so the loop is always demonstrated.
        tool_choice: step === 0 ? "required" : "auto",
      })) as { choices?: Array<{ message?: { content?: string; tool_calls?: any[] } }> };

      const msg = res?.choices?.[0]?.message ?? {};
      const calls = msg.tool_calls ?? [];

      if (msg.content?.trim() && calls.length) {
        trace.push({ type: "think", text: msg.content.trim() });
      }

      if (!calls.length) {
        answer = msg.content?.trim() || "(no answer produced)";
        trace.push({ type: "answer", text: answer });
        break;
      }

      // The model decided to call tools — record + execute them for real.
      messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
      for (const c of calls) {
        const name = c?.function?.name ?? "unknown";
        const result = runTool(name);
        trace.push({
          type: "tool",
          name,
          args: safeParse(c?.function?.arguments),
          result: Array.isArray(result) ? `${result.length} records returned` : JSON.stringify(result).slice(0, 120),
        });
        messages.push({ role: "tool", tool_call_id: c?.id ?? name, content: JSON.stringify(result) });
      }

      if (step === MAX_STEPS - 1) {
        const final = (await env.AI.run(MODEL, { messages, tool_choice: "none" })) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        answer = final?.choices?.[0]?.message?.content?.trim() || "(no answer produced)";
        trace.push({ type: "answer", text: answer });
      }
    }

    return json({ trace, answer, model: run.model }, 200);
  } catch (err) {
    return json({ error: `Agent run failed: ${String(err)}` }, 200);
  }
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
