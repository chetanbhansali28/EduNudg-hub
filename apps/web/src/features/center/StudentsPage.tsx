import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DataList,
  OpsListHeader,
  OpsMobileFab,
  OpsPageHeader,
  OpsSearchField,
  PipelineDetailPlaceholder,
  PipelineEmptyState,
  PipelineListItem,
  PipelineMasterDetail,
} from "@edunudg/ui";
import { CenterStudentDetailPanel } from "@/features/center/students/CenterStudentDetailPanel";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import { fetchCenterStudents, type CenterStudentRow } from "@/lib/centerStudentsApi";
import { markBatchJoinsSeen } from "@/lib/centerBatchesApi";
import { useTenant } from "@/bootstrap/TenantProvider";
import { initialsFromName } from "@/lib/welcomeMessage";
import "@/features/center/centerOps.css";

const LIST_PREVIEW = 8;

function studentProgramLabel(student: CenterStudentRow): string {
  if (!student.program_name) return "Not assigned";
  return student.starting_level_name
    ? `${student.program_name} · ${student.starting_level_name}`
    : student.program_name;
}

function matchesSearch(student: CenterStudentRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [student.full_name, student.student_code, student.login_email]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(q));
}

function FeaturedStudentCard({
  student,
  onViewDetails,
  onQuickBatch,
}: {
  student: CenterStudentRow;
  onViewDetails: () => void;
  onQuickBatch: () => void;
}) {
  return (
    <article className="ed-ops-featured-card">
      <div className="ed-ops-featured-card__head">
        <span className="ed-ops-featured-card__avatar" aria-hidden>
          {initialsFromName(student.full_name)}
        </span>
        <div>
          <h3 className="ed-ops-featured-card__name">{student.full_name}</h3>
          <p className="ed-ops-featured-card__meta">ID: {student.student_code ?? student.id.slice(0, 8).toUpperCase()}</p>
        </div>
        {student.user_id ? <span className="ed-ops-featured-card__linked">LINKED</span> : null}
      </div>
      <div className="ed-ops-featured-card__grid">
        <div>
          <p className="ed-ops-featured-card__label">Program</p>
          <p className="ed-ops-featured-card__value">{studentProgramLabel(student)}</p>
        </div>
        <div>
          <p className="ed-ops-featured-card__label">Portal access</p>
          <p className="ed-ops-featured-card__value">{student.user_id ? "● Active" : "Not linked"}</p>
        </div>
      </div>
      <div className="ed-ops-featured-card__actions">
        <Button onClick={onViewDetails}>View Details</Button>
        <Button variant="ghost" onClick={onQuickBatch}>
          Quick Batch
        </Button>
      </div>
    </article>
  );
}

export function StudentsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const brandId = tenant.brandId;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const { isDesktop, isMobile } = useOpsBreakpoint();
  const qc = useQueryClient();

  useEffect(() => {
    if (centerId) {
      void markBatchJoinsSeen(centerId)
        .then(() => qc.invalidateQueries({ queryKey: ["shell-context-counts"] }))
        .catch(() => undefined);
    }
  }, [centerId, qc]);

  const students = useQuery({
    queryKey: ["center-students", centerId, brandId],
    enabled: !!centerId && !!brandId,
    queryFn: () => fetchCenterStudents(centerId!, brandId!),
  });

  const allStudents = students.data ?? [];
  const filteredStudents = useMemo(
    () => allStudents.filter((student) => matchesSearch(student, search)),
    [allStudents, search]
  );

  useEffect(() => {
    if (selectedId || filteredStudents.length === 0) return;
    setSelectedId(filteredStudents[0]!.id);
  }, [selectedId, filteredStudents]);

  const selected = filteredStudents.find((s) => s.id === selectedId) ?? allStudents.find((s) => s.id === selectedId) ?? null;
  const listPreview = filteredStudents.slice(0, LIST_PREVIEW);

  const selectStudent = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileDetailOpen(false);
  };

  if (!centerId || !brandId) {
    return <p className="ed-empty">Center context not found.</p>;
  }

  const listPanel = (
    <div className="ed-pipeline-list-panel">
      {!isMobile ? <OpsListHeader title="Enrolled students" badge={`ACTIVE: ${allStudents.length}`} /> : null}
      <DataList
        variant="pipeline"
        items={isMobile ? listPreview : filteredStudents}
        empty={
          <PipelineEmptyState
            message="No active enrollments at this center."
            actionLabel="View leads"
            onAction={() => {
              window.location.href = "/app/leads";
            }}
          />
        }
        render={(s) => {
          const batchCount = s.batch_ids.length;
          return (
            <PipelineListItem
              title={s.full_name}
              meta={s.student_code ? `ID: ${s.student_code}` : undefined}
              lines={[
                batchCount > 0 ? `${batchCount} batch${batchCount === 1 ? "" : "es"}` : "No batches assigned",
                s.login_email ?? "No portal email",
              ]}
              initials={initialsFromName(s.full_name)}
              selected={s.id === selectedId}
              linked={!!s.user_id}
              onSelect={() => selectStudent(s.id)}
            />
          );
        }}
      />
      {isMobile && filteredStudents.length > LIST_PREVIEW ? (
        <p className="ed-ops-list-footer">
          <Link to="/app/students">View all {filteredStudents.length} students</Link>
        </p>
      ) : null}
      {isDesktop && filteredStudents.length > LIST_PREVIEW ? (
        <p className="ed-ops-list-footer">
          Showing {filteredStudents.length} enrolled students
        </p>
      ) : null}
    </div>
  );

  return (
    <div className={isMobile ? "ed-ops-pipeline-hide-detail" : undefined}>
      <OpsPageHeader
        title="Students"
        subtitle="Manage enrollments, portal access, batch assignments, and delivery details."
        action={
          isDesktop ? (
            <Link to="/app/leads">
              <Button>+ Add students</Button>
            </Link>
          ) : null
        }
      />

      <OpsSearchField
        value={search}
        onChange={setSearch}
        placeholder="Search by student name or ID…"
      />

      {isMobile ? (
        <>
          <OpsListHeader
            title={`Enrolled Students (${filteredStudents.length})`}
            badge={search ? "FILTERED" : undefined}
          />
          {listPanel}
          {selected ? (
            <FeaturedStudentCard
              student={selected}
              onViewDetails={() => setMobileDetailOpen(true)}
              onQuickBatch={() => setMobileDetailOpen(true)}
            />
          ) : null}
        </>
      ) : (
        <PipelineMasterDetail
          list={listPanel}
          detail={
            selected ? (
              <CenterStudentDetailPanel
                student={selected}
                brandId={brandId}
                centerId={centerId}
                onSaved={() => void students.refetch()}
              />
            ) : (
              <div className="ed-pipeline-list-panel">
                <PipelineDetailPlaceholder message="Select a student to manage portal access, batches, address, and progress." />
              </div>
            )
          }
        />
      )}

      {isMobile ? (
        <>
          <OpsMobileFab label="Add students" onClick={() => { window.location.href = "/app/leads"; }} />
          {mobileDetailOpen && selected ? (
            <div className="ed-ops-mobile-detail" role="dialog" aria-modal aria-label="Student details">
              <div className="ed-ops-mobile-detail__bar">
                <button type="button" className="ed-ops-mobile-detail__back" onClick={() => setMobileDetailOpen(false)}>
                  ← Back
                </button>
              </div>
              <CenterStudentDetailPanel
                student={selected}
                brandId={brandId}
                centerId={centerId}
                onSaved={() => void students.refetch()}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
