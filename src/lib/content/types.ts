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
  | { kind: "watch"; labId: string; caption?: string } // no-code "see it run" (runs the solution)
  | { kind: "agentSim"; simId: string } // no-code interactive: drive an agent, watch the loop
  | { kind: "agentBuilder"; builderId: string } // no-code builder: add capabilities one by one
  | { kind: "agentStudio"; studioId: string } // unified: build + edit + AI codegen + run for real
  | { kind: "agentRun"; runId: string } // a REAL agent loop: model decides -> tool -> observe -> answer
  | { kind: "codelab"; labId: string } // anchors the interactive island
  | { kind: "quiz"; quizId: string }
);

/* ── Agent Playground: a no-code interactive that makes the agent loop tangible ── */

export interface AgentSimGoal {
  id: string;
  /** What the learner asks the agent to do. */
  label: string;
  /** Tool the agent calls for this goal (display only). */
  toolName: string;
  /** Server-only JS program (uses codemode.*); executed by the runner. Never sent to the client. */
  program: string;
  /** Scripted "how the agent is thinking" steps (labeled as illustration). */
  steps: string[];
  /** Illustrative ungrounded chatbot answer, for the contrast. */
  chatbotGuess: string;
  /** Known correct answer — shown in mock dev and used as a fallback. */
  expectedAnswer: string;
}

export interface AgentSim {
  id: string;
  /** The tool the agent has access to (display). */
  toolName: string;
  /** The data the tool returns — shown so the learner sees what the agent read. */
  toolPreview: { columns: string[]; rows: (string | number)[][] };
  goals: AgentSimGoal[];
  /** Ask the learner to predict the first step before running (active learning). */
  predict?: boolean;
}

/* ── Agent Builder: click-to-add capabilities and see code + behavior grow ── */
export interface AgentBuilderStep {
  id: string;
  label: string;
  plain: string;
  /** Code snippet unlocked by this step. Displayed as generated code. */
  code: string;
  /** What Run should show after this step is included. */
  output: string;
}

export interface AgentBuilder {
  id: string;
  title: string;
  intro: string;
  steps: AgentBuilderStep[];
}

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
  sims?: Record<string, AgentSim>;
  builders?: Record<string, AgentBuilder>;
  studios?: Record<string, AgentStudio>;
  agentRuns?: Record<string, AgentRun>;

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
