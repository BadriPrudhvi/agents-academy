/**
 * Client-facing safety guard for learner/AI code. Mirrors the runner's
 * authoritative denylist so we can give fast feedback (and never hand back
 * AI-generated code that the runner would reject). The runner remains the hard
 * boundary; this is defense in depth.
 */
const JS_DENY: Array<{ re: RegExp; name: string }> = [
  { re: /\bfetch\s*\(/, name: "fetch()" },
  { re: /\bimport\s*\(/, name: "dynamic import()" },
  { re: /\brequire\s*\(/, name: "require()" },
  { re: /\bWebSocket\b/, name: "WebSocket" },
  { re: /\bXMLHttpRequest\b/, name: "XMLHttpRequest" },
  { re: /\bprocess\b/, name: "process" },
  { re: /\bchild_process\b/, name: "child_process" },
  { re: /\bglobalThis\b/, name: "globalThis" },
  { re: /\beval\s*\(/, name: "eval()" },
  { re: /\bFunction\s*\(/, name: "the Function constructor" },
  { re: /\bnode:/, name: "node: modules" },
];

export function deniedJs(code: string): string | null {
  for (const { re, name } of JS_DENY) {
    if (re.test(code)) return `That code can't run here — it may not use ${name}. Stick to the provided tools (codemode.*).`;
  }
  return null;
}

/** Strip markdown code fences an LLM may wrap around code. */
export function stripFences(text: string): string {
  const fence = text.match(/```(?:js|javascript|ts|typescript)?\s*([\s\S]*?)```/i);
  return (fence ? fence[1] : text).trim();
}
