import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Card,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  Select,
  Textarea,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { listCenterAssessments, recordStudentAssessment } from "@/lib/centerAssessmentsApi";
import { fetchCenterStudentProgramContext } from "@/lib/centerStudentProgramApi";

function passFailLabel(passed: boolean | null | undefined): string {
  if (passed === true) return "Pass";
  if (passed === false) return "Fail";
  return "—";
}

export function CenterAssessmentsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [studentId, setStudentId] = useState("");
  const [assessmentType, setAssessmentType] = useState("level_check");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [passed, setPassed] = useState("");
  const [notes, setNotes] = useState("");
  const { bindClose, closeAddForm } = useAddFormCloser();

  const students = useQuery({
    queryKey: ["center-students-assessments", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("student_enrollments")
        .select("student_id, students(id, full_name)")
        .eq("center_id", centerId!)
        .eq("status", "active");
      const rows = supabaseList(data, qErr) as {
        student_id: string;
        students: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
      }[];
      return rows.map((r) => {
        const s = Array.isArray(r.students) ? r.students[0] : r.students;
        return { id: s?.id ?? r.student_id, full_name: s?.full_name ?? "Student" };
      });
    },
  });

  const programContext = useQuery({
    queryKey: ["center-student-program", centerId, studentId],
    enabled: !!centerId && !!studentId,
    queryFn: () => fetchCenterStudentProgramContext(centerId!, studentId),
  });

  const assessments = useQuery({
    queryKey: ["center-assessments", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterAssessments(centerId!),
  });

  useEffect(() => {
    setPassed("");
  }, [studentId]);

  const save = useMutation({
    mutationFn: async () => {
      if (!centerId || !studentId) throw new Error("Select a student");
      if (!programContext.data?.program_id) {
        throw new Error("Assign a course / program on the Students page before recording assessments.");
      }
      if (!programContext.data.current_level_id) {
        throw new Error("No current level — assign a program with published levels first.");
      }
      if (passed !== "pass" && passed !== "fail") {
        throw new Error("Select Pass or Fail");
      }
      clear();
      await recordStudentAssessment(centerId, {
        studentId,
        assessmentType,
        score: score ? parseFloat(score) : undefined,
        maxScore: maxScore ? parseFloat(maxScore) : undefined,
        notes,
        levelId: programContext.data.current_level_id,
        passed: passed === "pass",
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-assessments", centerId] });
      void qc.invalidateQueries({ queryKey: ["center-student-program", centerId, studentId] });
      setScore("");
      setMaxScore("");
      setNotes("");
      setPassed("");
      closeAddForm();
    },
    onError: capture,
  });

  if (!centerId) return <p className="ed-empty">Center context not found.</p>;

  const ctx = programContext.data;

  return (
    <>
      <PageTitle>Assessments</PageTitle>
      <MutationError message={error} />
      <AddFormSection
        buttonLabel="Record assessment"
        panelTitle="Record assessment"
        primaryAction={{
          onClick: () => save.mutate(),
          pending: save.isPending,
          disabled: !studentId || !passed,
        }}
      >
        {({ close }) => {
          bindClose(close);
          return (
            <>
              <Select
                label="Student"
                value={studentId}
                onChange={setStudentId}
                placeholder="Select student"
                options={(students.data ?? []).map((s) => ({ value: s.id, label: s.full_name }))}
              />

              {studentId && programContext.isLoading && (
                <p className="ed-text-sm ed-muted">Loading program context…</p>
              )}

              {studentId && programContext.error && (
                <p className="ed-text-sm ed-muted" role="alert">
                  {programContext.error instanceof Error
                    ? programContext.error.message
                    : "Unable to load program context."}
                </p>
              )}

              {ctx?.program_id && (
                <div className="ed-ops-program-context" style={{ marginBottom: "0.75rem" }}>
                  <p className="ed-text-sm">
                    <strong>Program:</strong> {ctx.program_name ?? "—"}
                  </p>
                  <p className="ed-text-sm">
                    <strong>Current level:</strong> {ctx.current_level_name ?? "All levels complete"}
                  </p>
                </div>
              )}

              {studentId && !programContext.isLoading && !ctx?.program_id && (
                <p className="ed-text-sm ed-muted">
                  No program assigned — go to Students and assign a course first.
                </p>
              )}

              <FormGrid>
                <Input label="Type" value={assessmentType} onChange={setAssessmentType} placeholder="level_check" />
                <Input label="Score" value={score} onChange={setScore} type="number" />
                <Input label="Max score" value={maxScore} onChange={setMaxScore} type="number" />
                <Select
                  label="Result"
                  value={passed}
                  onChange={setPassed}
                  options={[
                    { value: "", label: "Pass or fail…" },
                    { value: "pass", label: "Pass — advance to next level" },
                    { value: "fail", label: "Fail — stay on current level" },
                  ]}
                  editable
                />
              </FormGrid>
              <Textarea label="Notes" value={notes} onChange={setNotes} rows={2} />
            </>
          );
        }}
      </AddFormSection>

      <Card title="Recent assessments">
        <DataList
          items={assessments.data ?? []}
          empty="No assessments recorded yet."
          render={(row) => {
            const student = Array.isArray(row.students) ? row.students[0] : row.students;
            const level = Array.isArray(row.levels) ? row.levels[0] : row.levels;
            const program = Array.isArray(row.programs) ? row.programs[0] : row.programs;
            return (
              <ListRow>
                <div>
                  <strong>{student?.full_name ?? "Student"}</strong>
                  <div className="ed-text-sm ed-muted">
                    {program?.name ?? "Program"} · {level?.name ?? "Level"} · {row.assessment_type} · {row.assessed_at}
                    {row.score != null ? ` · ${row.score}${row.max_score != null ? ` / ${row.max_score}` : ""}` : ""}
                  </div>
                </div>
                <Badge tone={row.passed === true ? "success" : row.passed === false ? "warning" : "neutral"}>
                  {passFailLabel(row.passed)}
                </Badge>
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}
