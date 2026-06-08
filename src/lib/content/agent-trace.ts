/**
 * One step in a live agent-run trace. Single source of truth shared by the
 * /api/agent-run endpoint (which produces it) and the AgentRun island (which
 * renders it), so the two can never drift.
 */
export type AgentStep =
  | { type: "goal"; text: string }
  | { type: "think"; text: string }
  | { type: "tool"; name: string; args: unknown }
  | { type: "observe"; text: string; data?: unknown }
  | { type: "answer"; text: string };
