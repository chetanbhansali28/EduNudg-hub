import type { ReactNode } from "react";
import { canAny, type Action, type Resource } from "@edunudg/permissions";
import { ThemeProvider } from "@edunudg/ui";
import { useMembership } from "@/hooks/useMembership";

export function RequirePermission({
  resource,
  action,
  children,
}: {
  resource: Resource;
  action: Action;
  children: ReactNode;
}) {
  const { data: memberships, isLoading } = useMembership();
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="ed-login">
          <p className="ed-empty">Checking access…</p>
        </div>
      </ThemeProvider>
    );
  }
  const roles = (memberships ?? []).map((m) => m.role_key);
  if (!canAny(roles, resource, action)) {
    return (
      <ThemeProvider>
        <div className="ed-login">
          <p className="ed-empty">You do not have access to audit logs.</p>
        </div>
      </ThemeProvider>
    );
  }
  return <>{children}</>;
}
