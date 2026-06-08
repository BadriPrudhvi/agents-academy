import type { GradingCheck, LabFile } from "../content/types";

export interface RunRequest {
  lessonSlug: string;
  labId: string;
  files: { path: string; contents: string }[];
  /**
   * "run" executes the learner's files; "check" runs + grades; "demo" runs the
   * reference solution server-side (no code required — powers the no-code
   * "see it in action" for non-technical learners).
   */
  action: "run" | "check" | "demo";
  /** Per-learner session id for isolated container execution. */
  sessionId?: string;
}

export interface RunResult {
  ok: boolean;
  /** Combined stdout/stderr stream as the learner would see it. */
  output: string;
  durationMs: number;
  /** Set when the runner exposed a port (real Sandbox path). */
  previewUrl?: string;
  /** "mock" | "sandbox" — surfaced in the UI so the experience is honest. */
  engine: "mock" | "sandbox";
}

export interface CheckResult {
  id: string;
  describe: string;
  passed: boolean;
}

export interface GradeResult {
  passed: boolean;
  checks: CheckResult[];
}

export interface RunnerResponse {
  run: RunResult;
  grade?: GradeResult;
}

export interface LabContext {
  language: "typescript" | "javascript" | "python";
  runCmd: string;
  files: LabFile[];
  checks: GradingCheck[];
}

export interface Runner {
  engine: "mock" | "sandbox";
  run(req: RunRequest, lab: LabContext): Promise<RunnerResponse>;
}
