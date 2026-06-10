import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FilterTabs,
  KpiCard,
  KpiGrid,
  MutationError,
  PageGridFull,
  PageToolbar,
  PipelineDetailPlaceholder,
  PipelineEmptyState,
  PipelineListItem,
  PipelineMasterDetail,
  Select,
} from "@edunudg/ui";
import { ManualStudentLeadCard } from "@/features/shared/manualLeads/ManualStudentLeadCard";
import { leadListTitle, StudentLeadDetailCard } from "@/features/shared/leads/StudentLeadDetailCard";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { isLeadStale, leadAgeDays } from "@/lib/leadSla";
import {
  assignLeadToCenter,
  reopenLead,
  reassignLead,
  suggestCentersForLead,
  type LeadRow,
  type SuggestedCenter,
} from "@/lib/leadsApi";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { formatRelativeWhen, initialsFromName } from "@/lib/welcomeMessage";

type LeadFilter = "all" | "unassigned" | "stale" | "lost";

const FILTER_OPTIONS: { value: LeadFilter; label: string }[] = [
  { value: "unassigned", label: "Unassigned" },
  { value: "stale", label: "Needs attention" },
  { value: "lost", label: "Lost" },
  { value: "all", label: "All" },
];

function SuggestionButton({
  center,
  tier,
  onSelect,
}: {
  center: SuggestedCenter;
  tier: "exact" | "near";
  onSelect: (id: string) => void;
}) {
  const label =
    tier === "exact"
      ? `Exact pincode match — ${center.name}`
      : `Nearby in ${center.city ?? "city"} — ${center.name} (Δ${center.distance_last3 ?? 0})`;

  return (
    <li className="ed-suggestion-list__item">
      <Button onClick={() => onSelect(center.center_id)}>
        {label}
        {center.address_line1 && <span className="ed-muted"> · {center.address_line1}</span>}
        {center.pincode && <span className="ed-muted"> · {center.pincode}</span>}
      </Button>
    </li>
  );
}

