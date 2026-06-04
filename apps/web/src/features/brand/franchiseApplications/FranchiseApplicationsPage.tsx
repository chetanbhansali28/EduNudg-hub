import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, DataList, Input, ListRow, MutationError, PageGrid, PageGridFull, PageTitle } from "@edunudg/ui";
import { ManualFranchiseInquiryCard } from "@/features/shared/manualLeads/ManualFranchiseInquiryCard";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { approveFranchiseInquiry, rejectFranchiseInquiry } from "@/lib/franchiseInquiriesApi";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMutationError } from "@/features/platform/hooks/useMutationError";

interface Inquiry {
  id: string;
  full_name: string;
  email: string;
  city: string | null;
  proposed_franchise_name: string | null;
  pincode: string | null;
  status: string;
  converted_center_id: string | null;
  created_at: string;
}

export function FranchiseApplicationsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [centerSlug, setCenterSlug] = useState("");
  const [centerName, setCenterName] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const inquiries = useQuery({
    queryKey: ["franchise-inquiries", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("franchise_inquiries")
        .select(
          "id, full_name, email, city, proposed_franchise_name, pincode, status, converted_center_id, created_at"
        )
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as Inquiry[];
    },
  });

  const approve = useMutation({
    mutationFn: async () => {
      if (!approvingId) return;
      clear();
      const { error: err } = await approveFranchiseInquiry(approvingId, {
        centerSlug: centerSlug || undefined,
        centerName: centerName || undefined,
      });
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] });
      void qc.invalidateQueries({ queryKey: ["centers", brandId] });
      setApprovingId(null);
      setCenterSlug("");
      setCenterName("");
    },
    onError: capture,
  });

  const reject = useMutation({
    mutationFn: async () => {
      if (!rejectingId || !rejectReason.trim()) return;
      clear();
      const { error: err } = await rejectFranchiseInquiry(rejectingId, rejectReason);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] });
      setRejectingId(null);
      setRejectReason("");
    },
    onError: capture,
  });

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const pending = (inquiries.data ?? []).filter((r) => r.status === "new" || r.status === "contacted" || r.status === "qualified");

  return (
    <>
      <PageTitle>Franchise Applications</PageTitle>
      <MutationError message={error} />

      <PageGridFull>
        {brandId && <ManualFranchiseInquiryCard brandId={brandId} />}
      </PageGridFull>

      <PageGrid cols={2}>
      <Card title={`Pending (${pending.length})`}>
        <DataList
          items={pending}
          empty="No pending franchise applications."
          render={(row) => (
            <ListRow
              aside={
                <div className="ed-form-section">
                  <Button variant="ghost" onClick={() => setApprovingId(row.id)}>
                    Approve
                  </Button>
                  <Button variant="ghost" onClick={() => setRejectingId(row.id)}>
                    Reject
                  </Button>
                </div>
              }
            >
              <InquirySummary row={row} />
            </ListRow>
          )}
        />
      </Card>

      <Card title="All applications">
        <DataList
          items={inquiries.data ?? []}
          empty="No franchise applications yet."
          render={(row) => (
            <ListRow>
              <InquirySummary row={row} />
            </ListRow>
          )}
        />
      </Card>
      </PageGrid>

      {approvingId && (
        <Card title="Approve — provision center">
          <Input label="Center slug (optional)" value={centerSlug} onChange={setCenterSlug} placeholder="koramangala" />
          <Input label="Display name (optional)" value={centerName} onChange={setCenterName} />
          <Button onClick={() => approve.mutate()} disabled={approve.isPending}>
            Create center & domain
          </Button>
          <Button variant="ghost" onClick={() => setApprovingId(null)}>
            Cancel
          </Button>
        </Card>
      )}

      {rejectingId && (
        <Card title="Reject application">
          <Input label="Reason" value={rejectReason} onChange={setRejectReason} />
          <Button onClick={() => reject.mutate()} disabled={!rejectReason.trim() || reject.isPending}>
            Confirm reject
          </Button>
          <Button variant="ghost" onClick={() => setRejectingId(null)}>
            Cancel
          </Button>
        </Card>
      )}
    </>
  );
}

function InquirySummary({ row }: { row: Inquiry }) {
  return (
    <div>
      <strong>{row.full_name}</strong>
      <div className="ed-text-sm ed-muted">{row.email}</div>
      {row.proposed_franchise_name && <div className="ed-text-sm">Franchise: {row.proposed_franchise_name}</div>}
      {row.city && (
        <div className="ed-text-sm">
          {row.city} {row.pincode}
        </div>
      )}
      <Badge>{row.status}</Badge>
      {row.converted_center_id && <span className="ed-text-sm ed-muted"> · Center provisioned</span>}
    </div>
  );
}
