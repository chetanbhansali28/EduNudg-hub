import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, FormGrid, Input, MutationError, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { inviteStudentPortalAccess, pinEnrollmentCurriculum } from "@/lib/studentPortalAdminApi";

type Props = { brandId: string; centerId: string };

export function CenterStudentPortalCard({ brandId, centerId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [studentId, setStudentId] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [curriculumVersionId, setCurriculumVersionId] = useState("");

  const students = useQuery({
    queryKey: ["center-students-portal", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("student_enrollments")
        .select("student_id, students(id, full_name, login_email, user_id)")
        .eq("center_id", centerId)
        .eq("status", "active");
      const rows = supabaseList(data, qErr) as unknown as {
        student_id: string;
        students: { id: string; full_name: string; login_email: string | null; user_id: string | null } | null;
      }[];
      return rows.map((r) => ({
        id: r.students?.id ?? r.student_id,
        full_name: r.students?.full_name ?? "Student",
        login_email: r.students?.login_email ?? null,
        user_id: r.students?.user_id ?? null,
      }));
    },
  });

  const enrollments = useQuery({
    queryKey: ["center-enrollments-portal", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("student_enrollments")
        .select("id, student_id, curriculum_version_id, students(full_name)")
        .eq("center_id", centerId)
        .eq("status", "active");
      return supabaseList(data, qErr) as unknown as {
        id: string;
        student_id: string;
        curriculum_version_id: string | null;
        students: { full_name: string } | { full_name: string }[] | null;
      }[];
    },
  });

  const curriculumVersions = useQuery({
    queryKey: ["brand-curriculum-versions", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("curriculum_versions")
        .select("id, version_number, programs(name)")
        .eq("brand_id", brandId)
        .eq("status", "published")
        .order("version_number", { ascending: false });
      return supabaseList(data, qErr) as {
        id: string;
        version_number: number;
        programs: { name: string } | { name: string }[] | null;
      }[];
    },
  });

  const invite = useMutation({
    mutationFn: async () => {
      if (!studentId || !loginEmail.trim()) throw new Error("Select student and enter login email");
      clear();
      await inviteStudentPortalAccess(studentId, loginEmail);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-students-portal", centerId] });
      setLoginEmail("");
    },
    onError: capture,
  });

  const pinCurriculum = useMutation({
    mutationFn: async () => {
      if (!enrollmentId || !curriculumVersionId) throw new Error("Select enrollment and curriculum");
      clear();
      await pinEnrollmentCurriculum(enrollmentId, curriculumVersionId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-enrollments-portal", centerId] });
    },
    onError: capture,
  });

  return (
    <Card title="Student portal access">
      <p className="ed-text-sm ed-muted">
        Invite students to the learn portal. They sign in with the login email and see progress on learn.*
      </p>
      <MutationError message={error} />
      <FormGrid>
        <Select
          label="Student"
          value={studentId}
          onChange={(id) => {
            setStudentId(id);
            const s = (students.data ?? []).find((x) => x.id === id);
            if (s?.login_email) setLoginEmail(s.login_email);
          }}
          placeholder="Select student"
          options={(students.data ?? []).map((s) => ({
            value: s.id,
            label: `${s.full_name}${s.user_id ? " (linked)" : ""}`,
          }))}
        />
        <Input label="Login email" value={loginEmail} onChange={setLoginEmail} type="email" />
      </FormGrid>
      <Button onClick={() => invite.mutate()} disabled={!studentId || !loginEmail.trim() || invite.isPending}>
        Save login email / invite
      </Button>

      <hr />

      <p className="ed-text-sm ed-muted">Pin curriculum on enrollment for the student progress ladder.</p>
      <FormGrid>
        <Select
          label="Enrollment"
          value={enrollmentId}
          onChange={setEnrollmentId}
          placeholder="Select enrollment"
          options={(enrollments.data ?? []).map((e) => {
            const name = Array.isArray(e.students) ? e.students[0]?.full_name : e.students?.full_name;
            return {
              value: e.id,
              label: `${name ?? "Student"}${e.curriculum_version_id ? " (curriculum set)" : ""}`,
            };
          })}
        />
        <Select
          label="Curriculum version"
          value={curriculumVersionId}
          onChange={setCurriculumVersionId}
          placeholder="Select version"
          options={(curriculumVersions.data ?? []).map((cv) => {
            const prog = Array.isArray(cv.programs) ? cv.programs[0] : cv.programs;
            return {
              value: cv.id,
              label: `v${cv.version_number} — ${prog?.name ?? "Program"}`,
            };
          })}
        />
      </FormGrid>
      <Button
        onClick={() => pinCurriculum.mutate()}
        disabled={!enrollmentId || !curriculumVersionId || pinCurriculum.isPending}
      >
        Pin curriculum
      </Button>
    </Card>
  );
}
