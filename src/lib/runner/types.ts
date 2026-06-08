import type { GradingCheck, LabFile } from "../content/types";

export interface RunRequest {
  lessonSlug: string;
  labId: string;
  files: { path: string; contents: string }[];
  /** "run" just executes; "check" executes then grades against hidden checks. */
  action: "run" | "check";
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
