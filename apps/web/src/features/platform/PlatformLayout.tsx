import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { useStaffShellWelcome } from "@/hooks/useStaffShellWelcome";
import { platformNavSections, signOutNavItem } from "@/lib/portalNav";

export function PlatformLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const portalLabel = "Platform Owner";
  const welcome = useStaffShellWelcome(portalLabel);

  return (
    <AppShell
      portalLabel={portalLabel}
      welcomeHeading={welcome.welcomeHeading}
      welcomeSubtitle={welcome.welcomeSubtitle}
      user={welcome.user}
      navSections={platformNavSections(pathname)}
      footerItems={[signOutNavItem(() => void signOut())]}
      showUpgradeCard={false}
    >
      <Outlet />
    </AppShell>
  );
}
