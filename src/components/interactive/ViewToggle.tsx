import { useEffect, useState } from "react";
import { BookOpen, Code } from "@phosphor-icons/react";
import { getRoleById, ROLE_KEY, type View } from "@/lib/roles";

const VIEW_KEY = "aa:view";

/**
 * Segmented Concept / Code control. Sets data-view on the target container so
 * CSS shows/hides blocks by their data-aud tag. Defaults from the learner's
 * role (analyst/finance -> concept; engineer/scientist -> code) until they
 * explicitly choose, after which their choice is remembered.
 */
interface Props {
  targetId: string;
}

export default function ViewToggle({ targetId }: Props) {
  const [view, setView] = useState<View>("code");

  useEffect(() => {
    let initial: View | undefined;
    try {
      initial = (localStorage.getItem(VIEW_KEY) as View) || undefined;
      if (!initial) initial = getRoleById(localStorage.getItem(ROLE_KEY))?.defaultView;
    } catch {}
    apply(initial ?? "code");

    // If the learner picks a role and hasn't chosen a view explicitly, follow it.
    const onRole = (e: Event) => {
      try {
        if (localStorage.getItem(VIEW_KEY)) return;
      } catch {}
      const r = getRoleById((e as CustomEvent).detail);
      if (r) apply(r.defaultView, false);
    };
    window.addEventListener("aa:role-change", onRole);
    return () => window.removeEventListener("aa:role-change", onRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  function apply(v: View, persist = false) {
    setView(v);
    const el = document.getElementById(targetId);
    if (el) el.dataset.view = v;
    if (persist) {
      try {
        localStorage.setItem(VIEW_KEY, v);
      } catch {}
    }
  }

  const btn = (v: View, label: string, Icon: typeof BookOpen) => (
    <button
      onClick={() => apply(v, true)}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
        view === v ? "bg-foreground-100 text-background-100" : "text-foreground-200 hover:text-foreground-100"
      }`}
      aria-pressed={view === v}
    >
      <Icon size={14} weight={view === v ? "fill" : "regular"} /> {label}
    </button>
  );

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border-100 bg-background-content p-1">
      {btn("concept", "Concept", BookOpen)}
      {btn("code", "Code", Code)}
    </div>
  );
}
