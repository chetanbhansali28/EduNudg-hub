import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  ListRow,
  MutationError,
  PageGrid,
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

export function StudentLeadsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
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

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const now = Date.now();
  const unassigned = (leads.data ?? []).filter((l) => !l.center_id);
  const stale = (leads.data ?? []).filter(
    (l) =>
      l.center_id &&
      l.stale_at &&
      new Date(l.stale_at).getTime() < now &&
      l.status !== "converted" &&
      l.status !== "lost"
  );
  const lost = (leads.data ?? []).filter((l) => l.status === "lost");

  return (
    <>
      <PageTitle>Student Leads</PageTitle>
      <MutationError message={error} />

      <PageGridFull>
        {brandId && (
          <ManualStudentLeadCard scope="brand" brandId={brandId} invalidateKey={["brand-leads", brandId]} />
        )}
      </PageGridFull>

      <PageGrid cols={3}>
        <Card title={`Unassigned (${unassigned.length})`}>
          <DataList items={unassigned} empty="No unassigned leads." render={(l) => renderLead(l)} />
        </Card>
        <Card title={`Stale — no center action (${stale.length})`}>
          <DataList items={stale} empty="No stale leads." render={(l) => renderLead(l, true)} />
        </Card>
        <Card title={`Lost (${lost.length})`}>
          <DataList
            items={lost}
            empty="No lost leads."
            render={(l) => (
              <ListRow
                aside={
                  <Button variant="ghost" onClick={() => reopen.mutate(l.id)} disabled={reopen.isPending}>
                    Reopen
                  </Button>
                }
              >
                <LeadSummary lead={l} />
                {l.lost_reason && <p className="ed-text-sm">Reason: {l.lost_reason}</p>}
              </ListRow>
            )}
          />
        </Card>
        <Card title="All leads">
          <DataList items={leads.data ?? []} empty="No leads." render={(l) => renderLead(l)} />
        </Card>
      </PageGrid>

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

  function renderLead(l: LeadRow, showReassign = false) {
    return (
      <ListRow
        aside={
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedId(l.id);
              setIsReallocate(showReassign);
              setAssignCenterId(l.center_id ?? "");
            }}
          >
            {l.center_id ? (showReassign ? "Reallocate" : "View") : "Assign"}
          </Button>
        }
      >
        <LeadSummary lead={l} />
      </ListRow>
    );
  }
}

function LeadSummary({ lead }: { lead: LeadRow }) {
  return (
    <div>
      <strong>{lead.parent_name ?? lead.full_name}</strong>
      <div className="ed-text-sm ed-muted">
        {lead.whatsapp_e164} · {lead.city} {lead.pincode}
      </div>
      {lead.child_name && <div className="ed-text-sm">Child: {lead.child_name}</div>}
      <Badge>{lead.status}</Badge> <Badge>{lead.lead_source ?? "—"}</Badge>
    </div>
  );
}
