import type { HomepageFounderProfile } from "@/types/homepage";
import { EduLearnMark } from "./EduLearnCta";

type Props = {
  founders: HomepageFounderProfile[];
};

export function EduLearnMentors({ founders }: Props) {
  if (founders.length === 0) return null;

  return (
    <section className="el-section" id="founders">
      <div className="el-section-inner">
        <div className="el-section-head">
          <h2>
            Meet our <EduLearnMark>leadership</EduLearnMark>
          </h2>
        </div>
        <div className="el-mentors__grid">
          {founders.map((founder, index) => {
            const roleBadge = founder.roleBadge?.trim() || "";
            const title = founder.title?.trim() || "";
            return (
              <article key={`${founder.name}-${index}`} className="el-mentor-card">
                {founder.photoUrl ? (
                  <img className="el-mentor-card__photo" src={founder.photoUrl} alt="" />
                ) : (
                  <div className="el-mentor-card__photo el-mentor-card__photo--empty" aria-hidden>
                    {founder.name.charAt(0)}
                  </div>
                )}
                {roleBadge ? <p className="el-mentor-card__badge">{roleBadge}</p> : null}
                <h3>{founder.name}</h3>
                {title ? <p className="el-mentor-card__title">{title}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
