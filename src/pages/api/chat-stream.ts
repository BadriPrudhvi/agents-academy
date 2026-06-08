import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";
import { json } from "@/lib/api/http";
import { getEnv, parseBody } from "@/lib/api/context";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1),
  chatId: z.string().min(1),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(2000) }))
    .min(1)
    .max(16),
});

/**
 * Live token streaming from Workers AI. We pass `stream: true`, which returns an
 * SSE ReadableStream of `data: {"response":"..."}` chunks, and forward it
 * straight to the browser so the lesson can show tokens arriving in real time.
 *
 * This demonstrates the *feel* of streaming. In production, AIChatAgent does the
 * same over a WebSocket with SQLite persistence and resume — the lesson says so.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const parsed = await parseBody(request, Body);
  if (parsed instanceof Response) return parsed;

  const lesson = getLesson(parsed.lessonSlug);
  const chat = lesson?.streamChats?.[parsed.chatId];
  if (!lesson || !chat) return json({ error: "Unknown chat" }, 404);

  const env = getEnv(locals);
  if (!env?.AI) return json({ error: "The live chat runs in the deployed environment." }, 503);

  const messages = [
    { role: "system", content: chat.system },
    ...parsed.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const stream = (await env.AI.run(chat.modelId, {
      messages,
      stream: true,
      max_tokens: 512,
    })) as ReadableStream;

    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  } catch (err) {
    // Non-2xx so the client treats it as an error, not an SSE stream.
    return json({ error: `Chat failed: ${String(err)}` }, 500);
  }
};
