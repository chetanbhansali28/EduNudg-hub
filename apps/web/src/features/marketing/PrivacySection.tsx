import { useRef } from "react";
import type { HomepageConfig } from "@/types/homepage";

function LockIcon() {
  return (
    <svg
      className="novu-privacy__lock"
      viewBox="0 0 200 280"
      aria-hidden
      fill="none"
    >
      <defs>
        <linearGradient id="lockBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id="lockShackle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path
        d="M100 22c-31 0-56 25-56 56v52h20V78c0-20 16-36 36-36s36 16 36 36v52h20V78c0-31-25-56-56-56z"
        fill="url(#lockShackle)"
      />
      <rect x="18" y="114" width="164" height="150" rx="16" fill="url(#lockBody)" />
    </svg>
  );
}

export function PrivacySection({ privacy }: { privacy: HomepageConfig["privacy"] }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);
    el.style.setProperty("--spotlight", "1");
  };

  const onLeave = () => {
    cardRef.current?.style.setProperty("--spotlight", "0");
  };

  const titleParts = privacy.title.match(/^(.+?)(\s*)(\S+\.?)$/);
  const titleMain = titleParts?.[1] ?? privacy.title;
  const titleSerif = titleParts?.[3] ?? "";

  return (
    <section data-nav-theme="dark" className="novu-privacy-section">
      <div className="novu-privacy-section__wrap">
        <div
          ref={cardRef}
          className="novu-privacy__card"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          <div className="novu-privacy__spotlight" aria-hidden />
          <LockIcon />
          <div className="novu-privacy__copy novu-reveal">
            <h2>
              {titleMain} {titleSerif && <span className="serif">{titleSerif}</span>}
            </h2>
            <p>{privacy.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
