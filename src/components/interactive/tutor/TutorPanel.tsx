import { useState } from "react";
import { ChatCircleDots, Spinner, X, BookOpen } from "@phosphor-icons/react";

interface Props {
  lessonSlug: string;
}

interface Msg {
  role: "you" | "tutor";
  text: string;
  citations?: { title: string; url: string }[];
  mode?: "mock" | "live";
}

interface TutorResponse {
  answer: string;
  citations?: { title: string; url: string }[];
  mode?: "mock" | "live";
  error?: string;
}

export default function TutorPanel({ lessonSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { role: "you", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug, question }),
      });
      const data = (await res.json()) as TutorResponse;
      setMsgs((m) => [
        ...m,
        res.ok
          ? { role: "tutor", text: data.answer, citations: data.citations, mode: data.mode }
          : { role: "tutor", text: `Error: ${data.error ?? res.statusText}` },
      ]);
    } catch (err) {
      setMsgs((m) => [...m, { role: "tutor", text: `Network error: ${String(err)}` }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-accent-100 px-4 py-3 text-sm text-light-foreground shadow-lg"
      >
        <ChatCircleDots size={18} weight="fill" /> Ask the tutor
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[28rem] w-[22rem] flex-col rounded-xl border border-border-100 bg-background-content shadow-xl">
      <div className="flex items-center justify-between border-b border-border-100 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <ChatCircleDots size={16} weight="fill" className="text-accent-100" /> Tutor
        </span>
        <button onClick={() => setOpen(false)} aria-label="Close tutor" className="text-text-secondary hover:text-foreground-100">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        {msgs.length === 0 && (
          <p className="text-text-secondary">
            Ask anything about this lesson — how state works, how to call the model, why an agent isn't a chatbot.
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "you" ? "text-foreground-100" : ""}>
            <p className="mb-0.5 text-[11px] uppercase tracking-wider text-text-secondary">
              {m.role === "you" ? "You" : "Tutor"}
              {m.mode === "mock" && m.role === "tutor" && (
                <span className="ml-2 rounded bg-background-300 px-1.5 py-0.5 normal-case tracking-normal">guided (offline)</span>
              )}
            </p>
            <p className="text-foreground-200">{m.text}</p>
            {m.citations?.map((c) => (
              <a
                key={c.url}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-accent-muted hover:underline"
              >
                <BookOpen size={12} /> {c.title}
              </a>
            ))}
          </div>
        ))}
        {busy && (
          <p className="flex items-center gap-2 text-text-secondary">
            <Spinner size={14} className="animate-spin" /> Thinking…
          </p>
        )}
      </div>

      <form onSubmit={ask} className="border-t border-border-100 p-2">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 rounded-md border border-border-100 bg-background-100 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-100/50"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-foreground-100 px-3 py-2 text-sm text-background-100 disabled:opacity-50"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
