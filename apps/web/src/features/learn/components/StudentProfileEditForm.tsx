import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, MutationError } from "@edunudg/ui";
import { StudentPhotoUpload } from "@/features/learn/components/StudentPhotoUpload";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import {
  type StudentProfilePayload,
  type UpdateStudentSelfProfileInput,
  updateStudentSelfProfile,
} from "@/lib/studentLearnApi";

type Props = {
  brandId: string;
  student: StudentProfilePayload["student"];
  email?: string;
};

function toForm(student: StudentProfilePayload["student"]): UpdateStudentSelfProfileInput {
  return {
    fullName: student.full_name,
    dateOfBirth: student.date_of_birth ?? "",
    schoolName: student.profile.school_name ?? "",
    city: student.profile.city ?? "",
    pincode: student.profile.pincode ?? "",
    addressLine1: student.profile.address_line1 ?? "",
    state: student.profile.state ?? "",
    phone: student.profile.phone ?? "",
    photoUrl: student.profile.photo_url ?? "",
  };
}

export function isStudentProfileFormValid(form: UpdateStudentSelfProfileInput): boolean {
  return (
    form.fullName.trim().length >= 2 &&
    !!form.dateOfBirth.trim() &&
    !!form.phone.trim() &&
    !!form.pincode.trim() &&
    !!form.photoUrl.trim()
  );
}

export function StudentProfileEditForm({ brandId, student, email }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(() => toForm(student));

  useEffect(() => {
    setForm(toForm(student));
  }, [student]);

  const save = useMutation({
    mutationFn: async () => {
      clear();
      return updateStudentSelfProfile(brandId, form);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-profile", brandId] });
      void qc.invalidateQueries({ queryKey: ["student-learn-home", brandId] });
    },
    onError: capture,
  });

  const canSave = isStudentProfileFormValid(form) && !save.isPending;

  return (
    <div className="ed-sp-profile-form">
      <MutationError message={error} />

      <div className="ed-sp-profile-form__hero">
        <StudentPhotoUpload
          brandId={brandId}
          studentId={student.id}
          currentPhotoUrl={form.photoUrl}
          onUploaded={(url) => setForm((f) => ({ ...f, photoUrl: url }))}
          disabled={save.isPending}
          required
          hero
        />
        <div className="ed-sp-profile-form__hero-fields">
          <Input
            label="Full name *"
            value={form.fullName}
            onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
            editable
          />
          {email ? <Input label="Email" value={email} onChange={() => {}} disabled /> : null}
        </div>
      </div>

      <div className="ed-sp-profile-form__body">
        <div className="ed-sp-profile-form__grid">
          <Input
            label="Date of birth *"
            type="date"
            value={form.dateOfBirth}
            onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
            editable
          />
          <Input
            label="Phone number *"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="+91…"
            editable
          />
        </div>

        <Input
          label="Address line"
          value={form.addressLine1 ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, addressLine1: v }))}
          editable
        />

        <div className="ed-sp-profile-form__grid">
          <Input
            label="City"
            value={form.city ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, city: v }))}
            editable
          />
          <Input
            label="State"
            value={form.state ?? ""}
            onChange={(v) => setForm((f) => ({ ...f, state: v }))}
            editable
          />
        </div>

        <div className={student.student_code ? "ed-sp-profile-form__grid" : undefined}>
          <Input
            label="Pincode *"
            value={form.pincode}
            onChange={(v) => setForm((f) => ({ ...f, pincode: v }))}
            editable
          />
          {student.student_code ? (
            <Input label="Student code" value={student.student_code} onChange={() => {}} disabled />
          ) : null}
        </div>

        <Input
          label="School name"
          value={form.schoolName ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, schoolName: v }))}
          editable
        />
      </div>

      <div className="ed-sp-profile-form__save">
        <Button onClick={() => save.mutate()} disabled={!canSave} block>
          {save.isPending ? "Saving your profile…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}
