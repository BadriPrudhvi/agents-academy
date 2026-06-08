import { describe, it, expect } from "vitest";
import { deniedJs, stripFences } from "@/lib/guard";

describe("deniedJs", () => {
  it("blocks network/process/eval and friends", () => {
    for (const bad of ["fetch('x')", "import('y')", "require('z')", "process.env", "eval('1')", "new Function('')"]) {
      expect(deniedJs(bad)).not.toBeNull();
    }
  });

  it("allows clean codemode-only programs", () => {
    expect(deniedJs("const rows = await codemode.listSales(); console.log(rows.length);")).toBeNull();
  });

  it("does not false-positive on identifiers ending in a denied word", () => {
    expect(deniedJs("myFunction(1)")).toBeNull();
  });
});

describe("stripFences", () => {
  it("extracts code from a markdown fence", () => {
    expect(stripFences("```js\nconst a = 1;\n```")).toBe("const a = 1;");
  });
  it("returns trimmed text when no fence is present", () => {
    expect(stripFences("  const a = 1;  ")).toBe("const a = 1;");
  });
});
