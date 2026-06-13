import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  ToggleField,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { DeleteConfirmButton } from "@/features/shared/DeleteConfirmButton";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import {
  fetchAuthorizedPrograms,
  fetchCenterBatches,
  softDeleteCenterBatch,
  upsertCenterBatch,
  type CenterBatchRow,
} from "@/lib/centerBatchesApi";
import { fetchLevels } from "@/lib/curriculumApi";
import "@/features/center/centerOps.css";

const emptyForm = {
  name: "",
  programId: "",
  levelStartId: "",
  levelEndId: "",
  isOpenForEnrollment: false,
};

function batchSubtitle(batch: CenterBatchRow): string {
  const program = batch.programs;
  const programName = Array.isArray(program) ? program[0]?.name : program?.name;
  const start = batch.level_start?.name ?? "?";
  const end = batch.level_end?.name ?? "?";
  return [programName, `${start} → ${end}`].filter(Boolean).join(" · ");
}

export function BatchesPage() {
  const tenant = useTenant();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const { bindClose, closeAddForm } = useAddFormCloser();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const centerId = tenant.centerId;
  const brandId = tenant.brandId;

  const batches = useQuery({
    queryKey: ["center-batches", centerId],
    enabled: !!centerId,
    queryFn: () => fetchCenterBatches(centerId!),
  });

  const programs = useQuery({
    queryKey: ["authorized-programs", centerId, brandId],
    enabled: !!centerId && !!brandId,
    queryFn: () => fetchAuthorizedPrograms(centerId!, brandId!),
  });

  const levels = useQuery({
    queryKey: ["batch-form-levels", form.programId],
    enabled: !!form.programId,
    queryFn: () => fetchLevels(form.programId),
  });

  const levelOptions = useMemo(
    () => (levels.data ?? []).map((l) => ({ value: l.id, label: l.name })),
    [levels.data]
  );

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["center-batches", centerId] });
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!centerId) throw new Error("Center required");
      clear();
      await upsertCenterBatch({
        batchId: editingId,
        centerId,
        name: form.name,
        programId: form.programId,
        levelStartId: form.levelStartId,
        levelEndId: form.levelEndId,
        isOpenForEnrollment: form.isOpenForEnrollment,
      });
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setForm(emptyForm);
      setFormOpen(false);
      closeAddForm();
    },
    onError: capture,
  });

  const remove = useMutation({
    mutationFn: async (batchId: string) => {
      clear();
      await softDeleteCenterBatch(batchId);
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const startEdit = (batch: CenterBatchRow) => {
    setEditingId(batch.id);
    setForm({
      name: batch.name,
      programId: batch.program_id ?? "",
      levelStartId: batch.level_start_id ?? "",
      levelEndId: batch.level_end_id ?? "",
      isOpenForEnrollment: batch.is_open_for_enrollment,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(false);
  };

  const programOptions = (programs.data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const canSave =
    form.name.trim() &&
    form.programId &&
    form.levelStartId &&
    form.levelEndId &&
    !save.isPending;

  if (!centerId || !brandId) {
    return <p className="ed-empty">Center context not found.</p>;
  }

  const noPrograms = (programs.data ?? []).length === 0;

  return (
    <>
      <PageTitle>Batches & Schedule</PageTitle>
      <MutationError message={error} />

      {noPrograms && (
        <div className="ed-ops-join-banner ed-ops-animate-in" role="status">
          <p className="ed-text-sm">
            Your brand has not authorized any programs for this center yet. Ask your brand admin to enable programs on
            the Centers page before creating batches.
          </p>
        </div>
      )}

      <AddFormSection
        buttonLabel="Create batch"
        panelTitle={editingId ? "Edit batch" : "Create batch"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) closeForm();
        }}
      >
        {({ close }) => {
          bindClose(close);
          return (
            <div className="ed-ops-animate-in">
              <FormGrid columns={2}>
                <Input
                  label="Batch name"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  editable
                />
                <Select
                  label="Course"
                  value={form.programId}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      programId: v,
                      levelStartId: "",
                      levelEndId: "",
                    }))
                  }
                  options={[{ value: "", label: "Select course…" }, ...programOptions]}
                  editable={!noPrograms}
                />
                <Select
                  label="Level start"
                  value={form.levelStartId}
                  onChange={(v) => setForm((f) => ({ ...f, levelStartId: v }))}
                  options={[{ value: "", label: "From level…" }, ...levelOptions]}
                  editable={!!form.programId}
                />
                <Select
                  label="Level end"
                  value={form.levelEndId}
                  onChange={(v) => setForm((f) => ({ ...f, levelEndId: v }))}
                  options={[{ value: "", label: "To level…" }, ...levelOptions]}
                  editable={!!form.programId}
                />
              </FormGrid>
              <ToggleField
                label="Open for student self-enrollment"
                description="Students at this center can join this batch instantly from their learn portal."
                checked={form.isOpenForEnrollment}
                onChange={(v) => setForm((f) => ({ ...f, isOpenForEnrollment: v }))}
              />
              <div className="ed-form-actions">
                <Button onClick={() => save.mutate()} disabled={!canSave || noPrograms}>
                  {editingId ? "Save batch" : "Create batch"}
                </Button>
                {editingId && (
                  <Button variant="ghost" onClick={close}>
                    Cancel edit
                  </Button>
                )}
              </div>
            </div>
          );
        }}
      </AddFormSection>

      <Card title="Active batches">
        <DataList
          items={batches.data ?? []}
          empty="No batches yet — create one to group students by course and level range."
          render={(batch) => (
            <ListRow
              aside={
                <>
                  <Button variant="ghost" onClick={() => startEdit(batch)}>
                    Edit
                  </Button>
                  <DeleteConfirmButton
                    onConfirm={() => remove.mutate(batch.id)}
                    confirmPending={remove.isPending}
                    title="Retire this batch?"
                    description="The batch is hidden from your active list and students can no longer self-enroll. Existing enrollments and history are kept."
                  >
                    Retire
                  </DeleteConfirmButton>
                </>
              }
            >
              <div className="ed-ops-stagger">
                <strong>{batch.name}</strong>
                <div className="ed-text-sm ed-muted">{batchSubtitle(batch)}</div>
                <div className="ed-ops-program-grid">
                  {batch.is_open_for_enrollment && (
                    <span className="ed-ops-batch-chip ed-ops-batch-chip--open">Open enrollment</span>
                  )}
                </div>
              </div>
            </ListRow>
          )}
        />
      </Card>
    </>
  );
}
