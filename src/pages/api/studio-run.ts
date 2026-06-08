import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";
import { getRunner } from "@/lib/runner";
import { deniedJs } from "@/lib/guard";
import { json } from "@/lib/api/http";
import { getEnv, parseBody } from "@/lib/api/context";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1),
  studioId: z.string().min(1),
  code: z.string().min(1).max(20_000),
  sessionId: z.string().max(64).optional(),
});

/**
 * Runs the Agent Studio editor's code for real in the Sandbox. The code is
 * learner/AI authored, so we pre-check it and rely on the runner's hardening
 * (per-session container, exec timeout, denylist).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const parsed = await parseBody(request, Body);
  if (parsed instanceof Response) return parsed;

  const lesson = getLesson(parsed.lessonSlug);
  const studio = lesson?.studios?.[parsed.studioId];
  if (!lesson || !studio) return json({ error: "Unknown studio" }, 404);

  const blocked = deniedJs(parsed.code);
  if (blocked) return json({ ok: false, engine: "sandbox", output: blocked, blocked: true }, 200);

  const env = getEnv(locals);
  const mode = env?.RUNNER_MODE as string | undefined;
  if (mode !== "sandbox" || !env?.RUNNER) {
    return json(
      { ok: false, engine: "mock", output: "Live code execution runs in the deployed Sandbox environment." },
      200,
    );
  }

  try {
    const runner = getRunner(mode, env.RUNNER);
    const result = await runner.run(
      {
        lessonSlug: parsed.lessonSlug,
        labId: `studio:${studio.id}`,
        action: "run",
        files: [{ path: "task.js", contents: parsed.code }],
        sessionId: parsed.sessionId,
      },
      { language: "javascript", runCmd: "node task.js", files: [], checks: [] },
    );
    return json({ ok: result.run.ok, engine: result.run.engine, output: result.run.output }, 200);
  } catch (err) {
    return json({ ok: false, engine: "sandbox", output: String(err) }, 200);
  }
};
