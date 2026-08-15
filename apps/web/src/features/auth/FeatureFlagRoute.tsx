import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useBrandFeatureFlagsReady, useFeatureFlag } from "@/hooks/useFeatureFlag";

export function FeatureFlagRoute({
  flag,
  children,
  fallback = "/app",
}: {
  flag: string;
  children: ReactNode;
  fallback?: string;
}) {
  const ready = useBrandFeatureFlagsReady();
  const enabled = useFeatureFlag(flag);
  if (!ready) return <p className="ed-empty">Loading…</p>;
  if (!enabled) return <Navigate to={fallback} replace />;
  return <>{children}</>;
}
