import { codeToHtml } from "shiki";

/** SSR syntax highlighting for static code blocks. */
export async function highlight(code: string, lang: string): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang: normalizeLang(lang),
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
  } catch {
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}

function normalizeLang(lang: string): string {
  const map: Record<string, string> = { jsonc: "json", toml: "ini" };
  return map[lang] ?? lang;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
