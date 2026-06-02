import type { ReactNode } from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import { ThemeProvider } from "@edunudg/ui";
import { AuthProvider } from "@/bootstrap/AuthProvider";
import { TenantProvider } from "@/bootstrap/TenantProvider";
import { AppRoutes } from "@/routes/AppRoutes";

function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isMarketing =
    pathname === "/" || pathname === "/login" || pathname.startsWith("/login");
  if (isMarketing) return <>{children}</>;
  return <ThemeProvider>{children}</ThemeProvider>;
}

export function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell>
            <AppRoutes />
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </TenantProvider>
  );
}
