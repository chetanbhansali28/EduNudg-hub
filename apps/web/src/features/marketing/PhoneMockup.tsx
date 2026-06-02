import type { HomepageConfig } from "@/types/homepage";

type Props = {
  frameUrl: string;
  variant?: "default" | "evening" | "priorities";
  priorities?: { label: string; tag: string }[];
};

const DEFAULT_PRIORITIES = [
  { label: "File tax report", tag: "Work" },
  { label: "Meet Alex for lunch", tag: "Personal" },
  { label: "Go to the gym", tag: "Health" },
];

export function PhoneMockup({ frameUrl, variant = "default", priorities = DEFAULT_PRIORITIES }: Props) {
  return (
    <div className="novu-phone">
      <div className="novu-phone__glow" aria-hidden />
      <div className="novu-phone__device">
        <img src={frameUrl} alt="" className="novu-phone__frame" />
        <div className="novu-phone__screen">
          {variant === "default" && (
            <>
              <div className="novu-phone__status">
                <span className="novu-phone__day">Fri</span>
                <span className="novu-phone__date">24 April 2026</span>
                <span className="novu-phone__time">9:41</span>
              </div>
              <ul className="novu-phone__tasks">
                {priorities.map((p) => (
                  <li key={p.label} className="novu-phone__task">
                    <span>{p.label}</span>
                    <span className={`novu-phone__tag novu-phone__tag--${p.tag.toLowerCase()}`}>{p.tag}</span>
                  </li>
                ))}
              </ul>
              <div className="novu-phone__voice">
                <span className="novu-phone__voice-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
                <span>Writing things down…</span>
              </div>
            </>
          )}
          {variant === "evening" && (
            <>
              <div className="novu-phone__evening-label">Wind down</div>
              <div className="novu-phone__evening-time">21:00</div>
              <div className="novu-phone__evening-pill">1 task moved to tomorrow</div>
              <div className="novu-phone__moods" aria-hidden>
                <span>😐</span>
                <span>🙂</span>
                <span>😊</span>
              </div>
            </>
          )}
          {variant === "priorities" && (
            <ul className="novu-phone__tasks novu-phone__tasks--compact">
              {priorities.map((p) => (
                <li key={p.label} className="novu-phone__task">
                  <span>{p.label}</span>
                  <span className={`novu-phone__tag novu-phone__tag--${p.tag.toLowerCase()}`}>{p.tag}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function getPriorityBullets(config: HomepageConfig) {
  return [
    { label: "Curriculum governance", tag: "Brand" },
    { label: "Center operations", tag: "Franchise" },
    { label: "Family transparency", tag: "Parents" },
  ];
}
