import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";
import { getRunner } from "@/lib/runner";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1),
  labId: z.string().min(1),
  action: z.enum(["run", "check"]),
  files: z
    .array(z.object({ path: z.string(), contents: z.string().max(50_000) }))
    .min(1)
    .max(20),
});

export const POST: APIRoute = async ({ request, locals }) => {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    return json({ error: "Invalid request", detail: String(err) }, 400);
  }

  const lesson = getLesson(parsed.lessonSlug);
  const lab = lesson?.labs[parsed.labId];
  if (!lesson || !lab) {
    return json({ error: "Unknown lesson or lab" }, 404);
  }

  // Hidden checks come from the server-side content, never from the client.
  const env = (locals as any)?.runtime?.env;
  const runner = getRunner(env?.RUNNER_MODE as string | undefined, env?.RUNNER);

  const result = await runner.run(
    { lessonSlug: parsed.lessonSlug, labId: parsed.labId, action: parsed.action, files: parsed.files },
    { language: lab.language, runCmd: lab.runCmd, files: lab.files, checks: lab.challenge.checks },
  );

  return json(result, 200);
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
