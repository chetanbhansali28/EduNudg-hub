type BadgeTone = "new" | "pending" | "approved" | "rejected" | "deleted" | "neutral";

type Props = {
  selected: boolean;
  badge: string;
  badgeTone: BadgeTone;
  when: string;
  title: string;
  location: string;
  onClick: () => void;
};

export function MerchandisePipelineListItem({
  selected,
  badge,
  badgeTone,
  when,
  title,
  location,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={`ed-franchise-app-list-item${selected ? " ed-franchise-app-list-item--selected" : ""}`}
      onClick={onClick}
    >
      <div className="ed-franchise-app-list-item__head">
        <span className={`ed-franchise-app-status-badge ed-franchise-app-status-badge--${badgeTone}`}>{badge}</span>
        {when ? <span className="ed-franchise-app-list-item__when">{when}</span> : <span />}
      </div>
      <p className="ed-franchise-app-list-item__title">{title}</p>
      <p className="ed-franchise-app-list-item__location">{location}</p>
    </button>
  );
}
