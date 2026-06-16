import { useEffect, useState } from "react";

const MOBILE_MQ = "(max-width: 1023px)";

function readMobile(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

export function useBrandMerchMobile(): boolean {
  const [mobile, setMobile] = useState(readMobile);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return mobile;
}
