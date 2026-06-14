import { IconBell, IconClipboard, IconGraduation, IconHome, IconSettings, IconUsers, BottomNav } from "@edunudg/ui";
import { useLocation } from "react-router-dom";

const ICONS = {
  home: <IconHome width={22} height={22} />,
  leads: <IconClipboard width={22} height={22} />,
  students: <IconUsers width={22} height={22} />,
  batches: <IconGraduation width={22} height={22} />,
  settings: <IconSettings width={22} height={22} />,
};

const OPS_ROUTES = ["/app", "/app/leads", "/app/students", "/app/batches", "/app/settings"];

export function CenterOpsMobileChrome() {
  const { pathname } = useLocation();
  const onOpsRoute = OPS_ROUTES.some(
    (route) => pathname === route || (route !== "/app" && pathname.startsWith(`${route}/`))
  );

  if (!onOpsRoute) return null;

  const active = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

  return (
    <BottomNav
      aria-label="Center navigation"
      items={[
        { href: "/app", label: "Home", icon: ICONS.home, active: active("/app") },
        { href: "/app/leads", label: "Leads", icon: ICONS.leads, active: active("/app/leads") },
        { href: "/app/students", label: "Students", icon: ICONS.students, active: active("/app/students") },
        { href: "/app/batches", label: "Batches", icon: ICONS.batches, active: active("/app/batches") },
        { href: "/app/settings", label: "Settings", icon: ICONS.settings, active: active("/app/settings") },
      ]}
    />
  );
}

export function CenterOpsMobileBarEnd() {
  return (
    <button type="button" className="ed-header__icon-btn" aria-label="Notifications" disabled>
      <IconBell width={20} height={20} />
    </button>
  );
}
