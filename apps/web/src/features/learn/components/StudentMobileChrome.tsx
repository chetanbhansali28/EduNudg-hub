import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { IconBolt, IconChart, IconClipboard, IconGraduation, IconHome, IconSettings } from "@edunudg/ui";
import { studentBottomNavItems } from "@/lib/portalNav";

const ICONS: Record<string, ReactNode> = {
  home: <IconHome width={22} height={22} />,
  progress: <IconChart width={22} height={22} />,
  events: <IconGraduation width={22} height={22} />,
  activity: <IconClipboard width={22} height={22} />,
  profile: <IconSettings width={22} height={22} />,
};

export function StudentMobileChrome() {
  const { pathname } = useLocation();
  const items = studentBottomNavItems(pathname);

  return (
    <>
      <Link to="/competitions" className="ed-sp-fab" aria-label="Quick actions">
        <IconBolt width={22} height={22} />
      </Link>
      <nav className="ed-sp-bottom-nav" aria-label="Student navigation">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={`ed-sp-bottom-nav__item${item.active ? " ed-sp-bottom-nav__item--active" : ""}`}
            aria-current={item.active ? "page" : undefined}
          >
            <span className="ed-sp-bottom-nav__icon">{ICONS[item.id]}</span>
            <span className="ed-sp-bottom-nav__label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