export function StudentLeadsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [filter, setFilter] = useState<LeadFilter>("unassigned");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState(false);
  const [isReallocate, setIsReallocate] = useState(false);
  const [assignCenterId, setAssignCenterId] = useState("");

  const leads = useQuery({
    queryKey: ["brand-leads", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("leads")
        .select(
          "id, brand_id, center_id, full_name, parent_name, email, whatsapp_e164, child_name, child_dob, pincode, city, school_name, status, lead_source, lost_reason, assigned_at, stale_at, last_center_action_at, created_at"
        )
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as LeadRow[];
    },
  });

  const selected = (leads.data ?? []).find((row) => row.id === selectedId) ?? null;

  const suggestions = useQuery({
    queryKey: ["lead-suggestions", selectedId],
    enabled: !!selectedId && assignMode,
    queryFn: () => suggestCentersForLead(selectedId!),
  });

  const centers = useQuery({
    queryKey: ["centers", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("franchise_centers")
        .select("id, name, display_name, slug, pincode, city, address_line1")
        .eq("brand_id", brandId!)
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

  const centerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of centers.data ?? []) {
      map.set(c.id, c.display_name ?? c.name);
    }
    return map;
  }, [centers.data]);

  const closeDetail = () => {
    setSelectedId(null);
    setAssignMode(false);
    setIsReallocate(false);
    setAssignCenterId("");
  };

  const selectLead = (id: string) => {
    setSelectedId(id);
    setAssignMode(false);
    setIsReallocate(false);
    setAssignCenterId("");
  };

  const assign = useMutation({
    mutationFn: async () => {
      if (!selectedId || !assignCenterId) return;
      clear();
      if (isReallocate) {
        await reassignLead(selectedId, assignCenterId);
      } else {
        await assignLeadToCenter(selectedId, assignCenterId);
      }
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

  const now = Date.now();
  const allLeads = leads.data ?? [];

  const counts = useMemo(
    () => ({
      unassigned: allLeads.filter((l) => !l.center_id && l.status !== "lost" && l.status !== "converted").length,
      stale: allLeads.filter((l) => isLeadStale(l, now)).length,
      lost: allLeads.filter((l) => l.status === "lost").length,
      all: allLeads.length,
    }),
    [allLeads, now]
  );

  const filtered = allLeads.filter((l) => {
    if (filter === "unassigned") return !l.center_id && l.status !== "lost" && l.status !== "converted";
    if (filter === "stale") return isLeadStale(l, now);
    if (filter === "lost") return l.status === "lost";
    return true;
  });

  const filterTabs = FILTER_OPTIONS.map((option) => ({
    ...option,
    count: counts[option.value],
  }));

  const exactSuggestions = suggestions.data?.exact ?? [];
  const nearSuggestions = suggestions.data?.near ?? [];
  const noSuggestions = exactSuggestions.length === 0 && nearSuggestions.length === 0;

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const selectedStale = selected ? isLeadStale(selected, now) : false;
  const selectedUnassigned =
    selected && !selected.center_id && selected.status !== "lost" && selected.status !== "converted";
  const showReassign = selectedStale;

  return (
    <>
      <PageToolbar
        title="Student Leads"
        subtitle="Assign parent inquiries to franchise centers and track SLA follow-up."
      />
      <MutationError message={error} />

      <PageGridFull>
        {brandId && (
          <ManualStudentLeadCard scope="brand" brandId={brandId} invalidateKey={["brand-leads", brandId]} />
        )}
      </PageGridFull>

      <KpiGrid>
        <KpiCard
          label="Unassigned"
          value={counts.unassigned}
          active={filter === "unassigned"}
          onClick={() => setFilter("unassigned")}
        />
        <KpiCard
          label="Needs attention"
          value={counts.stale}
          active={filter === "stale"}
          onClick={() => setFilter("stale")}
        />
        <KpiCard label="Lost" value={counts.lost} active={filter === "lost"} onClick={() => setFilter("lost")} />
        <KpiCard label="All leads" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
      </KpiGrid>

      <PipelineMasterDetail
        list={
          <Card title="Lead pipeline">
            <FilterTabs options={filterTabs} value={filter} onChange={setFilter} aria-label="Lead filter" />
            <DataList
              variant="pipeline"
              items={filtered}
              empty={
                <PipelineEmptyState
                  message="No student leads in this view."
                  actionLabel={filter !== "unassigned" ? "Show unassigned" : undefined}
                  onAction={filter !== "unassigned" ? () => setFilter("unassigned") : undefined}
                />
              }
              render={(l) => {
                const stale = isLeadStale(l, now);
                const unassigned = !l.center_id && l.status !== "lost" && l.status !== "converted";
                const isSelected = l.id === selectedId;
                const title = leadListTitle(l);
                const assignedCenterName = l.center_id ? centerNameById.get(l.center_id) : undefined;
                return (
                  <PipelineListItem
                    title={title}
                    meta={`${l.whatsapp_e164 ?? "—"} · ${l.city ?? ""} ${l.pincode ?? ""}`.trim()}
                    lines={[
                      ...(l.child_name ? [`Child: ${l.child_name}`] : []),
                      ...(assignedCenterName ? [`Assigned: ${assignedCenterName}`] : []),
                    ]}
                    initials={initialsFromName(title)}
                    when={formatRelativeWhen(l.created_at, now)}
                    selected={isSelected}
                    onSelect={() => selectLead(l.id)}
                    badges={
                      <>
                        <Badge>{l.status}</Badge>
                        <Badge>{l.lead_source ?? "—"}</Badge>
                        {unassigned && ageDaysBadge(l.created_at, now)}
                        {stale && <Badge tone="warning">Needs attention</Badge>}
                      </>
                    }
                  />
                );
              }}
            />
          </Card>
        }
        detail={
          selected ? (
            <StudentLeadDetailCard
              lead={selected}
              stale={selectedStale}
              unassigned={!!selectedUnassigned}
              assignedCenterName={selected.center_id ? centerNameById.get(selected.center_id) : undefined}
              ageDays={selectedUnassigned ? leadAgeDays(selected.created_at, now) : undefined}
              onClose={closeDetail}
              actions={
                assignMode ? (
                  <>
                    {isReallocate && (
                      <p className="ed-text-sm ed-muted">
                        Reallocation resets the SLA clock for the new center (timer starts over per brand settings).
                      </p>
                    )}
                    <p className="ed-text-sm ed-muted">Pincode suggestions — manual assign required (FR-B11)</p>
                    {noSuggestions ? (
                      <p className="ed-text-sm ed-muted">
                        No centers found for this pincode — add a center with location data or assign manually below.
                      </p>
                    ) : (
                      <ul>
                        {exactSuggestions.map((c) => (
                          <SuggestionButton key={c.center_id} center={c} tier="exact" onSelect={setAssignCenterId} />
                        ))}
                        {nearSuggestions.map((c) => (
                          <SuggestionButton key={c.center_id} center={c} tier="near" onSelect={setAssignCenterId} />
                        ))}
                      </ul>
                    )}
                    <Select
                      label="Or choose any center in brand"
                      value={assignCenterId}
                      onChange={setAssignCenterId}
                      options={(centers.data ?? []).map((c) => ({
                        value: c.id,
                        label: `${c.display_name ?? c.name}${c.city ? ` · ${c.city}` : ""}`,
                      }))}
                      placeholder="Select center"
                    />
                    <div className="ed-form-section">
                      <Button onClick={() => assign.mutate()} disabled={!assignCenterId || assign.isPending}>
                        {isReallocate ? "Reallocate" : "Assign"}
                      </Button>
                      <Button variant="ghost" onClick={() => setAssignMode(false)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="ed-form-section">
                    {selected.status === "lost" ? (
                      <Button onClick={() => reopen.mutate(selected.id)} disabled={reopen.isPending}>
                        Reopen
                      </Button>
                    ) : selected.status !== "converted" ? (
                      <Button
                        onClick={() => {
                          setAssignMode(true);
                          setIsReallocate(showReassign);
                          setAssignCenterId(selected.center_id ?? "");
                        }}
                      >
                        {!selected.center_id ? "Assign" : showReassign ? "Reallocate" : "Reassign"}
                      </Button>
                    ) : null}
                  </div>
                )
              }
            />
          ) : (
            <PipelineDetailPlaceholder message="Select a parent lead to review details and assign to a center." />
          )
        }
      />
    </>
  );
}

function ageDaysBadge(createdAt: string, now: number) {
  return <Badge tone="warning">{`${leadAgeDays(createdAt, now)}d unassigned`}</Badge>;
}
