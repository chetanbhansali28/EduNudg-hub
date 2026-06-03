import { useEffect, useState } from "react";

/** Matches `.novu-hero__line-inner` animation (1.1s) + second line delay (0.2s). */
export const HERO_INTRO_COMPLETE_MS = 1380;

/**
 * True after the hero headline intro animation finishes (or immediately if reduced motion).
 */
export function useHeroIntroComplete(): boolean {
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setComplete(true);
      return;
    }

    let done = false;
    let detachAnim: (() => void) | undefined;
    let observer: MutationObserver | undefined;

    const finish = () => {
      if (done) return;
      done = true;
      detachAnim?.();
      observer?.disconnect();
      setComplete(true);
    };

    const listenToHeroLine = (): boolean => {
      const lastLine = document.querySelector<HTMLElement>(
        ".novu-hero__line:nth-child(2) .novu-hero__line-inner"
      );
      if (!lastLine) return false;

      const onEnd = (e: AnimationEvent) => {
        if (e.animationName === "novu-hero-in") finish();
      };
      lastLine.addEventListener("animationend", onEnd);
      detachAnim = () => lastLine.removeEventListener("animationend", onEnd);
      return true;
    };

    if (!listenToHeroLine()) {
      observer = new MutationObserver(() => {
        if (listenToHeroLine()) observer?.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    const fallbackId = window.setTimeout(finish, HERO_INTRO_COMPLETE_MS + 300);

    return () => {
      done = true;
      detachAnim?.();
      observer?.disconnect();
      clearTimeout(fallbackId);
    };
  }, []);

  return complete;
}
