import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1).max(200),
  helpful: z.boolean(),
  role: z.string().max(50).optional(),
  note: z.string().max(1000).optional(),
});

/**
 * Lesson feedback ("was this helpful?"). Writes to Analytics Engine when bound,
 * else logs (visible in `wrangler tail`). Swap-point: persist to D1 for trends.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  let body;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request", detail: String(err) }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const env = (locals as any)?.runtime?.env;
  try {
    if (env?.FEEDBACK) {
      env.FEEDBACK.writeDataPoint({
        blobs: [body.lessonSlug, body.role ?? "unknown", body.note ?? ""],
        doubles: [body.helpful ? 1 : 0],
        indexes: [body.lessonSlug],
      });
    } else {
      console.log("[feedback]", JSON.stringify(body));
    }
  } catch (err) {
    console.error("[feedback] failed:", err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
