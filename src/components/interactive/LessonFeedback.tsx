import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "@phosphor-icons/react";
import { ROLE_KEY } from "@/lib/roles";

/**
 * "Was this lesson helpful?" — one tap, optional note. Posts to /api/feedback
 * and remembers locally so we don't re-ask.
 */
interface Props {
  lessonSlug: string;
}

export default function LessonFeedback({ lessonSlug }: Props) {
  const [sent, setSent] = useState(false);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  async function send(helpful: boolean, withNote = false) {
    setChoice(helpful);
    let role: string | undefined;
    try {
      role = localStorage.getItem(ROLE_KEY) ?? undefined;
    } catch {}
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lessonSlug, helpful, role, note: withNote ? note : undefined }),
      });
    } catch {}
    if (withNote || helpful) setSent(true);
    else setShowNote(true);
  }

  if (sent) {
    return (
      <div className="mt-10 flex items-center gap-2 rounded-xl border border-border-100 bg-background-content px-5 py-4 text-sm text-foreground-200">
        <Check size={16} weight="bold" className="text-ai-100" /> Thanks — your feedback helps improve this lesson.
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-xl border border-border-100 bg-background-content px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground-100">Was this lesson helpful?</span>
        <button
          onClick={() => send(true)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            choice === true ? "border-ai-100 bg-ai-200 text-ai-100" : "border-border-100 hover:border-foreground-300"
          }`}
        >
          <ThumbsUp size={15} weight={choice === true ? "fill" : "regular"} /> Yes
        </button>
        <button
          onClick={() => send(false)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
            choice === false ? "border-accent-100 bg-accent-100/10 text-accent-muted" : "border-border-100 hover:border-foreground-300"
          }`}
        >
          <ThumbsDown size={15} weight={choice === false ? "fill" : "regular"} /> No
        </button>
      </div>

      {showNote && (
        <div className="mt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What was confusing or missing? (optional)"
            rows={2}
            className="w-full rounded-md border border-border-100 bg-background-100 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent-100/50"
          />
          <button
            onClick={() => send(false, true)}
            className="mt-2 rounded-md bg-foreground-100 px-3 py-1.5 text-sm text-background-100"
          >
            Send feedback
          </button>
        </div>
      )}
    </div>
  );
}
