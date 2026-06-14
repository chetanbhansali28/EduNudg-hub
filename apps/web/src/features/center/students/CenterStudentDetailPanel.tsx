import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  FormGrid,
  FormActions,
  Input,
  MutationError,
  Select,
  ToggleField,
} from "@edunudg/ui";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import {
  fetchStudentProfileAddress,
  upsertStudentDeliveryAddress,
} from "@/lib/studentProfileApi";
import { inviteStudentPortalAccess, pinEnrollmentProgram } from "@/lib/studentPortalAdminApi";
import { fetchCenterStudentProgramContext } from "@/lib/centerStudentProgramApi";
import { syncStudentBatchAssignments, type CenterStudentRow } from "@/lib/centerStudentsApi";
import { fetchAuthorizedPrograms, fetchCenterBatches } from "@/lib/centerBatchesApi";
import { fetchLevels } from "@/lib/curriculumApi";

type Props = {
  student: CenterStudentRow;
  brandId: string;
  centerId: string;
  onSaved?: () => void;
};

export function CenterStudentDetailPanel({ student, brandId, centerId, onSaved }: Props) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [loginEmail, setLoginEmail] = useState(student.login_email ?? "");
  const [address, setAddress] = useState({
    address_line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });
  const [selectedBatches, setSelectedBatches] = useState<string[]>(student.batch_ids);
  const [programId, setProgramId] = useState(student.program_id ?? "");
  const [levelId, setLevelId] = useState(student.starting_level_id ?? "");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const batches = useQuery({
    queryKey: ["center-batches", centerId],
    queryFn: () => fetchCenterBatches(centerId),
  });

  const programs = useQuery({
    queryKey: ["authorized-programs", centerId, brandId],
    queryFn: () => fetchAuthorizedPrograms(centerId, brandId),
  });

  const programLevels = useQuery({
    queryKey: ["student-assign-levels", programId],
    enabled: !!programId,
    queryFn: () => fetchLevels(programId),
  });

  const programContext = useQuery({
    queryKey: ["center-student-program", centerId, student.id],
    queryFn: () => fetchCenterStudentProgramContext(centerId, student.id),
  });

  const profile = useQuery({
    queryKey: ["student-profile-address", student.id],
    queryFn: () => fetchStudentProfileAddress(student.id),
  });

  useEffect(() => {
    setSelectedBatches(student.batch_ids);
    setLoginEmail(student.login_email ?? "");
    setProgramId(student.program_id ?? "");
    setLevelId(student.starting_level_id ?? "");
  }, [
    student.id,
    student.batch_ids,
    student.login_email,
    student.program_id,
    student.starting_level_id,
  ]);

  useEffect(() => {
    if (programId !== student.program_id) {
      setLevelId("");
    }
  }, [programId, student.program_id]);

  useEffect(() => {
    if (profile.data) {
      setAddress({
        address_line1: profile.data.address_line1 ?? "",
        city: profile.data.city ?? "",
        state: profile.data.state ?? "",
        pincode: profile.data.pincode ?? "",
        phone: profile.data.phone ?? "",
      });
    }
  }, [profile.data]);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["center-students", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-student-program", centerId, student.id] });
    onSaved?.();
  };

  const invite = useMutation({
    mutationFn: async () => {
      if (!loginEmail.trim()) throw new Error("Enter login email");
      clear();
      await inviteStudentPortalAccess(student.id, loginEmail);
    },
    onSuccess: () => {
      setSaveMessage("Portal invite sent.");
      invalidate();
    },
    onError: capture,
  });

  const saveAddress = useMutation({
    mutationFn: async () => {
      clear();
      await upsertStudentDeliveryAddress(brandId, student.id, address);
    },
    onSuccess: () => {
      setSaveMessage("Address saved.");
      void qc.invalidateQueries({ queryKey: ["student-profile-address", student.id] });
    },
    onError: capture,
  });

  const saveProgram = useMutation({
    mutationFn: async () => {
      if (!programId) throw new Error("Select a course / program");
      if (!levelId) throw new Error("Select the starting level");
      clear();
      await pinEnrollmentProgram(student.enrollment_id, programId, levelId);
    },
    onSuccess: () => {
      setSaveMessage("Course and starting level assigned — journey tracking is active.");
      invalidate();
    },
    onError: capture,
  });

  const saveBatches = useMutation({
    mutationFn: async () => {
      clear();
      await syncStudentBatchAssignments(student.id, centerId, selectedBatches);
    },
    onSuccess: () => {
      setSaveMessage("Batch assignments updated.");
      invalidate();
    },
    onError: capture,
  });

  const toggleBatch = (batchId: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  const portalLinked = !!student.user_id;
  const currentLevel = programContext.data?.current_level_name;
  const assignmentChanged =
    programId !== (student.program_id ?? "") || levelId !== (student.starting_level_id ?? "");

  return (
    <Card title={student.full_name}>
      <MutationError message={error} />
      {saveMessage && (
        <p className="ed-text-sm ed-success" role="status" aria-live="polite">
          {saveMessage}
        </p>
      )}

      <div className="ed-ops-detail-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <section>
          <h3 className="ed-text-sm" style={{ fontWeight: 700, margin: "0 0 0.5rem" }}>
            Course / program
          </h3>
          <p className="ed-text-sm ed-muted" style={{ margin: "0 0 0.65rem" }}>
            Assign the course and the level where this student is starting. Earlier levels are marked complete;
            assessments advance them through the program automatically.
          </p>
          <FormGrid columns={2}>
            <Select
              label="Program"
              value={programId}
              onChange={setProgramId}
              options={[
                { value: "", label: "Select program…" },
                ...(programs.data ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
              editable
            />
            <Select
              label="Starting level"
              value={levelId}
              onChange={setLevelId}
              options={[
                { value: "", label: programId ? "Select level…" : "Choose program first" },
                ...(programLevels.data ?? []).map((l) => ({
                  value: l.id,
                  label: l.abacus_level_code ? `${l.name} (${l.abacus_level_code})` : l.name,
                })),
              ]}
              editable
            />
            <FormActions>
              <Button
                onClick={() => saveProgram.mutate()}
                disabled={
                  saveProgram.isPending || !programId || !levelId || !assignmentChanged
                }
              >
                {student.program_id ? "Update assignment" : "Assign course"}
              </Button>
            </FormActions>
          </FormGrid>
          {student.program_name && (
            <p className="ed-text-sm" style={{ marginTop: "0.5rem" }}>
              Assigned: <strong>{student.program_name}</strong>
              {student.starting_level_name ? ` · started at ${student.starting_level_name}` : null}
              {currentLevel && currentLevel !== student.starting_level_name
                ? ` · now on ${currentLevel}`
                : null}
            </p>
          )}
          {programId && (programLevels.data ?? []).length === 0 && !programLevels.isLoading && (
            <p className="ed-text-sm ed-muted">This program has no levels yet — ask your brand admin.</p>
          )}
          {(programs.data ?? []).length === 0 && (
            <p className="ed-text-sm ed-muted">Ask your brand admin to authorize programs for this center.</p>
          )}
        </section>

        <section>
          <h3 className="ed-text-sm" style={{ fontWeight: 700, margin: "0 0 0.5rem" }}>Enrollment</h3>
          <p className="ed-text-sm ed-muted">
            {student.student_code ? `Code ${student.student_code} · ` : ""}
            Status: {student.enrollment_status}
          </p>
          {student.batch_names.length > 0 && (
            <div className="ed-ops-program-grid">
              {student.batch_names.map((name) => (
                <span key={name} className="ed-ops-batch-chip">
                  {name}
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="ed-text-sm" style={{ fontWeight: 700, margin: "0 0 0.5rem" }}>Portal access</h3>
          <FormGrid columns={2}>
            <Input label="Login email" value={loginEmail} onChange={setLoginEmail} editable />
            <FormActions>
              <Button onClick={() => invite.mutate()} disabled={invite.isPending || !loginEmail.trim()}>
                {portalLinked ? "Update invite" : "Send invite"}
              </Button>
            </FormActions>
          </FormGrid>
          {portalLinked && <Badge tone="success">Linked to login</Badge>}
        </section>

        <section>
          <h3 className="ed-text-sm" style={{ fontWeight: 700, margin: "0 0 0.5rem" }}>Batch assignments</h3>
          <div className="ed-ops-stagger">
            {(batches.data ?? []).map((b) => (
              <ToggleField
                key={b.id}
                label={`${b.name}${b.is_open_for_enrollment ? " (open)" : ""}`}
                checked={selectedBatches.includes(b.id)}
                onChange={() => toggleBatch(b.id)}
              />
            ))}
            {(batches.data ?? []).length === 0 && (
              <p className="ed-text-sm ed-muted">Create batches first to assign this student.</p>
            )}
          </div>
          <Button onClick={() => saveBatches.mutate()} disabled={saveBatches.isPending}>
            Save batches
          </Button>
        </section>

        <section>
          <h3 className="ed-text-sm" style={{ fontWeight: 700, margin: "0 0 0.5rem" }}>Delivery address</h3>
          <FormGrid columns={2}>
            <Input
              label="Address"
              value={address.address_line1}
              onChange={(v) => setAddress((a) => ({ ...a, address_line1: v }))}
              editable
            />
            <Input label="City" value={address.city} onChange={(v) => setAddress((a) => ({ ...a, city: v }))} editable />
            <Input label="State" value={address.state} onChange={(v) => setAddress((a) => ({ ...a, state: v }))} editable />
            <Input
              label="Pincode"
              value={address.pincode}
              onChange={(v) => setAddress((a) => ({ ...a, pincode: v }))}
              editable
            />
            <Input label="Phone" value={address.phone} onChange={(v) => setAddress((a) => ({ ...a, phone: v }))} editable />
          </FormGrid>
          <Button onClick={() => saveAddress.mutate()} disabled={saveAddress.isPending}>
            Save address
          </Button>
        </section>
      </div>
    </Card>
  );
}
