import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";
import { deniedJs, stripFences } from "@/lib/guard";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1),
  studioId: z.string().min(1),
  request: z.string().min(1).max(1000),
  currentCode: z.string().max(20_000).optional(),
});

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

/**
 * Natural-language -> code for the Agent Studio. Constrained to the studio's
 * curated codemode.* tools, no network/imports/secrets, must return a single
 * runnable ES module. Output is validated against the same denylist before it
 * reaches the editor.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    return json({ error: "Invalid request", detail: String(err) }, 400);
  }

  const lesson = getLesson(parsed.lessonSlug);
  const studio = lesson?.studios?.[parsed.studioId];
  if (!lesson || !studio) return json({ error: "Unknown studio" }, 404);

  const env = (locals as any)?.runtime?.env;
  if (!env?.AI) {
    return json({ error: "AI code generation is available in the deployed environment." }, 503);
  }

  const system = [
    "You write a SINGLE JavaScript ES module for a teaching sandbox.",
    "Rules you MUST follow:",
    "- Export exactly one default async function: `export default async function () { ... }`.",
    "- You may ONLY read data through these provided tools (already global, no import):",
    studio.toolCatalog,
    "- Use console.log(...) to show results.",
    "- DO NOT use fetch, import(), require, process, globalThis, eval, Function, WebSocket, or the network/filesystem.",
    "- Output ONLY the code. No prose, no markdown fences.",
  ].join("\n");

  const userMsg = [
    parsed.currentCode ? `Current code:\n${parsed.currentCode}\n` : "",
    `Request: ${parsed.request}`,
  ].join("\n");

  try {
    const result = (await env.AI.run(MODEL, {
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      max_tokens: 600,
      temperature: 0.2,
    })) as { response?: string };

    const code = stripFences(result.response ?? "");
    if (!code) return json({ error: "The AI did not return any code. Try rephrasing." }, 200);

    const blocked = deniedJs(code);
    if (blocked) {
      return json({ error: `The generated code was rejected for safety (${blocked}). Try a simpler request.` }, 200);
    }
    if (!/export\s+default\s+async\s+function/.test(code)) {
      return json({ error: "The AI produced code in an unexpected shape. Try rephrasing your request." }, 200);
    }

    return json({ code }, 200);
  } catch (err) {
    return json({ error: `Code generation failed: ${String(err)}` }, 200);
  }
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
