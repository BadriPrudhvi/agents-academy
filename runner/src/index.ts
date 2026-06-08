import { getSandbox, type Sandbox } from "@cloudflare/sandbox";

export { Sandbox } from "@cloudflare/sandbox";

interface Env {
  Sandbox: DurableObjectNamespace<Sandbox>;
  RUNNER_SECRET?: string;
}

interface RunBody {
  labId: string;
  language: "python" | "javascript" | "typescript";
  files: { path: string; contents: string }[];
  runCmd: string;
  /** Per-learner session id -> isolated container. Defaults to a shared id. */
  sessionId?: string;
}

const EXEC_TIMEOUT_MS = 10_000;

// Sample data the Code Mode harness exposes as codemode.* — kept consistent
// with the lessons so real execution yields the expected answers.
const HARNESS_DATA = `
globalThis.codemode = {
  async listSales() {
    return [
      { product: "Widget A", region: "NA", revenue: 25000 },
      { product: "Widget A", region: "EU", revenue: 17000 },
      { product: "Gadget B", region: "NA", revenue: 30000 },
      { product: "Sprocket C", region: "EU", revenue: 12000 },
    ];
  },
  async bankRows() {
    return [
      { id: "TXN-0001", amount: 100 }, { id: "TXN-0002", amount: 200 },
      { id: "TXN-0003", amount: 300 }, { id: "TXN-0004", amount: 400 },
      { id: "TXN-0005", amount: 500 }, { id: "TXN-0006", amount: 600 },
      { id: "TXN-0042", amount: 4242 }, { id: "TXN-0099", amount: 9999 },
    ];
  },
  async ledgerRows() {
    return [
      { id: "TXN-0001", amount: 100 }, { id: "TXN-0002", amount: 200 },
      { id: "TXN-0003", amount: 300 }, { id: "TXN-0004", amount: 400 },
      { id: "TXN-0005", amount: 500 }, { id: "TXN-0006", amount: 600 },
    ];
  },
};
const mod = await import("./__entry.mjs");
if (typeof mod.default === "function") await mod.default();
`;

/**
 * Egress / abuse guard. We run learner- and AI-authored code, so deny anything
 * that reaches the network, the filesystem, the process, or escapes the
 * sandboxed `codemode.*` surface. Defense in depth alongside per-session
 * isolation + execution timeout.
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
const PY_DENY: Array<{ re: RegExp; name: string }> = [
  { re: /\bimport\s+(os|sys|socket|subprocess|requests|urllib|http|ftplib|shutil)\b/, name: "system/network modules" },
  { re: /\bfrom\s+(os|sys|socket|subprocess|requests|urllib|http)\b/, name: "system/network modules" },
  { re: /\b__import__\s*\(/, name: "__import__" },
  { re: /\beval\s*\(/, name: "eval()" },
  { re: /\bexec\s*\(/, name: "exec()" },
  { re: /\bopen\s*\(/, name: "file access" },
];

function denied(code: string, lang: "javascript" | "python"): string | null {
  const rules = lang === "python" ? PY_DENY : JS_DENY;
  for (const { re, name } of rules) {
    if (re.test(code)) return `Blocked for safety: code may not use ${name}.`;
  }
  return null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/run") {
      return new Response("agents-academy-runner: POST /run", { status: 404 });
    }
    if (env.RUNNER_SECRET && request.headers.get("x-runner-secret") !== env.RUNNER_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }

    let body: RunBody;
    try {
      body = (await request.json()) as RunBody;
    } catch {
      return json({ error: "invalid json" }, 400);
    }

    // Per-session isolation: distinct sandbox per learner (capped id length).
    const sessionId = (body.sessionId ?? "shared").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "shared";
    const sandbox = getSandbox(env.Sandbox, `s-${sessionId}`);
    const started = Date.now();

    try {
      let cmd: string;
      if (body.language === "python") {
        const entry = body.files.find((f) => f.path.endsWith(".py")) ?? body.files[0];
        const block = denied(entry.contents, "python");
        if (block) return json({ ran: true, engine: "sandbox", ok: false, output: block, blocked: true });
        await sandbox.writeFile(`/workspace/${entry.path}`, entry.contents);
        cmd = `python3 /workspace/${entry.path}`;
      } else if (body.language === "javascript") {
        const entry = body.files.find((f) => f.path.endsWith(".js")) ?? body.files[0];
        const block = denied(entry.contents, "javascript");
        if (block) return json({ ran: true, engine: "sandbox", ok: false, output: block, blocked: true });
        await sandbox.writeFile("/workspace/__entry.mjs", entry.contents);
        await sandbox.writeFile("/workspace/__harness.mjs", HARNESS_DATA);
        cmd = `node /workspace/__harness.mjs`;
      } else {
        return json({ ran: false, engine: "sandbox", reason: "language-not-executed" });
      }

      const result = await sandbox.exec(cmd, { timeout: EXEC_TIMEOUT_MS });
      const out = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return json({
        ran: true,
        engine: "sandbox",
        ok: result.success,
        exitCode: result.exitCode,
        output: out || "(no output)",
        durationMs: Date.now() - started,
      });
    } catch (err) {
      const msg = String(err);
      const timedOut = /timeout|timed out/i.test(msg);
      return json(
        { ran: true, engine: "sandbox", ok: false, output: timedOut ? "Execution timed out (10s limit)." : msg },
        200,
      );
    }
  },
};
