import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  LeadFab,
  LeadFilterPills,
  LeadGridCard,
  LeadInsightBanner,
  LeadInsightsCard,
  LeadKpiCard,
  LeadKpiGrid,
  LeadListCard,
  LeadPageHeader,
  LeadStatusBadge,
  LeadTasksCard,
  LeadToolbarRow,
  MutationError,
  Select,
} from "@edunudg/ui";
import { ManualStudentLeadCard } from "@/features/shared/manualLeads/ManualStudentLeadCard";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { isLeadStale } from "@/lib/leadSla";
import {
  assignLeadToCenter,
  reopenLead,
  reassignLead,
  suggestCentersForLead,
  type LeadRow,
} from "@/lib/leadsApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useOpsBreakpoint } from "@/features/center/hooks/useOpsBreakpoint";
import { StudentLeadDetailView } from "@/features/brand/studentLeads/StudentLeadDetailView";
import {
  averageResponseHours,
  buildLeadTasks,
  downloadLeadsCsv,
  filterLeads,
  filterTabOptions,
  formatLeadListWhen,
  formatLeadSubmittedRelative,
  leadAvatarTone,
  leadCounts,
  leadGridFields,
  leadInitials,
  leadListLines,
  leadListMeta,
  leadListTitle,
  leadSourcePresentation,
  leadStatusPresentation,
  sortLeads,
  staleLeadInsight,
  type LeadFilter,
  type LeadSort,
} from "@/features/brand/studentLeads/studentLeadsHelpers";
import "./studentLeads.css";

