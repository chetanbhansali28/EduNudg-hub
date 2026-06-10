import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, FormGrid, Input, MutationError, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type Props = { brandId: string; centerId: string };

const emptyAddress = {
  address_line1: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
};

export function CenterStudentProfileAddressCard({ brandId, centerId }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [studentId, setStudentId] = useState("");
  const [form, setForm] = useState(emptyAddress);

  const students = useQuery({
    queryKey: ["center-students-for-merchandise-address", brandId, centerId],
    enabled: !!brandId && !!centerId,
    queryFn: async () => {
      const { data: enrollments, error: eErr } = await getSupabase()
        .from("student_enrollments")
        .select("student_id, students(id, full_name)")
        .eq("center_id", centerId)
        .eq("status", "active");
      if (eErr) throw eErr;
      const rows = supabaseList(enrollments, null) as {
        student_id: string;
        students: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
      }[];
      return rows.map((r) => {
        const student = Array.isArray(r.students) ? r.students[0] : r.students;
        return { id: student?.id ?? r.student_id, full_name: student?.full_name ?? "Student" };
      });
    },
  });

  const profile = useQuery({
    queryKey: ["student-profile-address", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error: pErr } = await getSupabase()
        .from("student_profiles")
        .select("address_line1, city, state, pincode, phone")
        .eq("student_id", studentId)
        .maybeSingle();
      if (pErr) throw pErr;
      return data;
    },
  });

  useEffect(() => {
    if (!studentId) {
      setForm(emptyAddress);
      return;
    }
    if (profile.data) {
      setForm({
        address_line1: profile.data.address_line1 ?? "",
        city: profile.data.city ?? "",
        state: profile.data.state ?? "",
        pincode: profile.data.pincode ?? "",
        phone: profile.data.phone ?? "",
      });
    } else if (!profile.isLoading) {
      setForm(emptyAddress);
    }
  }, [studentId, profile.data, profile.isLoading]);

  const save = useMutation({
    mutationFn: async () => {
      if (!studentId) throw new Error("Select a student");
      clear();
      const { error: uErr } = await getSupabase().from("student_profiles").upsert(
        {
          brand_id: brandId,
          student_id: studentId,
          address_line1: form.address_line1.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          pincode: form.pincode.trim() || null,
          phone: form.phone.trim() || null,
        },
        { onConflict: "student_id" }
      );
      if (uErr) throw uErr;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-profile-address", studentId] });
    },
    onError: capture,
  });

  return (
    <Card title="Student shipping addresses">
      <p className="ed-text-sm ed-muted">
        Update delivery address details for enrolled students. Required for per-student merchandise orders shipped to
        the student.
      </p>
      <MutationError message={error} />
      <FormGrid>
        <Select
          label="Student"
          value={studentId}
          onChange={setStudentId}
          placeholder="Select student"
          options={(students.data ?? []).map((s) => ({ value: s.id, label: s.full_name }))}
        />
      </FormGrid>
      {studentId ? (
        <>
          <FormGrid>
            <Input
              label="Address line 1"
              value={form.address_line1}
              onChange={(v) => setForm((f) => ({ ...f, address_line1: v }))}
            />
            <Input label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
            <Input label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />
            <Input label="Pincode" value={form.pincode} onChange={(v) => setForm((f) => ({ ...f, pincode: v }))} />
            <Input label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          </FormGrid>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save address
          </Button>
        </>
      ) : null}
    </Card>
  );
}
