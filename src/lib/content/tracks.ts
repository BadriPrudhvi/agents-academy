import type { Track } from "./types";

/** The curriculum, organized around the official four-part Agents model. */
export const TRACKS: Track[] = [
  { id: "foundations", order: 0, title: "Foundations", blurb: "What an agent is, the Workers edge model, and your first deploy.", accent: "compute" },
  { id: "first-agent", order: 1, title: "Your first agent", blurb: "The Agent class, Workers AI, state, and streaming.", accent: "ai" },
  { id: "channels", order: 2, title: "Channels", blurb: "Reach your agent over chat, voice, email, Slack, and webhooks.", accent: "media" },
  { id: "tools", order: 3, title: "Tools", blurb: "Tool calling, Browser Rendering, Sandbox, MCP, and human-in-the-loop.", accent: "compute" },
  { id: "memory", order: 4, title: "Memory & knowledge", blurb: "Embeddings, Vectorize, AI Search, and grounded answers.", accent: "storage" },
  { id: "durability", order: 5, title: "Durability", blurb: "Workflows, Fibers, scheduling, and crash recovery.", accent: "sase" },
  { id: "mcp", order: 6, title: "Build MCP servers", blurb: "Expose tools to any agent, with auth and multi-agent patterns.", accent: "media" },
  { id: "production", order: 7, title: "Production", blurb: "Evals, guardrails, observability, cost, and deploy to your account.", accent: "security" },
];

export function getTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}
