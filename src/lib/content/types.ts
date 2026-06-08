/* ============================================================================
 * Content model — the typed seed layer.
 *
 * Mirrors marketing-site's three-layer CMS pattern (static TS seed -> D1 draft
 * -> KV published). This file is the seed/fallback layer. When the CMS lands,
 * these same shapes are stored in the `learning` collection and published to KV;
 * the renderer is unchanged.
 *
 * The schema is the lesson RUBRIC made executable: every field maps to a part
 * of the instructional design (see docs/lesson-rubric.md).
 * ========================================================================== */

/**
 * Which view a block belongs to. Lessons serve mixed-skill roles by tagging
 * blocks: "concept" (no-code explanation/analogy), "code" (hands-on), or
 * undefined = shown in both. The view toggle filters on this client-side.
 */
export type Audience = "concept" | "code";

/** Simple agent-architecture diagram node/edge (rendered with @xyflow/react). */
export interface DiagramNode {
  id: string;
  label: string;
  /** Visual role -> color token. */
  tone?: "user" | "agent" | "model" | "tool" | "state";
  x: number;
  y: number;
}
export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

/** A unit of lesson body. Rendered by the article page block-by-block. */
export type Block = ({ audience?: Audience }) & (
  | { kind: "prose"; text: string }
  | { kind: "heading"; text: string; id?: string }
  | { kind: "code"; lang: string; code: string; caption?: string }
  | { kind: "callout"; tone: "note" | "tip" | "warning"; title?: string; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  | { kind: "diagram"; title?: string; nodes: DiagramNode[]; edges: DiagramEdge[] }
  | { kind: "analogy"; role: string; text: string } // role-tailored framing
  | { kind: "codelab"; labId: string } // anchors the interactive island
  | { kind: "quiz"; quizId: string }
);

export type CodeLanguage = "typescript" | "javascript" | "python" | "json" | "jsonc" | "toml";

/** A single file in the interactive lab's editor. */
export interface LabFile {
  path: string;
  language: CodeLanguage;
  contents: string;
  /** If true, shown read-only (e.g. wrangler config the learner shouldn't edit). */
  readOnly?: boolean;
}

/** Grading contract: hidden assertions run against the learner's run output. */
export interface GradingCheck {
  id: string;
  /** Human-readable description shown after grading. */
  describe: string;
  /** Substring/regex the run stdout must contain to pass this check. */
  expectStdout?: string;
  /** Source substring the learner's code must contain (static check). */
  expectSource?: { file: string; pattern: string };
}

export interface InteractiveLab {
  id: string;
  /** Files seeded into the editor. */
  files: LabFile[];
  /** Entry command the runner executes (mock interprets a known set). */
  runCmd: string;
  language: "typescript" | "javascript" | "python";
  /** Optional port to expose for a live preview iframe. */
  previewPort?: number;
  /** What "done" looks like for the learner. */
  challenge: {
    prompt: string;
    checks: GradingCheck[];
    /** Reference solution (used by mock runner + revealed on request). */
    solutionHint: string;
  };
}

export interface RetrievalQuiz {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  /** Shown regardless of choice — targets the specific misconception. */
  explanation: string;
}

/** A documented misconception + the correction (drives tutor feedback). */
export interface Misconception {
  belief: string;
  correction: string;
}

export interface Lesson {
  slug: string;
  trackId: string;
  order: number;
  title: string;
  summary: string;

  /* ── Rubric metadata ── */
  outcomes: string[]; // "After this you can…"
  prerequisites: string[]; // lesson slugs or free-text
  whyItMatters: string;
  timeEstimateMin: number;
  competencies: string[]; // skill tags for the mastery map
  misconceptions: Misconception[];

  /* ── Body ── */
  blocks: Block[];
  labs: Record<string, InteractiveLab>;
  quizzes: Record<string, RetrievalQuiz>;

  recap: string[];
  next?: { slug: string; label: string };

  /** Authoring/QA status — gates publish (see Definition of Done). */
  status: "draft" | "in-review" | "published";
}

export interface Track {
  id: string;
  order: number;
  title: string;
  blurb: string;
  /** product-category token suffix for accent color (e.g. "ai", "compute"). */
  accent: "ai" | "compute" | "storage" | "media" | "security" | "sase";
}
