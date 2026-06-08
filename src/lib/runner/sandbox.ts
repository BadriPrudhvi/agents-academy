import { grade } from "./grade";
import { mockRunner } from "./mock";
import type { LabContext, Runner, RunRequest, RunnerResponse } from "./types";

/**
 * Real execution engine. Calls the dedicated runner Worker (which owns the
 * @cloudflare/sandbox container) over a service binding, then grades against
 * the REAL stdout using the shared contract.
 *
 * Labs the container can't run directly (e.g. the greeter, which needs a full
 * `wrangler dev` server) report ran:false and we fall back to the labeled mock
 * — so the experience stays honest end to end.
 */
export function createSandboxRunner(service: { fetch: typeof fetch }): Runner {
  return {
    engine: "sandbox",
    async run(req: RunRequest, lab: LabContext): Promise<RunnerResponse> {
      // Only python + javascript run for real here.
      if (lab.language !== "python" && lab.language !== "javascript") {
        return mockRunner.run(req, lab);
      }

      try {
        const res = await service.fetch("https://runner.internal/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            labId: req.labId,
            language: lab.language,
            runCmd: lab.runCmd,
            files: req.files,
          }),
        });
        const data = (await res.json()) as {
          ran?: boolean;
          ok?: boolean;
          output?: string;
          durationMs?: number;
        };

        if (!res.ok || !data.ran) return mockRunner.run(req, lab);

        const run = {
          ok: Boolean(data.ok),
          output: data.output ?? "",
          durationMs: data.durationMs ?? 0,
          engine: "sandbox" as const,
        };
        if (req.action === "check") {
          return { run, grade: grade(lab.checks, req.files, run.output) };
        }
        return { run };
      } catch {
        // Runner unreachable -> degrade gracefully to the mock.
        return mockRunner.run(req, lab);
      }
    },
  };
}
