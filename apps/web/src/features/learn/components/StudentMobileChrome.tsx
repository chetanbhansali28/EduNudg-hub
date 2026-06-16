import { Link, useLocation } from "react-router-dom";
import { BottomNav, IconBolt } from "@edunudg/ui";
import { staffBottomNavFromSections, studentNavSections } from "@/lib/portalNav";

export function StudentMobileChrome() {
  const { pathname } = useLocation();
  const items = staffBottomNavFromSections(studentNavSections(pathname));

  return (
    <>
      <Link to="/competitions" className="ed-sp-fab" aria-label="Quick actions">
        <IconBolt width={22} height={22} />
      </Link>
      <BottomNav
        navLabel="Student navigation"
        scrollable={items.length > 5}
        items={items.map((item) => ({
          href: item.href,
          label: item.label,
          icon: item.icon ?? null,
          active: item.active,
        }))}
      />
    </>
  );
}
