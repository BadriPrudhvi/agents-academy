import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";
import { getRunner } from "@/lib/runner";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1),
  simId: z.string().min(1),
  goalId: z.string().min(1),
});

/**
 * Agent Playground execution. The program for each goal is authored server-side
 * (never sent by the client), so this only ever runs trusted, curated code.
 *
 * - RUNNER_MODE=sandbox + RUNNER binding -> executes the goal program for real
 *   in the container and returns the real answer.
 * - otherwise (local/mock) -> returns the authored expectedAnswer (same value).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    return json({ error: "Invalid request", detail: String(err) }, 400);
  }

  const lesson = getLesson(parsed.lessonSlug);
  const sim = lesson?.sims?.[parsed.simId];
  const goal = sim?.goals.find((g) => g.id === parsed.goalId);
  if (!lesson || !sim || !goal) return json({ error: "Unknown sim or goal" }, 404);

  const env = (locals as any)?.runtime?.env;
  const mode = env?.RUNNER_MODE as string | undefined;

  if (mode === "sandbox" && env?.RUNNER) {
    try {
      const runner = getRunner(mode, env.RUNNER);
      const result = await runner.run(
        {
          lessonSlug: parsed.lessonSlug,
          labId: `${sim.id}:${goal.id}`,
          action: "run",
          files: [{ path: "task.js", contents: goal.program }],
        },
        { language: "javascript", runCmd: "node task.js", files: [], checks: [] },
      );
      const out = result.run.output?.trim();
      if (result.run.ok && out) {
        return json({ answer: out, engine: result.run.engine }, 200);
      }
    } catch (err) {
      console.error("[playground] sandbox run failed, using expectedAnswer:", err);
    }
  }

  return json({ answer: goal.expectedAnswer, engine: "mock" }, 200);
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
