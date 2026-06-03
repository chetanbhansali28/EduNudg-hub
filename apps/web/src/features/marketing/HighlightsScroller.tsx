import { useRef } from "react";
import type { HomepageShowcaseCard } from "@/types/homepage";

function VoiceBars() {
  return (
    <div className="novu-highlight-card__voice" aria-hidden>
      <div className="novu-highlight-card__voice-pill">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="novu-highlight-card__bar" style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    </div>
  );
}

function PriorityList({ items }: { items: NonNullable<HomepageShowcaseCard["priorities"]> }) {
  const tagColors: Record<string, string> = {
    Work: "#F2FE80",
    Personal: "#E8D4FF",
    Health: "#B8F5D4",
    Brand: "#F2FE80",
    Franchise: "#E8D4FF",
    Parents: "#B8E4FF",
  };
  return (
    <ul className="novu-highlight-card__priorities">
      {items.map((p) => (
        <li key={p.label} className="novu-highlight-card__priority">
          <span className="novu-highlight-card__check" aria-hidden />
          <span className="novu-highlight-card__priority-label">{p.label}</span>
          <span
            className="novu-highlight-card__priority-tag"
            style={{ backgroundColor: tagColors[p.tag] ?? "#F2FE80" }}
          >
            {p.tag}
          </span>
        </li>
      ))}
    </ul>
  );
}

function HighlightCard({ card }: { card: HomepageShowcaseCard }) {
  const isDark = card.layout === "image-dark" || card.layout === "image-priorities" || card.layout === "image-watch" || card.layout === "image-weekly";

  return (
    <article className="novu-highlight-card-wrap">
      <div
        className={`novu-highlight-card novu-highlight-card--${card.layout}`}
        style={card.imageUrl && isDark ? { backgroundImage: `url(${card.imageUrl})` } : undefined}
      >
        {isDark && <div className="novu-highlight-card__top-fade" aria-hidden />}
        {isDark && <div className="novu-highlight-card__bottom-glow" aria-hidden />}

        <div className="novu-highlight-card__content">
          <h3 className="novu-highlight-card__title">
            {card.title} <em>{card.titleItalic}</em>
          </h3>
          <p className="novu-highlight-card__body">{card.body}</p>
        </div>

        {card.layout === "image-dark" && <VoiceBars />}

        {card.layout === "white-phone" && card.phoneImageUrl && (
          <div className="novu-highlight-card__phone-img">
            <img src={card.phoneImageUrl} alt="" draggable={false} />
          </div>
        )}

        {card.layout === "image-priorities" && card.priorities && (
          <div className="novu-highlight-card__priorities-wrap">
            <PriorityList items={card.priorities} />
          </div>
        )}
      </div>
    </article>
  );
}

export function HighlightsScroller({ cards }: { cards: HomepageShowcaseCard[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".novu-highlight-card-wrap");
    const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || "16") || 16;
    const w = card?.offsetWidth ?? 320;
    el.scrollBy({ left: dir * (w + gap), behavior: "smooth" });
  };

  return (
    <section className="novu-highlights" aria-label="Product highlights">
      <div ref={scrollerRef} className="novu-highlights__scroller">
        {cards.map((card) => (
          <HighlightCard key={card.id} card={card} />
        ))}
      </div>
      <div className="novu-highlights__controls">
        <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll highlights left">
          ←
        </button>
        <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll highlights right">
          →
        </button>
      </div>
    </section>
  );
}
