import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";
import { getRunner } from "@/lib/runner";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1),
  labId: z.string().min(1),
  action: z.enum(["run", "check", "demo"]),
  // For "demo" the server runs the reference solution, so files are optional.
  files: z
    .array(z.object({ path: z.string(), contents: z.string().max(50_000) }))
    .max(20)
    .optional(),
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

  // "demo" runs the reference solution server-side (no learner code needed).
  let files = parsed.files ?? [];
  let action = parsed.action;
  if (action === "demo") {
    const editable = lab.files.find((f) => !f.readOnly) ?? lab.files[0];
    files = lab.files.map((f) =>
      f.path === editable.path
        ? { path: f.path, contents: lab.challenge.solutionHint }
        : { path: f.path, contents: f.contents },
    );
    action = "run"; // execute, no grading
  } else if (files.length === 0) {
    return json({ error: "files required" }, 400);
  }

  const result = await runner.run(
    { lessonSlug: parsed.lessonSlug, labId: parsed.labId, action, files },
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
