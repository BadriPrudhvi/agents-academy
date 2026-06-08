/** Stable URL-fragment id from a heading's text. */
export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Minimal inline formatter for lesson prose: escapes &/<, then renders
 * `code`, **bold**, and [text](url). Returns an HTML string for set:html.
 */
export function inline(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-background-300 px-1 py-0.5 text-[0.9em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-accent-muted underline" href="$2" target="_blank" rel="noreferrer">$1</a>');
}
