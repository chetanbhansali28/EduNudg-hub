import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  CatalogBreadcrumbs,
  CatalogCreateSlot,
  CatalogEnrollmentBadge,
  CatalogFab,
  CatalogFormPanel,
  CatalogListCard,
  CatalogPageHeader,
  CatalogToolbar,
  CatalogWorkspace,
  FilterTabs,
  FormGrid,
  Input,
  MutationError,
  Select,
  ToggleField,
} from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { ConfirmDeleteDialog } from "@/features/shared/ConfirmDeleteDialog";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import {
  fetchAuthorizedPrograms,
  fetchBatchEnrollmentCounts,
  fetchCenterBatches,
  softDeleteCenterBatch,
  upsertCenterBatch,
  type CenterBatchRow,
} from "@/lib/centerBatchesApi";
import {
  BATCH_SORT_OPTIONS,
  buildBatchListPresentation,
  buildProgramFilterOptions,
  exportBatchesCsv,
  filterBatchesByProgram,
  sortCenterBatches,
  type BatchProgramFilter,
  type BatchSort,
} from "@/lib/centerBatchesHelpers";
import { fetchLevels } from "@/lib/curriculumApi";
import "./batches/centerBatches.css";

const emptyForm = {
  name: "",
  programId: "",
  levelStartId: "",
  levelEndId: "",
  isOpenForEnrollment: false,
};

const BATCH_GROUP_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BOOK_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const LEVEL_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const STUDENT_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EDIT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const ARCHIVE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </svg>
);

function BatchMeta({
  programName,
  levelRange,
  enrollmentLabel,
  enrollmentTone,
}: {
  programName: string | null;
  levelRange: string;
  enrollmentLabel: string;
  enrollmentTone: "active" | "full" | "neutral";
}) {
  const enrollmentClass =
    enrollmentTone === "full"
      ? "ed-catalog-list-card__meta-item--full"
      : enrollmentTone === "active"
        ? "ed-catalog-list-card__meta-item--active"
        : "";

  return (
    <>
      {programName ? (
        <span className="ed-catalog-list-card__meta-item">
          {BOOK_ICON}
          {programName}
        </span>
      ) : null}
      <span className="ed-catalog-list-card__meta-item">
        {LEVEL_ICON}
        {levelRange}
      </span>
      <span className={`ed-catalog-list-card__meta-item ${enrollmentClass}`.trim()}>
        {STUDENT_ICON}
        {enrollmentLabel}
      </span>
    </>
  );
}

