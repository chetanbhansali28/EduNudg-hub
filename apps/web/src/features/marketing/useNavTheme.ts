import { useEffect, useState } from "react";

export type NavTheme = "hero" | "light" | "dark";

/**
 * Mirrors Novu: among sections overlapping the nav trigger line, pick the
 * deepest one (largest `top`) so nested sections beat parent `main`.
 */
export function useNavTheme() {
  const [theme, setTheme] = useState<NavTheme>("hero");

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-nav-theme]");
    if (!sections.length) return;

    const update = () => {
      const triggerY = 96;
      let best: HTMLElement | null = null;
      let bestTop = -Infinity;

      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerY && rect.bottom > triggerY) {
          if (rect.top > bestTop) {
            bestTop = rect.top;
            best = el;
          }
        }
      }

      if (!best) {
        setTheme("hero");
        return;
      }

      const t = best.getAttribute("data-nav-theme");
      if (t === "light" || t === "dark" || t === "hero") {
        setTheme(t);
      } else {
        setTheme("hero");
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return theme;
}
