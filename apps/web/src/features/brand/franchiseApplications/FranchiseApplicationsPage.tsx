import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, DataList, ListRow, MutationError, PageGridFull, PageTitle, Select } from "@edunudg/ui";
import { ManualFranchiseInquiryCard } from "@/features/shared/manualLeads/ManualFranchiseInquiryCard";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { approveFranchiseInquiry, rejectFranchiseInquiry } from "@/lib/franchiseInquiriesApi";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import {
  FranchiseInquiryDetailCard,
  inquiryListTitle,
  type FranchiseInquiry,
} from "./FranchiseInquiryDetailCard";

type InquiryFilter = "all" | "pending" | "decided";

const FILTER_OPTIONS: { value: InquiryFilter; label: string }[] = [
  { value: "all", label: "All applications" },
  { value: "pending", label: "Pending review" },
  { value: "decided", label: "Approved / rejected / converted" },
];

const INQUIRY_SELECT =
  "id, full_name, email, phone_e164, city, state, pincode, address_line, proposed_franchise_name, prior_experience, message, status, rejected_reason, converted_center_id, created_at, updated_at";

function isPending(row: FranchiseInquiry) {
  return row.status === "new" || row.status === "contacted" || row.status === "qualified";
}

export function FranchiseApplicationsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [filter, setFilter] = useState<InquiryFilter>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const inquiries = useQuery({
    queryKey: ["franchise-inquiries", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("franchise_inquiries")
        .select(INQUIRY_SELECT)
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as FranchiseInquiry[];
    },
  });

  const selected = (inquiries.data ?? []).find((row) => row.id === selectedId) ?? null;

  const resetActionState = () => {
    setRejectMode(false);
    setRejectReason("");
  };

  const closeDetail = () => {
    setSelectedId(null);
    resetActionState();
  };

  const selectInquiry = (id: string) => {
    setSelectedId(id);
    resetActionState();
  };

  const approve = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      clear();
      const { error: err } = await approveFranchiseInquiry(selectedId);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] });
      void qc.invalidateQueries({ queryKey: ["centers", brandId] });
      closeDetail();
    },
    onError: capture,
  });

  const reject = useMutation({
    mutationFn: async () => {
      if (!selectedId || !rejectReason.trim()) return;
      clear();
      const { error: err } = await rejectFranchiseInquiry(selectedId, rejectReason);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchise-inquiries", brandId] });
      closeDetail();
    },
    onError: capture,
  });

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const all = inquiries.data ?? [];
  const filtered = all.filter((row) => {
    if (filter === "pending") return isPending(row);
    if (filter === "decided") return !isPending(row);
    return true;
  });

  return (
    <>
      <PageTitle>Franchise Applications</PageTitle>
      <MutationError message={error} />

      <PageGridFull>
        {brandId && <ManualFranchiseInquiryCard brandId={brandId} />}
      </PageGridFull>

      <Card title="Applications">
        <p className="ed-text-sm ed-muted">Select a franchise name to open the full application before approving or rejecting.</p>
        <Select label="Show" value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
        <DataList
          items={filtered}
          empty="No franchise applications in this view."
          render={(row) => {
            const pending = isPending(row);
            const isSelected = row.id === selectedId;
            return (
              <ListRow>
                <div>
                  <button
                    type="button"
                    className={`ed-inquiry-list__link${isSelected ? " ed-inquiry-list__link--active" : ""}`}
                    onClick={() => selectInquiry(row.id)}
                  >
                    {inquiryListTitle(row)}
                  </button>
                  <div className="ed-text-sm ed-muted">{row.full_name} · {row.email}</div>
                  {row.city && (
                    <div className="ed-text-sm ed-muted">
                      {row.city}
                      {row.pincode ? ` · ${row.pincode}` : ""}
                    </div>
                  )}
                  <Badge>{row.status}</Badge>
                  {!pending && row.converted_center_id && (
                    <span className="ed-text-sm ed-muted"> · Center provisioned</span>
                  )}
                </div>
              </ListRow>
            );
          }}
        />
      </Card>

      {selected && (
        <FranchiseInquiryDetailCard
          inquiry={selected}
          pending={isPending(selected)}
          onClose={closeDetail}
          onApprove={() => approve.mutate()}
          onReject={() => {
            setRejectMode(true);
            setRejectReason("");
          }}
          rejectMode={rejectMode}
          rejectReason={rejectReason}
          onRejectReasonChange={setRejectReason}
          onConfirmReject={() => reject.mutate()}
          onCancelAction={resetActionState}
          approvePending={approve.isPending}
          rejectPending={reject.isPending}
        />
      )}
    </>
  );
}
