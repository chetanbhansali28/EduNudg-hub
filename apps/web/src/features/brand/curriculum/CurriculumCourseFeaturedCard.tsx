import { Badge, Button } from "@edunudg/ui";
import type { CurriculumProgram } from "@/lib/curriculumApi";
import { initialsFromName } from "@/lib/welcomeMessage";

export function CurriculumCourseFeaturedCard({
  course,
  programCount,
  onViewDetails,
}: {
  course: CurriculumProgram;
  programCount: number;
  onViewDetails: () => void;
}) {
  return (
    <article className="ed-ops-featured-card">
      <div className="ed-ops-featured-card__head">
        <span className="ed-ops-featured-card__avatar" aria-hidden>
          {initialsFromName(course.name)}
        </span>
        <div>
          <h3 className="ed-ops-featured-card__name">{course.name}</h3>
          <p className="ed-ops-featured-card__meta">{course.age_label ?? "All ages"}</p>
        </div>
        {course.is_active ? <span className="ed-ops-featured-card__linked">ACTIVE</span> : null}
      </div>
      <div className="ed-ops-featured-card__grid">
        <div>
          <p className="ed-ops-featured-card__label">Programs</p>
          <p className="ed-ops-featured-card__value">
            {programCount > 0 ? `${programCount} program${programCount === 1 ? "" : "s"}` : "No programs yet"}
          </p>
        </div>
        <div>
          <p className="ed-ops-featured-card__label">Status</p>
          <p className="ed-ops-featured-card__value">
            <Badge tone={course.is_active ? "success" : "default"}>
              {course.is_active ? "Active" : "Inactive"}
            </Badge>
          </p>
        </div>
      </div>
      <div className="ed-ops-featured-card__actions">
        <Button onClick={onViewDetails}>View course</Button>
      </div>
    </article>
  );
}
