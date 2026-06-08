/* ============================================================================
 * Learner roles — the on-ramp that adapts every lesson to skill level.
 *
 * A role sets the DEFAULT view (concept vs. code) and the preferred language.
 * It's stored in localStorage now (swap-point: D1 profile later). Pure module
 * so both Astro (SSR) and React islands can import it.
 * ========================================================================== */

export type View = "concept" | "code";

export interface Role {
  id: string;
  label: string;
  /** Phosphor icon name (resolved in the picker). */
  icon: "ChartBar" | "Database" | "Flask" | "Brain" | "Coins";
  defaultView: View;
  language: "none" | "python" | "typescript";
  blurb: string;
}

export const ROLES: Role[] = [
  {
    id: "analyst",
    label: "Data analyst",
    icon: "ChartBar",
    defaultView: "concept",
    language: "none",
    blurb: "Comfortable with SQL & spreadsheets. Concepts first, the agent writes the code.",
  },
  {
    id: "finance",
    label: "Finance specialist",
    icon: "Coins",
    defaultView: "concept",
    language: "none",
    blurb: "Forecasting, reconciliation, reporting. Learn what agents do for finance work.",
  },
  {
    id: "data-engineer",
    label: "Data engineer",
    icon: "Database",
    defaultView: "code",
    language: "typescript",
    blurb: "Pipelines & infra. See how agents fit with Workflows, queues, and storage.",
  },
  {
    id: "data-scientist",
    label: "Data scientist",
    icon: "Flask",
    defaultView: "code",
    language: "python",
    blurb: "Python-first. Build agents that run Python and reason over data.",
  },
  {
    id: "ml-engineer",
    label: "ML engineer",
    icon: "Brain",
    defaultView: "code",
    language: "python",
    blurb: "Models in production. Tools, evals, and durable execution for agents.",
  },
];

export const DEFAULT_ROLE = ROLES[0];
export const ROLE_KEY = "aa:role";

export function getRoleById(id: string | null | undefined): Role | undefined {
  return ROLES.find((r) => r.id === id);
}

/**
 * Map a human role label used in content (e.g. "Data analyst", "Finance",
 * "Data scientist") to a canonical role id. Tolerant: exact id, exact label,
 * then a loose first-word match ("Finance" -> "Finance specialist").
 */
export function roleIdFromLabel(label: string): string | undefined {
  const s = label.trim().toLowerCase();
  const byId = ROLES.find((r) => r.id === s);
  if (byId) return byId.id;
  const byLabel = ROLES.find((r) => r.label.toLowerCase() === s);
  if (byLabel) return byLabel.id;
  const loose = ROLES.find(
    (r) => r.label.toLowerCase().startsWith(s) || s.startsWith(r.label.toLowerCase().split(" ")[0]),
  );
  return loose?.id;
}

/** Read the saved role on the client (safe in SSR — returns undefined). */
export function readRole(): Role | undefined {
  if (typeof localStorage === "undefined") return undefined;
  try {
    return getRoleById(localStorage.getItem(ROLE_KEY));
  } catch {
    return undefined;
  }
}
