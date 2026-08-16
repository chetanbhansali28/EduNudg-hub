import { useRef } from "react";
import type { HomepageConfig } from "@/types/homepage";
import { parseTestimonialAuthor } from "./testimonialHelpers";
import { useSparkTestimonialsCarousel } from "./useSparkTestimonialsCarousel";

type Props = {
  testimonials: HomepageConfig["testimonials"];
  eyebrow?: string;
};

function TestimonialCard({ item }: { item: HomepageConfig["testimonials"]["items"][number] }) {
  const { name, role } = parseTestimonialAuthor(item);
  const avatarUrl = item.avatarUrl?.trim() || "";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <article className="sa-testimonial-card sa-reveal-item">
      <div className="sa-testimonial-card__stars" aria-label="5 out of 5 stars">
        ★★★★★
      </div>
      <blockquote>{item.quote}</blockquote>
      <footer className="sa-testimonial-card__author">
        {avatarUrl ? (
          <img className="sa-testimonial-card__avatar" src={avatarUrl} alt="" loading="lazy" />
        ) : (
          <span className="sa-testimonial-card__avatar sa-testimonial-card__avatar--initials" aria-hidden>
            {initials || "?"}
          </span>
        )}
        <div className="sa-testimonial-card__meta">
          <strong>{name}</strong>
          {role ? <span>{role}</span> : null}
        </div>
      </footer>
    </article>
  );
}

export function TestimonialsSection({
  testimonials,
  eyebrow = "Our Feedbacks",
}: Props) {
  const items = testimonials.items ?? [];
  if (items.length === 0) return null;

  const title = testimonials.title?.trim() || "What Our Learners Are Saying";
  const subtitle =
    testimonials.subtitle?.trim() ||
    "Hear directly from our students about how our courses have transformed their careers and lives.";
  const trackRef = useRef<HTMLDivElement>(null);
  useSparkTestimonialsCarousel(trackRef, items.length);

  return (
    <section className="sa-testimonials sa-reveal" id="testimonials">
      <div className="sa-testimonials__header sa-reveal-item">
        <span className="sa-testimonials__badge">{eyebrow}</span>
        <h2 className="sa-section-title sa-testimonials__title">{title}</h2>
        <p className="sa-testimonials__subtitle">{subtitle}</p>
      </div>
      <div
        ref={trackRef}
        className="sa-testimonials__grid sa-testimonials__grid--center sa-testimonials__carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label={title}
      >
        {items.map((item, i) => (
          <TestimonialCard key={`${item.author}-${i}`} item={item} />
        ))}
      </div>
    </section>
  );
}
