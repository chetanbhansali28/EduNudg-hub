import { Link } from "react-router-dom";
import { formatDateTime } from "@/features/learn/studentFormatters";
import { StudentEmptyState } from "@/features/learn/components/StudentPortalShell";

export type ActivityEvent = {
  type: string;
  title: string;
  subtitle: string;
  occurred_at: string;
  href: string;
};

function activityIcon(type: string): string {
  switch (type) {
    case "level_progress":
      return "LV";
    case "assessment":
      return "EX";
    case "competition_registration":
      return "EV";
    case "competition_result":
      return "WIN";
    default:
      return "•";
  }
}

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <StudentEmptyState
        title="No activity yet"
        text="Level updates, exams, and competition news from your center will show up here."
      />
    );
  }

  return (
    <ul className="ed-sp-timeline">
      {events.map((ev, i) => (
        <li key={`${ev.type}-${ev.occurred_at}-${i}`} className="ed-sp-timeline__item">
          <span className="ed-sp-timeline__icon" aria-hidden>
            {activityIcon(ev.type)}
          </span>
          <div>
            <p className="ed-sp-timeline__title">
              <Link to={ev.href}>{ev.title}</Link>
            </p>
            <p className="ed-sp-timeline__sub">{ev.subtitle}</p>
            <p className="ed-sp-timeline__time">{formatDateTime(ev.occurred_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
