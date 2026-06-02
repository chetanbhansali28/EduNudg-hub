/** Novu-style per-letter hover stagger on CTA labels */
export function StaggerLabel({ text }: { text: string }) {
  return (
    <span className="novu-stagger-label" aria-hidden>
      {text.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="novu-stagger-label__char"
          style={{ transitionDelay: `${i * 22}ms` }}
        >
          <span className="novu-stagger-label__top">{char === " " ? "\u00a0" : char}</span>
          <span className="novu-stagger-label__bottom">{char === " " ? "\u00a0" : char}</span>
        </span>
      ))}
    </span>
  );
}
