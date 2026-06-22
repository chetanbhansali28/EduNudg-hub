import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationError, PipelineListItem } from "@edunudg/ui";
import {
  approvePlatformBrandSignup,
  listPendingPlatformSignups,
  rejectPlatformBrandSignup,
} from "@/lib/platformBrandSignupApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { formatRelativeWhen, initialsFromName } from "@/lib/welcomeMessage";
import { PlatformSignupDetailCard, signupListTitle } from "./PlatformSignupDetailCard";

export function BrandsSignupReviewSection() {
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
  const now = Date.now();

  const resetActionState = () => {
    setRejectMode(false);
    setRejectReason("");
  };

  const closeDetail = () => {
    setSelectedId(null);
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
      void qc.invalidateQueries({ queryKey: ["platform-brands-home"] });
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
      void qc.invalidateQueries({ queryKey: ["platform-brands-home"] });
      void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
      closeDetail();
    },
    onError: capture,
  });

  const queue = useMemo(
    () =>
      all.map((row) => {
        const title = signupListTitle(row);
        return (
          <PipelineListItem
            key={row.id}
            title={title}
            meta={`${row.admin_full_name} · ${row.email}`}
            lines={[row.city].filter(Boolean)}
            initials={initialsFromName(title)}
            when={formatRelativeWhen(row.created_at, now)}
            selected={row.id === selectedId}
            onSelect={() => {
              setSelectedId(row.id);
              resetActionState();
            }}
          />
        );
      }),
    [all, now, selectedId]
  );

  if (all.length === 0) {
    return null;
  }

  return (
    <div className="ed-brands-signup-review">
      <MutationError message={error} />
      <div className="ed-brands-signup-review__queue">{queue}</div>
      {selected ? (
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
      ) : null}
    </div>
  );
}
