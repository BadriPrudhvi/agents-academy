import { describe, it, expect } from "vitest";
import { grade, stripComments } from "@/lib/runner/grade";
import type { GradingCheck } from "@/lib/content/types";

describe("stripComments", () => {
  it("removes // line comments and /* */ block comments", () => {
    expect(stripComments("a // hint\nb")).toBe("a \nb");
    expect(stripComments("x /* note */ y")).toBe("x  y");
  });
});

describe("grade", () => {
  const file = (contents: string) => [{ path: "task.js", contents }];

  it("expectSource matches real code but not commented hints", () => {
    const checks: GradingCheck[] = [
      { id: "c1", describe: "uses listSales", expectSource: { file: "task.js", pattern: "codemode.listSales" } },
    ];
    expect(grade(checks, file("await codemode.listSales()"), "").passed).toBe(true);
    // Pattern only present in a comment -> should NOT pass.
    expect(grade(checks, file("// TODO: call codemode.listSales()"), "").passed).toBe(false);
  });

  it("supports regex patterns wrapped in /.../", () => {
    const checks: GradingCheck[] = [
      { id: "agg", describe: "aggregates", expectSource: { file: "task.js", pattern: "/(reduce|for ?\\()/" } },
    ];
    expect(grade(checks, file("for (const r of rows) {}"), "").passed).toBe(true);
    expect(grade(checks, file("rows.reduce((a,b)=>a+b)"), "").passed).toBe(true);
    expect(grade(checks, file("rows.map(x=>x)"), "").passed).toBe(false);
  });

  it("expectStdout matches run output", () => {
    const checks: GradingCheck[] = [{ id: "out", describe: "prints", expectStdout: "Top product" }];
    expect(grade(checks, file(""), "Top product: Widget A").passed).toBe(true);
    expect(grade(checks, file(""), "nothing").passed).toBe(false);
  });

  it("passes only when every check passes", () => {
    const checks: GradingCheck[] = [
      { id: "a", describe: "a", expectSource: { file: "task.js", pattern: "foo" } },
      { id: "b", describe: "b", expectStdout: "bar" },
    ];
    const res = grade(checks, file("foo"), "no match");
    expect(res.passed).toBe(false);
    expect(res.checks.find((c) => c.id === "a")?.passed).toBe(true);
    expect(res.checks.find((c) => c.id === "b")?.passed).toBe(false);
  });
});
