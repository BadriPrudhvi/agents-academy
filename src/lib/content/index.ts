import type { Lesson } from "./types";
import { TRACKS, getTrack } from "./tracks";
import { yourFirstAgent } from "./lessons/your-first-agent";
import { agentsWriteCode } from "./lessons/agents-write-code";
import { firstDataAgent } from "./lessons/first-data-agent";
import { financeReconciliation } from "./lessons/finance-reconciliation";

export type { Lesson, Track } from "./types";
export { TRACKS, getTrack };

/** Fully authored, runnable lessons. */
const LESSONS: Lesson[] = [yourFirstAgent, agentsWriteCode, firstDataAgent, financeReconciliation];

/** Lightweight card for the hub (authored lessons + "coming soon" placeholders). */
export interface LessonCard {
  trackId: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  timeEstimateMin?: number;
  available: boolean;
}

/** Outline of the rest of the curriculum, shown as locked cards on the hub. */
const COMING_SOON: Omit<LessonCard, "available">[] = [
  { trackId: "foundations", slug: "what-is-an-agent", order: 1, title: "What is an agent?", summary: "Generative vs. agentic, and the Workers edge model." },
  { trackId: "foundations", slug: "first-worker", order: 2, title: "Your first Worker", summary: "Wrangler, bindings, and a live deploy." },
  { trackId: "first-agent", slug: "streaming-chat", order: 2, title: "Stream responses to a chat UI", summary: "WebSockets, useAgent, and token streaming." },
  { trackId: "first-agent", slug: "agent-harness", order: 3, title: "Project Think vs. your own loop", summary: "Opinionated harness or build the loop yourself." },
  { trackId: "tools", slug: "tool-calling", order: 3, title: "Tool calling basics", summary: "Give your agent typed tools with zod." },
  { trackId: "memory", slug: "vectorize-rag", order: 1, title: "Ground answers with Vectorize", summary: "Embeddings, retrieval, and citations." },
  { trackId: "durability", slug: "workflows", order: 1, title: "Durable execution with Workflows", summary: "Steps, retries, and recovery." },
];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

/** All authored lessons — used by tooling (content linter). */
export function allLessons(): Lesson[] {
  return LESSONS;
}

export function lessonsForTrack(trackId: string): LessonCard[] {
  const authored: LessonCard[] = LESSONS.filter((l) => l.trackId === trackId).map((l) => ({
    trackId: l.trackId,
    slug: l.slug,
    order: l.order,
    title: l.title,
    summary: l.summary,
    timeEstimateMin: l.timeEstimateMin,
    available: true,
  }));
  const soon: LessonCard[] = COMING_SOON.filter((c) => c.trackId === trackId).map((c) => ({
    ...c,
    available: false,
  }));
  return [...authored, ...soon].sort((a, b) => a.order - b.order);
}

/** Total authored + planned lessons, for hub stats. */
export function curriculumStats() {
  return {
    tracks: TRACKS.length,
    authored: LESSONS.length,
    planned: COMING_SOON.length + LESSONS.length,
  };
}
