import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@edunudg/ui";
import { useAuth } from "@/bootstrap/AuthProvider";
import { platformNavSections, signOutNavItem } from "@/lib/portalNav";
import { displayUserFromAuth } from "@/lib/portalUser";

export function PlatformLayout() {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const profile = displayUserFromAuth(user);

  return (
    <AppShell
      portalLabel="Platform Owner"
      welcomeName={profile.name}
      user={profile}
      navSections={platformNavSections(pathname)}
      footerItems={[signOutNavItem(() => void signOut())]}
      showUpgradeCard={false}
    >
      <Outlet />
    </AppShell>
  );
}
