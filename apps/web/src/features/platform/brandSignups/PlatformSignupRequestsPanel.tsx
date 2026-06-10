import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Card,
  DataList,
  KpiCard,
  KpiGrid,
  MutationError,
  PipelineDetailPlaceholder,
  PipelineEmptyState,
  PipelineListItem,
  PipelineMasterDetail,
} from "@edunudg/ui";
import {
  approvePlatformBrandSignup,
  listPendingPlatformSignups,
  rejectPlatformBrandSignup,
} from "@/lib/platformBrandSignupApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { formatRelativeWhen, initialsFromName } from "@/lib/welcomeMessage";
import { PlatformSignupDetailCard, signupListTitle } from "./PlatformSignupDetailCard";

export function PlatformSignupRequestsPanel() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const signups = useQuery({
    queryKey: ["platform-brand-signups"],
    queryFn: listPendingPlatformSignups,
  });

  const all = signups.data ?? [];
  const selected = all.find((row) => row.id === selectedId) ?? null;

  const counts = useMemo(() => ({ pending: all.length }), [all.length]);

  const resetActionState = () => {
    setRejectMode(false);
    setRejectReason("");
  };

  const closeDetail = () => {
    setSelectedId(null);
    resetActionState();
  };

  const selectSignup = (id: string) => {
    setSelectedId(id);
    resetActionState();
  };

  const approve = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: err } = await approvePlatformBrandSignup(id);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-brand-signups"] });
      void qc.invalidateQueries({ queryKey: ["brands"] });
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
      closeDetail();
    },
    onError: capture,
  });

  const reject = useMutation({
    mutationFn: async () => {
      if (!selectedId) return;
      clear();
      const { error: err } = await rejectPlatformBrandSignup(selectedId, rejectReason);
      if (err) throw new Error(err);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-brand-signups"] });
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
      closeDetail();
    },
    onError: capture,
  });

  const now = Date.now();

  return (
    <>
      <KpiGrid>
        <KpiCard label="Pending review" value={counts.pending} active />
      </KpiGrid>

      <PipelineMasterDetail
        list={
          <Card title="Signup requests">
            <MutationError message={error} />
            <p className="ed-text-sm ed-muted ed-pipeline-card-intro">
              {counts.pending} pending brand signup{counts.pending === 1 ? "" : "s"} awaiting review.
            </p>
            <DataList
              variant="pipeline"
              items={all}
              empty={
                <PipelineEmptyState message="No pending brand signups." />
              }
              render={(row) => {
                const isSelected = row.id === selectedId;
                const title = signupListTitle(row);
                return (
                  <PipelineListItem
                    title={title}
                    meta={`${row.admin_full_name} · ${row.email}`}
                    lines={[row.city].filter(Boolean)}
                    initials={initialsFromName(title)}
                    when={formatRelativeWhen(row.created_at, now)}
                    selected={isSelected}
                    onSelect={() => selectSignup(row.id)}
                    badges={<Badge tone="warning">{row.status}</Badge>}
                  />
                );
              }}
            />
          </Card>
        }
        detail={
          selected ? (
            <PlatformSignupDetailCard
              signup={selected}
              onClose={closeDetail}
              onApprove={() => approve.mutate(selected.id)}
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
            <PipelineDetailPlaceholder message="Select a brand signup to review details and approve or reject." />
          )
        }
      />
    </>
  );
}
