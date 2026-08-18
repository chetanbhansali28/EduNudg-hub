import type { HomepageConfig } from "@/types/homepage";
import { EduLearnMark } from "./EduLearnCta";

type Props = {
  testimonials: HomepageConfig["testimonials"];
};

export function EduLearnTestimonials({ testimonials }: Props) {
  const items = testimonials.items.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section className="el-section" id="testimonials">
      <div className="el-section-inner">
        <div className="el-section-head">
          <h2>
            What our <EduLearnMark tone="green">lovely clients</EduLearnMark> say
          </h2>
        </div>
        <div className="el-quotes__grid">
          {items.map((item) => (
            <article key={`${item.author}-${item.quote.slice(0, 24)}`} className="el-quote-card">
              <div className="el-quotes__person">
                {item.avatarUrl ? (
                  <img src={item.avatarUrl} alt="" />
                ) : (
                  <span className="el-quotes__avatar" aria-hidden />
                )}
                <div>
                  <strong>{item.author}</strong>
                  {item.role ? <div>{item.role}</div> : null}
                </div>
              </div>
              <p className="el-quotes__stars" aria-label="5 star rating">
                ★★★★★
              </p>
              <p>{item.quote}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
