import { createElement } from "react";
import type { EditorProps } from "@monaco-editor/react";

/**
 * Editor options common to every Monaco instance in the app. Call sites spread
 * this and add their own specifics (readOnly, folding, scrollbar), so the
 * shared look stays in one place without changing any editor's behavior.
 */
export const MONACO_BASE_OPTIONS: NonNullable<EditorProps["options"]> = {
  minimap: { enabled: false },
  fontSize: 13,
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  tabSize: 2,
  padding: { top: 12, bottom: 12 },
  fontFamily: "var(--font-mono)",
  renderLineHighlight: "none",
  overviewRulerLanes: 0,
};

/** The shared "Loading editor…" placeholder passed to Editor's `loading` prop. */
export const MonacoLoading = createElement(
  "div",
  { className: "p-4 font-mono text-xs text-text-secondary" },
  "Loading editor…",
);
