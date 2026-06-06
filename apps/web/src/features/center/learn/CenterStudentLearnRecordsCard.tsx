import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, DataList, FormGrid, Input, ListRow, MutationError, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import {
  recordStudentCompetitionEntry,
  recordStudentLevelProgress,
} from "@/lib/centerLearnRecordsApi";

type Props = { brandId: string; centerId: string };

export function CenterStudentLearnRecordsCard({ brandId, centerId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [studentId, setStudentId] = useState("");
  const [levelName, setLevelName] = useState("");
  const [progressStatus, setProgressStatus] = useState("in_progress");
  const [competitionId, setCompetitionId] = useState("");
  const [resultRank, setResultRank] = useState("");
  const progressCloser = useAddFormCloser();
  const competitionCloser = useAddFormCloser();

  const students = useQuery({
    queryKey: ["center-students-learn", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("student_enrollments")
        .select("student_id, students(id, full_name)")
        .eq("center_id", centerId)
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

  const competitions = useQuery({
    queryKey: ["brand-competitions-active", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_competitions")
        .select("id, name")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .order("name");
      return supabaseList(data, qErr);
    },
  });

  const progressRows = useQuery({
    queryKey: ["center-student-progress", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("student_level_progress")
        .select("id, level_name, status, students(full_name)")
        .eq("center_id", centerId)
        .order("updated_at", { ascending: false })
        .limit(20);
      return supabaseList(data, qErr);
    },
  });

  const saveProgress = useMutation({
    mutationFn: async () => {
      if (!studentId || !levelName.trim()) throw new Error("Select student and enter level");
      clear();
      await recordStudentLevelProgress(centerId, studentId, levelName, progressStatus);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-student-progress", centerId] });
      setLevelName("");
      progressCloser.closeAddForm();
    },
    onError: capture,
  });

  const saveCompetition = useMutation({
    mutationFn: async () => {
      if (!studentId || !competitionId) throw new Error("Select student and competition");
      clear();
      await recordStudentCompetitionEntry(centerId, studentId, competitionId, resultRank);
    },
    onSuccess: () => {
      setCompetitionId("");
      setResultRank("");
      competitionCloser.closeAddForm();
    },
    onError: capture,
  });

  return (
    <Card title="Student progress & competitions">
      <p className="ed-text-sm ed-muted">Records appear on the student learn dashboard for linked parent accounts.</p>
      <MutationError message={error} />
      <AddFormSection
        buttonLabel="Record progress"
        panelTitle="Record progress"
        primaryAction={{
          onClick: () => saveProgress.mutate(),
          pending: saveProgress.isPending,
          disabled: !studentId || !levelName.trim(),
        }}
      >
        {({ close }) => {
          progressCloser.bindClose(close);
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
                <Input label="Level name" value={levelName} onChange={setLevelName} placeholder="e.g. Level 3" />
                <Select
                  label="Progress status"
                  value={progressStatus}
                  onChange={setProgressStatus}
                  options={[
                    { value: "in_progress", label: "In progress" },
                    { value: "completed", label: "Completed" },
                  ]}
                />
              </FormGrid>
            </>
          );
        }}
      </AddFormSection>

      <AddFormSection
        buttonLabel="Record competition entry"
        panelTitle="Record competition entry"
        primaryAction={{
          label: "Save",
          onClick: () => saveCompetition.mutate(),
          pending: saveCompetition.isPending,
          disabled: !studentId || !competitionId,
        }}
      >
        {({ close }) => {
          competitionCloser.bindClose(close);
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
                <Select
                  label="Competition"
                  value={competitionId}
                  onChange={setCompetitionId}
                  placeholder="Select competition"
                  options={(competitions.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                />
                <Input label="Result / rank" value={resultRank} onChange={setResultRank} placeholder="e.g. 2nd place" />
              </FormGrid>
            </>
          );
        }}
      </AddFormSection>

      <DataList
        items={progressRows.data ?? []}
        empty="No progress records yet."
        render={(row) => {
          const student = Array.isArray(row.students) ? row.students[0] : row.students;
          return (
            <ListRow>
              <div>
                <strong>{student?.full_name ?? "Student"}</strong> — {row.level_name}
                <div className="ed-text-sm ed-muted">{row.status}</div>
              </div>
            </ListRow>
          );
        }}
      />
    </Card>
  );
}
