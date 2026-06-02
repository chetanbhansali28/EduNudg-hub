import { useEffect } from "react";

export function useScrollReveal(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const els = document.querySelectorAll(".novu-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [active]);
}
