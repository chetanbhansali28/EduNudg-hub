import type { HomepageFounderProfile } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";

type Props = {
  founders: HomepageFounderProfile[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Section id; `/about` uses `about-team` so homepage `#founders` still targets `/`. */
  id?: string;
};

export function MentorCard({ founder }: { founder: HomepageFounderProfile }) {
  const photoUrl = founder.photoUrl?.trim() || "";
  const roleBadge = founder.roleBadge?.trim() || "";
  const title = founder.title?.trim() || "";
  const companyLine =
    title && title.toLowerCase() !== roleBadge.toLowerCase() ? title : "";

  return (
    <article className="sa-mentor-card sa-reveal-item">
      <div className="sa-mentor-card__photo">
        {photoUrl ? (
          <MarketingBackgroundMedia src={photoUrl} />
        ) : (
          <span className="sa-mentor-card__initial" aria-hidden>
            {founder.name.charAt(0)}
          </span>
        )}
      </div>
      {roleBadge ? <p className="sa-mentor-card__badge">{roleBadge}</p> : null}
      <h3 className="sa-item-title sa-mentor-card__name">{founder.name}</h3>
      {companyLine ? <p className="sa-mentor-card__role">{companyLine}</p> : null}
    </article>
  );
}

export function MentorsSection({
  founders,
  eyebrow = "Our Mentors",
  title = "Meet Our Expert Mentors",
  subtitle = "Learn from the best in the industry—our mentors bring years of experience, knowledge, and passion to guide you on your learning journey.",
  id = "founders",
}: Props) {
  if (founders.length === 0) return null;

  return (
    <section className="sa-mentors sa-reveal" id={id}>
      <div className="sa-mentors__header sa-reveal-item">
        <span className="sa-mentors__badge">{eyebrow}</span>
        <h2 className="sa-section-title sa-mentors__title">{title}</h2>
        {subtitle ? <p className="sa-mentors__subtitle">{subtitle}</p> : null}
      </div>
      <div className="sa-mentors__track-wrap">
        <div className="sa-mentors__track sa-mentors__track--center">
          {founders.map((founder) => (
            <MentorCard key={founder.name} founder={founder} />
          ))}
        </div>
      </div>
    </section>
  );
}
