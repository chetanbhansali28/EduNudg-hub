import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DataList,
  FilterTabs,
  LeadKpiCard,
  LeadKpiGrid,
  PipelineDetailPlaceholder,
  PipelineEmptyState,
  PipelineListItem,
  PipelinePageHeader,
  PipelineWorkspace,
} from "@edunudg/ui";
import { CenterStudentDetailPanel } from "@/features/center/students/CenterStudentDetailPanel";
import { parseCenterStudentDetailTab } from "@/features/center/students/centerStudentDetailTabs";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import { fetchCenterStudents } from "@/lib/centerStudentsApi";
import {
  filterCenterStudents,
  studentPageCounts,
  studentProgramLabel,
  type StudentTabFilter,
} from "@/lib/centerStudentsHelpers";
import { markBatchJoinsSeen } from "@/lib/centerBatchesApi";
import { useTenant } from "@/bootstrap/TenantProvider";
import { initialsFromName } from "@/lib/welcomeMessage";
import "@/features/brand/franchiseApplications/franchiseApplications.css";
import "@/features/center/centerOps.css";

const ICON_SEARCH = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export function StudentsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const brandId = tenant.brandId;
  const [searchParams] = useSearchParams();
  const detailTab = parseCenterStudentDetailTab(searchParams.get("tab"));
  const deepLinkStudentId = searchParams.get("studentId");
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkStudentId);
  const [search, setSearch] = useState("");
  const [listFilter, setListFilter] = useState<StudentTabFilter>("all");
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
  const pageCounts = useMemo(() => studentPageCounts(allStudents), [allStudents]);
  const filteredStudents = useMemo(
    () => filterCenterStudents(allStudents, listFilter, search),
    [allStudents, listFilter, search]
  );

  useEffect(() => {
    if (deepLinkStudentId) {
      setSelectedId(deepLinkStudentId);
    }
  }, [deepLinkStudentId]);

  useEffect(() => {
    if (selectedId || filteredStudents.length === 0) return;
    if (deepLinkStudentId) return;
    setSelectedId(filteredStudents[0]!.id);
  }, [selectedId, filteredStudents, deepLinkStudentId]);

  const selected =
    filteredStudents.find((s) => s.id === selectedId) ?? allStudents.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (isMobile && selected && detailTab === "assessments") {
      setMobileDetailOpen(true);
    }
  }, [isMobile, selected, detailTab]);

  const selectStudent = (id: string) => {
    setSelectedId(id);
    if (isMobile) setMobileDetailOpen(true);
  };

  if (!centerId || !brandId) {
    return <p className="ed-empty">Center context not found.</p>;
  }

  const filterTabs = [
    { value: "all" as const, label: isMobile ? "All" : "All students", count: pageCounts.total },
    { value: "linked" as const, label: "Linked", count: pageCounts.linked },
    { value: "unassigned" as const, label: "Unassigned", count: pageCounts.unassigned },
  ];

  const listPanel = (
    <div className="ed-pipeline-list-panel">
      <DataList
        variant="pipeline"
        items={filteredStudents}
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
              meta={s.student_code ? `ID: ${s.student_code}` : studentProgramLabel(s)}
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
    </div>
  );

  const detailPanel = selected ? (
    <CenterStudentDetailPanel
      student={selected}
      brandId={brandId}
      centerId={centerId}
      initialTab={detailTab}
      onSaved={() => void students.refetch()}
    />
  ) : (
    <div className="ed-pipeline-list-panel">
      <PipelineDetailPlaceholder message="Select a student to manage enrollment, batches, portal access, and assessments." />
    </div>
  );

  return (
    <div className={`ed-franchise-apps-page${isMobile ? " ed-franchise-apps-page--detail-open" : ""}`}>
      <PipelinePageHeader
        title="Students"
        subtitle="Manage enrollments, batches, portal access, and record level assessments in one place."
        actions={
          isDesktop ? (
            <Link to="/app/leads">
              <Button>+ Add students</Button>
            </Link>
          ) : null
        }
      />

      <LeadKpiGrid>
        <LeadKpiCard
          label="Linked"
          value={pageCounts.linked}
          hint="Portal access"
          active={listFilter === "linked"}
          onClick={() => setListFilter("linked")}
        />
        <LeadKpiCard
          label="Unassigned"
          value={pageCounts.unassigned}
          hint="No batches"
          active={listFilter === "unassigned"}
          onClick={() => setListFilter("unassigned")}
        />
        <LeadKpiCard
          label="Programs"
          value={pageCounts.programs}
          hint="Course assigned"
        />
        <LeadKpiCard
          label={isMobile ? "All students" : "Total"}
          value={pageCounts.total}
          hint="Enrolled"
          tone="total"
          active={listFilter === "all"}
          onClick={() => setListFilter("all")}
        />
      </LeadKpiGrid>

      <div className="ed-franchise-apps-page__toolbar">
        <label className="ed-franchise-apps-page__search">
          <span className="ed-franchise-apps-page__search-icon">{ICON_SEARCH}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by student name or ID…"
            aria-label="Search students"
          />
        </label>
        <FilterTabs
          options={filterTabs}
          value={listFilter}
          onChange={setListFilter}
          aria-label="Student filter"
        />
      </div>

      {isMobile ? (
        listPanel
      ) : (
        <PipelineWorkspace
          detailOpen={!!selected}
          list={listPanel}
          detail={detailPanel}
        />
      )}

      {isMobile ? (
        <>
          <Link to="/app/leads" className="ed-franchise-apps-page__fab" aria-label="Add students">
            +
          </Link>
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
                initialTab={detailTab}
                onSaved={() => void students.refetch()}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
