import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChartBar, Database, Flask, Brain, Coins, CaretDown, Check } from "@phosphor-icons/react";
import { ROLES, ROLE_KEY, getRoleById, type Role } from "@/lib/roles";

const ICONS = { ChartBar, Database, Flask, Brain, Coins } as const;

function selectRole(id: string) {
  try {
    localStorage.setItem(ROLE_KEY, id);
  } catch {}
  document.documentElement.dataset.role = id;
  window.dispatchEvent(new CustomEvent("aa:role-change", { detail: id }));
}

interface Props {
  variant?: "grid" | "compact";
}

export default function RolePicker({ variant = "grid" }: Props) {
  const [current, setCurrent] = useState<Role | undefined>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCurrent(getRoleById(localStorage.getItem(ROLE_KEY)));
    const onChange = (e: Event) => setCurrent(getRoleById((e as CustomEvent).detail));
    window.addEventListener("aa:role-change", onChange);
    return () => window.removeEventListener("aa:role-change", onChange);
  }, []);

  function pick(id: string) {
    selectRole(id);
    setCurrent(getRoleById(id));
    setOpen(false);
  }

  if (variant === "compact") {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border-100 px-2.5 py-1.5 text-sm text-foreground-200 hover:text-accent-muted"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {current ? current.label : "Choose your role"}
          <CaretDown size={12} weight="bold" />
        </button>
        {open && (
          <ul
            className="absolute right-0 z-50 mt-1 w-64 rounded-lg border border-border-100 bg-background-content p-1 shadow-xl"
            role="listbox"
          >
            {ROLES.map((r) => {
              const Icon = ICONS[r.icon];
              return (
                <li key={r.id}>
                  <button
                    onClick={() => pick(r.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-background-300"
                    role="option"
                    aria-selected={current?.id === r.id}
                  >
                    <Icon size={16} className="text-accent-100" />
                    <span className="flex-1">{r.label}</span>
                    {current?.id === r.id && <Check size={14} weight="bold" className="text-ai-100" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ROLES.map((r, i) => {
        const Icon = ICONS[r.icon];
        const active = current?.id === r.id;
        return (
          <motion.button
            key={r.id}
            onClick={() => pick(r.id)}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            whileHover={{ y: -2 }}
            className={`relative rounded-xl border p-4 text-left transition-colors ${
              active ? "border-accent-100 bg-ai-200/40" : "border-border-100 bg-background-content hover:border-foreground-300"
            }`}
            aria-pressed={active}
          >
            {active && <Check size={16} weight="bold" className="absolute right-3 top-3 text-ai-100" />}
            <Icon size={22} className="text-accent-100" />
            <p className="mt-2 font-medium text-foreground-100">{r.label}</p>
            <p className="mt-1 text-sm text-foreground-200">{r.blurb}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
