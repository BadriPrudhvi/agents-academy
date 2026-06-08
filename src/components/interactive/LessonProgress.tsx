import { useEffect, useState } from "react";
import { CheckCircle, Circle } from "@phosphor-icons/react";

/**
 * MVP progress: persisted to localStorage so "saved progress" works with no
 * backend. SWAP-POINT: replace read/write with POST/GET /api/progress backed by
 * D1 (keyed by session cookie) once Workers Paid creds are in — the UI is unchanged.
 */
interface Props {
  slug: string;
}

const key = (slug: string) => `aa:progress:${slug}`;

export default function LessonProgress({ slug }: Props) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      setDone(localStorage.getItem(key(slug)) === "done");
    } catch {}
  }, [slug]);

  function toggle() {
    const next = !done;
    setDone(next);
    try {
      if (next) localStorage.setItem(key(slug), "done");
      else localStorage.removeItem(key(slug));
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      className={`mt-4 inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors ${
        done ? "border-ai-100 bg-ai-200 text-ai-100" : "border-border-100 hover:border-accent-100"
      }`}
    >
      {done ? <CheckCircle size={16} weight="fill" /> : <Circle size={16} />}
      {done ? "Lesson complete" : "Mark lesson complete"}
    </button>
  );
}