export function StudentLeadsView({ brandId }: { brandId: string }) {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const { isMobile } = useOpsBreakpoint();
  const [filter, setFilter] = useState<LeadFilter>("unassigned");
  const [sort, setSort] = useState<LeadSort>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState(false);
  const [isReallocate, setIsReallocate] = useState(false);
  const [assignCenterId, setAssignCenterId] = useState("");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const leads = useQuery({
    queryKey: ["brand-leads", brandId],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("leads")
        .select(
          "id, brand_id, center_id, full_name, parent_name, email, whatsapp_e164, child_name, child_dob, pincode, city, school_name, status, lead_source, lost_reason, assigned_at, stale_at, last_center_action_at, created_at"
        )
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as LeadRow[];
    },
  });

  const centers = useQuery({
    queryKey: ["centers", brandId],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("franchise_centers")
        .select("id, name, display_name, slug, pincode, city, address_line1")
        .eq("brand_id", brandId)
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as {
        id: string;
        name: string;
        display_name: string | null;
        slug: string;
        pincode: string | null;
        city: string | null;
        address_line1: string | null;
      }[];
    },
  });

  const selected = (leads.data ?? []).find((row) => row.id === selectedId) ?? null;

  const suggestions = useQuery({
    queryKey: ["lead-suggestions", selectedId],
    enabled: !!selectedId && (assignMode || !isMobile),
    queryFn: () => suggestCentersForLead(selectedId!),
  });

  const centerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const center of centers.data ?? []) {
      map.set(center.id, center.display_name ?? center.name);
    }
    return map;
  }, [centers.data]);

  const now = Date.now();
  const allLeads = leads.data ?? [];
  const counts = useMemo(() => leadCounts(allLeads, now), [allLeads, now]);
  const filtered = useMemo(
    () => sortLeads(filterLeads(allLeads, filter, now), sort),
    [allLeads, filter, sort, now]
  );
  const tabOptions = filterTabOptions(counts);
  const insight = staleLeadInsight(allLeads, now);
  const tasks = buildLeadTasks(allLeads, now);

  const closeDetail = () => {
    setSelectedId(null);
    setAssignMode(false);
    setIsReallocate(false);
    setAssignCenterId("");
    setMobileDetailOpen(false);
  };

  const selectLead = (id: string) => {
    setSelectedId(id);
    setAssignMode(false);
    setIsReallocate(false);
    setAssignCenterId("");
    if (isMobile) setMobileDetailOpen(true);
  };

  const assign = useMutation({
    mutationFn: async () => {
      if (!selectedId || !assignCenterId) return;
      clear();
      if (isReallocate) await reassignLead(selectedId, assignCenterId);
      else await assignLeadToCenter(selectedId, assignCenterId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-leads", brandId] });
      void qc.invalidateQueries({ queryKey: ["brand-dashboard", brandId] });
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
      closeDetail();
    },
    onError: capture,
  });

  const reopen = useMutation({
    mutationFn: async (leadId: string) => {
      clear();
      await reopenLead(leadId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["brand-leads", brandId] });
      void qc.invalidateQueries({ queryKey: ["brand-dashboard", brandId] });
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
      closeDetail();
    },
    onError: capture,
  });

  const selectedStale = selected ? isLeadStale(selected, now) : false;
  const selectedUnassigned =
    selected && !selected.center_id && selected.status !== "lost" && selected.status !== "converted";

  const detailView =
    selected ? (
      <StudentLeadDetailView
        lead={selected}
        isMobile={isMobile}
        assignedCenterName={selected.center_id ? centerNameById.get(selected.center_id) : undefined}
        stale={selectedStale}
        unassigned={!!selectedUnassigned}
        assignMode={assignMode}
        isReallocate={isReallocate}
        assignCenterId={assignCenterId}
        onAssignCenterIdChange={setAssignCenterId}
        exactSuggestions={suggestions.data?.exact ?? []}
        nearSuggestions={suggestions.data?.near ?? []}
        centers={centers.data ?? []}
        assignPending={assign.isPending}
        reopenPending={reopen.isPending}
        onBack={
          isMobile
            ? () => setMobileDetailOpen(false)
            : () => closeDetail()
        }
        onStartAssign={(reallocate) => {
          setAssignMode(true);
          setIsReallocate(reallocate);
          setAssignCenterId(selected.center_id ?? "");
        }}
        onCancelAssign={() => setAssignMode(false)}
        onConfirmAssign={() => assign.mutate()}
        onReopen={() => reopen.mutate(selected.id)}
      />
    ) : null;

  const kpiGrid = (
    <LeadKpiGrid>
      <LeadKpiCard
        label="Unassigned"
        value={counts.unassigned}
        hint={counts.unassigned > 0 ? `+${Math.min(counts.unassigned, 12)}%` : undefined}
        active={filter === "unassigned"}
        onClick={() => setFilter("unassigned")}
      />
      <LeadKpiCard
        label="Needs Attention"
        value={counts.stale}
        hint={counts.stale > 0 ? "Urgent" : undefined}
        tone="urgent"
        active={filter === "stale"}
        onClick={() => setFilter("stale")}
      />
      <LeadKpiCard
        label="Lost"
        value={counts.lost}
        hint="30 days"
        tone="lost"
        active={filter === "lost"}
        onClick={() => setFilter("lost")}
      />
      <LeadKpiCard
        label={isMobile ? "All leads" : "Active Total"}
        value={counts.all}
        hint="All Leads"
        tone="total"
        active={filter === "all"}
        onClick={() => setFilter("all")}
      />
    </LeadKpiGrid>
  );

  const leadCardsMobile = (
    <>
      {filtered.length === 0 ? (
        <p className="ed-text-sm ed-muted">No student leads in this view.</p>
      ) : (
        filtered.map((lead) => {
          const status = leadStatusPresentation(lead);
          const source = leadSourcePresentation(lead.lead_source);
          const centerName = lead.center_id ? centerNameById.get(lead.center_id) : undefined;
          return (
            <LeadListCard
              key={lead.id}
              initials={leadInitials(lead)}
              avatarTone={leadAvatarTone(lead.id)}
              title={leadListTitle(lead)}
              meta={leadListMeta(lead)}
              lines={leadListLines(lead, centerName)}
              when={formatLeadListWhen(lead.created_at, now)}
              selected={lead.id === selectedId}
              badges={
                <>
                  <LeadStatusBadge tone={status.tone}>{status.label}</LeadStatusBadge>
                  <LeadStatusBadge tone={source.tone}>{source.label}</LeadStatusBadge>
                </>
              }
              onSelect={() => selectLead(lead.id)}
            />
          );
        })
      )}
      {insight ? (
        <LeadInsightBanner
          title="Need better conversions?"
          body={insight.body}
          actionLabel="Review Follow-up SLA"
          onAction={() => setFilter("stale")}
        />
      ) : null}
    </>
  );

  const leadCardsDesktop = (
    <div className="ed-student-leads__grid">
      {filtered.length === 0 ? (
        <p className="ed-text-sm ed-muted">No student leads in this view.</p>
      ) : (
        filtered.map((lead) => {
          const status = leadStatusPresentation(lead);
          const source = leadSourcePresentation(lead.lead_source);
          const unassigned = !lead.center_id && lead.status !== "lost" && lead.status !== "converted";
          const stale = isLeadStale(lead, now);
          return (
            <LeadGridCard
              key={lead.id}
              initials={leadInitials(lead)}
              avatarTone={leadAvatarTone(lead.id)}
              title={leadListTitle(lead)}
              when={formatLeadSubmittedRelative(lead.created_at, now)}
              statusBadge={<LeadStatusBadge tone={status.tone}>{status.label}</LeadStatusBadge>}
              sourceBadge={<LeadStatusBadge tone={source.tone}>{source.label}</LeadStatusBadge>}
              fields={leadGridFields(lead)}
              footer={
                lead.status === "converted" ? (
                  <Button variant="secondary" block onClick={() => selectLead(lead.id)}>
                    View Enrollment
                  </Button>
                ) : stale ? (
                  <Button block onClick={() => selectLead(lead.id)}>
                    Assign Center
                  </Button>
                ) : unassigned ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (lead.whatsapp_e164) window.location.href = `tel:${lead.whatsapp_e164}`;
                      }}
                    >
                      Call
                    </Button>
                    <Button variant="ghost" onClick={() => selectLead(lead.id)}>
                      Details
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => selectLead(lead.id)}>
                      WhatsApp
                    </Button>
                    <Button variant="ghost" onClick={() => selectLead(lead.id)}>
                      Convert
                    </Button>
                  </>
                )
              }
              onSelect={() => selectLead(lead.id)}
            />
          );
        })
      )}
    </div>
  );

  const sidebar = !isMobile ? (
    <aside className="ed-student-leads__aside">
      <LeadInsightsCard
        body="You are responding to leads based on your current open pipeline age."
        metricLabel="Current Response Time"
        metricValue={`${averageResponseHours(allLeads, now)} hrs`}
        benchmark="Brand SLA Benchmark: 24h — faster follow-up improves conversion rates."
        action={
          <Button variant="secondary" block onClick={() => setFilter("stale")}>
            View SLA Report
          </Button>
        }
      />
      <LeadTasksCard
        total={tasks.length}
        items={tasks}
        action={
          <Button variant="ghost" block onClick={() => setFilter("stale")}>
            All Tasks
          </Button>
        }
      />
    </aside>
  ) : null;

  return (
    <div className={`ed-student-leads${isMobile ? " ed-student-leads--mobile" : ""}`}>
      <LeadPageHeader
        title="Student Leads"
        subtitle={
          isMobile
            ? "Assign parent inquiries to centers and track progress."
            : "Manage parent inquiries and track conversion pipeline."
        }
        actions={
          isMobile ? (
            <Button onClick={() => setAddLeadOpen(true)}>Add lead</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setFilter(filter)}>
                Filters
              </Button>
              <Button onClick={() => downloadLeadsCsv(allLeads)}>Export List</Button>
            </>
          )
        }
      />
      <MutationError message={error} />

      {kpiGrid}

      {isMobile ? (
        <>
          <LeadFilterPills options={tabOptions} value={filter} onChange={setFilter} />
          {leadCardsMobile}
        </>
      ) : (
        <div className="ed-student-leads__layout">
          <div className="ed-student-leads__main">
            {selected ? (
              detailView
            ) : (
              <>
                <LeadToolbarRow
                  tabs={<LeadFilterPills options={tabOptions} value={filter} onChange={setFilter} />}
                  sort={
                    <Select
                      label="Sorted by"
                      value={sort}
                      onChange={(value) => setSort(value as LeadSort)}
                      options={[
                        { value: "newest", label: "Newest first" },
                        { value: "oldest", label: "Oldest first" },
                      ]}
                    />
                  }
                />
                {leadCardsDesktop}
                <p className="ed-text-sm ed-muted ed-student-leads__placeholder">
                  Select a parent lead to review details and assign to a center.
                </p>
              </>
            )}
          </div>
          {sidebar}
        </div>
      )}

      {isMobile && mobileDetailOpen && detailView ? (
        <div className="ed-ops-mobile-detail" role="dialog" aria-modal aria-label="Lead details">
          {detailView}
        </div>
      ) : null}

      {addLeadOpen ? (
        <div className="ed-ops-mobile-detail" role="dialog" aria-modal aria-label="Add lead">
          <div className="ed-ops-mobile-detail__bar">
            <button type="button" className="ed-ops-mobile-detail__back" onClick={() => setAddLeadOpen(false)}>
              ← Back
            </button>
          </div>
          <ManualStudentLeadCard
            scope="brand"
            brandId={brandId}
            invalidateKey={["brand-leads", brandId]}
            formOpen
            onFormOpenChange={setAddLeadOpen}
            hideTrigger
          />
        </div>
      ) : null}

      {isMobile && !addLeadOpen ? <LeadFab onClick={() => setAddLeadOpen(true)} /> : null}
    </div>
  );
}
