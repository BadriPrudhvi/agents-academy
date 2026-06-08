import { describe, it, expect } from "vitest";
import { z } from "zod";
import { json } from "@/lib/api/http";
import { getEnv, parseBody } from "@/lib/api/context";

describe("api/http json", () => {
  it("defaults to 200 with JSON content-type and serialized body", async () => {
    const res = json({ ok: true });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("honors an explicit status code", () => {
    expect(json({ error: "x" }, 404).status).toBe(404);
    expect(json({ error: "x" }, 503).status).toBe(503);
  });
});

describe("api/context getEnv", () => {
  it("reads locals.runtime.env", () => {
    const env = { AI: {} };
    expect(getEnv({ runtime: { env } })).toBe(env);
  });

  it("is undefined-safe for missing runtime/locals", () => {
    expect(getEnv(undefined)).toBeUndefined();
    expect(getEnv({})).toBeUndefined();
    expect(getEnv({ runtime: {} })).toBeUndefined();
  });
});

describe("api/context parseBody", () => {
  const Body = z.object({ lessonSlug: z.string().min(1) });
  const req = (value: unknown) => ({ json: async () => value }) as unknown as Request;

  it("returns the parsed value on success", async () => {
    const out = await parseBody(req({ lessonSlug: "x" }), Body);
    expect(out).toEqual({ lessonSlug: "x" });
  });

  it("returns a 400 Response with {error,detail} on a schema failure", async () => {
    const out = await parseBody(req({}), Body);
    expect(out).toBeInstanceOf(Response);
    const res = out as Response;
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; detail: string };
    expect(body.error).toBe("Invalid request");
    expect(typeof body.detail).toBe("string");
  });

  it("returns a 400 Response when the body is not JSON", async () => {
    const bad = { json: async () => { throw new SyntaxError("bad json"); } } as unknown as Request;
    const out = await parseBody(bad, Body);
    expect(out).toBeInstanceOf(Response);
    expect((out as Response).status).toBe(400);
  });
});
