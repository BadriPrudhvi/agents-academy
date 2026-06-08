import type { Runner } from "./types";
import { mockRunner } from "./mock";
import { createSandboxRunner } from "./sandbox";

export type { Runner, RunRequest, RunResult, GradeResult, RunnerResponse, LabContext } from "./types";

/**
 * Select the execution engine.
 *
 * - "sandbox" + a RUNNER service binding -> real container execution.
 * - otherwise -> local simulator (offline/dev, or when the runner is absent).
 */
export function getRunner(mode: string | undefined, runner?: { fetch: typeof fetch }): Runner {
  if (mode === "sandbox" && runner) {
    return createSandboxRunner(runner);
  }
  if (mode === "sandbox") {
    console.warn("[runner] RUNNER_MODE=sandbox but no RUNNER binding; using mock.");
  }
  return mockRunner;
}
