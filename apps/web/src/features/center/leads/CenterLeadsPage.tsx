import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  Input,
  ListRow,
  MutationError,
  PageGridFull,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { ConvertLeadDialog } from "@/features/center/convertStudent/ConvertLeadDialog";
import { ManualStudentLeadCard } from "@/features/shared/manualLeads/ManualStudentLeadCard";
import { leadListTitle, StudentLeadDetailCard } from "@/features/shared/leads/StudentLeadDetailCard";
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
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
];

type LeadFilter = "open" | "lost" | "converted" | "all";

const FILTER_OPTIONS: { value: LeadFilter; label: string }[] = [
  { value: "open", label: "Open pipeline" },
  { value: "lost", label: "Lost" },
  { value: "converted", label: "Converted" },
  { value: "all", label: "All" },
];

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
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [filter, setFilter] = useState<LeadFilter>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lostMode, setLostMode] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [convertTarget, setConvertTarget] = useState<LeadRow | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["center-leads", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-dashboard", centerId] });
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
  };

  const selectLead = (id: string) => {
    setSelectedId(id);
    setLostMode(false);
    setLostReason("");
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
      setConvertTarget(null);
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

  const filtered = useMemo(() => {
    return allLeads.filter((l) => {
      if (filter === "open") return ["new", "contacted", "qualified"].includes(l.status);
      if (filter === "lost") return l.status === "lost";
      if (filter === "converted") return l.status === "converted";
      return true;
    });
  }, [allLeads, filter]);

  if (!centerId) return <p className="ed-empty">Center context not found.</p>;

  const selectedPipeline =
    selected && selected.status !== "converted" && selected.status !== "lost";
  const selectedHint = selected ? slaHint(selected, now) : null;
  const selectedStale = selected ? isLeadStale(selected, now) : false;

  return (
    <>
      <PageTitle>Leads</PageTitle>
      <p className="ed-text-sm ed-muted">
        Assigned and direct center registrations. Call parents on WhatsApp, update status after each contact, then
        convert when enrolled (staff-only — FR-C12).
      </p>
      <MutationError message={error} />

      <PageGridFull>
        <ManualStudentLeadCard scope="center" centerId={centerId} invalidateKey={["center-leads", centerId]} />
      </PageGridFull>

      <Card title="Lead pipeline">
        <p className="ed-text-sm ed-muted">Select a parent name to open the full lead before updating status or converting.</p>
        <Select label="Show" value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
        <DataList
          items={filtered}
          empty="No leads in this view."
          render={(l) => {
            const stale = isLeadStale(l, now);
            const hint = slaHint(l, now);
            const isSelected = l.id === selectedId;
            return (
              <ListRow>
                <div>
                  <button
                    type="button"
                    className={`ed-inquiry-list__link${isSelected ? " ed-inquiry-list__link--active" : ""}`}
                    onClick={() => selectLead(l.id)}
                  >
                    {leadListTitle(l)}
                  </button>
                  <div className="ed-text-sm ed-muted">{l.whatsapp_e164}</div>
                  {l.child_name && <div className="ed-text-sm">Child: {l.child_name}</div>}
                  <Badge>{l.status}</Badge>{" "}
                  <Badge>{l.lead_source === "center" ? "Direct registration" : "Brand assigned"}</Badge>
                  {stale && <Badge tone="warning">Brand SLA expired</Badge>}
                  {hint && <p className="ed-text-sm ed-muted">{hint}</p>}
                </div>
              </ListRow>
            );
          }}
        />
      </Card>

      {selected && (
        <StudentLeadDetailCard
          lead={selected}
          stale={selectedStale}
          onClose={closeDetail}
          actions={
            <>
              {selectedHint && <p className="ed-text-sm ed-muted">{selectedHint}</p>}
              {lostMode ? (
                <>
                  <p className="ed-text-sm ed-muted">Reason is required and visible to the brand (FR-C11b).</p>
                  <Input label="Reason (required)" value={lostReason} onChange={setLostReason} />
                  <div className="ed-form-section">
                    <Button onClick={() => markLost.mutate()} disabled={!lostReason.trim() || markLost.isPending}>
                      Confirm lost
                    </Button>
                    <Button variant="ghost" onClick={() => setLostMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : selectedPipeline ? (
                <div className="ed-form-section">
                  <Select
                    label="Status"
                    value={selected.status}
                    onChange={(v) => updateStatus.mutate({ id: selected.id, status: v })}
                    options={STATUS_OPTIONS}
                  />
                  <Button onClick={() => setConvertTarget(selected)} disabled={convert.isPending}>
                    Convert to student
                  </Button>
                  <Button variant="ghost" onClick={() => setLostMode(true)}>
                    Mark lost
                  </Button>
                </div>
              ) : null}
            </>
          }
        />
      )}

      {convertTarget && (
        <ConvertLeadDialog
          lead={convertTarget}
          pending={convert.isPending}
          onCancel={() => setConvertTarget(null)}
          onConfirm={(overrides) => convert.mutate({ id: convertTarget.id, overrides })}
        />
      )}
    </>
  );
}
