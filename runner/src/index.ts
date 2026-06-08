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
}

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

    const sandbox = getSandbox(env.Sandbox, "academy");
    const started = Date.now();

    try {
      let cmd: string;
      if (body.language === "python") {
        const entry = body.files.find((f) => f.path.endsWith(".py")) ?? body.files[0];
        await sandbox.writeFile(`/workspace/${entry.path}`, entry.contents);
        cmd = `python3 /workspace/${entry.path}`;
      } else if (body.language === "javascript") {
        const entry = body.files.find((f) => f.path.endsWith(".js")) ?? body.files[0];
        await sandbox.writeFile("/workspace/__entry.mjs", entry.contents);
        await sandbox.writeFile("/workspace/__harness.mjs", HARNESS_DATA);
        cmd = `node /workspace/__harness.mjs`;
      } else {
        // TypeScript/Worker labs (e.g. the greeter) need a full dev server —
        // not run here. The caller falls back to its labeled representative output.
        return json({ ran: false, engine: "sandbox", reason: "language-not-executed" });
      }

      const result = await sandbox.exec(cmd);
      const out = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return json({
        ran: true,
        engine: "sandbox",
        ok: result.success,
        exitCode: result.exitCode,
        output: out,
        durationMs: Date.now() - started,
      });
    } catch (err) {
      return json({ ran: false, engine: "sandbox", error: String(err) }, 500);
    }
  },
};
