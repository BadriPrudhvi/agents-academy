import type { Runner } from "./types";
import { mockRunner } from "./mock";

export type { Runner, RunRequest, RunResult, GradeResult, RunnerResponse } from "./types";

/**
 * Select the execution engine based on RUNNER_MODE.
 *
 * - "mock"    -> local simulator (Spike B fallback; default).
 * - "sandbox" -> real @cloudflare/sandbox engine (gated until Spike B clears
 *                cost + isolation). See createSandboxRunner below.
 */
export function getRunner(mode: string | undefined): Runner {
  if (mode === "sandbox") {
    // Intentionally not wired yet — flips on once Workers Paid + container image
    // are provisioned and Spike B's cost/isolation numbers are accepted.
    // return createSandboxRunner(env.SANDBOX);
    console.warn("[runner] RUNNER_MODE=sandbox requested but not provisioned; using mock.");
  }
  return mockRunner;
}

/*
 * createSandboxRunner(binding) — real path, sketched for the Spike B graduation:
 *
 *   import { getSandbox } from "@cloudflare/sandbox";
 *   const sandbox = getSandbox(binding, sessionId);          // warm-pool keyed by session
 *   const ctx = await sandbox.createCodeContext({ language });
 *   await sandbox.writeFiles(files);                          // seed the lab
 *   const exec = await sandbox.runCode(runCmd, {              // stream stdout/result
 *     context: ctx, onStdout, onResult, timeoutMs: QUOTA_MS,
 *   });
 *   const preview = previewPort ? await sandbox.exposePort(previewPort) : undefined;
 *   // enforce egress allowlist + CPU/mem/time quotas; reap on TTL via RUNNER_LIMITER DO.
 *   // grade() is reused verbatim against the REAL stdout.
 */
