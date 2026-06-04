import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Card, DataList, ListRow, MutationError } from "@edunudg/ui";
import {
  approvePlatformBrandSignup,
  listPendingPlatformSignups,
  rejectPlatformBrandSignup,
} from "@/lib/platformBrandSignupApi";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
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

  const selected = (signups.data ?? []).find((row) => row.id === selectedId) ?? null;

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
      closeDetail();
    },
    onError: capture,
  });

  return (
    <>
      <Card title="Signup requests">
        <MutationError message={error} />
        <p className="ed-text-sm ed-muted">
          Select a brand name to open the full signup request before approving or rejecting.
        </p>
        <DataList
          items={signups.data ?? []}
          empty="No pending brand signups."
          render={(row) => {
            const isSelected = row.id === selectedId;
            return (
              <ListRow>
                <div>
                  <button
                    type="button"
                    className={`ed-inquiry-list__link${isSelected ? " ed-inquiry-list__link--active" : ""}`}
                    onClick={() => selectSignup(row.id)}
                  >
                    {signupListTitle(row)}
                  </button>
                  <div className="ed-text-sm ed-muted">
                    {row.admin_full_name} · {row.email} · {row.city}
                  </div>
                  <Badge>{row.status}</Badge>
                </div>
              </ListRow>
            );
          }}
        />
      </Card>

      {selected && (
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
      )}
    </>
  );
}
