import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
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
} from "@edunudg/ui";
import { ManualFranchiseInquiryCard } from "@/features/shared/manualLeads/ManualFranchiseInquiryCard";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { approveFranchiseInquiry, rejectFranchiseInquiry } from "@/lib/franchiseInquiriesApi";
import { useBrandScope } from "@/features/brand/hooks/useBrandScope";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { formatRelativeWhen, initialsFromName } from "@/lib/welcomeMessage";
import {
  FranchiseInquiryDetailCard,
  inquiryListTitle,
  type FranchiseInquiry,
} from "./FranchiseInquiryDetailCard";

type InquiryFilter = "all" | "pending" | "decided";

const FILTER_OPTIONS: { value: InquiryFilter; label: string }[] = [
  { value: "pending", label: "Pending review" },
  { value: "decided", label: "Decided" },
  { value: "all", label: "All" },
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
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
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
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
      closeDetail();
    },
    onError: capture,
  });

  if (missingBrand) return <p className="ed-empty">Brand context not found.</p>;

  const all = inquiries.data ?? [];
  const counts = useMemo(
    () => ({
      pending: all.filter(isPending).length,
      decided: all.filter((row) => !isPending(row)).length,
      all: all.length,
    }),
    [all]
  );

  const filtered = all.filter((row) => {
    if (filter === "pending") return isPending(row);
    if (filter === "decided") return !isPending(row);
    return true;
  });

  const filterTabs = FILTER_OPTIONS.map((option) => ({
    ...option,
    count: counts[option.value],
  }));

  const now = Date.now();

  return (
    <>
      <PageToolbar
        title="Franchise Applications"
        subtitle="Review franchise partner applications before approving or rejecting."
      />
      <MutationError message={error} />

      <PageGridFull>
        {brandId && <ManualFranchiseInquiryCard brandId={brandId} />}
      </PageGridFull>

      <KpiGrid>
        <KpiCard
          label="Pending review"
          value={counts.pending}
          active={filter === "pending"}
          onClick={() => setFilter("pending")}
        />
        <KpiCard
          label="Decided"
          value={counts.decided}
          active={filter === "decided"}
          onClick={() => setFilter("decided")}
        />
        <KpiCard label="All applications" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
      </KpiGrid>

      <PipelineMasterDetail
        list={
          <Card title="Applications">
            <FilterTabs options={filterTabs} value={filter} onChange={setFilter} aria-label="Application filter" />
            <DataList
              variant="pipeline"
              items={filtered}
              empty={
                <PipelineEmptyState
                  message="No franchise applications in this view."
                  actionLabel={filter !== "pending" ? "Show pending review" : undefined}
                  onAction={filter !== "pending" ? () => setFilter("pending") : undefined}
                />
              }
              render={(row) => {
                const pending = isPending(row);
                const isSelected = row.id === selectedId;
                const title = inquiryListTitle(row);
                return (
                  <PipelineListItem
                    title={title}
                    meta={`${row.full_name} · ${row.email}`}
                    lines={
                      row.city
                        ? [`${row.city}${row.pincode ? ` · ${row.pincode}` : ""}`]
                        : undefined
                    }
                    initials={initialsFromName(title)}
                    when={formatRelativeWhen(row.created_at, now)}
                    selected={isSelected}
                    onSelect={() => selectInquiry(row.id)}
                    badges={
                      <>
                        <Badge tone={pending ? "warning" : row.converted_center_id ? "success" : "default"}>
                          {row.status}
                        </Badge>
                        {!pending && row.converted_center_id && (
                          <Badge tone="success">Center provisioned</Badge>
                        )}
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
          ) : (
            <PipelineDetailPlaceholder message="Select a franchise application to review details and take action." />
          )
        }
      />
    </>
  );
}
