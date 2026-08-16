import { useEffect } from "react";

type ScrollRevealOptions = {
  threshold?: number;
  rootMargin?: string;
};

export function useScrollReveal(
  active: boolean,
  selector = ".novu-reveal",
  options?: ScrollRevealOptions
) {
  const threshold = options?.threshold ?? 0.12;
  const rootMargin = options?.rootMargin ?? "0px 0px -40px 0px";

  useEffect(() => {
    if (!active || typeof IntersectionObserver === "undefined") return;
    const els = document.querySelectorAll(selector);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold, rootMargin }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [active, selector, threshold, rootMargin]);
}
