import { describe, it, expect, afterEach } from "vitest";
import { render, screen, renderHook, waitFor, act, cleanup } from "@testing-library/react";
import { OutputConsole } from "@/components/ui/OutputConsole";
import { MONACO_BASE_OPTIONS } from "@/components/ui/monaco";
import { useMonacoTheme } from "@/components/ui/useMonacoTheme";

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});

describe("OutputConsole", () => {
  it("renders a dark terminal <pre> with the locked class set and children", () => {
    render(<OutputConsole>hello world</OutputConsole>);
    const pre = screen.getByText("hello world");
    expect(pre.tagName).toBe("PRE");
    for (const cls of [
      "overflow-x-auto",
      "rounded-lg",
      "bg-[#151414]",
      "px-4",
      "py-3",
      "font-mono",
      "text-[12.5px]",
      "leading-relaxed",
      "text-[#f0e3de]",
    ]) {
      expect(pre.className).toContain(cls);
    }
  });

  it("omits rounded-lg when rounded is false (CodeLab flush variant)", () => {
    render(<OutputConsole rounded={false}>flush</OutputConsole>);
    const pre = screen.getByText("flush");
    expect(pre.className).not.toContain("rounded-lg");
    expect(pre.className).toContain("bg-[#151414]");
  });
});

describe("MONACO_BASE_OPTIONS", () => {
  it("locks the shared editor option values", () => {
    expect(MONACO_BASE_OPTIONS).toMatchObject({
      minimap: { enabled: false },
      fontSize: 13,
      lineNumbers: "on",
      scrollBeyondLastLine: false,
      tabSize: 2,
      padding: { top: 12, bottom: 12 },
      fontFamily: "var(--font-mono)",
      renderLineHighlight: "none",
      overviewRulerLanes: 0,
    });
  });
});

describe("useMonacoTheme", () => {
  it("starts light and follows the <html> dark class", async () => {
    const { result } = renderHook(() => useMonacoTheme());
    expect(result.current).toBe("light");

    act(() => document.documentElement.classList.add("dark"));
    await waitFor(() => expect(result.current).toBe("vs-dark"));

    act(() => document.documentElement.classList.remove("dark"));
    await waitFor(() => expect(result.current).toBe("light"));
  });
});
