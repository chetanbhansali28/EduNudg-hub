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
import { inviteStudentPortalAccess } from "@/lib/studentPortalAdminApi";
import { recordStudentLevelProgress } from "@/lib/centerLearnRecordsApi";
import { syncStudentBatchAssignments, type CenterStudentRow } from "@/lib/centerStudentsApi";
import { fetchCenterBatches } from "@/lib/centerBatchesApi";
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
  const [levelId, setLevelId] = useState("");
  const [progressStatus, setProgressStatus] = useState("in_progress");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const batches = useQuery({
    queryKey: ["center-batches", centerId],
    queryFn: () => fetchCenterBatches(centerId),
  });

  const profile = useQuery({
    queryKey: ["student-profile-address", student.id],
    queryFn: () => fetchStudentProfileAddress(student.id),
  });

  const levels = useQuery({
    queryKey: ["student-detail-levels", student.program_id],
    enabled: !!student.program_id,
    queryFn: () => fetchLevels(student.program_id!),
  });

  useEffect(() => {
    setSelectedBatches(student.batch_ids);
    setLoginEmail(student.login_email ?? "");
  }, [student.id, student.batch_ids, student.login_email]);

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

  const saveProgress = useMutation({
    mutationFn: async () => {
      const level = (levels.data ?? []).find((l) => l.id === levelId);
      if (!level) throw new Error("Select a level");
      clear();
      await recordStudentLevelProgress(centerId, student.id, level.name, progressStatus, level.id);
    },
    onSuccess: () => {
      setSaveMessage("Level progress recorded.");
      setLevelId("");
    },
    onError: capture,
  });

  const toggleBatch = (batchId: string) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  const portalLinked = !!student.user_id;

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

        {student.program_id && (
          <section>
            <h3 className="ed-text-sm" style={{ fontWeight: 700, margin: "0 0 0.5rem" }}>Record level progress</h3>
            <FormGrid columns={2}>
              <Select
                label="Level"
                value={levelId}
                onChange={setLevelId}
                options={[
                  { value: "", label: "Select level…" },
                  ...(levels.data ?? []).map((l) => ({ value: l.id, label: l.name })),
                ]}
                editable
              />
              <Select
                label="Status"
                value={progressStatus}
                onChange={setProgressStatus}
                options={[
                  { value: "in_progress", label: "In progress" },
                  { value: "completed", label: "Completed" },
                ]}
                editable
              />
            </FormGrid>
            <Button onClick={() => saveProgress.mutate()} disabled={saveProgress.isPending || !levelId}>
              Record progress
            </Button>
          </section>
        )}
      </div>
    </Card>
  );
}
