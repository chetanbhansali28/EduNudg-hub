import { useMemo } from "react";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useStaffProfile } from "@/hooks/useStaffProfile";
import { shellActionHints, useShellContextCounts } from "@/hooks/useShellContextCounts";
import { buildWelcomeHeading, buildWelcomeSubtitle, firstNameFromDisplayName } from "@/lib/welcomeMessage";

export function useStaffShellWelcome(portalLabel: string) {
  const tenant = useTenant();
  const profile = useStaffProfile();
  const countsQuery = useShellContextCounts();

  const welcomeHeading = useMemo(
    () => buildWelcomeHeading(firstNameFromDisplayName(profile.name)),
    [profile.name]
  );

  const welcomeSubtitle = useMemo(() => {
    const hints = shellActionHints(tenant.portalType, countsQuery.data);
    return buildWelcomeSubtitle(portalLabel, hints);
  }, [portalLabel, tenant.portalType, countsQuery.data]);

  return {
    user: { name: profile.name, email: profile.email },
    welcomeHeading,
    welcomeSubtitle,
  };
}
