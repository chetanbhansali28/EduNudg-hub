import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  ListRow,
  MutationError,
  PageGridFull,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { ManualStudentLeadCard } from "@/features/shared/manualLeads/ManualStudentLeadCard";
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

type LeadFilter = "all" | "unassigned" | "stale" | "lost";

const FILTER_OPTIONS: { value: LeadFilter; label: string }[] = [
  { value: "all", label: "All leads" },
  { value: "unassigned", label: "Unassigned applications" },
  { value: "stale", label: "Leads needing attention" },
  { value: "lost", label: "Lost" },
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
    <li>
      <button type="button" className="ed-text-sm" onClick={() => onSelect(center.center_id)}>
        {label}
        {center.address_line1 && (
          <span className="ed-muted"> · {center.address_line1}</span>
        )}
        {center.pincode && <span className="ed-muted"> · {center.pincode}</span>}
      </button>
    </li>
  );
}

export function StudentLeadsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const suggestions = useQuery({
    queryKey: ["lead-suggestions", selectedId],
    enabled: !!selectedId,
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
      setSelectedId(null);
      setIsReallocate(false);
      setAssignCenterId("");
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
    }),
    [allLeads, now]
  );

  const filtered = allLeads.filter((l) => {
    if (filter === "unassigned") return !l.center_id && l.status !== "lost" && l.status !== "converted";
    if (filter === "stale") return isLeadStale(l, now);
    if (filter === "lost") return l.status === "lost";
    return true;
  });

  const exactSuggestions = suggestions.data?.exact ?? [];
  const nearSuggestions = suggestions.data?.near ?? [];
  const noSuggestions = exactSuggestions.length === 0 && nearSuggestions.length === 0;

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  return (
    <>
      <PageTitle>Student Leads</PageTitle>
      <MutationError message={error} />

      <PageGridFull>
        {brandId && (
          <ManualStudentLeadCard scope="brand" brandId={brandId} invalidateKey={["brand-leads", brandId]} />
        )}
      </PageGridFull>

      <Card title="Lead pipeline">
        <p className="ed-text-sm ed-muted">
          Unassigned {counts.unassigned} · Needs attention {counts.stale} · Lost {counts.lost}
        </p>
        <Select label="Show" value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
        <DataList
          items={filtered}
          empty="No leads in this view."
          render={(l) => {
            const stale = isLeadStale(l, now);
            const unassigned = !l.center_id && l.status !== "lost" && l.status !== "converted";
            const showReassign = stale;
            return (
              <ListRow
                aside={
                  l.status === "lost" ? (
                    <Button variant="ghost" onClick={() => reopen.mutate(l.id)} disabled={reopen.isPending}>
                      Reopen
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedId(l.id);
                        setIsReallocate(showReassign);
                        setAssignCenterId(l.center_id ?? "");
                      }}
                    >
                      {!l.center_id ? "Assign" : showReassign ? "Reallocate" : "Reassign"}
                    </Button>
                  )
                }
              >
                <LeadSummary
                  lead={l}
                  stale={stale}
                  unassigned={unassigned}
                  assignedCenterName={l.center_id ? centerNameById.get(l.center_id) : undefined}
                  ageDays={unassigned ? leadAgeDays(l.created_at, now) : undefined}
                />
                {l.lost_reason && <p className="ed-text-sm">Reason: {l.lost_reason}</p>}
              </ListRow>
            );
          }}
        />
      </Card>

      {selectedId && (
        <Card title={isReallocate ? "Reallocate to center" : "Assign to center"}>
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
          <Button onClick={() => assign.mutate()} disabled={!assignCenterId || assign.isPending}>
            {isReallocate ? "Reallocate" : "Assign"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedId(null);
              setIsReallocate(false);
            }}
          >
            Cancel
          </Button>
        </Card>
      )}
    </>
  );
}

function LeadSummary({
  lead,
  stale,
  unassigned,
  assignedCenterName,
  ageDays,
}: {
  lead: LeadRow;
  stale?: boolean;
  unassigned?: boolean;
  assignedCenterName?: string;
  ageDays?: number;
}) {
  return (
    <div>
      <strong>{lead.parent_name ?? lead.full_name}</strong>
      <div className="ed-text-sm ed-muted">
        {lead.whatsapp_e164} · {lead.city} {lead.pincode}
      </div>
      {lead.child_name && <div className="ed-text-sm">Child: {lead.child_name}</div>}
      {assignedCenterName && (
        <div className="ed-text-sm ed-muted">Assigned: {assignedCenterName}</div>
      )}
      <Badge>{lead.status}</Badge> <Badge>{lead.lead_source ?? "—"}</Badge>
      {unassigned && ageDays != null && <Badge tone="warning">{ageDays}d unassigned</Badge>}
      {unassigned && ageDays == null && <Badge tone="warning">Unassigned</Badge>}
      {stale && <Badge tone="warning">Needs attention</Badge>}
    </div>
  );
}
