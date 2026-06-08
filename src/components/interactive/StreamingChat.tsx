import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Cpu, PaperPlaneTilt, Spinner } from "@phosphor-icons/react";

interface Props {
  lessonSlug: string;
  chatId: string;
  intro: string;
  model: string;
  examples: string[];
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function StreamingChat(props: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setBusy(true);
    setInput("");

    // Append the user's message + an empty assistant message we'll stream into.
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug: props.lessonSlug, chatId: props.chatId, messages: history }),
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "The chat could not run.");
        setMessages(history); // drop the empty assistant bubble
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      const pump = async (): Promise<void> => {
        const { value, done } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const obj = JSON.parse(payload) as { response?: string };
            if (obj.response) {
              acc += obj.response;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: acc };
                return next;
              });
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }
          } catch {
            /* ignore keep-alive / non-JSON lines */
          }
        }
        return pump();
      };
      await pump();

      if (!acc.trim()) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: "(no response)" };
          return next;
        });
      }
    } catch (err) {
      setError(String(err));
      setMessages(history);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="my-8 rounded-xl border border-border-100 bg-background-content">
      <div className="border-b border-border-100 px-5 py-4">
        {props.intro && <p className="text-sm text-foreground-200">{props.intro}</p>}
        <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary ${props.intro ? "mt-2" : ""}`}>
          <span className="inline-flex items-center gap-1.5">
            <Cpu size={13} /> Streaming from {props.model}
          </span>
        </p>
      </div>

      <div className="p-5">
        {messages.length > 0 && (
          <div ref={scrollRef} className="mb-4 max-h-80 space-y-3 overflow-y-auto">
            {messages.map((m, i) => {
              const streaming = busy && i === messages.length - 1 && m.role === "assistant";
              return (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span
                    className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-accent-100 text-light-foreground"
                        : "border border-border-100 bg-background-300 text-foreground-200"
                    }`}
                  >
                    {m.content || (streaming ? "" : "…")}
                    {streaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-foreground-300 align-middle" />}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something — watch the reply stream in…"
            className="flex-1 rounded-md border border-border-100 bg-background-100 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-100/50"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent-100 px-4 py-2 text-sm text-light-foreground disabled:opacity-50"
          >
            {busy ? <Spinner size={15} className="animate-spin" /> : <PaperPlaneTilt size={15} weight="fill" />} Send
          </button>
        </form>

        {messages.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {props.examples.map((ex) => (
              <button
                key={ex}
                onClick={() => send(ex)}
                disabled={busy}
                className="rounded-full border border-border-100 px-3 py-1 text-xs text-foreground-200 transition-colors hover:border-foreground-300 disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-accent-muted">{error}</p>}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 border-t border-border-100 pt-3 text-xs text-text-secondary">
          This streams live from Workers AI to show what token streaming feels like. In production, an{" "}
          <code className="rounded bg-background-300 px-1 py-0.5">AIChatAgent</code> streams the same way over a WebSocket — and
          also persists every message and resumes if you disconnect.
        </motion.p>
      </div>
    </section>
  );
}
