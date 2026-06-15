import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FilterTabs,
  MutationError,
  PipelineMetricCard,
  PipelineMetricStrip,
  PipelinePageHeader,
  PipelinePanel,
  PipelineStatusBadge,
  PipelineTableToolbar,
  PipelineWorkspace,
} from "@edunudg/ui";
import { ManualStudentLeadCard } from "@/features/shared/manualLeads/ManualStudentLeadCard";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { isLeadStale } from "@/lib/leadSla";
import {
  convertLeadToStudent,
  markLeadLost,
  updateLeadStatus,
  type LeadRow,
  type LeadStatus,
} from "@/lib/leadsApi";
import {
  computeLeadPipelineStats,
  convertedPipelineHint,
  filterCenterLeads,
  formatLeadContactWhen,
  LEAD_FILTER_OPTIONS,
  LEAD_PAGE_SIZE,
  leadContactTimestamp,
  leadDisplayName,
  leadStatusPresentation,
  leadStudentInterest,
  lostPipelineHint,
  openPipelineHint,
  paginateItems,
  paginationLabel,
  telHref,
  whatsappHref,
  type LeadFilter,
} from "@/lib/centerLeadsHelpers";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { initialsFromName } from "@/lib/welcomeMessage";
import { CenterLeadDetailPanel } from "./CenterLeadDetailPanel";
import "./centerLeads.css";

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

const ICON_OPEN = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const ICON_LOST = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M17 11l2 2 4-4" />
  </svg>
);

const ICON_CONVERTED = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 11v6M19 14h6" />
  </svg>
);

