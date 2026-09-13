import { Link } from "react-router-dom";
import type { BrandDashboardHome } from "@/lib/brandDashboardHomeApi";

export function CenterHealthSummary({
  data,
  onNavigate,
}: {
  data: BrandDashboardHome;
  onNavigate?: () => void;
}) {
  const allComplete = data.centerHealthChecks.every((check) => check.met);

  return (
    <>
      <p className="ed-brand-dash__health-copy">
        {allComplete
          ? "100% setup complete. All checks passed."
          : `${data.centerHealthPercent}% setup complete. Each check is equally weighted.`}
      </p>
      <div className="ed-brand-dash__health-bar" aria-hidden>
        <span style={{ width: `${data.centerHealthPercent}%` }} />
      </div>
      <ul className="ed-brand-dash__health-checks">
        {data.centerHealthChecks.map((check) => (
          <li
            key={check.key}
            className={
              check.met ? "ed-brand-dash__health-check ed-brand-dash__health-check--met" : "ed-brand-dash__health-check"
            }
          >
            <span aria-hidden>{check.met ? "✓" : "•"}</span>
            {check.met ? (
              <span>{check.reason}</span>
            ) : (
              <Link to={check.href} onClick={onNavigate}>
                {check.reason}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
