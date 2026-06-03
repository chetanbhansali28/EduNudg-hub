import { useEffect, useState } from "react";

export type NavTheme = "hero" | "light" | "dark";

const THEME_PRIORITY: NavTheme[] = ["light", "dark", "hero"];

/** Y coordinate under the fixed nav (below the bar itself). */
const NAV_SAMPLE_Y = 72;

function readTheme(el: HTMLElement): NavTheme | null {
  const t = el.getAttribute("data-nav-theme");
  if (t === "light" || t === "dark" || t === "hero") return t;
  return null;
}

function themeFromAncestors(start: Element | null): NavTheme | null {
  let node = start;
  while (node instanceof HTMLElement) {
    const t = readTheme(node);
    if (t) return t;
    if (node.classList.contains("marketing-page")) break;
    node = node.parentElement;
  }
  return null;
}

/**
 * Uses the topmost painted element under the nav (respects z-index) so sticky hero
 * does not win over scrolled white content.
 */
function themeAtNavLine(): NavTheme | null {
  const x = Math.round(window.innerWidth / 2);

  if (typeof document.elementsFromPoint === "function") {
    for (const el of document.elementsFromPoint(x, NAV_SAMPLE_Y)) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.closest(".novu-nav-bar")) continue;
      const t = themeFromAncestors(el);
      if (t) return t;
    }
  } else if (typeof document.elementFromPoint === "function") {
    const hit = document.elementFromPoint(x, NAV_SAMPLE_Y);
    if (hit instanceof HTMLElement && !hit.closest(".novu-nav-bar")) {
      const t = themeFromAncestors(hit);
      if (t) return t;
    }
  }

  return null;
}

/** Fallback when hit-testing misses (e.g. tests); prefers light/dark over hero. */
function themeFromSectionBounds(): NavTheme | null {
  const triggerY = NAV_SAMPLE_Y;
  const overlapping = new Set<NavTheme>();

  for (const el of document.querySelectorAll<HTMLElement>("[data-nav-theme]")) {
    const rect = el.getBoundingClientRect();
    if (rect.top <= triggerY && rect.bottom > triggerY) {
      const t = readTheme(el);
      if (t) overlapping.add(t);
    }
  }

  if (overlapping.size === 0) return null;

  for (const candidate of THEME_PRIORITY) {
    if (overlapping.has(candidate)) return candidate;
  }

  return "hero";
}

/**
 * Picks nav chrome colors from whatever is visually behind the fixed nav bar.
 */
export function useNavTheme() {
  const [theme, setTheme] = useState<NavTheme>("hero");

  useEffect(() => {
    const sections = document.querySelectorAll("[data-nav-theme]");
    if (!sections.length) return;

    const update = () => {
      const sampled = themeAtNavLine();
      if (sampled) {
        setTheme(sampled);
        return;
      }

      const fallback = themeFromSectionBounds();
      setTheme(fallback ?? "hero");
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
