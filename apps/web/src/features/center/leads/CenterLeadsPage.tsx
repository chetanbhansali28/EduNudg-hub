import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FilterTabs,
  LeadKpiCard,
  LeadKpiGrid,
  MutationError,
  PipelinePageHeader,
  PipelinePanel,
  PipelineTableToolbar,
  PipelineWorkspace,
} from "@edunudg/ui";
import { ManualStudentLeadCard } from "@/features/shared/manualLeads/ManualStudentLeadCard";
import { isLeadStale } from "@/lib/leadSla";
import {
  convertLeadToStudent,
  listCenterLeads,
  markLeadLost,
  updateLeadStatus,
  type LeadRow,
  type LeadStatus,
} from "@/lib/leadsApi";
import {
  computeLeadPipelineStats,
  convertedPipelineHint,
  countEligibleBulkConvertLeads,
  filterCenterLeads,
  formatLeadListDate,
  LEAD_FILTER_OPTIONS,
  LEAD_PAGE_SIZE,
  leadDisplayName,
  leadListStatusBadge,
  leadLocationLine,
  lostPipelineHint,
  openPipelineHint,
  paginateItems,
  paginationLabel,
  summarizeBulkConvertResult,
  type LeadFilter,
} from "@/lib/centerLeadsHelpers";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { bulkConvertCenterLeads } from "@/lib/centerStudentLeadImportApi";
import { CenterLeadDetailPanel } from "./CenterLeadDetailPanel";
import { CenterStudentLeadImportDialog } from "./CenterStudentLeadImportDialog";
import "@/features/brand/franchiseApplications/franchiseApplications.css";
import "./centerLeads.css";

const ICON_SEARCH = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

const ICON_PIN = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

function slaHint(lead: LeadRow, now: number): string | null {
  if (!lead.center_id || lead.status === "converted" || lead.status === "lost") return null;
  if (isLeadStale(lead, now)) {
    return "Brand SLA expired — center may be reallocated if status is not updated.";
  }
  if (lead.last_center_action_at && lead.assigned_at) {
    const acted = new Date(lead.last_center_action_at).getTime() >= new Date(lead.assigned_at).getTime();
    if (acted) return "Status updates reset the brand SLA clock.";
  }
  if (lead.stale_at) {
    const daysLeft = Math.ceil((new Date(lead.stale_at).getTime() - now) / (24 * 60 * 60 * 1000));
    if (daysLeft > 0) return `${daysLeft}d until brand SLA review`;
  }
  return "Update status after each parent contact (resets SLA).";
}

