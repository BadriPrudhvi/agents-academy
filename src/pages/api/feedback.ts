import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api/http";
import { getEnv, parseBody } from "@/lib/api/context";

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
  const body = await parseBody(request, Body);
  if (body instanceof Response) return body;

  const env = getEnv(locals);
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

  return json({ ok: true }, 200);
};
