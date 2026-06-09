import type { HomepageFounderProfile } from "@/types/homepage";
import { MarketingBackgroundMedia } from "../MarketingBackgroundMedia";

type Props = {
  founders: HomepageFounderProfile[];
  eyebrow?: string;
  title?: string;
  subtitle?: string;
};

export function MentorCard({ founder }: { founder: HomepageFounderProfile }) {
  const photoUrl = founder.photoUrl?.trim() || "";

  return (
    <article className="sa-mentor-card">
      <div className="sa-mentor-card__photo">
        {photoUrl ? (
          <MarketingBackgroundMedia src={photoUrl} />
        ) : (
          <span className="sa-mentor-card__initial" aria-hidden>
            {founder.name.charAt(0)}
          </span>
        )}
      </div>
      <h3 className="sa-mentor-card__name">{founder.name}</h3>
      <p className="sa-mentor-card__role">{founder.title || founder.roleBadge}</p>
    </article>
  );
}

export function MentorsSection({
  founders,
  eyebrow = "Our Mentors",
  title = "Meet Our Expert Mentors",
  subtitle = "Learn from the best in the industry—our mentors bring years of experience, knowledge, and passion to guide you on your learning journey.",
}: Props) {
  if (founders.length === 0) return null;

  return (
    <section className="sa-mentors" id="founders">
      <div className="sa-mentors__header">
        <span className="sa-mentors__badge">{eyebrow}</span>
        <h2 className="sa-mentors__title">{title}</h2>
        {subtitle ? <p className="sa-mentors__subtitle">{subtitle}</p> : null}
      </div>
      <div className="sa-mentors__track-wrap">
        <div className="sa-mentors__track">
          {founders.map((founder) => (
            <MentorCard key={founder.name} founder={founder} />
          ))}
        </div>
      </div>
    </section>
  );
}
