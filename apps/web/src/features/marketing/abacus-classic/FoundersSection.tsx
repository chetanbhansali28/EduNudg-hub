import type { HomepageFounderProfile } from "@/types/homepage";

type Props = {
  founders: HomepageFounderProfile[];
};

export function FoundersSection({ founders }: Props) {
  if (founders.length === 0) return null;

  return (
    <section className="ac-founders" id="founders">
      <div className="ac-founders__inner">
        {founders.map((founder, index) => (
          <article key={`${founder.name}-${index}`} className="ac-founders__profile">
            <div className="ac-founders__media">
              {founder.photoUrl ? (
                <img src={founder.photoUrl} alt={founder.name} className="ac-founders__photo" />
              ) : (
                <div className="ac-founders__photo ac-founders__photo--placeholder" aria-hidden />
              )}
              {founder.statBadge ? (
                <div className="ac-founders__stat-badge">
                  <strong>{founder.statBadge.value}</strong>
                  <span>{founder.statBadge.label}</span>
                </div>
              ) : null}
            </div>
            <div className="ac-founders__copy">
              <span className="ac-founders__role">{founder.roleBadge}</span>
              <h2>{founder.name}</h2>
              <p className="ac-founders__title">{founder.title}</p>
              <p className="ac-founders__bio">{founder.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
