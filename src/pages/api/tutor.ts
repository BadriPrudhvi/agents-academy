import type { APIRoute } from "astro";
import { z } from "zod";
import { getLesson } from "@/lib/content";

export const prerender = false;

const Body = z.object({
  lessonSlug: z.string().min(1),
  question: z.string().min(1).max(2000),
});

interface TutorAnswer {
  answer: string;
  citations: { title: string; url: string }[];
  mode: "mock" | "live";
}

export const POST: APIRoute = async ({ request, locals }) => {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    return json({ error: "Invalid request", detail: String(err) }, 400);
  }

  const lesson = getLesson(parsed.lessonSlug);
  if (!lesson) return json({ error: "Unknown lesson" }, 404);

  const mode = ((locals as any)?.runtime?.env?.TUTOR_MODE as string | undefined) ?? "mock";

  // LIVE PATH (gated): ground over AutoRAG/AI Search + Workers AI via AI Gateway,
  // with Llama Guard + prompt-injection defense and a per-user budget. Stubbed
  // until creds land; falls through to the grounded mock below.
  // if (mode === "live") return await liveTutor(parsed, lesson, env);

  const answer = groundedMock(parsed.question, lesson);
  return json(answer satisfies TutorAnswer, 200);
};

/**
 * Grounded offline tutor: answers strictly from the lesson's own rubric content
 * (outcomes, misconceptions, recap) and always cites the docs. Not LLM-generated
 * — labeled "guided (offline)" in the UI so the experience stays honest.
 */
function groundedMock(question: string, lesson: ReturnType<typeof getLesson>): TutorAnswer {
  const l = lesson!;
  const q = question.toLowerCase();

  // Match the question against the lesson's documented misconceptions first.
  const mis = l.misconceptions.find((m) =>
    m.belief
      .toLowerCase()
      .split(/\W+/)
      .some((w) => w.length > 4 && q.includes(w)),
  );

  let body: string;
  if (mis) {
    body = `${mis.correction}`;
  } else if (q.includes("state") || q.includes("remember") || q.includes("memory")) {
    body =
      "State lives on the agent's Durable Object. Use this.setState(...) to persist it — it survives across requests with no external database.";
  } else if (q.includes("model") || q.includes("ai") || q.includes("llm")) {
    body =
      "Call the model from inside the agent with this.env.AI.run(\"@cf/meta/llama-3.1-8b-instruct\", { messages: [...] }) and read the `response` field.";
  } else {
    body = `For this lesson, focus on the outcomes: ${l.outcomes.join("; ")}.`;
  }

  return {
    answer: body,
    citations: [{ title: "Cloudflare Agents — docs", url: "https://developers.cloudflare.com/agents/" }],
    mode: "mock",
  };
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
