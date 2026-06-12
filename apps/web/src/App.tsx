import type { ReactNode } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ThemeProvider } from "@edunudg/ui";
import { AuthProvider } from "@/bootstrap/AuthProvider";
import { TenantProvider, useTenant } from "@/bootstrap/TenantProvider";
import { PortalDocumentHead } from "@/components/PortalDocumentHead";
import { shouldUseAdminThemeProvider } from "@/lib/appThemeShell";
import { AppRoutes } from "@/routes/AppRoutes";

function AppThemeShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const tenant = useTenant();
  if (!shouldUseAdminThemeProvider(tenant, pathname)) return <>{children}</>;
  return <ThemeProvider>{children}</ThemeProvider>;
}

export function App() {
  return (
    <TenantProvider>
      <PortalDocumentHead />
      <AuthProvider>
        <BrowserRouter>
          <AppThemeShell>
            <AppRoutes />
          </AppThemeShell>
        </BrowserRouter>
      </AuthProvider>
    </TenantProvider>
  );
}
