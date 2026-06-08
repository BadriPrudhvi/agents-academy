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

/** A node in a horizontal node-graph diagram (Cloudflare marketing-site style):
 *  a colour-coded box with a label above, an icon inside, and corner handles. */
export interface DiagramNode {
  id: string;
  label: string;
  /** Colour role → token (see NODE_TONE). */
  tone?: "user" | "agent" | "model" | "tool" | "state" | "output";
  /** Top-left position in the diagram's coordinate space. */
  x: number;
  y: number;
  /** Icon name drawn inside the box (see ICONS in NodeGraph). */
  icon?: string;
}

/** A dashed connector between two nodes. */
export interface DiagramEdge {
  from: string;
  to: string;
  /** Optional label drawn at the connector's midpoint. */
  label?: string;
  /** Signed arc magnitude for a curved feedback/loop edge (0 = straight). */
  curve?: number;
}

/** A unit of lesson body. Rendered by the article page block-by-block. */
export type Block = ({ audience?: Audience }) & (
  | { kind: "prose"; text: string }
  | { kind: "heading"; text: string; id?: string }
  | { kind: "code"; lang: string; code: string; caption?: string }
  | { kind: "callout"; tone: "note" | "tip" | "warning"; title?: string; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  | { kind: "diagram"; title?: string; caption?: string; nodes: DiagramNode[]; edges: DiagramEdge[] } // horizontal node-graph
  | { kind: "analogy"; role: string; text: string } // role-tailored framing
  | { kind: "watch"; labId: string; caption?: string } // no-code "see it run" (runs the solution)
  | { kind: "agentStudio"; studioId: string } // unified: build + edit + AI codegen + run for real
  | { kind: "agentRun"; runId: string } // a REAL agent loop: model decides -> tool -> observe -> answer
  | { kind: "streamChat"; chatId: string } // a live chat that streams tokens from Workers AI
  | { kind: "codelab"; labId: string } // anchors the interactive island
  | { kind: "quiz"; quizId: string }
);

/* ── Agent Studio: unified build + edit + AI-write + run-for-real interactive ── */

/** A capability button: clicking inserts this code into the editor. */
export interface AgentStudioCapability {
  id: string;
  label: string;
  plain: string;
  /** Code snippet appended to the editor when added. */
  insert: string;
}

/** A preset goal: selecting it loads a complete runnable program. */
export interface AgentStudioGoal {
  id: string;
  label: string;
  /** Full runnable program (export default async function). */
  program: string;
  /** Illustrative ungrounded chatbot answer, for the contrast panel. */
  chatbotGuess?: string;
}

export interface AgentStudio {
  id: string;
  title: string;
  intro: string;
  /** Display name of the tool surface, e.g. "codemode.listSales()". */
  toolName: string;
  /** Human description of available tools — fed to the AI codegen prompt. */
  toolCatalog: string;
  /** The data the tool returns — shown so the learner sees what the agent reads. */
  toolPreview: { columns: string[]; rows: (string | number)[][] };
  /** Program seeded into the editor on first load. */
  starterProgram: string;
  capabilities: AgentStudioCapability[];
  goals: AgentStudioGoal[];
  /** Enable the natural-language "ask the AI to write code" box. */
  aiEnabled?: boolean;
}

/* ── Agent Run: a real model+tools loop the learner drives in plain English ── */
export interface AgentRun {
  id: string;
  intro: string;
  /** The model that powers the agent (display only). */
  model: string;
  /** Tools the agent can choose to call (display only; execution is server-side). */
  tools: { name: string; description: string }[];
  /** Example goals the learner can click to try. */
  examples: string[];
}

/* ── Stream Chat: a live, no-code chat that streams tokens from Workers AI ── */
export interface StreamChat {
  id: string;
  intro: string;
  /** Display name of the model (shown to the learner). */
  model: string;
  /** Workers AI model id used server-side (authored, trusted). */
  modelId: string;
  /** System prompt that frames the assistant. */
  system: string;
  /** Example prompts the learner can click to try. */
  examples: string[];
}

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
  studios?: Record<string, AgentStudio>;
  agentRuns?: Record<string, AgentRun>;
  streamChats?: Record<string, StreamChat>;

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
