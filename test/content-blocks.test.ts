import { describe, it, expect } from "vitest";
import { allLessons, getLesson } from "@/lib/content";

describe("statement blocks", () => {
  it("never have empty text", () => {
    for (const l of allLessons()) {
      for (const b of l.blocks) {
        if (b.kind === "statement") expect(b.text.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("compare blocks", () => {
  it("have a title and at least one item on both sides", () => {
    for (const l of allLessons()) {
      for (const b of l.blocks) {
        if (b.kind === "compare") {
          for (const pane of [b.left, b.right]) {
            expect(pane.title.trim().length).toBeGreaterThan(0);
            expect(pane.items.length).toBeGreaterThanOrEqual(1);
          }
        }
      }
    }
  });
});

describe("what-is-an-agent pilot (talk-style)", () => {
  const lesson = getLesson("what-is-an-agent");

  it("leads with a hero bigIdea", () => {
    expect(lesson?.bigIdea).toBeTruthy();
  });

  it("uses a compare block and at least one statement", () => {
    const kinds = lesson!.blocks.map((b) => b.kind);
    expect(kinds).toContain("compare");
    expect(kinds).toContain("statement");
  });
});
