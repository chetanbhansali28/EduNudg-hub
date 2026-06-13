import { Navigate, useParams } from "react-router-dom";

/** Legacy route — redirects to master-detail workspace with ?center= slug. */
export function BrandCenterDetailPage() {
  const { centerSlug = "" } = useParams<{ centerSlug: string }>();
  const q = centerSlug.trim() ? `?center=${encodeURIComponent(centerSlug)}` : "";
  return <Navigate to={`/app/centers${q}`} replace />;
}
