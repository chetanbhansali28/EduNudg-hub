import { useEffect, useState } from "react";

const DESKTOP_MQ = "(min-width: 1024px)";

function readIsDesktop() {
  if (typeof window === "undefined") return true;
  if (typeof window.matchMedia !== "function") return true;
  return window.matchMedia(DESKTOP_MQ).matches;
}

export function useOpsBreakpoint() {
  const [isDesktop, setIsDesktop] = useState(readIsDesktop);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(DESKTOP_MQ);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return { isDesktop, isMobile: !isDesktop };
}
