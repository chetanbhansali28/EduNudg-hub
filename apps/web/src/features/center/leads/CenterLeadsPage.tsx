import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  FilterTabs,
  Input,
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
import { formatRelativeWhen, initialsFromName } from "@/lib/welcomeMessage";

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
  const [convertMode, setConvertMode] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["center-leads", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-dashboard", centerId] });
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

  const counts = useMemo(
    () => ({
      open: allLeads.filter((l) => ["new", "contacted", "qualified"].includes(l.status)).length,
      lost: allLeads.filter((l) => l.status === "lost").length,
      converted: allLeads.filter((l) => l.status === "converted").length,
      all: allLeads.length,
      stale: allLeads.filter((l) => isLeadStale(l, now)).length,
    }),
    [allLeads, now]
  );

  const filtered = useMemo(() => {
    return allLeads.filter((l) => {
      if (filter === "open") return ["new", "contacted", "qualified"].includes(l.status);
      if (filter === "lost") return l.status === "lost";
      if (filter === "converted") return l.status === "converted";
      return true;
    });
  }, [allLeads, filter]);

  const filterTabs = FILTER_OPTIONS.map((option) => ({
    ...option,
    count: counts[option.value],
  }));

  if (!centerId) return <p className="ed-empty">Center context not found.</p>;

  const selectedPipeline =
    selected && selected.status !== "converted" && selected.status !== "lost";
  const selectedHint = selected ? slaHint(selected, now) : null;
  const selectedStale = selected ? isLeadStale(selected, now) : false;

  return (
    <>
      <PageToolbar
        title="Leads"
        subtitle="Call parents on WhatsApp, update status after each contact, then convert when enrolled (staff-only — FR-C12)."
      />
      <MutationError message={error} />

      <PageGridFull>
        <ManualStudentLeadCard scope="center" centerId={centerId} invalidateKey={["center-leads", centerId]} />
      </PageGridFull>

      <KpiGrid>
        <KpiCard label="Open pipeline" value={counts.open} active={filter === "open"} onClick={() => setFilter("open")} />
        <KpiCard
          label="Needs attention"
          value={counts.stale}
          hint="Brand SLA expired"
          active={filter === "open"}
          onClick={() => setFilter("open")}
        />
        <KpiCard label="Lost" value={counts.lost} active={filter === "lost"} onClick={() => setFilter("lost")} />
        <KpiCard
          label="Converted"
          value={counts.converted}
          active={filter === "converted"}
          onClick={() => setFilter("converted")}
        />
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
                  message="No leads in this view."
                  actionLabel={filter !== "open" ? "Show open pipeline" : undefined}
                  onAction={filter !== "open" ? () => setFilter("open") : undefined}
                />
              }
              render={(l) => {
                const stale = isLeadStale(l, now);
                const isSelected = l.id === selectedId;
                const title = leadListTitle(l);
                const hint = slaHint(l, now);
                return (
                  <PipelineListItem
                    title={title}
                    meta={l.whatsapp_e164 ?? undefined}
                    lines={[
                      ...(l.child_name ? [`Child: ${l.child_name}`] : []),
                      ...(hint ? [hint] : []),
                    ]}
                    initials={initialsFromName(title)}
                    when={formatRelativeWhen(l.created_at, now)}
                    selected={isSelected}
                    onSelect={() => selectLead(l.id)}
                    badges={
                      <>
                        <Badge>{l.status}</Badge>
                        <Badge>{l.lead_source === "center" ? "Direct registration" : "Brand assigned"}</Badge>
                        {stale && <Badge tone="warning">Brand SLA expired</Badge>}
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
                    convertMode ? (
                      <ConvertLeadDialog
                        lead={selected}
                        variant="inline"
                        pending={convert.isPending}
                        onCancel={() => setConvertMode(false)}
                        onConfirm={(overrides) => convert.mutate({ id: selected.id, overrides })}
                      />
                    ) : (
                      <div className="ed-form-section">
                        <Select
                          label="Status"
                          value={selected.status}
                          onChange={(v) => updateStatus.mutate({ id: selected.id, status: v })}
                          options={STATUS_OPTIONS}
                        />
                        <Button onClick={() => setConvertMode(true)} disabled={convert.isPending}>
                          Convert to student
                        </Button>
                        <Button variant="danger" onClick={() => setLostMode(true)}>
                          Mark lost
                        </Button>
                      </div>
                    )
                  ) : null}
                </>
              }
            />
          ) : (
            <PipelineDetailPlaceholder message="Select a lead to update status, convert, or mark lost." />
          )
        }
      />

    </>
  );
}
