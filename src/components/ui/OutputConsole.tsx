import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The dark terminal-style <pre> used to show run output across the islands.
 * `rounded` toggles the rounded-lg corners (CodeLab's output sits flush inside
 * a bordered panel, so it omits them); the class set is otherwise identical to
 * the inline versions it replaces.
 */
export function OutputConsole({
  children,
  rounded = true,
  className,
}: {
  children: ReactNode;
  rounded?: boolean;
  className?: string;
}) {
  return (
    <pre
      className={cn(
        "overflow-x-auto",
        rounded && "rounded-lg",
        "bg-[#151414] px-4 py-3 font-mono text-[12.5px] leading-relaxed text-[#f0e3de]",
        className,
      )}
    >
      {children}
    </pre>
  );
}
