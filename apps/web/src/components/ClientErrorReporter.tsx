import { useEffect, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useTenant } from "@/bootstrap/TenantProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { reportClientError } from "@/services/auth/clientErrorApi";

function reportFatal(message: string, stack: string | null | undefined, route: string, tenant: ReturnType<typeof useTenant>) {
  void reportClientError({
    message,
    stack,
    route,
    tenant,
  });
}

export function ClientErrorReporter({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const { pathname } = useLocation();

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportFatal(event.message || "window.onerror", event.error instanceof Error ? event.error.stack : null, pathname, tenant);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "unhandledrejection");
      const stack = reason instanceof Error ? reason.stack : null;
      reportFatal(message, stack, pathname, tenant);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname, tenant.portalType, tenant.brandId, tenant.centerId, tenant.hostname]);

  const onCatch = (error: Error, info: ErrorInfo) => {
    reportFatal(error.message, `${error.stack ?? ""}\n${info.componentStack ?? ""}`, pathname, tenant);
  };

  return <AppErrorBoundary onCatch={onCatch}>{children}</AppErrorBoundary>;
}
