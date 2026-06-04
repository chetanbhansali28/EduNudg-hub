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
import {
  assignLeadToCenter,
  reopenLead,
  reassignLead,
  suggestCentersForLead,
  type LeadRow,
} from "@/lib/leadsApi";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

type LeadFilter = "all" | "unassigned" | "stale" | "lost";

const FILTER_OPTIONS: { value: LeadFilter; label: string }[] = [
  { value: "all", label: "All leads" },
  { value: "unassigned", label: "Unassigned" },
  { value: "stale", label: "Stale — no center action" },
  { value: "lost", label: "Lost" },
];

function isStale(lead: LeadRow, now: number) {
  return (
    !!lead.center_id &&
    !!lead.stale_at &&
    new Date(lead.stale_at).getTime() < now &&
    lead.status !== "converted" &&
    lead.status !== "lost"
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
        .select("id, name, display_name, pincode, city")
        .eq("brand_id", brandId!)
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as { id: string; name: string; display_name: string | null }[];
    },
  });

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
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["brand-leads", brandId] }),
    onError: capture,
  });

  const now = Date.now();
  const allLeads = leads.data ?? [];

  const counts = useMemo(
    () => ({
      unassigned: allLeads.filter((l) => !l.center_id).length,
      stale: allLeads.filter((l) => isStale(l, now)).length,
      lost: allLeads.filter((l) => l.status === "lost").length,
    }),
    [allLeads, now]
  );

  const filtered = allLeads.filter((l) => {
    if (filter === "unassigned") return !l.center_id;
    if (filter === "stale") return isStale(l, now);
    if (filter === "lost") return l.status === "lost";
    return true;
  });

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
          Unassigned {counts.unassigned} · Stale {counts.stale} · Lost {counts.lost}
        </p>
        <Select label="Show" value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
        <DataList
          items={filtered}
          empty="No leads in this view."
          render={(l) => {
            const stale = isStale(l, now);
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
                <LeadSummary lead={l} stale={stale} unassigned={!l.center_id} />
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
              Reallocation resets the SLA clock for the new center (15-day timer starts over).
            </p>
          )}
          <p className="ed-text-sm ed-muted">Pincode suggestions (manual assign required)</p>
          <ul>
            {((suggestions.data?.exact as { center_id: string; name: string }[]) ?? []).map((c) => (
              <li key={c.center_id}>
                <button type="button" onClick={() => setAssignCenterId(c.center_id)}>
                  Exact: {c.name}
                </button>
              </li>
            ))}
            {((suggestions.data?.near as { center_id: string; name: string; distance_last3: number }[]) ?? []).map(
              (c) => (
                <li key={c.center_id}>
                  <button type="button" onClick={() => setAssignCenterId(c.center_id)}>
                    Near: {c.name} (Δ{c.distance_last3})
                  </button>
                </li>
              )
            )}
          </ul>
          <Select
            label="Or choose any center"
            value={assignCenterId}
            onChange={setAssignCenterId}
            options={(centers.data ?? []).map((c) => ({
              value: c.id,
              label: c.display_name ?? c.name,
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

function LeadSummary({ lead, stale, unassigned }: { lead: LeadRow; stale?: boolean; unassigned?: boolean }) {
  return (
    <div>
      <strong>{lead.parent_name ?? lead.full_name}</strong>
      <div className="ed-text-sm ed-muted">
        {lead.whatsapp_e164} · {lead.city} {lead.pincode}
      </div>
      {lead.child_name && <div className="ed-text-sm">Child: {lead.child_name}</div>}
      <Badge>{lead.status}</Badge> <Badge>{lead.lead_source ?? "—"}</Badge>
      {unassigned && <Badge tone="warning">Unassigned</Badge>}
      {stale && <Badge tone="warning">Stale</Badge>}
    </div>
  );
}
