import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, CommerceWidgetCard, FormGrid, Input, MutationError, Select } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import {
  fetchStudentProfileAddress,
  upsertStudentDeliveryAddress,
} from "@/lib/studentProfileApi";

type Props = { brandId: string; centerId: string; layout?: "widget" | "page" };

const SHIPPING_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const emptyAddress = {
  address_line1: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
};

export function CenterStudentProfileAddressCard({
  brandId,
  centerId,
  layout = "page",
}: Props) {
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
    queryFn: () => fetchStudentProfileAddress(studentId),
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
      await upsertStudentDeliveryAddress(brandId, studentId, form);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-profile-address", studentId] });
    },
    onError: capture,
  });

  const studentSelect = (
    <Select
      label="Student Name"
      value={studentId}
      onChange={setStudentId}
      placeholder="Select student"
      options={(students.data ?? []).map((s) => ({ value: s.id, label: s.full_name }))}
    />
  );

  const addressBody = studentId ? (
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
        <Input label="Phone" type="tel" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
      </FormGrid>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        Save address
      </Button>
    </>
  ) : (
    <div className="ed-commerce-widget__placeholder">
      {SHIPPING_ICON}
      <span>Select a student to view or edit their shipping address.</span>
    </div>
  );

  return (
    <CommerceWidgetCard
      icon={SHIPPING_ICON}
      title={layout === "widget" ? "Shipping Directory" : "Student shipping addresses"}
      description={
        layout === "widget"
          ? "View and update delivery addresses for enrolled students."
          : "Update delivery address details for enrolled students. Required for per-student merchandise orders shipped to the student."
      }
    >
      <MutationError message={error} />
      {studentSelect}
      {addressBody}
    </CommerceWidgetCard>
  );
}
