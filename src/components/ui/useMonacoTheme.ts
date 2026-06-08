import { useEffect, useState } from "react";

/**
 * Tracks the site's light/dark mode and maps it to Monaco's theme names,
 * staying in sync via a MutationObserver on the <html> class list. Shared by
 * every Monaco-backed editor so the theme logic lives in exactly one place.
 */
export function useMonacoTheme(): "light" | "vs-dark" {
  const [theme, setTheme] = useState<"light" | "vs-dark">("light");

  useEffect(() => {
    const sync = () =>
      setTheme(document.documentElement.classList.contains("dark") ? "vs-dark" : "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return theme;
}
