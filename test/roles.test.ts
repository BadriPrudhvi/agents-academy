import { describe, it, expect } from "vitest";
import { roleIdFromLabel, getRoleById } from "@/lib/roles";

describe("roleIdFromLabel", () => {
  it("maps content labels to canonical role ids", () => {
    expect(roleIdFromLabel("Data analyst")).toBe("analyst");
    expect(roleIdFromLabel("Finance")).toBe("finance"); // exact-id match
    expect(roleIdFromLabel("Data scientist")).toBe("data-scientist");
    expect(roleIdFromLabel("Data engineer")).toBe("data-engineer");
    expect(roleIdFromLabel("ML engineer")).toBe("ml-engineer");
  });

  it("does not collide multi-word labels sharing a first word", () => {
    // exact-label match must win before the loose first-word branch
    expect(roleIdFromLabel("Data analyst")).not.toBe("data-engineer");
    expect(roleIdFromLabel("Data scientist")).not.toBe("analyst");
  });

  it("returns undefined for unknown labels", () => {
    expect(roleIdFromLabel("Astronaut")).toBeUndefined();
  });
});

describe("getRoleById", () => {
  it("resolves known ids and rejects unknown", () => {
    expect(getRoleById("analyst")?.label).toBe("Data analyst");
    expect(getRoleById("nope")).toBeUndefined();
    expect(getRoleById(null)).toBeUndefined();
  });
});
