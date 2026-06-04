import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  Input,
  ListRow,
  MutationError,
  PageGrid,
  PageGridFull,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { ConvertLeadDialog } from "@/features/center/convertStudent/ConvertLeadDialog";
import { ManualStudentLeadCard } from "@/features/shared/manualLeads/ManualStudentLeadCard";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
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

export function CenterLeadsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [lostReason, setLostReason] = useState("");
  const [lostTargetId, setLostTargetId] = useState<string | null>(null);
  const [convertTarget, setConvertTarget] = useState<LeadRow | null>(null);

  const leads = useQuery({
    queryKey: ["center-leads", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("leads")
        .select(
          "id, brand_id, center_id, full_name, parent_name, email, whatsapp_e164, child_name, child_dob, pincode, city, school_name, status, lead_source, lost_reason, assigned_at, created_at"
        )
        .eq("center_id", centerId!)
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as LeadRow[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      clear();
      await updateLeadStatus(id, status);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["center-leads", centerId] }),
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
      void qc.invalidateQueries({ queryKey: ["center-leads", centerId] });
      setConvertTarget(null);
    },
    onError: capture,
  });

  const markLost = useMutation({
    mutationFn: async () => {
      if (!lostTargetId || !lostReason.trim()) return;
      clear();
      await markLeadLost(lostTargetId, lostReason.trim());
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["center-leads", centerId] });
      setLostTargetId(null);
      setLostReason("");
    },
    onError: capture,
  });

  if (!centerId) return <p className="ed-empty">Center context not found.</p>;

  return (
    <>
      <PageTitle>Leads</PageTitle>
      <MutationError message={error} />
      {centerId && (
        <PageGridFull>
          <ManualStudentLeadCard scope="center" centerId={centerId} invalidateKey={["center-leads", centerId]} />
        </PageGridFull>
      )}

      <PageGrid cols={2}>
        <Card title="Assigned leads">
          <DataList
            items={leads.data ?? []}
            empty="No leads for this center."
            render={(l) => (
              <ListRow
                aside={
                  <div className="ed-form-section">
                    {l.status !== "converted" && l.status !== "lost" && (
                      <>
                        <Select
                          label="Status"
                          value={l.status}
                          onChange={(v) => updateStatus.mutate({ id: l.id, status: v })}
                          options={STATUS_OPTIONS}
                        />
                        <Button onClick={() => setConvertTarget(l)} disabled={convert.isPending}>
                          Convert to student
                        </Button>
                        <Button variant="ghost" onClick={() => setLostTargetId(l.id)}>
                          Mark lost
                        </Button>
                      </>
                    )}
                  </div>
                }
              >
                <div>
                  <strong>{l.parent_name ?? l.full_name}</strong>
                  <div className="ed-text-sm ed-muted">{l.whatsapp_e164}</div>
                  {l.child_name && <div className="ed-text-sm">Child: {l.child_name}</div>}
                  <Badge>{l.status}</Badge>
                </div>
              </ListRow>
            )}
          />
        </Card>
      </PageGrid>

      {convertTarget && (
        <ConvertLeadDialog
          lead={convertTarget}
          pending={convert.isPending}
          onCancel={() => setConvertTarget(null)}
          onConfirm={(overrides) => convert.mutate({ id: convertTarget.id, overrides })}
        />
      )}

      {lostTargetId && (
        <Card title="Mark lead lost">
          <Input label="Reason (required)" value={lostReason} onChange={setLostReason} />
          <Button onClick={() => markLost.mutate()} disabled={!lostReason.trim() || markLost.isPending}>
            Confirm lost
          </Button>
          <Button variant="ghost" onClick={() => setLostTargetId(null)}>
            Cancel
          </Button>
        </Card>
      )}
    </>
  );
}