export function BatchesPage() {
  const tenant = useTenant();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const formRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [programFilter, setProgramFilter] = useState<BatchProgramFilter>("all");
  const [sort, setSort] = useState<BatchSort>("newest");
  const [retireBatchId, setRetireBatchId] = useState<string | null>(null);

  const centerId = tenant.centerId;
  const brandId = tenant.brandId;

  const batches = useQuery({
    queryKey: ["center-batches", centerId],
    enabled: !!centerId,
    queryFn: () => fetchCenterBatches(centerId!),
  });

  const enrollmentCounts = useQuery({
    queryKey: ["center-batch-enrollment-counts", centerId],
    enabled: !!centerId,
    queryFn: () => fetchBatchEnrollmentCounts(centerId!),
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
    () => (levels.data ?? []).map((level) => ({ value: level.id, label: level.name })),
    [levels.data]
  );

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["center-batches", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-batch-enrollment-counts", centerId] });
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
      closeForm();
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
    openForm();
  };

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(false);
  };

  const openForm = () => {
    setFormOpen(true);
  };

  useEffect(() => {
    if (!formOpen || !formRef.current) return;
    const frame = requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [formOpen, editingId]);

  const programOptions = (programs.data ?? []).map((program) => ({
    value: program.id,
    label: program.name,
  }));

  const canSave =
    form.name.trim() &&
    form.programId &&
    form.levelStartId &&
    form.levelEndId &&
    !save.isPending;

  const counts = enrollmentCounts.data ?? new Map<string, number>();
  const allBatches = batches.data ?? [];
  const filterOptions = buildProgramFilterOptions(programs.data ?? []);
  const visibleBatches = useMemo(() => {
    const filtered = filterBatchesByProgram(allBatches, programFilter);
    return sortCenterBatches(filtered, sort);
  }, [allBatches, programFilter, sort]);

  if (!centerId || !brandId) {
    return <p className="ed-empty">Center context not found.</p>;
  }

  const noPrograms = (programs.data ?? []).length === 0;

  const formPanel = (
    <div ref={formRef} id="center-batch-form">
      <CatalogFormPanel
        icon="+"
        title={editingId ? "Edit Batch" : "Add Batch"}
        description="Configure a new learning group for your center."
        footer={
          <>
            <Button onClick={() => save.mutate()} disabled={!canSave || noPrograms}>
              {editingId ? "Save Batch" : "Create Batch"}
            </Button>
            <Button variant="ghost" onClick={closeForm}>
              Cancel
            </Button>
          </>
        }
      >
        <FormGrid columns={2}>
          <Input
            label="Batch name"
            value={form.name}
            onChange={(value) => setForm((current) => ({ ...current, name: value }))}
            placeholder="e.g. Abacus - Evening"
            editable
          />
          <Select
            label="Select course"
            value={form.programId}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                programId: value,
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
            onChange={(value) => setForm((current) => ({ ...current, levelStartId: value }))}
            options={[{ value: "", label: "From level…" }, ...levelOptions]}
            editable={!!form.programId}
          />
          <Select
            label="Level end"
            value={form.levelEndId}
            onChange={(value) => setForm((current) => ({ ...current, levelEndId: value }))}
            options={[{ value: "", label: "To level…" }, ...levelOptions]}
            editable={!!form.programId}
          />
        </FormGrid>
        <ToggleField
          label="Open Enrollment"
          description="Allow student self-enrollment"
          checked={form.isOpenForEnrollment}
          onChange={(value) => setForm((current) => ({ ...current, isOpenForEnrollment: value }))}
        />
      </CatalogFormPanel>
    </div>
  );

  return (
    <div className="ed-center-batches-page">
      <CatalogPageHeader
        breadcrumbs={
          <CatalogBreadcrumbs
            items={[
              { label: "Curriculum", href: "/app/curriculum" },
              { label: "Batch Management" },
            ]}
          />
        }
        title="Active Batches"
        subtitle="Manage schedules, enrollment status, and course progression."
        actions={
          <Button
            variant="secondary"
            onClick={() => exportBatchesCsv(visibleBatches, counts)}
            disabled={visibleBatches.length === 0}
          >
            Export List
          </Button>
        }
      />
      <MutationError message={error} />

      {noPrograms ? (
        <div className="ed-center-batches-page__banner" role="status">
          <p className="ed-text-sm">
            Your brand has not authorized any programs for this center yet. Ask your brand admin to enable programs on
            the Centers page before creating batches.
          </p>
        </div>
      ) : null}

      <CatalogWorkspace
        asideOpen={formOpen}
        main={
          <>
            <CatalogToolbar
              tabs={
                <FilterTabs
                  options={filterOptions}
                  value={programFilter}
                  onChange={setProgramFilter}
                  variant="segmented"
                  aria-label="Batch course filter"
                />
              }
              meta={
                <Select
                  label="Sort"
                  value={sort}
                  onChange={(value) => setSort(value as BatchSort)}
                  options={BATCH_SORT_OPTIONS.map((option) => ({
                    value: option.value,
                    label: `Sort: ${option.label}`,
                  }))}
                />
              }
            />

            <div className="ed-catalog-list-panel">
              {batches.isLoading ? <p className="ed-text-sm ed-muted">Loading batches…</p> : null}
              {!batches.isLoading && visibleBatches.length === 0 ? (
                <p className="ed-text-sm ed-muted">No batches yet — create one to group students by course and level range.</p>
              ) : null}
              {visibleBatches.map((batch) => {
                const enrolled = counts.get(batch.id) ?? 0;
                const view = buildBatchListPresentation(batch, enrolled);
                return (
                  <CatalogListCard
                    key={batch.id}
                    icon={BATCH_GROUP_ICON}
                    accent={view.accent}
                    title={view.name}
                    badge={<CatalogEnrollmentBadge label={view.statusLabel} tone={view.statusTone} />}
                    meta={
                      <BatchMeta
                        programName={view.programName}
                        levelRange={view.levelRange}
                        enrollmentLabel={view.enrollmentLabel}
                        enrollmentTone={view.enrollmentTone}
                      />
                    }
                    actions={
                      <>
                        <button
                          type="button"
                          className="ed-catalog-list-card__icon-btn"
                          aria-label={`Edit ${view.name}`}
                          onClick={() => startEdit(batch)}
                        >
                          {EDIT_ICON}
                        </button>
                        <button
                          type="button"
                          className="ed-catalog-list-card__icon-btn ed-catalog-list-card__icon-btn--danger"
                          aria-label={`Retire ${view.name}`}
                          onClick={() => setRetireBatchId(batch.id)}
                        >
                          {ARCHIVE_ICON}
                        </button>
                      </>
                    }
                  />
                );
              })}
            </div>

            <CatalogCreateSlot
              label="Create another batch track"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                openForm();
              }}
            />
          </>
        }
        aside={formPanel}
      />

      <CatalogFab
        label="Add batch"
        onClick={() => {
          setEditingId(null);
          setForm(emptyForm);
          openForm();
        }}
      />

      <ConfirmDeleteDialog
        open={retireBatchId !== null}
        onClose={() => setRetireBatchId(null)}
        onConfirm={() => {
          if (retireBatchId) remove.mutate(retireBatchId);
          setRetireBatchId(null);
        }}
        title="Retire this batch?"
        description="The batch is hidden from your active list and students can no longer self-enroll. Existing enrollments and history are kept."
        confirmPending={remove.isPending}
      />
    </div>
  );
}
