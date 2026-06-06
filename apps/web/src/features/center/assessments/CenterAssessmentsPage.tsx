import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, DataList, FormGrid, Input, ListRow, MutationError, PageTitle, Select, Textarea } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { listCenterAssessments, recordStudentAssessment } from "@/lib/centerAssessmentsApi";

export function CenterAssessmentsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [studentId, setStudentId] = useState("");
  const [assessmentType, setAssessmentType] = useState("level_check");
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
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

  const assessments = useQuery({
    queryKey: ["center-assessments", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterAssessments(centerId!),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!centerId || !studentId) throw new Error("Select a student");
      clear();
      await recordStudentAssessment(centerId, {
        studentId,
        assessmentType,
        score: score ? parseFloat(score) : undefined,
        maxScore: maxScore ? parseFloat(maxScore) : undefined,
        notes,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-assessments", centerId] });
      setScore("");
      setMaxScore("");
      setNotes("");
      closeAddForm();
    },
    onError: capture,
  });

  if (!centerId) return <p className="ed-empty">Center context not found.</p>;

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
          disabled: !studentId,
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
              <FormGrid>
                <Input label="Type" value={assessmentType} onChange={setAssessmentType} placeholder="level_check" />
                <Input label="Score" value={score} onChange={setScore} type="number" />
                <Input label="Max score" value={maxScore} onChange={setMaxScore} type="number" />
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
              return (
                <ListRow>
                  <div>
                    <strong>{student?.full_name ?? "Student"}</strong>
                    <div className="ed-text-sm ed-muted">
                      {row.assessment_type} · {row.assessed_at}
                      {row.score != null ? ` · ${row.score}${row.max_score != null ? ` / ${row.max_score}` : ""}` : ""}
                    </div>
                  </div>
                </ListRow>
              );
            }}
          />
      </Card>
    </>
  );
}