export function CenterLeadsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [filter, setFilter] = useState<LeadFilter>("open");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const addFormRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lostMode, setLostMode] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [convertMode, setConvertMode] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["center-leads", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-dashboard-home", centerId] });
    void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
  };

  const leads = useQuery({
    queryKey: ["center-leads", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("leads")
        .select(
          "id, brand_id, center_id, full_name, parent_name, email, whatsapp_e164, child_name, child_dob, pincode, city, school_name, status, lead_source, lost_reason, assigned_at, stale_at, last_center_action_at, created_at"
        )
        .eq("center_id", centerId!)
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as LeadRow[];
    },
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

  const now = Date.now();
  const allLeads = leads.data ?? [];
  const stats = useMemo(() => computeLeadPipelineStats(allLeads, now), [allLeads, now]);

  const filtered = useMemo(() => {
    return filterCenterLeads(allLeads, filter, "");
  }, [allLeads, filter]);

  const openAddLead = () => setAddLeadOpen(true);

  useEffect(() => {
    if (!addLeadOpen || !addFormRef.current) return;
    const frame = requestAnimationFrame(() => {
      addFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [addLeadOpen]);

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
    <div className="ed-center-leads-page">
      <PipelinePageHeader
        title="Leads"
        subtitle="Call parents on WhatsApp, update status, then convert when enrolled."
        actions={<Button onClick={openAddLead}>+ Add Lead</Button>}
      />
      <MutationError message={error} />

      <PipelineMetricStrip>
        <PipelineMetricCard
          icon={ICON_OPEN}
          tone="blue"
          label="Open Pipeline"
          value={stats.open}
          hint={openHint ?? undefined}
          badge={
            stats.stale > 0 ? <span className="ed-pipeline-attention-badge">Needs Attention</span> : undefined
          }
          active={filter === "open"}
          onClick={() => {
            setFilter("open");
            setPage(1);
          }}
        />
        <PipelineMetricCard
          icon={ICON_LOST}
          tone="red"
          label="Lost Leads"
          value={stats.lost}
          hint={lostHint ?? undefined}
          active={filter === "lost"}
          onClick={() => {
            setFilter("lost");
            setPage(1);
          }}
        />
        <PipelineMetricCard
          icon={ICON_CONVERTED}
          tone="purple"
          label="Converted"
          value={stats.converted}
          hint={convertedPipelineHint(stats.converted)}
          active={filter === "converted"}
          onClick={() => {
            setFilter("converted");
            setPage(1);
          }}
        />
      </PipelineMetricStrip>

      <PipelineWorkspace
        detailOpen={!!selected}
        list={
          <PipelinePanel>
            <PipelineTableToolbar
              tabs={
                <FilterTabs
                  options={filterTabs}
                  value={filter}
                  onChange={(value) => {
                    setFilter(value);
                    setPage(1);
                  }}
                  aria-label="Lead filter"
                />
              }
              meta={paginationLabel(filtered.length, page, LEAD_PAGE_SIZE)}
            />

            <div className="ed-pipeline-table-head" aria-hidden>
              <span>Parent Name</span>
              <span>Student Interest</span>
              <span>Status</span>
              <span>Last Contacted</span>
            </div>

            <div className="ed-pipeline-table-body">
              {leads.isLoading ? <p className="ed-text-sm ed-muted">Loading leads…</p> : null}
              {!leads.isLoading && pageItems.length === 0 ? (
                <p className="ed-text-sm ed-muted">No leads in this view.</p>
              ) : null}
              {pageItems.map((lead) => {
                const name = leadDisplayName(lead);
                const status = leadStatusPresentation(lead, now);
                const interest = leadStudentInterest(lead);
                const contact = formatLeadContactWhen(leadContactTimestamp(lead), now);
                const followUpDue = isLeadStale(lead, now) || contact.followUpDue;
                const wa = whatsappHref(lead.whatsapp_e164);
                const tel = telHref(lead.whatsapp_e164);

                return (
                  <button
                    key={lead.id}
                    type="button"
                    className={`ed-pipeline-lead-row${lead.id === selectedId ? " ed-pipeline-lead-row--selected" : ""}`}
                    onClick={() => selectLead(lead.id)}
                  >
                    <div className="ed-pipeline-lead-row__parent">
                      <span className="ed-pipeline-lead-row__avatar" aria-hidden>
                        {initialsFromName(name)}
                      </span>
                      <div>
                        <p className="ed-pipeline-lead-row__name">{name}</p>
                        <p className="ed-pipeline-lead-row__phone">{lead.whatsapp_e164 ?? lead.email ?? "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="ed-pipeline-lead-row__interest-title">{interest.title}</p>
                      <p className="ed-pipeline-lead-row__interest-sub">{interest.subtitle}</p>
                    </div>
                    <div>
                      <PipelineStatusBadge label={status.label} tone={status.tone} />
                    </div>
                    <div className="ed-pipeline-lead-row__contact">
                      <p style={{ margin: 0 }}>{contact.label}</p>
                      {followUpDue ? <p className="ed-pipeline-lead-row__followup">Follow-up due</p> : null}
                    </div>
                    <div className="ed-pipeline-lead-row__mobile-actions">
                      {tel ? (
                        <a className="ed-pipeline-lead-row__call" href={tel} onClick={(e) => e.stopPropagation()}>
                          Call
                        </a>
                      ) : null}
                      {wa ? (
                        <a
                          className="ed-pipeline-lead-row__chat"
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`WhatsApp ${name}`}
                        >
                          💬
                        </a>
                      ) : null}
                    </div>
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

      {addLeadOpen ? (
        <div ref={addFormRef} id="center-add-student-lead" className="ed-center-leads-page__add-form">
          <ManualStudentLeadCard
            scope="center"
            centerId={centerId}
            invalidateKey={["center-leads", centerId]}
            formOpen={addLeadOpen}
            onFormOpenChange={setAddLeadOpen}
            hideTrigger
          />
        </div>
      ) : null}

      <button
        type="button"
        className="ed-pipeline-fab"
        aria-label="Add lead"
        onClick={openAddLead}
      >
        +
      </button>
    </div>
  );
}
