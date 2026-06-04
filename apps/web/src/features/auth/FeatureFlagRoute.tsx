import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

export function FeatureFlagRoute({ flag, children }: { flag: string; children: ReactNode }) {
  const enabled = useFeatureFlag(flag);
  if (!enabled) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
