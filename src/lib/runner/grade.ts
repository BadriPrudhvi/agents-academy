import type { GradingCheck } from "../content/types";
import type { CheckResult, GradeResult } from "./types";

/**
 * The grading contract — shared by every engine (mock + real Sandbox).
 *
 * Two check kinds:
 *  - expectSource: static check against the learner's file contents (always real).
 *  - expectStdout: dynamic check against run output (real stdout under Sandbox,
 *    simulated stdout under the mock — clearly labeled in the UI).
 *
 * A pattern is treated as a regex if it is wrapped in /…/, else as a substring.
 */
export function grade(
  checks: GradingCheck[],
  files: { path: string; contents: string }[],
  stdout: string,
): GradeResult {
  const results: CheckResult[] = checks.map((c) => {
    let passed = false;

    if (c.expectSource) {
      const file = files.find((f) => f.path === c.expectSource!.file);
      // Match against code with comments stripped, so TODO hints that mention an
      // API name don't satisfy the check — only real usage counts.
      passed = file ? matches(stripComments(file.contents), c.expectSource.pattern) : false;
    } else if (c.expectStdout) {
      passed = matches(stdout, c.expectStdout);
    }

    return { id: c.id, describe: c.describe, passed };
  });

  return { passed: results.every((r) => r.passed), checks: results };
}

/** Strip // line and /* *​/ block comments so static checks match real code. */
export function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function matches(haystack: string, pattern: string): boolean {
  if (pattern.length > 2 && pattern.startsWith("/") && pattern.endsWith("/")) {
    try {
      return new RegExp(pattern.slice(1, -1)).test(haystack);
    } catch {
      return false;
    }
  }
  return haystack.includes(pattern);
}