export function CenterLeadsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const centerSlug = tenant.centerSlug ?? "center";
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [filter, setFilter] = useState<LeadFilter>("open");
  const [search, setSearch] = useState("");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [convertAllMode, setConvertAllMode] = useState(false);
  const [bulkConvertMessage, setBulkConvertMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lostMode, setLostMode] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [convertMode, setConvertMode] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["center-leads", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-dashboard-home", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-students"] });
    void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
  };

  const leads = useQuery({
    queryKey: ["center-leads", centerId],
    enabled: !!centerId,
    queryFn: () => listCenterLeads(centerId!),
  });

  const selected = (leads.data ?? []).find((row) => row.id === selectedId) ?? null;

  const closeDetail = () => {
    setSelectedId(null);
    setLostMode(false);
    setLostReason("");
    setConvertMode(false);
  };

  const selectLead = (id: string) => {
    setSelectedId(id);
    setLostMode(false);
    setLostReason("");
    setConvertMode(false);
  };

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      clear();
      await updateLeadStatus(id, status);
    },
    onSuccess: invalidate,
    onError: capture,
  });

  const convert = useMutation({
    mutationFn: async ({
      id,
      overrides,
    }: {
      id: string;
      overrides: {
        parentName: string;
        childName: string;
        childDob: string;
        schoolName: string;
        city: string;
        pincode: string;
      };
    }) => {
      clear();
      await convertLeadToStudent(id, overrides);
    },
    onSuccess: () => {
      invalidate();
      setConvertMode(false);
      closeDetail();
    },
    onError: capture,
  });

  const markLost = useMutation({
    mutationFn: async () => {
      if (!selectedId || !lostReason.trim()) return;
      clear();
      await markLeadLost(selectedId, lostReason.trim());
    },
    onSuccess: () => {
      invalidate();
      closeDetail();
    },
    onError: capture,
  });

  const bulkConvert = useMutation({
    mutationFn: async () => {
      if (!centerId) return null;
      clear();
      setBulkConvertMessage(null);
      const { result, error: rpcError } = await bulkConvertCenterLeads(centerId);
      if (rpcError || !result) throw new Error(rpcError ?? "Bulk convert failed.");
      return result;
    },
    onSuccess: (result) => {
      if (!result) return;
      setBulkConvertMessage(summarizeBulkConvertResult(result));
      setConvertAllMode(false);
      invalidate();
      closeDetail();
    },
    onError: capture,
  });

  const now = Date.now();
  const allLeads = leads.data ?? [];
  const stats = useMemo(() => computeLeadPipelineStats(allLeads, now), [allLeads, now]);
  const eligibleBulkConvertCount = useMemo(() => countEligibleBulkConvertLeads(allLeads), [allLeads]);

  const filtered = useMemo(() => {
    return filterCenterLeads(allLeads, filter, search);
  }, [allLeads, filter, search]);

  const applyFilter = (value: LeadFilter) => {
    setFilter(value);
    setPage(1);
    setConvertAllMode(false);
  };

  const openAddLead = () => setAddLeadOpen(true);

  const pageItems = useMemo(() => paginateItems(filtered, page, LEAD_PAGE_SIZE), [filtered, page]);

  const filterTabs = LEAD_FILTER_OPTIONS.map((option) => ({
    ...option,
    count: stats[option.value === "open" ? "open" : option.value],
  }));

  const openHint = openPipelineHint(stats);
  const lostHint = lostPipelineHint(stats);

  if (!centerId) return <p className="ed-empty">Center context not found.</p>;

  const selectedPipeline =
    selected && selected.status !== "converted" && selected.status !== "lost";
  const selectedHint = selected ? slaHint(selected, now) : null;

  return (
    <div className="ed-franchise-apps-page ed-center-leads-page">
      <PipelinePageHeader
        title="Leads"
        subtitle="Call parents on WhatsApp, update status, then convert when enrolled."
        actions={
          <div className="ed-center-leads-page__header-actions">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
            <Button onClick={openAddLead}>+ Add Lead</Button>
          </div>
        }
      />
      <MutationError message={error} />
      {bulkConvertMessage ? (
        <p className="ed-text-sm ed-center-leads-page__bulk-message" role="status">
          {bulkConvertMessage}
        </p>
      ) : null}

      <LeadKpiGrid>
        <LeadKpiCard
          label="Open"
          value={stats.open}
          hint={openHint ?? (stats.open > 0 ? "In pipeline" : undefined)}
          active={filter === "open"}
          onClick={() => applyFilter("open")}
        />
        <LeadKpiCard
          label="Converted"
          value={stats.converted}
          hint={convertedPipelineHint(stats.converted)}
          active={filter === "converted"}
          onClick={() => applyFilter("converted")}
        />
        <LeadKpiCard
          label="Lost"
          value={stats.lost}
          hint={lostHint ?? undefined}
          tone="lost"
          active={filter === "lost"}
          onClick={() => applyFilter("lost")}
        />
        <LeadKpiCard
          label="Total"
          value={stats.all}
          hint="All leads"
          tone="total"
          active={filter === "all"}
          onClick={() => applyFilter("all")}
        />
      </LeadKpiGrid>

      <div className="ed-franchise-apps-page__toolbar">
        <label className="ed-franchise-apps-page__search">
          <span className="ed-franchise-apps-page__search-icon">{ICON_SEARCH}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search leads..."
            aria-label="Search leads"
          />
        </label>
        <FilterTabs
          options={filterTabs}
          value={filter}
          onChange={applyFilter}
          aria-label="Lead filter"
        />
      </div>

      <PipelineWorkspace
        detailOpen={!!selected}
        list={
          <PipelinePanel>
            <PipelineTableToolbar meta={paginationLabel(filtered.length, page, LEAD_PAGE_SIZE)} />

            {filter === "open" && eligibleBulkConvertCount > 0 ? (
              <div className="ed-center-leads-page__bulk-bar">
                {convertAllMode ? (
                  <>
                    <p className="ed-text-sm ed-muted">
                      Convert {eligibleBulkConvertCount} open lead{eligibleBulkConvertCount === 1 ? "" : "s"} with
                      parent and child names to enrolled students?
                    </p>
                    <div className="ed-center-leads-page__bulk-actions">
                      <Button onClick={() => bulkConvert.mutate()} disabled={bulkConvert.isPending}>
                        {bulkConvert.isPending ? "Converting…" : "Confirm convert all"}
                      </Button>
                      <Button variant="ghost" onClick={() => setConvertAllMode(false)} disabled={bulkConvert.isPending}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => setConvertAllMode(true)}>
                    Convert all eligible ({eligibleBulkConvertCount})
                  </Button>
                )}
              </div>
            ) : null}

            <div className="ed-center-leads-page__list">
              {leads.isLoading ? <p className="ed-text-sm ed-muted">Loading leads…</p> : null}
              {!leads.isLoading && pageItems.length === 0 ? (
                <p className="ed-text-sm ed-muted">No leads in this view.</p>
              ) : null}
              {pageItems.map((lead) => {
                const name = leadDisplayName(lead);
                const status = leadListStatusBadge(lead, now);
                const location = leadLocationLine(lead);

                return (
                  <button
                    key={lead.id}
                    type="button"
                    className={`ed-franchise-app-list-item${lead.id === selectedId ? " ed-franchise-app-list-item--selected" : ""}`}
                    onClick={() => selectLead(lead.id)}
                  >
                    <div className="ed-franchise-app-list-item__head">
                      <span className={`ed-franchise-app-status-badge ed-franchise-app-status-badge--${status.tone}`}>
                        {status.label}
                      </span>
                      <span className="ed-franchise-app-list-item__when">{formatLeadListDate(lead.created_at)}</span>
                    </div>
                    <p className="ed-franchise-app-list-item__title">{name}</p>
                    {location ? (
                      <p className="ed-franchise-app-list-item__location">
                        {ICON_PIN}
                        {location}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {filtered.length > LEAD_PAGE_SIZE ? (
              <div className="ed-center-leads-page__pager">
                <Button
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  disabled={page * LEAD_PAGE_SIZE >= filtered.length}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </PipelinePanel>
        }
        detail={
          selected ? (
            <CenterLeadDetailPanel
              lead={selected}
              now={now}
              hint={selectedHint}
              pipelineOpen={!!selectedPipeline}
              convertMode={convertMode}
              lostMode={lostMode}
              lostReason={lostReason}
              convertPending={convert.isPending}
              markLostPending={markLost.isPending}
              onBack={closeDetail}
              onConvertMode={() => setConvertMode(true)}
              onCancelConvert={() => setConvertMode(false)}
              onConfirmConvert={(overrides) => convert.mutate({ id: selected.id, overrides })}
              onLostMode={() => setLostMode(true)}
              onCancelLost={() => setLostMode(false)}
              onLostReasonChange={setLostReason}
              onConfirmLost={() => markLost.mutate()}
              onStatusChange={(status) => updateStatus.mutate({ id: selected.id, status })}
            />
          ) : (
            <div className="ed-pipeline-detail-panel ed-center-leads-page__placeholder">
              <p className="ed-text-sm ed-muted">Select a lead to update status, convert, or mark lost.</p>
            </div>
          )
        }
      />

      <ManualStudentLeadCard
        scope="center"
        centerId={centerId}
        invalidateKey={["center-leads", centerId]}
        open={addLeadOpen}
        onClose={() => setAddLeadOpen(false)}
      />

      <CenterStudentLeadImportDialog
        centerId={centerId}
        centerSlug={centerSlug}
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={invalidate}
      />

      {addLeadOpen ? null : (
        <button type="button" className="ed-pipeline-fab" aria-label="Add lead" onClick={openAddLead}>
          +
        </button>
      )}
    </div>
  );
}
