import { Link } from "react-router-dom";

export function QuickActionStrip({ actions }: { actions: { label: string; href: string }[] }) {
  return (
    <div className="ed-sp-actions">
      {actions.map((action) => (
        <Link key={action.href} className="ed-sp-action" to={action.href}>
          {action.label}
        </Link>
      ))}
    </div>
  );
}
