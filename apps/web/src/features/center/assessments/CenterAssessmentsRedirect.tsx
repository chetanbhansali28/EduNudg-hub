import { Navigate, useSearchParams } from "react-router-dom";

/** Legacy route — assessments recording now lives on the Students page. */
export function CenterAssessmentsRedirect() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const next = new URLSearchParams({ tab: "assessments" });
  if (studentId) next.set("studentId", studentId);
  return <Navigate to={`/app/students?${next.toString()}`} replace />;
}
