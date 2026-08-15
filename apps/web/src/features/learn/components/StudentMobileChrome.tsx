import { Link, useLocation } from "react-router-dom";
import { BottomNav, IconBolt } from "@edunudg/ui";
import { staffBottomNavFromSections, studentNavSections } from "@/lib/portalNav";
import { useBrandFeatureFlags } from "@/hooks/useFeatureFlag";

export function StudentMobileChrome() {
  const { pathname } = useLocation();
  const flags = useBrandFeatureFlags();
  const items = staffBottomNavFromSections(studentNavSections(pathname, flags));
  const competitionsOn = flags.competitions === true;

  return (
    <>
      {competitionsOn ? (
        <Link to="/competitions" className="ed-sp-fab" aria-label="Quick actions">
          <IconBolt width={22} height={22} />
        </Link>
      ) : null}
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
