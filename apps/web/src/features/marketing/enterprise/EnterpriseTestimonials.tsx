import type { HomepageConfig } from "@/types/homepage";

type Props = {
  testimonials: HomepageConfig["testimonials"];
};

export function EnterpriseTestimonials({ testimonials }: Props) {
  const items = testimonials.items;
  const doubled = [...items, ...items];

  return (
    <section id="testimonials" className="ent-testimonials ent-reveal">
      <div className="ent-testimonials__header">
        <h2>{testimonials.title}</h2>
        <p>{testimonials.subtitle}</p>
      </div>
      <div className="ent-testimonials__marquee" aria-hidden={items.length === 0}>
        {doubled.map((t, i) => (
          <article key={`${t.quote}-${i}`} className="ent-testimonials__card">
            <p>&ldquo;{t.quote}&rdquo;</p>
            <span className="ent-testimonials__author">{t.author}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
