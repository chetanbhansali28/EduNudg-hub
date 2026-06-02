import type { HomepageConfig } from "@/types/homepage";
import { AppleIcon } from "./AppleIcon";

function Stars() {
  return (
    <div className="novu-testimonial-card__stars" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.6 5.7 21.2l1.7-7L2 9.5l7.1-.6L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ quote, author }: { quote: string; author: string }) {
  return (
    <article className="novu-testimonial-card">
      <Stars />
      <p>&ldquo;{quote}&rdquo;</p>
      <div className="novu-testimonial-card__author">
        <AppleIcon />
        <span>{author}</span>
      </div>
    </article>
  );
}

export function TestimonialsCarousel({ testimonials }: { testimonials: HomepageConfig["testimonials"] }) {
  const items = testimonials.items;
  const doubled = [...items, ...items];

  const titleParts = testimonials.title.match(/^(.+?)(\s*)(\S+\.?)$/);
  const titleMain = titleParts?.[1] ?? testimonials.title;
  const titleSerif = titleParts?.[3] ?? "";

  return (
    <section id="testimonials" data-nav-theme="light" className="novu-testimonials-section">
      <div className="novu-testimonials-section__header novu-reveal">
        <h2>
          {titleMain} <span className="serif">{titleSerif}</span>
        </h2>
        <p>{testimonials.subtitle}</p>
      </div>
      <div className="novu-testimonials-section__marquee-wrap">
        <div className="novu-testimonials-section__marquee">
          {doubled.map((t, i) => (
            <TestimonialCard key={`${t.quote}-${i}`} quote={t.quote} author={t.author} />
          ))}
        </div>
      </div>
    </section>
  );
}
