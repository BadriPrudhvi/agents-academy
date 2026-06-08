import { json } from "./http";

/** The Cloudflare runtime env (bindings) exposed on Astro `locals`. */
export function getEnv(locals: unknown): any {
  return (locals as any)?.runtime?.env;
}

/**
 * Parse + validate a JSON request body against a Zod-like schema. Returns the
 * parsed value, or a 400 Response (identical shape to the previous inline
 * handlers) that the caller should return directly.
 */
export async function parseBody<T>(
  request: Request,
  schema: { parse: (value: unknown) => T },
): Promise<T | Response> {
  try {
    return schema.parse(await request.json());
  } catch (err) {
    return json({ error: "Invalid request", detail: String(err) }, 400);
  }
}
