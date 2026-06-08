import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";
import { json } from "@/lib/api/http";
import { getEnv, parseBody } from "@/lib/api/context";
import type { AgentStep as Step } from "@/lib/content/agent-trace";

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

// OpenAI-style tool definitions. Two tools — so the model has a REAL choice to
// make (the "decide" step), and so we can show the arguments it picks.
const TOOLS = [
  {
    type: "function",
    function: {
      name: "getSales",
      description:
        "Returns EVERY sales record across all regions. Each record has product (string), region (string), and revenue (number, USD). Use this for totals, per-product questions, or comparing regions.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getSalesByRegion",
      description:
        "Returns sales records for ONE region only. Use this when the question is about a single named region (e.g. 'how did EU do?').",
      parameters: {
        type: "object",
        properties: {
          region: { type: "string", enum: ["NA", "EU"], description: "Region code to filter by." },
        },
        required: ["region"],
      },
    },
  },
];

function runTool(name: string, args: any): unknown {
  if (name === "getSales") return SALES;
  if (name === "getSalesByRegion") {
    const region = String(args?.region ?? "").toUpperCase();
    return SALES.filter((r) => r.region === region);
  }
  return { error: `unknown tool: ${name}` };
}

/** Human, present-tense "why" line for the decide step when the model is terse. */
function rationale(calls: any[]): string {
  const parts = calls.map((c) => {
    const name = c?.function?.name ?? "a tool";
    const args = safeParse(c?.function?.arguments) as any;
    if (name === "getSalesByRegion" && args?.region) return `getSalesByRegion for ${args.region}`;
    return name;
  });
  return `This needs real figures, so I'll call ${parts.join(" and ")} instead of guessing.`;
}

function safeParse(s: unknown): unknown {
  if (typeof s !== "string") return s ?? {};
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const parsed = await parseBody(request, Body);
  if (parsed instanceof Response) return parsed;

  const lesson = getLesson(parsed.lessonSlug);
  const run = lesson?.agentRuns?.[parsed.runId];
  if (!lesson || !run) return json({ error: "Unknown agent run" }, 404);

  const env = getEnv(locals);
  if (!env?.AI) return json({ error: "The live agent runs in the deployed environment." }, 503);

  const messages: any[] = [
    {
      role: "system",
      content:
        "You are a data agent with two tools: getSales (every record) and getSalesByRegion (one region). Pick the tool that best fits the question and call it to fetch real figures before answering — never guess numbers. Once you have the data, compute the result and reply in one short sentence with the exact figure.",
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

      if (!calls.length) {
        answer = msg.content?.trim() || "(no answer produced)";
        trace.push({ type: "answer", text: answer });
        break;
      }

      // DECIDE: always surface the model's choice — use its own words when it
      // gave any, otherwise a synthesized "why" naming the tool(s) it picked.
      trace.push({ type: "think", text: msg.content?.trim() || rationale(calls) });

      // ACT + OBSERVE: record the tool call (with chosen args), execute it for
      // real, then show what came back so the learner sees grounded data.
      messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
      for (let ci = 0; ci < calls.length; ci++) {
        const c = calls[ci];
        const name = c?.function?.name ?? "unknown";
        const args = safeParse(c?.function?.arguments);
        const result = runTool(name, args);
        trace.push({ type: "tool", name, args });
        trace.push({
          type: "observe",
          text: Array.isArray(result)
            ? `${result.length} record${result.length === 1 ? "" : "s"} returned`
            : JSON.stringify(result).slice(0, 120),
          data: Array.isArray(result) ? result.slice(0, 8) : result,
        });
        // Unique id so multiple same-tool calls still match their assistant turn.
        messages.push({ role: "tool", tool_call_id: c?.id ?? `${name}-${ci}`, content: JSON.stringify(result) });
      }

      if (step === MAX_STEPS - 1) {
        // Force a final answer. Keep `tools` present — some backends reject a
        // tool-history turn when the tool list is omitted.
        const final = (await env.AI.run(MODEL, { messages, tools: TOOLS, tool_choice: "none" })) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        answer = final?.choices?.[0]?.message?.content?.trim() || "(no answer produced)";
        trace.push({ type: "answer", text: answer });
      }
    }

    return json({ trace, answer, model: run.model }, 200);
  } catch (err) {
    // Return whatever trace we gathered so the learner still sees the loop,
    // plus the error — never discard a partial run.
    if (trace.length > 1) return json({ trace, answer, model: run.model, error: String(err) }, 200);
    return json({ error: `Agent run failed: ${String(err)}` }, 200);
  }
};
